import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore } from '../../server-lib/order-store-blobs.ts';
import { processStripeOrderStatus } from '../../server-lib/stripe.ts';
import { getEnv } from '../../server-lib/env.ts';

const store = new NetlifyBlobsOrderStore();

export default async (req: Request, _context: Context): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const orderId = (url.searchParams.get('order_id') || url.searchParams.get('orderId') || '').trim();
    const sessionId = (url.searchParams.get('session_id') || url.searchParams.get('sessionId') || '').trim();
    const siteUrl = getEnv('SITE_URL') || new URL(req.url).origin;

    const result = await processStripeOrderStatus(store, orderId, sessionId, siteUrl);

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
