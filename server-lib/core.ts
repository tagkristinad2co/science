import type { Order, OrderStore } from './types.ts';
import { calculatePrice } from '../shared/pricing.ts';
import { validateCheckoutInput, generateOrderId, maskEmail } from './validation.ts';
import {
  getPaymentChannel,
  getDownloadLink,
  createToyyibpayBill,
  verifyCallbackHash,
  verifyBillTransaction,
} from './toyyibpay.ts';
import { getEnv } from './env.ts';

export async function processCheckout(
  store: OrderStore,
  siteUrl: string,
  body: any
): Promise<{ status: number; body: any }> {
  const validation = validateCheckoutInput(body);
  if (!validation.ok) {
    return { status: 400, body: { error: validation.error } };
  }

  const { pack, name, email, phone } = validation.value;

  const downloadLink = getDownloadLink(pack);
  if (!downloadLink) {
    console.error(`[Checkout Blocked] Download link not set for pack ${pack}.`);
    return {
      status: 500,
      body: { error: 'Download link is not configured for this pack. Please contact support.' },
    };
  }

  const pricing = calculatePrice(pack);
  const orderId = generateOrderId();

  const newOrder: Order = {
    orderId,
    pack,
    amount: pricing.amountCents,
    name,
    email,
    phone,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    await store.create(newOrder);
  } catch (dbErr) {
    console.error('[OrderStore Create Error]', dbErr);
    return { status: 500, body: { error: "We couldn't save your order. Please try again." } };
  }

  try {
    const bill = await createToyyibpayBill({
      orderId,
      pack,
      amountCents: pricing.amountCents,
      name,
      email,
      phone,
      siteUrl,
      downloadLink,
    });

    await store.update(orderId, { billCode: bill.billCode });

    console.log(`[Order Initiated] Order ${orderId} linked to bill ${bill.billCode}`);
    return {
      status: 200,
      body: { url: bill.paymentUrl, orderId, billCode: bill.billCode },
    };
  } catch (err: any) {
    console.error('[Checkout Bill Creation Error]', err);
    return { status: 500, body: { error: "We couldn't start the payment. Please try again." } };
  }
}

export async function processCallback(
  store: OrderStore,
  params: Record<string, string>
): Promise<{ status: number; text: string }> {
  console.log('[toyyibPay Callback] Received notification payload:', params);

  const orderId = (params.order_id || '').trim();
  const callbackBillCode = (params.billcode || '').trim();
  const txStatus = (params.status || '').trim();
  const txRefno = (params.refno || '').trim();
  const receivedHash = (params.hash || '').trim();

  const secretKey = getEnv('TOYYIBPAY_SECRET_KEY');

  if (!secretKey || !receivedHash) {
    console.error('[toyyibPay Callback Ignored] Missing secret key or hash.');
    return { status: 200, text: 'OK' };
  }

  const hashMatches = verifyCallbackHash({
    secretKey,
    status: txStatus,
    orderId,
    refno: txRefno,
    hash: receivedHash,
  });

  if (!hashMatches) {
    console.error(`[toyyibPay Callback Ignored] Hash mismatch for order ${orderId}.`);
    return { status: 200, text: 'OK' };
  }

  const order = await store.get(orderId);
  if (!order) {
    console.warn(`[toyyibPay Callback Ignored] Order ${orderId} not found in store.`);
    return { status: 200, text: 'OK' };
  }

  if (!order.billCode || order.billCode !== callbackBillCode) {
    console.error(
      `[toyyibPay Callback Ignored] BillCode mismatch for order ${orderId}. Expected ${order.billCode}, got ${callbackBillCode}`
    );
    return { status: 200, text: 'OK' };
  }

  if (order.status === 'paid') {
    console.log(`[toyyibPay Callback] Order ${orderId} is already marked as paid.`);
    return { status: 200, text: 'OK' };
  }

  const verification = await verifyBillTransaction(order.billCode, order.amount);

  if (verification.paid) {
    await store.update(orderId, {
      status: 'paid',
      refno: txRefno || verification.refno || 'PAID_TX',
      paidAt: new Date().toISOString(),
    });
    console.log(`[toyyibPay Callback] Order ${orderId} verified and marked as PAID.`);
  } else if (txStatus === '3') {
    await store.update(orderId, { status: 'failed' });
    console.log(`[toyyibPay Callback] Order ${orderId} marked as FAILED.`);
  } else {
    console.log(
      `[toyyibPay Callback] Order ${orderId} transaction could not be verified yet. Status remains pending.`
    );
  }

  return { status: 200, text: 'OK' };
}

export async function processOrderStatus(
  store: OrderStore,
  orderId: string,
  billCodeFromQuery?: string
): Promise<{ status: number; body: any }> {
  if (!orderId) {
    return { status: 400, body: { error: 'Missing order_id' } };
  }

  const order = await store.get(orderId);
  if (!order) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  if (billCodeFromQuery && order.billCode && order.billCode !== billCodeFromQuery) {
    console.warn(
      `[Order Status Forbidden] Query billcode ${billCodeFromQuery} !== saved ${order.billCode}`
    );
    return { status: 403, body: { error: 'Invalid verification for this order' } };
  }

  if (order.status === 'pending' && order.billCode) {
    const verification = await verifyBillTransaction(order.billCode, order.amount);
    if (verification.paid) {
      await store.update(orderId, {
        status: 'paid',
        refno: verification.refno || 'PAID_TX',
        paidAt: new Date().toISOString(),
      });
      order.status = 'paid';
    }
  }

  if (order.status === 'paid') {
    const downloadUrl = getDownloadLink(order.pack);
    return {
      status: 200,
      body: {
        status: 'paid',
        orderId: order.orderId,
        pack: order.pack,
        downloadUrl,
        email: maskEmail(order.email),
      },
    };
  }

  if (order.status === 'failed') {
    return { status: 200, body: { status: 'failed', orderId: order.orderId } };
  }

  return { status: 200, body: { status: 'pending', orderId: order.orderId } };
}

export function getPaymentMethodsInfo() {
  const channel = getPaymentChannel();
  return {
    channel,
    allowsCards: channel === '2',
    label: channel === '2' ? 'FPX online banking & cards' : 'FPX online banking',
  };
}
