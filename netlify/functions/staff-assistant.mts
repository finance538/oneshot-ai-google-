import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { assertAssistantText } from '../../shared/admin-assistant.js';
import { anthropicGatewayBaseURL, parseChatHistory } from '../../shared/assistant-chat.js';
import { findStaff, staffRoster, staffSystemPrompt } from '../../shared/staff-roster.js';
import { chatWithOllama, readOllamaCloud } from '../lib/ollama.js';
import { settings } from '../lib/policy.js';
import { failure, HttpError, jsonBody, owner, reply, sameOrigin, text, throttle } from '../lib/platform.js';

/**
 * Merchant-facing AI staff chat.
 *
 * Every hired AI staff member answers through a real model call with the
 * persona from the shared roster — there is no canned reply path. The
 * conversation is stateless on the server: the browser sends the prior
 * turns back, exactly like the platform assistant.
 */

const modelIds = ['claude-haiku-4-5', 'claude-sonnet-4-5', 'ollama-cloud', 'hermes-3-vps'] as const;
type ModelId = typeof modelIds[number];

// Gateway address. ONESHOT_VPS_AGENT_URL may still hold a legacy plaintext
// http://<vps-ip>:8790 value: that port is now bound to localhost only and TLS is
// terminated by traefik, so only an https:// value is honoured and anything else
// falls back to the TLS endpoint below.
const GATEWAY_FALLBACK = 'https://gw.187-7-65-45.sslip.io';
function gatewayUrl(): string {
  const raw = (process.env.ONESHOT_VPS_AGENT_URL_TLS || process.env.ONESHOT_VPS_AGENT_URL || '').trim();
  const base = /^https:\/\//i.test(raw) ? raw : GATEWAY_FALLBACK;
  return base.replace(/\/+$/, '');
}

async function availableModels() {
  const ollama = await readOllamaCloud();
  const available: ModelId[] = [];
  // Server gateway first: it is the free, self-hosted path (local Ollama on the VPS)
  // and the merchant-facing default unless the user picks another model in the UI.
  if (gatewayUrl()) available.push('hermes-3-vps');
  if (ollama.configured && !ollama.error) available.push('ollama-cloud');
  if (process.env.ANTHROPIC_API_KEY) available.push('claude-haiku-4-5', 'claude-sonnet-4-5');
  return {
    available,
    ollama: { configured: ollama.configured, defaultModel: ollama.defaultModel, models: ollama.models.slice(0, 40), error: ollama.error },
  };
}

export default async (req: Request) => {
  try {
    const user = await owner();
    if (req.method === 'GET') return reply({ staff: staffRoster.map(member => ({ id: member.id, name: member.name, arabicRole: member.arabicRole })), ...(await availableModels()) });
    if (req.method !== 'POST') return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    sameOrigin(req);
    const { policy } = await settings();
    if (!policy.aiEnabled) throw new HttpError(409, 'الذكاء الاصطناعي متوقف بواسطة مسؤول المنصة.');
    const body = await jsonBody(req);
    if (body.consent !== true) throw new HttpError(400, 'الموافقة على استخدام الذكاء الاصطناعي مطلوبة.');
    const member = findStaff(body.staffId);
    if (!member) throw new HttpError(400, 'اختر موظفاً من طاقم ونشوت.');
    let history;
    try { history = parseChatHistory(body.history); }
    catch (error) { throw new HttpError(400, error instanceof Error ? error.message : 'سياق المحادثة غير صالح.'); }
    const prompt = text(body.prompt, 2000);
    if (!prompt.trim()) throw new HttpError(400, 'اكتب رسالتك أولاً.');
    try { assertAssistantText(prompt); }
    catch { throw new HttpError(400, 'لا ترسل المفاتيح أو كلمات المرور أو بيانات البطاقة في المحادثة.'); }
    await throttle(`staff-assistant:${user.id}`, 30);
    await throttle('staff-assistant:platform', 150);
    const { available } = await availableModels();
    const requested = typeof body.modelId === 'string' && (modelIds as readonly string[]).includes(body.modelId) ? body.modelId as ModelId : undefined;
    const requestedModel: ModelId = (requested && available.includes(requested) ? requested : available[0]) ?? 'hermes-3-vps';
    if (!available.length) throw new HttpError(503, 'لا يوجد نموذج مفعّل للموظفين حالياً. أضف بوابة السيرفر (ONESHOT_VPS_AGENT_URL) أو ANTHROPIC_API_KEY في متغيرات بيئة Netlify ثم أعد النشر.');
    const system = staffSystemPrompt(member);

    if (requestedModel === 'ollama-cloud') {
      const result = await chatWithOllama(body.ollamaModel, history, prompt, system);
      return reply({ ...result, staffId: member.id, staffName: member.name });
    }

    if (requestedModel === 'hermes-3-vps') {
      const base = gatewayUrl();
      if (!base) throw new HttpError(503, 'بوابة السيرفر غير مضبوطة. أضف ONESHOT_VPS_AGENT_URL في متغيرات بيئة Netlify ثم أعد النشر.');
      const token = process.env.ONESHOT_VPS_AGENT_TOKEN;
      try {
        const vpsRes = await fetch(`${base}/api/agent/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ system, prompt, history, staff: member.id }),
          signal: AbortSignal.timeout(60000),
        });
        if (vpsRes.ok) {
          const vpsData = await vpsRes.json() as { answer?: unknown; model?: unknown };
          if (typeof vpsData.answer === 'string' && vpsData.answer.trim()) {
            const safeAnswer = vpsData.answer.slice(0, 6000);
            try { assertAssistantText(safeAnswer); }
            catch { throw new HttpError(502, 'تم حجب إجابة قد تحتوي على بيانات حساسة.'); }
            return reply({
              answer: safeAnswer,
              routedTo: 'hermes-3-vps',
              model: typeof vpsData.model === 'string' ? vpsData.model : undefined,
              staffId: member.id,
              staffName: member.name,
            });
          }
        } else if (vpsRes.status === 401) {
          throw new HttpError(502, 'بوابة السيرفر رفضت الطلب (مفتاح غير مطابق). حدّث ONESHOT_VPS_AGENT_TOKEN.');
        }
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(504, 'تأخر الاتصال بنموذج السيرفر. حاول مجدداً.');
      }
      throw new HttpError(502, 'لم يُرجع نموذج السيرفر إجابة. حاول مجدداً.');
    }

    if (!process.env.ANTHROPIC_API_KEY) throw new HttpError(503, 'لا يوجد نموذج مفعّل للموظفين حالياً. أضف ANTHROPIC_API_KEY أو OLLAMA_API_KEY في متغيرات بيئة Netlify ثم أعد النشر.');
    const anthropicModel = requestedModel === 'claude-sonnet-4-5' ? 'claude-sonnet-4-5' : 'claude-haiku-4-5';
    const { text: answer } = await generateText({
      model: createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: anthropicGatewayBaseURL(process.env.ANTHROPIC_BASE_URL) } : {}),
      })(anthropicModel),
      system,
      messages: [...history, { role: 'user', content: prompt }],
      maxOutputTokens: 1500,
      maxRetries: 0,
      timeout: 40000,
    });
    const safeAnswer = answer.slice(0, 6000);
    if (!safeAnswer.trim()) throw new HttpError(502, 'تعذر الحصول على إجابة. أعد صياغة الطلب.');
    try { assertAssistantText(safeAnswer); }
    catch { throw new HttpError(502, 'تم حجب إجابة قد تحتوي على بيانات حساسة.'); }
    return reply({ answer: safeAnswer, routedTo: anthropicModel, staffId: member.id, staffName: member.name });
  } catch (error) { return failure(error); }
};
