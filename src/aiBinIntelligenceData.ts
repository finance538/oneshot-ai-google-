// aiBinIntelligenceData.ts
// Comprehensive dataset for Bank BIN disparities, AI analysis models, and routing strategies

export interface BankSubBinRecord {
  bin: string;
  subType: 'Debit Mada' | 'Credit Classic' | 'Credit Platinum/Signature' | 'Prepaid / Travel' | 'Virtual / Digital Wallet' | 'Corporate / Business';
  tierName: string;
  scheme: 'Mada' | 'Visa' | 'Mastercard' | 'AMEX' | 'KNET' | 'Benefit';
  acceptanceStatus: {
    telr: 'accepted' | 'rejected' | 'conditional';
    paytabs: 'accepted' | 'rejected' | 'conditional';
    noon: 'accepted' | 'rejected' | 'conditional';
    myfatoorah: 'accepted' | 'rejected' | 'conditional';
    payzaty: 'accepted' | 'rejected' | 'conditional';
    tabby: 'accepted' | 'rejected' | 'conditional';
  };
  approvalRateEstimate: number; // percentage (e.g. 96%)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  chargebackRisk: string;
  supports3DS2: boolean;
  requiresLevel3Data: boolean;
  rejectionReasonIfAny: string;
  aiExplanation: string;
}

export interface BankProfile {
  bankId: string;
  bankNameAr: string;
  bankNameEn: string;
  country: string;
  countryCode: string;
  flag: string;
  logoColor: string;
  issuerCategory: 'Tier-1 Retail Giant' | 'Commercial & Corporate' | 'Islamic Banking Leader' | 'Digital & Neo-Bank';
  bins: BankSubBinRecord[];
  disparityOverview: string;
  bestGatewayForBank: string;
}

export const BANK_PROFILES_DATA: BankProfile[] = [
  {
    bankId: 'alrajhi',
    bankNameAr: 'مصرف الراجحي (Al Rajhi Bank)',
    bankNameEn: 'Al Rajhi Bank',
    country: 'المملكة العربية السعودية',
    countryCode: 'SA',
    flag: '🇸🇦',
    logoColor: '#002B49',
    issuerCategory: 'Tier-1 Retail Giant',
    disparityOverview: 'مصرف الراجحي يمتلك أكبر كتلة بطاقات في الخليج. التباين الشديد يحدث بين بطاقات مدى الحساب الجاري (تقبل 98% على بوابات محلية) وبين بطاقات "سفر بلس" و"فرسان" المسبقة الدفع والبطاقات الرقمية (Urpay) التي تحظرها بوابات كثيرة بسبب ارتفاع عمليات الـ Chargeback ونقص الـ 3DS V2.',
    bestGatewayForBank: 'PayTabs أو نون باي (Noon Payments) للربط المباشر مع مدى',
    bins: [
      {
        bin: '588846',
        subType: 'Debit Mada',
        tierName: 'مدى الحساب الجاري البلاتيني',
        scheme: 'Mada',
        acceptanceStatus: {
          paytabs: 'accepted',
          telr: 'conditional',
          noon: 'accepted',
          myfatoorah: 'accepted',
          payzaty: 'conditional',
          tabby: 'rejected'
        },
        approvalRateEstimate: 98.4,
        riskLevel: 'low',
        chargebackRisk: '0.02% (آمن للغاية)',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'قد يُرفض على تيلر إذا تم التوجيه عبر Acquirer إماراتي دولي دون مسار Mada المباشر.',
        aiExplanation: 'بطاقة خصم مباشر مرتبطة بحساب مصرفي مفعل وموثق بنفاذ. نسبة القبول مرتفعة جداً محلياً لأنها تدعم Mada Switch الوطني.'
      },
      {
        bin: '458838',
        subType: 'Credit Platinum/Signature',
        tierName: 'فيزا إنفينيت الائتمانية (Visa Infinite)',
        scheme: 'Visa',
        acceptanceStatus: {
          paytabs: 'accepted',
          telr: 'accepted',
          noon: 'accepted',
          myfatoorah: 'accepted',
          payzaty: 'accepted',
          tabby: 'accepted'
        },
        approvalRateEstimate: 99.1,
        riskLevel: 'low',
        chargebackRisk: '0.01% (أعلى درجات الموثوقية)',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'لا توجد قيود، تقبل دولياً ومحلياً على كافة البوابات.',
        aiExplanation: 'بطاقة ائتمانية من الدرجة الأولى (High Net Worth). البنك يوفر رصيداً ائتمانياً مضموناً ويتحمل المخاطر وتدعم أحدث بروتوكولات 3DS 2.3.'
      },
      {
        bin: '457812',
        subType: 'Prepaid / Travel',
        tierName: 'بطاقة سفر بلس مسبقة الدفع (Multi-Currency Prepaid)',
        scheme: 'Visa',
        acceptanceStatus: {
          paytabs: 'accepted',
          telr: 'rejected',
          noon: 'conditional',
          myfatoorah: 'conditional',
          payzaty: 'rejected',
          tabby: 'rejected'
        },
        approvalRateEstimate: 68.2,
        riskLevel: 'high',
        chargebackRisk: '1.45% (مرتفع جداً - سبب الحظر في تيلر)',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'محظورة افتراضياً في Telr و PayZaty بسبب تصنيف الـ BIN كـ Prepaid Virtual Risk.',
        aiExplanation: 'حظر الـ BIN هنا ناتج عن سياسة بوابة الدفع ضد البطاقات مسبقة الدفع التي تفتقر لحساب جاري دائم، وتكثر بها طلبات استرداد الأموال الدولية (FX Chargebacks).'
      },
      {
        bin: '407523',
        subType: 'Virtual / Digital Wallet',
        tierName: 'بطاقة يورباي الرقمية (Urpay Digital Neo)',
        scheme: 'Visa',
        acceptanceStatus: {
          paytabs: 'conditional',
          telr: 'rejected',
          noon: 'accepted',
          myfatoorah: 'rejected',
          payzaty: 'rejected',
          tabby: 'rejected'
        },
        approvalRateEstimate: 54.0,
        riskLevel: 'critical',
        chargebackRisk: '2.10% (محفظة رقمية سريعة التوليد)',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'الـ BIN مضاف في القوائم الرمادية لشركات منع الاحتيال الرادارية (CyberSource & Telr Blacklist).',
        aiExplanation: 'تُنشأ البطاقة بنقرة واحدة داخل تطبيق الجوال، وغالباً ما يستغلها المخترقون في تجربة البطاقات المسروقة (Card Testing Attacks)، مما يدفع بوابات لمعاقبة كامل النطاق 407523.'
      },
      {
        bin: '468547',
        subType: 'Corporate / Business',
        tierName: 'فيزا أعمال للشركات (Visa Business Corporate)',
        scheme: 'Visa',
        acceptanceStatus: {
          paytabs: 'accepted',
          telr: 'conditional',
          noon: 'accepted',
          myfatoorah: 'accepted',
          payzaty: 'conditional',
          tabby: 'rejected'
        },
        approvalRateEstimate: 82.5,
        riskLevel: 'medium',
        chargebackRisk: '0.08%',
        supports3DS2: true,
        requiresLevel3Data: true,
        rejectionReasonIfAny: 'تُرفض إذا كانت البوابة تفتقر لدعم بيانات الفاتورة الموسعة (Level 2/3 Data) أو سقف الدفعة المفردة.',
        aiExplanation: 'البطاقات التجارية تملك قيوداً من جهة عمل حامل البطاقة (Merchant Category Code Restrictions) وتتطلب توثيقاً متقدماً.'
      }
    ]
  },
  {
    bankId: 'snb',
    bankNameAr: 'البنك الأهلي السعودي (SNB AlAhli)',
    bankNameEn: 'Saudi National Bank',
    country: 'المملكة العربية السعودية',
    countryCode: 'SA',
    flag: '🇸🇦',
    logoColor: '#005A36',
    issuerCategory: 'Tier-1 Retail Giant',
    disparityOverview: 'بعد اندماج الأهلي وسامبا، يمتلك البنك بنية تحتية قديمة موروثة (Legacy Samba BINs) لا زالت تسجل نسب رفض أعلى مقارنة بنطاقات الأهلي الجديدة المحدثة بالكامل لبروتوكول 3DS 2.2.',
    bestGatewayForBank: 'PayTabs أو هايبر باي (HyperPay)',
    bins: [
      {
        bin: '457865',
        subType: 'Debit Mada',
        tierName: 'مدى الأهلي للحساب الجاري (SNB Classic)',
        scheme: 'Mada',
        acceptanceStatus: {
          paytabs: 'accepted',
          telr: 'conditional',
          noon: 'accepted',
          myfatoorah: 'accepted',
          payzaty: 'conditional',
          tabby: 'rejected'
        },
        approvalRateEstimate: 97.9,
        riskLevel: 'low',
        chargebackRisk: '0.03%',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'تتطلب مسار توجيه محلي (National Mada Routing).',
        aiExplanation: 'تعمل بكفاءة مطلقة داخل السعودية وبوابات الدفع التي تملك حساب تسوية داخل المملكة.'
      },
      {
        bin: '524188',
        subType: 'Credit Classic',
        tierName: 'ماستركارد الأهلي الائتمانية (Mastercard Titanium)',
        scheme: 'Mastercard',
        acceptanceStatus: {
          paytabs: 'accepted',
          telr: 'accepted',
          noon: 'accepted',
          myfatoorah: 'accepted',
          payzaty: 'accepted',
          tabby: 'accepted'
        },
        approvalRateEstimate: 98.5,
        riskLevel: 'low',
        chargebackRisk: '0.04%',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'لا توجد قيود.',
        aiExplanation: 'ماستركارد دولية معتمدة من بنك الأهلي تقبل في كافة الأسواق والبوابات الدولية.'
      },
      {
        bin: '484783',
        subType: 'Prepaid / Travel',
        tierName: 'بطاقة الفرسان مسبقة الدفع (AlFursan Prepaid)',
        scheme: 'Visa',
        acceptanceStatus: {
          paytabs: 'accepted',
          telr: 'rejected',
          noon: 'conditional',
          myfatoorah: 'conditional',
          payzaty: 'rejected',
          tabby: 'rejected'
        },
        approvalRateEstimate: 71.3,
        riskLevel: 'high',
        chargebackRisk: '1.20%',
        supports3DS2: false,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'فشل التوثيق السلس (3DS 1.0 Fallback Rejection).',
        aiExplanation: 'نطاق BIN موروث لا يدعم التوثيق السلس التلقائي، فترفضه بوابات تفرض معايير أمان مصرفية مشددة مثل تيلر.'
      }
    ]
  },
  {
    bankId: 'enbd',
    bankNameAr: 'بنك الإمارات دبي الوطني (Emirates NBD)',
    bankNameEn: 'Emirates NBD',
    country: 'الإمارات العربية المتحدة',
    countryCode: 'AE',
    flag: '🇦🇪',
    logoColor: '#172B4D',
    issuerCategory: 'Commercial & Corporate',
    disparityOverview: 'في الإمارات، تفاوت البينات داخل الإمارات دبي الوطني يعود في المقام الأول للتفريق بين بطاقات Liv الرقمية (Neo-Bank) وبطاقات الفرع الرئيسي، إضافة للبطاقات المربوطة بحدود إنفاق دولية مقيدة.',
    bestGatewayForBank: 'تيلر (Telr) وماي فاتورة (MyFatoorah)',
    bins: [
      {
        bin: '542400',
        subType: 'Credit Platinum/Signature',
        tierName: 'ماستركارد وورلد الائتمانية (Mastercard World)',
        scheme: 'Mastercard',
        acceptanceStatus: {
          paytabs: 'accepted',
          telr: 'accepted',
          noon: 'accepted',
          myfatoorah: 'accepted',
          payzaty: 'accepted',
          tabby: 'accepted'
        },
        approvalRateEstimate: 99.4,
        riskLevel: 'low',
        chargebackRisk: '0.02%',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'لا قيود.',
        aiExplanation: 'بطاقة متميزة تقبل فوراً في 100% من سيناريوهات الدفع الخليجية والعالمية.'
      },
      {
        bin: '462230',
        subType: 'Debit Mada',
        tierName: 'بطاقة الخصم الحساب الجاري التقليدية (Classic Debit)',
        scheme: 'Visa',
        acceptanceStatus: {
          paytabs: 'accepted',
          telr: 'accepted',
          noon: 'accepted',
          myfatoorah: 'accepted',
          payzaty: 'conditional',
          tabby: 'rejected'
        },
        approvalRateEstimate: 95.8,
        riskLevel: 'low',
        chargebackRisk: '0.05%',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'قد تتطلب تفعيل خاصية الشراء عبر الإنترنت (E-Commerce Enablement).',
        aiExplanation: 'تعتمد على ما إذا كان العميل قد فعّل خيار التجارة الإلكترونية عبر تطبيق البنك.'
      },
      {
        bin: '428233',
        subType: 'Virtual / Digital Wallet',
        tierName: 'بطاقة ليف الرقمية (Liv. Neo-Bank Visa)',
        scheme: 'Visa',
        acceptanceStatus: {
          paytabs: 'conditional',
          telr: 'accepted',
          noon: 'conditional',
          myfatoorah: 'accepted',
          payzaty: 'rejected',
          tabby: 'conditional'
        },
        approvalRateEstimate: 76.5,
        riskLevel: 'medium',
        chargebackRisk: '0.85%',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'محظورة لدى بعض البوابات التي تصنف الحسابات الشبابية الرقمية كـ High Velocity Risk.',
        aiExplanation: 'البطاقة تصدر فورياً للشباب عبر تطبيق الهاتف، فتخضع لفلترة إضافية في رادارات الاحتيال.'
      }
    ]
  },
  {
    bankId: 'nbk',
    bankNameAr: 'بنك الكويت الوطني (NBK Kuwait)',
    bankNameEn: 'National Bank of Kuwait',
    country: 'الكويت',
    countryCode: 'KW',
    flag: '🇰🇼',
    logoColor: '#002855',
    issuerCategory: 'Tier-1 Retail Giant',
    disparityOverview: 'في الكويت، بطاقات الـ KNET المحلية التابعة لـ NBK ترفض على أي بوابة لا تملك بوابة KNET وطنية، بينما بطاقات NBK Visa/Mastercard تقبل في كافة البوابات الدولية.',
    bestGatewayForBank: 'ماي فاتورة (MyFatoorah) أو تيلر (Telr KNET)',
    bins: [
      {
        bin: '519638',
        subType: 'Debit Mada',
        tierName: 'كي نت السحب الآلي الكويتي (NBK KNET Debit)',
        scheme: 'KNET',
        acceptanceStatus: {
          paytabs: 'conditional',
          telr: 'accepted',
          noon: 'conditional',
          myfatoorah: 'accepted',
          payzaty: 'conditional',
          tabby: 'rejected'
        },
        approvalRateEstimate: 98.7,
        riskLevel: 'low',
        chargebackRisk: '0.01%',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'ترفض قطعاً إذا كانت البوابة لا تملك ترخيص شبكة KNET المشتركة.',
        aiExplanation: 'بطاقة محلية مغلقة تشترط التوجيه عبر سويتش KNET الكويتي.'
      },
      {
        bin: '415254',
        subType: 'Credit Platinum/Signature',
        tierName: 'فيزا سيجنتشر الائتمانية (NBK Visa Signature)',
        scheme: 'Visa',
        acceptanceStatus: {
          paytabs: 'accepted',
          telr: 'accepted',
          noon: 'accepted',
          myfatoorah: 'accepted',
          payzaty: 'accepted',
          tabby: 'accepted'
        },
        approvalRateEstimate: 99.2,
        riskLevel: 'low',
        chargebackRisk: '0.02%',
        supports3DS2: true,
        requiresLevel3Data: false,
        rejectionReasonIfAny: 'لا توجد قيود.',
        aiExplanation: 'بطاقة ائتمانية عالمية ممتازة تقبل في جميع منصات الدفع بلا استثناء.'
      }
    ]
  }
];

// Decline Codes Database with Bank and Gateway Root Causes
export interface DeclineCodeRecord {
  code: string;
  nameAr: string;
  nameEn: string;
  category: 'Risk & Fraud' | 'Cardholder State' | 'Issuer Configuration' | 'Gateway Routing';
  whyBinDisparityHappens: string;
  aiSuggestedRemediation: string;
  merchantActionPlan: string;
}

export const DECLINE_CODES_DATA: DeclineCodeRecord[] = [
  {
    code: '05',
    nameAr: 'رفض عام من البنك المصدر (Do Not Honor)',
    nameEn: 'Do Not Honor',
    category: 'Issuer Configuration',
    whyBinDisparityHappens: 'البنك المصدر يرفض الطلب لأن نوع الـ BIN (مثلاً بطاقة مسبقة الدفع أو بطاقة شركات) غير مصرح له بالشراء من هذا النوع من التجار (MCC Restrictions)، بينما بطاقات الائتمان العادية لنفس البنك ليس عليها هذا القيد.',
    aiSuggestedRemediation: 'توجيه العملية فورياً إلى بوابة ثانية تملك Merchant Category Code (MCC) استهلاكي عام، أو طلب بطاقة ائتمان بديلة من العميل.',
    merchantActionPlan: 'إبلاغ العميل بلباقة: "يرجى استخدام بطاقة فيزا أو ماستركارد ائتمانية بديلة أو التأكد من تفعيل الشراء عبر الإنترنت في تطبيق البنك".'
  },
  {
    code: '57',
    nameAr: 'المعاملة غير مصرحة لحامل البطاقة (Transaction Not Permitted)',
    nameEn: 'Transaction Not Permitted',
    category: 'Cardholder State',
    whyBinDisparityHappens: 'تحدث بكثرة في بطاقات مدى وبطاقات الخصم المباشر (Debit BINs) عندما تكون خاصية التجارة الإلكترونية (E-Commerce) معطلة بطلب من العميل لحماية الحساب الجاري، بينما بطاقات الائتمان مفعّلة تلقائياً.',
    aiSuggestedRemediation: 'الذكاء الاصطناعي يتعرف على الـ BIN كـ Debit ويقترح فوراً تنبيه العميل لفتح تطبيق البنك وتفعيل "المدفوعات الإلكترونية".',
    merchantActionPlan: 'عرض شاشة إرشادية مصورة للعميل توضح كيفية تفعيل الشراء من الإنترنت في ثوانٍ داخل تطبيق مصرفه.'
  },
  {
    code: '62',
    nameAr: 'بطاقة مقيدة أمنياً أو جغرافياً (Restricted Card)',
    nameEn: 'Restricted Card',
    category: 'Risk & Fraud',
    whyBinDisparityHappens: 'نطاق الـ BIN مصمم للاستخدام المحلي فقط (Domestic Only)، وحساب التاجر على البوابة يعالج من بنك محصل خارجي (Offshore Acquirer).',
    aiSuggestedRemediation: 'إعادة توجيه العملية إلى بوابة محلية (Local Onshore Gateway مثل PayTabs في السعودية أو Telr في الإمارات).',
    merchantActionPlan: 'استخدام التوجيه الذكي (Dynamic Routing) لفرز البطاقات المحلية وتمريرها للبوابات المحلية فقط.'
  },
  {
    code: '82',
    nameAr: 'فشل سياسة مكافحة الاحتيال بالبوابة (Policy Decline / Risk Engine)',
    nameEn: 'Policy Decline / Risk Engine',
    category: 'Risk & Fraud',
    whyBinDisparityHappens: 'البوابة نفسها وضعت نطاق الـ BIN في القائمة الرمادية بسبب هجوم احتيال جماعي على نفس الـ BIN خلال الـ 48 ساعة السابقة (BIN Velocity Burst). باقي بينات البنك لم تتأثر.',
    aiSuggestedRemediation: 'تجاوز رادار البوابة الحالية والتحويل فوراً إلى بوابة ثانوية تعتمد محرك مخاطر مختلف لا يحتوي هذا الـ BIN في قائمة الحظر.',
    merchantActionPlan: 'تفعيل ميزة التبديل الذكي الاحتياطي (Smart Fallback) بنقرة واحدة لإنقاذ عملية البيع.'
  },
  {
    code: '1A',
    nameAr: 'فشل التوثيق ثلاثي الأبعاد (3DS Authentication Failed)',
    nameEn: '3DS Authentication Failed',
    category: 'Issuer Configuration',
    whyBinDisparityHappens: 'خادم ACS الخاص بالبنك لا يدعم الإصدار الحديث 3DS 2.2 لنطاقات الـ BINs القديمة، مما يسبب انقطاع جلسة التحقق (Timeout) ورفض الدفع.',
    aiSuggestedRemediation: 'طلب تنفيذ التوثيق عبر تدفق تقليدي (3DS 1.0 Fallback) أو تغيير مسار البوابة لمسار يدعم التوافق مع الأنظمة القديمة.',
    merchantActionPlan: 'تحديث إعدادات البوابة لدعم الـ Hybrid 3DS Flow.'
  }
];

// AI Intelligence Suggestions & Market Strategies
export interface StrategicAiAdvice {
  titleAr: string;
  category: string;
  iconName: string;
  summaryAr: string;
  actionItems: string[];
  expectedImpact: string;
}

export const STRATEGIC_AI_ADVICES: StrategicAiAdvice[] = [
  {
    titleAr: 'تطبيق التوجيه الذكي متعدد البوابات (Smart Multi-Gateway Dynamic Routing)',
    category: 'تقنية المعالجة',
    iconName: 'GitFork',
    summaryAr: 'عدم حصر المتجر على بوابة دفع واحدة؛ بل قراءة أول 6 أرقام (BIN) فور إدخالها من العميل وتوجيه المعاملة تلقائياً إلى البوابة التي تملك أعلى نسبة قبول لهذا البنك وتلك الفئة من البطاقات.',
    actionItems: [
      'توجيه بطاقات مدى (5888xx / 4578xx) إلى PayTabs أو Noon حصراً لضمان عمولة أقل ونسبة قبول 99%.',
      'توجيه بطاقات KNET الكويتية وبطاقات Benefit البحرينية إلى MyFatoorah.',
      'توجيه البطاقات الدولية والأمريكية والأوروبية إلى Telr أو Stripe لتفادي قيود البنوك المحلية.',
      'توجيه بطاقات الائتمان عالية القيمة (Corporate & Infinite) إلى البوابة ذات أفضل معدل تسوية.'
    ],
    expectedImpact: 'رفع نسبة نجاح العمليات (Authorization Rate) من 78% إلى أكثر من 97.5% وتقليل السلات المتروكة.'
  },
  {
    titleAr: 'التحويل الاحتياطي الصامت عند الرفض (Silent Failover & Smart Fallback)',
    category: 'تجربة المستخدم',
    iconName: 'RefreshCw',
    summaryAr: 'إذا رفضت البوابة الأولى البطاقة بكود غير قاتل (مثل 82 Risk Policy أو 05 Generic)، يقوم النظام فوراً بإعادة محاولة المعاملة عبر البوابة البديلة في الخلفية قبل إظهار رسالة الفشل للعميل.',
    actionItems: [
      'فصل الأكواد القاتلة (مثل رصيد غير كافٍ 51) عن الأكواد الفنية والتنظيمية (82, 62, 05).',
      'إجراء محاولة صامتة عبر بوابة ثانية خلال ثانيتين فقط.',
      'حفظ نتيجة كل محاولة لتدريب نموذج الذكاء الاصطناعي على تحديث خريطة البينات أسبوعياً.'
    ],
    expectedImpact: 'استعادة ما بين 15% إلى 25% من العمليات المرفوضة التي كانت ستضيع بالكامل.'
  },
  {
    titleAr: 'كشف نوع البطاقة الفوري وتخصيص نصائح العميل (Client Guidance UX)',
    category: 'الذكاء الاصطناعي التفاعلي',
    iconName: 'Sparkles',
    summaryAr: 'استخدام الذكاء الاصطناعي لتحليل رقم البطاقة بمجرد إدخال أول 6 أرقام، وتنبيه العميل مسبقاً إذا كانت بطاقته مسبقة دفع أو تتطلب تفعيل من التطبيق قبل أن يضغط "دفع".',
    actionItems: [
      'إذا كانت البطاقة افتراضية (Urpay / Tiqmo)، إظهار تلميح خفيف: "تأكد من شحن رصيد المحفظة قبل المتابعة".',
      'إذا كانت مدى، التأكد من اختيار ريال سعودي لتفادي رسوم التحويل المزدوج.',
      'تقديم شرح فوري بالذكاء الاصطناعي لسبب الرفض بلغة عربية مفهومة دون مصطلحات تقنية معقدة.'
    ],
    expectedImpact: 'تعزيز ثقة العميل بالمتجر واختفاء الشكاوى المتكررة.'
  },
  {
    titleAr: 'إدارة قوائم السمعة والـ BIN Whitelisting مع مديري المخاطر بالبوابات',
    category: 'علاقات الشركاء والمصارف',
    iconName: 'ShieldCheck',
    summaryAr: 'التواصل الاستباقي مع فرق المخاطر (Risk Teams) في تيلر و PayTabs لطلب فتح استثناءات (Whitelisting) لنطاقات الـ BINs الشائعة لعملائك.',
    actionItems: [
      'تصدير تقرير من لوحة الأدمن يوضح أن عمليات الـ BIN المرفوضة حقيقية وموثقة بنفاذ ولا تحمل أي نزاعات.',
      'طلب تعديل عتبة المخاطر (Fraud Threshold) لمتجرك بناءً على سجلك النظيف.',
      'تفعيل 3DS Mandatory بدلاً من حظر الـ BIN كلياً.'
    ],
    expectedImpact: 'إزالة الحظر الشامل عن بينات البنوك الكبرى وفتح الباب أمام آلاف المشترين.'
  }
];
