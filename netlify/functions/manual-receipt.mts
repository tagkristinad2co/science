import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore, NetlifyBlobsReceiptStore } from '../../server-lib/order-store-blobs.ts';
import { processManualReceiptUpload } from '../../server-lib/manual.ts';
import { getEnv } from '../../server-lib/env.ts';

const store = new NetlifyBlobsOrderStore();
const receiptStore = new NetlifyBlobsReceiptStore();

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const siteUrl = getEnv('SITE_URL') || new URL(req.url).origin;
    const formData = await req.formData();
    const orderId = (formData.get('orderId') || formData.get('order_id') || '').toString();
    const token = (formData.get('token') || '').toString();
    const reference = (formData.get('reference') || formData.get('customerReference') || '').toString();
    const file = formData.get('file') || formData.get('receipt');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'Please choose a receipt file to upload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileBuffer = Buffer.from(await (file as Blob).arrayBuffer());
    const fileName = (file as any).name || 'receipt';

    const result = await processManualReceiptUpload(store, receiptStore, siteUrl, {
      orderId,
      token,
      fileBuffer,
      fileName,
      customerReference: reference,
    });

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Netlify Function manual-receipt error]', err);
    return new Response(JSON.stringify({ error: 'Failed to process receipt upload.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  path: '/api/manual/receipt',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
