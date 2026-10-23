import crypto from 'crypto';
import { getEnv } from './env.ts';

const failedLogins = new Map<string, { count: number; resetAt: number }>();

export function checkAdminLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = failedLogins.get(ip);
  if (!entry) return true;
  if (now > entry.resetAt) {
    failedLogins.delete(ip);
    return true;
  }
  return entry.count < 5;
}

export function recordFailedAdminLogin(ip: string): void {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const entry = failedLogins.get(ip);
  if (!entry || now > entry.resetAt) {
    failedLogins.set(ip, { count: 1, resetAt: now + windowMs });
  } else {
    entry.count += 1;
  }
}

export function recordSuccessfulAdminLogin(ip: string): void {
  failedLogins.delete(ip);
}

export function verifyAdminPassword(inputPassword: string): boolean {
  const adminPassword = getEnv('ADMIN_PASSWORD');
  if (!adminPassword || adminPassword.length < 12) {
    console.warn('[Admin Auth] ADMIN_PASSWORD not set');
    return false;
  }
  if (typeof inputPassword !== 'string') return false;

  const h1 = crypto.createHash('sha256').update(inputPassword).digest();
  const h2 = crypto.createHash('sha256').update(adminPassword).digest();
  return crypto.timingSafeEqual(h1, h2);
}

export function createAdminSessionCookie(): { cookieValue: string; expires: Date } {
  const secret = getEnv('ADMIN_SESSION_SECRET');
  if (!secret || secret.length < 32) {
    console.error('[Admin Auth] ADMIN_SESSION_SECRET must be at least 32 characters');
    throw new Error('ADMIN_SESSION_SECRET not properly configured');
  }
  const expiresMs = Date.now() + 12 * 60 * 60 * 1000; // 12 hours
  const payload = `${expiresMs}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token = `${payload}.${sig}`;

  return {
    cookieValue: token,
    expires: new Date(expiresMs),
  };
}

export function parseCookies(cookieHeader?: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

export function verifyAdminSession(token?: string | null): boolean {
  if (!token) return false;
  const secret = getEnv('ADMIN_SESSION_SECRET');
  if (!secret || secret.length < 32) {
    return false;
  }
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expiresStr, sig] = parts;
  const expiresMs = parseInt(expiresStr, 10);
  if (isNaN(expiresMs) || Date.now() > expiresMs) {
    return false;
  }

  const expectedSig = crypto.createHmac('sha256', secret).update(expiresStr).digest('hex');

  const bufSig = Buffer.from(sig);
  const bufExpected = Buffer.from(expectedSig);
  if (bufSig.length !== bufExpected.length) return false;

  return crypto.timingSafeEqual(bufSig, bufExpected);
}

export function constantTimeTokenCompare(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const h1 = crypto.createHash('sha256').update(a).digest();
  const h2 = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(h1, h2);
}
