import type { Config, Context } from '@netlify/functions';
import {
  checkAdminLoginRateLimit,
  recordFailedAdminLogin,
  recordSuccessfulAdminLogin,
  verifyAdminPassword,
  createAdminSessionCookie,
} from '../../server-lib/admin-auth.ts';

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clientIp = context.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';

  if (!checkAdminLoginRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Too many failed login attempts. Please try again in 15 minutes.' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await req.json();
    const password = body?.password || '';

    if (!verifyAdminPassword(password)) {
      recordFailedAdminLogin(clientIp);
      return new Response(JSON.stringify({ error: 'Incorrect admin password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    recordSuccessfulAdminLogin(clientIp);
    const { cookieValue, expires } = createAdminSessionCookie();

    const cookieHeader = `admin_session=${encodeURIComponent(cookieValue)}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expires.toUTCString()}`;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader,
      },
    });
  } catch (err) {
    console.error('[Admin Login Error]', err);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  path: '/api/admin/login',
};
