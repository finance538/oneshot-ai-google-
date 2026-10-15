import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { attempts, gatewayEvents } from '../../db/schema.js';
import { confirmPayment } from '../lib/payments.js';
import { reply } from '../lib/platform.js';

// مستلم Webhooks لبوابة N-Genius KSA — هذا هو الرابط الذي يُسجَّل في Settings ← Integrations ← Webhooks.
// البوابة تُرسل إشعارًا واحدًا لكل حدث ولا تعيد المحاولة، لذلك لا نصدّق محتوى الإشعار أبدًا: نحفظه
// للسجل فقط ثم نطالب البوابة بالحالة الحيّة عبر confirmPayment — المرجع هو الوسيط، ولا إعلان دفع من هنا.
// الإشعار غير موقّع من البوابة، فالباب مغلق بقيمة مشتركة يرسلها التاجر في هيدر يضبطه في اللوحة،
// والغياب يعني الرفض: رابط مكشوف يستطيع أي أحد أن يقذف فيه إشعارات مزيّفة.
const header = process.env.NG_WEBHOOK_HEADER || 'x-webhook-token';

export default async (req: Request) => {
  if (req.method !== 'POST') return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
  const secret = process.env.NG_WEBHOOK_SECRET;
  if (!secret) return reply({ error: 'مستلم الإشعارات غير مهيأ على المنصة (NG_WEBHOOK_SECRET).' }, 503);
  const supplied = req.headers.get(header) || new URL(req.url).searchParams.get('token');
  if (!supplied || supplied !== secret) return reply({ error: 'الإشعار غير موثوق.' }, 401);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse((await req.text()).slice(0, 20000)) as Record<string, unknown>;
  } catch {
    return reply({ error: 'الإشعار ليس JSON صالحًا.' }, 400);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return reply({ error: 'الإشعار غير صالح.' }, 400);
  const nested = (parsed.order || {}) as Record<string, unknown>;
  const event = typeof parsed.event === 'string' ? parsed.event : 'UNKNOWN';
  const reference = typeof nested.reference === 'string' ? nested.reference : typeof parsed.reference === 'string' ? parsed.reference : undefined;
  let stored = false;
  try {
    const db = database();
    await db.insert(gatewayEvents).values({ gateway: 'ngenius', event, reference, payload: parsed });
    stored = true;
  } catch {
    // تعذّر الحفظ: نُبلّغ بالحقيقة بدل ادّعاء الاستلام، ولا نوقف الردّ — البوابة لا تعيد المحاولة.
  }
  try {
    // لا قرار دفع من محتوى الإشعار: الحالة تُقرأ من البوابة، والمرجع هو الوسيط الوحيد.
    if (stored && reference) {
      const db = database();
      const [attempt] = await db.select().from(attempts).where(eq(attempts.reference, reference));
      if (attempt) await confirmPayment(attempt.id, reference);
    }
  } catch {
    // الحالة الحيّة تُقرأ أيضًا عند عودة العميل إلى /pay/return، فلا نُفشل الإشعار لهذا السبب.
  }
  return reply({ received: true, event, stored });
};
