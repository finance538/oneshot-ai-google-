import type { Context } from '@netlify/functions';

// N-Genius KSA — customer return page. Reads the order state and shows the result.
const identity = 'https://api-gateway.ksa.ngenius-payments.com';

const labels: Record<string, string> = {
  STARTED: 'لم تكتمل العملية',
  SUBMITTED: 'قيد المعالجة',
  AUTHORISED: 'تم حجز المبلغ بنجاح',
  CAPTURED: 'تم الدفع بنجاح',
  PURCHASED: 'تم الدفع بنجاح',
  DECLINED: 'رفضت البطاقة العملية',
  CANCELLED: 'أُلغيت العملية',
  FAILED: 'فشلت العملية',
  EXPIRED: 'انتهت صلاحية الجلسة',
  REFUNDED: 'تم استرجاع المبلغ',
};

function page(title: string, color: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — OneShot</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f14;color:#e8edf3;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif}
.card{max-width:520px;width:calc(100% - 40px);background:#131a22;border:1px solid #1f2a36;border-radius:20px;padding:32px;text-align:center}
h1{font-size:22px;margin:0 0 12px;color:${color}}
p{margin:8px 0;color:#9fb0c3;line-height:1.7}
a{display:inline-block;margin-top:20px;padding:12px 22px;border-radius:12px;background:#1f6feb;color:#fff;text-decoration:none}
code{color:#9fb0c3;font-size:12px}</style></head>
<body><div class="card"><h1>${title}</h1>${body}<a href="https://www.1shotcam.com">العودة إلى الموقع</a></div></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export default async (req: Request, _context: Context) => {
  try {
    const key = process.env.NG_API_KEY;
    const outlet = process.env.NG_OUTLET;
    if (!key || !outlet) return page('بوابة الدفع غير مهيأة', '#f0883e', '<p>تواصل مع الدعم لإكمال الإعداد.</p>', 503);
    const url = new URL(req.url);
    const reference = (url.searchParams.get('ref') || url.searchParams.get('reference') || '').trim();
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(reference)) {
      return page('لا توجد عملية لعرضها', '#f0883e', '<p>لم يصل معرّف العملية مع رابط العودة.</p>', 400);
    }
    const auth = await fetch(`${identity}/identity/auth/access-token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${key}`, 'Content-Type': 'application/vnd.ni-identity.v1+json', Accept: 'application/vnd.ni-identity.v1+json' },
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    if (!auth.ok) return page('تعذر التحقق من العملية', '#f0883e', '<p>حاول تحديث الصفحة بعد لحظات.</p>', 502);
    const session: unknown = await auth.json();
    const token = session && typeof session === 'object' && !Array.isArray(session) ? (session as Record<string, unknown>).access_token : undefined;
    if (typeof token !== 'string') return page('تعذر التحقق من العملية', '#f0883e', '<p>حاول تحديث الصفحة بعد لحظات.</p>', 502);
    const response = await fetch(`${identity}/transactions/outlets/${outlet}/orders/${reference}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.ni-payment.v2+json' },
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return page('تعذر التحقق من العملية', '#f0883e', '<p>حاول تحديث الصفحة بعد لحظات.</p>', 502);
    const order: unknown = await response.json();
    const record = order && typeof order === 'object' && !Array.isArray(order) ? (order as Record<string, unknown>) : {};
    const payments = ((record._embedded || {}) as Record<string, unknown>).payment;
    const first = Array.isArray(payments) ? (payments[0] as Record<string, unknown> | undefined) : undefined;
    const state = typeof first?.state === 'string' ? first.state : 'STARTED';
    const amount = ((record.amount || {}) as Record<string, unknown>).value;
    const total = typeof amount === 'number' ? (amount / 100).toFixed(2) : null;
    const success = ['AUTHORISED', 'CAPTURED', 'PURCHASED'].includes(state);
    const title = labels[state] || 'حالة غير معروفة';
    const color = success ? '#2ea043' : state === 'SUBMITTED' || state === 'STARTED' ? '#f0883e' : '#f85149';
    return page(title, color, `${total ? `<p>المبلغ: <b>${total} ر.س</b></p>` : ''}<p>رقم العملية: <code>${reference}</code></p>`, success ? 200 : 202);
  } catch {
    return page('تعذر التحقق من العملية', '#f0883e', '<p>حاول تحديث الصفحة بعد لحظات.</p>', 502);
  }
};
