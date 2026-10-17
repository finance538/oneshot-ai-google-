export const assistantPolicyTargets = ['paymentsEnabled', 'requestsEnabled', 'openLinksEnabled', 'aiEnabled', 'gateways.paytabs', 'gateways.telr', 'methods.hosted', 'methods.framed', 'methods.mobile', 'methods.mada_applepay', 'methods.samsung_pay', 'methods.managed', 'methods.own', 'methods.paylink', 'methods.invoice', 'methods.recurring'] as const;
export type AssistantPolicyTarget = typeof assistantPolicyTargets[number];

export const assistantModels = [
  { id: 'ollama-cloud', name: 'Ollama Cloud', provider: 'ollama', type: 'cloud' },
  { id: 'claude-haiku-4-5', name: 'Claude 4.5 Haiku (سريع واقتصادي)', provider: 'anthropic', type: 'cloud' },
  { id: 'claude-sonnet-4-5', name: 'Claude 4.5 Sonnet (تفكير وتحليل عميق)', provider: 'anthropic', type: 'cloud' },
  { id: 'hermes-3-vps', name: 'Hermes 3 / Open Autonomous Agent (مستقل - VPS)', provider: 'vps-core', type: 'vps' },
] as const;

export type AssistantModelId = typeof assistantModels[number]['id'];

export interface VpsAgentStatus {
  connected: boolean;
  endpoint?: string;
  version?: string;
  browserAutomation: boolean;
  emailWorker: boolean;
  cronScheduler: boolean;
  mediaEngine: boolean;
}

export type AssistantAction =
  | { type: 'set_policy'; target: AssistantPolicyTarget; enabled: boolean }
  | { type: 'set_link'; id: string; enabled: boolean }
  | { type: 'set_gateway_request'; id: string; status: 'configured' | 'rejected' | 'pending' }
  | { type: 'cancel_document'; id: string }
  | { type: 'cancel_subscription'; id: string };

export interface AssistantProposal {
  id: string;
  action: AssistantAction;
  previous: Record<string, unknown>;
  expiresAt: string;
}

export const assistantActionNames: Record<AssistantAction['type'], string> = {
  set_policy: 'تعديل إعداد المنصة', set_link: 'تغيير حالة الرابط المفتوح', set_gateway_request: 'تحديث حالة طلب الربط', cancel_document: 'إلغاء طلب دفع معلّق', cancel_subscription: 'إيقاف تجديد الاشتراك',
};

export const assistantTargetNames: Record<AssistantPolicyTarget, string> = {
  paymentsEnabled: 'بدء عمليات الدفع', requestsEnabled: 'إنشاء طلبات الدفع', openLinksEnabled: 'الروابط المفتوحة', aiEnabled: 'مساعد تعبئة بيانات الدفع',
  'gateways.paytabs': 'بوابة PayTabs', 'gateways.telr': 'بوابة Telr', 'methods.hosted': 'الدفع المستضاف', 'methods.framed': 'الدفع داخل إطار', 'methods.mobile': 'الدفع عبر الجوال', 'methods.mada_applepay': 'مدى وApple Pay', 'methods.samsung_pay': 'سامسونج باي', 'methods.managed': 'Managed Form', 'methods.own': 'Own Form', 'methods.paylink': 'PayLinks', 'methods.invoice': 'الفواتير', 'methods.recurring': 'الدفع المتكرر',
};

export function assistantActionDescription(action: AssistantAction) {
  if (action.type === 'set_policy') return `${assistantTargetNames[action.target]}: ${action.enabled ? 'تفعيل' : 'إيقاف'}`;
  if (action.type === 'set_link') return `${action.enabled ? 'تفعيل' : 'إيقاف'} الرابط ${action.id}`;
  if (action.type === 'set_gateway_request') return `طلب الربط ${action.id}: ${action.status === 'configured' ? 'تم الإعداد (حالة يدوية فقط)' : action.status === 'rejected' ? 'مرفوض' : 'معلّق'}`;
  return `${assistantActionNames[action.type]}: ${action.id}`;
}

export function parseAssistantAction(value: unknown): AssistantAction {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('إجراء غير صالح.');
  const input = value as Record<string, unknown>;
  if (input.type === 'set_policy') {
    if (!assistantPolicyTargets.includes(input.target as AssistantPolicyTarget) || typeof input.enabled !== 'boolean') throw new Error('إعداد غير صالح.');
    return { type: 'set_policy', target: input.target as AssistantPolicyTarget, enabled: input.enabled };
  }
  if (typeof input.id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.id)) throw new Error('معرّف غير صالح.');
  if (input.type === 'set_link' && typeof input.enabled === 'boolean') return { type: 'set_link', id: input.id, enabled: input.enabled };
  if (input.type === 'set_gateway_request' && ['configured', 'rejected', 'pending'].includes(String(input.status))) return { type: 'set_gateway_request', id: input.id, status: input.status as 'configured' | 'rejected' | 'pending' };
  if (input.type === 'cancel_document' || input.type === 'cancel_subscription') return { type: input.type, id: input.id };
  throw new Error('هذا الإجراء غير مدعوم.');
}

export function assertAssistantText(value: string) {
  const normalized = value.normalize('NFKC').replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776));
  const withoutIds = normalized.replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, 'record');
  if (/(?:\d[ -]?){13,19}|\b[a-z0-9_+/=-]{32,}\b|\b(?:sk|pk|rk)[-_][a-z0-9_-]{12,}|\beyJ[a-z0-9_-]{15,}|\b(?:bearer|password|secret|token|api[ _-]?key|server[ _-]?key|client[ _-]?key|auth[ _-]?key|cvv|cvc)\s*[:=]\s*\S+|(?:كلمة المرور|مفتاح المصادقة|مفتاح الخادم|رمز الأمان)\s*[:=]\s*\S+/i.test(withoutIds)) throw new Error('لا ترسل مفاتيح الدفع أو كلمات المرور أو رموز الدخول أو بيانات البطاقة إلى المساعد.');
}
