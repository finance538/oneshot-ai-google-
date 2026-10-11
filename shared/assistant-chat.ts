import { assertAssistantText } from './admin-assistant.js';

export interface ChatTurn { role: 'user' | 'assistant'; content: string }
export interface OllamaCloudState { configured: boolean; models: string[]; defaultModel: string; error?: string }

export function parseChatHistory(value: unknown): ChatTurn[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20 || value.length % 2 !== 0) throw new Error('سياق المحادثة غير صالح. ابدأ محادثة جديدة.');
  let total = 0;
  return value.map((turn: unknown, index) => {
    if (!turn || typeof turn !== 'object') throw new Error('سياق المحادثة غير صالح.');
    const entry = turn as Record<string, unknown>;
    const role = index % 2 === 0 ? 'user' : 'assistant';
    if (entry.role !== role || typeof entry.content !== 'string' || !entry.content.trim() || entry.content.length > (role === 'user' ? 2000 : 6000)) throw new Error('سياق المحادثة غير صالح.');
    total += entry.content.length;
    if (total > 40000) throw new Error('المحادثة طويلة. ابدأ محادثة جديدة.');
    assertAssistantText(entry.content);
    return { role, content: entry.content };
  });
}

export function anthropicGatewayBaseURL(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const baseURL = value.replace(/\/+$/, '');
  return baseURL.endsWith('/v1') ? baseURL : `${baseURL}/v1`;
}
