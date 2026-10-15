// shared/ai-tiers.ts
// مصدر الحقيقة الوحيد لطبقات الذكاء الاصطناعي في ونشوت (OneShot).
//
// القاعدة الأساسية: الكتالوج يتبع الموديلات **الموجودة فعلاً على سيرفر Ollama**،
// لا العكس. أي موديل في هذا الملف يجب أن يكون موجوداً في `GET /api/tags` على السيرفر.
//
// يُستخدم هذا الملف في ثلاث جهات:
//   1. سيرفر Netlify (`staff-assistant.mts`) لتحديد الطبقة والموديل — القرار على السيرفر.
//   2. الواجهة (`AiTierManager.tsx`) لعرض الصناديق وحالة الترخيص.
//   3. البوابة (`/root/oneshot-agent-gateway/server.mjs`) عبر نفس قائمة الأسماء المسموحة
//      (ملاحظة: البوابة ملف مستقل خارج المستودع، وتُبقي نسخة مطابقة من القائمة).

export type AiTierId = 'tier-1' | 'tier-2' | 'tier-3' | 'tier-x';
/** الطبقات القابلة للشراء/الترخيص للتاجر. الطبقة الرابعة ليست للبيع. */
export type StaffTier = 'tier-1' | 'tier-2' | 'tier-3';

export interface TierText {
  ar: string;
  en: string;
}

export interface TierModel {
  /** اسم الموديل كما هو مثبّت على سيرفر Ollama (المعرّف الحقيقي). */
  id: string;
  label: TierText;
  tier: AiTierId;
  contextWindow: number;
  abliterated?: boolean;
  note: TierText;
}

export interface AiTierDefinition {
  id: AiTierId;
  badge: string;
  label: TierText;
  summary: TierText;
  /** السعر الافتراضي لكل سؤال بالريال. `null` = غير معروض للبيع (منحة إدارية فقط). */
  pricePerQuestionSar: number | null;
  /** هل يستطيع التاجر اختيار هذه الطبقة بنفسه؟ */
  selectable: boolean;
  /** هل تحتاج ترخيصاً صريحاً من الإدارة قبل الاستخدام؟ */
  requiresGrant: boolean;
  accent: string;
}

export const tierOrder: AiTierId[] = ['tier-1', 'tier-2', 'tier-3', 'tier-x'];
export const staffTiers: StaffTier[] = ['tier-1', 'tier-2', 'tier-3'];

export const tierModels: Record<AiTierId, TierModel[]> = {
  'tier-1': [
    {
      id: 'llama3.2:1b',
      label: { ar: 'Llama 3.2 (1B · لحظي)', en: 'Llama 3.2 (1B Instant)' },
      tier: 'tier-1',
      contextWindow: 128000,
      note: { ar: 'أسرع رد وأقل استهلاك — للرسائل القصيرة والترحيب والترجمة.', en: 'Fastest, lightest — short replies, greetings, translation.' },
    },
    {
      id: 'llama3.2:latest',
      label: { ar: 'Llama 3.2 (3B · متوازن)', en: 'Llama 3.2 (3B Balanced)' },
      tier: 'tier-1',
      contextWindow: 128000,
      note: { ar: 'خدمة العملاء اليومية وصياغة الردود والنصوص الخفيفة.', en: 'Daily customer care and light copy.' },
    },
  ],
  'tier-2': [
    {
      id: 'isotnek/qwen3.5:9B-Unsloth-UD-Q4_K_XL',
      label: { ar: 'Qwen 3.5 (9B · مهني)', en: 'Qwen 3.5 (9B Pro)' },
      tier: 'tier-2',
      contextWindow: 128000,
      note: { ar: 'تقني ومحاسبي وبرمجي بدقة أعلى (كود، APIs، فواتير، سياسات).', en: 'Technical, accounting and coding accuracy.' },
    },
  ],
  'tier-3': [
    {
      id: 'deepseek-v4.1-flash:cloud',
      label: { ar: 'DeepSeek 4.1 Flash (استدلال)', en: 'DeepSeek 4.1 Flash (Reasoning)' },
      tier: 'tier-3',
      contextWindow: 128000,
      note: { ar: 'تحليل عميق وقرارات ومخاطر وسبب الرفض خطوة بخطوة.', en: 'Deep analysis, decisions, risk and step-by-step reasoning.' },
    },
  ],
  'tier-x': [
    {
      id: 'huihui_ai/qwen3-abliterated:8b',
      label: { ar: 'Qwen 3 Abliterated (8B)', en: 'Qwen 3 Abliterated (8B)' },
      tier: 'tier-x',
      contextWindow: 32000,
      abliterated: true,
      note: { ar: 'نماذج مفرغة من مرشحات الرقابة — بترخيص إداري فقط.', en: 'De-aligned weights — admin grant only.' },
    },
    {
      id: 'sachasayan/interimlabs-huihui-qwen3.5-9b-abliterated:q4_k_m',
      label: { ar: 'Qwen 3.5 Abliterated (9B)', en: 'Qwen 3.5 Abliterated (9B)' },
      tier: 'tier-x',
      contextWindow: 128000,
      abliterated: true,
      note: { ar: 'نماذج مفرغة من مرشحات الرقابة — بترخيص إداري فقط.', en: 'De-aligned weights — admin grant only.' },
    },
    {
      id: 'dolphin3:8b',
      label: { ar: 'Dolphin 3 (8B)', en: 'Dolphin 3 (8B)' },
      tier: 'tier-x',
      contextWindow: 32000,
      abliterated: true,
      note: { ar: 'نماذج مفرغة من مرشحات الرقابة — بترخيص إداري فقط.', en: 'De-aligned weights — admin grant only.' },
    },
  ],
};

export const aiTiers: Record<AiTierId, AiTierDefinition> = {
  'tier-1': {
    id: 'tier-1',
    badge: 'Tier 1 · Fast',
    label: { ar: 'المستوى الأول: السريع', en: 'Tier 1: Fast' },
    summary: { ar: 'ردود فورية للأسئلة اليومية وخدمة العملاء بأقل تكلفة.', en: 'Instant replies for daily questions and customer care.' },
    pricePerQuestionSar: 0.25,
    selectable: true,
    requiresGrant: false,
    accent: '#10b981',
  },
  'tier-2': {
    id: 'tier-2',
    badge: 'Tier 2 · Pro',
    label: { ar: 'المستوى الثاني: المهني', en: 'Tier 2: Pro' },
    summary: { ar: 'أسئلة تقنية ومحاسبية وبرمجية تحتاج دقة أعلى.', en: 'Technical, accounting and coding questions.' },
    pricePerQuestionSar: 0.75,
    selectable: true,
    requiresGrant: true,
    accent: '#3b82f6',
  },
  'tier-3': {
    id: 'tier-3',
    badge: 'Tier 3 · Reasoning',
    label: { ar: 'المستوى الثالث: الاستدلال العميق', en: 'Tier 3: Deep Reasoning' },
    summary: { ar: 'تحليل وقراءة مخاطر وقرارات معقدة بسلاسل تفكير.', en: 'Analysis, risk reading and complex decisions.' },
    pricePerQuestionSar: 1.5,
    selectable: true,
    requiresGrant: true,
    accent: '#8b5cf6',
  },
  'tier-x': {
    id: 'tier-x',
    badge: 'Tier X · Grant Only',
    label: { ar: 'المستوى الرابع X: بترخيص من الإدارة', en: 'Tier X: Admin Grant Only' },
    summary: { ar: 'نماذج غير مقيّدة (Abliterated) — غير معروضة للبيع، تُمنح من الإدارة لحسابات محددة.', en: 'Abliterated models — not for sale; granted per account by the platform admin.' },
    pricePerQuestionSar: null,
    selectable: false,
    requiresGrant: true,
    accent: '#ef4444',
  },
};

export const allTierModels: TierModel[] = tierOrder.flatMap(tier => tierModels[tier]);
export const abliteratedModels: string[] = tierModels['tier-x'].map(model => model.id);

export function isAiTierId(value: unknown): value is AiTierId {
  return typeof value === 'string' && (tierOrder as string[]).includes(value);
}

export function isStaffTier(value: unknown): value is StaffTier {
  return typeof value === 'string' && (staffTiers as string[]).includes(value);
}

export function tierRank(tier: AiTierId): number {
  return tierOrder.indexOf(tier);
}

export function modelsForTier(tier: AiTierId): TierModel[] {
  return tierModels[tier] ?? [];
}

export function defaultModelFor(tier: AiTierId): string {
  return modelsForTier(tier)[0]?.id ?? tierModels['tier-1'][0].id;
}

/** هل هذا الموديل ينتمي لهذه الطبقة؟ (منع استخدام موديل طبقة أعلى باسم طبقة أدنى). */
export function modelBelongsToTier(modelId: unknown, tier: AiTierId): boolean {
  return typeof modelId === 'string' && modelsForTier(tier).some(model => model.id === modelId);
}

export function tierOfModel(modelId: unknown): AiTierId | undefined {
  return allTierModels.find(model => model.id === modelId)?.tier;
}

/**
 * ما الطبقات التي يفتحها هذا الترخيص؟
 * التاجر الذي يملك tier-2 يستطيع استخدام tier-1 و tier-2، و`tier-x` تُفتح فقط بمنحة صريحة.
 */
export function licensedTiers(licenseTier: StaffTier, tierX: boolean): AiTierId[] {
  const allowed: AiTierId[] = staffTiers.filter(tier => tierRank(tier) <= tierRank(licenseTier));
  if (tierX) allowed.push('tier-x');
  return allowed;
}

export function tierIsLicensed(tier: AiTierId, licenseTier: StaffTier, tierX: boolean): boolean {
  return licensedTiers(licenseTier, tierX).includes(tier);
}

/** السعر الافتراضي للسؤال في هذه الطبقة (null = غير معروض للبيع). */
export function tierPriceSar(tier: AiTierId): number | null {
  return aiTiers[tier].pricePerQuestionSar;
}

// ============================================================================
// الموجّه الذكي (Auto-Router) — قرار واحد يُنفَّذ على السيرفر
// ============================================================================

export interface TierRouteDecision {
  tier: AiTierId;
  modelId: string;
  reason: TierText;
  confidence: number;
}

export interface RouteOptions {
  /** هل يملك الحساب ترخيص المستوى الرابع X؟ */
  tierX?: boolean;
  /** أعلى طبقة مدفوعة مسموحة للحساب. */
  licenseTier?: StaffTier;
  /** اختيار التاجر: طبقة محددة أو توجيه تلقائي. */
  requested?: AiTierId | 'auto';
  /** موديل محدد داخل الطبقة (اختياري). */
  modelId?: string;
}

const tierXTriggers = ['abliterated', 'uncensored', 'بدون قيود', 'غير مقيّد', 'تفكيك الحماية', 'jailbreak', 'unfiltered'];
const tier3Triggers = [
  'تنبؤ', 'احتمال', 'توقع', 'سبب الرفض', 'تحليل عميق', 'احتيال', 'fraud',
  'forensics', 'استدلال', 'خطوة بخطوة', 'reasoning', 'think', 'matrix',
  'قواعد المخاطر', 'نسبة القبول', 'chargeback', 'predict', 'forecast',
];
const tier2Triggers = [
  'api', 'كود', 'code', 'برمجة', 'webhook', 'telr', 'paytabs', 'json', 'sql',
  'ربط', 'تكامل', 'دالة', 'script', 'function', 'curl', 'node', 'python',
  'سياسة', 'عقد', 'شروط', 'policy', 'إعدادات التاجر', 'تقرير مالي',
  'ضرائب', 'vat', 'زكاة', 'فاتورة ضريبية', 'عمولة',
];

/**
 * يحدد الطبقة والموديل الأنسب لسؤال التاجر.
 * `tier-x` لا تُختار تلقائياً أبداً إلا لمن يملك ترخيصاً صريحاً.
 */
export function routeTier(prompt: string, options: RouteOptions = {}): TierRouteDecision {
  const text = String(prompt || '').toLowerCase().trim();
  const licenseTier: StaffTier = options.licenseTier ?? 'tier-1';
  const tierX = options.tierX === true;
  const allowed = licensedTiers(licenseTier, tierX);

  // 1) الطبقة الرابعة: بترخيص صريح فقط.
  if (tierX && tierXTriggers.some(trigger => text.includes(trigger))) {
    const model = modelsForTier('tier-x')[0];
    return {
      tier: 'tier-x',
      modelId: model.id,
      reason: { ar: 'ترخيص X نشط وطلب يخص تحليلاً غير مقيّد — وُجّه إلى المستوى الرابع.', en: 'Tier X licensed and an unrestricted-analysis request was detected.' },
      confidence: 0.9,
    };
  }

  // 2) أعلى طبقة مسموحة في الترخيص: لا نتجاوزها أبداً.
  const ceiling: AiTierId = tierX ? 'tier-3' : licenseTier;
  const capped = (tier: AiTierId): AiTierId => (tierRank(tier) <= tierRank(ceiling) ? tier : ceiling);

  const explicit = options.requested && options.requested !== 'auto' ? options.requested : null;
  const chosen = explicit
    ? capped(explicit)
    : tier3Triggers.some(trigger => text.includes(trigger))
      ? capped('tier-3')
      : tier2Triggers.some(trigger => text.includes(trigger))
        ? capped('tier-2')
        : capped('tier-1');

  const forced = explicit && tierRank(options.requested as AiTierId) > tierRank(chosen);
  const modelId = !forced && options.modelId && modelBelongsToTier(options.modelId, chosen)
    ? options.modelId
    : defaultModelFor(chosen);

  const reasons: Record<AiTierId, TierText> = {
    'tier-1': { ar: 'سؤال عام أو قصير — المستوى الأول يعطي رداً فورياً بأقل تكلفة.', en: 'General or short question — Tier 1 answers instantly at the lowest cost.' },
    'tier-2': { ar: 'سياق تقني/محاسبي/برمجي يحتاج دقة المستوى الثاني.', en: 'Technical, accounting or coding context requires Tier 2 accuracy.' },
    'tier-3': { ar: 'طلب تحليل ومخاطر واستدلال — المستوى الثالث.', en: 'Analysis, risk and reasoning request — Tier 3.' },
    'tier-x': { ar: 'المستوى الرابع X (ترخيص إداري).', en: 'Tier X (admin grant).' },
  };
  const reason = forced || tierRank(chosen) !== tierRank(options.requested as AiTierId) && explicit
    ? { ar: `طلبك تجاوز ترخيص حسابك (${aiTiers[chosen].label.ar}) — نُفّذ على أعلى طبقة مرخّصة لديك.`, en: `The requested tier exceeds your licence — served on your highest licensed tier (${aiTiers[chosen].label.en}).` }
    : reasons[chosen];

  return { tier: chosen, modelId, reason, confidence: explicit ? 0.99 : chosen === 'tier-1' ? 0.85 : 0.92 };
}

/** هل هذا الموديل ممنوع على غير المرخّصين؟ (يستخدم في سيرفر Netlify والبوابة). */
export function isAbliterated(modelId: unknown): boolean {
  return typeof modelId === 'string' && abliteratedModels.includes(modelId);
}

/** الطبقة التي يجب تسجيلها عند استخدام موديل معيّن (للفاتورة/الاستهلاك). */
export function billableTierFor(modelId: unknown, fallback: AiTierId = 'tier-1'): AiTierId {
  return tierOfModel(modelId) ?? fallback;
}
