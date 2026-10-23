import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore } from '../../server-lib/order-store-blobs.ts';
import { getRecentSales } from '../../server-lib/recent-sales.ts';

const store = new NetlifyBlobsOrderStore();

export default async (_req: Request, _context: Context): Promise<Response> => {
  try {
    const data = await getRecentSales(store);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err) {
    console.error('[Recent Sales Error]', err);
    return new Response(JSON.stringify({ sales: [], last24hCount: 0 }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
};

export const config: Config = {
  path: '/api/recent-sales',
};
