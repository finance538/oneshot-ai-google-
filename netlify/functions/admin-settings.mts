import { and, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { platformSettings, settingsAudit } from '../../db/schema.js';
import { failure, HttpError, isAdmin, jsonBody, owner, reply, sameOrigin, throttle } from '../lib/platform.js';
import { parsePolicy, settings } from '../lib/policy.js';

export default async (req: Request) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const user = await owner();
    if (!isAdmin(user)) throw new HttpError(403, 'هذه الإعدادات لمسؤول المنصة فقط.');
    if (req.method === 'GET') return reply(await settings());
    sameOrigin(req);
    await throttle(`admin:${user.id}`, 60);
    const body = await jsonBody(req);
    const policy = parsePolicy(body.policy);
    if (!Number.isInteger(body.version) || Number(body.version) < 0) throw new HttpError(400, 'إعدادات غير صالحة.');
    const result = await database().transaction(async tx => {
      const values = { policy, updatedBy: user.id, updatedAt: new Date(), version: Number(body.version) + 1 };
      const [updated] = body.version === 0
        ? await tx.insert(platformSettings).values({ id: 'global', ...values }).onConflictDoNothing().returning()
        : await tx.update(platformSettings).set(values).where(and(eq(platformSettings.id, 'global'), eq(platformSettings.version, Number(body.version)))).returning();
      if (!updated) throw new HttpError(409, 'تغيرت الإعدادات. حدّث الصفحة قبل الحفظ.');
      await tx.insert(settingsAudit).values({ actorId: user.id, policy });
      return { policy: updated.policy, version: updated.version };
    });
    return reply(result);
  } catch (error) { return failure(error); }
};
