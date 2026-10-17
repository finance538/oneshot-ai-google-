import { and, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { attempts, gatewayEvents } from '../../db/schema.js';
import { confirmPayment } from '../lib/payments.js';
import { failure, reply } from '../lib/platform.js';
import {
  tapChargeId,
  tapChargeStatus,
  tapConfig,
  tapPlatformConfig,
  tapVerifySignature,
  tapWebhookHeader,
  tapWebhookPayload,
} from '../lib/tap.js';

// مستلم Webhooks لبوابة Tap Payments — الرابط الذي يُسجَّل في لوحة Tap:
//   https://1shotcam.com/.netlify/functions/tap-webhook?merchant=<معرّف التاجر>
// Tap يرسل غلافًا: { method, url, headers: [{name,value}], body: "<نص الشحنة JSON>" }،
// ويوقّع الحمولة بقيمة hashstring محسوبة HMAC-SHA256 بمفتاح السري نفسه:
//   x_id{id}x_amount{amount}x_currency{currency}x_gateway_reference{ref}x_payment_reference{ref}x_status{status}x_created{created}
// لذلك لا نصدّق محتوى الإشعار أبدًا: نحفظه للسجل، ونطالب Tap بالحالة الحيّة عبر confirmPayment،
// والمرجع الوحيد هو معرّف الشحنة (chg_…) الذي خزّناه في المحاولة. توقيع خاطئ = لا تأكيد.
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export default async (req: Request) => {
  try {
    if (req.method !== 'POST') return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const merchant = new URL(req.url).searchParams.get('merchant') || '';
    if (merchant && !uuid.test(merchant)) return reply({ error: 'معرّف غير صالح.' }, 400);
    const raw = (await req.text()).slice(0, 200000);
    let wrapper: Record<string, unknown> | null = null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) wrapper = parsed as Record<string, unknown>;
    } catch {
      wrapper = null;
    }
    if (!wrapper) return reply({ error: 'الإشعار ليس JSON صالحًا.' }, 400);
    const charge = tapWebhookPayload(wrapper);
    const chargeId = tapChargeId(charge);
    if (!charge || !chargeId) return reply({ error: 'الإشعار غير صالح.' }, 400);
    const event = tapChargeStatus(charge) || 'UNKNOWN';
    // مفتاح Tap السري هو مفتاح توقيع الويب هوك؛ لا يخرج من الخادم ولا يُسجَّل.
    // حساب Tap غير المهيأ (لا مفاتيح) لا يوقف استقبال الإشعار: يُحفظ للسجل ويُرفض بتوقيع غير صالح.
    let secret = '';
    try {
      secret = (merchant ? tapConfig(merchant) : tapPlatformConfig()).secret;
    } catch {
      secret = '';
    }
    const authenticated = secret
      ? tapVerifySignature(secret, charge, tapWebhookHeader(wrapper, 'hashstring'))
      : false;
    let stored = false;
    try {
      await database().insert(gatewayEvents).values({
        gateway: 'tap',
        event,
        reference: chargeId,
        payload: { authenticated, merchant: merchant || null, notification: charge },
      });
      stored = true;
    } catch {
      // تعذّر الحفظ: نُبلّغ بالحقيقة بدل ادّعاء الاستلام، ولا نوقف الردّ — القرار ليس هنا.
    }
    if (!authenticated) return reply({ received: true, stored, authenticated: false }, 401);
    // التوقيع هو ما يسمح بالتسوية، لا نجاح الحفظ: سطر السجل أفضل جهد، وتعذّره لا يُسقط دفعًا صحيحًا
    // (المرجع معرّف الشحنة، فإعادة الإرسال لا تُخصم مرتين). الرد يقول الحقيقة عن الحفظ في stored.
    let confirmed = false;
    try {
      // لا قرار دفع من محتوى الإشعار: الحالة تُقرأ من Tap، والمرجع هو معرّف الشحنة.
      const db = database();
      const [attempt] = merchant
        ? await db.select().from(attempts).where(and(eq(attempts.reference, chargeId), eq(attempts.merchantId, merchant)))
        : await db.select().from(attempts).where(eq(attempts.reference, chargeId));
      if (attempt) {
        await confirmPayment(attempt.id, chargeId);
        confirmed = true;
      }
    } catch {
      // الفشل هنا مسجَّل في gatewayEvents، وTap يعيد الإرسال — لا نكسر الردّ.
    }
    return reply({ received: true, stored, authenticated: true, event, reference: chargeId, confirmed });
  } catch (error) {
    return failure(error);
  }
};
