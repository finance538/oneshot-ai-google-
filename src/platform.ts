export type Method = 'hosted' | 'framed' | 'mobile' | 'mada_applepay' | 'samsung_pay' | 'managed' | 'own' | 'paylink' | 'invoice' | 'recurring';

export const methods: { id: Method; name: string; english: string; description: string; tag: string }[] = [
  { id: 'hosted', name: 'صفحة الدفع المستضافة', english: 'Hosted Checkout', description: 'تجربة دفع آمنة على صفحة PayTabs مع إعادة العميل إلى منصتك.', tag: 'الأبسط للبدء' },
  { id: 'framed', name: 'الدفع داخل الموقع', english: 'Embedded Checkout', description: 'صفحة دفع داخل إطار مدمج، دون مغادرة تجربة علامتك التجارية.', tag: 'داخل المنصة' },
  { id: 'managed', name: 'النموذج المُدار', english: 'Managed Form', description: 'نموذج بتصميمك؛ PayTabs يستبدل بيانات البطاقة بمرجع مؤقت قبل وصول الطلب إلى الخادم.', tag: 'SAQ A-EP' },
  { id: 'own', name: 'نموذجك الخاص', english: 'Own Form · Direct API', description: 'تحكم كامل في تجربة الدفع. تمر بيانات البطاقة عبر الخادم دون تخزينها.', tag: 'SAQ D-Merchant' },
  { id: 'paylink', name: 'روابط الدفع', english: 'PayLinks', description: 'أنشئ رابط PayTabs وشاركه مع عميلك عبر الرسائل أو البريد.', tag: 'جاهز للمشاركة' },
  { id: 'invoice', name: 'الفواتير', english: 'Invoice API', description: 'فاتورة إلكترونية ببنود الخدمة، وصفحة دفع خاصة بها على PayTabs.', tag: 'للخدمات والأعمال' },
  { id: 'recurring', name: 'الاشتراكات', english: 'Tokenization · Recurring', description: 'تحصيل شهري أو سنوي بعد موافقة العميل، باستخدام مراجع مشفرة لا بيانات البطاقة.', tag: 'تجديد تلقائي' },
  { id: 'mada_applepay', name: 'مدى وApple Pay', english: 'Mada · Apple Pay', description: 'صفحة دفع مخصصة للوسائل المتاحة على حساب التاجر والجهاز المستخدم.', tag: 'وسائل دفع' },
  { id: 'samsung_pay', name: 'سامسونج باي', english: 'Samsung Pay', description: 'صفحة دفع مخصصة لمحفظة سامسونج باي على الأجهزة التي تدعمها، بحسب ما يعلنه حساب التاجر.', tag: 'وسائل دفع' },
  { id: 'mobile', name: 'الدفع من الجوال', english: 'Mobile · PWA', description: 'صفحة دفع مناسبة للجوال والتطبيق المثبّت. ليست تكاملاً مع Native SDK.', tag: 'قابل للتثبيت' },
];

export interface PaymentDocument {
  id: string;
  title: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  method: Method;
  gateway: 'paytabs' | 'telr' | 'ngenius' | 'tap';
  interval: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  gatewayUrl: string | null;
}

export interface PaymentAttempt {
  id: string;
  documentId: string;
  amount: number;
  reference: string | null;
  status: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  documentId: string;
  status: string;
  nextChargeAt: string;
}

export interface GatewayRequest {
  id: string;
  merchantId: string;
  merchantName?: string;
  gateway: string;
  status: 'pending' | 'configured' | 'rejected';
  variables: Record<string, string>;
  notes?: string | null;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiLicenseView {
  tier: 'tier-1' | 'tier-2' | 'tier-3';
  tierX: boolean;
  staff: string[];
  admin: boolean;
  tiers: string[];
  source: 'default' | 'grant' | 'admin';
}

export interface AiEntitlementView {
  ownerId: string;
  tier: string;
  tierX: boolean;
  grantedBy: string | null;
  note: string | null;
  updatedAt: string;
}

export interface AiStaffGrantView {
  ownerId: string;
  staffId: string;
  grantedBy: string;
  createdAt: string;
}

export interface AiAdminView {
  tiers: { id: string; label: { ar: string; en: string }; pricePerQuestionSar: number | null; selectable: boolean }[];
  entitlements: AiEntitlementView[];
  staffGrants: AiStaffGrantView[];
}

export type AccountRole = 'admin' | 'merchant' | 'marketer' | 'loader';
export type AccountStatus = 'pending' | 'approved' | 'rejected';

export interface MarketerAccount {
  id: string;
  ownerId: string;
  email: string;
  fullName: string;
  role: 'merchant' | 'marketer';
  status: AccountStatus;
  referralCode: string | null;
  commissionRate: number;
  notes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketerCampaign {
  id: string;
  marketerId: string;
  ownerId: string;
  title: string;
  targetProductSku: string;
  utmCampaign: string;
  channel: string;
  clicks: number;
  conversions: number;
  earnedCommission: number;
  enabled: boolean;
  createdAt: string;
}

export interface Platform {
  merchant: { id: string; name: string; accountId?: string | null } | null;
  accountRole?: AccountRole;
  registrationStatus?: AccountStatus;
  marketerAccount?: MarketerAccount | null;
  marketerCampaigns?: MarketerCampaign[];
  adminMarketers?: MarketerAccount[];
  documents: PaymentDocument[];
  subscriptions: Subscription[];
  attempts: PaymentAttempt[];
  capabilities?: Record<string, boolean>;
  credentialPrefix?: string;
  telrPrefix?: string;
  telrCapabilities?: Record<string, boolean>;
  ngeniusPrefix?: string;
  ngeniusCapabilities?: Record<string, boolean>;
  tapPrefix?: string;
  tapCapabilities?: Record<string, boolean>;
  metrics?: { paidCount: number; totalPaid: number; pendingCount: number; customers: number };
  daily?: { day: string; amount: number }[];
  openLinks?: OpenLink[];
  policy?: PaymentPolicy;
  isAdmin?: boolean;
  /** ترخيص الذكاء الاصطناعي لهذا الحساب (منحة إدارية / افتراضي). */
  aiLicense?: AiLicenseView;
  /** للمسؤول فقط: كل منح الطبقات وتراخيص الكوادر. */
  aiAdmin?: AiAdminView | null;
  gatewayRequests?: GatewayRequest[];
  adminGatewayRequests?: GatewayRequest[];
}


export interface PublicPayment {
  document: Pick<PaymentDocument, 'id' | 'title' | 'amount' | 'gateway' | 'method' | 'interval' | 'status' | 'expiresAt'> & { merchantName: string };
  available: boolean;
  gatewayUrl: string | null;
  aiEnabled?: boolean;
}

export interface OpenLink {
  id: string;
  title: string;
  minimum: number;
  maximum: number;
  allowedMethods: string[];
  enabled: boolean;
  createdAt: string;
}

export interface PublicOpenLink {
  link: Pick<OpenLink, 'id' | 'title' | 'minimum' | 'maximum'> & { merchantName: string };
  choices: string[];
  enabled: boolean;
  aiEnabled: boolean;
}

export const statuses: Record<string, string> = { pending: 'بانتظار الدفع', paid: 'مكتمل', failed: 'غير ناجح', cancelled: 'ملغى', published: 'رابط منشور', processing: 'قيد المعالجة', active: 'نشط', charging: 'جارٍ التحصيل', review: 'يتطلب المراجعة', past_due: 'متأخر' };
export const money = (amount: number, locale = document.documentElement.lang) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(amount / 100);
export const date = (value: string, locale = document.documentElement.lang) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', calendar: 'gregory' }).format(new Date(value));
export const paymentLink = (id: string) => appearanceLink(`/pay/${id}`);
export const openPaymentLink = (id: string) => appearanceLink(`/p/${id}`);

export async function api<Type>(path: string, body?: Record<string, unknown>): Promise<Type> {
  let response: Response;
  try { response = await fetch(`/.netlify/functions/${path}`, { credentials: 'same-origin', cache: 'no-store', ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(45000) }); }
  catch { throw new Error('تعذر إتمام الطلب.'); }
  let result;
  try { result = await response.json(); }
  catch { throw new Error('تعذر إتمام الطلب.'); }
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'تعذر إتمام الطلب.');
  return result as Type;
}

export interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
import { appearanceLink } from './i18n';
import type { PaymentPolicy } from '../shared/policy';
