import type { Config, Context } from '@netlify/functions';

export default async (_req: Request, _context: Context): Promise<Response> => {
  return new Response(
    JSON.stringify({
      onlineLabel: 'Card & FPX online banking',
      manualEnabled: true,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const config: Config = {
  path: '/api/payment-methods',
};
