export interface SecuritySystem {
  id: string;
  name: string;
  category: 'anti_fraud' | 'network' | 'card_verification' | 'geo' | 'rate_limit';
  description: string;
  whatItDoes: string;
  consequencesIfDisabled: string;
  consequencesIfEnabled: string;
  enabled: boolean;
  recommended: boolean;
  riskLevel: 'critical' | 'high' | 'medium';
}

export const initialSecuritySystems: SecuritySystem[] = [
  {
    id: '3ds_secure',
    name: 'بروتوكول 3D Secure 2.0 (OTP والتحقق البنكي)',
    category: 'card_verification',
    description: 'إلزام التحقق بخطوتين عبر رسالة SMS ورمز OTP من البنك المصدر للبطاقة.',
    whatItDoes: 'يوجّه العميل لصفحة البنك المصدر للتأكيد عبر رمز سري لضمان هوية صاحب البطاقة.',
    consequencesIfDisabled: 'خطر عمليات احتيال وسرقة بطاقات عالية، وتحمل التاجر مسؤولية المبالغ المستردة (Chargeback Liability) بالكامل.',
    consequencesIfEnabled: 'حماية قصوى ونقل مسؤولية الاحتيال للبنك المصدر، وتقليل عمليات رد المبالغ بنسبة 99%.',
    enabled: true,
    recommended: true,
    riskLevel: 'critical',
  },
  {
    id: 'avs_address_check',
    name: 'نظام التحقق من العنوان ومطابقة الرمز البريدي (AVS)',
    category: 'card_verification',
    description: 'مطابقة العنوان والرمز البريدي المدخل مع بيانات الملف المصرفي لصاحب البطاقة.',
    whatItDoes: 'يرسل الرمز البريدي وعنوان الشارع للبنك ويتحقق من مطابقة السجل الائتماني.',
    consequencesIfDisabled: 'قبول بطاقات مسروقة دولية يتم استخدامها من قبل أطراف ثالثة دون التحقق من العنوان.',
    consequencesIfEnabled: 'حظر البطاقات التي لا يتطابق عنوان صاحبها، وتقليل الشراء العشوائي بالبطاقات الأجنبية.',
    enabled: true,
    recommended: true,
    riskLevel: 'high',
  },
  {
    id: 'geo_ip_mismatch',
    name: 'درع فحص تطابق الموقع الجغرافي والدولة (Geo-IP & BIN Match)',
    category: 'geo',
    description: 'مطابقة عنوان IP الفعلي للعميل مع دولة إصدار البطاقة البنكية (BIN).',
    whatItDoes: 'يقارن موقع جهاز المشتري (IP Geolocation) مع دولة البنك المصدر للبطاقة لتفادي التحايل.',
    consequencesIfDisabled: 'إمكانية استخدام بطاقات صادرة في أمريكا أو أوروبا من شبكات داخل دول أخرى دون تدقيق.',
    consequencesIfEnabled: 'رفض أو وضع العمليات المشبوهة تحت المراجعة التلقائية فور اختلاف بلد الاتصال عن بلد البطاقة.',
    enabled: true,
    recommended: true,
    riskLevel: 'high',
  },
  {
    id: 'proxy_vpn_blocker',
    name: 'حاظر شبكات الـ VPN ومحولات البروكسي المشبوهة (VPN/Tor Filter)',
    category: 'network',
    description: 'كشف عناوين IP التابعة لشبكات الخوادم الافتراضية VPN، وعقد Tor ومراكز البيانات.',
    whatItDoes: 'يفحص اتصال العميل في الوقت الفعلي ويكشف خوادم الأنفاق والبروكسي المجهولة.',
    consequencesIfDisabled: 'يسمح للمحتالين بإخفاء موقعهم الحقيقي ومحاكاة الشراء من داخل الدولة.',
    consequencesIfEnabled: 'منع محاولات إخفاء الهوية وإلزام العميل باستخدام شبكة اتصالات حقيقية (Residential IP).',
    enabled: false,
    recommended: false,
    riskLevel: 'medium',
  },
  {
    id: 'velocity_rate_limit',
    name: 'نظام مراقبة سرعة وتكرار المحاولات (Velocity & Anti-Testing Guard)',
    category: 'rate_limit',
    description: 'رصد تكرار محاولات الدفع السريعة وحظر تجربة البطاقات الآلية (Carding Attacks).',
    whatItDoes: 'يقيد عدد المحاولات لكل بطاقة أو IP أو عنوان بريد (حد أقصى 3 محاولات خلال 10 دقائق).',
    consequencesIfDisabled: 'تعرض البوابة لهجمات التخمين الآلي واختبار آلاف البطاقات المسروقة مما يؤدي لتعليق الحساب البنكي.',
    consequencesIfEnabled: 'تجميد فوري لأي نشاط آلي مشبوه وحماية رصيد وسجل التاجر لدى البوابة.',
    enabled: true,
    recommended: true,
    riskLevel: 'critical',
  },
  {
    id: 'device_fingerprint',
    name: 'نظام بصمة الجهاز المتقدمة (Device Fingerprinting & Bot Guard)',
    category: 'anti_fraud',
    description: 'إنشاء هوية رقمية فريدة للمتصفح ونظام التشغيل والجهاز لمنع البرمجيات الخبيثة.',
    whatItDoes: 'يحلل إعدادات الشاشة والمتصفح والـ WebGL لكشف برامج الأتمتة والمتصفحات الخفية (Headless Chrome).',
    consequencesIfDisabled: 'صعوبة تتبع المحتال عند تغيير الـ IP أو مسح ملفات تعريف الارتباط Cookies.',
    consequencesIfEnabled: 'التعرف على نفس الجهاز حتى لو غيّر شبكة الإنترنت، وحظر الأجهزة المسجلة في القوائم السوداء.',
    enabled: true,
    recommended: true,
    riskLevel: 'high',
  },
  {
    id: 'cvv_mandatory_check',
    name: 'إلزامية التحقق من رمز الأمان الثلاثي (CVV / CVC2 Match)',
    category: 'card_verification',
    description: 'التحقق الصارم من الأرقام الثلاثة خلف البطاقة وتصفير المعاملات غير المؤكدة.',
    whatItDoes: 'يرسل رمز CVV للبنك للتأكد من حيازة المشتري للبطاقة البلاستيكية الفعلية.',
    consequencesIfDisabled: 'مرور المعاملات بالأرقام المسربة فقط دون رمز الحماية، وارتفاع هائل في مخاطر الاحتيال.',
    consequencesIfEnabled: 'حظر أي محاولة دفع فوراً إذا كان رمز CVV خاطئاً أو غير متطابق بنسبة 100%.',
    enabled: true,
    recommended: true,
    riskLevel: 'critical',
  },
  {
    id: 'amount_anomaly_detector',
    name: 'محلل شذوذ المبالغ وسلوك المشتري (AI Smart Risk Scoring)',
    category: 'anti_fraud',
    description: 'فحص ذكاء اصطناعي يقارن قيمة الشراء مع متوسط سلة المشتريات والتوقيت.',
    whatItDoes: 'يمنح كل عملية تقييماً رقمياً للمخاطر (من 0 إلى 100) ويوقف الطلبات الشاذة ذات المبالغ غير الطبيعية.',
    consequencesIfDisabled: 'تمرير مبالغ ضخمة غير متوقعة دون تدقيق مسبق من الذكاء الاصطناعي.',
    consequencesIfEnabled: 'تنبيه التاجر أو تحويل المعاملات المشبوهة لفحص يدوي قبل تأكيد حجز المبلغ.',
    enabled: true,
    recommended: true,
    riskLevel: 'medium',
  },
];
