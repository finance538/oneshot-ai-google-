import { failure, identifier } from '../lib/platform.js';
import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { walletTopups } from '../../db/schema.js';

export default async (req: Request) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) return new Response(null, { status: 405 });
    const url = new URL(req.url);
    const id = identifier(url.searchParams.get('id'));
    const [topup] = await database().select().from(walletTopups).where(eq(walletTopups.documentId, id));
    const path = topup ? `/wallet?topup=${id}` : `/pay/${id}?returned=1`;
    return new Response(null, { status: 303, headers: { Location: `${url.origin}${path}`, 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
};
