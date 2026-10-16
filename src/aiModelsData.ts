import {
  aiTiers, tierModels, tierOrder, routeTier, isAiTierId, defaultModelFor,
  type AiTierId, type TierText,
} from '../shared/ai-tiers';

export { aiTiers, tierModels } from '../shared/ai-tiers';
export type { AiTierId } from '../shared/ai-tiers';

// Compatibility view for legacy consumers; all model and tier data comes from the shared catalog.
export interface OllamaModelDefinition {
  id: string;
  name: string;
  tier: AiTierId;
  description: Record<string, string>;
  contextWindow: number;
  isAbliterated?: boolean;
}

function localized(value: TierText): Record<string, string> {
  return { ...value, zh: value.en, ru: value.en, fr: value.en };
}

export const AI_TIERS = Object.fromEntries(tierOrder.map(id => {
  const tier = aiTiers[id];
  return [id, {
    ...tier,
    title: localized(tier.label),
    subtitle: localized(tier.summary),
    accentColor: tier.accent,
    requiresAdminUnlock: tier.requiresGrant,
    models: tierModels[id].map(model => ({
      id: model.id, name: model.label.en, tier: model.tier,
      description: localized(model.note), contextWindow: model.contextWindow,
      isAbliterated: model.abliterated,
    })),
  }];
})) as Record<AiTierId, typeof aiTiers[AiTierId] & {
  title: Record<string, string>;
  subtitle: Record<string, string>;
  accentColor: string;
  requiresAdminUnlock: boolean;
  models: OllamaModelDefinition[];
}>;

export const ALL_OLLAMA_MODELS = tierOrder.flatMap(tier => AI_TIERS[tier].models);
export interface OllamaServerConfig {
  host: string;
  isTierXUnlocked: boolean;
  unlockedAt?: string;
  activeTier: AiTierId | 'auto';
  selectedModelId: string;
  isAutoRouterEnabled: boolean;
}
export const OLLAMA_CONFIG_KEY = 'oneshot_ollama_server_config';

function normalizeConfig(parsed: Partial<OllamaServerConfig>): OllamaServerConfig {
  const activeTier = isAiTierId(parsed.activeTier) ? parsed.activeTier : 'auto';
  const candidates = activeTier === 'auto' ? ALL_OLLAMA_MODELS : AI_TIERS[activeTier].models;
  return {
    host: typeof parsed.host === 'string' ? parsed.host : 'http://localhost:11434',
    // Local preferences never grant access; the server license is authoritative.
    isTierXUnlocked: false,
    activeTier,
    selectedModelId: candidates.some(model => model.id === parsed.selectedModelId)
      ? parsed.selectedModelId! : defaultModelFor(activeTier === 'auto' ? 'tier-3' : activeTier),
    isAutoRouterEnabled: parsed.isAutoRouterEnabled !== false,
  };
}

export function getSavedOllamaConfig(): OllamaServerConfig {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(OLLAMA_CONFIG_KEY) || '{}');
    const config = normalizeConfig(parsed && typeof parsed === 'object' ? parsed : {});
    // Strip legacy credentials and local unlock flags when upgrading existing browsers.
    saveOllamaConfig(config);
    return config;
  } catch { return normalizeConfig({}); }
}

export function saveOllamaConfig(config: OllamaServerConfig) {
  try { localStorage.setItem(OLLAMA_CONFIG_KEY, JSON.stringify(normalizeConfig(config))); }
  catch { /* Preferences are optional when browser storage is unavailable. */ }
}

export interface RouteDecision {
  tierId: AiTierId;
  model: OllamaModelDefinition;
  reason: Record<string, string>;
  confidence: number;
}

export function autoRouteQuery(prompt: string, tierXUnlocked: boolean): RouteDecision {
  // Preview for the admin assistant; the API independently verifies the account's license.
  const decision = routeTier(prompt, { licenseTier: 'tier-3', tierX: tierXUnlocked });
  return {
    tierId: decision.tier,
    model: AI_TIERS[decision.tier].models.find(model => model.id === decision.modelId)!,
    reason: localized(decision.reason),
    confidence: decision.confidence,
  };
}
