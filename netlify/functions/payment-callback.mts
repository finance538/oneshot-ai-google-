import { createHmac, timingSafeEqual } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { attempts } from '../../db/schema.js';
import { confirmPayment } from '../lib/payments.js';
import { failure, gateway, HttpError, identifier, reply } from '../lib/platform.js';

export default async (req: Request) => {
  try {
    if (req.method !== 'POST') return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const merchantId = identifier(new URL(req.url).searchParams.get('merchant'));
    const signature = req.headers.get('signature') || '';
    const raw = await req.text();
    if (raw.length > 64000 || !/^[a-f0-9]{64}$/i.test(signature)) throw new HttpError(403, 'توقيع غير صالح.');
    const expected = createHmac('sha256', gateway(merchantId).key).update(raw).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new HttpError(403, 'توقيع غير صالح.');
    const body = JSON.parse(raw) as Record<string, unknown>;
    const [attempt] = await database().select().from(attempts).where(and(eq(attempts.id, identifier(body.cart_id)), eq(attempts.merchantId, merchantId)));
    if (!attempt || typeof body.tran_ref !== 'string') throw new HttpError(404, 'طلب الدفع غير موجود.');
    await confirmPayment(attempt.id, body.tran_ref, typeof body.token === 'string' ? body.token : undefined);
    return reply({ received: true });
  } catch (error) { return failure(error); }
};
