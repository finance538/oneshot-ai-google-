package com.example.oneshot.data.repository

import com.example.oneshot.data.model.Category
import com.example.oneshot.data.model.ServiceProduct

object CatalogRepository {

    val categories = listOf(
        Category(
            id = "ALL",
            nameAr = "كافة الخدمات",
            nameEn = "All Services",
            descriptionAr = "تصفح كافة خدمات ومنتجات وباقات ونشوت 2026"
        ),
        Category(
            id = "AUT",
            nameAr = "الأتمتة والأنظمة والتكاملات",
            nameEn = "Automation & Integrations",
            descriptionAr = "أتمتة العمليات، تكاملات الـ API، بوابات الدفع، ولوحات التحكم"
        ),
        Category(
            id = "AI",
            nameAr = "الذكاء الاصطناعي والتطبيقات",
            nameEn = "Custom AI Solutions",
            descriptionAr = "مساعدات ملفات RAG، شات بوت للمواقع، ونماذج ذكية مخصصة"
        ),
        Category(
            id = "WEB",
            nameAr = "المواقع والمتاجر الرقمية",
            nameEn = "Websites & Stores",
            descriptionAr = "صفحات الهبوط، المتاجر الإلكترونية، وتجربة المستخدم"
        ),
        Category(
            id = "BRD",
            nameAr = "الهوية البصرية والعلامة",
            nameEn = "Brand Identity",
            descriptionAr = "تصميم الشعارات، أنظمة الهوية الشاملة، والتطبيقات الإبداعية"
        ),
        Category(
            id = "MED",
            nameAr = "التصوير والإنتاج والميديا",
            nameEn = "Media & Creative",
            descriptionAr = "تصوير المنتجات، مونتاج الريلز، والإنتاج الإعلاني الفاخر"
        ),
        Category(
            id = "SOC",
            nameAr = "إدارة الحملات والنمو",
            nameEn = "Growth & Marketing",
            descriptionAr = "حملات Google Ads، إدارة المنصات، واستراتيجيات الاستحواذ"
        ),
        Category(
            id = "DIG",
            nameAr = "المنتجات الرقمية والتدريب",
            nameEn = "Documents & Training",
            descriptionAr = "قوالب الفواتير، أدلة التشغيل، وجداول الأداء"
        )
    )

    val products = listOf(
        ServiceProduct(
            sku = "AUT-01",
            nameAr = "تحليل وهندسة مسارات الأتمتة",
            nameEn = "Process Automation Discovery",
            categoryId = "AUT",
            subCategory = "الاستشارات وهندسة العمليات",
            amount = 1200.0,
            deliveryDays = 5,
            revisionsCount = 1,
            shortDescription = "مراجعة وتحليل 3 مسارات عمل يدوية في منشأتك وتصميم خريطة سير عمل مؤتمتة تلغي الهدر الزمني.",
            detailedDescription = "دراسة استشارية وتشغيلية لفحص العمليات التي تستهلك وقت فريقك (نقل طلبات، إشعارات عقود، فرز فواتير)، ورسم مخطط تدفق رقمي واختيار أدوات الربط الأنسب (Make, n8n, API).",
            deliverables = listOf("جلسة تشخيص ومقابلة (60 دقيقة)", "مخططات سير العمل الرقمية لـ 3 عمليات", "تقرير التوصيات وخطة التنفيذ (PDF)"),
            exclusions = listOf("البرمجة والتنفيذ الفعلي لمسارات الأتمتة"),
            tag = "الأكثر طلباً"
        ),
        ServiceProduct(
            sku = "AUT-02",
            nameAr = "ربط وتكامل بوابة الدفع الإلكتروني",
            nameEn = "Payment Gateway Integration",
            categoryId = "AUT",
            subCategory = "التكاملات والمدفوعات",
            amount = 2800.0,
            deliveryDays = 4,
            revisionsCount = 2,
            shortDescription = "تكامل برمجي كامل مع بوابات PayTabs أو Telr مع دعم Apple Pay ومدى وحماية المعاملات.",
            detailedDescription = "إعداد المفاتيح المشفرة، تجهيز واجهات الدفع المدمجة والمستضافة، وتأمين الـ Webhooks لضمان مطابقة كل عملية دفع مع خادم المنشأة بدون فقدان أي معاملة.",
            deliverables = listOf("ربط بيئة الاختبار والإنتاج", "فحص الأمان ومطابقة المبالغ", "دعم Apple Pay ومدى والبطاقات الائتمانية", "توثيق فني لطريقة الاستدعاء"),
            exclusions = listOf("رسوم اشتراك البوابة البنكية"),
            tag = "بوابة معتمدة"
        ),
        ServiceProduct(
            sku = "AI-01",
            nameAr = "مساعد ذكاء اصطناعي لخدمة العملاء RAG",
            nameEn = "Enterprise RAG AI Assistant",
            categoryId = "AI",
            subCategory = "حلول الذكاء الاصطناعي",
            amount = 4500.0,
            deliveryDays = 7,
            revisionsCount = 3,
            shortDescription = "تطوير شات بوت ذكي مدرب على وثائق شركتك وكتالوج منتجاتك للإجابة الفورية بلغة عربية دقيقة.",
            detailedDescription = "دمج تقنيات استرجاع المعلومات RAG مع نماذج ذكاء اصطناعي متقدمة. يقوم البوت بقراءة ملفات الـ PDF والسياسات الداخلية لتقديم إجابات موثوقة للعملاء على مدار الساعة.",
            deliverables = listOf("فهرسة بيانات ومنتجات الشركة", "واجهة دردشة متوافقة مع الهواتف والمواقع", "لوحة تحكم لرصد الأسئلة وسجلات المحادثات"),
            exclusions = listOf("تكلفة رموز الاستهلاك الشهرية للنموذج (API tokens)"),
            tag = "حل ذكي"
        ),
        ServiceProduct(
            sku = "WEB-01",
            nameAr = "تصميم وبرمجة صفحة هبوط عالية التحويل",
            nameEn = "High-Converting Landing Page",
            categoryId = "WEB",
            subCategory = "المواقع وتجربة المستخدم",
            amount = 3200.0,
            deliveryDays = 6,
            revisionsCount = 2,
            shortDescription = "صفحة هبوط فائقة السرعة ومتجاوبة مع الهواتف مصممة بهوية علامتك لزيادة مبيعات منتج أو خدمة.",
            detailedDescription = "دراسة سلوك الزائر، صياغة نصوص بيعية مقنعة، تصميم واجهة عصرية وسلسة، وربط نماذج التواصل وأدوات التتبع الإعلاني Pixel.",
            deliverables = listOf("تصميم واجهة مستخدم مخصص UI/UX", "تطوير سريع متوافق 100% مع الجوال", "ربط تتبع الإعلانات والـ SEO الأساسي"),
            exclusions = listOf("شراء النطاق (Domain) وحساب الاستضافة"),
            tag = "جاهز للإطلاق"
        ),
        ServiceProduct(
            sku = "BRD-01",
            nameAr = "تصميم هوية بصرية متكاملة للعلامة",
            nameEn = "Full Brand Identity System",
            categoryId = "BRD",
            subCategory = "الهوية والعلامة التجارية",
            amount = 5500.0,
            deliveryDays = 10,
            revisionsCount = 3,
            shortDescription = "شعار احترافي فريد، دليل إرشادي كامل للألوان والخطوط، وتطبيقات مطبوعة ورقمية متناسقة.",
            detailedDescription = "بناء شخصية بصرية تعكس احترافية منشأتك وتثبت في ذهن العميل. تشمل الشعار الأساسي والفرعي، لوحة الألوان والخطوط، كروت العمل، والأوراق الرسمية.",
            deliverables = listOf("3 مفاهيم تصميمية مبتكرة للشعار", "دليل إرشادي شامل للهوية (Brand Guidelines)", "قوالب السوشيال ميديا والتطبيقات الأساسية"),
            exclusions = listOf("الطباعة الورقية والتسجيل التجاري للعلامة"),
            tag = "بصمة فريدة"
        ),
        ServiceProduct(
            sku = "MED-01",
            nameAr = "جلسة تصوير احترافية للمنتجات والأعمال",
            nameEn = "Commercial Studio Photography",
            categoryId = "MED",
            subCategory = "الميديا والإنتاج المرئي",
            amount = 2400.0,
            deliveryDays = 4,
            revisionsCount = 2,
            shortDescription = "تصوير فوتوغرافي استوديو بكاميرات سينمائية وإضاءات احترافية لمنتجاتك ومقر عملك في الرياض.",
            detailedDescription = "يوم تصوير كامل يشمل إعداد المشاهد وخلفيات ونشوت الفاخرة، تصوير تفاصيل المنتجات بزوايا تسويقية مدروسة، وتعديل وتصحيح الألوان بدقة عالية.",
            deliverables = listOf("تصوير حتى 15 منتجاً أو زاوية عمل", "تسليم 30 صورة معدلة بدقة 4K", "تنسيق الصور للنشر المباشر على المتجر والسوشيال ميديا"),
            exclusions = listOf("تصوير الفيديو السينمائي الممتد خارج الاستوديو"),
            tag = "استوديو ونشوت"
        ),
        ServiceProduct(
            sku = "MED-02",
            nameAr = "إنتاج ومونتاج 5 مقاطع ريلز وفيديو إعلاني",
            nameEn = "5x Reels & Short Video Production",
            categoryId = "MED",
            subCategory = "الميديا والإنتاج المرئي",
            amount = 1800.0,
            deliveryDays = 5,
            revisionsCount = 2,
            shortDescription = "مقاطع قصيرة تخطف الانتباه في أول ثانيتين، مع مؤثرات صوتية ونصوص متحركة متوافقة مع الخوارزميات.",
            detailedDescription = "كتابة سكريبت سريع لكل فيديو، مونتاج احترافي، تلوين، نصوص عربية منسقة، واختيار موسيقى تريند مرخصة لزيادة المشاهدات والتفاعل.",
            deliverables = listOf("5 فيديوهات بصيغة 9:16 بجودة عالية", "ملفات النصوص والمؤثرات الصوتية المرخصة", "نسخ مخصصة لإنستغرام وتيك توك"),
            exclusions = listOf("استئجار عارضي أزياء أو ممثلين"),
            tag = "انتشار سريع"
        ),
        ServiceProduct(
            sku = "SOC-01",
            nameAr = "إدارة حملات Google Ads الممولة",
            nameEn = "Google Ads Growth Campaign",
            categoryId = "SOC",
            subCategory = "إدارة الحملات والنمو",
            amount = 3500.0,
            deliveryDays = 3,
            revisionsCount = 2,
            billingCycle = "monthly",
            shortDescription = "إعداد وتشغيل وتحسين حملات البحث والشبكة الإعلانية للظهور في الصفحة الأولى وجلب عملاء جاهزين.",
            detailedDescription = "تحليل الكلمات المفتاحية ذات النية الشرائية العالية، كتابة إعلانات مقنعة، استبعاد الكلمات السلبية لخفض التكلفة، ومتابعة التحويلات اليومية.",
            deliverables = listOf("إعداد كامل لحساب إعلانات Google وتتبع التحويلات", "إدارة يومية ومراقبة تكلفة النقرة CPC", "تقرير أداء أسبوعي وشهري بالنتائج والعائد ROAS"),
            exclusions = listOf("الميزانية الإعلانية المدفوعة مباشرة لشركة Google"),
            tag = "عائد فوري"
        ),
        ServiceProduct(
            sku = "DIG-01",
            nameAr = "حزمة قوالب الفواتير وأنظمة التشغيل الرقمية",
            nameEn = "Operations & Invoice Toolkit",
            categoryId = "DIG",
            subCategory = "المستندات والمنتجات الرقمية",
            amount = 450.0,
            deliveryDays = 1,
            revisionsCount = 1,
            shortDescription = "قوالب فواتير وعقود عمل احترافية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك.",
            detailedDescription = "ملفات جاهزة للتعديل السريع تشمل قوالب فواتير ضريبية، نماذج عروض أسعار أنيقة بهوية OneShot، ومصفوفة تسعير المشاريع.",
            deliverables = listOf("ملفات Excel و Google Sheets تفاعلية", "قوالب PDF قابلة للتعبئة", "دليل الاستخدام السريع"),
            exclusions = listOf("التكامل مع منصة فاتورة السحابية"),
            tag = "تحميل فوري"
        )
    )
}
