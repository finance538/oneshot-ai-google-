import type { Config, Context } from '@netlify/edge-functions';

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') return new Response(null, { status: 405 });
  return Response.json({ country: context.geo?.country?.code || '', city: context.geo?.city || '', approximate: true }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
};

export const config: Config = { path: '/api/checkout-location' };
