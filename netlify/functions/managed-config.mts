import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { documents } from '../../db/schema.js';
import { failure, gateway, HttpError, identifier, reply } from '../lib/platform.js';
import { enabledCapabilities, settings } from '../lib/policy.js';

export default async (req: Request) => {
  try {
    if (req.method !== 'GET') return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const [document] = await database().select().from(documents).where(eq(documents.id, identifier(new URL(req.url).searchParams.get('id'))));
    const { policy } = await settings();
    if (!document || document.method !== 'managed' || document.status !== 'pending' || document.expiresAt.getTime() < Date.now() || !enabledCapabilities(document.merchantId, 'paytabs', policy).managed) throw new HttpError(404, 'نموذج الدفع غير متاح.');
    const config = gateway(document.merchantId);
    return reply({ clientKey: process.env[`${config.prefix}_CLIENT_KEY`], scriptUrl: `${config.base}/payment/js/paylib.js` });
  } catch (error) { return failure(error); }
};
