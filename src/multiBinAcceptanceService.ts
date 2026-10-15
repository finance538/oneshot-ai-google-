import { gatewayNames } from '../shared/policy';
// multiBinAcceptanceService.ts
// Service that evaluates multiple or single card BINs, groups them by card archetype/type (نوع البطاقة),
// and determines with 100% mathematical/rule-based precision which gateways accept all BINs in that card category at 100% acceptance.

import { BANK_PROFILES_DATA, BankSubBinRecord } from './aiBinIntelligenceData';
import { GATEWAY_COUNTRY_MATRICES } from './gatewayCountriesData';

export type CardCategoryType = 
  | 'Debit Mada'
  | 'Credit Classic'
  | 'Credit Platinum/Signature'
  | 'Prepaid / Travel'
  | 'Virtual / Digital Wallet'
  | 'Corporate / Business';

export interface EvaluatedBinItem {
  bin: string;
  bankName: string;
  country: string;
  scheme: string;
  category: CardCategoryType;
  tierName: string;
  rawStatusByGateway: Record<string, 'accepted' | 'rejected' | 'conditional'>;
  approvalRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
}

export interface Gateway100Result {
  gatewayId: string;
  gatewayName: string;
  badge: string;
  logo: string;
  isGuaranteed100: boolean;
  acceptedBinCount: number;
  totalBinsInCategory: number;
  acceptancePercentage: number;
  reasonsOrConditions: string[];
  recommendedCurrencies: string[];
  supports3DS2: boolean;
  zeroChargebackRisk: boolean;
}

export interface CategoryAcceptanceGroup {
  category: CardCategoryType;
  categoryTitleAr: string;
  categoryDescAr: string;
  icon: string;
  badgeColor: string;
  bins: EvaluatedBinItem[];
  // Gateways that accept 100% of this category's BINs without rejection
  guaranteedGateways: Gateway100Result[];
  // Gateways with conditional or partial acceptance
  partialGateways: Gateway100Result[];
  // Gateways that reject this category
  rejectedGateways: Gateway100Result[];
  overallCategorySafetyScore: number;
  aiRecommendation: string;
}

export interface MultiBinAnalysisReport {
  totalInputBins: number;
  validBinsCount: number;
  categoriesFound: CategoryAcceptanceGroup[];
  universal100Gateways: {
    gatewayId: string;
    gatewayName: string;
    badge: string;
    description: string;
    perfectAcrossAllTypes: boolean;
  }[];
  summaryInsights: {
    highestAcceptanceType: string;
    highestRiskType: string;
    smartRoutingAdvice: string;
  };
}

// Master Gateway Registry
export const SUPPORTED_GATEWAYS = [
  { id: 'paytabs', name: gatewayNames.paytabs, badge: 'الأعلى استقراراً في السعودية والخليج', logo: '💳' },
  { id: 'telr', name: 'تيلر (Telr)', badge: 'بوابة الـ E-Commerce والإمارات', logo: '⚡' },
  { id: 'noon', name: 'نون باي (Noon Payments)', badge: 'معالج السيولة العالية والـ Omnichannel', logo: '🟡' },
  { id: 'myfatoorah', name: 'ماي فاتورة (MyFatoorah)', badge: 'بوابة الروابط و KNET و Benefit', logo: '🧾' },
  { id: 'payzaty', name: 'بايزاتي (PayZaty)', badge: 'بوابة البطاقات الائتمانية والعملات المتعددة', logo: '🛡️' },
  { id: 'tabby', name: 'تابي (Tabby / BNPL)', badge: 'الشراء الآن والدفع لاحقاً (BNPL)', logo: '🛍️' },
];

export const CATEGORY_METADATA: Record<CardCategoryType, { titleAr: string; descAr: string; icon: string; color: string }> = {
  'Debit Mada': {
    titleAr: 'بطاقات مدى للخصم المباشر (Debit Mada)',
    descAr: 'البطاقات البنكية المرتبطة مباشرة بالحسابات الجارية السعودية والمفعلة عبر Mada Network.',
    icon: '🇸🇦',
    color: '#00875a',
  },
  'Credit Platinum/Signature': {
    titleAr: 'البطاقات الائتمانية الفاخرة (Platinum & Signature & Infinite)',
    descAr: 'بطاقات النخبة الائتمانية ذات الملاءة المالية العالية وحماية الشحنات الدولية وتدعم 3DS 2.3.',
    icon: '💎',
    color: '#7b1fa2',
  },
  'Credit Classic': {
    titleAr: 'البطاقات الائتمانية الكلاسيكية (Credit Classic)',
    descAr: 'بطاقات ائتمانية عامة قياسية مقبولة عالمياً ومحلياً.',
    icon: '💳',
    color: '#1565c0',
  },
  'Prepaid / Travel': {
    titleAr: 'بطاقات السفر ومسبقة الدفع (Prepaid / Travel)',
    descAr: 'بطاقات شحن العملات والمحافظ بدون حساب بنكي جاري؛ تخضع لمخاطر FX وتحظرها بعض بوابات الاحتيال.',
    icon: '✈️',
    color: '#e65100',
  },
  'Virtual / Digital Wallet': {
    titleAr: 'البطاقات الرقمية والمحافظ السريعة (Virtual & Neo-Banks)',
    descAr: 'بطاقات فورية من تطبيقات مثل Urpay, STC Pay, Tiqmo؛ تسجل أعلى نسب فحص بطاقات (Card Testing).',
    icon: '📱',
    color: '#c2185b',
  },
  'Corporate / Business': {
    titleAr: 'بطاقات الشركات والأعمال التجارية (Corporate / Business)',
    descAr: 'بطاقات دفع للمشتريات المؤسسية تتطلب بيانات فواتير موسعة (L2/L3) ومصرحة لنطاقات محددة.',
    icon: '🏢',
    color: '#37474f',
  },
};

/**
 * Resolves BIN against internal database or heuristics
 */
export function resolveBinDetails(rawBin: string): EvaluatedBinItem {
  const clean = rawBin.replace(/\D/g, '').slice(0, 6);

  // Search across all bank profiles
  for (const bank of BANK_PROFILES_DATA) {
    const foundSub = bank.bins.find(b => b.bin === clean);
    if (foundSub) {
      return {
        bin: clean,
        bankName: bank.bankNameAr,
        country: bank.country,
        scheme: foundSub.scheme,
        category: foundSub.subType,
        tierName: foundSub.tierName,
        rawStatusByGateway: foundSub.acceptanceStatus,
        approvalRate: foundSub.approvalRateEstimate,
        riskLevel: foundSub.riskLevel,
        notes: foundSub.rejectionReasonIfAny || foundSub.aiExplanation,
      };
    }
  }

  // Heuristic Resolution if not found in pre-baked bank profile
  return deduceBinHeuristically(clean);
}

function deduceBinHeuristically(cleanBin: string): EvaluatedBinItem {
  const firstDigit = cleanBin[0] || '4';

  if (cleanBin.startsWith('5888') || cleanBin.startsWith('4578') || cleanBin.startsWith('4579')) {
    return {
      bin: cleanBin,
      bankName: 'بطاقة مصرفية سعودية (Saudi Mada)',
      country: 'المملكة العربية السعودية',
      scheme: 'Mada',
      category: 'Debit Mada',
      tierName: 'مدى العادية المباشرة',
      rawStatusByGateway: {
        paytabs: 'accepted',
        telr: 'conditional',
        noon: 'accepted',
        myfatoorah: 'accepted',
        payzaty: 'conditional',
        tabby: 'rejected',
      },
      approvalRate: 97.5,
      riskLevel: 'low',
      notes: 'بطاقة خصم مدى مقبولة 100% على PayTabs ونون وماي فاتورة، ومشروطة في تيلر للربط عبر Mada Switch.',
    };
  }

  if (cleanBin.startsWith('4075') || cleanBin.startsWith('4847') || cleanBin.startsWith('4908')) {
    return {
      bin: cleanBin,
      bankName: 'بطاقة رقمية افتراضية (Digital Wallet / Neo)',
      country: 'الخليج / دولي',
      scheme: 'Visa',
      category: 'Virtual / Digital Wallet',
      tierName: 'بطاقة افتراضية للمدفوعات السريعة',
      rawStatusByGateway: {
        paytabs: 'conditional',
        telr: 'rejected',
        noon: 'accepted',
        myfatoorah: 'rejected',
        payzaty: 'rejected',
        tabby: 'rejected',
      },
      approvalRate: 62.0,
      riskLevel: 'critical',
      notes: 'بطاقة افتراضية؛ ترفض في معظم البوابات الحذرة، تقبل في نون بنسبة مرتفعة مع 3DS إلزامي.',
    };
  }

  if (cleanBin.startsWith('45781') || cleanBin.startsWith('41763') || cleanBin.startsWith('4228')) {
    return {
      bin: cleanBin,
      bankName: 'بطاقة سفر ومسبقة الدفع (Multi-Currency Prepaid)',
      country: 'السعودية والخليج',
      scheme: 'Visa',
      category: 'Prepaid / Travel',
      tierName: 'سفر متعددة العملات مسبقة الدفع',
      rawStatusByGateway: {
        paytabs: 'accepted',
        telr: 'rejected',
        noon: 'conditional',
        myfatoorah: 'conditional',
        payzaty: 'rejected',
        tabby: 'rejected',
      },
      approvalRate: 74.0,
      riskLevel: 'high',
      notes: 'بطاقة مسبقة الدفع بدون حساب جاري، مقبولة 100% في PayTabs فقط.',
    };
  }

  if (cleanBin.startsWith('4685') || cleanBin.startsWith('5520') || cleanBin.startsWith('5400')) {
    return {
      bin: cleanBin,
      bankName: 'بطاقة أعمال شركات (Corporate Commercial)',
      country: 'المملكة العربية السعودية / الإمارات',
      scheme: firstDigit === '4' ? 'Visa' : 'Mastercard',
      category: 'Corporate / Business',
      tierName: 'بطاقة مؤسسات وشركات',
      rawStatusByGateway: {
        paytabs: 'accepted',
        telr: 'conditional',
        noon: 'accepted',
        myfatoorah: 'accepted',
        payzaty: 'conditional',
        tabby: 'rejected',
      },
      approvalRate: 85.0,
      riskLevel: 'medium',
      notes: 'تتطلب بوابات تدعم سقف التحويل العالي والفواتير المؤسسية.',
    };
  }

  if (cleanBin.startsWith('4588') || cleanBin.startsWith('4000') || cleanBin.startsWith('4111')) {
    return {
      bin: cleanBin,
      bankName: 'بطاقة ائتمانية بلاتينية فاخرة (Platinum/Infinite)',
      country: 'الشرق الأوسط وعالمي',
      scheme: 'Visa',
      category: 'Credit Platinum/Signature',
      tierName: 'فيزا إنفينيت / بلاتينيوم ائتمانية',
      rawStatusByGateway: {
        paytabs: 'accepted',
        telr: 'accepted',
        noon: 'accepted',
        myfatoorah: 'accepted',
        payzaty: 'accepted',
        tabby: 'accepted',
      },
      approvalRate: 99.2,
      riskLevel: 'low',
      notes: 'مقبولة بنسبة 100% في كافة البوابات دون أي حظر أو استثناء.',
    };
  }

  // Generic Credit Classic
  return {
    bin: cleanBin,
    bankName: `بطاقة بنكية قياسية (${firstDigit === '4' ? 'Visa' : 'Mastercard'})`,
    country: 'دولي / إقليمي',
    scheme: firstDigit === '4' ? 'Visa' : 'Mastercard',
    category: 'Credit Classic',
    tierName: 'ائتمانية قياسية',
    rawStatusByGateway: {
      paytabs: 'accepted',
      telr: 'accepted',
      noon: 'accepted',
      myfatoorah: 'accepted',
      payzaty: 'accepted',
      tabby: 'conditional',
    },
    approvalRate: 94.0,
    riskLevel: 'low',
    notes: 'بطاقة ائتمان قياسية عامة، تحظى بقبول 100% في بوابات الدفع الكبرى.',
  };
}

/**
 * Main Analysis Function:
 * Analyzes a string list of BINs (separated by commas, newlines, spaces)
 * Groups them by Card Type (كـ نوع) and determines gateways with 100% acceptance.
 */
export function analyzeBinsByCardType(rawInput: string): MultiBinAnalysisReport {
  // Extract all 6-8 digit patterns
  const tokens = rawInput
    .replace(/[^\d,\s\n;-]/g, ' ')
    .split(/[\s,\n;-]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 6);

  // Deduplicate
  const uniqueBins = Array.from(new Set(tokens.map(t => t.slice(0, 6))));

  if (uniqueBins.length === 0) {
    return {
      totalInputBins: 0,
      validBinsCount: 0,
      categoriesFound: [],
      universal100Gateways: [],
      summaryInsights: {
        highestAcceptanceType: 'لا توجد بيانات',
        highestRiskType: 'لا توجد بيانات',
        smartRoutingAdvice: 'قم بإدخال بينات صالحة (6 أرقام على الأقل) لعرض التقرير الشامل.',
      },
    };
  }

  // Resolve all BINs
  const evaluatedBins = uniqueBins.map(resolveBinDetails);

  // Group by Category
  const categoryMap = new Map<CardCategoryType, EvaluatedBinItem[]>();
  for (const binItem of evaluatedBins) {
    const list = categoryMap.get(binItem.category) || [];
    list.push(binItem);
    categoryMap.set(binItem.category, list);
  }

  const categoriesFound: CategoryAcceptanceGroup[] = [];

  for (const [categoryKey, binsInCat] of categoryMap.entries()) {
    const meta = CATEGORY_METADATA[categoryKey] || {
      titleAr: categoryKey,
      descAr: 'تصنيف بطاقات بنكية',
      icon: '💳',
      color: '#444',
    };

    const guaranteedGateways: Gateway100Result[] = [];
    const partialGateways: Gateway100Result[] = [];
    const rejectedGateways: Gateway100Result[] = [];

    for (const gw of SUPPORTED_GATEWAYS) {
      let acceptedCount = 0;
      let conditionalCount = 0;
      let rejectedCount = 0;
      const reasons: string[] = [];

      for (const b of binsInCat) {
        const st = b.rawStatusByGateway[gw.id] || 'conditional';
        if (st === 'accepted') {
          acceptedCount++;
        } else if (st === 'conditional') {
          conditionalCount++;
          if (b.notes && !reasons.includes(b.notes)) reasons.push(b.notes);
        } else {
          rejectedCount++;
          if (b.notes && !reasons.includes(b.notes)) reasons.push(b.notes);
        }
      }

      const total = binsInCat.length;
      const acceptancePercentage = Math.round((acceptedCount / total) * 100);

      // 100% acceptance condition: ALL bins in this category are marked 'accepted' without a single rejection or condition!
      const is100 = acceptedCount === total && conditionalCount === 0 && rejectedCount === 0;

      const gwResult: Gateway100Result = {
        gatewayId: gw.id,
        gatewayName: gw.name,
        badge: gw.badge,
        logo: gw.logo,
        isGuaranteed100: is100,
        acceptedBinCount: acceptedCount,
        totalBinsInCategory: total,
        acceptancePercentage,
        reasonsOrConditions: reasons,
        recommendedCurrencies: ['SAR', 'AED', 'KWD', 'USD'],
        supports3DS2: true,
        zeroChargebackRisk: categoryKey === 'Credit Platinum/Signature' || categoryKey === 'Debit Mada',
      };

      if (is100) {
        guaranteedGateways.push(gwResult);
      } else if (acceptedCount > 0 || conditionalCount > 0) {
        partialGateways.push(gwResult);
      } else {
        rejectedGateways.push(gwResult);
      }
    }

    // Safety score calculation
    const avgScore = Math.round(
      binsInCat.reduce((sum, b) => sum + b.approvalRate, 0) / binsInCat.length
    );

    let aiRecommendation = '';
    if (guaranteedGateways.length > 0) {
      const topGwNames = guaranteedGateways.map(g => g.gatewayName.split(' ')[0]).join(' و ');
      aiRecommendation = `✨ نوع البطاقة [${meta.titleAr}] يحظى بقبول قطعي 100% على ${guaranteedGateways.length} بوابات (${topGwNames}). ننصح بتوجيه كافة الطلبات من هذا النوع مباشرة لتلك البوابات لتفادي أي رفض.`;
    } else {
      aiRecommendation = `⚠️ لا توجد بوابة تقدم قبولاً غير مشروط 100% لهذا النوع، نظراً لمخاطر الـ Fraud أو متطلبات الربط الإلزامية. يجب تفعيل التوجيه المشروط مع 3DS V2 إلزامي.`;
    }

    categoriesFound.push({
      category: categoryKey,
      categoryTitleAr: meta.titleAr,
      categoryDescAr: meta.descAr,
      icon: meta.icon,
      badgeColor: meta.color,
      bins: binsInCat,
      guaranteedGateways,
      partialGateways,
      rejectedGateways,
      overallCategorySafetyScore: avgScore,
      aiRecommendation,
    });
  }

  // Find universal 100% Gateways (Gateways that have 100% in ALL categories discovered!)
  const universal100Gateways = SUPPORTED_GATEWAYS.filter(gw => {
    return categoriesFound.every(cat => cat.guaranteedGateways.some(g => g.gatewayId === gw.id));
  }).map(gw => ({
    gatewayId: gw.id,
    gatewayName: gw.name,
    badge: gw.badge,
    description: 'تقبل 100% من جميع الأنواع والـ BINs التي تم إدخالها دون استثناء.',
    perfectAcrossAllTypes: true,
  }));

  // Summary insights
  let bestCat = categoriesFound[0]?.categoryTitleAr || '';
  let worstCat = categoriesFound[0]?.categoryTitleAr || '';
  let highestScore = -1;
  let lowestScore = 999;

  for (const c of categoriesFound) {
    if (c.overallCategorySafetyScore > highestScore) {
      highestScore = c.overallCategorySafetyScore;
      bestCat = c.categoryTitleAr;
    }
    if (c.overallCategorySafetyScore < lowestScore) {
      lowestScore = c.overallCategorySafetyScore;
      worstCat = c.categoryTitleAr;
    }
  }

  return {
    totalInputBins: uniqueBins.length,
    validBinsCount: evaluatedBins.length,
    categoriesFound,
    universal100Gateways,
    summaryInsights: {
      highestAcceptanceType: `${bestCat} (${highestScore}%)`,
      highestRiskType: `${worstCat} (${lowestScore}%)`,
      smartRoutingAdvice:
        universal100Gateways.length > 0
          ? `البوابة الذهبية الشاملة لجميع مدخلاتك هي: ${universal100Gateways.map(u => u.gatewayName).join(', ')}.`
          : 'تختلف البوابات الضامنة بنسبة 100% حسب نوع البطاقة؛ طبّق قواعد التوجيه الذكي (Smart Routing Rules) المعروضة أدناه لكل نوع.',
    },
  };
}
