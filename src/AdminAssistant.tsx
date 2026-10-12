import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowUp, ArrowUpLeft, Bot, Check, Clock3, LoaderCircle, Plus, RefreshCw,
  ShieldCheck, Sparkles, X, Download, Mic, MicOff, Image, Volume2, VolumeX,
  Copy, Calculator, Maximize2, Paperclip, Wrench, BarChart3,
  BrainCircuit, Flame, Compass, Zap, Cpu
} from 'lucide-react';
import { assistantActionDescription, assistantModels, assertAssistantText, type AssistantAction, type AssistantModelId, type AssistantProposal, type VpsAgentStatus } from '../shared/admin-assistant';
import { api, date } from './platform';
import type { OllamaCloudState } from '../shared/assistant-chat';
import PaymentFailuresDashboard from './PaymentFailuresDashboard';
import AiTierManager from './AiTierManager';
import {
  getSavedOllamaConfig,
  saveOllamaConfig,
  autoRouteQuery,
  AI_TIERS,
  type OllamaServerConfig
} from './aiModelsData';
import './AdminAssistant.css';

interface AuditEntry { id: string; action: AssistantAction; status: string; createdAt: string }
interface AssistantState { proposals: AssistantProposal[]; audit: AuditEntry[]; vpsStatus?: VpsAgentStatus; aiEnabled?: boolean; cloudAvailable?: boolean; ollama?: OllamaCloudState }
interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  image?: string;
  isVoice?: boolean;
  routedTo?: string;
  routingReason?: string;
  tierBadge?: string;
}
const suggestions = ['حلل لي أسباب رفض البطاقات لكل بوابة', 'لخّص حالة المدفوعات اليوم', 'ساعدني في كتابة رسالة لعميل', 'اشرح لي الفرق بين بوابات الدفع', 'اعرض طلبات الربط المعلّقة'];
const chatSuggestions = ['حلل لي أسباب رفض البطاقات لكل بوابة', 'ساعدني في كتابة رسالة لعميل', 'اشرح لي الفرق بين بوابات الدفع', 'اقترح أفكاراً لمحتوى علامتي', 'ساعدني في ترتيب مهام اليوم'];
const auditLabels: Record<string, string> = { pending: 'بانتظار التأكيد', executed: 'نُفّذ', rejected: 'رُفض', expired: 'انتهت الصلاحية' };

export default function AdminAssistant({ onRefresh, initialPrompt }: { onRefresh: () => Promise<void>; initialPrompt?: string }) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<AssistantModelId>('ollama-cloud');
  const [ollamaModel, setOllamaModel] = useState('');
  const [ollamaConfig, setOllamaConfig] = useState<OllamaServerConfig>(getSavedOllamaConfig);
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<AssistantState>({ proposals: [], audit: [] });
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [approved, setApproved] = useState<Record<string, boolean>>({});

  // Multimedia, Voice, Image & Tools states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'calc' | 'templates' | 'failures' | 'ai_tiers' | null>(null);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [calcAmount, setCalcAmount] = useState('5000');
  const [calcGateway, setCalcGateway] = useState<'telr' | 'paytabs'>('telr');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const sequence = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);

  const activeOllamaModel = ollamaModel || state.ollama?.defaultModel || '';
  const providerAvailable = selectedModel === 'ollama-cloud' ? Boolean(state.ollama?.configured && state.ollama.models.includes(activeOllamaModel)) : selectedModel === 'hermes-3-vps' ? Boolean(state.vpsStatus?.connected) : state.cloudAvailable === true;
  const available = state.aiEnabled !== false;

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setState(await api<AssistantState>('admin-assistant')); setError(''); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر تحميل سجل المساعد.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [messages, busy]);
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setMessage(initialPrompt);
      window.requestAnimationFrame(() => composer.current?.focus());
    }
  }, [initialPrompt]);

  // Voice recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsRecording(true);
        setRecordingSeconds(0);
        recordTimerRef.current = window.setInterval(() => setRecordingSeconds(s => s + 1), 1000);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = window.setInterval(() => setRecordingSeconds(s => s + 1), 1000);
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      };
    } catch {
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = window.setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    }
  };

  const stopRecording = (sendVoice = true) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);

    if (sendVoice) {
      const duration = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}`;
      const voiceText = `🎤 تسجيل صوتي من الإدارة (${duration})`;
      const userMsgId = sequence.current++;
      setMessages(curr => [...curr, { id: userMsgId, role: 'user', text: voiceText, isVoice: true }]);
      handleAssistantAnswer(voiceText);
    }
    setRecordingSeconds(0);
  };

  // Image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setAttachedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Export / Download transcript
  const downloadChat = () => {
    const header = `=== تقرير وسجل محادثة مساعد onshot الإداري ===\nالتاريخ: ${new Date().toLocaleString('ar-SA')}\nالنموذج: ${selectedModel}\n\n`;
    const body = messages.map(m => `[${m.role === 'user' ? 'المسؤول' : 'مساعد onshot'}]:\n${m.text}\n`).join('\n---\n\n');
    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `onshot-admin-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Text-to-speech
  const toggleSpeech = (id: number, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ar-SA';
      utter.rate = 1.0;
      utter.onend = () => setSpeakingId(null);
      utter.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utter);
      setSpeakingId(id);
    }
  };

  // Copy text
  const copyText = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAssistantAnswer = async (input: string, img?: string | null) => {
    setBusy(true);
    setError(''); setNotice('');
    const history = messages.slice(-10).map(item => ({ role: item.role, content: item.text }));

    // Run Auto-Router or get configured model
    const routeDecision = ollamaConfig.isAutoRouterEnabled
      ? autoRouteQuery(input, ollamaConfig.isTierXUnlocked)
      : {
          tierId: ollamaConfig.activeTier === 'auto' ? 'tier-3' : ollamaConfig.activeTier,
          model: AI_TIERS[ollamaConfig.activeTier === 'auto' ? 'tier-3' : ollamaConfig.activeTier].models.find(m => m.id === ollamaConfig.selectedModelId) || AI_TIERS['tier-3'].models[0],
          reason: { ar: 'تحديد يدوي بواسطة المسؤول' },
          confidence: 1.0,
        };

    const routedToLabel = `${routeDecision.model.name} (${AI_TIERS[routeDecision.tierId].badge})`;
    const routeReasonLabel = routeDecision.reason.ar;
    const tierBadgeLabel = AI_TIERS[routeDecision.tierId].badge;

    try {
      const result = await api<{ answer: string; proposal?: AssistantProposal; routedTo?: string }>('admin-assistant', {
        action: 'chat',
        message: input,
        history,
        consent: true,
        modelId: selectedModel,
        ...(selectedModel === 'ollama-cloud' ? { ollamaModel: activeOllamaModel || routeDecision.model.id } : {})
      });
      setMessages(curr => [...curr, {
        id: sequence.current++,
        role: 'assistant',
        text: result.answer,
        routedTo: result.routedTo || routedToLabel,
        routingReason: routeReasonLabel,
        tierBadge: tierBadgeLabel,
      }]);
      if (result.proposal) setState(curr => ({ ...curr, proposals: [result.proposal!, ...curr.proposals.filter(p => p.id !== result.proposal!.id)] }));
      if (result.proposal) await refresh();
    } catch (caught) {
      const detail = caught instanceof Error && caught.message ? caught.message : 'تعذر الوصول إلى مزوّد الذكاء الاصطناعي.';
      setError(detail);
      setMessages(curr => [...curr, {
        id: sequence.current++,
        role: 'assistant',
        text: `⚠️ لم يتم توليد رد حقيقي. ${detail}\nراجع إعدادات المزوّد (Netlify → Environment variables) أو أعد المحاولة. لن يعرض المساعد أي إجابة غير صادرة عن النموذج.`,
        routedTo: routedToLabel,
        routingReason: 'فشل الاتصال',
        tierBadge: tierBadgeLabel,
      }]);
    } finally {
      setBusy(false);
      window.requestAnimationFrame(() => composer.current?.focus());
    }
  };

  async function send(event: FormEvent) {
    event.preventDefault();
    if (busy || loading || (!message.trim() && !attachedImage)) return;
    setError(''); setNotice('');
    try { if (message.trim()) assertAssistantText(message.trim()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'لا ترسل بيانات حساسة.'); return; }
    
    const input = message.trim() || '📸 مرفق صورة من الإدارة للمراجعة';
    const currentImg = attachedImage;
    const userMessageId = sequence.current++;

    setMessages(current => [...current, { id: userMessageId, role: 'user', text: input, image: currentImg || undefined }]);
    setMessage('');
    setAttachedImage(null);

    await handleAssistantAnswer(input, currentImg);
  }

  async function resolve(id: string, action: 'confirm' | 'reject') {
    if (busy || (action === 'confirm' && !approved[id])) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await api('admin-assistant', { action, id, confirmation: action === 'confirm' });
      setApproved(current => ({ ...current, [id]: false }));
      setState(current => ({ ...current, proposals: current.proposals.filter(proposal => proposal.id !== id) }));
      setNotice(action === 'confirm' ? 'تم تنفيذ الإجراء وتسجيله. لم يتم تحصيل مبالغ أو استردادها.' : 'تم رفض الاقتراح دون تعديل بيانات المنصة.');
      await refresh();
      if (action === 'confirm') await onRefresh();
    } catch (caught) { await refresh(); setError(caught instanceof Error ? caught.message : 'تعذر معالجة الإجراء.'); }
    finally { setBusy(false); }
  }

  // Quick calculator logic
  const calcAmountNum = parseFloat(calcAmount) || 0;
  const calcFee = calcGateway === 'telr' ? calcAmountNum * 0.0269 : (calcAmountNum * 0.027 + 1.0);
  const calcNet = Math.max(0, calcAmountNum - calcFee);

  return <div className="onshot-assistant" dir="rtl">
    {!loading && !available && <div className="alert" role="status">الذكاء الاصطناعي متوقف في إعدادات المنصة. فعّله من إعدادات المسؤول للبدء.<button type="button" className="outline-button" disabled={busy} onClick={() => void refresh()}><RefreshCw size={14} />إعادة التحقق</button></div>}
      <section className="panel onshot-chat" aria-label="محادثة مساعد onshot">
        <div className="onshot-section-title">
          <div><Bot size={20} /><h2 dir="ltr">onshot Chat (Admin AI)</h2></div>
          <div className="onshot-model-picker">
            <select
              aria-label="اختيار نموذج الذكاء الاصطناعي"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value as AssistantModelId)}
              disabled={busy}
            >
              {assistantModels.map(m => (
                <option key={m.id} value={m.id} disabled={m.id === 'hermes-3-vps' && !state.vpsStatus?.connected}>
                  {m.name}
                </option>
              ))}
            </select>
            {selectedModel === 'ollama-cloud' && <select aria-label="اختيار نموذج Ollama Cloud" value={activeOllamaModel} disabled={busy || loading} onChange={event => setOllamaModel(event.target.value)}><option value="">اختر نموذج Cloud</option>{state.ollama?.models.map(model => <option key={model} value={model}>{model}</option>)}</select>}
            {selectedModel === 'ollama-cloud' && !state.ollama?.models?.length && (
              <small role="status" style={{ display: 'block', opacity: 0.75, marginTop: 4 }}>
                {loading ? 'جارٍ جلب قائمة النماذج من الخادم…' : (state.ollama?.error || 'لا توجد نماذج متاحة من المزوّد الآن.')}
              </small>
            )}
            
            {/* Download Transcript */}
            <button
              type="button"
              className="outline-button onshot-download-btn"
              onClick={downloadChat}
              title="تحميل وتنزيل سجل المحادثة كنص"
              disabled={!messages.length}
            >
              <Download size={15} /> تحميل المحادثة
            </button>

            {/* New Chat */}
            <button
              type="button"
              className="outline-button onshot-new-chat"
              disabled={busy}
              onClick={() => { setMessages([]); setMessage(''); setAttachedImage(null); setError(''); setNotice(''); composer.current?.focus(); }}
            >
              <Plus size={16} /> محادثة جديدة
            </button>
          </div>
        </div>

        {/* Quick In-Chat Tools Ribbon */}
        <div className="admin-chat-tools-ribbon">
          <button
            type="button"
            className={`admin-tool-pill ${activeTool === 'ai_tiers' ? 'active' : ''}`}
            style={{
              background: activeTool === 'ai_tiers' ? (ollamaConfig.isTierXUnlocked ? '#ea580c' : '#7c3aed') : undefined,
              color: activeTool === 'ai_tiers' ? '#ffffff' : undefined,
              borderColor: activeTool === 'ai_tiers' ? (ollamaConfig.isTierXUnlocked ? '#ea580c' : '#7c3aed') : undefined,
              fontWeight: '700'
            }}
            onClick={() => setActiveTool(activeTool === 'ai_tiers' ? null : 'ai_tiers')}
          >
            {ollamaConfig.isTierXUnlocked ? <Flame size={14} /> : <BrainCircuit size={14} />}
            <span>
              {ollamaConfig.isTierXUnlocked
                ? 'مستويات الـ AI · Tier X مفعّل 🔥'
                : 'مستويات الذكاء الاصطناعي (4 Tiers + Ollama)'}
            </span>
          </button>
          <button
            type="button"
            className={`admin-tool-pill ${activeTool === 'failures' ? 'active' : ''}`}
            onClick={() => setActiveTool(activeTool === 'failures' ? null : 'failures')}
          >
            <BarChart3 size={14} /> لوحة تحليل حالات الرفض (Failures AI)
          </button>
          <button
            type="button"
            className={`admin-tool-pill ${activeTool === 'calc' ? 'active' : ''}`}
            onClick={() => setActiveTool(activeTool === 'calc' ? null : 'calc')}
          >
            <Calculator size={14} /> حاسبة الرسوم والأرباح
          </button>
          <button
            type="button"
            className={`admin-tool-pill ${activeTool === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTool(activeTool === 'templates' ? null : 'templates')}
          >
            <Sparkles size={14} /> أوامر الإدارة السريعة
          </button>
          <button
            type="button"
            className="admin-tool-pill"
            onClick={downloadChat}
            disabled={!messages.length}
          >
            <Download size={14} /> تفريغ المحادثة (Export)
          </button>
        </div>

        {/* Collapsible 4-Tier AI Manager */}
        {activeTool === 'ai_tiers' && (
          <div className="admin-quick-tool-card" style={{ padding: 0, border: 'none', background: 'transparent' }}>
            <AiTierManager
              config={ollamaConfig}
              onConfigChange={(newCfg) => {
                setOllamaConfig(newCfg);
                saveOllamaConfig(newCfg);
              }}
              onClose={() => setActiveTool(null)}
            />
          </div>
        )}

        {/* Collapsible Payment Failures Dashboard inside Admin Assistant */}
        {activeTool === 'failures' && (
          <div className="admin-quick-tool-card admin-failures-tool-card">
            <div className="tool-card-head">
              <strong>📊 لوحة تحليل حالات الرفض وتصنيف الأسباب برمجياً (Failures AI)</strong>
              <button type="button" onClick={() => setActiveTool(null)}><X size={15} /></button>
            </div>
            <PaymentFailuresDashboard
              onConsultAi={(prompt) => {
                setActiveTool(null);
                setMessage(prompt);
                composer.current?.focus();
              }}
            />
          </div>
        )}

        {/* Collapsible Calculator */}
        {activeTool === 'calc' && (
          <div className="admin-quick-tool-card">
            <div className="tool-card-head">
              <strong>🧮 حاسبة رسوم بوابات الدفع للمسؤول</strong>
              <button type="button" onClick={() => setActiveTool(null)}><X size={15} /></button>
            </div>
            <div className="admin-tool-row">
              <label>المبلغ المراد تحصيله (SAR):</label>
              <input type="number" value={calcAmount} onChange={e => setCalcAmount(e.target.value)} />
              <label>البوابة:</label>
              <select value={calcGateway} onChange={e => setCalcGateway(e.target.value as 'telr' | 'paytabs')}>
                <option value="telr">Telr (2.69%)</option>
                <option value="paytabs">PayTabs (2.7% + 1 ريال)</option>
              </select>
            </div>
            <div className="admin-calc-summary">
              <span>الرسوم المستقطعة: <strong>{calcFee.toFixed(2)} ر.س</strong></span>
              <span>صافي أرباح التاجر: <strong style={{ color: '#f05b2b' }}>{calcNet.toFixed(2)} ر.س</strong></span>
            </div>
          </div>
        )}

        {/* Collapsible Prompt Templates */}
        {activeTool === 'templates' && (
          <div className="admin-quick-tool-card">
            <div className="tool-card-head">
              <strong>⚡ أوامر واستفسارات المسؤول السريعة</strong>
              <button type="button" onClick={() => setActiveTool(null)}><X size={15} /></button>
            </div>
            <div className="admin-templates-grid">
              {['هل توجد تنبيهات لزيادة مفاجئة في حالات الرفض للبوابات؟ وما هي الأسباب البرمجية؟', 'حلل لي أسباب رفض البطاقات لكل بوابة دفع واقترح حلولاً لرفع معدل القبول', 'حلل متوسط هوامش الربح لباقات الأتمتة', 'قارن أداء بوابات الدفع PayTabs مقابل Telr', 'صغ رسالة متابعة للعملاء ذوي الفواتير المفتوحة'].map((txt, i) => (
                <button
                  key={i}
                  type="button"
                  className="template-btn"
                  onClick={() => {
                    setMessage(txt);
                    setActiveTool(null);
                    composer.current?.focus();
                  }}
                >
                  {txt}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="onshot-working" role="status"><LoaderCircle size={16} />جارٍ التحقق من الاتصال وتحميل النماذج…</div>}
        
        <div className="onshot-messages" role="log" aria-live="polite" aria-relevant="additions" aria-busy={busy}>
          {!messages.length && <div className="onshot-empty"><div className="onshot-monogram" aria-hidden="true"><Sparkles size={28} /></div><span className="eyebrow">ONESHOT / CHAT</span><h3>كيف أقدر أساعدك؟</h3><p>اسأل، اكتب، أو ناقش أفكارك مع مساعد onshot الإداري الكامل.</p><div className="onshot-suggestions">{(selectedModel === 'ollama-cloud' ? chatSuggestions : suggestions).map(suggestion => <button key={suggestion} type="button" disabled={busy} onClick={() => { setMessage(suggestion); composer.current?.focus(); }}>{suggestion}<ArrowUpLeft size={15} /></button>)}</div></div>}
          
          {messages.map(item => (
            <article key={item.id} className={`onshot-message onshot-message-${item.role}`}>
              <div className="onshot-message-meta">
                <span>{item.role === 'user' ? 'المسؤول' : <><Bot size={15} />onshot Admin</>}</span>
                {item.tierBadge && <span className="onshot-tier-badge-pill">{item.tierBadge}</span>}
                {item.routedTo && <small className="onshot-model-tag">{item.routedTo}</small>}
              </div>

              {item.routingReason && (
                <div className="onshot-routing-reason-notice">
                  <Compass size={13} />
                  <span>{item.routingReason}</span>
                </div>
              )}

              {/* Attached Image with click-to-enlarge */}
              {item.image && (
                <div className="msg-img-container">
                  <img
                    src={item.image}
                    alt="صورة مرفقة"
                    className="msg-preview-img"
                    onClick={() => setEnlargedImage(item.image || null)}
                  />
                  <button
                    type="button"
                    className="msg-enlarge-badge"
                    onClick={() => setEnlargedImage(item.image || null)}
                  >
                    <Maximize2 size={13} /> تكبير وفحص الصورة
                  </button>
                </div>
              )}

              <p dir="auto">{item.text}</p>

              {/* In-Message Actions (Copy & Read aloud) */}
              {item.role === 'assistant' && (
                <div className="msg-action-bar">
                  <button
                    type="button"
                    className="msg-sub-btn"
                    onClick={() => copyText(item.id, item.text)}
                    title="نسخ الرد"
                  >
                    {copiedId === item.id ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    <span>{copiedId === item.id ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                  <button
                    type="button"
                    className={`msg-sub-btn ${speakingId === item.id ? 'active-speaking' : ''}`}
                    onClick={() => toggleSpeech(item.id, item.text)}
                    title="استماع صوتي للرد"
                  >
                    {speakingId === item.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{speakingId === item.id ? 'إيقاف' : 'استماع'}</span>
                  </button>
                </div>
              )}
            </article>
          ))}
          {busy && <div className="onshot-working" role="status"><LoaderCircle size={17} />onshot يكتب ويحلل…</div>}
          <div ref={end} />
        </div>

        {error && <div className="message error" role="alert">{error}<button className="outline-button" type="button" disabled={busy || loading} onClick={() => void refresh()}><RefreshCw size={14} />إعادة التحقق</button></div>}
        {notice && <div className="message success" role="status">{notice}</div>}

        {/* Selected Image Preview in Admin Composer */}
        {attachedImage && (
          <div className="admin-composer-img-preview">
            <div className="preview-wrap">
              <img src={attachedImage} alt="مرفق" onClick={() => setEnlargedImage(attachedImage)} />
              <button type="button" className="preview-close" onClick={() => setAttachedImage(null)}><X size={13} /></button>
            </div>
            <span>تم إرفاق صورة جاهزة للإرسال مع التوجيه</span>
          </div>
        )}

        {/* Recording Bar for Admin */}
        {isRecording ? (
          <div className="admin-rec-bar">
            <div className="admin-rec-indicator">
              <span className="admin-rec-dot" />
              <span>جارٍ تسجيل التوجيه الصوتي... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="admin-rec-actions">
              <button type="button" className="admin-rec-cancel" onClick={() => stopRecording(false)}>إلغاء</button>
              <button type="button" className="admin-rec-stop" onClick={() => stopRecording(true)}>
                <MicOff size={15} /> إرسال التسجيل
              </button>
            </div>
          </div>
        ) : (
          <form className="onshot-composer" onSubmit={event => void send(event)}>
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />

            <div className="onshot-input-wrap">
              {/* Attach Image button */}
              <button
                type="button"
                className="admin-composer-btn"
                onClick={() => fileInputRef.current?.click()}
                title="إرفاق صورة أو مستند"
                disabled={busy}
              >
                <Image size={19} />
              </button>

              {/* Record Audio button */}
              <button
                type="button"
                className="admin-composer-btn mic"
                onClick={startRecording}
                title="تسجيل أمر صوتي"
                disabled={busy}
              >
                <Mic size={19} />
              </button>

              <textarea
                ref={composer}
                id="onshot-prompt"
                aria-label="رسالتك إلى onshot"
                value={message}
                onChange={event => setMessage(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={2000}
                disabled={busy}
                placeholder="اكتب توجيهك للمساعد الذكي هنا أو أرفق صورة..."
                rows={2}
              />

              <button
                className="primary-button onshot-send"
                aria-label="إرسال الرسالة"
                disabled={busy || loading || (!message.trim() && !attachedImage)}
                type="submit"
              >
                {busy ? <LoaderCircle size={19} /> : <ArrowUp size={19} />}
              </button>
            </div>

            <label className="onshot-consent">
              <input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} />
              <span>أوافق على إرسال المحادثة والبيانات التشغيلية المنقّحة إلى مزوّد الذكاء الاصطناعي.</span>
            </label>
            <div className="onshot-compose-footer">
              <small>المحادثة مؤقتة ومحمية بتدقيق كامل. لا ترسل أسراراً أو بيانات بطاقات.</small>
              <small>Enter للإرسال · Shift + Enter لسطر جديد</small>
            </div>
          </form>
        )}
      </section>

    {/* Fullscreen Lightbox Modal for Admin */}
    {enlargedImage && (
      <div className="customer-lightbox-overlay" onClick={() => setEnlargedImage(null)} dir="rtl">
        <div className="lightbox-content" onClick={e => e.stopPropagation()}>
          <div className="lightbox-header">
            <span>فحص الصورة بالحجم الكامل</span>
            <div className="lightbox-btns">
              <a href={enlargedImage} download="onshot-admin-inspect.png" className="lightbox-download">
                <Download size={18} /> تحميل
              </a>
              <button type="button" onClick={() => setEnlargedImage(null)} className="lightbox-close">
                <X size={22} />
              </button>
            </div>
          </div>
          <div className="lightbox-image-container">
            <img src={enlargedImage} alt="عرض مكبر" />
          </div>
        </div>
      </div>
    )}

    {!!state.proposals.length && <section className="panel onshot-approvals" aria-label="مراجعة الإجراءات المقترحة">
      <div className="onshot-section-title"><div><ShieldCheck size={19} /><h2>بانتظار موافقتك</h2></div><button type="button" className="outline-button" disabled={busy || loading} onClick={() => void refresh()}><RefreshCw size={15} />تحديث</button></div>
      <p>كل اقتراح مرتبط بحسابك، صالح لعشر دقائق، ويُنفّذ مرة واحدة فقط. إذا تغيرت البيانات، يُمنع التنفيذ حتى تراجع اقتراحاً جديداً.</p>
      {loading && <p role="status">جارٍ تحميل الموافقات…</p>}
      {!loading && !state.proposals.length && <div className="onshot-no-proposals"><ShieldCheck size={22} /><span>لا توجد تعديلات بانتظار الموافقة.</span></div>}
      {state.proposals.map(proposal => <article key={proposal.id} className="onshot-proposal"><h3>{assistantActionDescription(proposal.action)}</h3><span className="onshot-expiry"><Clock3 size={14} />تنتهي: {new Date(proposal.expiresAt).toLocaleTimeString('ar-SA')}</span><details><summary>الحالة السابقة التي بُني عليها الاقتراح</summary><pre dir="ltr">{JSON.stringify(proposal.previous, null, 2)}</pre></details>{proposal.action.type === 'cancel_subscription' || proposal.action.type === 'cancel_document' ? <p className="onshot-warning">الإلغاء لا يسترد المدفوعات ولا يوقف عملية تحصيل بدأت بالفعل.</p> : proposal.action.type === 'set_gateway_request' ? <p className="onshot-warning">هذا يغيّر حالة الطلب فقط؛ لا يضيف المفاتيح ولا يفعّل الاتصال بالبوابة.</p> : null}<label className="onshot-consent"><input type="checkbox" checked={!!approved[proposal.id]} disabled={busy} onChange={event => setApproved(current => ({ ...current, [proposal.id]: event.target.checked }))} /><span>راجعت الإجراء وأثره وأوافق على تنفيذه على المنصة.</span></label><div className="onshot-proposal-actions"><button type="button" className="primary-button" disabled={busy || !approved[proposal.id] || new Date(proposal.expiresAt).getTime() <= Date.now()} onClick={() => void resolve(proposal.id, 'confirm')}><Check size={16} />تأكيد وتنفيذ</button><button type="button" className="outline-button" disabled={busy} onClick={() => void resolve(proposal.id, 'reject')}><X size={16} />رفض</button></div></article>)}
    </section>}
    <details className="panel onshot-audit"><summary><ShieldCheck size={17} />الأمان وسجل الإجراءات</summary><p>أي تعديل على المنصة يحتاج مراجعتك وتأكيدك بشكل منفصل. لا تُحفظ نصوص المحادثة في سجل الإجراءات.</p><div className="onshot-section-title"><div><Clock3 size={18} /><h2>سجل إجراءات حسابك</h2></div><button type="button" className="outline-button" disabled={busy || loading} onClick={() => void refresh()}><RefreshCw size={15} />تحديث</button></div>{!state.audit.length ? <p>لا توجد إجراءات مسجّلة.</p> : <ul>{state.audit.map(entry => <li key={entry.id}><div><strong>{assistantActionDescription(entry.action)}</strong><small>{date(entry.createdAt)}</small></div><span className={`status-badge ${entry.status === 'executed' ? 'status-active' : 'status-pending'}`}>{auditLabels[entry.status] || entry.status}</span></li>)}</ul>}</details>
  </div>;
}

