import express from 'express';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { InMemoryOrderStore } from './server-lib/order-store-memory.ts';
import {
  processCheckout,
  processCallback,
  processOrderStatus,
  getPaymentMethodsInfo,
} from './server-lib/core.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log('DEV preview: orders are in memory, not for real payments');
const devStore = new InMemoryOrderStore();

// Enable trust proxy
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

// Public endpoint for payment channel info
app.get('/api/payment-methods', (_req: Request, res: Response) => {
  res.json(getPaymentMethodsInfo());
});

// 1. POST /api/checkout
app.post('/api/checkout', checkoutLimiter, async (req: Request, res: Response): Promise<void> => {
  const siteUrl = getSiteUrl(req);
  const result = await processCheckout(devStore, siteUrl, req.body);
  res.status(result.status).json(result.body);
});

// 2. POST /api/toyyibpay/callback
app.post('/api/toyyibpay/callback', async (req: Request, res: Response): Promise<void> => {
  // req.body has key-value pairs parsed by express.urlencoded
  const params: Record<string, string> = {};
  if (req.body && typeof req.body === 'object') {
    for (const [key, val] of Object.entries(req.body)) {
      params[key] = String(val);
    }
  }
  const result = await processCallback(devStore, params);
  res.status(result.status).send(result.text);
});

// 3. GET /api/order-status
app.get('/api/order-status', async (req: Request, res: Response): Promise<void> => {
  const orderId = (req.query.order_id || req.query.orderId || '').toString();
  const billCode = (req.query.billcode || req.query.billCode || '').toString();

  const result = await processOrderStatus(devStore, orderId, billCode || undefined);
  res.status(result.status).json(result.body);
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
