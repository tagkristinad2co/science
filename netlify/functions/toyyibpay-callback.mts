import type { Config, Context } from '@netlify/functions';
import { NetlifyBlobsOrderStore } from '../../server-lib/order-store-blobs.ts';
import { processCallback } from '../../server-lib/core.ts';

const store = new NetlifyBlobsOrderStore();

export default async (req: Request, _context: Context): Promise<Response> => {
  try {
    const rawText = await req.text();
    const searchParams = new URLSearchParams(rawText);
    const params: Record<string, string> = {};

    searchParams.forEach((val, key) => {
      params[key] = val;
    });

    const result = await processCallback(store, params);

    return new Response(result.text, {
      status: result.status,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (err) {
    console.error('[Netlify Function toyyibpay-callback error]', err);
    // Always respond 200 OK so toyyibPay stops retrying
    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};

export const config: Config = {
  path: '/api/toyyibpay/callback',
};
