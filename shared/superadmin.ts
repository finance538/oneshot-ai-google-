// shared/superadmin.ts
// مصدر الحقيقة الوحيد لحالة "لوحة التحكم المركزية (Super-Admin Command Center)".
// تُخزَّن كوثيقة JSON واحدة في جدول `admin_config` (صف واحد id='global')، وتُقرأ
// وتُعدَّل من دالة `super-admin` بعد التحقق من صلاحية المالك (isAdmin).

export type SubdomainId = 'www' | 'ai' | 'media' | 'pay' | 'brand' | 'workflow' | 'loader';
export type AppStatus = 'active' | 'beta' | 'maintenance' | 'coming-soon' | 'vip';
export type ProviderId = 'gemini' | 'vps' | 'ollama-cloud' | 'openai' | 'nous';
export type AiTierId = 'tier-1' | 'tier-2' | 'tier-3' | 'tier-x';

export const SUBDOMAINS: { id: SubdomainId; name: string; host: string }[] = [
  { id: 'www', name: 'OneShot الرئيسية', host: '1shotcam.com' },
  { id: 'ai', name: 'OneShot AI', host: 'ai.1shotcam.com' },
  { id: 'media', name: 'OneShot Media', host: 'media.1shotcam.com' },
  { id: 'pay', name: 'OneShot Pay', host: 'pay.1shotcam.com' },
  { id: 'brand', name: 'OneShot Brand', host: 'brand.1shotcam.com' },
  { id: 'workflow', name: 'OneShot Workflow', host: 'workflow.1shotcam.com' },
  { id: 'loader', name: 'OneShot Loader', host: 'loader.1shotcam.com' },
];

export const APP_STATUSES: { id: AppStatus; label: string; color: string }[] = [
  { id: 'active', label: 'مفعل · Live', color: '#2fb380' },
  { id: 'beta', label: 'بيتا مجانية', color: '#88bfc5' },
  { id: 'maintenance', label: 'صيانة', color: '#c9ae78' },
  { id: 'coming-soon', label: 'قريباً', color: '#7a7f8f' },
  { id: 'vip', label: 'VIP فقط', color: '#c9ae78' },
];

export interface GlobalBanner {
  enabled: boolean;
  textAr: string;
  textEn: string;
  background: string;
  foreground: string;
  badges: string[];
}

export interface SubdomainConfig {
  status: AppStatus;
}

export interface ToolToggles {
  storeInspector: boolean;    // فاحص المتاجر
  adStudio: boolean;          // استوديو الإعلانات
  slangGenerator: boolean;    // مولد الأوامر العامّي
  docStudio: boolean;         // استوديو الوثائقيات 30 دقيقة
  contractTranslator: boolean; // مترجم العقود
}

export interface ProviderConfig {
  enabled: boolean;
  endpoint?: string;
  envKey?: string;
}

export interface FairUse {
  enabled: boolean;
  dailyQuestions: number;
}

export interface Plan {
  id: string;
  nameAr: string;
  nameEn: string;
  priceSar: number;
  features: string[];
}

export interface Coupon {
  code: string;
  percent: number;
  active: boolean;
}

export interface ModelBinding {
  provider: ProviderId;
  model: string;
}

export interface SuperAdminConfig {
  /** مفتاح الانتقال من بيتا مجانية إلى إطلاق تجاري (اشتراكات/باقات). */
  commercial: boolean;
  subdomains: Record<SubdomainId, SubdomainConfig>;
  banner: GlobalBanner;
  tools: ToolToggles;
  providers: Record<ProviderId, ProviderConfig>;
  modelRouting: {
    autoRouter: boolean;
    bindings: Record<AiTierId, ModelBinding>;
  };
  fairUse: FairUse;
  plans: Plan[];
  coupons: Coupon[];
}

export const defaultSuperAdminConfig: SuperAdminConfig = {
  commercial: false,
  subdomains: {
    www: { status: 'active' },
    ai: { status: 'beta' },
    media: { status: 'beta' },
    pay: { status: 'active' },
    brand: { status: 'active' },
    workflow: { status: 'coming-soon' },
    loader: { status: 'coming-soon' },
  },
  banner: {
    enabled: true,
    textAr: '🇸🇦 صناعة سعودية · تجربة مجانية',
    textEn: '🇸🇦 SAUDI MADE · FREE BETA',
    background: '#c9ae78',
    foreground: '#0a0a0f',
    badges: ['🇸🇦 SAUDI MADE', 'Free Beta'],
  },
  tools: {
    storeInspector: true,
    adStudio: true,
    slangGenerator: true,
    docStudio: false,
    contractTranslator: true,
  },
  providers: {
    gemini: { enabled: false, envKey: 'GEMINI_API_KEY' },
    vps: { enabled: true, endpoint: 'https://gw.187-7-65-45.sslip.io', envKey: 'ONESHOT_VPS_AGENT_TOKEN' },
    'ollama-cloud': { enabled: true, endpoint: 'https://ollama.com', envKey: 'OLLAMA_API_KEY' },
    openai: { enabled: false, envKey: 'OPENAI_API_KEY' },
    nous: { enabled: false, envKey: 'NOUS_API_KEY' },
  },
  modelRouting: {
    autoRouter: true,
    bindings: {
      'tier-1': { provider: 'ollama-cloud', model: 'llama3.2:latest' },
      'tier-2': { provider: 'ollama-cloud', model: 'isotnek/qwen3.5:9B-Unsloth-UD-Q4_K_XL' },
      'tier-3': { provider: 'vps', model: 'deepseek-v4.1-flash:cloud' },
      'tier-x': { provider: 'vps', model: 'deepseek-r1:70b-abliterated' },
    },
  },
  fairUse: { enabled: true, dailyQuestions: 30 },
  plans: [
    { id: 'starter', nameAr: 'البادئ', nameEn: 'Starter', priceSar: 0, features: ['Tier 1', 'خدمة العملاء', 'المرشد الذكي'] },
    { id: 'pro', nameAr: 'الاحترافي', nameEn: 'Pro', priceSar: 199, features: ['Tier 1 + 2', 'كل الكوادر', '10 مستخدمين'] },
    { id: 'business', nameAr: 'الأعمال', nameEn: 'Business', priceSar: 599, features: ['Tier 1 + 2 + 3', 'كوادر غير محدودة', 'دعم VIP'] },
  ],
  coupons: [],
};

// ===== أنواع حالة "المستخدمين" كما تُعرض في اللوحة (مشتقة من merchants + aiEntitlements) =====
export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  merchantId: string | null;
  tier: string;
  tierX: boolean;
  staff: string[];
  banned: boolean;
  createdAt: string;
  usageToday: number;
  usageTotal: number;
}

export interface ClientContext {
  id: string;
  name: string;
  nameEn: string;
  title: string;
  guardrails: string[];
  projects: string[];
  createdAt: string;
  updatedAt: string;
}

export type FeedbackCategory = 'bug' | 'feature' | 'rating';
export interface FeedbackRow {
  id: string;
  userId: string;
  category: FeedbackCategory;
  page: string;
  modelId: string | null;
  message: string;
  rewarded: boolean;
  createdAt: string;
}

export interface ProviderHealth {
  id: ProviderId;
  label: string;
  configured: boolean;
  status: 'ok' | 'error' | 'disabled';
  latencyMs: number | null;
  detail: string;
}

export interface SuperAdminSnapshot {
  config: SuperAdminConfig;
  version: number;
  users: AdminUserRow[];
  feedback: FeedbackRow[];
  clients: ClientContext[];
  providers: ProviderHealth[];
}
