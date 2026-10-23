import Stripe from 'stripe';
import type { Order, OrderStore } from './types.ts';
import { getEnv } from './env.ts';
import { calculatePrice } from '../shared/pricing.ts';
import { validateCheckoutInput, generateOrderId } from './validation.ts';
import { getDownloadLink } from './downloads.ts';
import { sendTelegramAlert, sendOrderApprovedEmail } from './notifications.ts';
import { sendMetaCapiPurchase } from './meta-capi.ts';
import { config } from '../src/config.ts';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = getEnv('STRIPE_SECRET_KEY');
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as any,
    });
  }
  return stripeClient;
}

export async function processStripeCheckout(
  store: OrderStore,
  siteUrl: string,
  body: any,
  metaInfo?: { clientIp?: string; userAgent?: string; fbp?: string; fbc?: string }
): Promise<{ status: number; body: any }> {
  const validation = validateCheckoutInput(body);
  if (!validation.ok) {
    return { status: 400, body: { error: validation.error } };
  }

  const { pack, name, email, phone } = validation.value;

  // 1. Refuse if download link is missing
  const downloadLink = getDownloadLink(pack);
  if (!downloadLink) {
    console.error(`[Checkout Refused] Download link missing for pack ${pack}`);
    return {
      status: 500,
      body: { error: 'Product file is currently unavailable. Please contact support.' },
    };
  }

  // 2. Refuse if Stripe secret key is missing
  const secretKey = getEnv('STRIPE_SECRET_KEY');
  if (!secretKey) {
    console.error('[Checkout Refused] STRIPE_SECRET_KEY is not configured.');
    return {
      status: 500,
      body: { error: 'Payment gateway is currently unconfigured. Please contact support.' },
    };
  }

  const pricing = calculatePrice(pack);
  const amount = pricing.amountCents;
  const orderId = generateOrderId();
  const now = new Date().toISOString();

  const fbp = metaInfo?.fbp || (typeof body?.fbp === 'string' ? body.fbp : undefined);
  const fbc = metaInfo?.fbc || (typeof body?.fbc === 'string' ? body.fbc : undefined);
  const clientIp = metaInfo?.clientIp || (typeof body?.clientIp === 'string' ? body.clientIp : undefined);
  const userAgent = metaInfo?.userAgent || (typeof body?.userAgent === 'string' ? body.userAgent : undefined);

  // 3. Save order FIRST before creating Stripe session
  const newOrder: Order = {
    orderId,
    pack,
    amount,
    name,
    email,
    phone,
    method: 'stripe',
    status: 'pending',
    createdAt: now,
    fbp,
    fbc,
    clientIp,
    userAgent,
  };

  await store.create(newOrder);

  // 4. Create Stripe Checkout Session
  try {
    const stripe = getStripeClient();
    const productName =
      pack === '100'
        ? 'Science Made Visual — 100 Science Sheets'
        : 'Science Made Visual — 200 Science Sheets';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'myr',
      line_items: [
        {
          price_data: {
            currency: 'myr',
            unit_amount: amount,
            product_data: {
              name: productName,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        orderId,
        pack,
      },
      client_reference_id: orderId,
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },
      // Do not set payment_method_types so methods enabled in Stripe dashboard appear automatically
      success_url: `${siteUrl}/thank-you?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/#pricing`,
    });

    if (!session.url) {
      throw new Error('No checkout URL returned from Stripe');
    }

    // Save stripeSessionId on the order
    await store.update(orderId, {
      stripeSessionId: session.id,
    });

    return {
      status: 200,
      body: { url: session.url },
    };
  } catch (err: any) {
    console.error('[Stripe Checkout Session Error]', err);
    await store.update(orderId, { status: 'failed' });
    return {
      status: 500,
      body: { error: 'Failed to create payment session. Please try again.' },
    };
  }
}

/**
 * Common helper to mark a Stripe order as paid with all strict security rules.
 */
export async function applyStripePaid(
  store: OrderStore,
  order: Order,
  session: Stripe.Checkout.Session,
  siteUrl: string
): Promise<boolean> {
  // Security Checks:
  // 1. Order method must be stripe (never mark manual orders paid via Stripe)
  if (order.method !== 'stripe') {
    console.error(`[Stripe Validation Error] Order ${order.orderId} is not a Stripe order.`);
    return false;
  }

  // 2. Session ID must equal saved stripeSessionId
  if (session.id !== order.stripeSessionId) {
    console.error(
      `[Stripe Validation Error] Session ID mismatch for order ${order.orderId}. Expected ${order.stripeSessionId}, got ${session.id}`
    );
    return false;
  }

  // 3. Amount and currency must match exactly
  if (session.amount_total !== order.amount) {
    console.error(
      `[Stripe Validation Error] Amount mismatch for order ${order.orderId}. Expected ${order.amount}, got ${session.amount_total}`
    );
    return false;
  }

  if (session.currency?.toLowerCase() !== 'myr') {
    console.error(
      `[Stripe Validation Error] Currency mismatch for order ${order.orderId}. Expected myr, got ${session.currency}`
    );
    return false;
  }

  // Idempotency: if already paid, do nothing
  if (order.status === 'paid') {
    return true;
  }

  const now = new Date().toISOString();
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent)?.id;

  await store.update(order.orderId, {
    status: 'paid',
    paidAt: now,
    stripePaymentIntentId: paymentIntentId,
  });

  console.log(`[Stripe Paid Confirmed] Order ${order.orderId} marked as PAID.`);

  // Send download email only once
  if (!order.emailSentAt) {
    const downloadUrl = getDownloadLink(order.pack) || '';
    const orderPageUrl = `${siteUrl}/thank-you?order_id=${order.orderId}&session_id=${session.id}`;

    await sendOrderApprovedEmail({
      customerEmail: order.email,
      customerName: order.name,
      orderId: order.orderId,
      pack: order.pack,
      downloadUrl,
      orderPageUrl,
      replyTo: config.business?.email || 'support.mathceria@gmail.com',
    });

    await store.update(order.orderId, { emailSentAt: now });
  }

  // Send Telegram alert if configured
  const amountRm = (order.amount / 100).toFixed(2);
  await sendTelegramAlert(
    `💳 Stripe sale: <b>${order.orderId}</b> · ${order.pack} sheets · RM${amountRm}`
  );

  // Send server-side Meta Conversions API purchase event
  order.status = 'paid';
  order.paidAt = now;
  sendMetaCapiPurchase(store, order, siteUrl).catch((err) =>
    console.warn('[Meta CAPI] Error in applyStripePaid:', err)
  );

  return true;
}

export async function processStripeWebhook(
  store: OrderStore,
  rawBody: string,
  signatureHeader: string | null | undefined,
  siteUrl: string
): Promise<{ status: number; body: any }> {
  const webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('[Stripe Webhook Error] STRIPE_WEBHOOK_SECRET is not configured.');
    return { status: 500, body: { error: 'Webhook secret not configured' } };
  }

  if (!signatureHeader) {
    console.warn('[Stripe Webhook Warning] Missing stripe-signature header.');
    return { status: 400, body: { error: 'Missing stripe-signature header' } };
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook Signature Verification Failed]:`, err.message);
    return { status: 400, body: { error: `Webhook signature verification failed: ${err.message}` } };
  }

  console.log(`[Stripe Webhook] Received verified event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId || session.client_reference_id;
        if (!orderId) {
          console.warn('[Stripe Webhook] No orderId found in session metadata.');
          break;
        }

        const order = await store.get(orderId);
        if (!order) {
          console.warn(`[Stripe Webhook] Order ${orderId} not found in store.`);
          break;
        }

        if (session.payment_status === 'paid') {
          await applyStripePaid(store, order, session, siteUrl);
        } else {
          console.log(`[Stripe Webhook] Session ${session.id} payment_status is ${session.payment_status}, leaving order pending.`);
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId || session.client_reference_id;
        if (!orderId) break;

        const order = await store.get(orderId);
        if (order) {
          await applyStripePaid(store, order, session, siteUrl);
        }
        break;
      }

      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId || session.client_reference_id;
        if (orderId) {
          const order = await store.get(orderId);
          if (order && order.status !== 'paid') {
            await store.update(orderId, { status: 'failed' });
            console.log(`[Stripe Webhook] Order ${orderId} marked as failed due to ${event.type}`);
          }
        }
        break;
      }

      default:
        // Ignore other events
        break;
    }

    return { status: 200, body: { received: true } };
  } catch (err: any) {
    console.error('[Stripe Webhook Handler Exception]', err);
    return { status: 500, body: { error: 'Webhook processing error' } };
  }
}

export async function processStripeOrderStatus(
  store: OrderStore,
  orderId: string,
  sessionId: string,
  siteUrl: string
): Promise<{ status: number; body: any }> {
  if (!orderId || !sessionId) {
    return { status: 400, body: { error: 'Missing order_id or session_id' } };
  }

  const order = await store.get(orderId);
  if (!order) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  // The session_id must equal the saved stripeSessionId (otherwise 404)
  if (!order.stripeSessionId || order.stripeSessionId !== sessionId) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  // If order is still pending, retrieve session from Stripe and verify
  if (order.status === 'pending') {
    try {
      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        await applyStripePaid(store, order, session, siteUrl);
        // Refresh local order reference
        const updated = await store.get(orderId);
        if (updated) {
          return {
            status: 200,
            body: {
              status: updated.status,
              orderId: updated.orderId,
              pack: updated.pack,
              amount: updated.amount,
              paidAt: updated.paidAt,
              downloadLink: getDownloadLink(updated.pack),
            },
          };
        }
      } else if (session.status === 'expired') {
        await store.update(orderId, { status: 'failed' });
        return {
          status: 200,
          body: {
            status: 'failed',
            orderId: order.orderId,
            pack: order.pack,
          },
        };
      }
    } catch (err) {
      console.error('[Order Status Check Stripe Retrieve Failed]', err);
    }
  }

  return {
    status: 200,
    body: {
      status: order.status,
      orderId: order.orderId,
      pack: order.pack,
      amount: order.amount,
      paidAt: order.paidAt,
      downloadLink: order.status === 'paid' ? getDownloadLink(order.pack) : undefined,
    },
  };
}
