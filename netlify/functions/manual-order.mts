import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore } from '../../server-lib/order-store-blobs.ts';
import { processManualGetOrder } from '../../server-lib/manual.ts';

const store = new NetlifyBlobsOrderStore();

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const orderId = (url.searchParams.get('order_id') || url.searchParams.get('orderId') || '').trim();
    const token = (url.searchParams.get('token') || url.searchParams.get('t') || '').trim();

    const result = await processManualGetOrder(store, orderId, token);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Netlify Function manual-order error]', err);
    return new Response(JSON.stringify({ error: 'Could not fetch order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  path: '/api/manual/order',
};
