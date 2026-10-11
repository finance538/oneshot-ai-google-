export interface CustomerGatewayConfig {
  gatewayId: string;
  gatewayName: string;
  status: 'connected' | 'testing' | 'pending';
  integrationType: string;
  currency: string;
  merchantStoreId: string;
  webhookStatus: 'active' | 'inactive';
  lastTransactionAt: string;
}

export interface CustomerProfileWithGateways {
  customerId: string; // 7-digit random number
  merchantName: string;
  ownerEmail: string;
  phone: string;
  country: string;
  city: string;
  activeGateways: CustomerGatewayConfig[];
  securityScore: number;
  kycStatus: 'verified' | 'in_review';
}

export const PRESET_CUSTOMERS: CustomerProfileWithGateways[] = [
  {
    customerId: '8492015',
    merchantName: 'متجر الأناقة الخليجية للأزياء',
    ownerEmail: 'contact@al-anaqah-store.com',
    phone: '+966501234567',
    country: 'المملكة العربية السعودية',
    city: 'الرياض',
    securityScore: 98,
    kycStatus: 'verified',
    activeGateways: [
      {
        gatewayId: 'paytabs',
        gatewayName: 'بيتابس (PayTabs KSA)',
        status: 'connected',
        integrationType: 'نافذة الدفع الموجهة (Hosted Payment Page)',
        currency: 'SAR',
        merchantStoreId: 'PT-SA-84920',
        webhookStatus: 'active',
        lastTransactionAt: 'منذ 12 دقيقة'
      },
      {
        gatewayId: 'tabby',
        gatewayName: 'تابي (Tabby BNPL)',
        status: 'connected',
        integrationType: 'تقسيط المشتريات بدون فوائد',
        currency: 'SAR',
        merchantStoreId: 'TB-MER-8492',
        webhookStatus: 'active',
        lastTransactionAt: 'منذ ساعتين'
      },
      {
        gatewayId: 'telr',
        gatewayName: 'تيلر (Telr Hosted)',
        status: 'testing',
        integrationType: 'النافذة المدمجة داخل المتجر (Framed)',
        currency: 'USD',
        merchantStoreId: 'TL-849201',
        webhookStatus: 'active',
        lastTransactionAt: 'منذ يوم'
      }
    ]
  },
  {
    customerId: '3720194',
    merchantName: 'مجوهرات الماس والذهب الفاخرة',
    ownerEmail: 'sales@almas-jewels.sa',
    phone: '+966559876543',
    country: 'المملكة العربية السعودية',
    city: 'جدة',
    securityScore: 100,
    kycStatus: 'verified',
    activeGateways: [
      {
        gatewayId: 'myfatoorah',
        gatewayName: 'ماي فاتورة (MyFatoorah الخليج)',
        status: 'connected',
        integrationType: 'ربط الفوترة السريعة وروابط SMS',
        currency: 'SAR',
        merchantStoreId: 'MF-KSA-37201',
        webhookStatus: 'active',
        lastTransactionAt: 'منذ 5 دقائق'
      },
      {
        gatewayId: 'paytabs',
        gatewayName: 'بيتابس (PayTabs KSA)',
        status: 'connected',
        integrationType: 'ربط مباشر عبر واجهات برمجة التطبيقات (Direct API)',
        currency: 'SAR',
        merchantStoreId: 'PT-JED-3720',
        webhookStatus: 'active',
        lastTransactionAt: 'منذ 34 دقيقة'
      }
    ]
  },
  {
    customerId: '9140283',
    merchantName: 'أكاديمية المستقبل للتدريب الرقمي',
    ownerEmail: 'finance@future-academy.edu',
    phone: '+971501122334',
    country: 'الإمارات العربية المتحدة',
    city: 'دبي',
    securityScore: 94,
    kycStatus: 'verified',
    activeGateways: [
      {
        gatewayId: 'telr',
        gatewayName: 'تيلر (Telr UAE)',
        status: 'connected',
        integrationType: 'الاشتراكات المتكررة والتحصيل التلقائي',
        currency: 'AED',
        merchantStoreId: 'TL-DXB-9140',
        webhookStatus: 'active',
        lastTransactionAt: 'منذ 3 ساعات'
      },
      {
        gatewayId: 'noon',
        gatewayName: 'نون للمدفوعات (Noon Payments)',
        status: 'connected',
        integrationType: 'دفع سلس مع Apple Pay',
        currency: 'AED',
        merchantStoreId: 'NN-DXB-91402',
        webhookStatus: 'active',
        lastTransactionAt: 'منذ 6 ساعات'
      }
    ]
  },
  {
    customerId: '5028371',
    merchantName: 'دانة للإلكترونيات والأجهزة الذكية',
    ownerEmail: 'support@danah-elec.com',
    phone: '+96598765432',
    country: 'الكويت',
    city: 'مدينة الكويت',
    securityScore: 92,
    kycStatus: 'verified',
    activeGateways: [
      {
        gatewayId: 'payzaty',
        gatewayName: 'بي زاتي (PayZaty الكويت)',
        status: 'connected',
        integrationType: 'بوابة كي نت KNET وبطاقات الائتمان',
        currency: 'KWD',
        merchantStoreId: 'PZ-KW-5028',
        webhookStatus: 'active',
        lastTransactionAt: 'منذ 40 دقيقة'
      },
      {
        gatewayId: 'myfatoorah',
        gatewayName: 'ماي فاتورة (MyFatoorah)',
        status: 'connected',
        integrationType: 'النافذة المدمجة للخليج',
        currency: 'KWD',
        merchantStoreId: 'MF-KW-50283',
        webhookStatus: 'active',
        lastTransactionAt: 'منذ ساعتين'
      }
    ]
  }
];

export function findCustomerBy7DigitId(id: string): CustomerProfileWithGateways | null {
  const clean = id.trim().replace(/\D/g, '');
  return PRESET_CUSTOMERS.find(c => c.customerId === clean) || null;
}

export function generateRandom7DigitId(): string {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}
