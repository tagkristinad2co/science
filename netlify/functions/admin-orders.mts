import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore } from '../../server-lib/order-store-blobs.ts';
import { processAdminListOrders } from '../../server-lib/manual.ts';
import { parseCookies, verifyAdminSession } from '../../server-lib/admin-auth.ts';
import type { OrderStatus } from '../../server-lib/types.ts';

const store = new NetlifyBlobsOrderStore();

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cookies = parseCookies(req.headers.get('cookie'));
  if (!verifyAdminSession(cookies.admin_session)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const tab = url.searchParams.get('tab') || 'to_review';
    const search = url.searchParams.get('search') || undefined;

    let statusFilter: OrderStatus | undefined = undefined;
    if (tab === 'to_review') {
      statusFilter = 'under_review';
    } else if (tab === 'awaiting_payment') {
      statusFilter = 'awaiting_payment';
    }

    const result = await processAdminListOrders(store, {
      status: statusFilter,
      search,
    });

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Admin Orders Error]', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch admin orders' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  path: '/api/admin/orders',
};
