import type { Config, Context } from '@netlify/functions';
import { getPaymentMethodsInfo } from '../../server-lib/core.ts';

export default async (_req: Request, _context: Context): Promise<Response> => {
  const info = getPaymentMethodsInfo();
  return new Response(JSON.stringify(info), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config: Config = {
  path: '/api/payment-methods',
};
