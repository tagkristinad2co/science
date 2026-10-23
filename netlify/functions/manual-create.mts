import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore } from '../../server-lib/order-store-blobs.ts';
import { processManualCreate } from '../../server-lib/manual.ts';

import { parseCookies } from '../../server-lib/admin-auth.ts';

const store = new NetlifyBlobsOrderStore();

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const cookies = parseCookies(req.headers.get('cookie'));
    const clientIp = context.ip || req.headers.get('x-forwarded-for') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const metaInfo = {
      fbp: body.fbp || cookies._fbp,
      fbc: body.fbc || cookies._fbc,
      clientIp,
      userAgent,
    };

    const result = await processManualCreate(store, body, metaInfo);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Netlify Function manual-create error]', err);
    return new Response(JSON.stringify({ error: 'Could not create manual order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  path: '/api/manual/create',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
