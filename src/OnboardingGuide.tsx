// OnboardingGuide.tsx
// المرشد الذكي (ACO): يفتح تلقائياً أول ما يسجّل المستخدم، يطوف الأقسام واحدة واحدة،
// يقول له وش يقدر ووش ما يقدر عليه وكيف يربح — ثم لا يفتح مرة ثانية (مفتاح لكل مستخدم).
//
// المرشد نفسه كادر حقيقي في الطاقم (`onboarding_guide`) يرد من النموذج، وهذا المكوّن
// هو الطواف الموجّه الذي يعرض الخريطة ويشغّل المرشد في نفس الوقت.

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, Check, CreditCard, FileText, LayoutDashboard, Link2, Repeat2, Send, Settings2, ShieldCheck, Sparkles, UserPlus, X, Blocks } from 'lucide-react';
import './OnboardingGuide.css';

export interface GuideStep {
  view: string;
  title: string;
  body: string;
  icon: typeof LayoutDashboard;
}

/** خريطة الأقسام بالترتيب الذي يحتاجه التاجر فعلاً، مع حدود كل قسم. */
export const guideSteps: GuideStep[] = [
  {
    view: 'overview',
    title: 'نظرة عامة — بيتك في المنصة',
    body: 'هنا تشوف إجمالي المقبوض، عدد العمليات المكتملة، الطلبات المعلقة، وعدد عملائك، ونشاط آخر 7 أيام. يبدأ كل يوم من هنا.',
    icon: LayoutDashboard,
  },
  {
    view: 'integrations',
    title: 'طرق ربط البوابات — أول خطوة حقيقية',
    body: 'اربط بوابة الدفع (PayTabs أو Telr) وأضف قيم المفاتيح في Netlify بنطاق Functions. لا تصدر روابط دفع قبل تفعيل بوابة واحدة على الأقل. لا ترسل أي مفتاح في المحادثة.',
    icon: Blocks,
  },
  {
    view: 'links',
    title: 'روابط الدفع — اقبض بدون متجر',
    body: 'أنشئ رابطاً بمبلغ يحدده العميل (من/إلى) وتختار وسائل الدفع المسموحة، أو أنشئ طلباً بمبلغ ثابت. هذا هو أسرع طريق لأول ريال.',
    icon: Link2,
  },
  {
    view: 'invoices',
    title: 'الفواتير والاشتراكات',
    body: 'أرسل فاتورة مخصصة لعميل بالبريد، أو فعّل اشتراكاً شهرياً/سنوياً يوافق عليه العميل. التحصيل الدوري بعد الموافقة، وبدون تخزين بيانات بطاقة.',
    icon: FileText,
  },
  {
    view: 'wallet',
    title: 'محفظتي',
    body: 'رصيد المقبوضات وحركتها. هنا تعرف كم دخل لك فعلاً وكم لا يزال معلقاً في البوابات.',
    icon: CreditCard,
  },
  {
    view: 'staff',
    title: 'سوق كوادر الـ AI — فريق بدون رواتب',
    body: 'توظّف كوادر متخصصة (دعم عملاء، تسويق، مبرمج، محاسب، مكافحة احتيال، إغلاق بيوع). الدفع عن كل موديل تستخدمه فقط. خدمة العملاء والمرشد مجانيان، وبقية الكوادر بترخيص من الإدارة.',
    icon: UserPlus,
  },
  {
    view: 'security',
    title: 'أنظمة حماية البوابات',
    body: 'فلاتر 3DS، فحص الدولة، حظر VPN، وكشف التخمين. شغّلها قبل ما تنطلق بحملة إعلانية حتى لا يتحول نجاحك إلى نزاعات بنكية.',
    icon: ShieldCheck,
  },
  {
    view: 'settings',
    title: 'إعدادات التاجر',
    body: 'اسم متجرك، معرّف التاجر، وأسماء متغيرات البوابة (الأسماء فقط — القيم في Netlify). ومن هنا تثبّت التطبيق على جهازك.',
    icon: Settings2,
  },
];

/** حدّ ما يتوقعه العميل من المرشد — يُكتب صراحةً حتى لا يعِد بما لا يملكه. */
export const guideLimits = [
  'أشرح وأوجّه وأبني لك خطة — ولا أنفّذ بنفسي: لا أربط بوابة ولا أحرّك مبلغاً ولا أغيّر إعداداً.',
  'لا أرى سجلاتك الحيّة: الأرقام التي تراها في الأقسام هي المرجع، وأنا أشرح معناها.',
  'لا أكتب كوداً: أي طلب برمجي أو ويب هوك يحوّله «طارق الدوسري (AI) — مبرمج المتاجر الإلكترونية».',
  'لا أطلب منك أي مفتاح أو كلمة مرور أو بيانات بطاقة، ولا تُكتب في المحادثة أبداً.',
];

interface OnboardingGuideProps {
  /** معرّف المستخدم: عليه يُخزَّن «تمّ الطواف» فلا يفتح مرتين لنفس الحساب. */
  userId: string;
  /** التنقل بين أقسام لوحة التاجر. */
  onNavigate: (view: string) => void;
  /** كادر المرشد للكلام الفعلي مع النموذج. */
  onOpenChat?: (staffId: string) => void;
  /** للتخطي/الإغلاق. */
  onClose: () => void;
}

export function tourKey(userId: string) {
  return `oneshot_tour_done:${userId}`;
}

export function tourCompleted(userId: string) {
  try { return localStorage.getItem(tourKey(userId)) === '1'; } catch { return true; }
}

export default function OnboardingGuide({ userId, onNavigate, onOpenChat, onClose }: OnboardingGuideProps) {
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');
  const step = useMemo(() => guideSteps[Math.min(index, guideSteps.length - 1)], [index]);
  const last = index >= guideSteps.length - 1;

  useEffect(() => {
    onNavigate(step.view);
  }, [step.view, onNavigate]);

  const finish = () => {
    try { localStorage.setItem(tourKey(userId), '1'); } catch { /* private mode */ }
    onClose();
  };

  const askGuide = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = question.trim();
    if (!text || asking) return;
    setAsking(true);
    setError('');
    setAnswer('');
    try {
      const res = await fetch('/.netlify/functions/staff-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: 'onboarding_guide', prompt: text, history: [], consent: true, tier: 'auto' }),
      });
      const data = await res.json().catch(() => null) as { answer?: string; error?: string; tierLabel?: string } | null;
      if (!res.ok) { setError(data?.error || `تعذر الحصول على إجابة (${res.status}).`); return; }
      setAnswer(`${data?.answer || ''}${data?.tierLabel ? `\n\n— ${data.tierLabel}` : ''}`);
    } catch {
      setError('تعذر الوصول إلى المرشد. تحقق من اتصالك ثم أعد المحاولة.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-label="مرشد ونشوت">
      <div className="onboarding-card" dir="rtl">
        <div className="onboarding-header">
          <div className="onboarding-guide-badge">
            <Bot size={22} />
            <div>
              <strong>مرشد ونشوت (AI)</strong>
              <span>جولة أول تسجيل · خطوة {index + 1} من {guideSteps.length}</span>
            </div>
          </div>
          <button type="button" className="onboarding-skip" onClick={finish} aria-label="تخطي الجولة">
            <X size={18} />
            <span>تخطي</span>
          </button>
        </div>

        <div className="onboarding-progress" aria-hidden="true">
          {guideSteps.map((item, i) => <span key={item.view} className={i <= index ? 'on' : ''} />)}
        </div>

        <div className="onboarding-step">
          <div className="onboarding-step-icon"><step.icon size={26} /></div>
          <h2>{step.title}</h2>
          <p>{step.body}</p>
        </div>

        <div className="onboarding-limits">
          <span className="onboarding-limits-title"><Sparkles size={15} /> وش تقدر عليه ووش ما تقدر عليه:</span>
          <ul>
            {guideLimits.map(item => <li key={item}><Check size={13} /><span>{item}</span></li>)}
          </ul>
        </div>

        <form className="onboarding-ask" onSubmit={askGuide}>
          <input
            type="text"
            value={question}
            onChange={event => setQuestion(event.target.value)}
            placeholder="اسأل المرشد: كيف أربط بوابتي؟ كيف أطلق أول رابط دفع؟"
          />
          <button type="submit" disabled={!question.trim() || asking}>
            <Send size={15} />
            <span>{asking ? 'يفكر...' : 'اسأل'}</span>
          </button>
        </form>

        {answer && <div className="onboarding-answer">{answer}</div>}
        {error && <div className="onboarding-error">{error}</div>}

        <div className="onboarding-footer">
          <button type="button" className="onboarding-nav" disabled={index === 0} onClick={() => setIndex(value => Math.max(0, value - 1))}>
            <ArrowRight size={16} />
            <span>السابق</span>
          </button>

          {onOpenChat && (
            <button type="button" className="onboarding-chat" onClick={() => { finish(); onOpenChat('onboarding_guide'); }}>
              فتح محادثة المرشد
            </button>
          )}

          <button
            type="button"
            className="onboarding-next"
            onClick={() => (last ? finish() : setIndex(value => Math.min(guideSteps.length - 1, value + 1)))}
          >
            <span>{last ? 'ابدأ العمل' : 'التالي'}</span>
            <ArrowLeft size={16} />
          </button>
        </div>

        <p className="onboarding-note">
          الجولة لا تظهر مرة أخرى لهذا الحساب. تقدر تعيد فتح المرشد من «سوق كوادر الـ AI» في أي وقت.
        </p>
      </div>
    </div>
  );
}
