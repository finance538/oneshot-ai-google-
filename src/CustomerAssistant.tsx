import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  Sparkles, Bot, Send, Mic, MicOff, Image, Paperclip, Download,
  Volume2, VolumeX, Copy, Check, X, Maximize2, Calculator,
  ShoppingBag, CreditCard, ChevronDown, RefreshCw, MessageSquare
} from 'lucide-react';
import { categories } from './storefront/catalog';
import './CustomerAssistant.css';

interface CustomerMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  image?: string;
  time: string;
  audioBlob?: boolean;
}

const initialWelcomeMessage: CustomerMessage = {
  id: 'msg-welcome',
  sender: 'assistant',
  text: 'أهلاً بك في OneShot! 👋 أنا مساعدك الذكي لخدمات التصوير والإنتاج المرئي، الهوية التجارية، وتكاملات بوابات الدفع.\nكيف أقدر أساعدك اليوم في مشروعك أو باقتك؟',
  time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
};

const quickQuestions = [
  'ما هي باقات تصوير المنتجات والريلز؟',
  'كيف أربط بوابة دفع Telr أو PayTabs؟',
  'كم تكلفة تصميم هوية تجارية كاملة؟',
  'كيف استخدم محفظة ونشوت الرقمية؟',
];

export default function CustomerAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CustomerMessage[]>([initialWelcomeMessage]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'calculator' | 'catalog' | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [calcAmount, setCalcAmount] = useState('3500');
  const [calcGateway, setCalcGateway] = useState<'telr' | 'paytabs'>('telr');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Audio Recording handling
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('الميكروفون غير مدعوم في متصفحك أو يتطلب تفعيل صلاحيات الصوت.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      };
    } catch {
      // Graceful fallback simulation
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);
    }
  };

  const stopRecording = (sendAsVoice = true) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);

    if (sendAsVoice) {
      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      const durationStr = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}`;
      const voiceText = `🎤 تسجيل صوتي (${durationStr})`;
      
      const newMsg: CustomerMessage = {
        id: `voice-${Date.now()}`,
        sender: 'user',
        text: voiceText,
        time: now,
        audioBlob: true,
      };

      setMessages(prev => [...prev, newMsg]);
      generateCustomerReply(`استفسار صوتي من العميل مدته ${durationStr}`);
    }
    setRecordingSeconds(0);
  };

  // Image Selection handling
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Text to Speech
  const toggleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('القارئ الصوتي غير مدعوم في متصفحك.');
      return;
    }
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  // Copy to clipboard
  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download transcript
  const downloadTranscript = () => {
    const header = `=== سجل محادثة مساعد OneShot الذكي للعملاء ===\nالتاريخ: ${new Date().toLocaleString('ar-SA')}\n\n`;
    const content = messages
      .map(m => `[${m.time}] ${m.sender === 'user' ? 'العميل' : 'مساعد OneShot'}:\n${m.text}\n`)
      .join('\n----------------------------------------\n\n');
    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oneshot-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Intelligent Response Generation
  const generateCustomerReply = (userPrompt: string, attachedImg?: string | null) => {
    setTimeout(() => {
      const lower = userPrompt.toLowerCase();
      let reply = 'يسعدنا خدمتك! فريق OneShot متاح لتنفيذ طلبك بأعلى معايير الإتقان، من استوديو التصوير الاحترافي إلى هندسة بوابات الدفع الإلكتروني.';

      if (attachedImg) {
        reply = 'استلمت الصورة المرفقة بوضوح! 📸 تم فحص الأبعاد والتفاصيل. يمكننا تقديم جلسة تصوير مماثلة في استوديو ونشوت، أو تطبيق معالجة وتلوين إعلاني احترافي مع الهوية البصرية. هل تحب نحدد موعد جلسة التصوير أو نزودك برابط دفع العرض؟';
      } else if (lower.includes('تصوير') || lower.includes('ريلز') || lower.includes('منتجات')) {
        reply = 'باقات التصوير لدى OneShot تشمل:\n1. باقة تصوير المنتجات الاستوديو (PHT-01): تصوير خلفيات نقية مع معالجة رقمية متقدمة بسعر 1,450 ر.س.\n2. باقة ريلز وفيديو إعلاني (MED-01): تصوير ومونتاج 5 مقاطع تيك توك وإنستغرام بدقة 4K بسعر 2,200 ر.س.\n3. التغطية الميدانية الشاملة (PHT-03): طاقم متكامل للمناسبات والمعارض بسعر 4,800 ر.س.\nجميع المواد تسلم عبر سحابة ونشوت الخاصة.';
      } else if (lower.includes('هوية') || lower.includes('شعار') || lower.includes('تصميم')) {
        reply = 'باقة الهوية البصرية المتكاملة (BRD-01) تتضمن:\n• تصميم الشعار وتطبيقاته وقواعد استخدام الألوان والخطوط (Brand Guidelines).\n• تصاميم بطاقات الأعمال، المطبوعات، وترويسات المراسلات.\n• تصاميم قوالب السوشيال ميديا.\nالقيمة: 3,850 ر.س مع تسليم كافة الملفات المفتوحة والموجهة.';
      } else if (lower.includes('دفع') || lower.includes('telr') || lower.includes('paytabs') || lower.includes('بوابة')) {
        reply = 'نوفر تكاملات سريعة وآمنة مع بوابات الدفع الرائدة في المملكة:\n• بوابة Telr: تكامل Framed سلس ومناسب للمدفوعات الكبرى وعمولات تنافسية 2.69%.\n• بوابة PayTabs: دعم مباشر لمدى، Apple Pay، وبطاقات الائتمان.\n• الروابط المفتوحة: تتيح لعميلك اختيار المبلغ والدفع بلحظات دون تعقيد.\n• المحفظة الرقمية: شحن وسداد فوري مع سجل تدقيق مشفر.';
      } else if (lower.includes('محفظة') || lower.includes('رصيد')) {
        reply = 'محفظة ونشوت الرقمية تمنحك:\n• رصيداً فورياً يمكن شحنه عبر البطاقات البنكية.\n• دفعاً بنقرة واحدة لأي خدمة أو باقة في الكتالوج.\n• تتبع الفواتير وحالة التجهيز لحظياً مع رقم طلب وسجل معتمد.';
      } else if (lower.includes('سعر') || lower.includes('تكلفة') || lower.includes('كم')) {
        reply = 'أسعارنا مدروسة وموثقة بالريال السعودي (SAR). يمكنك استخدام "حاسبة الأسعار" في شريط الأدوات أعلاه لحساب التكلفة التقديرية بدقة أو طلب رابط دفع مخصص فوراً.';
      }

      const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          time: now,
        },
      ]);
    }, 600);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const userMsg: CustomerMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input.trim() || '📸 مرفق صورة للاستفسار',
      image: selectedImage || undefined,
      time: now,
    };

    const currentImg = selectedImage;
    const currentInput = input.trim();

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);

    generateCustomerReply(currentInput, currentImg);
  };

  // Calculator logic
  const calculateFees = () => {
    const amount = parseFloat(calcAmount) || 0;
    if (calcGateway === 'telr') {
      const fee = amount * 0.0269;
      const net = amount - fee;
      return { fee: fee.toFixed(2), net: net.toFixed(2), rate: '2.69%' };
    } else {
      const fee = amount * 0.027 + 1.0;
      const net = Math.max(0, amount - fee);
      return { fee: fee.toFixed(2), net: net.toFixed(2), rate: '2.7% + 1.00 ر.س' };
    }
  };

  const calcResult = calculateFees();

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        className={`customer-ai-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="مساعد OneShot الذكي للعملاء"
        title="تحدث مع مساعد OneShot الذكي"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
        {!isOpen && <span className="customer-ai-badge">AI Assistant</span>}
      </button>

      {/* Main Chat Drawer */}
      {isOpen && (
        <div className="customer-ai-window" dir="rtl">
          {/* Header */}
          <div className="customer-ai-header">
            <div className="customer-ai-title-wrap">
              <div className="customer-ai-avatar">
                <Bot size={22} />
              </div>
              <div>
                <h3>مساعد OneShot الذكي</h3>
                <span className="customer-ai-status">
                  <span className="customer-ai-pulse" /> متصل وجاهز للمساعدة
                </span>
              </div>
            </div>

            <div className="customer-ai-header-actions">
              {/* Download Transcript */}
              <button
                type="button"
                className="customer-icon-btn"
                onClick={downloadTranscript}
                title="تحميل وتنزيل سجل المحادثة (TXT)"
                aria-label="تحميل المحادثة"
              >
                <Download size={18} />
              </button>

              {/* Clear / Reset */}
              <button
                type="button"
                className="customer-icon-btn"
                onClick={() => setMessages([initialWelcomeMessage])}
                title="محادثة جديدة"
                aria-label="محادثة جديدة"
              >
                <RefreshCw size={17} />
              </button>

              {/* Close */}
              <button
                type="button"
                className="customer-icon-btn"
                onClick={() => setIsOpen(false)}
                aria-label="إغلاق المساعد"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick In-Chat Tools Bar */}
          <div className="customer-ai-tools-bar">
            <button
              type="button"
              className={`tool-pill ${activeTool === 'calculator' ? 'active' : ''}`}
              onClick={() => setActiveTool(activeTool === 'calculator' ? null : 'calculator')}
            >
              <Calculator size={14} /> حاسبة الرسوم
            </button>
            <button
              type="button"
              className={`tool-pill ${activeTool === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTool(activeTool === 'catalog' ? null : 'catalog')}
            >
              <ShoppingBag size={14} /> باقات ونشوت
            </button>
            <a
              href="/wallet"
              className="tool-pill link"
              title="الانتقال إلى المحفظة الرقمية"
            >
              <CreditCard size={14} /> محفظة العميل
            </a>
          </div>

          {/* Collapsible Calculator Tool */}
          {activeTool === 'calculator' && (
            <div className="customer-tool-card">
              <div className="tool-card-head">
                <strong>🧮 حاسبة رسوم بوابات الدفع وصافي المبلغ</strong>
                <button type="button" onClick={() => setActiveTool(null)}><X size={15} /></button>
              </div>
              <div className="tool-card-body">
                <div className="tool-input-row">
                  <label>المبلغ الإجمالي (SAR):</label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={e => setCalcAmount(e.target.value)}
                    min="1"
                    step="10"
                  />
                </div>
                <div className="tool-input-row">
                  <label>بوابة الدفع:</label>
                  <select
                    value={calcGateway}
                    onChange={e => setCalcGateway(e.target.value as 'telr' | 'paytabs')}
                  >
                    <option value="telr">Telr (عمولة 2.69%)</option>
                    <option value="paytabs">PayTabs (2.7% + 1 ريال)</option>
                  </select>
                </div>
                <div className="tool-results">
                  <div><span>رسوم البوابة ({calcResult.rate}):</span> <strong>{calcResult.fee} ر.س</strong></div>
                  <div><span>صافي المبلغ المستلم:</span> <strong className="highlight">{calcResult.net} ر.س</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Catalog Tool */}
          {activeTool === 'catalog' && (
            <div className="customer-tool-card">
              <div className="tool-card-head">
                <strong>📦 أبرز تصنيفات خدمات OneShot 2026</strong>
                <button type="button" onClick={() => setActiveTool(null)}><X size={15} /></button>
              </div>
              <div className="tool-catalog-list">
                {categories.slice(1, 6).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className="cat-quick-btn"
                    onClick={() => {
                      setInput(`أريد تفاصيل عن باقات ${cat.nameAr}`);
                      setActiveTool(null);
                    }}
                  >
                    <span>{cat.nameAr}</span>
                    <small>{cat.descriptionAr.slice(0, 45)}...</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="customer-ai-messages">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`customer-msg-row ${msg.sender === 'user' ? 'user-row' : 'assistant-row'}`}
              >
                <div className={`customer-bubble ${msg.sender}`}>
                  {/* Sender meta */}
                  <div className="msg-meta">
                    <span className="msg-sender-name">
                      {msg.sender === 'user' ? 'أنت' : 'مساعد OneShot'}
                    </span>
                    <span className="msg-time">{msg.time}</span>
                  </div>

                  {/* Attached Image with click-to-enlarge */}
                  {msg.image && (
                    <div className="msg-image-wrap">
                      <img
                        src={msg.image}
                        alt="صورة مرفقة"
                        className="msg-attached-img"
                        onClick={() => setEnlargedImage(msg.image || null)}
                      />
                      <button
                        type="button"
                        className="enlarge-badge"
                        onClick={() => setEnlargedImage(msg.image || null)}
                        title="تكبير الصورة"
                      >
                        <Maximize2 size={13} /> تكبير الصورة
                      </button>
                    </div>
                  )}

                  {/* Text content */}
                  <p className="msg-text">{msg.text}</p>

                  {/* Assistant Actions: Copy, Read aloud */}
                  {msg.sender === 'assistant' && (
                    <div className="msg-actions">
                      <button
                        type="button"
                        className="action-sub-btn"
                        onClick={() => copyMessage(msg.id, msg.text)}
                        title="نسخ النص"
                      >
                        {copiedId === msg.id ? <Check size={14} className="copied" /> : <Copy size={14} />}
                        <span>{copiedId === msg.id ? 'تم النسخ' : 'نسخ'}</span>
                      </button>

                      <button
                        type="button"
                        className={`action-sub-btn ${speakingId === msg.id ? 'active-speaking' : ''}`}
                        onClick={() => toggleSpeech(msg.id, msg.text)}
                        title="قراءة صوتية"
                      >
                        {speakingId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        <span>{speakingId === msg.id ? 'إيقاف' : 'استماع'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Quick Suggestion Pills */}
            {messages.length === 1 && (
              <div className="customer-quick-suggestions">
                <span className="suggestions-label">أسئلة شائعة:</span>
                <div className="suggestions-grid">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggestion-pill"
                      onClick={() => {
                        setInput(q);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Selected Image Preview in Composer */}
          {selectedImage && (
            <div className="composer-image-preview">
              <div className="preview-thumb-wrap">
                <img
                  src={selectedImage}
                  alt="معاينة المرفق"
                  onClick={() => setEnlargedImage(selectedImage)}
                />
                <button
                  type="button"
                  className="preview-remove"
                  onClick={() => setSelectedImage(null)}
                  title="إزالة الصورة"
                >
                  <X size={14} />
                </button>
              </div>
              <span className="preview-label">تم إرفاق صورة جاهزة للإرسال</span>
            </div>
          )}

          {/* Voice Recording Bar */}
          {isRecording ? (
            <div className="customer-recording-bar">
              <div className="recording-indicator">
                <span className="rec-dot" />
                <span>جارٍ التسجيل الصوتي... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="recording-controls">
                <button
                  type="button"
                  className="rec-cancel-btn"
                  onClick={() => stopRecording(false)}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="rec-stop-btn"
                  onClick={() => stopRecording(true)}
                >
                  <MicOff size={16} /> إرسال التسجيل
                </button>
              </div>
            </div>
          ) : (
            /* Standard Composer Form */
            <form className="customer-ai-composer" onSubmit={handleSend}>
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />

              {/* Attach File/Image Button */}
              <button
                type="button"
                className="composer-action-btn"
                onClick={() => fileInputRef.current?.click()}
                title="إرفاق صورة أو ملف"
                aria-label="إرفاق صورة"
              >
                <Image size={19} />
              </button>

              {/* Voice Record Button */}
              <button
                type="button"
                className="composer-action-btn mic-btn"
                onClick={startRecording}
                title="تسجيل رسالة صوتية"
                aria-label="تسجيل صوتي"
              >
                <Mic size={19} />
              </button>

              {/* Text Input */}
              <input
                type="text"
                className="customer-input"
                placeholder="اكتب استفسارك هنا أو أرفق صورة..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />

              {/* Send Button */}
              <button
                type="submit"
                className="customer-send-btn"
                disabled={!input.trim() && !selectedImage}
                aria-label="إرسال"
              >
                <Send size={18} />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {enlargedImage && (
        <div
          className="customer-lightbox-overlay"
          onClick={() => setEnlargedImage(null)}
          dir="rtl"
        >
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <div className="lightbox-header">
              <span>عرض الصورة بالحجم الكامل</span>
              <div className="lightbox-btns">
                <a
                  href={enlargedImage}
                  download="oneshot-image.png"
                  className="lightbox-download"
                  title="تحميل الصورة"
                >
                  <Download size={18} /> تحميل
                </a>
                <button
                  type="button"
                  onClick={() => setEnlargedImage(null)}
                  className="lightbox-close"
                  title="إغلاق"
                >
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
    </>
  );
}
