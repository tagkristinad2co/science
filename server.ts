import express from 'express';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { calculatePrice } from './shared/pricing.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 1. Firebase Admin SDK Initialisation
// ==========================================
interface FirebaseAppletConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId: string;
}

function loadFirebaseConfig(): FirebaseAppletConfig {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.projectId) {
        return {
          projectId: parsed.projectId,
          apiKey: parsed.apiKey || '',
          firestoreDatabaseId: parsed.firestoreDatabaseId || '(default)',
        };
      }
    }
  } catch (err) {
    console.error('[Firebase Admin] Error loading firebase-applet-config.json:', err);
  }
  return {
    projectId: process.env.GCLOUD_PROJECT || 'science-made-visual',
    apiKey: '',
    firestoreDatabaseId: '(default)',
  };
}

const fbConfig = loadFirebaseConfig();

if (!getApps().length) {
  try {
    initializeApp({
      projectId: fbConfig.projectId,
    });
    console.log(`[Firebase Admin] Initialized for project: ${fbConfig.projectId}`);
  } catch (initErr) {
    console.error('[Firebase Admin] Failed to initialize admin app:', initErr);
  }
}

const firestoreDb = getFirestore(getApp(), fbConfig.firestoreDatabaseId);

export interface Order {
  orderId: string;
  pack: '100' | '200';
  amount: number; // in cents
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'paid' | 'failed';
  billCode?: string;
  refno?: string;
  createdAt: string;
  paidAt?: string;
}

async function createFirestoreOrder(order: Order): Promise<void> {
  const docRef = firestoreDb.collection('orders').doc(order.orderId);
  await docRef.set({
    ...order,
    billCode: order.billCode || null,
    refno: order.refno || null,
    paidAt: order.paidAt || null,
  });
  console.log(`[Firestore] Order ${order.orderId} created successfully.`);
}

async function getFirestoreOrder(orderId: string): Promise<Order | null> {
  try {
    const docRef = firestoreDb.collection('orders').doc(orderId);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    return snap.data() as Order;
  } catch (err: any) {
    console.warn(`[Firestore] Could not load order ${orderId}:`, err.message);
    return null;
  }
}

async function updateOrderBillCode(orderId: string, billCode: string): Promise<void> {
  const docRef = firestoreDb.collection('orders').doc(orderId);
  await docRef.update({ billCode });
  console.log(`[Firestore] Order ${orderId} updated with billCode: ${billCode}`);
}

async function markOrderAsPaid(orderId: string, refno: string): Promise<void> {
  const docRef = firestoreDb.collection('orders').doc(orderId);
  await docRef.update({
    status: 'paid',
    refno,
    paidAt: new Date().toISOString(),
  });
  console.log(`[Firestore] Order ${orderId} marked as PAID.`);
}

async function markOrderAsFailed(orderId: string): Promise<void> {
  const docRef = firestoreDb.collection('orders').doc(orderId);
  await docRef.update({ status: 'failed' });
  console.log(`[Firestore] Order ${orderId} marked as FAILED.`);
}

// ==========================================
// 2. toyyibPay Integration & Secrets Handling
// ==========================================
export function getToyyibpayBaseUrl(): string {
  const url = process.env.TOYYIBPAY_BASE_URL?.trim();
  if (url) return url.replace(/\/+$/, '');
  return 'https://dev.toyyibpay.com';
}

export function getPaymentChannel(): string {
  // Default to "0" (FPX only) unless explicitly configured
  return process.env.TOYYIBPAY_PAYMENT_CHANNEL?.trim() || '0';
}

export function getDownloadLink(pack: '100' | '200'): string | null {
  const link =
    pack === '200'
      ? process.env.DOWNLOAD_LINK_200?.trim()
      : process.env.DOWNLOAD_LINK_100?.trim();

  if (!link) {
    console.error(`[Download Link Missing] DOWNLOAD_LINK_${pack} is not configured in environment.`);
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
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY?.trim();
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE?.trim();
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
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY?.trim();
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

// ==========================================
// 3. Express App Setup & Routes
// ==========================================
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable trust proxy for Cloud Run so rate-limiter sees correct client IP
app.set('trust proxy', 1);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function getSiteUrl(req: Request): string {
  if (process.env.SITE_URL?.trim()) {
    return process.env.SITE_URL.trim().replace(/\/+$/, '');
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${proto}://${host}`;
}

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many checkout requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
}

// Public endpoint for payment channel info
app.get('/api/payment-methods', (_req: Request, res: Response) => {
  const channel = getPaymentChannel();
  res.json({
    channel,
    allowsCards: channel === '2',
    label: channel === '2' ? 'FPX online banking & cards' : 'FPX online banking',
  });
});

// 1. POST /api/checkout
app.post('/api/checkout', checkoutLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { pack, name, email, phone } = req.body;

    const selectedPack: '100' | '200' = pack === '200' ? '200' : '100';
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim().replace(/[\s\-()]/g, '') : '';

    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      res.status(400).json({ error: 'Please enter a valid Malaysian phone number.' });
      return;
    }

    // Refuse checkout if download link is not configured for this pack
    const downloadLink = getDownloadLink(selectedPack);
    if (!downloadLink) {
      console.error(`[Checkout Blocked] Download link not set for pack ${selectedPack}.`);
      res.status(500).json({ error: "Download link is not configured for this pack. Please contact support." });
      return;
    }

    const pricing = calculatePrice(selectedPack);
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `SMV-${Date.now()}-${randomSuffix}`;
    const siteUrl = getSiteUrl(req);

    const newOrder: Order = {
      orderId,
      pack: selectedPack,
      amount: pricing.amountCents,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Save order in Firestore. If this fails, abort without creating toyyibPay bill.
    try {
      await createFirestoreOrder(newOrder);
    } catch (dbErr) {
      console.error('[Firestore Write Failed]', dbErr);
      res.status(500).json({ error: "We couldn't save your order. Please try again." });
      return;
    }

    // Create bill in toyyibPay
    const bill = await createToyyibpayBill({
      orderId,
      pack: selectedPack,
      amountCents: pricing.amountCents,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      siteUrl,
      downloadLink,
    });

    // Save the order's billCode with a single update after bill creation
    await updateOrderBillCode(orderId, bill.billCode);

    console.log(`[Order Initiated] Order ${orderId} linked to bill ${bill.billCode}`);
    res.json({ url: bill.paymentUrl, orderId, billCode: bill.billCode });
  } catch (err: any) {
    console.error('[Checkout Error]', err);
    res.status(500).json({ error: "We couldn't start the payment. Please try again." });
  }
});

// 2. POST /api/toyyibpay/callback
app.post('/api/toyyibpay/callback', async (req: Request, res: Response): Promise<void> => {
  console.log('[toyyibPay Callback] Received notification payload:', req.body);

  const { refno, status, billcode, order_id, hash } = req.body;
  const orderId = (order_id || '').toString();
  const callbackBillCode = (billcode || '').toString();
  const txStatus = (status || '').toString();
  const txRefno = (refno || '').toString();
  const receivedHash = (hash || '').toString();

  const secretKey = process.env.TOYYIBPAY_SECRET_KEY?.trim();

  // REQUIRE hash and secret key
  if (!secretKey || !receivedHash) {
    console.error('[toyyibPay Callback Ignored] Missing secret key or hash.');
    res.status(200).send('OK');
    return;
  }

  // Verify hash
  const hashMatches = verifyCallbackHash({
    secretKey,
    status: txStatus,
    orderId,
    refno: txRefno,
    hash: receivedHash,
  });

  if (!hashMatches) {
    console.error(`[toyyibPay Callback Ignored] Hash mismatch for order ${orderId}.`);
    res.status(200).send('OK');
    return;
  }

  // Look up order in Firestore
  const order = await getFirestoreOrder(orderId);
  if (!order) {
    console.warn(`[toyyibPay Callback Ignored] Order ${orderId} not found in Firestore.`);
    res.status(200).send('OK');
    return;
  }

  // Require that billcode equals the order's saved billCode
  if (!order.billCode || order.billCode !== callbackBillCode) {
    console.error(`[toyyibPay Callback Ignored] BillCode mismatch for order ${orderId}. Expected ${order.billCode}, got ${callbackBillCode}`);
    res.status(200).send('OK');
    return;
  }

  // Idempotency: do nothing if already paid
  if (order.status === 'paid') {
    console.log(`[toyyibPay Callback] Order ${orderId} is already marked as paid.`);
    res.status(200).send('OK');
    return;
  }

  // Order may ONLY become paid when getBillTransactions for order's OWN saved billCode
  // returns successful transaction with amount matching order amount
  const verification = await verifyBillTransaction(order.billCode, order.amount);

  if (verification.paid) {
    await markOrderAsPaid(orderId, txRefno || verification.refno || 'PAID_TX');
    console.log(`[toyyibPay Callback] Order ${orderId} verified and marked as PAID.`);
  } else if (txStatus === '3') {
    await markOrderAsFailed(orderId);
    console.log(`[toyyibPay Callback] Order ${orderId} marked as FAILED.`);
  } else {
    console.log(`[toyyibPay Callback] Order ${orderId} transaction could not be verified yet. Status remains pending.`);
  }

  res.status(200).send('OK');
});

// 3. GET /api/order-status
app.get('/api/order-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = (req.query.order_id || req.query.orderId || '').toString();
    const billCodeFromQuery = (req.query.billcode || req.query.billCode || '').toString();

    if (!orderId) {
      res.status(400).json({ error: 'Missing order_id' });
      return;
    }

    const order = await getFirestoreOrder(orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // If billcode was provided in URL and does not match the order's saved billCode, return 403
    if (billCodeFromQuery && order.billCode && order.billCode !== billCodeFromQuery) {
      console.warn(`[Order Status Forbidden] Query billcode ${billCodeFromQuery} !== saved ${order.billCode}`);
      res.status(403).json({ error: 'Invalid verification for this order' });
      return;
    }

    // If pending, check toyyibPay transactions using the order's OWN saved billCode
    if (order.status === 'pending' && order.billCode) {
      const verification = await verifyBillTransaction(order.billCode, order.amount);
      if (verification.paid) {
        await markOrderAsPaid(orderId, verification.refno || 'PAID_TX');
        order.status = 'paid';
      }
    }

    if (order.status === 'paid') {
      const downloadUrl = getDownloadLink(order.pack);
      res.json({
        status: 'paid',
        orderId: order.orderId,
        pack: order.pack,
        downloadUrl,
        email: maskEmail(order.email),
      });
      return;
    }

    if (order.status === 'failed') {
      res.json({ status: 'failed', orderId: order.orderId });
      return;
    }

    res.json({ status: 'pending', orderId: order.orderId });
  } catch (err) {
    console.error('[Order Status Error]', err);
    res.status(500).json({ error: 'Could not fetch order status' });
  }
});

// Setup dev server with Vite middleware or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '..', 'dist');
    const fallbackDist = path.resolve(__dirname, 'dist');
    const activeDist = fs.existsSync(distPath) ? distPath : fallbackDist;

    app.use(express.static(activeDist));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.resolve(activeDist, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Listening on http://0.0.0.0:${PORT} (Production: ${isProd})`);
  });
}

startServer();
