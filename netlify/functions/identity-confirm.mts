import { admin } from '@netlify/identity';
import type { Context } from '@netlify/functions';
import { email, failure, HttpError, jsonBody, reply, sameOrigin, throttle } from '../lib/platform.js';

// الحساب الجديد يُعتمد مباشرة بعد التسجيل فلا يبقى الدخول معلقاً على رابط البريد،
// وتُستخدم نفس النافذة لإنقاذ الحسابات القديمة التي أُنشئت قبل تفعيل هذا المسار.
const freshness = 30 * 60 * 1000;

export default async (req: Request, context: Context) => {
  try {
    if (req.method !== 'POST') return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    sameOrigin(req);
    await throttle(`identity-confirm:${context.ip || 'unknown'}`, 15);
    const body = await jsonBody(req);
    const address = email(body.email).toLowerCase();
    let found: { id: string; email?: string; confirmedAt?: string; createdAt?: string } | undefined;
    for (let page = 1; page <= 5 && !found; page++) {
      const users = await admin.listUsers({ page, perPage: 100 });
      found = users.find(user => String(user.email || '').trim().toLowerCase() === address);
      if (users.length < 100) break;
    }
    if (!found) throw new HttpError(404, 'لا يوجد حساب بهذا البريد.');
    if (found.confirmedAt) return reply({ confirmed: true, already: true });
    const created = Date.parse(String(found.createdAt || ''));
    if (!Number.isFinite(created) || Date.now() - created > freshness) throw new HttpError(409, 'هذا الحساب قديم ولا يمكن اعتماده تلقائياً. استخدم رابط التأكيد في بريدك.');
    await admin.updateUser(found.id, { confirm: true });
    return reply({ confirmed: true });
  } catch (error) { return failure(error); }
};
