import express from 'express';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { InMemoryOrderStore, InMemoryReceiptStore } from './server-lib/order-store-memory.ts';
import {
  processStripeCheckout,
  processStripeWebhook,
  processStripeOrderStatus,
} from './server-lib/stripe.ts';
import {
  processManualCreate,
  processManualGetOrder,
  processManualReceiptUpload,
  processManualStatus,
  processAdminListOrders,
  processAdminAction,
  processAdminGetReceipt,
} from './server-lib/manual.ts';
import {
  checkAdminLoginRateLimit,
  recordFailedAdminLogin,
  recordSuccessfulAdminLogin,
  verifyAdminPassword,
  createAdminSessionCookie,
  parseCookies,
  verifyAdminSession,
} from './server-lib/admin-auth.ts';
import type { OrderStatus } from './server-lib/types.ts';
import { getRecentSales } from './server-lib/recent-sales.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log('DEV preview: orders are in memory, not for real payments');
const devStore = new InMemoryOrderStore();
const devReceiptStore = new InMemoryReceiptStore();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});

// Enable trust proxy
app.set('trust proxy', 1);

// Body parsers with raw body retention for Stripe webhooks
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
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

// Public endpoint for payment methods info
app.get('/api/payment-methods', (_req: Request, res: Response) => {
  res.json({
    onlineLabel: 'Card & FPX online banking',
    manualEnabled: true,
  });
});

// Public endpoint for real recent sales (social proof)
app.get('/api/recent-sales', async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await getRecentSales(devStore);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (err) {
    console.error('[Recent Sales Error]', err);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ sales: [], last24hCount: 0 });
  }
});

// 1. POST /api/checkout (Stripe Checkout)
app.post('/api/checkout', checkoutLimiter, async (req: Request, res: Response): Promise<void> => {
  const siteUrl = getSiteUrl(req);
  const result = await processStripeCheckout(devStore, siteUrl, req.body);
  res.status(result.status).json(result.body);
});

// 2. POST /api/stripe/webhook (Stripe Webhook)
app.post('/api/stripe/webhook', async (req: Request, res: Response): Promise<void> => {
  const rawBody = (req as any).rawBody ? (req as any).rawBody.toString('utf8') : JSON.stringify(req.body);
  const signature = req.headers['stripe-signature'] as string;
  const siteUrl = getSiteUrl(req);
  const result = await processStripeWebhook(devStore, rawBody, signature, siteUrl);
  res.status(result.status).json(result.body);
});

// 3. GET /api/order-status (Stripe Order Status)
app.get('/api/order-status', async (req: Request, res: Response): Promise<void> => {
  const orderId = (req.query.order_id || req.query.orderId || '').toString();
  const sessionId = (req.query.session_id || req.query.sessionId || '').toString();
  const siteUrl = getSiteUrl(req);

  const result = await processStripeOrderStatus(devStore, orderId, sessionId, siteUrl);
  res.status(result.status).json(result.body);
});

// 4. POST /api/manual/create
app.post('/api/manual/create', checkoutLimiter, async (req: Request, res: Response): Promise<void> => {
  const result = await processManualCreate(devStore, req.body);
  res.status(result.status).json(result.body);
});

// 5. GET /api/manual/order
app.get('/api/manual/order', async (req: Request, res: Response): Promise<void> => {
  const orderId = (req.query.order_id || req.query.orderId || '').toString();
  const token = (req.query.token || req.query.t || '').toString();
  const result = await processManualGetOrder(devStore, orderId, token);
  res.status(result.status).json(result.body);
});

// 6. POST /api/manual/receipt
app.post(
  '/api/manual/receipt',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'receipt', maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const orderId = (req.body.orderId || req.body.order_id || '').toString();
    const token = (req.body.token || '').toString();
    const reference = (req.body.reference || req.body.customerReference || '').toString();
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const file = files?.['file']?.[0] || files?.['receipt']?.[0];

    if (!file) {
      res.status(400).json({ error: 'Please choose a receipt file to upload.' });
      return;
    }

    const siteUrl = getSiteUrl(req);
    const result = await processManualReceiptUpload(devStore, devReceiptStore, siteUrl, {
      orderId,
      token,
      fileBuffer: file.buffer,
      fileName: file.originalname,
      customerReference: reference,
    });

    res.status(result.status).json(result.body);
  }
);

// 7. GET /api/manual/status
app.get('/api/manual/status', async (req: Request, res: Response): Promise<void> => {
  const orderId = (req.query.order_id || req.query.orderId || '').toString();
  const token = (req.query.token || req.query.t || '').toString();
  const result = await processManualStatus(devStore, orderId, token);
  res.status(result.status).json(result.body);
});

// 8. POST /api/admin/login
app.post('/api/admin/login', (req: Request, res: Response): void => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!checkAdminLoginRateLimit(clientIp)) {
    res.status(429).json({ error: 'Too many failed login attempts. Please try again in 15 minutes.' });
    return;
  }

  const password = req.body?.password || '';
  if (!verifyAdminPassword(password)) {
    recordFailedAdminLogin(clientIp);
    res.status(401).json({ error: 'Incorrect admin password.' });
    return;
  }

  recordSuccessfulAdminLogin(clientIp);
  try {
    const { cookieValue, expires } = createAdminSessionCookie();

    res.cookie('admin_session', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires,
      path: '/',
    });

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Admin configuration error' });
  }
});

// Admin auth middleware for Express
function requireAdminAuth(req: Request, res: Response, next: () => void) {
  const cookies = parseCookies(req.headers.cookie);
  if (!verifyAdminSession(cookies.admin_session)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// 9. GET /api/admin/orders
app.get('/api/admin/orders', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  const tab = (req.query.tab || 'to_review').toString();
  const search = req.query.search ? req.query.search.toString() : undefined;

  let statusFilter: OrderStatus | undefined = undefined;
  if (tab === 'to_review') statusFilter = 'under_review';
  else if (tab === 'awaiting_payment') statusFilter = 'awaiting_payment';

  const result = await processAdminListOrders(devStore, { status: statusFilter, search });
  res.status(result.status).json(result.body);
});

// 10. POST /api/admin/action
app.post('/api/admin/action', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  const siteUrl = getSiteUrl(req);
  const result = await processAdminAction(devStore, siteUrl, {
    orderId: req.body.orderId,
    action: req.body.action,
    reason: req.body.reason,
    hideFromSocialProof: req.body.hideFromSocialProof,
    adminUser: 'owner',
  });
  res.status(result.status).json(result.body);
});

// 11. GET /api/admin/receipt
app.get('/api/admin/receipt', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  const orderId = (req.query.order_id || req.query.orderId || '').toString();
  const result = await processAdminGetReceipt(devStore, devReceiptStore, orderId);

  if (result.status !== 200 || !result.data) {
    res.status(result.status).send(result.error || 'Receipt not found');
    return;
  }

  res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
  res.setHeader('Content-Length', result.data.length);
  res.setHeader('Cache-Control', 'private, no-cache');
  res.send(result.data);
});

// Setup dev server with Vite middleware or static serving
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
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Listening on http://0.0.0.0:${PORT} (Production: ${isProd})`);
  });
}

startServer();
