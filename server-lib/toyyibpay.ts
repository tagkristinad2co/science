import crypto from 'crypto';
import { getEnv } from './env.ts';

export function getToyyibpayBaseUrl(): string {
  const url = getEnv('TOYYIBPAY_BASE_URL');
  if (url) return url.replace(/\/+$/, '');
  return 'https://dev.toyyibpay.com';
}

export function getPaymentChannel(): string {
  return getEnv('TOYYIBPAY_PAYMENT_CHANNEL') || '0';
}

export function getDownloadLink(pack: '100' | '200'): string | null {
  const link =
    pack === '200'
      ? getEnv('DOWNLOAD_LINK_200')
      : getEnv('DOWNLOAD_LINK_100');

  if (!link) {
    console.error(`[Download Link Missing] DOWNLOAD_LINK_${pack} is not configured.`);
    return null;
  }
  return link;
}

export async function createToyyibpayBill(params: {
  orderId: string;
  pack: '100' | '200';
  amountCents: number;
  name: string;
  email: string;
  phone: string;
  siteUrl: string;
  downloadLink: string;
}): Promise<{ billCode: string; paymentUrl: string }> {
  const secretKey = getEnv('TOYYIBPAY_SECRET_KEY');
  const categoryCode = getEnv('TOYYIBPAY_CATEGORY_CODE');
  const baseUrl = getToyyibpayBaseUrl();
  const paymentChannel = getPaymentChannel();

  if (!secretKey || !categoryCode) {
    console.error('[toyyibPay] toyyibPay secrets missing: TOYYIBPAY_SECRET_KEY or TOYYIBPAY_CATEGORY_CODE');
    throw new Error('toyyibPay secrets missing');
  }

  const billDescription =
    params.pack === '200'
      ? '200 illustrated science sheets (PDF)'
      : '100 illustrated science sheets (PDF)';

  const formParams = new URLSearchParams({
    userSecretKey: secretKey,
    categoryCode: categoryCode,
    billName: 'Science Made Visual',
    billDescription: billDescription.substring(0, 100),
    billPriceSetting: '1',
    billPayorInfo: '1',
    billAmount: params.amountCents.toString(),
    billReturnUrl: `${params.siteUrl}/thank-you`,
    billCallbackUrl: `${params.siteUrl}/api/toyyibpay/callback`,
    billExternalReferenceNo: params.orderId,
    billTo: params.name,
    billEmail: params.email,
    billPhone: params.phone,
    billPaymentChannel: paymentChannel,
    billChargeToCustomer: '',
    billExpiryDays: '1',
    billContentEmail: `Thank you for your purchase! Download your science sheets here: ${params.downloadLink}. Please save this link.`,
  });

  const endpoint = `${baseUrl}/index.php/api/createBill`;
  console.log(`[toyyibPay] Calling createBill at: ${endpoint} for order: ${params.orderId}`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formParams.toString(),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[toyyibPay] createBill HTTP error ${res.status}:`, errorBody);
    throw new Error(`toyyibPay HTTP error ${res.status}`);
  }

  const responseText = await res.text();
  console.log('[toyyibPay] createBill response:', responseText);

  let billCode = '';
  try {
    const parsed = JSON.parse(responseText);
    if (Array.isArray(parsed) && parsed.length > 0) {
      billCode = parsed[0].BillCode || parsed[0].billCode || '';
    } else if (parsed && typeof parsed === 'object') {
      billCode = parsed.BillCode || parsed.billCode || '';
    }
  } catch (parseErr) {
    console.error('[toyyibPay] JSON parse error for createBill:', parseErr);
  }

  if (!billCode) {
    throw new Error(`Could not obtain BillCode from toyyibPay: ${responseText}`);
  }

  return {
    billCode,
    paymentUrl: `${baseUrl}/${billCode}`,
  };
}

export function verifyCallbackHash(params: {
  secretKey: string;
  status: string;
  orderId: string;
  refno: string;
  hash: string;
}): boolean {
  const expectedData = `${params.secretKey}${params.status}${params.orderId}${params.refno}ok`;
  const calculatedHash = crypto.createHash('md5').update(expectedData).digest('hex');
  return calculatedHash.toLowerCase() === params.hash.toLowerCase();
}

export async function verifyBillTransaction(
  billCode: string,
  expectedAmountCents: number
): Promise<{ paid: boolean; refno?: string }> {
  const secretKey = getEnv('TOYYIBPAY_SECRET_KEY');
  const baseUrl = getToyyibpayBaseUrl();

  if (!secretKey) {
    console.error('[toyyibPay] verifyBillTransaction: Missing TOYYIBPAY_SECRET_KEY');
    return { paid: false };
  }

  try {
    const formParams = new URLSearchParams({
      billCode,
      userSecretKey: secretKey,
    });

    const endpoint = `${baseUrl}/index.php/api/getBillTransactions`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formParams.toString(),
    });

    if (!res.ok) {
      console.warn(`[toyyibPay] getBillTransactions error status: ${res.status}`);
      return { paid: false };
    }

    const data = await res.json();
    console.log(`[toyyibPay] getBillTransactions for bill ${billCode}:`, data);

    if (Array.isArray(data) && data.length > 0) {
      for (const tx of data) {
        const isSuccess = tx.billpaymentStatus === '1' || tx.billpaymentStatus === 1;
        const txAmountCents = Math.round(parseFloat(tx.billpaymentAmount || '0') * 100);

        if (isSuccess && txAmountCents === expectedAmountCents) {
          const refno =
            tx.billpaymentInvoiceNo ||
            tx.billPaymentInvoiceNo ||
            tx.billpaymentSettlementNo ||
            tx.billExternalReferenceNo ||
            '';
          return { paid: true, refno };
        }
      }
    }
  } catch (err) {
    console.error('[toyyibPay] Exception in verifyBillTransaction:', err);
  }

  return { paid: false };
}
