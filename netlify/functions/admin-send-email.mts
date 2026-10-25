import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore } from '../../server-lib/order-store-blobs.ts';
import { processAdminSendDownloadEmail } from '../../server-lib/manual.ts';
import { parseCookies, verifyAdminSession } from '../../server-lib/admin-auth.ts';
import { getEnv } from '../../server-lib/env.ts';

const store = new NetlifyBlobsOrderStore();

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
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
    const siteUrl = getEnv('SITE_URL') || new URL(req.url).origin;
    const body = await req.json();

    const result = await processAdminSendDownloadEmail(store, siteUrl, {
      orderId: body.orderId,
      email: body.email,
      adminUser: 'owner',
    });

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Admin Send Email Error]', err);
    return new Response(JSON.stringify({ error: err?.message || 'Action failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  path: '/api/admin/send-email',
};
