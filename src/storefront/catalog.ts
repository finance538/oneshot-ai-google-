// Public product descriptions and pricing from 1shotcam.com, retrieved 2026-10-04.
// These are published content, not customer records or transaction state.
export const categories = [
  {
    id: "ALL",
    nameAr: "كافة الخدمات والمنتجات",
    nameEn: "All Services",
    descriptionAr: "تصفح كافة خدمات ومنتجات وباقات ونشوت 2026",
  },
  {
    id: "AUT",
    nameAr: "الأتمتة والأنظمة والتكاملات",
    nameEn: "Automation & Integrations",
    descriptionAr:
      "أتمتة العمليات، تكاملات الـ API، بوابات الدفع، ولوحات التحكم",
  },
  {
    id: "DIG",
    nameAr: "المستندات والمنتجات الرقمية والتدريب",
    nameEn: "Documents & Training",
    descriptionAr: "قوالب الفواتير، الكتب التفاعلية، جداول التشغيل، وورش AI",
  },
  {
    id: "AI",
    nameAr: "الذكاء الاصطناعي والتكاملات الذكية",
    nameEn: "Custom AI Solutions",
    descriptionAr: "مساعدات ملفات RAG، شات بوت للمواقع، ونماذج محلية",
  },
  {
    id: "WEB",
    nameAr: "المواقع والمتاجر وتجربة المستخدم",
    nameEn: "Websites & Stores",
    descriptionAr: "صفحات الهبوط، المتاجر الإلكترونية، والمواقع المؤسسية",
  },
  {
    id: "BRD",
    nameAr: "الهوية البصرية والعلامة التجارية",
    nameEn: "Brand Identity",
    descriptionAr: "تصميم الشعارات، أنظمة الهوية الشاملة، والتطبيقات",
  },
  {
    id: "SOC",
    nameAr: "إدارة الحسابات والإعلانات والنمو",
    nameEn: "Social Media & Growth",
    descriptionAr: "إدارة السوشيال ميديا، الحملات الإعلانية الممولة، والنمو",
  },
  {
    id: "MED",
    nameAr: "التصميم والميديا والإنتاج الإبداعي",
    nameEn: "Media & Creative",
    descriptionAr: "مونتاج الريلز، التصاميم الإعلانية، والإنتاج الإبداعي",
  },
  {
    id: "MKT",
    nameAr: "الاستراتيجية والتسويق والمحتوى",
    nameEn: "Marketing & Strategy",
    descriptionAr: "جلسات التشخيص، خطط التسويق، وصياغة المحتوى",
  },
];

export const products = [
  {
    sku: "AUT-01",
    nameAr: "تحليل فرص الأتمتة",
    nameEn: "Business Process Automation Discovery",
    categoryId: "AUT",
    subCategory: "الاستشارات وهندسة العمليات",
    status: "ready_to_sell",
    pricing: {
      amount: 1200,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 5,
    revisions: {
      count: 1,
      scope: "مراجعة مخططات سير العمل لتدقيق الاستثناءات التشغيلية",
    },
    publicContent: {
      shortDescription:
        "مراجعة وتحليل 3 مسارات عمل يدوية في منشأتك وتصميم خريطة سير عمل مؤتمتة تلغي الهدر الزمني.",
      detailedDescription:
        "دراسة استشارية وتشغيلية تهدف إلى تحرير فريقك من الأعمال الروتينية المتكررة. نقوم بفحص 3 عمليات يدوية تستهلك وقت موظفيك (مثل: نقل بيانات الطلبات من المتجر لجداول الشحن، إرسال إشعارات العقود للعملاء، أو فرز الفواتير والمرفقات)، ورسم مخطط تدفق رقمي تفصيلي (Workflow Diagram)، واختيار أدوات الربط الأنسب والأقل تكلفة (Make, n8n, أو سكريبتات مخصصة)، وتحديد زمن التوفير المتوقع وتكلفة التنفيذ بدقة.",
      targetAudience:
        "صاحب منشأة يعاني موظفوه من تكرار نسخ ولصق البيانات بين الأنظمة المختلفة ويضيعون ساعات يومية في أعمال روتينية.",
      problemSolved:
        "أخطاء النقل البشري المتبادلة، بطء العمليات، وارتفاع التكلفة التشغيلية لتوظيف مدخلي بيانات.",
      expectedOutcome:
        "خريطة طريق واضحة بالأدوات والتكاليف المحددة لأتمتة 3 عمليات حيوية في الشركة ووقف الهدر فوراً.",
      deliverables: [
        "جلسة استماع وتشخيص (60 دقيقة)",
        "مخططات سير العمل الرقمية (Workflow Architecture Diagrams) لـ 3 عمليات",
        "تقرير التوصيات والأولويات (PDF)",
      ],
      exclusions: [
        "البرمجة والتنفيذ الفعلي لمسارات الأتمتة (تتوفر عبر منتجات AUT-02 و AUT-03)",
      ],
      ctaButton: "اطلب تحليل مسارات الأتمتة",
      seo: {
        title: "استشارات وهندسة أتمتة العمليات التجارية | ونشوت OneShot",
        description:
          "تخلص من الروتين ووفّر ساعات عمل فريقك مع خدمة تحليل وهندسة أتمتة 3 عمليات تجارية بمخططات واضحة.",
      },
    },
  },
  {
    sku: "AUT-02",
    nameAr: "أتمتة بسيطة (Simple Flow)",
    nameEn: "Simple 2-App Workflow Automation",
    categoryId: "AUT",
    subCategory: "مسارات العمل السريعة",
    status: "ready_to_sell",
    pricing: {
      amount: 1500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 5,
    revisions: {
      count: 2,
      scope: "ضبط شروط الفلترة أو تعديل نص الرسالة التلقائية",
    },
    publicContent: {
      shortDescription:
        "بناء وربط مسار أتمتة مباشر بين تطبيقين بمشغل واحد وحتى 3 إجراءات تلقائية وسجل معالجة أخطاء.",
      detailedDescription:
        "ربط ذكي ينقل البيانات تلقائياً بين برنامجين دون أي تدخل بشري (مثل: إرسال رسالة واتساب للعميل فور تسجيل طلبه في المتجر، أو تسجيل الفاتورة في جدول إكسل فور استلام الأموال). يتضمن المسار إعداد مشغل واحد (Trigger) وما يصل إلى 3 إجراءات متتابعة (Actions)، مع تنقية البيانات، وإعداد سجل تنبيهات بالأخطاء عبر البريد أو التليجرام.",
      targetAudience:
        "متجر إلكتروني أو مشروع ناشئ يحتاج ربطاً سريعاً بين أداتين يوميتين لإلغاء النقل اليدوي للمعلومات.",
      problemSolved:
        "تأخر إرسال التنبيهات للعملاء، وسقوط بعض الطلبات سهواً بين المنصات المختلفة.",
      expectedOutcome:
        "تدفق سلس وفوري للمعلومة في أجزاء من الثانية فور حدوث الحدث الأساسي، بنسبة دقة واستقرار عالية.",
      deliverables: [
        "مسار أتمتة واحد نشط ومختبر يربط تطبيقين بحد أقصى 3 إجراءات",
        "سجل مراقبة الأخطاء",
        "دليل تشغيل وشرح للمسار",
      ],
      exclusions: [
        "اشتراك منصات الأتمتة (مثل Make أو Zapier إذا تجاوز الاستخدام الخطة المجانية)",
        "بناء واجهات برمجة مخصصة غير متوفرة",
      ],
      ctaButton: "اطلب أتمتة مسار عملك",
    },
  },
  {
    sku: "AUT-03",
    nameAr: "أتمتة متعددة الخطوات",
    nameEn: "Multi-Step Advanced Workflow Automation",
    categoryId: "AUT",
    subCategory: "الأتمتة المتقدمة",
    status: "ready_to_sell",
    pricing: {
      amount: 3500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 10,
    revisions: {
      count: 2,
      scope: "ضبط معايير الشروط التفرعية وتنسيق البيانات المنقولة",
    },
    publicContent: {
      shortDescription:
        "أتمتة منظومة معقدة تربط حتى 3 تطبيقات وتشمل 8 خطوات بشروط تفرع منطقية ومعالجة احترافية للأخطاء.",
      detailedDescription:
        "بناء مسار تشغيلي آلي متقدم يعالج دورة عمل تجارية كاملة. يشمل ربط 3 تطبيقات مختلفة في سيناريو واحد متناغم يضم حتى 8 خطوات، مع استخدام الشروط المتفرعة (Routers / Branching Logic)، وتنسيق التواريخ والأرقام، وتوليد الفواتير، وتحديث المخزون وقواعد البيانات مع استعادة تلقائية عند انقطاع الاتصال.",
      targetAudience:
        "منشأة تشهد عمليات تشغيلية متشابكة تتطلب موافقات وتحديثات متزامنة في برامج الحسابات والمبيعات والمخازن.",
      deliverables: [
        "سيناريو أتمتة متقدم (حتى 3 تطبيقات و8 خطوات)",
        "شروط تفرع ذكية",
        "نظام إعادة المحاولة الآلي عند الفشل",
        "خريطة توثيق المسار",
      ],
      exclusions: [
        "اشتراك المنصات الوسيطة في حال العمليات الضخمة جداً (أكثر من 10,000 عملية شهرياً)",
      ],
      ctaButton: "اطلب الأتمتة المتقدمة",
    },
  },
  {
    sku: "AUT-04",
    nameAr: "تنظيم العملاء المحتملين (CRM Pipeline)",
    nameEn: "Lead Capture, Enrichment & CRM Pipeline",
    categoryId: "AUT",
    subCategory: "أنظمة المبيعات وإدارة العملاء",
    status: "ready_to_sell",
    pricing: {
      amount: 2500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 7,
    revisions: {
      count: 2,
      scope: "ضبط قواعد توزيع العملاء وحقول التصنيف",
    },
    publicContent: {
      shortDescription:
        "أتمتة التقاط العملاء من الإعلانات والنماذج وتوجيههم لـ CRM واحد مع التصنيف الآلي ومنع التكرار.",
      detailedDescription:
        "بناء مسار التقاط العملاء المهتمين (Leads) لحظة بلحظة دون ضياع أي فرصة بيعية. نقوم بربط إعلاناتك (TikTok Lead Forms, Meta Instant Forms, أو نماذج الموقع) بنظام إدارة علاقات عملاء موحد (مثل HubSpot, Zoho, أو Notion CRM)، وتصنيف العميل تلقائياً، والتحقق من عدم تكرار رقم الهاتف، وإرسال إشعار فوري لمندوب المبيعات.",
      deliverables: [
        "ربط نماذج الإعلانات بنظام CRM واحد",
        "مسار تصنيف وفلترة ومنع التكرار",
        "إشعار فوري لمسؤول المبيعات",
        "تقرير تدفق البيانات",
      ],
      exclusions: ["اشتراك باقة الـ CRM المدفوعة"],
      ctaButton: "اطلب نظام تنظيم العملاء",
    },
  },
  {
    sku: "AUT-05",
    nameAr: "أتمتة عروض الأسعار",
    nameEn: "Automated Quotation Generation System",
    categoryId: "AUT",
    subCategory: "أتمتة المبيعات والوثائق",
    status: "ready_to_sell",
    pricing: {
      amount: 3000,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 9,
    revisions: {
      count: 2,
      scope: "تنسيق شكل ملف الـ PDF وحقول النموذج",
    },
    publicContent: {
      shortDescription:
        "نظام لتوليد عروض أسعار PDF رسمية واحترافية فوراً من نموذج إدخال بسيط مع خطوة اعتماد وتوجيه للعميل.",
      detailedDescription:
        "برمجة نظام مؤتمت يعتمد على نموذج إدخال سريع يملؤه مسؤول المبيعات من الجوال أو الكمبيوتر، ليقوم النظام بحساب التكاليف والضريبة وتوليد عرض سعر رسمي فاخر بصيغة PDF بهوية شركتك وأرقام مرجعية مشفرة، مع إمكانية إرسال مسودة للمدير للاعتماد، ثم إرسال العرض للعميل عبر الإيميل أو الواتساب تلقائياً.",
      deliverables: [
        "نموذج إدخال بيانات متجاوب",
        "قالب عرض سعر PDF ديناميكي مصمم بهويتك",
        "مسار أتمتة التوليد والإرسال",
        "سجل لحفظ عروض الأسعار",
      ],
      exclusions: ["التوقيع الرقمي القانوني المشفر عبر منصات خارجية مدفوعة"],
      ctaButton: "اطلب نظام أتمتة عروض الأسعار",
    },
  },
  {
    sku: "AUT-06",
    nameAr: "أتمتة مستندات تجارية",
    nameEn: "Business Document Automation & Templating",
    categoryId: "AUT",
    subCategory: "الوثائق الرقمية",
    status: "ready_to_sell",
    pricing: {
      amount: 2500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 8,
    revisions: {
      count: 2,
      scope: "تنسيق هوامش المستند ومواقع الحقول المدمجة",
    },
    publicContent: {
      shortDescription:
        "توليد تلقائي للوثائق والعقود والشهادات من مصدر بيانات واحد (جداول أو CRM) لـ قالبين حتى 10 حقول لكل قالب.",
      detailedDescription:
        "تحويل البيانات المجمعة في جداولك أو أنظمتك السحابية إلى وثائق رسمية منسقة وجاهزة للطباعة أو الإرسال دون أي جهد يدوي. يشمل العمل إعداد وتصميم قالبين تجاريين ديناميكيين (مثل: عقود اتفاق، سندات استلام، أو شهادات)، وربطها بمصدر بياناتك، بحيث يتم ملء ما يصل إلى 10 حقول متغيرة تلقائياً.",
      deliverables: [
        "قالبا مستندات ديناميكيان متطابقان مع الهوية",
        "ربط الأتمتة بمصدر بيانات واحد",
        "استخراج حتى 10 حقول لكل قالب",
        "اختبار توليد 20 مستنداً",
      ],
      exclusions: ["الصياغة القانونية لبنود العقود"],
      ctaButton: "اطلب أتمتة مستنداتك التجارية",
    },
  },
  {
    sku: "AUT-07",
    nameAr: "لوحة مؤشرات أعمال (Dashboard)",
    nameEn: "Live Interactive Business Dashboard",
    categoryId: "AUT",
    subCategory: "ذكاء الأعمال والتقارير",
    status: "ready_to_sell",
    pricing: {
      amount: 3500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 10,
    revisions: {
      count: 2,
      scope: "ضبط أنواع الرسوم البيانية وتوزيع البطاقات",
    },
    publicContent: {
      shortDescription:
        "لوحة تحكم تفاعلية تربط مصدر بياناتك المباشر بـ 8 مؤشرات أداء ورسوم بيانية لقرارات تجارية حاسمة.",
      detailedDescription:
        "تجميع أرقام وإحصائيات عملك المشتتة في لوحة تحكم بصرية واحدة ومباشرة (Business Intelligence Dashboard عبر Looker Studio أو Power BI أو واجهة مخصصة). نقوم بربط مصدر بياناتك، وبناء 8 مؤشرات أداء رئيسية (KPIs)، مع مرشحات ذكية تتيح لك تصفية البيانات حسب التاريخ أو الفرع بنقرة زر.",
      deliverables: [
        "لوحة مؤشرات تفاعلية سحابية تضم 8 مؤشرات ورسوم بيانية",
        "فلاتر زمنية وتصنيفية",
        "ربط مصدر بيانات واحد",
        "رابط وصول آمن للمدير",
      ],
      exclusions: [
        "تنقية البيانات التاريخية غير المنظمة",
        "اشتراكات برامج BI المدفوعة إن رغب العميل",
      ],
      ctaButton: "اطلب لوحة مؤشرات أعمالك",
    },
  },
  {
    sku: "AUT-08",
    nameAr: "لوحة إدارة مخصصة (Custom Admin Portal)",
    nameEn: "Custom Web-Based Operations Portal",
    categoryId: "AUT",
    subCategory: "الأنظمة المخصصة ولوحات التحكم",
    status: "ready_to_sell",
    pricing: {
      amount: 8000,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 20,
    revisions: {
      count: 2,
      scope: "ضبط حقول الجداول وشاشات الإدخال",
    },
    publicContent: {
      shortDescription:
        "تطوير لوحة تحكم ويب داخلية متكاملة حتى 3 وحدات تشغيلية ودورين للمستخدمين مع صلاحيات وتصدير بيانات.",
      detailedDescription:
        "بناء نظام برمجي داخلي مخصص يدير عمليات مشروعك بالطريقة التي تناسب آلية عملك. يشمل النظام تطوير حتى 3 وحدات تشغيلية (مثل: وحدة إدارة العملاء والطلبات، وحدة متابعة المهام والتشغيل، ووحدة إدارة الفواتير والمقبوضات)، مع واجهة عربية سريعة بهوية شركتك، ونظام صلاحيات يفرق بين دورين، وخاصية تصدير البيانات إلى Excel/PDF.",
      deliverables: [
        "تطبيق ويب كامل للوحة الإدارة",
        "3 وحدات تشغيلية",
        "دورين للمستخدمين مع نظام صلاحيات",
        "ميزة تصدير Excel",
        "كود المصدر وقاعدة البيانات",
      ],
      exclusions: [
        "تكلفة الخادم السحابي وقاعدة البيانات",
        "تطبيقات جوال أصلية",
      ],
      ctaButton: "اطلب لوحة إدارتك المخصصة",
    },
  },
  {
    sku: "AUT-09",
    nameAr: "تكامل API (API Integration)",
    nameEn: "Custom REST API Integration & Webhooks",
    categoryId: "AUT",
    subCategory: "الربط البرمجي المباشر",
    status: "ready_to_sell",
    pricing: {
      amount: 3000,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 10,
    revisions: {
      count: 2,
      scope: "ضبط حقول البيانات ومعدل تكرار المزامنة",
    },
    publicContent: {
      shortDescription:
        "ربط برمجي مباشر بين نظامين مختلفين عبر الـ API لتنفيذ حتى 3 عمليات متزامنة مع توثيق وسجلات وفشل آمن.",
      detailedDescription:
        "الربط التقني العميق على مستوى الخوادم بين نظامين أو منصتين لتبادل البيانات فورياً دون وسائط بطيئة. يشمل العمل قراءة مستندات الـ API للنظامين، كتابة وتطوير الأكواد البرمجية للربط (Endpoints & Webhooks)، تنفيذ حتى 3 عمليات رئيسية مع معمارية أمان تضمن سرية التوكنز، وبناء سجلات تدقيق، ونظام فشل آمن.",
      deliverables: [
        "ربط برمجي مستقر لنظامين ينفذ 3 عمليات معتمدة",
        "نظام مراقبة وسجلات Webhook",
        "ملف توثيق تقني للـ API (API Docs)",
      ],
      exclusions: ["تعديل الأكواد البرمجية للأنظمة القديمة من طرف العميل"],
      ctaButton: "اطلب تكامل الـ API المباشر",
    },
  },
  {
    sku: "AUT-10",
    nameAr: "ربط بوابة دفع (Payment Gateway Integration)",
    nameEn: "Live Payment Gateway API Integration",
    categoryId: "AUT",
    subCategory: "بوابات الدفع الإلكتروني",
    status: "ready_to_sell",
    pricing: {
      amount: 3000,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 10,
    revisions: {
      count: 2,
      scope: "ضبط صفحات إعادة التوجيه وتنسيق رسائل الرد",
    },
    publicContent: {
      shortDescription:
        "ربط وتكامل فني لبوابة دفع إلكتروني معتمدة واحدة عبر صفحة دفع مستضافة مع تحقق خادمي آمن لحالة الطلب.",
      detailedDescription:
        "التأسيس والربط البرمجي الاحترافي لبوابة دفع إلكتروني واحدة على موقعك أو تطبيقك (مثل: Network International N-Genius KSA، PayTabs، Payzaty، Noon Payments، أو PayOne). يشمل العمل برمجة نقطة التحقق من التوكن، توجيه العميل إلى صفحة الدفع المستضافة الآمنة، استقبال والتحقق الخادمي الآمن من إشعارات الدفع (Server-Side Webhook Verification & HMAC Signature)، وحجب وعزل أرقام البطاقات المصرفية بنظام PCI-DSS Sanitized.",
      deliverables: [
        "ربط بوابة دفع واحدة بنمط Live",
        "صفحة دفع مستضافة",
        "تحقق خادمي من الـ Webhook وتوقيعه الرقمي",
        "تسجيل عمليات الدفع في لوحة التحكم",
        "اختبار عملي لمدفوعات حقيقية",
      ],
      exclusions: [
        "فتح الحساب البنكي أو الحصول على موافقة مزود البوابة",
        "تحصيل أموال المبيعات",
      ],
      ctaButton: "اطلب ربط بوابة الدفع",
    },
  },
  {
    sku: "AUT-11",
    nameAr: "بوابة عملاء (Client Portal)",
    nameEn: "Self-Service Client Portal",
    categoryId: "AUT",
    subCategory: "بوابات الخدمة الذاتية",
    status: "ready_to_sell",
    pricing: {
      amount: 7500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 20,
    revisions: {
      count: 2,
      scope: "تنسيق شاشات البوابة وتوزيع الحقول",
    },
    publicContent: {
      shortDescription:
        "بوابة ويب تفاعلية مخصصة لعملائك تتيح تسجيل الدخول، متابعة الطلبات، تحميل الملفات، وحالة الحساب دون فوترة معقدة.",
      detailedDescription:
        "توفير تجربة خدمة ذاتية راقية لعملائك تغنيك عن إرسال التحديثات والملفات بالبريد والواتساب يدوياً. تشمل البوابة واجهة دخول برقم الجوال أو البريد بكلمة مرور مشفرة، لوحة متابعة للعميل يستعرض فيها طلباته النشطة وتاريخ معاملاته، مستودعاً لتحميل الملفات والعقود والفواتير الخاصة به، ونظاماً لاستقبال طلبات التعديل أو الاستفسارات.",
      deliverables: [
        "تطبيق ويب لبوابة العملاء بهويتك",
        "نظام تسجيل دخول وتوثيق",
        "لوحة استعراض الطلبات والملفات",
        "لوحة إدارية لفريقك لرفع التحديثات",
      ],
      exclusions: [
        "نظام الفوترة والاشتراكات المتكررة التلقائية المعقدة",
        "بوابات التداول المالي",
      ],
      ctaButton: "اطلب بوابة عملائك الخاصة",
    },
  },
  {
    sku: "AUT-12",
    nameAr: "نموذج أولي لمنتج رقمي (MVP)",
    nameEn: "Functional Digital MVP Prototype",
    categoryId: "AUT",
    subCategory: "تطوير المنتجات الرقمية (SaaS & Apps)",
    status: "ready_to_sell",
    pricing: {
      amount: 9000,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 20,
    revisions: {
      count: 2,
      scope: "ضبط تدفق الرحلة والتفاعل البصري للشاشات",
    },
    publicContent: {
      shortDescription:
        "بناء وتطوير نموذج أولي عملي لمنتجك الرقمي يغطي رحلة مستخدم رئيسية واحدة وحتى 5 شاشات تفاعلية قابلة للاختبار.",
      detailedDescription:
        "تحويل فكرتك الريادية المبتكرة من مجرد رسومات نظرية إلى منتج رقمي واقعي شغال وملموس (Minimum Viable Product). نركز على القيمة الجوهرية للفكرة عبر بناء رحلة مستخدم أساسية واحدة تتضمن حتى 5 شاشات تفاعلية مبرمجة ومربوطة بقاعدة بيانات حقيقية، تمكنك من اختبار فكرتك مع المستخدمين الأوائل في السوق، وعرض نموذج شغال ومقنع أمام المستثمرين.",
      deliverables: [
        "تطبيق ويب تفاعلي شغال منشور على خادم تجريبي",
        "5 شاشات وظيفية",
        "قاعدة بيانات مصغرة",
        "تسليم الكود المصدري وتقرير فحص الأداء",
      ],
      exclusions: [
        "تطوير ميزات جانبية معقدة خارج الرحلة الجوهرية",
        "نشر التطبيق في متجري App Store و Google Play (يُبنى كـ Web App سريع)",
      ],
      ctaButton: "اطلب بناء نموذجك الأولي MVP",
    },
  },
  {
    sku: "DIG-01",
    nameAr: "قالب فاتورة وعرض سعر",
    nameEn: "Branded Invoice & Quotation Templates",
    categoryId: "DIG",
    subCategory: "القوالب المكتبية",
    status: "ready_to_sell",
    pricing: {
      amount: 700,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 4,
    revisions: {
      count: 2,
      scope: "توزيع الجداول وتنسيق الخطوط",
    },
    publicContent: {
      shortDescription:
        "قالبا فواتير وعروض أسعار رسميان ومخصصان بهوية شركتك قابلان للتعديل بالكامل على Word و Excel.",
      detailedDescription:
        "تصميم وإعداد ملفين رقميين فاخرين لإصدار فواتيرك وعروض أسعارك اليومية بأناقة تعكس هيبة علامتك. يشمل العمل قالب Excel مبرمجاً بمعادلات حساب المجموع وضريبة القيمة المضافة 15% تلقائياً، وقالب Word منسقاً للطباعة وتصدير الـ PDF، مع تضمين بياناتك الرسمية (السجل، الرقم الضريبي، الآيبان البنكي، وشروط الدفع).",
      deliverables: [
        "قالب فاتورة رسمي",
        "قالب عرض سعر رسمي (بصيغتي Word و Excel مفتوحة المصدر وقابلة للتعديل مدى الحياة)",
      ],
      exclusions: [
        'الربط مع هيئة الزكاة والضريبة والجمارك "زاتكا" للفوترة الإلكترونية المشفرة',
      ],
      ctaButton: "اطلب قوالب الفواتير والأسعار",
    },
  },
  {
    sku: "DIG-02",
    nameAr: "دليل PDF تفاعلي (Interactive PDF)",
    nameEn: "Interactive Digital PDF Guide & E-Book",
    categoryId: "DIG",
    subCategory: "النشر والكتب الرقمية",
    status: "ready_to_sell",
    pricing: {
      amount: 1200,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 6,
    revisions: {
      count: 2,
      scope: "تنسيق كتل النصوص والخطوط والصور",
    },
    publicContent: {
      shortDescription:
        "تصميم وإخراج دليل أو كتيب رقمي تفاعلي حتى 15 صفحة مع فهرس قابل للنقر وروابط خارجية وأناقة عربية.",
      detailedDescription:
        "تحويل محتواك التدريبي، دليلك الإرشادي، أو كتيبك التعريفي إلى وثيقة رقمية تفاعلية ممتعة للقراءة عبر شاشات الأجهزة الذكية والكمبيوتر. يشمل العمل تنسيق وإخراج حتى 15 صفحة بتصميم عربي راقٍ، مع بناء فهرس تفاعلي ينقلك للصفحة المطلوبة بنقرة واحدة، وتفعيل الروابط الخارجية للفيديوهات والمواقع.",
      deliverables: [
        "كتاب/دليل رقمي تفاعلي كامل حتى 15 صفحة",
        "فهرس وروابط نشطة",
        "نسخة خفيفة الوزن للمشاركة عبر الواتساب",
        "غلاف كتاب رقمي ثلاثي الأبعاد (3D Mockup)",
      ],
      exclusions: ["تأليف وكتابة محتوى الدليل من الصفر"],
      ctaButton: "اطلب تصميم دليلك التفاعلي",
    },
  },
  {
    sku: "DIG-03",
    nameAr: "نموذج PDF قابل للتعبئة (Fillable Form)",
    nameEn: "Fillable Interactive PDF Form",
    categoryId: "DIG",
    subCategory: "النماذج والمستندات الذكية",
    status: "ready_to_sell",
    pricing: {
      amount: 650,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 4,
    revisions: {
      count: 2,
      scope: "أحجام الحقول وتدقيق نصوص الشروط",
    },
    publicContent: {
      shortDescription:
        "تحويل استمارتك إلى نموذج PDF تفاعلي حتى 3 صفحات و20 حقلاً ذكياً يمكن تعبئته وحفظه من الجوال والكمبيوتر.",
      detailedDescription:
        "وداعاً لطباعة الأوراق وتعبئتها بالقلم وإعادة مسحها ضوئياً. نقوم بتصميم وبرمجة استمارة أو نموذج رسمي لشركتك حتى 3 صفحات، وبرمجة حتى 20 حقلاً تفاعلياً ذكياً تشمل: مربعات نصوص، خيارات متعددة، قوائم منسدلة، مساحات لإرفاق التوقيع الرقمي، وزر مخصص لمسح البيانات أو حفظ النموذج بعد التعبئة.",
      deliverables: [
        "نموذج PDF تفاعلي حتى 3 صفحات يضم حتى 20 حقلاً قابلاً للتعبئة والحفظ",
        "تصميم رسمي بهوية البراند",
        "اختبار التعبئة عبر مختلف الأجهزة",
      ],
      exclusions: ["الربط مع قواعد بيانات سحابية خلفية"],
      ctaButton: "اطلب نموذج PDF القابل للتعبئة",
    },
  },
  {
    sku: "DIG-04",
    nameAr: "لوحة متابعة جداول (Smart Sheet Tracker)",
    nameEn: "Automated Google Sheets / Excel Tracker",
    categoryId: "DIG",
    subCategory: "أدوات الإنتاجية والجداول",
    status: "ready_to_sell",
    pricing: {
      amount: 1200,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 5,
    revisions: {
      count: 2,
      scope: "إضافة أعمدة جديدة أو ضبط شروط التلوين التلقائي",
    },
    publicContent: {
      shortDescription:
        "بناء وتنسيق ملف جداول ذكي حتى 4 أوراق عمل تفاعلية مع معادلات آلية، تنبيهات لونية، و6 مؤشرات بيانية.",
      detailedDescription:
        "تحويل الجداول الفوضوية إلى نظام تشغيلي محكم يسهل متابعته على Google Sheets أو Excel. يشمل الملف تصميم 4 أوراق عمل مترابطة، مع برمجة المعادلات المتقدمة (VLOOKUP, SUMIFS, QUERY)، والتنسيق الشرطي اللوني الذي يبرز التنبيهات تلقائياً، وتوليد 6 رسوم بيانية ومؤشرات تلخص الوضع المالي والتشغيلي.",
      deliverables: [
        "ملف Excel / رابط Google Sheets تفاعلي يتضمن 4 أوراق عمل",
        "معادلات آلية محمية",
        "6 مؤشرات ورسوم بيانية",
        "فيديو شرح لكيفية الاستخدام (10 دقائق)",
      ],
      exclusions: ["إدخال البيانات القديمة التاريخية يدوياً"],
      ctaButton: "اطلب لوحة الجداول الذكية",
    },
  },
  {
    sku: "DIG-05",
    nameAr: "قوالب تشغيل للمشروع (Operations Kit)",
    nameEn: "Project Operations & Management Template Kit",
    categoryId: "DIG",
    subCategory: "التشغيل وإدارة المشاريع",
    status: "ready_to_sell",
    pricing: {
      amount: 900,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 5,
    revisions: {
      count: 2,
      scope: "تكييف بنود وحقول القوالب بما يناسب قطاع العمل",
    },
    publicContent: {
      shortDescription:
        "حزمة متكاملة من 5 قوالب تشغيلية احترافية تغطي: Brief، خطة العمل، محضر التسليم، المتابعة، وطلب التعديل.",
      detailedDescription:
        "تأسيس البنية التنظيمية لإدارة مشاريعك التجارية بأعلى معايير الانضباط والمهنية. تتضمن الحزمة 5 قوالب إدارية أساسية مخصصة لعلامتك: 1. نموذج استلام متطلبات المشروع (Client Brief)، 2. جدول خطة العمل والمراحل، 3. نموذج متابعة المهام، 4. نموذج طلب التعديل المنظم، 5. وثيقة محضر التسليم النهائي والاعتماد.",
      deliverables: [
        "5 قوالب رسمية متكاملة مصممة بهوية البراند بصيغتي Word و Google Docs",
        "دليل إرشادي لكيفية تطبيق كل قالب",
      ],
      exclusions: ["الصياغة القانونية للبنود الجزائية في العقود"],
      ctaButton: "اطلب حزمة قوالب التشغيل",
    },
  },
  {
    sku: "DIG-06",
    nameAr: "دليل إجراءات عمل (SOP Guide)",
    nameEn: "Standard Operating Procedures (SOP) Manual",
    categoryId: "DIG",
    subCategory: "التوثيق المؤسسي",
    status: "ready_to_sell",
    pricing: {
      amount: 1800,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 7,
    revisions: {
      count: 2,
      scope: "ضبط تفاصيل الخطوات وتحديد المسؤوليات لكل وظيفة",
    },
    publicContent: {
      shortDescription:
        "توثيق احترافي وهيكلة لـ 3 إجراءات عمل تشغيلية داخلية في شركتك من خلال جلسات استماع وتلخيص معتمدة.",
      detailedDescription:
        "نقل المعرفة والخبرات المتراكمة من رؤوس الموظفين إلى وثائق تشغيلية قياسية مكتوبة (SOP Manual). نقوم بعقد جلسات تفصيلية مع مسؤولي العمليات، وتوثيق 3 إجراءات حيوية خطوة بخطوة، مدعمة بالمخططات التوضيحية، المسؤوليات، قوائم الفحص (Checklists)، ومعايير الجودة، ليتمكن أي موظف جديد من أداء المهمة بنفس الجودة فوراً.",
      deliverables: [
        "وثيقة دليل إجراءات عمل قياسي (PDF فاخر من 15 إلى 25 صفحة) توثق 3 عمليات",
        "قوائم فحص سريعة لكل عملية",
      ],
      exclusions: [
        "التوثيق الإجرائي لشهادات الأيزو والاعتمادات الدولية المتخصصة",
      ],
      ctaButton: "اطلب توثيق إجراءات العمل SOP",
    },
  },
  {
    sku: "DIG-07",
    nameAr: "ورشة استخدام AI",
    nameEn: "Hands-On AI Productivity Workshop",
    categoryId: "DIG",
    subCategory: "ورش العمل والتدريب",
    status: "ready_to_sell",
    pricing: {
      amount: 1200,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 1,
    revisions: {
      count: 0,
      scope: "خدمة تدريبية مباشرة مع تفاعل حي طوال الورشة",
    },
    publicContent: {
      shortDescription:
        "ورشة تدريبية تطبيقية عن بعد لمدة ساعتين حتى 5 أشخاص لتمكين فريقك من استغلال أدوات الـ AI في مهامهم اليومية.",
      detailedDescription:
        "ورشة عمل تفاعلية مباشرة ومكثفة تركز على التطبيق العملي لتقنيات الذكاء الاصطناعي في بيئة العمل الحقيقية. تستهدف فريقاً صغيراً حتى 5 أشخاص، ويتم تدريبهم على كيفية صياغة الأوامر المتقدمة (Prompting)، استخدام نماذج ChatGPT, Claude, و Gemini في كتابة المحتوى، تلخيص الاجتماعات، إعداد التقارير السريعة، وتحليل جداول البيانات.",
      deliverables: [
        "ورشة عمل مباشرة عن بعد مدتها 120 دقيقة (مسجلة بالكامل) حتى 5 مقاعد",
        "حقيبة تدريبية PDF",
        "بنك يحتوي على 20 برومبت تطبيقي",
      ],
      exclusions: ["رسوم اشتراكات الحسابات المدفوعة للمتدربين"],
      ctaButton: "احجز ورشة العمل لفريقك",
    },
  },
  {
    sku: "DIG-08",
    nameAr: "تدريب AI لفريق (Corporate Program)",
    nameEn: "Advanced Enterprise AI Training Program",
    categoryId: "DIG",
    subCategory: "برامج التدريب المؤسسي",
    status: "ready_to_sell",
    pricing: {
      amount: 2500,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 14,
    revisions: {
      count: 0,
      scope: "برنامج تفاعلي حي مع مراجعة وتقييم فردي لتمارين المتدربين",
    },
    publicContent: {
      shortDescription:
        "برنامج تدريبي مؤسسي متقدم لمدة 4 ساعات مقسمة حتى 10 متدربين مع تمارين متخصصة مرتبطة بمجال شركتك.",
      detailedDescription:
        "برنامج التدريب الأعمق والأشمل لتأهيل كوادر شركتك ودمج الذكاء الاصطناعي في ثقافتهم التشغيلية اليومية. يمتد البرنامج لـ 4 ساعات تدريبية مكثفة (يمكن تقسيمها على يومين) لـ 10 متدربين، ويتعمق في: هندسة الأوامر المتقدمة، بناء المساعدات المخصصة، أتمتة تدفقات العمل، تحليل البيانات الضخمة، والتعامل الآمن مع الخصوصية.",
      deliverables: [
        "4 ساعات تدريبية مباشرة عن بعد لـ 10 متدربين",
        "تسجيلات البرنامج كاملة",
        "حقيبة تدريبية ومصادر متقدمة (PDF)",
        "شهادات حضور رقمية للمتدربين",
      ],
      exclusions: [
        "التدريب الحضوري الميداني خارج الرياض",
        "رسوم الاشتراكات البرمجية الخاصة",
      ],
      ctaButton: "اطلب برنامج تدريب الفريق",
    },
  },
  {
    sku: "DIG-09",
    nameAr: "تدريب إدارة الموقع",
    nameEn: "Website & Store CMS Management Training",
    categoryId: "DIG",
    subCategory: "التمكين والدعم الفني",
    status: "ready_to_sell",
    pricing: {
      amount: 500,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 3,
    revisions: {
      count: 0,
      scope: "جلسة مباشرة مع إتاحة الاستفسارات طوال الـ 90 دقيقة",
    },
    publicContent: {
      shortDescription:
        "جلسة تدريبية عملية وتفاعلية لمدة 90 دقيقة لشرح كيفية إدارة وتحديث موقعك أو متجرك بنفسك مع تسجيل ودليل.",
      detailedDescription:
        "جلسة تمكين شخصية مباشرة تنقل لك أو لموظفك أسرار وخفايا إدارة موقعك أو متجرك الإلكتروني (سلة، زد، ووردبريس، أو شوبيفاي) باحترافية وسهولة تامة. نشرح فيها خطوة بخطوة: طريقة إضافة المنتجات والخدمات الجديدة، تعديل الأسعار والعروض، تغيير البنرات والصور، ومتابعة حالات الطلبات.",
      deliverables: [
        "جلسة تدريب تفاعلية مرئية 90 دقيقة (فردية أو حتى 3 أفراد)",
        "تسجيل مرئي كامل للجلسة",
        "دليل إرشادي سريع بصيغة PDF بالخطوات المصورة",
      ],
      exclusions: [
        "البرمجة أو إصلاح أعطال الموقع (مخصصة لشرح وتدريب الإدارة والتشغيل للموقع القائم)",
      ],
      ctaButton: "احجز جلسة تدريب إدارة الموقع",
    },
  },
  {
    sku: "DIG-10",
    nameAr: "حزمة قوالب محتوى جاهزة",
    nameEn: "Ready-to-Use Social Content Templates Pack",
    categoryId: "DIG",
    subCategory: "المنتجات الرقمية الجاهزة",
    status: "needs_creation_and_testing",
    pricing: {
      amount: 199,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 0,
    revisions: {
      count: 0,
      scope: "منتج رقمي عام يباع كما هو",
    },
    publicContent: {
      shortDescription:
        "حزمة رقمية عامة من 30 قالباً احترافياً قابلاً للتعديل لمنصات التواصل دون تخصيص مسبق للعلامة.",
      detailedDescription:
        "منتج رقمي جاهز ومصمم بعناية لتوفير الوقت والمال. تتضمن الحزمة 30 قالباً بصرياً متنوعاً عالي الجودة على منصة Canva ومصممة بأبعاد السوشيال ميديا الشائعة (منشورات ترويجية، إعلانات خصومات، نصائح، اقتباسات)، جاهزة للتعديل الفوري عبر إضافة صورك ونصوصك وتغيير الألوان بنقرة زر واحدة.",
      deliverables: [
        "رابط وصول رقمي دائم لحزمة 30 قالباً قابلاً للتعديل على Canva",
        "دليل مختصر لاستبدال الألوان والنصوص PDF",
      ],
      exclusions: ["التخصيص اليدوي من فريق ونشوت", "كتابة المحتوى"],
      ctaButton: "احصل على حزمة القوالب الجاهزة",
    },
    internalReadiness: {
      proposalBasis: "expansion_proposal",
      readinessStatus: "needs_creation_and_testing",
      launchRequirements:
        "إنهاء تصميم الـ 30 قالباً وتجهيز صفحة التسليم التلقائي",
      estimatedEffortHours: 15,
    },
  },
  {
    sku: "DIG-11",
    nameAr: "مكتبة تعليمات AI جاهزة",
    nameEn: "Curated Business Prompt Vault",
    categoryId: "DIG",
    subCategory: "المنتجات الرقمية الجاهزة",
    status: "needs_creation_and_testing",
    pricing: {
      amount: 149,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 0,
    revisions: {
      count: 0,
      scope: "منتج رقمي عام يباع كما هو",
    },
    publicContent: {
      shortDescription:
        "مكتبة رقمية منظمة ومصنفة تضم 50 قالب توجيه وبرومبت ذكاء اصطناعي عام ومختبر لمختلف الأنشطة التجارية.",
      detailedDescription:
        "خلاصة مئات ساعات التجربة والخطأ في هندسة الأوامر مجموعة في خزينة رقمية واحدة. تتضمن المكتبة 50 برومبت متقدماً ومختبراً بعناية لمختلف مهام الشركات والمتاجر (التسويق، المبيعات، خدمة العملاء، إعداد الخطط، صياغة الإيميلات، والأفكار الإبداعية)، مصنفة في فئات مرتبة، مع شروحات وتطبيقات وأمثلة.",
      deliverables: [
        "مستند رقمي تفاعلي (PDF + مساحة Notion تفاعلية) يضم 50 برومبت مصنفاً",
        "أمثلة حية ودليل إرشادي للتطبيق",
      ],
      exclusions: ["التخصيص اليدوي للبرومبتات وفق نبرة وهوية علامتك"],
      ctaButton: "احصل على مكتبة البرومبتات الآن",
    },
    internalReadiness: {
      proposalBasis: "expansion_proposal",
      readinessStatus: "needs_creation_and_testing",
      launchRequirements:
        "تجميع واختبار الأوامر الـ 50 وبناء قالب Notion التفاعلي",
      estimatedEffortHours: 12,
    },
  },
  {
    sku: "DIG-12",
    nameAr: "حزمة انطلاقة المستقل (Freelancer Launch Kit)",
    nameEn: "Freelancer Commercial Starter Kit",
    categoryId: "DIG",
    subCategory: "تمكين العمل الحر",
    status: "needs_creation_and_testing",
    pricing: {
      amount: 249,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 0,
    revisions: {
      count: 0,
      scope: "منتج رقمي عام يباع كما هو",
    },
    publicContent: {
      shortDescription:
        "حزمة رقمية تضم 5 قوالب أساسية للمستقلين تشمل: عروض الأسعار، نماذج التواصل، عقود العمل، ومحاضر التسليم.",
      detailedDescription:
        "الصندوق السحري لكل مستقل ومقدم خدمات حرة يسعى للتعامل بمهنية عالية مع عملائه. تتضمن الحزمة 5 قوالب عملية منسقة: 1. قالب عرض سعر مالي ومهني جذاب، 2. نموذج عقد عمل حر لحفظ الحقوق والشروط، 3. قوالب رسائل تواصل احترافية مع العملاء، 4. نموذج استلام المتطلبات (Brief)، و 5. نموذج محضر التسليم وطلب التقييم.",
      deliverables: [
        "5 قوالب مستندات رقمية بصيغتي Word و Google Docs قابلة للتعديل",
        "دليل إرشادي لكيفية تسعير خدماتك وإدارة العميل",
      ],
      exclusions: ["التخصيص اليدوي باسم المستقل أو علامته"],
      ctaButton: "احصل على حزمة المستقل الآن",
    },
    internalReadiness: {
      proposalBasis: "expansion_proposal",
      readinessStatus: "needs_creation_and_testing",
      launchRequirements: "تجهيز القوالب الخمسة وتنسيق الدليل التسعيري الملحق",
      estimatedEffortHours: 10,
    },
  },
  {
    sku: "MKT-01",
    nameAr: "جلسة تشخيص تسويقي",
    nameEn: "Marketing Diagnostic Session",
    categoryId: "MKT",
    subCategory: "الاستشارات والتشخيص",
    status: "ready_to_sell",
    pricing: {
      amount: 450,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 2,
    revisions: {
      count: 1,
      scope: "توضيح وتدقيق وثيقة الأولويات والخطوات التنفيذية",
    },
    publicContent: {
      shortDescription:
        "جلسة استشارية مركزة 90 دقيقة لتحليل وضع مشروعك التسويقي وترتيب أولويات النمو السريع.",
      deliverables: [
        "جلسة مرئية 90 دقيقة مسجلة",
        "تقرير أولويات تنفيذي PDF من 2-3 صفحات",
      ],
      exclusions: [
        "تنفيذ الحملات الإعلانية",
        "إدارة الحسابات",
        "كتابة المحتوى",
      ],
      ctaButton: "احجز جلسة التشخيص الآن",
      seo: {
        title: "جلسة تشخيص تسويقي للمشاريع | ونشوت OneShot",
        description:
          "احجز جلسة تشخيص تسويقي مركزة لمدة 90 دقيقة واكتشف فجوات مشروعك مع ونشوت.",
      },
    },
  },
  {
    sku: "MKT-05",
    nameAr: "خطة محتوى شهرية",
    nameEn: "Monthly Content Strategy Calendar",
    categoryId: "MKT",
    subCategory: "صناعة المحتوى",
    status: "ready_to_sell",
    pricing: {
      amount: 900,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 5,
    revisions: {
      count: 2,
      scope: "تعديل الأفكار والزوايا",
    },
    publicContent: {
      shortDescription:
        "تقويم محتوى لـ 30 يوماً لمنصتين يضم 20 فكرة وزاوية بيعية مبتكرة متناغمة مع سلوك السوق السعودي.",
      deliverables: [
        "جدول محتوى تفاعلي لـ 30 يوماً",
        "20 فكرة محتوى وزاوية تصوير",
        "أدلة التوقيت والهاشتاقات المعتمدة",
      ],
      exclusions: ["التصميم والمونتاج الفعلي"],
      ctaButton: "اطلب خطة المحتوى الشهرية",
    },
  },
  {
    sku: "MKT-06",
    nameAr: "كتابة محتوى اجتماعي",
    nameEn: "Social Media Copywriting Pack",
    categoryId: "MKT",
    subCategory: "الكتابة الإعلانية",
    status: "ready_to_sell",
    pricing: {
      amount: 650,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 4,
    revisions: {
      count: 2,
      scope: "ضبط النبرة والكلمات المفتاحية",
    },
    publicContent: {
      shortDescription:
        "صياغة نصوص إعلانية وكابشنز إبداعية لـ 10 منشورات تفاعلية بنبرة صوت تناسب علامتك.",
      deliverables: [
        "نصوص لـ 10 منشورات بصرية",
        "كول تو أكشن CTA مدروس لكل منشور",
        "وسوم الهاشتاق المخصصة",
      ],
      exclusions: ["التصاميم الجرافيكية"],
      ctaButton: "اطلب نصوص المحتوى",
    },
  },
  {
    sku: "MKT-10",
    nameAr: "أوصاف منتجات متجر (20 منتجاً)",
    nameEn: "E-Commerce Product Descriptions (20 Items)",
    categoryId: "MKT",
    subCategory: "التجارة الإلكترونية",
    status: "ready_to_sell",
    pricing: {
      amount: 800,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 5,
    revisions: {
      count: 2,
      scope: "تعديل الصياغة والتركيز على المزايا",
    },
    publicContent: {
      shortDescription:
        "كتابة أوصاف تسويقية بيعية مقنعة لـ 20 منتجاً في متجرك تعزز قرارات الشراء وتتوافق مع الـ SEO.",
      deliverables: [
        "أوصاف 20 منتجاً بصيغ بيعية جذابة",
        "نقاط الفوائد الرئيسية والمواصفات",
        "كلمات مفتاحية لمحركات البحث",
      ],
      exclusions: ["رفع المنتجات على لوحة التحكم (يتوفر كإضافة)"],
      ctaButton: "اطلب كتابة أوصاف المنتجات",
    },
  },
  {
    sku: "MED-01",
    nameAr: "تصميم منشور منفرد",
    nameEn: "Single Social Media Graphic",
    categoryId: "MED",
    subCategory: "التصميم الجرافيكي",
    status: "ready_to_sell",
    pricing: {
      amount: 180,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 2,
    revisions: {
      count: 2,
      scope: "تعديل الألوان أو الخطوط",
    },
    publicContent: {
      shortDescription:
        "تصميم جرافيكي فاخر لمنشور واحد بمقاسين (مربع وستوري) متطابق مع هوية البراند وتصميم 2026.",
      deliverables: [
        "تصميم عالي الدقة بمقاسين 1:1 و 9:16",
        "ملف مفتوح المصدر PSD/Figma",
      ],
      exclusions: ["كتابة المحتوى من الصفر"],
      ctaButton: "اطلب تصميم منشور",
    },
  },
  {
    sku: "MED-02",
    nameAr: "باقة تصاميم اجتماعية (10 تصاميم)",
    nameEn: "Social Media Design Pack (10 Graphics)",
    categoryId: "MED",
    subCategory: "التصميم الجرافيكي",
    status: "ready_to_sell",
    pricing: {
      amount: 1500,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 6,
    revisions: {
      count: 2,
      scope: "مراجعة جماعية للتصاميم",
    },
    publicContent: {
      shortDescription:
        "باقة 10 تصاميم سوشيال ميديا فاخرة ومتناسقة مع هوية ونشوت تدعم حضورك الرقمي طوال الشهر.",
      deliverables: [
        "10 تصاميم إبداعية فريدة بمقاسين",
        "ملفات التصدير الجاهزة للنشر",
      ],
      exclusions: ["إدارة الحسابات أو النشر اليدوي"],
      ctaButton: "اطلب باقة التصاميم",
    },
  },
  {
    sku: "MED-05",
    nameAr: "مونتاج فيديو قصير (ريلز / تيك توك)",
    nameEn: "Short-Form Video Editing (Reels/TikTok)",
    categoryId: "MED",
    subCategory: "إنتاج الفيديو",
    status: "ready_to_sell",
    pricing: {
      amount: 400,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 3,
    revisions: {
      count: 2,
      scope: "تعديل المؤثرات أو سرعة التقطيع",
    },
    publicContent: {
      shortDescription:
        "مونتاج احترافي لمقطع فيديو قصير حتى 60 ثانية مع ترندات الصوت، نصوص متحركة، ومؤثرات مشوقة.",
      deliverables: [
        "فيديو ممنتج عالي الدقة 1080x1920",
        "إضافة النصوص التوضيحية المتحركة والعناوين الجاذبة",
      ],
      exclusions: ["التصوير الميداني"],
      ctaButton: "اطلب مونتاج الفيديو",
    },
  },
  {
    sku: "BRD-04",
    nameAr: "تصميم شعار احترافي",
    nameEn: "Professional Logo Design",
    categoryId: "BRD",
    subCategory: "الشعارات",
    status: "ready_to_sell",
    pricing: {
      amount: 1800,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 7,
    revisions: {
      count: 3,
      scope: "تطوير المفهوم المختار",
    },
    publicContent: {
      shortDescription:
        "ابتكار شعار أصيل وفاخر يعبر عن عمق مشروعك مع تقديم 3 مفاهيم بصرية مختلفة وملفات فيكتور كاملة.",
      deliverables: [
        "3 خيارات ابتكارية وتطوير الخيار الفائز",
        "كافة صيغ الفيكتور (SVG, AI, PDF, PNG)",
        "دليل مصغر للاستخدام",
      ],
      exclusions: ["تصميم الهوية الكاملة وتطبيقاتها"],
      ctaButton: "اطلب تصميم الشعار",
    },
  },
  {
    sku: "BRD-05",
    nameAr: "هوية بصرية أساسية",
    nameEn: "Essential Brand Identity System",
    categoryId: "BRD",
    subCategory: "الهوية والعلامة التجارية",
    status: "ready_to_sell",
    pricing: {
      amount: 3500,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 10,
    revisions: {
      count: 2,
      scope: "تنسيق التطبيقات والألوان",
    },
    publicContent: {
      shortDescription:
        "تأسيس نظام الهوية البصرية المتكامل لمشروعك: الشعار، الألوان والخطوط، بطاقة الأعمال، وتوقيع الإيميل.",
      deliverables: [
        "شعار أصيل مع دليله التعريفي (15 صفحة)",
        "لوحة الألوان الرسمية وتنسيقات الخطوط",
        "تصميم بطاقة الأعمال، ورق المراسلات، وتوقيع الإيميل",
      ],
      exclusions: ["طباعة المطبوعات الورقية"],
      ctaButton: "اطلب الهوية الأساسية",
    },
  },
  {
    sku: "BRD-06",
    nameAr: "هوية بصرية متكاملة وشاملة",
    nameEn: "Comprehensive Enterprise Brand Identity",
    categoryId: "BRD",
    subCategory: "الهوية والعلامة التجارية",
    status: "ready_to_sell",
    pricing: {
      amount: 6500,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 20,
    revisions: {
      count: 3,
      scope: "تعديل التطبيقات ودليل الهوية",
    },
    publicContent: {
      shortDescription:
        "نظام علامة تجارية مؤسسي كامل مع 6 تطبيقات تجارية ودليل علامة مفصل 25 صفحة وفق معايير 2026.",
      deliverables: [
        "شعار مؤسسي متقدم مع حالات الاستخدام",
        "دليل هوية 25 صفحة مفصل",
        "6 تطبيقات تشمل: أزياء الموظفين، أظرف، سيارات، ولافتات",
      ],
      exclusions: ["الإنتاج والطباعة الفعلية"],
      ctaButton: "اطلب الهوية المتكاملة",
    },
  },
  {
    sku: "WEB-01",
    nameAr: "صفحة هبوط (Landing Page)",
    nameEn: "High-Converting Landing Page",
    categoryId: "WEB",
    subCategory: "صفحات الهبوط",
    status: "ready_to_sell",
    pricing: {
      amount: 2000,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 7,
    revisions: {
      count: 2,
      scope: "تعديل النصوص والتنسيقات البصرية",
    },
    publicContent: {
      shortDescription:
        "صفحة هبوط تسويقية فائقة السرعة حتى 7 أقسام متوافقة مع الجوال ومربوطة بنماذج التواصل والتحويلات.",
      deliverables: [
        "صفحة هبوط متجاوبة حتى 7 أقسام",
        "ربط نموذج التواصل بالبريد أو الواتساب",
        "سرعة تحميل أقل من 1.5 ثانية",
      ],
      exclusions: ["تكلفة الاستضافة السحابية واسم النطاق (الدومين)"],
      ctaButton: "اطلب صفحة الهبوط",
    },
  },
  {
    sku: "WEB-02",
    nameAr: "موقع تعريفي مؤسسي",
    nameEn: "Corporate Website (Up to 5 Pages)",
    categoryId: "WEB",
    subCategory: "المواقع المؤسسية",
    status: "ready_to_sell",
    pricing: {
      amount: 4500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 15,
    revisions: {
      count: 2,
      scope: "مراجعة الصفحات وهيكل التصفح",
    },
    publicContent: {
      shortDescription:
        "موقع مؤسسي رسمي راقٍ حتى 5 صفحات بنظام إدارة محتوى سهل ولوحة تحكم عربية بهوية OneShot 2026.",
      deliverables: [
        "موقع كامل حتى 5 صفحات (الرئيسية، عنا، الخدمات، المعرض، اتصل بنا)",
        "لوحة تحكم لإدارة المحتوى",
        "تهيئة محركات البحث SEO الأساسية",
      ],
      exclusions: ["كتابة المحتوى من الصفر (يتوفر كإضافة)"],
      ctaButton: "اطلب موقعك المؤسسي",
    },
  },
  {
    sku: "WEB-04",
    nameAr: "متجر إلكتروني على منصة جاهزة",
    nameEn: "Turnkey E-Commerce Store Setup",
    categoryId: "WEB",
    subCategory: "المتاجر الإلكترونية",
    status: "ready_to_sell",
    pricing: {
      amount: 5500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 15,
    revisions: {
      count: 2,
      scope: "تنسيق الصفحة الرئيسية وتوزيع المنتجات",
    },
    publicContent: {
      shortDescription:
        "تأسيس وتهيئة متجر احترافي كامل على منصة سلة، زد، أو شوبيفاي مع ربط بوابات الدفع والشحن والبنرات.",
      deliverables: [
        "تهيئة المتجر وضبط القالب بالكامل",
        "ربط بوابات الدفع الإلكتروني وشركات الشحن",
        "تصميم 3 بنرات ترويجية متحركة",
        "إدخال 15 منتجاً أولياً",
      ],
      exclusions: ["اشتراكات باقات المنصة السنوية"],
      ctaButton: "اطلب متجرك الإلكتروني",
    },
  },
  {
    sku: "AI-02",
    nameAr: "حزمة تعليمات AI للعلامة",
    nameEn: "Brand Voice Prompt Engineering Kit",
    categoryId: "AI",
    subCategory: "هندسة الأوامر والنماذج",
    status: "ready_to_sell",
    pricing: {
      amount: 1200,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 5,
    revisions: {
      count: 2,
      scope: "ضبط النبرة ونتائج التجارب",
    },
    publicContent: {
      shortDescription:
        "هندسة وبرمجة 15 قالباً موجهاً للأوامر (Prompts) مخصصة لنبرة وصوت علامتك التجارية لمهام التسويق.",
      deliverables: [
        "15 قالباً متقدماً للأوامر لـ 3 مهام رئيسية",
        "دليل تطبيق وتوثيق لاستخدامها على ChatGPT و Gemini",
      ],
      exclusions: ["رسوم اشتراكات نماذج AI"],
      ctaButton: "اطلب حزمة تعليمات AI",
    },
  },
  {
    sku: "AI-04",
    nameAr: "مساعد ملفات الشركة (RAG)",
    nameEn: "Enterprise Document AI Assistant (RAG)",
    categoryId: "AI",
    subCategory: "أنظمة استرجاع المعرفة",
    status: "ready_to_sell",
    pricing: {
      amount: 5500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 15,
    revisions: {
      count: 2,
      scope: "ضبط دقة الإجابات وتصفية الملفات المرفوعة",
    },
    publicContent: {
      shortDescription:
        "مساعد ذكي متقدم يستخرج الإجابات فوراً من مستندات وملفات شركتك حتى 50 ملفاً و500 صفحة مع ذكر المصدر.",
      deliverables: [
        "نظام استعلام ذكي متصل بـ 50 ملفاً و500 صفحة",
        "واجهة استخدام ويب محمية",
        "ذكر المصدر ورقم الصفحة في كل رد",
      ],
      exclusions: [
        "معالجة المستندات الممسوحة ضوئياً الرديئة يدوياً",
        "استهلاك API النماذج",
      ],
      ctaButton: "اطلب مساعد ملفات الشركة",
    },
  },
  {
    sku: "AI-05",
    nameAr: "روبوت محادثة للموقع (Smart Chatbot)",
    nameEn: "AI Website Chat Widget & Lead Qualifier",
    categoryId: "AI",
    subCategory: "مساعدات الويب والتأهيل",
    status: "ready_to_sell",
    pricing: {
      amount: 3500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 10,
    revisions: {
      count: 2,
      scope: "ضبط نصوص الردود وحالات التحويل",
    },
    publicContent: {
      shortDescription:
        "شات بوت ذكي مدمج في موقعك مدرب على 30 سؤالاً مع تأهيل الزوار وتحويلهم تلقائياً للواتساب.",
      deliverables: [
        "ودجت محادثة متجاوب مدمج في الموقع",
        "قاعدة معرفية لـ 30 سؤالاً شائعاً",
        "زر تحويل فوري لمحادثة الواتساب مع ملخص الطلب",
      ],
      exclusions: ["تكلفة استهلاك واجهات الذكاء الاصطناعي السحابية"],
      ctaButton: "اطلب شات بوت لموقعك",
    },
  },
  {
    sku: "AI-06",
    nameAr: "واجهة AI مخصصة باسم العميل",
    nameEn: "Custom Branded AI Portal",
    categoryId: "AI",
    subCategory: "بوابات الذكاء الاصطناعي الخاصة",
    status: "ready_to_sell",
    pricing: {
      amount: 7500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 20,
    revisions: {
      count: 2,
      scope: "تنسيق الواجهة ونظام المصادقة",
    },
    publicContent: {
      shortDescription:
        "بوابة ومنصة ذكاء اصطناعي مستقلة تحمل هوية ونطاق شركتك الخاص مع تسجيل دخول وتخزين محادثات للموظفين.",
      deliverables: [
        "منصة محادثة ذكية متكاملة بهوية البراند",
        "نظام تسجيل دخول مشفر للموظفين",
        "تخزين سجلات المحادثات",
        "لوحة إدارة",
      ],
      exclusions: ["تكاليف الخادم الخاص واستهلاك الـ APIs"],
      ctaButton: "اطلب بوابة AI لشركتك",
    },
  },
  {
    sku: "AI-08",
    nameAr: "إعداد AI محلي (Local LLM)",
    nameEn: "Private On-Premise Local LLM Setup",
    categoryId: "AI",
    subCategory: "الخصوصية والأنظمة المعزولة",
    status: "ready_to_sell",
    pricing: {
      amount: 1500,
      currency: "SAR",
      type: "starts_at",
      billingCycle: "one_time",
    },
    deliveryDays: 4,
    revisions: {
      count: 1,
      scope: "فحص توافق عتاد الكمبيوتر وسرعة التوليد",
    },
    publicContent: {
      shortDescription:
        "تثبيت وتشغيل نموذج ذكاء اصطناعي على أجهزة شركتك يعمل بدون إنترنت وبخصوصية تامة 100% مع واجهة دردشة.",
      deliverables: [
        "تثبيت وضبط بيئة Ollama / LM Studio",
        "تشغيل نموذج عربي متميز محلياً",
        "واجهة مستخدم ويب محلية سريعة",
      ],
      exclusions: [
        "توفير أجهزة العتاد والكمبيوتر (يجب توفر جهاز بمواصفات كافية)",
      ],
      ctaButton: "اطلب إعداد AI المحلي",
    },
  },
  {
    sku: "AI-18",
    nameAr: "تقييم جودة مساعد (Quality & Hallucination Audit)",
    nameEn: "AI Bot Evaluation & Hallucination Audit",
    categoryId: "AI",
    subCategory: "الفحص والتدقيق وضمان الجودة",
    status: "ready_to_sell",
    pricing: {
      amount: 2000,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 7,
    revisions: {
      count: 1,
      scope: "تدقيق وثيقة التقييم والتوصيات",
    },
    publicContent: {
      shortDescription:
        "اختبار وفحص وتدقيق 50 حالة استعلام لنظام الذكاء الاصطناعي للتأكد من انعدام الهلوسة ودقة الردود.",
      deliverables: [
        "فحص 50 سيناريو استعلام واستفزاز للنظام",
        "تقرير تقييم دقة الردود ونقاط الضعف",
        "حزمة تحسينات وتعديل برومبت الحماية",
      ],
      exclusions: ["إعادة برمجة النظام من الصفر إذا كان تالفاً"],
      ctaButton: "اطلب فحص جودة المساعد",
    },
  },
  {
    sku: "SOC-01",
    nameAr: "تهيئة الحسابات الاجتماعية",
    nameEn: "Social Media Account Setup & Optimization",
    categoryId: "SOC",
    subCategory: "التأسيس والتهيئة",
    status: "ready_to_sell",
    pricing: {
      amount: 650,
      currency: "SAR",
      type: "fixed",
      billingCycle: "one_time",
    },
    deliveryDays: 3,
    revisions: {
      count: 2,
      scope: "تعديل البايو وتصميم الأغلفة",
    },
    publicContent: {
      shortDescription:
        "تهيئة وتجهيز حسابين اجتماعيين بأغلفة وبايو احترافي وروابط تفاعلية تليق بظهور علامتك التجاري.",
      deliverables: [
        "تصميم الغلاف وصورة الحساب لمنصتين",
        "كتابة بايو تسويقي جاذب متوافق مع SEO",
        "ضبط الروابط والهايلايتس الأساسية",
      ],
      exclusions: ["النشر اليومي"],
      ctaButton: "اطلب تهيئة الحسابات",
    },
  },
  {
    sku: "SOC-02",
    nameAr: "إدارة الحضور الأساسي (شهري)",
    nameEn: "Essential Social Presence (Monthly)",
    categoryId: "SOC",
    subCategory: "الإدارة والتشغيل المستمر",
    status: "ready_to_sell",
    pricing: {
      amount: 1800,
      currency: "SAR",
      type: "fixed",
      billingCycle: "monthly",
    },
    deliveryDays: 30,
    revisions: {
      count: 2,
      scope: "اعتماد أسبوعي مسبق للمنشورات",
    },
    publicContent: {
      shortDescription:
        "إدارة وتشغيل لمنصتين: 8 منشورات أصلية مصممة ومكتوبة + 8 قصص مشتقة + جدولة آلية + تقرير شهري.",
      deliverables: [
        "8 منشورات أصلية مصممة ومكتوبة شهرياً",
        "8 قصص ستوري تفاعلية",
        "جدولة النشر التلقائي",
        "تقرير أداء شهري",
      ],
      exclusions: [
        "الرد على التعليقات والرسائل الخاصة",
        "إدارة الإعلانات الممولة",
      ],
      ctaButton: "اشترك في باقة الحضور",
    },
  },
  {
    sku: "SOC-03",
    nameAr: "إدارة حضور ونمو (شهري)",
    nameEn: "Growth Social Management (Monthly)",
    categoryId: "SOC",
    subCategory: "الإدارة والتشغيل المستمر",
    status: "ready_to_sell",
    pricing: {
      amount: 3200,
      currency: "SAR",
      type: "fixed",
      billingCycle: "monthly",
    },
    deliveryDays: 30,
    revisions: {
      count: 2,
      scope: "اعتماد نصف شهري",
    },
    publicContent: {
      shortDescription:
        "تشغيل وتغطية موسعة لمنصتين: 12 منشوراً + 12 قصة + فيديوهان ريلز قصيران ممنتجان مع تقارير أداء.",
      deliverables: [
        "12 منشوراً مصمماً ومكتوباً",
        "12 قصة ستوري",
        "فيديوهان ريلز قصيران ممنتجان",
        "متابعة أسبوعية وتقارير نمو",
      ],
      exclusions: ["ميزانية الإعلانات الممولة"],
      ctaButton: "اشترك في إدارة النمو",
    },
  },
  {
    sku: "SOC-07",
    nameAr: "إدارة إعلانات شهرية",
    nameEn: "Monthly Paid Ads Management",
    categoryId: "SOC",
    subCategory: "الإعلانات الممولة",
    status: "ready_to_sell",
    pricing: {
      amount: 1500,
      currency: "SAR",
      type: "fixed",
      billingCycle: "monthly",
    },
    deliveryDays: 30,
    revisions: {
      count: 2,
      scope: "تعديل الجماهير والبنرات الإعلانية",
    },
    publicContent: {
      shortDescription:
        "إدارة ومتابعة وتحسين حملتين إعلانيتين على منصة واحدة بميزانية حتى 10,000 ريال شهرياً لتحقيق أعلى عائد ROAS.",
      deliverables: [
        "إدارة ومتابعة يومية للحملات الإعلانية",
        "اختبار الجماهير A/B Testing",
        "تقارير أسبوعية وشهرية بالنتائج والمبيعات",
      ],
      exclusions: ["ميزانية الإعلانات المدفوعة للمنصة"],
      ctaButton: "اطلب إدارة الإعلانات",
    },
  },
  {
    sku: "WEB-14",
    nameAr: "صيانة موقع ودعم تقني (شهري)",
    nameEn: "Monthly Website Care & Support",
    categoryId: "WEB",
    subCategory: "الصيانة والدعم",
    status: "ready_to_sell",
    pricing: {
      amount: 450,
      currency: "SAR",
      type: "fixed",
      billingCycle: "monthly",
    },
    deliveryDays: 30,
    revisions: {
      count: 0,
      scope: "تحديثات دورية وساعتا دعم فني",
    },
    publicContent: {
      shortDescription:
        "رعاية موقعك وضمان أمانه وسرعته ونسخ احتياطي دوري وساعتا دعم فني برمجي مباشر شهرياً.",
      deliverables: [
        "نسخ احتياطي أسبوعي آمن",
        "تحديثات الأمان والقوالب الدورية",
        "ساعتا عمل برمجي مخصصة للتعديلات شهرياً",
      ],
      exclusions: ["إعادة بناء الموقع أو ميزات جديدة ضخمة"],
      ctaButton: "اشترك في صيانة الموقع",
    },
  },
];

export type Product = (typeof products)[number];
