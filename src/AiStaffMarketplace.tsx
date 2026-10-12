import { useState } from 'react';
import {
  Bot, Check, Sparkles, MessageSquare, Briefcase, Zap,
  CheckCircle2, Send, Clock, DollarSign, Star, Shield, ArrowRight,
  TrendingUp, Code, Calculator, UserCheck, Play, Award
} from 'lucide-react';
import './AiStaffMarketplace.css';

interface AiEmployee {
  id: string;
  name: string;
  role: string;
  arabicRole: string;
  avatar: string;
  priceMonthly: number;
  isFreeTier: boolean;
  tagline: string;
  experienceLevel: string;
  skills: string[];
  capabilities: string[];
  defaultPrompt: string;
  sampleResponses: { prompt: string; reply: string }[];
}

const AI_EMPLOYEES: AiEmployee[] = [
  {
    id: 'customer_care',
    name: 'سارة العتيبي (AI)',
    role: 'Customer Care Specialist',
    arabicRole: 'أخصائية خدمة العملاء والدعم الفوري',
    avatar: '👩‍💼',
    priceMonthly: 0,
    isFreeTier: true,
    tagline: 'تجربة حقيقية مجانية 100% — الرد الفوري على استفسارات عملائك وحل مشاكل الدفع والسلات 24/7 دون توقف.',
    experienceLevel: 'خبير دعم متاجر رقمية (مستوى متقدم)',
    skills: ['حل مشاكل فشل الدفع', 'تتبع الشحنات والفواتير', 'الرد اللبق باللهجة السعودية والخليجية', 'سياسات الاسترجاع والضمان'],
    capabilities: [
      'الرد على رسائل استفسارات العملاء في أقل من ثانية',
      'فحص أكواد أخطاء الدفع وطمأنة العميل فوراً',
      'إرشاد العميل خطوة بخطوة لإتمام العملية بنجاح'
    ],
    defaultPrompt: 'أهلاً سارة، عميل يقول عمليتي رُفضت برمز 20014، ماذا أرد عليه؟',
    sampleResponses: [
      {
        prompt: 'عميل يقول عمليتي رُفضت برمز 20014، ماذا أرد عليه؟',
        reply: 'أهلاً بك يا غالي! مرحباً بك في متجرنا. رمز 20014 يعني عادةً عدم تطابق الدولة بين الاتصال وجهة إصدار البطاقة أو تفعيل شرط أمان إضافي. يسعدنا اقتراح: التأكد من إيقاف برامج الـ VPN، أو استخدام بطاقة مدى محلية، أو تجربة الدفع السريع عبر Apple Pay. نحن معك حتى إتمام طلبك بكل يسر!'
      },
      {
        prompt: 'كيف يطلب العميل استرجاع الفاتورة؟',
        reply: 'حياك الله! لإتمام الاسترجاع بكل سهولة: نطلب من العميل تزويدنا برقم الفاتورة أو مرجع العملية البنكية، ويتم التحقق ومطابقتها فوراً عبر لوحة التحكم لإرجاع المبلغ لنفس البطاقة خلال 2-5 أيام عمل بنكية.'
      }
    ]
  },
  {
    id: 'social_marketer',
    name: 'فيصل الغامدي (AI)',
    role: 'Digital Ads & Social Media Director',
    arabicRole: 'مدير التسويق الرقمي وإعلانات السوشيال ميديا',
    avatar: '📈',
    priceMonthly: 149,
    isFreeTier: false,
    tagline: 'خبير الحملات البيعية على تيك توك وسناب شات وإنستغرام — كتابة إعلانات تجلب مبيعات خيالية وتضاعف الـ ROAS.',
    experienceLevel: 'خبير إعلانات ونمو تجاري (7+ سنوات محاكاة)',
    skills: ['كتابة نصوص إعلانات مقنعة (Copywriting)', 'إعداد خطط إعلانات تيك توك وسناب', 'استهداف الجماهير الخليجية', 'تحليل تكلفة الاكتساب CPA'],
    capabilities: [
      'توليد خطة إعلانية شهرية متكاملة لمنتجاتك',
      'كتابة سيناريوهات فيديو تيك توك وسناب جذابة ترفع التحويل',
      'تقديم أفكار عروض ترويجية وزيادة السلة المتوسطة (AOV)'
    ],
    defaultPrompt: 'اكتب لي خطة إطلاق حملة تخفيضات نهاية الأسبوع لمتجري.',
    sampleResponses: [
      {
        prompt: 'اكتب لي خطة إطلاق حملة تخفيضات نهاية الأسبوع لمتجري.',
        reply: 'خطة إطلاق نهاية الأسبوع جاهزة! 1) سناب شات: فيديو افتتاحي بمشكلة وحل مع كود خصم خاص ينتهي خلال 48 ساعة. 2) تيك توك: هوك بصري خلال أول 3 ثوانٍ يبرز جودة وسرعة التوصيل مع زر الشراء المباشر. 3) إرسال إشعار تذكيري عبر الواتساب للسلات المتروكة في الساعة الأخيرة من العرض.'
      }
    ]
  },
  {
    id: 'ecommerce_dev',
    name: 'طارق الدوسري (AI)',
    role: 'E-Commerce Dev & Webhook Engineer',
    arabicRole: 'مهندس البرمجة وربط المتاجر والـ APIs',
    avatar: '💻',
    priceMonthly: 289,
    isFreeTier: false,
    tagline: 'مبرمج متجرك المتفرغ — كتابة كود الربط، إعداد الـ Webhooks، وحل جميع التعارضات التقنية لبوابات الدفع بلحظات.',
    experienceLevel: 'مهندس نظم مدفوعات وبرمجيات سحابية',
    skills: ['ربط سلة وزد وShopify', 'أكواد Webhooks وIPN Verification', 'REST API وNode.js وPHP', 'أمن الشهادات وSSL'],
    capabilities: [
      'توليد أكواد استقبال وتأكيد إشعارات الدفع جاهزة للنسخ',
      'فحص مشاكل الربط البرمجي بين المتجر والبوابة فوراً',
      'تشفير المفاتيح والتحقق من التوقيع الرقمي (Signature Hash)'
    ],
    defaultPrompt: 'أحتاج كود PHP سريع للتحقق من إشعار Webhook لبوابة PayTabs.',
    sampleResponses: [
      {
        prompt: 'أحتاج كود PHP سريع للتحقق من إشعار Webhook لبوابة PayTabs.',
        reply: 'إليك الكود المعتمد لفحص الويب هوك: نقوم بقراءة raw POST payload، وحساب sha256 HMAC باستخدام SERVER_KEY، ثم مقارنته مع ترويسة Signature. إذا تطابق يتم تحديث حالة الطلب إلى PAID فوراً بدون أي تأخير.'
      }
    ]
  },
  {
    id: 'tax_accountant',
    name: 'عبدالرحمن القحطاني (AI)',
    role: 'Financial Auditor & ZATCA Tax Specialist',
    arabicRole: 'المحاسب المالي ومدقق الضرائب والفواتير',
    avatar: '📊',
    priceMonthly: 199,
    isFreeTier: false,
    tagline: 'مطابقة دقيقة لكل هللة — مطابقة تسويات البنوك، احتساب رسوم بوابات الدفع، وإعداد إقرارات هيئة الزكاة والضريبة ZATCA.',
    experienceLevel: 'محاسب قانوني ومدقق مالي رقمي',
    skills: ['مطابقة التسويات البنكية', 'إقرارات ضريبة القيمة المضافة 15%', 'حساب تكلفة العمليات وهوامش الربح', 'فصل رسوم مدى والفيزا'],
    capabilities: [
      'استخراج ملخص شهري لصافي المبيعات بعد خصم عمولات البوابات',
      'فصل ضريبة القيمة المضافة ZATCA تلقائياً من كل فاتورة',
      'كشف أي فروقات مالية أو مبالغ معلقة لدى البنوك'
    ],
    defaultPrompt: 'كيف احتسب عمولة بوابة الدفع لعملية بمبلغ 500 ريال ببطاقة مدى؟',
    sampleResponses: [
      {
        prompt: 'كيف احتسب عمولة بوابة الدفع لعملية بمبلغ 500 ريال ببطاقة مدى؟',
        reply: 'الحسبة الدقيقة: عمولة مدى القياسية 1.0% + 1 ريال + ضريبة 15% على العمولة. على 500 ريال: العمولة الأساسية = 5 + 1 = 6 ر.س. ضريبة العمولة = 0.90 ر.س. إجمالي المخصوم = 6.90 ر.س. الصافي المودع في حسابك = 493.10 ر.س.'
      }
    ]
  },
  {
    id: 'fraud_officer',
    name: 'سلطان الحربي (AI)',
    role: 'Fraud Prevention & Risk Analyst',
    arabicRole: 'ضابط مكافحة الاحتيال وحماية المدفوعات',
    avatar: '🛡️',
    priceMonthly: 249,
    isFreeTier: false,
    tagline: 'حائط صد منيع ضد النصب وعمليات الاسترجاع (Chargebacks) — فحص البطاقات المشبوهة والـ BIN وحماية أرباحك.',
    experienceLevel: 'أخصائي أمن مدفوعات وتحليل مخاطر',
    skills: ['خفض نسب النزاعات البنكية لصفر', 'كشف هجمات تجربة البطاقات Card Testing', 'فحص الـ IP والـ Proxy المشبوه', 'مراقبة الشحنات العالية الخطورة'],
    capabilities: [
      'تقييم نسبة الخطورة (Risk Score) لكل طلب قبل الشحن',
      'حظر العناوين المشبوهة تلقائياً',
      'إعداد ملفات الدفاع القانونية في حال حدوث نزاع بنكي'
    ],
    defaultPrompt: 'كيف أحمي متجري من هجمات Card Testing في منتصف الليل؟',
    sampleResponses: [
      {
        prompt: 'كيف أحمي متجري من هجمات Card Testing في منتصف الليل؟',
        reply: 'الخطة الوقائية الفورية: 1) تفعيل محدد وتيرة البطاقات (Card Velocity Limiter) بحيث تُحظر أي بطاقة تفشل مرتين متتاليتين. 2) وضع حد أدنى للطلب لا يقل عن 15 ريال لمنع تجارب الهللات. 3) تفعيل كابتشا خفية (reCAPTCHA v3) عند صفحة الدفع. بذلك يتم صد 100% من البوتات.'
      }
    ]
  },
  {
    id: 'sales_closer',
    name: 'نورة الشمري (AI)',
    role: 'Sales Closer & Abandoned Cart Specialist',
    arabicRole: 'أخصائية المبيعات واستعادة السلات المتروكة',
    avatar: '🎯',
    priceMonthly: 179,
    isFreeTier: false,
    tagline: 'لا تترك أي عميل يغادر دون شراء — متابعة ذكية لروابط الدفع المتروكة عبر رسائل مقنعة ترفع مبيعاتك بنسبة 35%.',
    experienceLevel: 'أخصائية إغلاق صفقات ومبيعات استشارية',
    skills: ['استعادة السلات المتروكة', 'إعادة استهداف العملاء المترددين', 'صياغة رسائل واتساب تفاعلية', 'زيادة متوسط قيمة الطلب AOV'],
    capabilities: [
      'إرسال رسائل استرداد ذكية للعميل الذي توقف عند صفحة الدفع',
      'تقديم حوافز فورية مجدولة زمنياً (خصم 5% صالح لمدة ساعتين)',
      'تحليل أسباب تردد العملاء وتقديم حلول تحفيزية'
    ],
    defaultPrompt: 'اكتبي لي رسالة واتساب مقنعة لعميل ترك سلة بقيمة 400 ريال.',
    sampleResponses: [
      {
        prompt: 'اكتبي لي رسالة واتساب مقنعة لعميل ترك سلة بقيمة 400 ريال.',
        reply: 'مرحباً [اسم العميل] يا غالي! لاحظنا أنك نسيت منتجاتك المميزة في السلة. لأنك عزيز علينا وودنا تسعد بتجربتك، جهزنا لك توصيل مجاني وكود خصم إضافي [SAVE10] متاح حتى نهاية اليوم. تفضل رابط سلتك المحفوظة بضغطة زر: [الرابط]. ودمت بخير!'
      }
    ]
  }
];

export default function AiStaffMarketplace() {
  const [hiredStaff, setHiredStaff] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('oneshot_hired_ai_staff');
      return saved ? JSON.parse(saved) : ['customer_care']; // Customer care hired by default (free!)
    } catch {
      return ['customer_care'];
    }
  });

  const [activeChatStaffId, setActiveChatStaffId] = useState<string>('customer_care');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: 'أهلاً بك يا مدير! أنا سارة، موظفة خدمة العملاء الخاصة بمتجرك. أنا جاهزة الآن للرد على عملائك وحل مشاكل الدفع والسلات. جرب تسألني أي سؤال عن المدفوعات أو المتاجر وسأجيبك فوراً!',
      time: 'الآن'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hiringSuccessNotice, setHiringSuccessNotice] = useState<string | null>(null);

  const activeEmployee = AI_EMPLOYEES.find(e => e.id === activeChatStaffId) || AI_EMPLOYEES[0];

  const handleHire = (employee: AiEmployee) => {
    let updated: string[];
    if (hiredStaff.includes(employee.id)) {
      if (employee.id === 'customer_care') {
        alert('موظف خدمة العملاء مجاني ومفعل دائماً في متجرك لمساعدتك!');
        return;
      }
      updated = hiredStaff.filter(id => id !== employee.id);
      setHiringSuccessNotice(`تم إنهاء عقد الموظف ${employee.name}.`);
    } else {
      updated = [...hiredStaff, employee.id];
      setHiringSuccessNotice(`تهانينا! تم توظيف ${employee.name} (${employee.arabicRole}) بنجاح وإضافته إلى طاقم عمل متجرك!`);
    }

    setHiredStaff(updated);
    try {
      localStorage.setItem('oneshot_hired_ai_staff', JSON.stringify(updated));
    } catch {}
    setTimeout(() => setHiringSuccessNotice(null), 3500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userText = userInput.trim();
    setUserInput('');
    const nowTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: nowTime }]);
    setIsTyping(true);

    setTimeout(() => {
      // Find matching sample response or intelligent contextual response
      const matched = activeEmployee.sampleResponses.find(sr =>
        userText.includes(sr.prompt) || sr.prompt.includes(userText)
      );

      let reply = matched ? matched.reply : '';
      if (!reply) {
        if (activeEmployee.id === 'customer_care') {
          reply = `أهلاً بك يا غالي! بخصوص سؤالك: "${userText}"، نحرص في المتجر على تقديم أسرع تجربة سلسة. تم تسجيل الملاحظة وسنقوم بالتحقق من حالة طلبك أو فاتورتك فوراً لضمان رضاك التام!`;
        } else if (activeEmployee.id === 'social_marketer') {
          reply = `تحليل تسويقي مميز! بخصوص "${userText}"، أنصحك بالتركيز على إبراز الميزة التنافسية في أول 3 ثوانٍ من الفيديو واستخدام عبارة تحفيزية (Call to Action) واضحة تنقل العميل مباشرة لرابط الدفع.`;
        } else if (activeEmployee.id === 'ecommerce_dev') {
          reply = `من الناحية البرمجية لـ "${userText}"، يمكنك إرسال الطلب عبر HTTPS POST مع ترويسة Authorization المناسبة، والتأكد من إرجاع HTTP 200 OK للويب هوك لمنع تكرار الإشعارات.`;
        } else {
          reply = `بصفتي ${activeEmployee.arabicRole}، درست استفسارك بعناية: "${userText}". تم تجهيز التوصية الإدارية الدقيقة لحماية هوامش الربح واستقرار التدفق المالي لمتجرك!`;
        }
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: reply, time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) }]);
      setIsTyping(false);
    }, 800);
  };

  const handleSelectStaffForChat = (employee: AiEmployee) => {
    setActiveChatStaffId(employee.id);
    setChatMessages([
      {
        sender: 'ai',
        text: `مرحباً بك! أنا ${employee.name} (${employee.arabicRole}). أنا في خدمتك الآن، تفضل بسؤالي عن أي شيء يخص مجالي وسأجيبك باحترافية!`,
        time: 'الآن'
      }
    ]);
  };

  return (
    <div className="ai-staff-marketplace">
      {/* Mega Marketing Banner */}
      <section className="marketplace-mega-hero">
        <div className="mega-hero-badge">
          <Sparkles size={16} />
          <span>عصر الـ AI — موظفون أذكياء جاهزون، بدون رواتب وبدون عقود</span>
        </div>

        <h1 className="mega-hero-title">
          عصر الـ AI: وظّف موظفين أذكياء، وادفع عن كل نموذج تستخدمه فقط.
        </h1>

        <p className="mega-hero-subtitle">
          بدون رواتب شهرية وبدون إدارة معقّدة: <strong>فريق كامل من كوادر الذكاء الاصطناعي المتخصصة</strong>
          {' '}— دعم عملاء، مسوّق، مبرمج، ومحاسب قانوني، يشتغلون معك 24/7. شغّل اللي تحتاجه وقت ما تحتاجه، وادفع عن كل موديل تستخدمه فقط.
        </p>

        <div className="mega-hero-metrics">
          <div className="hero-metric-item">
            <strong>0 ر.س</strong>
            <span>خدمة عملاء مجانية للتجربة الحقيقية</span>
          </div>
          <div className="hero-metric-item">
            <strong>100%</strong>
            <span>جاهزية وتجاوب فوري على مدار الساعة</span>
          </div>
          <div className="hero-metric-item">
            <strong>6 كوادر</strong>
            <span>تغطي كل احتياجات متجرك من الألف للياء</span>
          </div>
          <div className="hero-metric-item">
            <strong>بنقرة واحدة</strong>
            <span>توظيف فوري بدون مقابلات ولا تعقيدات</span>
          </div>
        </div>
      </section>

      {hiringSuccessNotice && (
        <div className="hiring-alert-banner" role="status">
          <CheckCircle2 size={20} />
          <span>{hiringSuccessNotice}</span>
        </div>
      )}

      {/* Main Layout: Catalog on Left, Live Interactive Trial Chamber on Right */}
      <div className="marketplace-layout-grid">
        {/* Left Column: AI Staff Cards */}
        <div className="staff-catalog-column">
          <div className="column-section-heading">
            <Briefcase size={20} />
            <div>
              <h2>كوادر الذكاء الاصطناعي المتاحة للتوظيف</h2>
              <p>اختر الموظف المناسب لطبيعة متجرك، وجربه مباشرة أو وظفه فوراً في طاقمك.</p>
            </div>
          </div>

          <div className="staff-cards-grid">
            {AI_EMPLOYEES.map(employee => {
              const isHired = hiredStaff.includes(employee.id);
              const isActiveInChat = activeChatStaffId === employee.id;

              return (
                <div
                  key={employee.id}
                  className={`staff-card ${isHired ? 'is-hired' : ''} ${isActiveInChat ? 'is-active-chat' : ''}`}
                >
                  {employee.isFreeTier && (
                    <div className="free-tier-ribbon">
                      <Star size={12} /> باقة مجانية دائمة للتجربة
                    </div>
                  )}

                  <div className="staff-card-header">
                    <div className="staff-avatar-box">
                      <span className="staff-avatar-emoji">{employee.avatar}</span>
                      {isHired && <span className="hired-status-dot" title="موظف نشط في متجرك" />}
                    </div>

                    <div className="staff-info-meta">
                      <div className="staff-name-row">
                        <h3>{employee.name}</h3>
                        {isHired && <span className="hired-badge"><UserCheck size={13} /> موظف في متجرك</span>}
                      </div>
                      <span className="staff-role-badge">{employee.arabicRole}</span>
                      <small className="staff-level">{employee.experienceLevel}</small>
                    </div>

                    <div className="staff-pricing-box">
                      {employee.isFreeTier ? (
                        <div className="price-free">
                          <span className="price-num">مجاناً</span>
                          <span className="price-term">مدى الحياة</span>
                        </div>
                      ) : (
                        <div className="price-paid">
                          <span className="price-num">{employee.priceMonthly}</span>
                          <span className="price-currency">ر.س</span>
                          <span className="price-term">/ شهرياً</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="staff-tagline">{employee.tagline}</p>

                  <div className="staff-skills-chips">
                    {employee.skills.map(skill => (
                      <span key={skill} className="skill-chip">{skill}</span>
                    ))}
                  </div>

                  <div className="staff-capabilities-list">
                    <strong>أبرز المهام التي سينفذها لمتجرك:</strong>
                    <ul>
                      {employee.capabilities.map((cap, idx) => (
                        <li key={idx}>
                          <Check size={14} className="check-icon" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="staff-card-actions">
                    <button
                      type="button"
                      className={`try-live-btn ${isActiveInChat ? 'active' : ''}`}
                      onClick={() => handleSelectStaffForChat(employee)}
                    >
                      <MessageSquare size={15} />
                      <span>تجربة الموظف الآن (Live Chat)</span>
                    </button>

                    <button
                      type="button"
                      className={`hire-toggle-btn ${isHired ? 'btn-hired' : 'btn-hire'}`}
                      onClick={() => handleHire(employee)}
                    >
                      {isHired ? (
                        <>
                          <CheckCircle2 size={15} />
                          <span>{employee.isFreeTier ? 'مفعّل دائماً' : 'إلغاء التوظيف'}</span>
                        </>
                      ) : (
                        <>
                          <Zap size={15} />
                          <span>توظيف الموظف فوراً</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Testing Chamber & Chat Simulator */}
        <div className="staff-chat-column">
          <div className="chat-station-card">
            <div className="chat-station-header">
              <div className="chat-staff-profile">
                <span className="station-avatar">{activeEmployee.avatar}</span>
                <div>
                  <h4>محادثة واختبار الموظف: {activeEmployee.name}</h4>
                  <small>{activeEmployee.arabicRole} · {activeEmployee.isFreeTier ? 'باقة مجانية 100%' : `${activeEmployee.priceMonthly} ر.س / شهرياً`}</small>
                </div>
              </div>

              <div className="station-live-badge">
                <span className="live-dot" /> متصل وجاهز للعمل
              </div>
            </div>

            <div className="chat-trial-note">
              <Sparkles size={16} />
              <span>
                اختبر ذكاء وسرعة الموظف أمام عينيك! اكتب أي استفسار أو مهمة ترغب في أن ينجزها لمتجرك وشاهد كيف يجيبك.
              </span>
            </div>

            {/* Messages Feed */}
            <div className="chat-messages-container">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message-bubble ${msg.sender === 'user' ? 'msg-user' : 'msg-ai'}`}>
                  <div className="bubble-header">
                    <span className="bubble-sender">{msg.sender === 'user' ? 'التاجر (أنت)' : activeEmployee.name}</span>
                    <span className="bubble-time">{msg.time}</span>
                  </div>
                  <p className="bubble-text">{msg.text}</p>
                </div>
              ))}

              {isTyping && (
                <div className="typing-indicator">
                  <span>{activeEmployee.name} يكتب الرد الآن...</span>
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="quick-prompts-row">
              <span className="quick-label">أسئلة تجريبية سريعة:</span>
              <button
                type="button"
                className="prompt-chip-btn"
                onClick={() => setUserInput(activeEmployee.defaultPrompt)}
              >
                {activeEmployee.defaultPrompt}
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="chat-input-bar">
              <input
                type="text"
                placeholder={`اكتب رسالة أو استفساراً لـ ${activeEmployee.name}...`}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
              />
              <button type="submit" disabled={!userInput.trim() || isTyping}>
                <Send size={16} />
                <span>إرسال</span>
              </button>
            </form>

            <div className="chat-contract-footer">
              <Shield size={14} />
              <span>
                جميع الموظفين مشفرون بالكامل ولا يشاركون بيانات عملائك أو مبيعاتك خارج نطاق متجرك الخاص.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
