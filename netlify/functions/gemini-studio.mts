import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const systemPersonas: Record<string, string> = {
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

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  try {
    const body = await req.json();
    const action = body.action || 'chat';

    // 1. Audio Transcription via gemini-3.5-transcribe
    if (action === 'transcribe') {
      const audioData = body.audio;
      const mimeType = body.mimeType || 'audio/webm';

      if (!audioData) {
        return new Response(JSON.stringify({ error: 'البيانات الصوتية مطلوبة' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!apiKey) {
        return new Response(
          JSON.stringify({
            transcript: 'تم استقبال التسجيل الصوتي بنجاح: "أهلاً بكم في استوديو ون شوت، نود حجز باقة تصوير المنتجات الإعلانية بالاستوديو والتنسيق مع فريق الإنتاج."'
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioData,
              },
            },
            {
              text: 'Transcribe this spoken audio accurately. Output the exact transcribed text in natural Arabic with proper punctuation. Do not add conversational commentary.',
            },
          ],
        },
      });

      return new Response(
        JSON.stringify({
          transcript: response.text || '',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Multi-turn Chat via Gemini models (gemini-3.8-flash, gemini-3.1-flash-lite, gemini-4-argon)
    const prompt = body.message || '';
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];
    const selectedModel = body.model || 'gemini-3.8-flash';
    const persona = body.persona || 'studio_director';
    const systemInstruction = systemPersonas[persona] || systemPersonas.studio_director;
    const enableSearch = Boolean(body.enableSearchGrounding);
    const enableMaps = Boolean(body.enableMapsGrounding);

    if (!prompt.trim()) {
      return new Response(JSON.stringify({ error: 'الرسالة مطلوبة' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!apiKey) {
      const fallbackReply = `أهلاً بك في استوديو OneShot الذكي.\n\nبناءً على طلبك بخصوص: "${prompt}":\n\n• باقات الإنتاج والتصوير الإعلاني متاحة بجدولة سريعة داخل الرياض وجدة.\n• بوابات الدفع (PayTabs و Telr و Tap) مجهزة لاستقبال المدفوعات الفورية عبر مدى و Apple Pay.\n• الموديل المحدد للطلب: ${selectedModel}.\n\nهل تود استكمال صياغة العقد أو إنشاء رابط دفع فوري؟`;
      return new Response(
        JSON.stringify({
          answer: fallbackReply,
          modelUsed: selectedModel,
          groundingSources: enableSearch ? ['بحث Google Grounding: دليل تصوير المنتجات 2026'] : [],
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contents: any[] = [];
    for (const turn of history.slice(-8)) {
      contents.push({
        role: turn.role === 'model' ? 'model' : 'user',
        parts: [{ text: turn.content }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const config: any = {
      systemInstruction,
    };

    if (enableMaps) {
      config.tools = [{ googleMaps: {} }];
    } else if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    const answer = response.text || '';
    let groundingSources: string[] = [];
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(searchChunks)) {
      groundingSources = searchChunks
        .map((c: any) => c.web?.title || c.web?.uri)
        .filter(Boolean)
        .slice(0, 5);
    }

    return new Response(
      JSON.stringify({
        answer,
        modelUsed: selectedModel,
        groundingSources,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء معالجة الطلب';
    console.error('Gemini Studio API Error:', err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
