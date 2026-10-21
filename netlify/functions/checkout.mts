import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore } from '../../server-lib/order-store-blobs.ts';
import { processCheckout } from '../../server-lib/core.ts';
import { getEnv } from '../../server-lib/env.ts';

const store = new NetlifyBlobsOrderStore();

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const siteUrl = getEnv('SITE_URL') || new URL(req.url).origin;
    const result = await processCheckout(store, siteUrl, body);

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Netlify Function checkout error]', err);
    return new Response(
      JSON.stringify({ error: "We couldn't start the payment. Please try again." }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const config: Config = {
  path: '/api/checkout',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
