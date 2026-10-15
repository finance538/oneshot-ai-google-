import { gatewayName, gatewayNames } from '../shared/policy';
// paymentFailuresData.ts
// Intelligent Failure Analytics & Programmatic Reason Categorization Engine for Payment Gateways

export type FailureCategoryId =
  | 'FRAUD_SECURITY'
  | 'FUNDS_LIMITS'
  | 'GATEWAY_BIN'
  | 'TECH_PROCESSOR'
  | 'COMPLIANCE_CONFIG';

export interface FailureCategory {
  id: FailureCategoryId;
  nameAr: string;
  nameEn: string;
  color: string;
  bgTint: string;
  borderColor: string;
  badgeClass: string;
  iconName: string;
  descriptionAr: string;
  defaultActionAr: string;
}

export const FAILURE_CATEGORIES: Record<FailureCategoryId, FailureCategory> = {
  FRAUD_SECURITY: {
    id: 'FRAUD_SECURITY',
    nameAr: 'أمان ومكافحة الاحتيال وتوثيق 3DS',
    nameEn: 'Fraud, Security & 3DS',
    color: '#ef4444', // Red / Crimson
    bgTint: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#ef4444',
    badgeClass: 'cat-fraud-security',
    iconName: 'ShieldAlert',
    descriptionAr: 'عمليات محظورة أمنياً من قبل بنك الإصدار أو محرك المخاطر أو فشل التحقق الثنائي (OTP/3DS2).',
    defaultActionAr: 'اطلب من العميل إعادة المحاولة والتأكد من إدخال رمز التحقق (OTP) الصادر من بنكه في الوقت المحدد.'
  },
  FUNDS_LIMITS: {
    id: 'FUNDS_LIMITS',
    nameAr: 'رصيد وحدود وسريان بطاقة العميل',
    nameEn: 'Customer Balance & Limits',
    color: '#f97316', // Orange / Amber
    bgTint: 'rgba(249, 115, 22, 0.12)',
    borderColor: '#f97316',
    badgeClass: 'cat-funds-limits',
    iconName: 'CreditCard',
    descriptionAr: 'الرصيد في الحساب غير كافٍ، أو تم تجاوز السقف اليومي للإنترنت، أو البطاقة منتهية الصلاحية.',
    defaultActionAr: 'إشعار العميل بلطف بأن الرصيد غير كافٍ أو يتطلب رفع حد الشراء الإلكتروني عبر تطبيق بنكه.'
  },
  GATEWAY_BIN: {
    id: 'GATEWAY_BIN',
    nameAr: 'عدم توافق البوابة وحظر الـ BIN',
    nameEn: 'Gateway & BIN Restrictions',
    color: '#8b5cf6', // Violet / Purple
    bgTint: 'rgba(139, 92, 246, 0.12)',
    borderColor: '#8b5cf6',
    badgeClass: 'cat-gateway-bin',
    iconName: 'Layers',
    descriptionAr: 'البوابة المختارة لا تدعم هذا النوع من البطاقات (مثل حظر المسبقة الدفع، أو عدم تفعيل الدفع الدولي Cross-border).',
    defaultActionAr: 'توجيه المعاملة تلقائياً إلى بوابة بديلة (Smart Failover) تدعم هذا الـ BIN بنسبة 100%.'
  },
  TECH_PROCESSOR: {
    id: 'TECH_PROCESSOR',
    nameAr: 'أعطال تقنية والمقسم البنكي',
    nameEn: 'Technical & Processor Errors',
    color: '#0ea5e9', // Blue / Sky
    bgTint: 'rgba(14, 165, 233, 0.12)',
    borderColor: '#0ea5e9',
    badgeClass: 'cat-tech-processor',
    iconName: 'ServerCrash',
    descriptionAr: 'انقطاع مؤقت في مقسم البنك المصدر (Issuer Switch Down)، انتهاء مهلة الاتصال (Timeout)، أو خطأ داخلي.',
    defaultActionAr: 'إعادة محاولة الخصم بعد دقيقتين تلقائياً دون إزعاج العميل.'
  },
  COMPLIANCE_CONFIG: {
    id: 'COMPLIANCE_CONFIG',
    nameAr: 'إعدادات حساب التاجر والامتثال',
    nameEn: 'Merchant Configuration & Compliance',
    color: '#10b981', // Emerald / Green
    bgTint: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
    badgeClass: 'cat-compliance-config',
    iconName: 'Settings',
    descriptionAr: 'إعدادات غير مكتملة في حساب التاجر لدى البوابة، تجاوز سقف المبيعات الشهري، أو عمل البوابة بوضع التجربة.',
    defaultActionAr: 'مراجعة لوحة تحكم البوابة للتأكد من حالة حساب التاجر، رفع السقف الائتماني، وتفعيل العملات المطلوبة.'
  }
};

export interface FailureReasonCode {
  code: string;
  categoryId: FailureCategoryId;
  titleAr: string;
  titleEn: string;
  rawCodes: string[];
  explanationAr: string;
  merchantFixAr: string;
  customerAdviceAr: string;
  isRecoverable: boolean;
}

export const REASON_CODES: Record<string, FailureReasonCode> = {
  INSUFFICIENT_FUNDS: {
    code: 'INSUFFICIENT_FUNDS',
    categoryId: 'FUNDS_LIMITS',
    titleAr: 'رصيد غير كافٍ في الحساب',
    titleEn: 'Insufficient Funds',
    rawCodes: ['51', '101', 'E04', 'insufficient_funds'],
    explanationAr: 'رفض البنك المصدر العملية لعدم وجود رصيد كافٍ لتغطية قيمة الفاتورة أو الرسوم البنكية المصاحبة.',
    merchantFixAr: 'أرسل للعميل رابط دفع بديل أو اقترح عليه تجزئة الفاتورة أو استخدام وسيلة دفع بديلة مثل Apple Pay أو بطاقة أخرى.',
    customerAdviceAr: 'الرصيد المتاح في بطاقتك أقل من قيمة العملية. يُرجى شحن البطاقة أو استخدام بطاقة أخرى.',
    isRecoverable: true
  },
  DAILY_LIMIT_EXCEEDED: {
    code: 'DAILY_LIMIT_EXCEEDED',
    categoryId: 'FUNDS_LIMITS',
    titleAr: 'تجاوز الحد اليومي للشراء عبر الإنترنت',
    titleEn: 'Daily Card Limit Exceeded',
    rawCodes: ['61', '102', 'limit_exceeded'],
    explanationAr: 'بطاقة العميل تفرض سقفاً يومياً للشراء الإلكتروني (E-commerce POS Limit) تم استنفاذه في هذا اليوم.',
    merchantFixAr: 'أبلغ العميل بأنه يمكنه فوراً الدخول لتطبيق بنكه ورفع حد الشراء الإلكتروني (الحد اليومي لمدى/الفيزا) ثم المحاولة.',
    customerAdviceAr: 'تم تجاوز الحد اليومي للشراء الإلكتروني لبطاقتك. يمكنك رفعه فوراً بضغطة زر من تطبيق بنكك.',
    isRecoverable: true
  },
  CARD_EXPIRED: {
    code: 'CARD_EXPIRED',
    categoryId: 'FUNDS_LIMITS',
    titleAr: 'بطاقة منتهية الصلاحية',
    titleEn: 'Expired Card',
    rawCodes: ['54', 'expired_card'],
    explanationAr: 'تاريخ الصلاحية المدخل (الشهر/السنة) منتهي أو تم إدخاله بشكل خاطئ.',
    merchantFixAr: 'اطلب من العميل إدخال البطاقة المجددة أو التأكد من إدخال سنة الصلاحية بشكل صحيح.',
    customerAdviceAr: 'تاريخ انتهاء البطاقة غير سارٍ. يُرجى التأكد من إدخال تاريخ الصلاحية المطبوع على البطاقة.',
    isRecoverable: false
  },
  INCORRECT_CVV: {
    code: 'INCORRECT_CVV',
    categoryId: 'FUNDS_LIMITS',
    titleAr: 'رمز الأمان (CVV/CVC) غير صحيح',
    titleEn: 'Incorrect Security Code',
    rawCodes: ['82', 'incorrect_cvc', 'cvv_mismatch'],
    explanationAr: 'أدخل العميل رمز الأمان المكون من 3 أرقام (أو 4 لـ AMEX) خلف البطاقة بشكل خاطئ.',
    merchantFixAr: 'نبّه العميل إلى ضرورة التحقق من الأرقام الثلاثة المطبوعة على شريط التوقيع خلف البطاقة.',
    customerAdviceAr: 'رمز الأمان (CVV) المدخل غير مطابق. يُرجى مراجعة الأرقام الثلاثة خلف البطاقة.',
    isRecoverable: true
  },
  THREEDS_AUTH_FAILED: {
    code: 'THREEDS_AUTH_FAILED',
    categoryId: 'FRAUD_SECURITY',
    titleAr: 'فشل التحقق بخطوتين (رمز OTP/3DS2)',
    titleEn: '3D Secure Authentication Failed',
    rawCodes: ['E01', '3ds_failed', 'otp_timeout', 'auth_declined'],
    explanationAr: 'لم يقم حامل البطاقة بإدخال رمز التحقق (OTP) المرسل لهاتفه، أو انتهت مهلة الإدخال، أو أدخل الرمز بشكل خاطئ.',
    merchantFixAr: 'تأكد من عدم حجب النوافذ المنبثقة لدى العميل، وشجعه على انتظار رسالة الـ SMS البنكية قبل إغلاق الصفحة.',
    customerAdviceAr: 'تعذر التحقق من رمز الأمان المرسل لجوالك. يُرجى إعادة المحاولة وإدخال الرمز خلال دقيقتين.',
    isRecoverable: true
  },
  SUSPECTED_FRAUD: {
    code: 'SUSPECTED_FRAUD',
    categoryId: 'FRAUD_SECURITY',
    titleAr: 'اشتباه احتيالي أو حظر أمني من البنك (Risk Engine)',
    titleEn: 'Suspected Fraud / High Risk Block',
    rawCodes: ['59', 'fraud_detected', 'risk_threshold_exceeded'],
    explanationAr: 'محرك مكافحة الاحتيال لدى البوابة أو بنك الإصدار قام بحظر العملية بسبب نشاط مريب، سرعة محاولات متتالية، أو موقع جغرافي عالي المخاطر.',
    merchantFixAr: 'لا تحاول تكرار الخصم فوراً لتجنب حظر حساب التاجر. اطلب من العميل التواصل مع بنكه لتأكيد الشراء أو طلب التحويل البنكي.',
    customerAdviceAr: 'قام البنك المصدر بإيقاف المعاملة كإجراء وقائي. يُرجى الاتصال بهاتف البنك المطبوع على بطاقتك لتأكيد العملية.',
    isRecoverable: false
  },
  STOLEN_OR_LOST_CARD: {
    code: 'STOLEN_OR_LOST_CARD',
    categoryId: 'FRAUD_SECURITY',
    titleAr: 'بطاقة مفقودة أو مسروقة (Pick up card)',
    titleEn: 'Stolen or Lost Card',
    rawCodes: ['41', '43', 'pickup_card', 'stolen_card'],
    explanationAr: 'البنك وضع إشارة بأن هذه البطاقة مفقودة أو مسروقة ويجب حجزها وعدم قبول أي عمليات عليها نهائياً.',
    merchantFixAr: 'احظر محاولات هذا العميل فوراً واحتفظ بالسجلات للتحقق من عدم حدوث استرداد مالي قسري (Chargeback).',
    customerAdviceAr: 'تم رفض العملية نهائياً من قبل بنك الإصدار. يُرجى مراجعة البنك المصدر فوراً.',
    isRecoverable: false
  },
  IP_COUNTRY_MISMATCH: {
    code: 'IP_COUNTRY_MISMATCH',
    categoryId: 'FRAUD_SECURITY',
    titleAr: 'تعارض دولة الـ IP مع دولة إصدار البطاقة (Geo IP Spoof)',
    titleEn: 'IP Country Mismatch / Proxy Detected',
    rawCodes: ['GEO_IP_MISMATCH', 'proxy_detected', 'vpn_block'],
    explanationAr: 'العميل يدفع من عنوان IP يتبع لدولة مختلفة عن دولة إصدار البطاقة (أو يستخدم VPN مجهول الهوية)، ما فعّل قاعدة الحظر الأمني.',
    merchantFixAr: 'اطلب من العميل إيقاف تطبيق الـ VPN أو إعادة المحاولة من اتصاله المحلي المباشر.',
    customerAdviceAr: 'يرجى إيقاف برامج الـ VPN وتغيير الموقع وإعادة الدفع عبر شبكة اتصالك العادية.',
    isRecoverable: true
  },
  BIN_BLOCKED_BY_GATEWAY: {
    code: 'BIN_BLOCKED_BY_GATEWAY',
    categoryId: 'GATEWAY_BIN',
    titleAr: 'الـ BIN محظور أو غير مدعوم على هذه البوابة',
    titleEn: 'BIN Restricted on Gateway',
    rawCodes: ['BIN_RESTRICTED', 'bin_not_allowed', 'gateway_bin_drop'],
    explanationAr: 'قواعد المخاطر لهذه البوابة تحظر هذا الـ BIN تحديداً (مثل حظر بعض البطاقات الافتراضية Neo-Banks أو بعض بطاقات السفر مسبقة الدفع).',
    merchantFixAr: 'وجّه العميل إلى بوابة أخرى تدعم هذا الـ BIN (مثل التوجيه من Telr إلى PayTabs أو العكس).',
    customerAdviceAr: 'البطاقة الحالية غير مدعومة على هذه القناة. يُرجى اختيار طريقة دفع أخرى أو استخدام بطاقة مدى.',
    isRecoverable: true
  },
  CROSS_BORDER_BLOCKED: {
    code: 'CROSS_BORDER_BLOCKED',
    categoryId: 'GATEWAY_BIN',
    titleAr: 'معاملة دولية عابرة للحدود غير مفعلة (Cross-Border)',
    titleEn: 'Cross-Border Payments Disabled',
    rawCodes: ['CROSS_BORDER_DISABLED', 'intl_cards_disallowed'],
    explanationAr: 'البطاقة صادرة من خارج الدولة، وحساب التاجر على البوابة معدّ لقبول البطاقات المحلية فقط.',
    merchantFixAr: 'قم بتمكين قبول البطاقات الدولية (International Acceptance) من لوحة تحكم البوابة أو وجّه العملية لبوابة دولية مثل Stripe أو Telr Global.',
    customerAdviceAr: 'المتجر لا يقبل البطاقات الصادرة من هذا البلد عبر هذه القناة حالياً. يرجى تجربة بطاقة محلية.',
    isRecoverable: true
  },
  CARD_TYPE_NOT_SUPPORTED: {
    code: 'CARD_TYPE_NOT_SUPPORTED',
    categoryId: 'GATEWAY_BIN',
    titleAr: 'نوع البطاقة غير مفعل (Prepaid / Virtual / Amex)',
    titleEn: 'Card Archetype Not Supported',
    rawCodes: ['PREPAID_BLOCKED', 'scheme_not_enabled'],
    explanationAr: 'البوابة ترفض بطاقات الدفع المسبق (Prepaid) أو البطاقات الرقمية أو شبكة معينة كـ AMEX أو UnionPay.',
    merchantFixAr: 'فعّل خيار البطاقات المسبقة الدفع مع مدير حسابك في البوابة أو استخدم بوابة تقبل كافة الأنواع.',
    customerAdviceAr: 'هذا النوع من البطاقات مسبقة الدفع غير مفعل على نقطة البيع هذه. يرجى استخدام بطاقة حساب مصرفي جاري.',
    isRecoverable: true
  },
  ISSUER_UNAVAILABLE: {
    code: 'ISSUER_UNAVAILABLE',
    categoryId: 'TECH_PROCESSOR',
    titleAr: 'بنك الإصدار لا يستجيب / مقسم مدى متوقف مؤقتاً',
    titleEn: 'Issuer Switch Down / Timeout',
    rawCodes: ['91', 'issuer_timeout', 'switch_offline'],
    explanationAr: 'شبكة المقسم البنكي للبنك المصدر (مثل خوادم مدى أو فيزا أو بنك الراجحي) تواجه بطئاً أو صيانة مؤقتة.',
    merchantFixAr: 'النظام سيعيد المحاولة آلياً. لا داعي لتعديل أي إعدادات برمجية، المشكلة خارج نطاق منصتك.',
    customerAdviceAr: 'البنك المصدر للبطاقة في حالة صيانة مؤقتة. يرجى إعادة المحاولة بعد بضع دقائق.',
    isRecoverable: true
  },
  GATEWAY_TIMEOUT: {
    code: 'GATEWAY_TIMEOUT',
    categoryId: 'TECH_PROCESSOR',
    titleAr: 'انتهاء مهلة البوابة (Gateway Timeout)',
    titleEn: 'Payment Gateway Timeout',
    rawCodes: ['504', 'gateway_timeout', 'connection_drop'],
    explanationAr: 'لم تتلق المنصة استجابة نهائية من البوابة خلال الإطار الزمني المحدد (30 ثانية).',
    merchantFixAr: 'يتحقق النظام آلياً من حالة الدفعة عبر الـ Webhook لتفادي خصم متكرر قبل السماح بمحاولة جديدة.',
    customerAdviceAr: 'استغرقت عملية الاتصال وقتاً أطول من المتوقع. تأكد من عدم الخصم من تطبيق بنكك قبل المحاولة مجدداً.',
    isRecoverable: true
  },
  MERCHANT_ACCOUNT_LIMIT: {
    code: 'MERCHANT_ACCOUNT_LIMIT',
    categoryId: 'COMPLIANCE_CONFIG',
    titleAr: 'تجاوز الحد الشهري أو سقف حجم المبيعات لحساب التاجر',
    titleEn: 'Merchant Volume Cap Reached',
    rawCodes: ['MERCHANT_LIMIT_EXCEEDED', 'monthly_volume_capped'],
    explanationAr: 'وصل حساب التاجر لدى البوابة للحد الأقصى المسموح به شهرياً دون ترقية الحساب.',
    merchantFixAr: 'تواصل مع البوابة لرفع سقف الحجم الشهري (Monthly Processing Volume) أو وزّع الدفعات على بوابات أخرى.',
    customerAdviceAr: 'عذراً، يرجى المحاولة في وقت لاحق أو التواصل مع إدارة المتجر لإرسال خيار دفع بديل.',
    isRecoverable: false
  },
  TEST_MODE_ACTIVE: {
    code: 'TEST_MODE_ACTIVE',
    categoryId: 'COMPLIANCE_CONFIG',
    titleAr: 'البوابة ما زالت في بيئة الاختبار (Sandbox Mode)',
    titleEn: 'Gateway in Test Mode',
    rawCodes: ['TEST_CREDENTIALS', 'sandbox_only'],
    explanationAr: 'بيانات الاعتماد للبوابة مضبوطة على وضع الاختبار ولن تقبل بطاقات حقيقية.',
    merchantFixAr: 'انتقل إلى إعدادات التاجر واستبدل مفاتيح الـ Sandbox بمفاتيح الإنتاج (Live Production Keys).',
    customerAdviceAr: 'النظام تحت التهيئة المباشرة. يرجى تجربة قناة أخرى.',
    isRecoverable: false
  }
};

export interface GatewayFailureStats {
  gatewayId: string;
  gatewayName: string;
  brandColor: string;
  logoText: string;
  totalAttempts: number;
  failedCount: number;
  failureRate: number; // e.g. 14.8%
  healthStatus: 'healthy' | 'warning' | 'critical';
  topFailureCategories: { categoryId: FailureCategoryId; count: number; percentage: number }[];
  topReasonCodes: { code: string; count: number }[];
  aiSummary: string;
}

export const GATEWAYS_FAILURE_STATS: GatewayFailureStats[] = [
  {
    gatewayId: 'telr',
    gatewayName: 'Telr (تيلر)',
    brandColor: '#ff5500',
    logoText: 'TELR',
    totalAttempts: 1240,
    failedCount: 168,
    failureRate: 13.5,
    healthStatus: 'healthy',
    topFailureCategories: [
      { categoryId: 'GATEWAY_BIN', count: 68, percentage: 40.5 },
      { categoryId: 'FUNDS_LIMITS', count: 52, percentage: 31.0 },
      { categoryId: 'FRAUD_SECURITY', count: 32, percentage: 19.0 },
      { categoryId: 'TECH_PROCESSOR', count: 16, percentage: 9.5 }
    ],
    topReasonCodes: [
      { code: 'BIN_BLOCKED_BY_GATEWAY', count: 48 },
      { code: 'INSUFFICIENT_FUNDS', count: 36 },
      { code: 'THREEDS_AUTH_FAILED', count: 24 },
      { code: 'DAILY_LIMIT_EXCEEDED', count: 16 }
    ],
    aiSummary: 'أغلب حالات الرفض في تيلر ناتجة عن حظر بطاقات مسبقة الدفع والبطاقات الافتراضية (Urpay/سفر بلس). توجيه هذه الفئة لـ PayTabs سيرفع قبولك بنسبة 28% فوراً.'
  },
  {
    gatewayId: 'paytabs',
    gatewayName: gatewayNames.paytabs,
    brandColor: '#2b78ff',
    logoText: gatewayNames.paytabs,
    totalAttempts: 2150,
    failedCount: 204,
    failureRate: 9.5,
    healthStatus: 'healthy',
    topFailureCategories: [
      { categoryId: 'FUNDS_LIMITS', count: 112, percentage: 54.9 },
      { categoryId: 'FRAUD_SECURITY', count: 46, percentage: 22.5 },
      { categoryId: 'TECH_PROCESSOR', count: 28, percentage: 13.7 },
      { categoryId: 'GATEWAY_BIN', count: 18, percentage: 8.9 }
    ],
    topReasonCodes: [
      { code: 'INSUFFICIENT_FUNDS', count: 74 },
      { code: 'DAILY_LIMIT_EXCEEDED', count: 38 },
      { code: 'THREEDS_AUTH_FAILED', count: 30 },
      { code: 'ISSUER_UNAVAILABLE', count: 18 }
    ],
    aiSummary: 'أداء ممتاز مع بطاقات مدى المحلية. معظم حالات الرفض مرتبطة برصيد العميل أو تجاوز الحد اليومي للشراء عبر الإنترنت وهي حالات استرداد سهلة عبر التذكير.'
  },
  {
    gatewayId: 'tap',
    gatewayName: 'Tap Payments (تاب)',
    brandColor: '#00c3ff',
    logoText: 'TAP',
    totalAttempts: 860,
    failedCount: 142,
    failureRate: 16.5,
    healthStatus: 'warning',
    topFailureCategories: [
      { categoryId: 'FRAUD_SECURITY', count: 58, percentage: 40.8 },
      { categoryId: 'FUNDS_LIMITS', count: 44, percentage: 31.0 },
      { categoryId: 'GATEWAY_BIN', count: 26, percentage: 18.3 },
      { categoryId: 'TECH_PROCESSOR', count: 14, percentage: 9.9 }
    ],
    topReasonCodes: [
      { code: 'IP_COUNTRY_MISMATCH', count: 32 },
      { code: 'INSUFFICIENT_FUNDS', count: 28 },
      { code: 'CROSS_BORDER_BLOCKED', count: 26 },
      { code: 'THREEDS_AUTH_FAILED', count: 26 }
    ],
    aiSummary: 'محرك المخاطر في تاب حساس جداً لاختلاف دولة عنوان الـ IP عن دولة إصدار البطاقة (Geo-IP Check). نوصي بتخفيف قواعد الـ Proxy للعملاء الموثوقين.'
  },
  {
    gatewayId: 'stripe',
    gatewayName: 'Stripe Global (سترايب)',
    brandColor: '#635bff',
    logoText: 'STRIPE',
    totalAttempts: 640,
    failedCount: 154,
    failureRate: 24.1,
    healthStatus: 'critical',
    topFailureCategories: [
      { categoryId: 'GATEWAY_BIN', count: 82, percentage: 53.2 },
      { categoryId: 'FRAUD_SECURITY', count: 38, percentage: 24.7 },
      { categoryId: 'FUNDS_LIMITS', count: 24, percentage: 15.6 },
      { categoryId: 'TECH_PROCESSOR', count: 10, percentage: 6.5 }
    ],
    topReasonCodes: [
      { code: 'CARD_TYPE_NOT_SUPPORTED', count: 52 },
      { code: 'BIN_BLOCKED_BY_GATEWAY', count: 30 },
      { code: 'SUSPECTED_FRAUD', count: 22 },
      { code: 'INSUFFICIENT_FUNDS', count: 16 }
    ],
    aiSummary: 'ارتفاع معدل الرفض بسبب محاولة تمرير بطاقات مدى محلية نقية غير مدعومة مباشرة على حساب سترايب الأجنبي. سترايب مثالي للبطاقات الدولية (Visa/Mastercard).'
  },
  {
    gatewayId: 'urway',
    gatewayName: 'Urway (يورواي)',
    brandColor: '#10b981',
    logoText: 'URWAY',
    totalAttempts: 420,
    failedCount: 52,
    failureRate: 12.4,
    healthStatus: 'healthy',
    topFailureCategories: [
      { categoryId: 'FUNDS_LIMITS', count: 28, percentage: 53.8 },
      { categoryId: 'TECH_PROCESSOR', count: 14, percentage: 26.9 },
      { categoryId: 'FRAUD_SECURITY', count: 10, percentage: 19.3 }
    ],
    topReasonCodes: [
      { code: 'INSUFFICIENT_FUNDS', count: 20 },
      { code: 'ISSUER_UNAVAILABLE', count: 10 },
      { code: 'THREEDS_AUTH_FAILED', count: 8 }
    ],
    aiSummary: 'قبول متزن وثابت لبطاقات البنوك السعودية مع سرعة تحصيل عالية وتوافق كامل مع مقسم مدى الوطني.'
  },
  {
    gatewayId: 'moyasar',
    gatewayName: 'Moyasar (ميسر)',
    brandColor: '#16a34a',
    logoText: 'MOYASAR',
    totalAttempts: 510,
    failedCount: 58,
    failureRate: 11.3,
    healthStatus: 'healthy',
    topFailureCategories: [
      { categoryId: 'FUNDS_LIMITS', count: 32, percentage: 55.2 },
      { categoryId: 'FRAUD_SECURITY', count: 16, percentage: 27.6 },
      { categoryId: 'TECH_PROCESSOR', count: 10, percentage: 17.2 }
    ],
    topReasonCodes: [
      { code: 'INSUFFICIENT_FUNDS', count: 22 },
      { code: 'DAILY_LIMIT_EXCEEDED', count: 10 },
      { code: 'THREEDS_AUTH_FAILED', count: 10 }
    ],
    aiSummary: 'ممتاز لمدى وApple Pay محلياً، معدل الرفض التقني منخفض جداً والـ Webhook فوري.'
  }
];

export interface FailureSpikeAlert {
  id: string;
  gatewayId: string;
  gatewayName: string;
  brandColor: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  timeframe: string;
  spikePercentage: number; // e.g. 168 (%)
  failureCountInWindow: number;
  normalBaselineCount: number;
  currentFailureRate: number; // e.g. 42.5 (%)
  baselineFailureRate: number; // e.g. 13.5 (%)
  primaryReasonCode: string;
  reasonDetails: FailureReasonCode;
  categoryDetails: FailureCategory;
  rawGatewayCodes: string[];
  technicalSummaryAr: string;
  programmaticDiagnosisAr: string;
  affectedBinsSample: { bin: string; label: string; count: number }[];
  sampleCardForTesting: string;
  recommendedActions: {
    id: string;
    titleAr: string;
    descriptionAr: string;
    actionType: 'auto_failover' | 'customer_broadcast' | 'risk_rule_relax' | 'inspect_card';
    targetGateway?: string;
  }[];
  status: 'active' | 'acknowledged' | 'resolved';
}

export const INITIAL_SPIKE_ALERTS: FailureSpikeAlert[] = [
  {
    id: 'alert-spike-telr-3ds',
    gatewayId: 'telr',
    gatewayName: 'Telr (تيلر)',
    brandColor: '#ff5500',
    severity: 'critical',
    timestamp: 'منذ 6 دقائق',
    timeframe: 'خلال آخر 30 دقيقة',
    spikePercentage: 168,
    failureCountInWindow: 47,
    normalBaselineCount: 17,
    currentFailureRate: 39.8,
    baselineFailureRate: 13.5,
    primaryReasonCode: 'THREEDS_AUTH_FAILED',
    reasonDetails: REASON_CODES.THREEDS_AUTH_FAILED,
    categoryDetails: FAILURE_CATEGORIES.FRAUD_SECURITY,
    rawGatewayCodes: ['E01', '3ds_failed', 'otp_timeout', 'auth_declined'],
    technicalSummaryAr: 'ارتفاع مفاجئ وحرج (+168%) في فشل إتمام التحقق بخطوتين (3D Secure Authentication Failure) مع تجاوز مهلة الـ OTP.',
    programmaticDiagnosisAr: 'تلقى نظام المراقبة 47 رفضاً برمجياً متتالياً يحمل كود الخطأ E01 (3DS Failed/Timeout). التحليل يوضح أن مزود ACS للبنك المصدر يعاني من بطء في إرسال رسائل SMS برمز التحقق أو قيام العملاء بإغلاق النافذة المنبثقة للتوثيق قبل استلام الرمز.',
    affectedBinsSample: [
      { bin: '588846', label: 'مصرف الراجحي (مدى)', count: 22 },
      { bin: '457865', label: 'الراجحي - سفر بلس (Prepaid)', count: 14 },
      { bin: '400000', label: 'Chase Bank (Visa Int.)', count: 11 }
    ],
    sampleCardForTesting: '588846',
    recommendedActions: [
      {
        id: 'act-1',
        titleAr: 'تفعيل التوجيه الذكي التلقائي (Smart Failover)',
        descriptionAr: 'تحويل العمليات المتأثرة مؤقتاً إلى PayTabs التي تمتلك مسار ACS أسرع لبطاقات مدى.',
        actionType: 'auto_failover',
        targetGateway: 'paytabs'
      },
      {
        id: 'act-2',
        titleAr: 'إشعار توعوي في واجهة الدفع',
        descriptionAr: 'تنبيه العميل بضرورة الانتظار لمدة 90 ثانية لحين وصول رسالة الـ SMS وعدم إغلاق شاشة التوثيق.',
        actionType: 'customer_broadcast'
      },
      {
        id: 'act-3',
        titleAr: 'فحص عينة بطاقة في محلل التشخيص',
        descriptionAr: 'فحص كود الاستجابة البرمجية المفصل للبطاقة المتأثرة (588846).',
        actionType: 'inspect_card'
      }
    ],
    status: 'active'
  },
  {
    id: 'alert-spike-paytabs-funds',
    gatewayId: 'paytabs',
    gatewayName: gatewayNames.paytabs,
    brandColor: '#2b78ff',
    severity: 'warning',
    timestamp: 'منذ 18 دقيقة',
    timeframe: 'خلال آخر 45 دقيقة',
    spikePercentage: 124,
    failureCountInWindow: 38,
    normalBaselineCount: 17,
    currentFailureRate: 21.3,
    baselineFailureRate: 9.5,
    primaryReasonCode: 'INSUFFICIENT_FUNDS',
    reasonDetails: REASON_CODES.INSUFFICIENT_FUNDS,
    categoryDetails: FAILURE_CATEGORIES.FUNDS_LIMITS,
    rawGatewayCodes: ['51', '101', 'E04', 'insufficient_funds'],
    technicalSummaryAr: 'زيادة مفاجئة (+124%) في حالات الرفض الناتجة عن رصيد غير كافٍ (Insufficient Funds) أو تجاوز سقف العمليات.',
    programmaticDiagnosisAr: 'أظهرت الاستجابات البرمجية كود 51 (Decline: Insufficient Funds) لـ 38 عملية شراء. هذا الارتفاع يتزامن مع إطلاق حملة التخفيضات الكبرى، حيث تتجاوز مبالغ الطلبات متوسط الرصيد المتاح في الحسابات الجارية للعملاء دون تفعيل خيار التقسيط.',
    affectedBinsSample: [
      { bin: '411111', label: 'بنك الرياض (فيزا كلاسيك)', count: 18 },
      { bin: '588845', label: 'مصرف الإنماء (مدى)', count: 12 },
      { bin: '457865', label: 'بطاقات سفر بلس الرقمية', count: 8 }
    ],
    sampleCardForTesting: '411111',
    recommendedActions: [
      {
        id: 'act-4',
        titleAr: 'تمكين حلول التقسيط وتجزئة الدفعات (BNPL)',
        descriptionAr: 'إظهار خيار تابي / تمارا أو تجزئة الفاتورة في صفحة الدفع للعملاء الذين يتعثر دفعهم بالرصيد المباشر.',
        actionType: 'customer_broadcast'
      },
      {
        id: 'act-5',
        titleAr: 'إرسال رابط استرداد تلقائي عبر واتساب / SMS',
        descriptionAr: 'إرسال رابط دفع مباشر ومبسط للعميل لإعادة المحاولة بعد تغذية رصيده أو ببطاقة بديلة.',
        actionType: 'customer_broadcast'
      },
      {
        id: 'act-6',
        titleAr: 'تشخيص البطاقة في المحلل',
        descriptionAr: 'إجراء فحص فوري على بطاقة بنك الرياض (411111).',
        actionType: 'inspect_card'
      }
    ],
    status: 'active'
  },
  {
    id: 'alert-spike-stripe-bin',
    gatewayId: 'stripe',
    gatewayName: 'Stripe Global (سترايب)',
    brandColor: '#635bff',
    severity: 'critical',
    timestamp: 'منذ 34 دقيقة',
    timeframe: 'خلال آخر ساعة',
    spikePercentage: 210,
    failureCountInWindow: 52,
    normalBaselineCount: 16,
    currentFailureRate: 48.1,
    baselineFailureRate: 24.1,
    primaryReasonCode: 'CARD_TYPE_NOT_SUPPORTED',
    reasonDetails: REASON_CODES.CARD_TYPE_NOT_SUPPORTED,
    categoryDetails: FAILURE_CATEGORIES.GATEWAY_BIN,
    rawGatewayCodes: ['CARD_TYPE_NOT_SUPPORTED', 'domestic_scheme_blocked', 'scheme_not_enabled'],
    technicalSummaryAr: 'طفرة رفض حادة (+210%) بسبب محاولة تمرير بطاقات مدى محلية نقية على بوابة سترايب غير المفعل عليها محول مدى.',
    programmaticDiagnosisAr: 'قام المتجر بتوجيه دفعة من طلبات الدفع المحلي (سعودية بنوك الإنماء والراجحي) إلى حساب سترايب الدولي. ردت البوابة برمز 402 Card Archetype Not Supported لأن شبكة Mada النقية تتطلب مقسم تحصيل محلياً.',
    affectedBinsSample: [
      { bin: '588845', label: 'مصرف الإنماء (مدى)', count: 28 },
      { bin: '588846', label: 'مصرف الراجحي (مدى)', count: 24 }
    ],
    sampleCardForTesting: '588845',
    recommendedActions: [
      {
        id: 'act-7',
        titleAr: 'تطبيق قاعدة توجيه صارمة (BIN Policy)',
        descriptionAr: 'حظر توجيه أي بطاقة تبدأ بـ 588845 أو 588846 إلى سترايب وتمريرها حصراً إلى PayTabs و Urway.',
        actionType: 'auto_failover',
        targetGateway: 'paytabs'
      },
      {
        id: 'act-8',
        titleAr: 'فحص البطاقة في أداة التشخيص',
        descriptionAr: 'اختبار بطاقة الإنماء مدى (588845) ومقارنة قبولها بين سترايب و PayTabs.',
        actionType: 'inspect_card'
      }
    ],
    status: 'active'
  },
  {
    id: 'alert-spike-tap-proxy',
    gatewayId: 'tap',
    gatewayName: 'Tap Payments (تاب)',
    brandColor: '#00c3ff',
    severity: 'warning',
    timestamp: 'منذ 52 دقيقة',
    timeframe: 'خلال آخر ساعتين',
    spikePercentage: 92,
    failureCountInWindow: 26,
    normalBaselineCount: 13,
    currentFailureRate: 28.5,
    baselineFailureRate: 16.5,
    primaryReasonCode: 'IP_COUNTRY_MISMATCH',
    reasonDetails: REASON_CODES.IP_COUNTRY_MISMATCH,
    categoryDetails: FAILURE_CATEGORIES.FRAUD_SECURITY,
    rawGatewayCodes: ['GEO_IP_MISMATCH', 'proxy_detected', 'vpn_block'],
    technicalSummaryAr: 'ارتفاع حالات حظر المعاملات (+92%) بواسطة محرك المخاطر (Geo-IP & VPN Protection) لاختلاف دولة الاتصال.',
    programmaticDiagnosisAr: 'سجلت بوابة تاب 26 عملية رفض برمجية بسبب كود GEO_IP_MISMATCH. حامل البطاقة في الخليج بينما عنوان IP جهازه يقع في ألمانيا أو هولندا بسبب تطبيقات VPN ومخفيات الهوية، ما أطلق إنذار الاشتباه الاحتيالي.',
    affectedBinsSample: [
      { bin: '542400', label: 'بنك الإمارات دبي الوطني (AE)', count: 16 },
      { bin: '519638', label: 'بنك الكويت الوطني (KW)', count: 10 }
    ],
    sampleCardForTesting: '542400',
    recommendedActions: [
      {
        id: 'act-9',
        titleAr: 'إشعار العميل بإيقاف برامج VPN',
        descriptionAr: 'تضمين رسالة تنبيهية عند حدوث الرفض تطلب من العميل إغلاق VPN والمحاولة مجدداً.',
        actionType: 'customer_broadcast'
      },
      {
        id: 'act-10',
        titleAr: 'تعديل حساسية جدار الحماية (Risk Rule Relax)',
        descriptionAr: 'السماح للعمليات التي تجتاز 3D Secure بنجاح حتى لو كان هناك اختلاف طفيف في الـ Geo-IP.',
        actionType: 'risk_rule_relax'
      }
    ],
    status: 'active'
  }
];

export function generateCustomSpikeAlert(
  gatewayId: string,
  reasonCode: string,
  spikePct: number = 150
): FailureSpikeAlert {
  const reason = REASON_CODES[reasonCode] || REASON_CODES.INSUFFICIENT_FUNDS;
  const category = FAILURE_CATEGORIES[reason.categoryId] || FAILURE_CATEGORIES.FUNDS_LIMITS;
  const gw = GATEWAYS_FAILURE_STATS.find(g => g.gatewayId === gatewayId) || GATEWAYS_FAILURE_STATS[0];

  const severity: 'critical' | 'warning' | 'info' = spikePct >= 140 ? 'critical' : 'warning';
  const rawCodes = reason.rawCodes;
  const simulatedCount = Math.round(20 * (1 + spikePct / 100));

  return {
    id: `alert-custom-${Date.now()}`,
    gatewayId: gw.gatewayId,
    gatewayName: gw.gatewayName,
    brandColor: gw.brandColor,
    severity,
    timestamp: 'الآن (مكتشف حديثاً)',
    timeframe: 'خلال آخر 15 دقيقة',
    spikePercentage: spikePct,
    failureCountInWindow: simulatedCount,
    normalBaselineCount: 18,
    currentFailureRate: Math.min(85, +(gw.failureRate * (1 + spikePct / 150)).toFixed(1)),
    baselineFailureRate: gw.failureRate,
    primaryReasonCode: reason.code,
    reasonDetails: reason,
    categoryDetails: category,
    rawGatewayCodes: rawCodes,
    technicalSummaryAr: `زيادة مفاجئة بنسبة (+${spikePct}%) في حالات الرفض على بوابة ${gw.gatewayName} بسبب: ${reason.titleAr}.`,
    programmaticDiagnosisAr: `رصد محرك التحليل الذكي زيادة فورية في الاستجابات البرمجية التي تحمل الأكواد [${rawCodes.join(', ')}]. ${reason.explanationAr}`,
    affectedBinsSample: [
      { bin: '588846', label: 'مصرف الراجحي (مدى)', count: Math.round(simulatedCount * 0.45) },
      { bin: '411111', label: 'بنك الرياض (فيزا)', count: Math.round(simulatedCount * 0.35) }
    ],
    sampleCardForTesting: '588846',
    recommendedActions: [
      {
        id: `act-custom-1`,
        titleAr: 'تفعيل التوجيه التلقائي الذكي (Smart Failover)',
        descriptionAr: `توجيه الدفعات المتعثرة بسبب ${reason.titleAr} تلقائياً إلى بوابة بديلة متوافقة.`,
        actionType: 'auto_failover',
        targetGateway: gw.gatewayId === 'telr' ? 'paytabs' : 'telr'
      },
      {
        id: `act-custom-2`,
        titleAr: 'إشعار فوري للعملاء بحل المشكلة',
        descriptionAr: reason.customerAdviceAr,
        actionType: 'customer_broadcast'
      }
    ],
    status: 'active'
  };
}

export interface DetailedFailureTransaction {
  id: string;
  transactionRef: string;
  gateway: string;
  cardMasked: string;
  bin: string;
  cardScheme: 'Mada' | 'Visa' | 'Mastercard' | 'AMEX' | 'KNET';
  cardType: 'Debit Mada' | 'Credit Classic' | 'Credit Platinum' | 'Prepaid / Travel' | 'Virtual / Neo-Bank';
  bankName: string;
  country: string;
  amount: number;
  currency: string;
  timestamp: string;
  rawErrorCode: string;
  rawErrorMessage: string;
  reasonCode: string;
  customerName: string;
  customerEmail: string;
  isRecoverable: boolean;
  aiDiagnosticNote: string;
}

export const SAMPLE_FAILURE_TRANSACTIONS: DetailedFailureTransaction[] = [
  {
    id: 'fl-101',
    transactionRef: 'TX-TELR-884910',
    gateway: 'telr',
    cardMasked: '5888 46•• •••• 4129',
    bin: '588846',
    cardScheme: 'Mada',
    cardType: 'Debit Mada',
    bankName: 'مصرف الراجحي (Al Rajhi Bank)',
    country: 'السعودية 🇸🇦',
    amount: 1450,
    currency: 'SAR',
    timestamp: '2026-10-11T11:42:10Z',
    rawErrorCode: 'E04',
    rawErrorMessage: 'Declined by Card Issuer - Insufficient Balance',
    reasonCode: 'INSUFFICIENT_FUNDS',
    customerName: 'فيصل بن حمد العتيبي',
    customerEmail: 'faisal.otaibi@example.com',
    isRecoverable: true,
    aiDiagnosticNote: 'البطاقة صالحة وبنك الراجحي استجاب فوراً؛ رصيد الحساب غير كافٍ. يمكن إرسال تذكير للعميل لإتمام الدفع بعد تغذية الرصيد.'
  },
  {
    id: 'fl-102',
    transactionRef: 'TX-TELR-884892',
    gateway: 'telr',
    cardMasked: '4578 65•• •••• 9012',
    bin: '457865',
    cardScheme: 'Mada',
    cardType: 'Prepaid / Travel',
    bankName: 'مصرف الراجحي - سفر بلس (Urpay Travel)',
    country: 'السعودية 🇸🇦',
    amount: 2800,
    currency: 'SAR',
    timestamp: '2026-10-11T11:20:45Z',
    rawErrorCode: 'BIN_RESTRICTED',
    rawErrorMessage: 'Card BIN not permitted under current merchant risk tier',
    reasonCode: 'BIN_BLOCKED_BY_GATEWAY',
    customerName: 'سارة خالد الدوسري',
    customerEmail: 'sara.aldossary@example.com',
    isRecoverable: true,
    aiDiagnosticNote: 'بوابة Telr تحظر بطاقات الـ Prepaid الافتراضية افتراضياً لحسابات التاجر المبتدئة. الحل الفوري: إعادة توجيه هذه البطاقة تلقائياً إلى PayTabs.'
  },
  {
    id: 'fl-103',
    transactionRef: 'TX-PT-901412',
    gateway: 'paytabs',
    cardMasked: '4111 11•• •••• 5530',
    bin: '411111',
    cardScheme: 'Visa',
    cardType: 'Credit Platinum',
    bankName: 'بنك الرياض (Riyad Bank)',
    country: 'السعودية 🇸🇦',
    amount: 5200,
    currency: 'SAR',
    timestamp: '2026-10-11T10:55:00Z',
    rawErrorCode: '61',
    rawErrorMessage: 'Exceeded withdrawal / e-commerce frequency limit',
    reasonCode: 'DAILY_LIMIT_EXCEEDED',
    customerName: 'محمد عبد الله الشمري',
    customerEmail: 'm.alshammari@example.com',
    isRecoverable: true,
    aiDiagnosticNote: 'البطاقة بلاتينية وسارية لكن العميل استنفد حد الشراء الإلكتروني اليومي (Daily E-Com Limit). العميل يستطيع رفع الحد من تطبيق بنك الرياض خلال 30 ثانية.'
  },
  {
    id: 'fl-104',
    transactionRef: 'TX-TAP-331098',
    gateway: 'tap',
    cardMasked: '5424 00•• •••• 7714',
    bin: '542400',
    cardScheme: 'Mastercard',
    cardType: 'Credit Classic',
    bankName: 'بنك الإمارات دبي الوطني (Emirates NBD)',
    country: 'الإمارات 🇦🇪',
    amount: 3400,
    currency: 'AED',
    timestamp: '2026-10-11T10:30:15Z',
    rawErrorCode: 'GEO_IP_MISMATCH',
    rawErrorMessage: 'Risk rule triggered: IP location (DE) does not match card issuance country (AE)',
    reasonCode: 'IP_COUNTRY_MISMATCH',
    customerName: 'طارق المنصوري',
    customerEmail: 'tariq.mansoori@example.com',
    isRecoverable: true,
    aiDiagnosticNote: 'العميل استخدم بطاقة إماراتية بينما جهازه متصل عبر خادم VPN ألماني. تم تفعيل الحظر الوقائي. الحل: الطلب من العميل إغلاق VPN والمحاولة.'
  },
  {
    id: 'fl-105',
    transactionRef: 'TX-STRP-712809',
    gateway: 'stripe',
    cardMasked: '5888 45•• •••• 1198',
    bin: '588845',
    cardScheme: 'Mada',
    cardType: 'Debit Mada',
    bankName: 'مصرف الإنماء (Alinma Bank)',
    country: 'السعودية 🇸🇦',
    amount: 750,
    currency: 'SAR',
    timestamp: '2026-10-11T09:44:22Z',
    rawErrorCode: 'CARD_TYPE_NOT_SUPPORTED',
    rawErrorMessage: 'Pure domestic debit schemes not accepted on current Stripe account',
    reasonCode: 'CARD_TYPE_NOT_SUPPORTED',
    customerName: 'نورة سليمان القحطاني',
    customerEmail: 'noura.qahtani@example.com',
    isRecoverable: true,
    aiDiagnosticNote: 'بطاقة مدى محلية ناصعة تم توجيهها لبوابة سترايب العالمية بدون تفعيل محول مدى. يجب توجيه بطاقات 588845 فورياً لـ PayTabs أو Urway.'
  },
  {
    id: 'fl-106',
    transactionRef: 'TX-TELR-884701',
    gateway: 'telr',
    cardMasked: '4000 00•• •••• 3341',
    bin: '400000',
    cardScheme: 'Visa',
    cardType: 'Credit Platinum',
    bankName: 'JPMorgan Chase Bank',
    country: 'الولايات المتحدة 🇺🇸',
    amount: 4100,
    currency: 'USD',
    timestamp: '2026-10-11T09:12:00Z',
    rawErrorCode: 'E01',
    rawErrorMessage: 'Customer failed 3DS authentication challenge (OTP abandoned)',
    reasonCode: 'THREEDS_AUTH_FAILED',
    customerName: 'Robert Vance',
    customerEmail: 'robert.v@example.com',
    isRecoverable: true,
    aiDiagnosticNote: 'العميل فتح صفحة توثيق 3DS2 لكنه أغلق المتصفح قبل إدخال الرمز السري البنكي. رابط الاسترداد التلقائي سيعيد العميل لنفس الخطوة.'
  },
  {
    id: 'fl-107',
    transactionRef: 'TX-PT-901290',
    gateway: 'paytabs',
    cardMasked: '5196 38•• •••• 8844',
    bin: '519638',
    cardScheme: 'KNET',
    cardType: 'Debit Mada',
    bankName: 'بنك الكويت الوطني (NBK Kuwait)',
    country: 'الكويت 🇰🇼',
    amount: 1800,
    currency: 'KWD',
    timestamp: '2026-10-11T08:35:10Z',
    rawErrorCode: 'CROSS_BORDER_DISABLED',
    rawErrorMessage: 'Cross-border transaction declined: KNET debit not enrolled for international processing',
    reasonCode: 'CROSS_BORDER_BLOCKED',
    customerName: 'بدر ناصر الصباح',
    customerEmail: 'bader.alsabah@example.com',
    isRecoverable: true,
    aiDiagnosticNote: 'بطاقة كي نت محلية غير مجهزة للشراء عبر الحدود بالريال السعودي. الحل: توفير دفع عبر بوابة تيلر أو تاب مع تحويل العملة للدينار الكويتي.'
  },
  {
    id: 'fl-108',
    transactionRef: 'TX-URW-441029',
    gateway: 'urway',
    cardMasked: '4578 65•• •••• 2210',
    bin: '457865',
    cardScheme: 'Mada',
    cardType: 'Debit Mada',
    bankName: 'البنك الأهلي السعودي (SNB AlAhli)',
    country: 'السعودية 🇸🇦',
    amount: 890,
    currency: 'SAR',
    timestamp: '2026-10-11T08:05:40Z',
    rawErrorCode: '91',
    rawErrorMessage: 'System error: Issuer switch response timeout (Bank Host Unreachable)',
    reasonCode: 'ISSUER_UNAVAILABLE',
    customerName: 'عبد العزيز السبيعي',
    customerEmail: 'abdulaziz.s@example.com',
    isRecoverable: true,
    aiDiagnosticNote: 'خلل اتصال مؤقت في مقسم البنك الأهلي السعودي. تمت إعادة المحاولة تلقائياً بعد 3 دقائق ونجحت العملية.'
  }
];

export interface CardDeclineDiagnosis {
  inputClean: string;
  bin: string;
  gateway: string;
  matchedCategory: FailureCategory;
  matchedReason: FailureReasonCode;
  bankName: string;
  country: string;
  scheme: string;
  cardType: string;
  isKnownBin: boolean;
  rawResponseSimulated: {
    code: string;
    message: string;
    httpStatus: number;
  };
  aiExplanation: string;
  actionableRoadmap: string[];
  suggestedCustomerMessage: string;
  recommendedAlternativeGateway: string;
  acceptanceConfidenceOnAlternative: number; // e.g. 99%
}

// Programmatic Diagnostic Engine
export function diagnoseCardDecline(
  cardOrBin: string,
  gateway: string = 'telr',
  customReasonCode?: string
): CardDeclineDiagnosis {
  const clean = cardOrBin.replace(/\D/g, '');
  const bin = clean.slice(0, 6).padEnd(6, '0');

  // Infer Bank & Details based on BIN
  let bankName = 'البنك المصدر (Issuer Bank)';
  let country = 'المملكة العربية السعودية 🇸🇦';
  let scheme = 'Mada';
  let cardType = 'Debit Mada';
  let isKnown = false;

  if (bin.startsWith('588846')) {
    bankName = 'مصرف الراجحي (Al Rajhi Bank)';
    cardType = 'Debit Mada';
    scheme = 'Mada';
    isKnown = true;
  } else if (bin.startsWith('588845')) {
    bankName = 'مصرف الإنماء (Alinma Bank)';
    cardType = 'Debit Mada';
    scheme = 'Mada';
    isKnown = true;
  } else if (bin.startsWith('457865')) {
    bankName = 'البنك الأهلي السعودي (SNB AlAhli)';
    cardType = 'Debit Mada';
    scheme = 'Mada';
    isKnown = true;
  } else if (bin.startsWith('411111') || bin.startsWith('4111')) {
    bankName = 'بنك الرياض (Riyad Bank)';
    cardType = 'Credit Platinum';
    scheme = 'Visa';
    isKnown = true;
  } else if (bin.startsWith('542400')) {
    bankName = 'بنك الإمارات دبي الوطني (Emirates NBD)';
    country = 'الإمارات العربية المتحدة 🇦🇪';
    cardType = 'Credit Classic';
    scheme = 'Mastercard';
    isKnown = true;
  } else if (bin.startsWith('400000')) {
    bankName = 'JPMorgan Chase / International Bank';
    country = 'الولايات المتحدة الأمريكية 🇺🇸';
    cardType = 'Credit Classic';
    scheme = 'Visa';
    isKnown = true;
  } else if (bin.startsWith('519638')) {
    bankName = 'بنك الكويت الوطني (NBK Kuwait)';
    country = 'دولة الكويت 🇰🇼';
    cardType = 'Debit Mada';
    scheme = 'KNET';
    isKnown = true;
  } else if (bin.startsWith('5')) {
    bankName = 'مصرف تجاري معتمد (Mastercard Partner)';
    scheme = 'Mastercard';
    cardType = 'Credit Classic';
  } else if (bin.startsWith('4')) {
    bankName = 'مصرف تجاري معتمد (Visa Partner)';
    scheme = 'Visa';
    cardType = 'Debit';
  }

  // Determine failure reason programmatically if not forced
  let reasonKey = customReasonCode;

  if (!reasonKey) {
    if (gateway === 'telr') {
      if (cardType.includes('Prepaid') || bin.startsWith('4578') || bin.startsWith('4847')) {
        reasonKey = 'BIN_BLOCKED_BY_GATEWAY';
      } else if (bin.startsWith('4000')) {
        reasonKey = 'THREEDS_AUTH_FAILED';
      } else {
        reasonKey = 'INSUFFICIENT_FUNDS';
      }
    } else if (gateway === 'stripe') {
      if (scheme === 'Mada' || scheme === 'KNET') {
        reasonKey = 'CARD_TYPE_NOT_SUPPORTED';
      } else {
        reasonKey = 'SUSPECTED_FRAUD';
      }
    } else if (gateway === 'tap') {
      if (country.includes('الإمارات') || country.includes('أمريكا')) {
        reasonKey = 'IP_COUNTRY_MISMATCH';
      } else {
        reasonKey = 'INSUFFICIENT_FUNDS';
      }
    } else {
      // PayTabs, Urway, Moyasar default
      if (bin.startsWith('4111')) {
        reasonKey = 'DAILY_LIMIT_EXCEEDED';
      } else {
        reasonKey = 'INSUFFICIENT_FUNDS';
      }
    }
  }

  const matchedReason = REASON_CODES[reasonKey] || REASON_CODES.INSUFFICIENT_FUNDS;
  const matchedCategory = FAILURE_CATEGORIES[matchedReason.categoryId];

  // Calculate best alternative gateway
  let alternativeGateway = 'paytabs';
  let altConfidence = 98;
  if (gateway === 'paytabs') {
    alternativeGateway = 'telr';
    altConfidence = 96;
  } else if (gateway === 'stripe') {
    alternativeGateway = 'paytabs';
    altConfidence = 99;
  } else if (gateway === 'telr') {
    alternativeGateway = 'paytabs';
    altConfidence = 99;
  }

  const actionSteps: string[] = [];
  if (matchedCategory.id === 'FRAUD_SECURITY') {
    actionSteps.push('أرسل للعميل رابط إعادة المحاولة مع تنبيه واضح بعدم إغلاق نافذة إدخال رمز التحقق OTP.');
    actionSteps.push('إذا كان العميل يستخدم شبكة خاصة افتراضية (VPN)، اطلب منه إيقافها والدفع من شبكة الهاتف أو الواي فاي المحلية.');
    actionSteps.push('لا تحاول تكرار الخصم أكثر من مرتين خلال 10 دقائق لتجنب تجميد حساب التاجر لدى البوابة.');
  } else if (matchedCategory.id === 'FUNDS_LIMITS') {
    actionSteps.push('السبب من جهة العميل مباشرة: الرصيد غير كافٍ أو السقف اليومي للبطاقة ممتلئ.');
    actionSteps.push('أرسل رسالة فورية لطيفة للعميل تتيح له خيار تجزئة المبلغ أو شحن الحساب.');
    actionSteps.push('وفّر له وسيلة دفع سريعة بديلة مثل Apple Pay أو STC Pay إذا كانت مفعلة لديك.');
  } else if (matchedCategory.id === 'GATEWAY_BIN') {
    actionSteps.push(`حوّل مسار العملية فوراً إلى بوابة ${gatewayName(alternativeGateway)} التي تدعم بطاقات ${bankName} بنسبة ${altConfidence}%.`);
    actionSteps.push('فعّل خاصية "التوجيه الذكي التلقائي (Smart Fallback Routing)" في إعدادات المنصة لتفادي تكرار هذا الرفض.');
  } else if (matchedCategory.id === 'TECH_PROCESSOR') {
    actionSteps.push('المشكلة في مقسم البنك المصدر (Network Switch Downtime) وليست من بطاقة العميل.');
    actionSteps.push('النظام مجدول لإعادة محاولة الاتصال آلياً بعد 120 ثانية.');
    actionSteps.push('إذا استمر الخلل، حوّل العملية لبوابة أخرى مرتبطة بمقسم مصرفي مستقل.');
  } else {
    actionSteps.push('راجع إعدادات المفاتيح ومستويات التاجر المعتمدة في لوحة تحكم البوابة.');
    actionSteps.push('تأكد من تفعيل بيئة الإنتاج المباشرة (Live Mode) وعدم بقاء المنصة في وضع التجربة.');
  }

  const customerMsg = `عزيزي العميل، لاحظنا تعذر إتمام عملية الدفع الأخيرة لطلبك (${matchedReason.customerAdviceAr}). يمكنك النقر على الرابط التالي لإعادة المحاولة بسهولة أو اختيار بطاقة أخرى: [رابط الدفع المباشر]`;

  return {
    inputClean: clean,
    bin,
    gateway,
    matchedCategory,
    matchedReason,
    bankName,
    country,
    scheme,
    cardType,
    isKnownBin: isKnown,
    rawResponseSimulated: {
      code: matchedReason.rawCodes[0] || 'ERR_DECLINE',
      message: `${matchedReason.titleEn} - Processed by ${gatewayName(gateway)}`,
      httpStatus: 402
    },
    aiExplanation: `تم تحليل رفض البطاقة على بوابة ${gatewayName(gateway)}: ${matchedReason.explanationAr} ${matchedCategory.descriptionAr}`,
    actionableRoadmap: actionSteps,
    suggestedCustomerMessage: customerMsg,
    recommendedAlternativeGateway: alternativeGateway,
    acceptanceConfidenceOnAlternative: altConfidence
  };
}
