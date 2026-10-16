import { and, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { accountRegistrations, testingWorkspaces } from '../../db/schema.js';
import { canUseTestingTools, defaultTestingSettings, testingSettingsSchema } from '../../shared/testing-workspace.js';
import { failure, HttpError, isAdmin, jsonBody, owner, reply, sameOrigin, throttle } from '../lib/platform.js';

export default async (req: Request) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) throw new HttpError(405, 'طريقة الطلب غير مسموحة.');
    if (req.method === 'POST') sameOrigin(req);
    const user = await owner();
    const db = database();
    const [registration] = await db.select().from(accountRegistrations).where(eq(accountRegistrations.ownerId, user.id));
    if (!canUseTestingTools({ isAdmin: isAdmin(user), accountRole: registration?.role, registrationStatus: registration?.status })) {
      throw new HttpError(403, 'أدوات الاختبار متاحة لحساب اللودر أو التاجر المفعّل أو مسؤول المنصة.');
    }
    if (req.method === 'GET') {
      const [record] = await db.select().from(testingWorkspaces).where(eq(testingWorkspaces.ownerId, user.id));
      return reply(record
        ? { settings: record.settings, version: record.version, updatedAt: record.updatedAt }
        : { settings: defaultTestingSettings(), version: 0, updatedAt: null });
    }
    await throttle(`testing-workspace:${user.id}`, 60);
    const body = await jsonBody(req, 16000);
    const settings = testingSettingsSchema.safeParse(body.settings);
    if (!settings.success || !Number.isSafeInteger(body.version) || Number(body.version) < 0 || Number(body.version) >= 2147483647) {
      throw new HttpError(400, 'إعدادات الاختبار غير صالحة. تحقق من الحقول وعناوين IP.');
    }
    const version = Number(body.version);
    const values = { settings: settings.data, version: version + 1, updatedAt: new Date() };
    const saved = version === 0
      ? await db.insert(testingWorkspaces).values({ ownerId: user.id, ...values }).onConflictDoNothing().returning()
      : await db.update(testingWorkspaces).set(values).where(and(eq(testingWorkspaces.ownerId, user.id), eq(testingWorkspaces.version, version))).returning();
    if (!saved.length) throw new HttpError(409, 'تم تعديل الإعدادات من جلسة أخرى. أعد تحميل النسخة المحفوظة قبل الحفظ.');
    return reply({ settings: saved[0].settings, version: saved[0].version, updatedAt: saved[0].updatedAt });
  } catch (error) { return failure(error); }
};
