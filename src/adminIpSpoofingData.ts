import { gatewayNames } from '../shared/policy';
export interface SpoofedCountry {
  code: string;
  countryName: string;
  cityName: string;
  flag: string;
  ip: string;
  isp: string;
  asn: string;
  region: 'gcc' | 'arab' | 'europe' | 'north_america' | 'asia';
  avgLatency: string;
  supportedCards: string[];
}

export interface GatewayGeoRule {
  gatewayId: string;
  gatewayName: string;
  isCompatible: boolean;
  supportLevel: 'native' | 'supported' | 'restricted' | 'blocked';
  notes: string;
  supportedCurrencies: string[];
}

export { defaultIpSimulation as DEFAULT_ADMIN_IP_CONFIG } from '../shared/testing-workspace';
export type { IpSimulationConfig as AdminIpSpoofingConfig } from '../shared/testing-workspace';

export const SPOOFED_COUNTRIES_CATALOG: SpoofedCountry[] = [
  {
    code: 'SA_RUH',
    countryName: 'المملكة العربية السعودية',
    cityName: 'الرياض',
    flag: '🇸🇦',
    ip: '178.80.124.45',
    isp: 'STC (Saudi Telecom Company)',
    asn: 'AS39386 STC',
    region: 'gcc',
    avgLatency: '11ms',
    supportedCards: ['مدى Mada', 'Visa', 'Mastercard', 'Apple Pay', 'AMEX', 'UrPay', 'STCPay']
  },
  {
    code: 'SA_JED',
    countryName: 'المملكة العربية السعودية',
    cityName: 'جدة',
    flag: '🇸🇦',
    ip: '93.168.21.112',
    isp: 'Mobily Broadband',
    asn: 'AS35819 Etihad Etisalat',
    region: 'gcc',
    avgLatency: '15ms',
    supportedCards: ['مدى Mada', 'Visa', 'Mastercard', 'Apple Pay']
  },
  {
    code: 'AE_DXB',
    countryName: 'الإمارات العربية المتحدة',
    cityName: 'دبي',
    flag: '🇦🇪',
    ip: '185.220.101.5',
    isp: 'Etisalat UAE',
    asn: 'AS5384 Emirates Telecom',
    region: 'gcc',
    avgLatency: '24ms',
    supportedCards: ['Jaywan', 'Visa', 'Mastercard', 'Apple Pay', 'Tabby']
  },
  {
    code: 'AE_AUH',
    countryName: 'الإمارات العربية المتحدة',
    cityName: 'أبوظبي',
    flag: '🇦🇪',
    ip: '5.30.12.80',
    isp: 'du (Emirates Integrated Telecommunications)',
    asn: 'AS15802 DU',
    region: 'gcc',
    avgLatency: '27ms',
    supportedCards: ['Visa', 'Mastercard', 'Apple Pay', 'Google Pay']
  },
  {
    code: 'KW_KWI',
    countryName: 'الكويت',
    cityName: 'مدينة الكويت',
    flag: '🇰🇼',
    ip: '62.150.12.89',
    isp: 'Zain Kuwait',
    asn: 'AS3378 Mobile Telecommunications Co',
    region: 'gcc',
    avgLatency: '32ms',
    supportedCards: ['KNET كي نت', 'Visa', 'Mastercard', 'Apple Pay']
  },
  {
    code: 'BH_MAN',
    countryName: 'البحرين',
    cityName: 'المنامة',
    flag: '🇧🇭',
    ip: '82.194.32.14',
    isp: 'Batelco Bahrain',
    asn: 'AS5416 Batelco',
    region: 'gcc',
    avgLatency: '29ms',
    supportedCards: ['Benefit بنفت', 'BenefitPay', 'Visa', 'Mastercard']
  },
  {
    code: 'QA_DOH',
    countryName: 'قطر',
    cityName: 'الدوحة',
    flag: '🇶🇦',
    ip: '37.210.192.5',
    isp: 'Ooredoo Qatar',
    asn: 'AS8781 Ooredoo',
    region: 'gcc',
    avgLatency: '35ms',
    supportedCards: ['NAPS نافس', 'Visa', 'Mastercard', 'Apple Pay', 'Himyan']
  },
  {
    code: 'OM_MCT',
    countryName: 'سلطنة عمان',
    cityName: 'مسقط',
    flag: '🇴🇲',
    ip: '94.128.64.20',
    isp: 'Omantel Telecom',
    asn: 'AS8529 Oman Telecommunications',
    region: 'gcc',
    avgLatency: '42ms',
    supportedCards: ['OmanNet عمان نت', 'Visa', 'Mastercard']
  },
  {
    code: 'EG_CAI',
    countryName: 'جمهورية مصر العربية',
    cityName: 'القاهرة',
    flag: '🇪🇬',
    ip: '156.210.45.88',
    isp: 'Telecom Egypt (WE)',
    asn: 'AS8452 TE-Data',
    region: 'arab',
    avgLatency: '55ms',
    supportedCards: ['Meeza ميزة', 'فوري Fawry', 'Visa', 'Mastercard']
  },
  {
    code: 'JO_AMM',
    countryName: 'المملكة الأردنية الهاشمية',
    cityName: 'عمّان',
    flag: '🇯🇴',
    ip: '212.118.0.33',
    isp: 'Orange Jordan',
    asn: 'AS9038 Jordan Telecom',
    region: 'arab',
    avgLatency: '48ms',
    supportedCards: ['Jo-MoPay', 'Visa', 'Mastercard']
  },
  {
    code: 'US_NYC',
    countryName: 'الولايات المتحدة الأمريكية',
    cityName: 'نيويورك',
    flag: '🇺🇸',
    ip: '198.51.100.42',
    isp: 'DigitalOcean Cloud Network',
    asn: 'AS14061 DigitalOcean',
    region: 'north_america',
    avgLatency: '138ms',
    supportedCards: ['Visa', 'Mastercard', 'Discover', 'AMEX', 'Chase BIN']
  },
  {
    code: 'GB_LON',
    countryName: 'المملكة المتحدة',
    cityName: 'لندن',
    flag: '🇬🇧',
    ip: '194.26.29.13',
    isp: 'British Telecom (BT)',
    asn: 'AS2856 BT Public Internet',
    region: 'europe',
    avgLatency: '115ms',
    supportedCards: ['Visa Debit', 'Mastercard', 'Barclays BIN']
  },
  {
    code: 'DE_FRA',
    countryName: 'ألمانيا (الاتحاد الأوروبي)',
    cityName: 'فرانكفورت',
    flag: '🇩🇪',
    ip: '185.190.140.22',
    isp: 'Deutsche Telekom AG',
    asn: 'AS3320 DTAG',
    region: 'europe',
    avgLatency: '108ms',
    supportedCards: ['SEPA', 'Girocard', 'Visa', 'Mastercard']
  },
  {
    code: 'TR_IST',
    countryName: 'تركيا',
    cityName: 'إسطنبول',
    flag: '🇹🇷',
    ip: '176.240.88.19',
    isp: 'Turkcell Superonline',
    asn: 'AS34984 Superonline',
    region: 'europe',
    avgLatency: '82ms',
    supportedCards: ['Troy ترروي', 'Visa', 'Mastercard']
  },
  {
    code: 'SG_SIN',
    countryName: 'سنغافورة',
    cityName: 'سنغافورة',
    flag: '🇸🇬',
    ip: '103.28.248.1',
    isp: 'Singtel Fiber Broadband',
    asn: 'AS7473 SingTel Group',
    region: 'asia',
    avgLatency: '165ms',
    supportedCards: ['PayNow', 'NETS', 'Visa', 'Mastercard']
  }
];

export function getGatewayGeoRules(country: SpoofedCountry): GatewayGeoRule[] {
  const isKSA = country.code.startsWith('SA');
  const isGCC = country.region === 'gcc';
  const isArab = country.region === 'arab';
  const isWestern = country.region === 'north_america' || country.region === 'europe';

  return [
    {
      gatewayId: 'paytabs',
      gatewayName: gatewayNames.paytabs,
      isCompatible: true,
      supportLevel: isKSA ? 'native' : isGCC ? 'supported' : 'supported',
      notes: isKSA 
        ? 'توافقية أصلية 100% مع بطاقات مدى و3D Secure بدون أي قيود جغرافية.'
        : isGCC
        ? 'توافقية ممتازة لدول الخليج مع دعم العملات الخليجية وتوجيه آمن.'
        : 'مدعومة دولياً، لكن تخضع لمعايير فحص البطاقات العالمية و3DS2.',
      supportedCurrencies: ['SAR', 'AED', 'BHD', 'KWD', 'OMR', 'QAR', 'USD', 'EUR']
    },
    {
      gatewayId: 'telr',
      gatewayName: 'تيلر (Telr Hosted/Framed)',
      isCompatible: true,
      supportLevel: isGCC || isWestern ? 'native' : 'supported',
      notes: 'تدعم أكثر من 120 دولة مع فحص تلقائي لعنوان العميل ونظام AVS للبطاقات الأمريكية والبريطانية.',
      supportedCurrencies: ['SAR', 'AED', 'USD', 'GBP', 'EUR']
    },
    {
      gatewayId: 'myfatoorah',
      gatewayName: 'ماي فاتورة (MyFatoorah)',
      isCompatible: isGCC || isArab,
      supportLevel: isGCC ? 'native' : isArab ? 'supported' : 'restricted',
      notes: isGCC
        ? 'تدعم جميع البنوك الخليجية وشبكات الدفع الوطنية (Knet, Benefit, Mada, NAPS).'
        : isArab
        ? 'مدعومة لعملاء المنطقة مع التحقق من الهوية الهاتفية.'
        : 'قد تُرفض العمليات الصادرة من عناوين خارج الخليج إذا لم يكن الحساب مفعل دولياً.',
      supportedCurrencies: ['KWD', 'SAR', 'AED', 'BHD', 'QAR', 'OMR', 'EGP', 'USD']
    },
    {
      gatewayId: 'payzaty',
      gatewayName: 'بي زاتي (PayZaty)',
      isCompatible: isGCC,
      supportLevel: isGCC ? 'native' : 'restricted',
      notes: isGCC
        ? 'ربط مباشر وسريع لمعالجة العملات الخليجية وبطاقات الائتمان المحلية.'
        : 'مخصصة للتجار الإقليميين؛ ينصح باستخدام عنوان IP خليجي لتفادي الحظر الوقائي.',
      supportedCurrencies: ['SAR', 'KWD', 'AED', 'BHD']
    },
    {
      gatewayId: 'tabby',
      gatewayName: 'تابي (Tabby BNPL)',
      isCompatible: isKSA || country.code.startsWith('AE') || country.code.startsWith('KW'),
      supportLevel: (isKSA || country.code.startsWith('AE') || country.code.startsWith('KW')) ? 'native' : 'blocked',
      notes: (isKSA || country.code.startsWith('AE') || country.code.startsWith('KW'))
        ? 'الدولة متوافقة بالكامل مع شروط تمويل الشراء بالتقسيط تابي.'
        : 'غير متوافقة! تابي تشترط أن يكون العميل وموقع الـ IP داخل السعودية أو الإمارات أو الكويت مع رقم هاتف محلي.',
      supportedCurrencies: ['SAR', 'AED', 'KWD']
    },
    {
      gatewayId: 'noon',
      gatewayName: 'نون للمدفوعات (Noon Payments)',
      isCompatible: isKSA || country.code.startsWith('AE') || country.code.startsWith('EG'),
      supportLevel: (isKSA || country.code.startsWith('AE') || country.code.startsWith('EG')) ? 'native' : 'restricted',
      notes: 'تعمل بكفاءة عالية في السعودية والإمارات ومصر. العمليات الدولية تحتاج موافقة خاصة.',
      supportedCurrencies: ['SAR', 'AED', 'EGP']
    },
    {
      gatewayId: 'payone',
      gatewayName: 'بي وان (PayOne MENA)',
      isCompatible: isGCC || isArab,
      supportLevel: isGCC || isArab ? 'native' : 'restricted',
      notes: 'بوابة إقليمية تدعم المعاملات بالدينار والريال مع فحص مخصص لمنطقة الشرق الأوسط.',
      supportedCurrencies: ['JOD', 'SAR', 'AED', 'USD']
    }
  ];
}
