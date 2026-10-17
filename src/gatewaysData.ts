import { gatewayNames } from '../shared/policy';
export interface IntegrationType {
  id: string;
  name: string;
  english: string;
  badge: string;
  description: string;
  suitableFor: string;
  requiredFields: { key: string; label: string; placeholder: string; isSecret?: boolean }[];
}

export interface GatewayDefinition {
  id: string;
  name: string;
  english: string;
  country: string;
  logoTheme: string;
  website: string;
  description: string;
  supportedMethods: string[];
  integrationTypes: IntegrationType[];
  securityFeatures: string[];
}

export const KNOWN_GATEWAYS: GatewayDefinition[] = [
  {
    id: 'paytabs',
    name: gatewayNames.paytabs,
    english: gatewayNames.paytabs,
    country: 'المملكة العربية السعودية',
    logoTheme: 'paytabs-theme',
    website: 'https://merchant.paytabs.com',
    description: 'بوابة الدفع الرائدة في المملكة والخليج، تدعم مدى، فيزا، ماستركارد، Apple Pay، والمدفوعات المتكررة.',
    supportedMethods: ['مدى', 'Apple Pay', 'Visa / Mastercard', 'الاشتراكات الدورية', 'STC Pay'],
    securityFeatures: ['3D Secure 2.0', 'PCI-DSS Level 1', 'Fraud Engine', 'Tokenization'],
    integrationTypes: [
      {
        id: 'hosted',
        name: 'صفحة دفع مستضافة (Hosted Payment Page)',
        english: 'Hosted Checkout',
        badge: 'الأكثر أماناً والأسهل',
        description: 'تحويل العميل لصفحة PayTabs الآمنة ثم إعادته للمتجر مع توقيع الرد المشفر.',
        suitableFor: 'المتاجر الإلكترونية، حماية كاملة، متوافق مع SAQ A دون مسؤولية حفظ بيانات.',
        requiredFields: [
          { key: 'PROFILE_ID', label: 'معرّف الملف (Profile ID)', placeholder: 'مثال: 104829' },
          { key: 'SERVER_KEY', label: 'مفتاح الخادم (Server Key)', placeholder: 'مثال: SKJN...992A', isSecret: true },
          { key: 'API_BASE_URL', label: 'نطاق الخادم (API Base URL)', placeholder: 'https://secure.paytabs.sa' },
        ],
      },
      {
        id: 'mobile',
        name: 'ربط الجوال والتطبيقات (Mobile SDK & PWA Webview)',
        english: 'Mobile In-App Integration',
        badge: 'لتطبيقات الهواتف الذكية',
        description: 'ربط مباشر لتطبيقات الجوال (iOS / Android / Flutter / React Native) وWebviews المخصصة للجوال.',
        suitableFor: 'تطبيقات الجوال الذكية، توفير تجربة دفع داخل التطبيق مع دعم Apple Pay Native.',
        requiredFields: [
          { key: 'CLIENT_KEY', label: 'مفتاح العميل (Client Key)', placeholder: 'مثال: CKJN...881B' },
          { key: 'PROFILE_ID', label: 'معرّف الملف (Profile ID)', placeholder: 'مثال: 104829' },
          { key: 'PACKAGE_NAME', label: 'معرّف التطبيق (Package/Bundle ID)', placeholder: 'com.oneshot.app' },
        ],
      },
      {
        id: 'framed',
        name: 'الدفع المدمج داخل المتجر (Embedded iFrame)',
        english: 'Embedded iFrame Integration',
        badge: 'داخل موقعك مباشرة',
        description: 'عرض نموذج الدفع في نافذة مدمجة داخل صفحة الشراء دون أن يشعر العميل بمغادرة موقعك.',
        suitableFor: 'منصات SaaS وتجار ونشوت الراغبين في تجربة سلسة بدون تحويل خارجي.',
        requiredFields: [
          { key: 'PROFILE_ID', label: 'معرّف الملف (Profile ID)', placeholder: 'مثال: 104829' },
          { key: 'SERVER_KEY', label: 'مفتاح الخادم (Server Key)', placeholder: 'مثال: SKJN...992A', isSecret: true },
          { key: 'CLIENT_KEY', label: 'مفتاح العميل (Client Key)', placeholder: 'مثال: CKJN...881B' },
        ],
      },
      {
        id: 'managed',
        name: 'النموذج المُدار برمجياً (Managed Payment Form)',
        english: 'Managed Form (SAQ A-EP)',
        badge: 'تخصيص الواجهة بالكامل',
        description: 'تصميم حقول البطاقة بحرية كاملة بينما تقوم مكتبة البوابة باستبدال البطاقة برمز أمان Token.',
        suitableFor: 'الواجهات المتقدمة مع الحفاظ على شهادة الأمان دون ملامسة خادمك للبطاقات.',
        requiredFields: [
          { key: 'PROFILE_ID', label: 'معرّف الملف (Profile ID)', placeholder: 'مثال: 104829' },
          { key: 'SERVER_KEY', label: 'مفتاح الخادم (Server Key)', placeholder: 'مثال: SKJN...992A', isSecret: true },
          { key: 'CLIENT_KEY', label: 'مفتاح العميل (Client Key)', placeholder: 'مثال: CKJN...881B' },
        ],
      },
      {
        id: 'direct_api',
        name: 'الربط المباشر للخوادم (Direct Server-to-Server API)',
        english: 'Direct API (SAQ D)',
        badge: 'تحكم مطلق ومعالجة خلفية',
        description: 'إرسال بيانات الدفع مباشرة عبر طلبات REST API من خادم التاجر إلى بوابة الدفع.',
        suitableFor: 'الشركات الكبرى والبنوك والشركات الحاصلة على رخصة PCI-DSS Level 1.',
        requiredFields: [
          { key: 'SERVER_KEY', label: 'مفتاح الخادم (Server Key)', placeholder: 'مثال: SKJN...992A', isSecret: true },
          { key: 'PROFILE_ID', label: 'معرّف الملف (Profile ID)', placeholder: 'مثال: 104829' },
          { key: 'WEBHOOK_SECRET', label: 'مفتاح توقيع الويب هوك (Webhook Secret)', placeholder: 'whsec_...', isSecret: true },
        ],
      },
    ],
  },
  {
    id: 'telr',
    name: 'بوابة تيلر (Telr Payment Gateway)',
    english: 'Telr Gateway',
    country: 'الإمارات العربية المتحدة / الخليج',
    logoTheme: 'telr-theme',
    website: 'https://telr.com',
    description: 'بوابة موثوقة في منطقة الشرق الأوسط تدعم التحصيل الفوري والعملات المتعددة ومكافحة الاحتيال الذكية.',
    supportedMethods: ['مدى', 'Apple Pay', 'Visa / Mastercard', 'UnionPay', 'Sadad'],
    securityFeatures: ['Telr Anti-Fraud Guard', '3D Secure', 'Real-time Velocity Filter'],
    integrationTypes: [
      {
        id: 'hosted',
        name: 'صفحة دفع تيلر المستضافة (Telr Hosted Checkout)',
        english: 'Telr Hosted Page',
        badge: 'ربط تيلر القياسي',
        description: 'إنشاء جلسة دفع عبر order.json وتوجيه العميل لصفحة تيلر المعربة والمحمية.',
        suitableFor: 'المواقع وتطبيقات الويب، تحصيل فوري مع إعادة التوجيه لصفحة النجاح.',
        requiredFields: [
          { key: 'STORE_ID', label: 'معرّف المتجر (Store ID)', placeholder: 'مثال: 29841' },
          { key: 'SERVICE_API_KEY', label: 'مفتاح المصادقة والخدمة (Authentication Key)', placeholder: 'مثال: abc123def456...', isSecret: true },
          { key: 'TEST_MODE', label: 'وضع الاختبار (0 للإنتاج الحقيقي، 1 للاختبار)', placeholder: '0' },
        ],
      },
      {
        id: 'framed',
        name: 'الإطار المدمج المباشر (Telr Seamless iFrame)',
        english: 'Telr In-Page Frame',
        badge: 'دفع داخل الموقع',
        description: 'دمج صفحة الدفع داخل النافذة دون إعادة توجيه مع المحافظة على معايير الأمان.',
        suitableFor: 'المتاجر والمنصات الراغبة بتجربة مدمجة.',
        requiredFields: [
          { key: 'STORE_ID', label: 'معرّف المتجر (Store ID)', placeholder: 'مثال: 29841' },
          { key: 'SERVICE_API_KEY', label: 'مفتاح المصادقة (Auth Key)', placeholder: 'مثال: abc123def456...', isSecret: true },
        ],
      },
      {
        id: 'mobile',
        name: 'تكامل تطبيقات الجوال (Telr Mobile SDK / App)',
        english: 'Telr Mobile SDK',
        badge: 'لتطبيقات الأجهزة الذكية',
        description: 'ربط مخصص لتطبيقات iOS وAndroid عبر حزم التطوير الرسمية مع دعم Apple Pay.',
        suitableFor: 'تطبيقات الجوال العاملة بأنظمة أندرويد وiOS.',
        requiredFields: [
          { key: 'STORE_ID', label: 'معرّف المتجر (Store ID)', placeholder: 'مثال: 29841' },
          { key: 'APP_AUTH_KEY', label: 'مفتاح توثيق التطبيق (App Key)', placeholder: 'مثال: mob_...', isSecret: true },
        ],
      },
    ],
  },
  {
    id: 'myfatoorah',
    name: 'ماي فاتورة (MyFatoorah)',
    english: 'MyFatoorah Gateway',
    country: 'الكويت / السعودية / الخليج',
    logoTheme: 'myfatoorah-theme',
    website: 'https://myfatoorah.com',
    description: 'بوابة شهيرة بالفواتير السريعة والدفع عبر الرسائل ومدى وKNET وApple Pay وروابط الدفع الفورية.',
    supportedMethods: ['مدى', 'KNET', 'Apple Pay', 'Visa / Mastercard', 'روابط الدفع SMS / WhatsApp'],
    securityFeatures: ['SMS OTP Verification', 'MyFatoorah Shield', '3D Secure'],
    integrationTypes: [
      {
        id: 'hosted',
        name: 'صفحة دفع ماي فاتورة الموحدة (MyFatoorah Invoice & Hosted)',
        english: 'Execute Payment / Hosted',
        badge: 'الدفع بالفاتورة والرابط',
        description: 'استدعاء ExecutePayment وإنشاء رابط دفع يحمل بوابات الدفع المختارة.',
        suitableFor: 'المتاجر والخدمات، مناسب للمدفوعات السريعة بالريال والدينار.',
        requiredFields: [
          { key: 'API_TOKEN', label: 'مفتاح الـ API الحي (API Bearer Token)', placeholder: 'مثال: eyJhbGciOi...', isSecret: true },
          { key: 'ENDPOINT_URL', label: 'رابط الخادم (Endpoint)', placeholder: 'https://api.myfatoorah.com' },
        ],
      },
      {
        id: 'mobile',
        name: 'ربط الجوال وتطبيقات الهواتف (MyFatoorah Mobile SDK)',
        english: 'Mobile In-App Integration',
        badge: 'تطبيقات الهواتف',
        description: 'دمج بطاقات الدفع وKNET ومدى داخل تطبيق الجوال مباشرة.',
        suitableFor: 'تطبيقات الهواتف الموجهة للسوق الخليجي.',
        requiredFields: [
          { key: 'API_TOKEN', label: 'مفتاح الـ API الحي (Token)', placeholder: 'eyJhbGciOi...', isSecret: true },
          { key: 'APP_BUNDLE_ID', label: 'معرّف حزمة التطبيق (Bundle ID)', placeholder: 'sa.oneshot.store' },
        ],
      },
      {
        id: 'embedded',
        name: 'نموذج الدفع المضمن (Embedded Form / Session)',
        english: 'InitiateSession & Embedded Form',
        badge: 'عناصر مضمنة',
        description: 'إنشاء جلسة مشفرة واستخدام مكونات ماي فاتورة داخل صفحة العميل.',
        suitableFor: 'متاجر ونشوت الاحترافية.',
        requiredFields: [
          { key: 'API_TOKEN', label: 'مفتاح الـ API الحي (Token)', placeholder: 'eyJhbGciOi...', isSecret: true },
        ],
      },
    ],
  },
  {
    id: 'payzaty',
    name: 'بي زاتي (PayZaty)',
    english: 'PayZaty Gateway',
    country: 'المملكة العربية السعودية',
    logoTheme: 'payzaty-theme',
    website: 'https://payzaty.com',
    description: 'بوابة دفع سعودية حديثة تدعم التاجر المحلي ومدى والتحصيل الفوري وواجهات برمجية مبسطة.',
    supportedMethods: ['مدى', 'Apple Pay', 'Visa / Mastercard', 'STC Pay'],
    securityFeatures: ['Saudi SAMA Compliance', '3D Secure 2.0', 'Fraud Radar'],
    integrationTypes: [
      {
        id: 'hosted',
        name: 'رابط الدفع المستضاف (PayZaty Hosted Checkout)',
        english: 'Hosted Payment Flow',
        badge: 'الربط السحابي السريع',
        description: 'إرسال طلب الدفع واستقبال رابط الدفع الآمن مع توجيه العميل.',
        suitableFor: 'مواقع البيع والتجارة الإلكترونية في السعودية.',
        requiredFields: [
          { key: 'MERCHANT_ID', label: 'معرّف التاجر (Merchant ID)', placeholder: 'مثال: PZ-91823' },
          { key: 'SECRET_KEY', label: 'المفتاح السري (Secret Key)', placeholder: 'مثال: pz_sec_...', isSecret: true },
          { key: 'PUBLIC_KEY', label: 'المفتاح العام (Public Key)', placeholder: 'مثال: pz_pub_...' },
        ],
      },
      {
        id: 'mobile',
        name: 'تكامل تطبيقات الجوال (Mobile Apps SDK)',
        english: 'Mobile In-App Checkout',
        badge: 'لتطبيقات الأجهزة الذكية',
        description: 'ربط مباشر لتطبيقات iOS وAndroid مع دعم مدى وApple Pay على الجوال.',
        suitableFor: 'تطبيقات الجوال السعودية.',
        requiredFields: [
          { key: 'MERCHANT_ID', label: 'معرّف التاجر (Merchant ID)', placeholder: 'مثال: PZ-91823' },
          { key: 'PUBLIC_KEY', label: 'المفتاح العام (Public Key)', placeholder: 'مثال: pz_pub_...' },
        ],
      },
      {
        id: 'direct_api',
        name: 'الربط البرمجي المباشر (Direct API Server-to-Server)',
        english: 'Server-to-Server API',
        badge: 'واجهات REST API',
        description: 'معالجة المدفوعات والاشتراكات الدورية عبر استدعاءات API مشفرة.',
        suitableFor: 'المنصات الكبرى والأنظمة الإدارية.',
        requiredFields: [
          { key: 'SECRET_KEY', label: 'المفتاح السري (Secret Key)', placeholder: 'مثال: pz_sec_...', isSecret: true },
          { key: 'WEBHOOK_URL', label: 'رابط استلام الإشعارات (Webhook URL)', placeholder: 'https://oneshot.sa/webhook' },
        ],
      },
    ],
  },
  {
    id: 'tabby',
    name: 'تابي (Tabby - اشتر الآن وادفع لاحقاً)',
    english: 'Tabby BNPL',
    country: 'السعودية والإمارات والكويت',
    logoTheme: 'tabby-theme',
    website: 'https://tabby.ai',
    description: 'بوابة تقسيط المشتريات الرائدة (اشتر الآن وادفع لاحقاً على 4 دفعات بدون فوائد).',
    supportedMethods: ['تقسيط على 4 دفعات (BNPL)', 'دفع بعد 14 يوم', 'Tabby Pay'],
    securityFeatures: ['Instant Credit Assessment', 'Fraud Detection', 'SMS Verification'],
    integrationTypes: [
      {
        id: 'hosted',
        name: 'جلسة تقسيط تابي المستضافة (Tabby Checkout Session)',
        english: 'Tabby Checkout Session',
        badge: 'تقسيط المبيعات',
        description: 'إنشاء جلسة فحص ائتماني وتوجيه العميل لتابي لاعتماد خطة التقسيط.',
        suitableFor: 'المتاجر الإلكترونية لزيادة متوسط قيمة الطلب (AOV).',
        requiredFields: [
          { key: 'PUBLIC_KEY', label: 'المفتاح العام (Public Key)', placeholder: 'مثال: pk_test_... أو pk_live_...' },
          { key: 'SECRET_KEY', label: 'المفتاح السري (Secret Key)', placeholder: 'مثال: sk_test_... أو sk_live_...', isSecret: true },
          { key: 'MERCHANT_CODE', label: 'رمز التاجر (Merchant Code)', placeholder: 'oneshot_store' },
        ],
      },
      {
        id: 'mobile',
        name: 'ربط تقسيط تابي على تطبيقات الجوال (Tabby Mobile SDK)',
        english: 'Tabby iOS / Android SDK',
        badge: 'تطبيقات الجوال',
        description: 'عرض عروض التقسيط وحاسبة الأقساط وزر التقسيط داخل تطبيق الجوال.',
        suitableFor: 'تطبيقات المتاجر الإلكترونية على الهواتف.',
        requiredFields: [
          { key: 'PUBLIC_KEY', label: 'المفتاح العام (Public Key)', placeholder: 'pk_live_...' },
          { key: 'MERCHANT_CODE', label: 'رمز التاجر (Merchant Code)', placeholder: 'oneshot_store' },
        ],
      },
      {
        id: 'snippet',
        name: 'شريط حاسبة الأقساط للمنتجات (Tabby Promotional Snippet)',
        english: 'Promotional Widget',
        badge: 'شريط ترويجي ذكي',
        description: 'كود يوضح للعميل "قسّم مشترياتك على 4 دفعات بقيمة X ريال" أسفل كل خدمة.',
        suitableFor: 'صفحات الخدمات والمنتجات لزيادة نسبة التحويل.',
        requiredFields: [
          { key: 'PUBLIC_KEY', label: 'المفتاح العام (Public Key)', placeholder: 'pk_live_...' },
        ],
      },
    ],
  },
  {
    id: 'noonpayments',
    name: 'نون للمدفوعات (Noon Payments)',
    english: 'Noon Payments Gateway',
    country: 'المملكة العربية السعودية والإمارات',
    logoTheme: 'noon-theme',
    website: 'https://noonpayments.com',
    description: 'بوابة مدفوعات نون القوية، معدلات قبول عالية جداً لمدى والبطاقات الائتمانية والتقسيط البنكي.',
    supportedMethods: ['مدى', 'Apple Pay', 'Visa / Mastercard', 'Amanah', 'EMI التقسيط البنكي'],
    securityFeatures: ['Noon Shield AI', '3DS 2.2', 'PCI-DSS v4.0 Certified'],
    integrationTypes: [
      {
        id: 'hosted',
        name: 'صفحة دفع نون المستضافة (Noon Hosted Checkout)',
        english: 'Initiate Order & Hosted Redirection',
        badge: 'أعلى معدلات قبول',
        description: 'إنشاء الطلب وتوجيه العميل لصفحة نون الآمنة مع تسجيل حالة الدفع الفورية.',
        suitableFor: 'مبيعات التجزئة والخدمات ذات العمليات العالية.',
        requiredFields: [
          { key: 'BUSINESS_ID', label: 'معرّف الأعمال (Business Identifier)', placeholder: 'مثال: ONESHOT_SA' },
          { key: 'APP_KEY', label: 'مفتاح التطبيق (App Key)', placeholder: 'مثال: app_...', isSecret: true },
          { key: 'AUTH_KEY', label: 'مفتاح المصادقة الأساسي (Auth Key)', placeholder: 'مثال: Key_...', isSecret: true },
        ],
      },
      {
        id: 'mobile',
        name: 'حزمة تطبيقات الجوال (Noon Mobile In-App SDK)',
        english: 'Mobile SDK for Android & iOS',
        badge: 'لتطبيقات الجوال',
        description: 'دفع سلس داخل التطبيق بدون إعادة توجيه خارجية، مع دعم كامل لـ Apple Pay.',
        suitableFor: 'تطبيقات التسوق والخدمات.',
        requiredFields: [
          { key: 'BUSINESS_ID', label: 'معرّف الأعمال (Business ID)', placeholder: 'ONESHOT_SA' },
          { key: 'APP_KEY', label: 'مفتاح التطبيق (App Key)', placeholder: 'app_...', isSecret: true },
        ],
      },
      {
        id: 'direct_api',
        name: 'الربط المباشر للخوادم (Direct Payment API)',
        english: 'Server Direct API',
        badge: 'ربط مباشر API',
        description: 'تنفيذ العمليات والاشتراكات الدورية عبر استدعاءات الخوادم مباشرة.',
        suitableFor: 'التطبيقات السحابية الكبرى.',
        requiredFields: [
          { key: 'AUTH_KEY', label: 'مفتاح المصادقة (Auth Key)', placeholder: 'Key_...', isSecret: true },
        ],
      },
    ],
  },
  {
    id: 'payone',
    name: 'بي وان (PayOne / HyperPay)',
    english: 'PayOne Gateway',
    country: 'المملكة العربية السعودية والشرق الأوسط',
    logoTheme: 'payone-theme',
    website: 'https://payone.com',
    description: 'بوابة موجهة للتجارة والمدفوعات المؤسسية والربط عبر واجهات برمجية متقدمة وموثوقة.',
    supportedMethods: ['مدى', 'Apple Pay', 'Visa / Mastercard', 'سداد Sadad'],
    securityFeatures: ['Hyper-Security Engine', '3D Secure 2.0', 'Tokenization Vault'],
    integrationTypes: [
      {
        id: 'hosted',
        name: 'صفحة الدفع المستضافة (PayOne Hosted Checkout)',
        english: 'Hosted Redirection Flow',
        badge: 'ربط آمن قياسي',
        description: 'إنشاء جلسة دفع وتوجيه العميل للصفحة المعتمدة.',
        suitableFor: 'المتاجر والمنصات الراغبة بتجربة دفع موثوقة.',
        requiredFields: [
          { key: 'ENTITY_ID', label: 'معرّف الكيان (Entity ID)', placeholder: 'مثال: 8a8294174d...' },
          { key: 'ACCESS_TOKEN', label: 'رمز الوصول للـ API (Bearer Token)', placeholder: 'مثال: OGE4Mjk0MT...', isSecret: true },
        ],
      },
      {
        id: 'mobile',
        name: 'ربط تطبيقات الجوال (Mobile Apps SDK)',
        english: 'Mobile In-App Checkout',
        badge: 'لتطبيقات الجوال',
        description: 'حزمة SDK مخصصة لتطبيقات الهواتف الذكية.',
        suitableFor: 'تطبيقات الجوال.',
        requiredFields: [
          { key: 'ENTITY_ID', label: 'معرّف الكيان (Entity ID)', placeholder: '8a8294174d...' },
          { key: 'ACCESS_TOKEN', label: 'رمز الوصول (Bearer Token)', placeholder: 'OGE4Mjk0MT...', isSecret: true },
        ],
      },
      {
        id: 'widget',
        name: 'نموذج الدفع المضمن (Copyandpay Widget)',
        english: 'Copyandpay Widget',
        badge: 'نموذج مدمج',
        description: 'إدراج ويدجت نموذج البطاقة مباشرة في كود الصفحة.',
        suitableFor: 'المواقع الاحترافية.',
        requiredFields: [
          { key: 'ENTITY_ID', label: 'معرّف الكيان (Entity ID)', placeholder: '8a8294174d...' },
        ],
      },
    ],
  },
  {
    id: 'ngenius',
    name: 'نيجنيس السعودية (N-Genius KSA · Network International)',
    english: 'N-Genius KSA Gateway',
    country: 'المملكة العربية السعودية',
    logoTheme: 'ngenius-theme',
    website: 'https://portal.ksa.ngenius-payments.com/?tenant=NIARABIA',
    description:
      'بوابة Network International السعودية (N-Genius KSA). خمس طرق ربط رسمية: صفحة الدفع المستضافة، الجلسة المستضافة (Web SDK)، الربط المباشر للخوادم (Direct API)، حزم تطوير الجوال، وإضافات المتاجر — إضافة إلى مسارات البوابة بلا كود: روابط الدفع وQR وOneLink، Virtual Terminal/MOTO، حفظ البطاقة (Tokenisation)، الاشتراكات والتقسيط، والويب هوك. المصدر: docs.ksa.ngenius-payments.com',
    supportedMethods: ['مدى (Cards)', 'Apple Pay', 'Samsung Pay'],
    securityFeatures: ['PCI-DSS', '3D Secure 2.0', 'Tokenisation / Card on File', 'Webhooks'],
    integrationTypes: [
      {
        id: 'hosted',
        name: 'صفحة الدفع المستضافة (Hosted Payment Page)',
        english: 'N-Genius Hosted Page',
        badge: 'المرتبطة فعليًا بحساب المنصة',
        description:
          'إنشاء أمر عبر POST /transactions/outlets/{outletRef}/orders بـ application/vnd.ni-payment.v2+json ثم توجيه العميل إلى paypage.ksa.ngenius-payments.com. هذا هو الربط العامل الآن عبر دالتي ng-pay و ng-pay-return.',
        suitableFor: 'المتاجر الإلكترونية وصفحات الدفع العامة دون رفع مسؤولية PCI.',
        requiredFields: [
          { key: 'OUTLET_REFERENCE', label: 'معرّف المنفذ (Outlet Reference)', placeholder: 'Outlet Reference (UUID)' },
          { key: 'API_KEY', label: 'مفتاح حساب الخدمة (Service Account API Key)', placeholder: 'base64(UUID:UUID)', isSecret: true },
          { key: 'API_BASE_URL', label: 'نطاق الخادم (Identity API)', placeholder: 'https://api-gateway.ksa.ngenius-payments.com' },
          { key: 'PAYPAGE_URL', label: 'نطاق صفحة الدفع (PayPage)', placeholder: 'https://paypage.ksa.ngenius-payments.com' },
        ],
      },
      {
        id: 'hosted_session',
        name: 'الجلسة المستضافة / الويب إس دي كي (Hosted Session · Web SDK)',
        english: 'Hosted Session Web SDK',
        badge: 'بلا مسؤولية PCI',
        description:
          'إطار داخل موقعك يجمع بيانات البطاقة ويحوّلها توكن لدى البوابة قبل وصولها لخادمك. يحتاج حساب خدمة نوعه Hosted Session Service Account (في حساب المنصة يوجد حساب من هذا النوع).',
        suitableFor: 'الواجهات الحديثة الراغبة بجمع البطاقة داخل الموقع دون مسؤولية تخزين.',
        requiredFields: [
          { key: 'OUTLET_REFERENCE', label: 'معرّف المنفذ (Outlet Reference)', placeholder: 'Outlet Reference (UUID)' },
          { key: 'SESSION_API_KEY', label: 'مفتاح حساب الجلسة المستضافة (Hosted Session Key)', placeholder: 'base64(UUID:UUID)', isSecret: true },
          { key: 'API_BASE_URL', label: 'نطاق الخادم (API Base URL)', placeholder: 'https://api-gateway.ksa.ngenius-payments.com' },
        ],
      },
      {
        id: 'direct_api',
        name: 'الربط المباشر للخوادم (Direct API)',
        english: 'Direct Server-to-Server API',
        badge: 'تحكم كامل بالعمليات',
        description:
          'واجهة REST JSON كاملة: أمر بمرحلة واحدة (PURCHASE) أو مرحلتين (AUTH ثم CAPTURE)، مع الإلغاء والعكس والاسترجاع والاستعلام. تُرسل بيانات البطاقة من خادمك، ويلزم التزام PCI-DSS.',
        suitableFor: 'المنصات والشركات الحاصلة على متطلبات PCI-DSS والمعالجة الخلفية للاشتراكات.',
        requiredFields: [
          { key: 'OUTLET_REFERENCE', label: 'معرّف المنفذ (Outlet Reference)', placeholder: 'Outlet Reference (UUID)' },
          { key: 'API_KEY', label: 'مفتاح حساب الخدمة (Service Account API Key)', placeholder: 'base64(UUID:UUID)', isSecret: true },
          { key: 'WEBHOOK_SECRET', label: 'مفتاح توقيع الويب هوك (Webhook Signature Key)', placeholder: 'whsec_...', isSecret: true },
        ],
      },
      {
        id: 'mobile_sdk',
        name: 'حزم تطوير الجوال (Mobile SDKs · iOS / Android / React Native)',
        english: 'Mobile SDKs',
        badge: 'للتطبيقات الأصلية',
        description:
          'حزم رسمية لتطبيقات iOS وAndroid وReact Native لتحصيل الدفع داخل التطبيق. تطبيق المنصة الحالي WebView على الموقع الحيّ فيعمل تلقائيًا، وتُستخدم الحزمة عند بناء تجربة دفع أصلية.',
        suitableFor: 'تطبيقات الجوال الأصلية والهجينة.',
        requiredFields: [
          { key: 'OUTLET_REFERENCE', label: 'معرّف المنفذ (Outlet Reference)', placeholder: 'Outlet Reference (UUID)' },
          { key: 'API_KEY', label: 'مفتاح حساب الخدمة (Service Account API Key)', placeholder: 'base64(UUID:UUID)', isSecret: true },
          { key: 'APP_BUNDLE_ID', label: 'معرّف التطبيق (Bundle / Package ID)', placeholder: 'com.oneshotcam.hub' },
        ],
      },
      {
        id: 'plugins',
        name: 'إضافات المتاجر الجاهزة (Plugins · Shopify / WooCommerce / Magento / PrestaShop / OpenCart)',
        english: 'E-commerce Plugins',
        badge: 'تركيب بلا برمجة',
        description:
          'إضافات رسمية للمتاجر الجاهزة: Shopify، WooCommerce، Magento 2.4.5+، PrestaShop 8، OpenCart 4. تُركّب المفتاح من لوحة المتجر وتحوّل الحساب إلى وضع الإنتاج.',
        suitableFor: 'المتاجر المبنية على منصات جاهزة دون تطوير مخصص.',
        requiredFields: [
          { key: 'PLUGIN_PLATFORM', label: 'منصة المتجر (Platform)', placeholder: 'Shopify / WooCommerce / Magento / PrestaShop / OpenCart' },
          { key: 'OUTLET_REFERENCE', label: 'معرّف المنفذ (Outlet Reference)', placeholder: 'Outlet Reference (UUID)' },
          { key: 'API_KEY', label: 'مفتاح حساب الخدمة (Service Account API Key)', placeholder: 'base64(UUID:UUID)', isSecret: true },
        ],
      },
    ],
  },
  {
    id: 'tap',
    name: 'تاب للمدفوعات (Tap Payments)',
    english: 'Tap Payments Gateway',
    country: 'الكويت / السعودية (مرخّصة في الخليج)',
    logoTheme: 'tap-theme',
    website: 'https://www.tap.company',
    description:
      'بوابة إقليمية واحدة تجمع البطاقات (مدى/فيزا/ماستركارد) وApple Pay وSamsung Pay وGoogle Pay وOmanNet في صفحة دفع واحدة (Tap Checkout). الربط العامل الآن: شحنة عبر POST /v2/charges على api.tap.company ثم توجيه العميل إلى checkout.tap.company، وتأكيد الحالة بقراءة الشحنة حيًّا من البوابة عند العودة أو وصول الويب هوك (GET /v2/charges/{id}). المصدر: developers.tap.company',
    supportedMethods: ['مدى (Cards)', 'Apple Pay', 'Samsung Pay', 'Google Pay', 'STC Pay'],
    securityFeatures: ['PCI-DSS', '3D Secure 2.0', 'Webhook Signature (hashstring)', 'Tokenisation / Saved Cards'],
    integrationTypes: [
      {
        id: 'hosted',
        name: 'صفحة الدفع المستضافة (Tap Checkout)',
        english: 'Tap Hosted Checkout',
        badge: 'المرتبطة فعليًا بحساب المنصة',
        description:
          'شحنة واحدة عبر dالة tapCreateCharge إلى api.tap.company/v2/charges بعملة SAR ثم توجيه العميل إلى صفحة Tap المستضافة؛ يظهر فيها Card وApple Pay وSamsung Pay حسب جهاز العميل. تعود النتيجة إلى payment-return ويُبلَّغ الحالة إلى tap-webhook، والحالة لا تُؤخذ من الإشعار بل تُقرأ حيًّا من Tap.',
        suitableFor: 'المتاجر الإلكترونية وصفحات الدفع العامة دون رفع مسؤولية PCI.',
        requiredFields: [
          { key: 'SECRET_KEY', label: 'المفتاح السري (Secret Key)', placeholder: 'sk_live_... / sk_test_...', isSecret: true },
          { key: 'PUBLIC_KEY', label: 'المفتاح العام (Public Key)', placeholder: 'pk_live_... / pk_test_...' },
          { key: 'MERCHANT_ID', label: 'معرّف التاجر (Merchant ID) — اختياري', placeholder: 'merchant_...' },
        ],
      },
      {
        id: 'mada_applepay',
        name: 'مدى وApple Pay وSamsung Pay',
        english: 'mada · Apple Pay · Samsung Pay',
        badge: 'جاهزة في صفحة Tap',
        description:
          'طرق الدفع الخليجية الثلاث تُفعَّل من لوحة Tap دون كود إضافي: البطاقات (مدى/فيزا/ماستركارد) وApple Pay على Safari وأجهزة Apple، وSamsung Pay على أجهزة سامسونج. تُمرَّر عبر حقل source في الشحنة (src_all / src_card / src_apple_pay / src_samsung_pay).',
        suitableFor: 'السوق السعودي والخليجي حيث المدى وApple Pay أوسع طرق الدفع.',
        requiredFields: [
          { key: 'PUBLIC_KEY', label: 'المفتاح العام (Public Key)', placeholder: 'pk_live_...' },
          { key: 'APPLE_MERCHANT_ID', label: 'معرّف تاجر Apple Pay', placeholder: 'merchant.com.oneshotcam' },
        ],
      },
      {
        id: 'own',
        name: 'ربط الخوادم المباشر (Direct API · Charges)',
        english: 'Direct Server API',
        badge: 'تحكم كامل بالعمليات',
        description:
          'واجهة REST كاملة: إنشاء الشحنة، الاسترجاع (Refund)، الحفظ (Authorize ثم Capture)، والاستعلام عن الشحنة. تُرسل بيانات البطاقة من خادمك، ويلزم التزام PCI-DSS.',
        suitableFor: 'المنصات والشركات الحاصلة على متطلبات PCI-DSS والمعالجة الخلفية.',
        requiredFields: [
          { key: 'SECRET_KEY', label: 'المفتاح السري (Secret Key)', placeholder: 'sk_live_...', isSecret: true },
          { key: 'WEBHOOK_SECRET', label: 'مفتاح توقيع الويب هوك (hashstring)', placeholder: 'يُنسخ من لوحة Tap', isSecret: true },
        ],
      },
      {
        id: 'plugins',
        name: 'إضافات المتاجر والأكشاك (Plugins · Shopify / WooCommerce / Tap Kiosk)',
        english: 'Tap Plugins & Kiosk',
        badge: 'تركيب بلا برمجة',
        description:
          'إضافات رسمية للمتاجر الجاهزة (Shopify، WooCommerce، Magento) وربط Tap Go/أجهزة الكاشير بالمفتاح نفسه، مع بوابة موحّدة لكل القنوات.',
        suitableFor: 'المتاجر المبنية على منصات جاهزة دون تطوير مخصص.',
        requiredFields: [
          { key: 'PUBLIC_KEY', label: 'المفتاح العام (Public Key)', placeholder: 'pk_live_...' },
          { key: 'SECRET_KEY', label: 'المفتاح السري (Secret Key)', placeholder: 'sk_live_...', isSecret: true },
        ],
      },
    ],
  },
];
