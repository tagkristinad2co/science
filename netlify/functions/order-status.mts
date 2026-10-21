import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore } from '../../server-lib/order-store-blobs.ts';
import { processOrderStatus } from '../../server-lib/core.ts';

const store = new NetlifyBlobsOrderStore();

export default async (req: Request, _context: Context): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const orderId = (url.searchParams.get('order_id') || url.searchParams.get('orderId') || '').trim();
    const billcode = (url.searchParams.get('billcode') || url.searchParams.get('billCode') || '').trim();

    const result = await processOrderStatus(store, orderId, billcode || undefined);

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Netlify Function order-status error]', err);
    return new Response(JSON.stringify({ error: 'Could not fetch order status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  path: '/api/order-status',
};
