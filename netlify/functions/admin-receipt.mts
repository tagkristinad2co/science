import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore, NetlifyBlobsReceiptStore } from '../../server-lib/order-store-blobs.ts';
import { processAdminGetReceipt } from '../../server-lib/manual.ts';
import { parseCookies, verifyAdminSession } from '../../server-lib/admin-auth.ts';

const store = new NetlifyBlobsOrderStore();
const receiptStore = new NetlifyBlobsReceiptStore();

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const cookies = parseCookies(req.headers.get('cookie'));
  if (!verifyAdminSession(cookies.admin_session)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const orderId = (url.searchParams.get('order_id') || url.searchParams.get('orderId') || '').trim();

    const result = await processAdminGetReceipt(store, receiptStore, orderId);

    if (result.status !== 200 || !result.data) {
      return new Response(result.error || 'Receipt not found', { status: result.status });
    }

    const headers: Record<string, string> = {
      'Content-Type': result.contentType || 'application/octet-stream',
      'Content-Length': result.data.length.toString(),
      'Cache-Control': 'private, no-cache',
    };

    return new Response(new Uint8Array(result.data), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('[Admin Receipt Error]', err);
    return new Response('Could not load receipt', { status: 500 });
  }
};

export const config: Config = {
  path: '/api/admin/receipt',
};
