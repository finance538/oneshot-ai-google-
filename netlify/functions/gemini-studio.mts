import { GoogleGenAI, type Content, type GenerateContentConfig } from '@google/genai';
import { failure, HttpError, jsonBody, owner, reply, sameOrigin, throttle } from '../lib/platform.js';
import { localOllamaModelIds } from '../../shared/admin-assistant.js';
import type { ChatTurn } from '../../shared/assistant-chat.js';
import { chatWithLocalOllama } from '../lib/ollama.js';

const systemPersonas: Record<string, string> = {
  coo_operations: 'أنت مدير التشغيل وضمان سلاسل التسليم (COO) لمنصة OneShot. مهمتك متابعة مسارات تسليم الخدمات، مراقبة مؤشرات جودة المخرجات SLA، وضمان رضا عملاء ونشوت.',
  studio_director: `أنت المستشار التنفيذي والمدير الإبداعي لاستوديو OneShot (Brand Studio) في المملكة العربية السعودية.
خدمات OneShot الأساسية:
1. تصوير المنتجات الإعلاني (PHT-01): 1,450 ريال سعودي (تصوير استوديو احترافي مع معالجة ألوان سينمائية).
2. إنتاج ريلز وفيديو تجاري 4K (MED-01): 2,200 ريال سعودي (5 مقاطع فيديو موجهة لمنصات TikTok و Instagram).
3. تغطية الفعاليات والمؤتمرات الميدانية الشاملة (PHT-03): 4,800 ريال سعودي.
4. تصميم وبناء الهوية التجارية الكاملة (BRD-01): من 3,850 إلى 5,500 ريال سعودي.
مهمتك: تقديم نصائح واستشارات دقيقة وعملية حول الإنتاج والتسعير واللوجستيات لعملاء واستوديوهات المملكة ودول الخليج. أجب بلغة عربية سعودية احترافية ودقيقة.`,

  gateway_architect: `أنت كبير مهندسي بوابات الدفع والحلول المالية (FinTech Architect) لمنصة OneShot.
منظومة الدفع تدعم:
- بوابات الدفع: PayTabs، Telr (Store 35574)، Tap Payments، و N-Genius.
- وسائل الدفع المعتمدة: بطاقات مدى (Mada)، Apple Pay، Samsung Pay، والبطاقات الائتمانية الدولية (Visa / MasterCard).
- خيارات التكامل: صفحات الدفع المستضافة (Hosted Checkout)، الإطارات المضمنة (Framed Iframe)، روابط الدفع الفورية (Open Links)، والمحفظة الرقمية (Customer Wallet).
مهمتك: تقديم استشارات هندسية ومعايير أمان مصرفية 3D-Secure وحل مشكلات الربط والـ Webhooks وتكوين المعاملات. أجب بلغة عربية فنية دقيقة ومنظمة.`,

  campaign_strategist: `أنت خبير الترويج والحملات التسويقية ونمو العلامات التجارية لمنصة استوديو OneShot.
مهمتك: مساعدة التجار والمسوقين في صياغة حملات تسويقية جذابة، وصياغة خطط نمو تعتمد على الفيديو القصير، وتحسين معدلات التحويل (Conversion Rate)، واستراتيجيات جذب العملاء لروابط الدفع. أجب بصياغة ملهمة ومباشرة مع خطط قابلة للتنفيذ.`
};

const modelMapping: Record<string, string> = {
  'gemini-3.5-transcribe': 'gemini-2.5-flash',
  'gemini-3.8-flash': 'gemini-2.5-flash',
  'gemini-3.1-flash-lite': 'gemini-2.5-flash-lite',
  'gemini-4-argon': 'gemini-2.5-pro',
};

function inlineData(data: unknown, mime: unknown, kind: 'audio' | 'image') {
  const mimeType = typeof mime === 'string' ? mime.split(';')[0].trim() : '';
  const allowed = kind === 'audio'
    ? ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/aac', 'audio/flac']
    : ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowed.includes(mimeType) || typeof data !== 'string' || !data.length || data.length > 5_500_000
    || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw new HttpError(400, 'المرفق غير صالح أو أكبر من الحد المسموح.');
  }
  return { data, mimeType };
}

export default async (req: Request): Promise<Response> => {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'طريقة الطلب غير مدعومة.');
    sameOrigin(req);
    const user = await owner();
    await throttle(`gemini-studio:${user.id}`, 30);
    // Only this media endpoint accepts large bodies; payment endpoints keep the 16 KB default.
    const body = await jsonBody(req, 6_000_000);
    const action = body.action ?? 'chat';

    if (action === 'transcribe') {
      const audio = inlineData(body.audio, body.mimeType ?? 'audio/webm', 'audio');
      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: modelMapping['gemini-3.5-transcribe'],
        contents: { parts: [
          { inlineData: audio },
          { text: 'Transcribe this spoken audio accurately. Output the exact transcribed text in natural Arabic with proper punctuation. Do not add conversational commentary.' },
        ] },
      });
      if (!response.text?.trim()) throw new HttpError(502, 'لم يتم التعرف على كلام واضح في التسجيل.');
      return reply({ transcript: response.text });
    }
    if (action !== 'chat') throw new HttpError(400, 'الإجراء غير مدعوم.');
    if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 12000) {
      throw new HttpError(400, 'الرسالة مطلوبة ويجب ألا تتجاوز 12000 حرف.');
    }
    const selectedModel = body.model ?? 'gemini-3.8-flash';
    const isLocalModel = typeof selectedModel === 'string' && localOllamaModelIds.includes(selectedModel);
    if (typeof selectedModel !== 'string' || (!isLocalModel && (!Object.hasOwn(modelMapping, selectedModel) || selectedModel === 'gemini-3.5-transcribe'))) {
      throw new HttpError(400, 'النموذج المحدد غير مدعوم.');
    }
    const persona = body.persona ?? 'studio_director';
    if (typeof persona !== 'string' || !Object.hasOwn(systemPersonas, persona)) {
      throw new HttpError(400, 'المستشار المحدد غير مدعوم.');
    }
    if (body.history !== undefined && !Array.isArray(body.history)) throw new HttpError(400, 'سجل المحادثة غير صالح.');
    const contents: Content[] = [];
    const chatTurns: ChatTurn[] = [];
    for (const turn of (Array.isArray(body.history) ? body.history.slice(-8) : [])) {
      if (!turn || (turn.role !== 'user' && turn.role !== 'model') || typeof turn.content !== 'string' || turn.content.length > 12000) {
        throw new HttpError(400, 'سجل المحادثة غير صالح.');
      }
      contents.push({ role: turn.role, parts: [{ text: turn.content }] });
      chatTurns.push({ role: turn.role === 'model' ? 'assistant' : 'user', content: turn.content });
    }
    const current: Content = { role: 'user', parts: [{ text: body.message.trim() }] };
    if (body.image !== undefined) {
      if (typeof body.image !== 'string') throw new HttpError(400, 'الصورة غير صالحة.');
      const match = body.image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (!match) throw new HttpError(400, 'الصورة غير صالحة.');
      current.parts!.push({ inlineData: inlineData(match[2], match[1], 'image') });
    }
    contents.push(current);
    const localSystemPrompt = systemPersonas[persona] + '\nلا تدّع تنفيذ دفعات أو تغيير أرصدة أو إكمال مهام فعلية. قدّم المشورة فقط، ولا تختلق مؤشرات غير متاحة.';
    if (isLocalModel) {
      const { answer, routedTo } = await chatWithLocalOllama(selectedModel, chatTurns, body.message.trim(), localSystemPrompt);
      return reply({ answer, modelUsed: routedTo, groundingSources: [] });
    }
    const config: GenerateContentConfig = {
      systemInstruction: systemPersonas[persona] + '\nلا تدّع تنفيذ دفعات أو تغيير أرصدة أو إكمال مهام فعلية. قدّم المشورة فقط، ولا تختلق مؤشرات غير متاحة.',
      maxOutputTokens: 4096,
    };
    if (body.enableMapsGrounding === true) config.tools = [{ googleMaps: {} }];
    else if (body.enableSearchGrounding === true) config.tools = [{ googleSearch: {} }];
    const ai = new GoogleGenAI({});
    const model = modelMapping[selectedModel];
    const response = await ai.models.generateContent({ model, contents, config });
    if (!response.text?.trim()) throw new HttpError(502, 'تعذر استلام رد من النموذج. حاول مجدداً.');
    const groundingSources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [])
      .map(chunk => chunk.web?.title || chunk.web?.uri)
      .filter((value): value is string => Boolean(value)).slice(0, 5);
    return reply({ answer: response.text, modelUsed: model, groundingSources });
  } catch (error) {
    // Provider errors may contain request details; never return or log raw SDK errors.
    return failure(error);
  }
};
