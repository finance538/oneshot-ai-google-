export interface FeatureProperty {
  id: string;
  name: string;
  technicalKey: string;
  category: 'security' | 'gateway' | 'policy' | 'network' | 'fraud';
  shortDesc: string;
  detailedPurpose: string;
  whatHappensWhenEnabled: string;
  whatHappensWhenDisabled: string;
  securityImpactScore: 'منخفض' | 'متوسط' | 'مرتفع' | 'حرج (إلزامي)';
  supportedGateways: string[];
  bestPractices: string;
}

export const FEATURE_PROPERTIES_CATALOG: Record<string, FeatureProperty> = {
  paymentsEnabled: {
    id: 'paymentsEnabled',
    name: 'استقبال وتمرير المدفوعات (Global Payments)',
    technicalKey: 'policy.paymentsEnabled',
    category: 'policy',
    shortDesc: 'المفتاح الشامل للتحكم في معالجة عمليات الدفع عبر المنصة.',
    detailedPurpose: 'يتحكم في استقبال طلبات الدفع عبر كافة البوابات الوسيطة وتمريرها للخوادم البنكية.',
    whatHappensWhenEnabled: 'تعمل جميع بوابات الدفع المرخصة بشكل طبيعي وتستقبل طلبات الشراء.',
    whatHappensWhenDisabled: 'يتم حظر أي محاولة دفع جديدة فوراً مع إرجاع رسالة صيانة بنكية، دون إيقاف الجلسات التي تم تأكيدها مسبقاً.',
    securityImpactScore: 'حرج (إلزامي)',
    supportedGateways: ['PayTabs', 'تيلر (Telr)', 'ماي فاتورة', 'تابي', 'بي زاتي', 'نون', 'بي وان'],
    bestPractices: 'يُفضل إيقافه مؤقتاً فقط أثناء الترقية الشاملة أو حدوث طوارئ بنكية حرجة.'
  },
  requestsEnabled: {
    id: 'requestsEnabled',
    name: 'إنشاء طلبات دفع وفواتير جديدة',
    technicalKey: 'policy.requestsEnabled',
    category: 'policy',
    shortDesc: 'السماح للتاجر وموظفيه بإنشاء روابط دفع مخصصة.',
    detailedPurpose: 'يتيح إصدار أوامر فواتير الشراء المستقلة وتحديد مبالغ السداد للعملاء.',
    whatHappensWhenEnabled: 'يمكن للتاجر توليد روابط دفع بريدية وروابط سريعة بمبالغ مخصصة.',
    whatHappensWhenDisabled: 'يتوقف زر إنشاء الطلبات الجديدة، وتبقى الروابط السابقة المنشأة صالحة للدفع فقط.',
    securityImpactScore: 'متوسط',
    supportedGateways: ['كافة البوابات'],
    bestPractices: 'قم بإيقافه عند مراجعة السيولة أو تحديث الحسابات التجارية للتاجر.'
  },
  openLinksEnabled: {
    id: 'openLinksEnabled',
    name: 'الروابط المفتوحة (Open Payment Links)',
    technicalKey: 'policy.openLinksEnabled',
    category: 'policy',
    shortDesc: 'روابط مرنة بدون مبالغ مسبقة يحدد فيها العميل قيمة الشراء بنفسه.',
    detailedPurpose: 'تُستخدم للتبرعات، الخدمات الحرة، والاستشارات حيث يكتب العميل المبلغ ضمن نطاق أدنى وأعلى.',
    whatHappensWhenEnabled: 'يتمكن العملاء من إدخال المبلغ بحرية ضمن الحدود المعتمدة والدفع فوراً.',
    whatHappensWhenDisabled: 'تتوقف الروابط المفتوحة لحماية المتجر من تلاعب المبالغ أو المعاملات المجهولة.',
    securityImpactScore: 'مرتفع',
    supportedGateways: ['PayTabs', 'Telr'],
    bestPractices: 'حدد دائماً حداً أدنى وأعلى واقعيين لتفادي تجارب الاحتيال بمبالغ صغيرة (Card Testing).'
  },
  aiEnabled: {
    id: 'aiEnabled',
    name: 'مساعد التعبئة وتحليل العمليات بالذكاء الاصطناعي',
    technicalKey: 'policy.aiEnabled',
    category: 'policy',
    shortDesc: 'تفعيل خوارزميات الذكاء الاصطناعي لتشخيص المعاملات وتعبئة البيانات.',
    detailedPurpose: 'يقوم بفحص أسباب رفض العمليات البنكية، وتوليد مسودات العملاء، والتنقل بين إشعارات الويب هوك.',
    whatHappensWhenEnabled: 'يعمل المستشار الذكي لتحليل أكواد الأخطاء (مثل 20014، 3DS Failed) وتقديم حلول فورية.',
    whatHappensWhenDisabled: 'تعتمد المنصة على التحليل اليدوي المباشر للأخطاء دون توصيات استباقية من الذكاء الاصطناعي.',
    securityImpactScore: 'منخفض',
    supportedGateways: ['جميع البوابات المتصلة'],
    bestPractices: 'يُوصى بإبقائه مفعّلاً لتسريع حل مشاكل العملاء وتفادي خسارة المبيعات.'
  },
  ipSpoofing: {
    id: 'ipSpoofing',
    name: 'انتحال وتوجيه الـ IP الجغرافي (Geo IP Spoofing Engine)',
    technicalKey: 'admin.ip_spoofing',
    category: 'network',
    shortDesc: 'حقن عناوين IP جغرافية محددة في ترويسات طلبات الدفع أثناء الفحص.',
    detailedPurpose: 'اختبار مدى استجابة البوابات لحظر الدول وقيود العملات وبطاقات الدفع الإقليمية.',
    whatHappensWhenEnabled: 'يرسل الخادم عناوين X-Forwarded-For وCF-Connecting-IP محاكية للدولة المستهدفة.',
    whatHappensWhenDisabled: 'يتم إرسال عنوان IP الحقيقي الخاص بسيرفر الاستضافة في المعاملات.',
    securityImpactScore: 'مرتفع',
    supportedGateways: ['كافة البوابات في بيئة الاختبار'],
    bestPractices: 'استخدم نمط (مطابقة الـ IP مع بطاقة الدفع تلقائياً) لتفادي رفض العمليات الجغرافية.'
  },
  threeDSecure: {
    id: 'threeDSecure',
    name: 'نظام التحقق الثلاثي الآمن (3D Secure 2.2 / OTP)',
    technicalKey: 'security.three_d_secure',
    category: 'security',
    shortDesc: 'إرسال رمز تحقق سري لهاتف العميل من البنك المصدر للبطاقة.',
    detailedPurpose: 'حماية التاجر بنقل مسؤولية الاحتيال (Liability Shift) إلى البنك المصدر للبطاقة.',
    whatHappensWhenEnabled: 'يظهر للعميل مربع إدخال رمز التحقق لضمان أن حامل البطاقة هو المالك الفعلي.',
    whatHappensWhenDisabled: 'يتم خصم المبلغ بدون رمز تحقق، مما يعرض التاجر لخسارة فورية في أي نزاع مالي (Chargeback).',
    securityImpactScore: 'حرج (إلزامي)',
    supportedGateways: ['مدى Mada', 'Visa', 'Mastercard', 'AMEX'],
    bestPractices: 'لا توقف هذا النظام أبداً في بيئة الإنتاج لضمان الحماية القانونية للتاجر.'
  },
  geoIpMismatch: {
    id: 'geoIpMismatch',
    name: 'نظام مطابقة الـ IP مع دولة إصدار البطاقة (Geo-IP & BIN Consistency)',
    technicalKey: 'security.geo_ip_mismatch',
    category: 'fraud',
    shortDesc: 'مقارنة الدولة الصادرة منها البطاقة البنكية مع الدولة الحالية لاتصال العميل.',
    detailedPurpose: 'كشف البطاقات المسروقة التي يتم استخدامها عبر خوادم خارجية أو برامج بروكسي مشبوهة.',
    whatHappensWhenEnabled: 'إذا كانت البطاقة سعودية والـ IP أمريكي، يُطلب تحقق إضافي أو تُرفض المعاملة.',
    whatHappensWhenDisabled: 'تُقبل المعاملة بغض النظر عن موقع العميل الجغرافي.',
    securityImpactScore: 'مرتفع',
    supportedGateways: ['PayTabs', 'Telr', 'MyFatoorah'],
    bestPractices: 'فعّله لحماية متجرك من بطاقات الدارك ويب والعمليات المشبوهة العابرة للحدود.'
  },
  cardVelocity: {
    id: 'cardVelocity',
    name: 'محدد وتيرة تكرار العمليات (Card Velocity & Rate Limiter)',
    technicalKey: 'security.card_velocity_limit',
    category: 'fraud',
    shortDesc: 'منع تجربة البطاقات المسروقة المتكررة (Card Testing Attacks).',
    detailedPurpose: 'حظر أي بطاقة تحاول إجراء أكثر من 3 محاولات دفع فاشلة خلال دقيقة واحدة.',
    whatHappensWhenEnabled: 'يتم حظر رقم البطاقة مؤقتاً لحماية المتجر من رسوم محاولات الدفع الفاشلة.',
    whatHappensWhenDisabled: 'يتمكن المخترق من تجربة آلاف البطاقات العشوائية مما قد يؤدي لإيقاف حسابك البنكي.',
    securityImpactScore: 'حرج (إلزامي)',
    supportedGateways: ['جميع البوابات البنكية'],
    bestPractices: 'اتركه مفعلاً دائماً لحماية المتجر من غرامات البنوك المتعلقة بالـ Card Testing.'
  }
};
