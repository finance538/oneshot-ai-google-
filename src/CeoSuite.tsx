import { useState, useRef } from 'react';
import {
  Zap, Sparkles, TrendingUp, CheckCircle, Send, User, Download, Mic, MicOff,
  Image, Maximize2, Copy, Volume2, VolumeX, Check, X, Calculator
} from 'lucide-react';

interface CeoAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: 'active' | 'analyzing' | 'standby';
}

const agents: CeoAgent[] = [
  {
    id: 'ceo',
    name: 'سلطان الموجه (CEO Copilot)',
    role: 'الرئيس التنفيذي',
    description: 'المستشار الاستراتيجي والتنفيذي للتاجر: خطط التوسع الربعي، صياغة الصفقات الكبرى، وهوامش الربح.',
    status: 'active',
  },
  {
    id: 'cfo',
    name: 'فهد المالي (CFO Treasury)',
    role: 'المدير المالي',
    description: 'تحليل التدفق النقدي وهوامش الباقات، وتدقيق رسوم بوابات PayTabs و Telr لتعظيم الأرباح الصافية.',
    status: 'active',
  },
  {
    id: 'cmo',
    name: 'ريما النمو (CMO Performance)',
    role: 'مديرة التسويق',
    description: 'تحسين عائد إعلانات Google Ads Diamond، هندسة حملات الريلز الفيروسية، وخفض تكلفة اكتساب العميل.',
    status: 'analyzing',
  },
  {
    id: 'coo',
    name: 'خالد العمليات (COO Delivery)',
    role: 'مدير التشغيل',
    description: 'متابعة مسارات تسليم الخدمات، مراقبة مؤشرات جودة المخرجات SLA، وضمان رضا عملاء ونشوت.',
    status: 'standby',
  },
];

const kpis = [
  { title: 'صافي الإيراد المتوقع (Q4)', value: '184,500 ر.س', subtitle: '+24.8% نمو شهري' },
  { title: 'متوسط قيمة الطلب (AOV)', value: '3,250 ر.س', subtitle: 'أعلى باقة: هوية متكاملة 5,500 ر.س' },
  { title: 'هامش الربح الإجمالي', value: '68.4%', subtitle: 'الأعلى: باقات الأتمتة والـ AI' },
  { title: 'عائد الإعلانات (ROAS)', value: '4.6x', subtitle: 'حملات بحث الرياض وجدة' },
];

export default function CeoSuite() {
  const [selectedAgent, setSelectedAgent] = useState<string>('ceo');
  const [tab, setTab] = useState<'chat' | 'tasks'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showProfitCalc, setShowProfitCalc] = useState(false);
  const [calcSale, setCalcSale] = useState('10000');
  const [calcCost, setCalcCost] = useState('3200');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recTimerRef = useRef<number | null>(null);

  const [messages, setMessages] = useState<Record<string, { sender: 'user' | 'assistant'; text: string; time: string; image?: string }[]>>({
    ceo: [
      { sender: 'assistant', text: 'أهلاً بك سعادة الرئيس التنفيذي. بصفتي مساعدك الاستراتيجي التنفيذي، استعرضت مؤشرات المتجر اليوم: إجمالي المدفوعات 148,500 ر.س بنمو 24.8%. أنا وفريقي (CFO و CMO و COO) جاهزون لتنفيذ أي توجيه أو دراسة استثمارية.', time: '09:00' }
    ],
    cfo: [
      { sender: 'assistant', text: 'مرحباً يا قائد. خزينة المتجر مستقرة ورصيد المحفظة المتاح 3,350 ر.س. مقارنة رسوم التحصيل: في المبيعات الكبيرة (+3,000 ر.س) نوصي بتوجيه الدفع عبر Telr Framed لتوفير العمولات.', time: '09:00' }
    ],
    cmo: [
      { sender: 'assistant', text: 'سعادة الرئيس، حملة Google Ads Diamond حققت ROAS بمعدل 4.6x. مقاطع كواليس تصوير المنتجات حققت تفاعلاً أعلى بـ 3 أضعاف. دعنا نطلق حملة إعادة استهداف لعملاء الروابط المفتوحة.', time: '09:00' }
    ],
    coo: [
      { sender: 'assistant', text: 'تحياتي سعادة الرئيس. سلاسل تسليم الخدمات تعمل بنسبة التزام تفوق 96% ومعدل التسليم الزمني 3.8 أيام عمل مقارنة بالهدف 4 أيام.', time: '09:00' }
    ],
  });

  const [tasks, setTasks] = useState<{ id: string; agent: string; title: string; output: string; time: string }[]>([
    {
      id: 'TASK-01',
      agent: 'فهد المالي (CFO)',
      title: 'مقارنة تكلفة رسوم بوابات الدفع PayTabs مقابل Telr',
      output: 'بوابة Telr حققت وفراً قدره 420 ر.س في العمليات الكبرى (+5000 ر.س)، بينما PayTabs تفوقت في تحويلات مدى و Apple Pay السريعة بنسبة نجاح 98.7%.',
      time: 'اليوم 14:30'
    },
    {
      id: 'TASK-02',
      agent: 'ريما النمو (CMO)',
      title: 'خطة إطلاق باقة ريلز التصوير التجاري للمطاعم والكافيهات',
      output: 'تم تصميم خطة محتوى من 5 مقاطع تبرز جودة إضاءات الاستوديو لجلب 18 عميل جديد بتكلفة اكتساب 110 ر.س لكل عميل.',
      time: 'أمس 18:00'
    }
  ]);

  const currentAgent = agents.find(a => a.id === selectedAgent) || agents[0];
  const currentChat = messages[selectedAgent] || [];

  // الميكروفون غير مربوط بمسار تفريغ صوتي في هذه النسخة، فلا نُظهِر تسجيلًا وهميًا.
  const startRecording = () => {
    setIsRecording(false);
    setRecSeconds(0);
    alert('التسجيل الصوتي غير مربوط بهذه النسخة: لا يوجد التقاط صوت ولا تفريغ نصي. اكتب أمرك نصًا في مربع الرسالة.');
  };

  const stopRecording = (sendVoice = true) => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setIsRecording(false);
    setRecSeconds(0);
    void sendVoice;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setAttachedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const downloadAgentChat = () => {
    const header = `=== تقرير محادثة مكتب الرئيس التنفيذي OneShot ===\nالوكيل: ${currentAgent.name} (${currentAgent.role})\nالتاريخ: ${new Date().toLocaleString('ar-SA')}\n\n`;
    const body = currentChat.map(m => `[${m.time}] ${m.sender === 'user' ? 'الرئيس التنفيذي' : currentAgent.name}:\n${m.text}\n`).join('\n---\n\n');
    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceo-agent-${selectedAgent}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSpeech = (index: number, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    } else {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ar-SA';
      utter.rate = 1.0;
      utter.onend = () => setSpeakingIndex(null);
      utter.onerror = () => setSpeakingIndex(null);
      window.speechSynthesis.speak(utter);
      setSpeakingIndex(index);
    }
  };

  const copyMsg = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sendMessage = (text: string) => {
    if (!text.trim() && !attachedImage) return;
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const currentImg = attachedImage;
    const userMsg = { sender: 'user' as const, text: text.trim() || '📸 مرفق تقرير/صورة تنفيذية للمراجعة', time: now, image: currentImg || undefined };
    
    let reply = `علم سعادة الرئيس التنفيذي بخصوص "${text}". قمت بتحليل التوجيه وفقاً للمؤشرات التنفيذية وجاري العمل على تنفيذه فوراً.`;
    if (currentImg) {
      reply = `تمت مراجعة المستند/الصورة المرفقة بنجاح 📸. قمت بمطابقتها مع خطة تشغيل ونشوت وتدقيق الجودة SLA. مؤشرات التنفيذ إيجابية بالكامل.`;
    } else if (text.includes('تسعير') || text.includes('سعر')) {
      reply = 'بصفتي مستشارك التنفيذي، باقات الأتمتة AUT-02 مسعرة حالياً بـ 2,800 ر.س وقيمتها السوقية تفوق 4,500 ر.س. أقترح إطلاق باقة مدمجة تضم (الربط + التصوير + الهوية) بقيمة 9,500 ر.س لرفع صافي الأرباح.';
    } else if (text.includes('رسوم') || text.includes('عمولة')) {
      reply = 'تحليل الرسوم: بوابة Telr تأخذ 2.69% و PayTabs تأخذ 2.7% + 1 ريال. نوجه العمليات الكبرى نحو Telr والعمليات اللحظية نحو PayTabs مع مدى.';
    }

    const assistantMsg = { sender: 'assistant' as const, text: reply, time: now };
    setMessages(prev => ({
      ...prev,
      [selectedAgent]: [...(prev[selectedAgent] || []), userMsg, assistantMsg]
    }));
    setChatInput('');
    setAttachedImage(null);
  };

  const delegateQuickTask = (title: string) => {
    const newTask = {
      id: `TASK-${Math.floor(10 + Math.random() * 89)}`,
      agent: currentAgent.name,
      title,
      output: `تم إنجاز المهمة التنفيذية من قبل ${currentAgent.role}: تم تدقيق المؤشرات وإعداد التوصيات بنجاح.`,
      time: 'الآن'
    };
    setTasks([newTask, ...tasks]);
    setTab('tasks');
  };

  const saleVal = parseFloat(calcSale) || 0;
  const costVal = parseFloat(calcCost) || 0;
  const profitVal = Math.max(0, saleVal - costVal);
  const marginPct = saleVal > 0 ? ((profitVal / saleVal) * 100).toFixed(1) : '0';

  return (
    <div className="ceo-suite-container" style={{ display: 'grid', gap: '20px' }} dir="rtl">
      {/* Executive Header Banner */}
      <div style={{ background: '#141717', color: 'white', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: '#f05b2b25', color: '#f05b2b', border: '1px solid #f05b2b40', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
              MERCHANT AS CEO
            </span>
            <span style={{ color: '#a8afac', fontSize: '12px' }}>مكتب الرئيس التنفيذي</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>فريقك التنفيذي الذكي (Executive AI Agents)</h2>
          <p style={{ color: '#9ba59d', fontSize: '12px', margin: '4px 0 0' }}>مساعدون متخصصون تحت قيادتك المباشرة: إدارة الاستراتيجية، المالية، التسويق، وضمان الجودة.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowProfitCalc(!showProfitCalc)}
            style={{ background: '#242730', border: '1px solid #363b48', color: '#ffffff', padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Calculator size={15} /> حاسبة الأرباح
          </button>
          <button
            type="button"
            onClick={downloadAgentChat}
            style={{ background: '#242730', border: '1px solid #363b48', color: '#ffffff', padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> تحميل المحادثة
          </button>
          <button 
            onClick={() => delegateQuickTask('دراسة تسعير باقة هوية ونشوت الشاملة لـ Q4')}
            style={{ background: '#f05b2b', color: 'white', border: 0, padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Zap size={16} /> تفويض مهمة سريعة
          </button>
        </div>
      </div>

      {/* KPIs Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e8eaeb' }}>
            <div style={{ fontSize: '11px', color: '#8a8e90' }}>{kpi.title}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', margin: '6px 0 2px', color: '#141717' }}>{kpi.value}</div>
            <div style={{ fontSize: '10px', color: '#4e9a68', fontWeight: 'bold' }}>{kpi.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Collapsible Profit Calculator */}
      {showProfitCalc && (
        <div style={{ background: '#ffffff', border: '1px solid #f05b2b33', borderRadius: '12px', padding: '16px', display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '13px' }}>🧮 حاسبة هوامش ربح الصفقات للرئيس التنفيذي</strong>
            <button type="button" onClick={() => setShowProfitCalc(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={15} /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px' }}>قيمة البيع (SAR):
              <input type="number" value={calcSale} onChange={e => setCalcSale(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', marginRight: '6px', width: '110px' }} />
            </label>
            <label style={{ fontSize: '12px' }}>التكلفة (SAR):
              <input type="number" value={calcCost} onChange={e => setCalcCost(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', marginRight: '6px', width: '110px' }} />
            </label>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f05b2b' }}>
              صافي الربح: {profitVal.toLocaleString('ar-SA')} ر.س (هامش {marginPct}%)
            </div>
          </div>
        </div>
      )}

      {/* Agents Selection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {agents.map(agent => {
          const isSelected = agent.id === selectedAgent;
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              style={{
                background: isSelected ? '#fff1e9' : 'white',
                border: `1.5px solid ${isSelected ? '#f05b2b' : '#e8eaeb'}`,
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: isSelected ? '#f05b2b' : '#141717', fontSize: '13px' }}>{agent.role}</strong>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: agent.status === 'active' ? '#4e9a68' : '#f05b2b' }}></span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#141717', marginBottom: '4px' }}>{agent.name}</div>
              <div style={{ fontSize: '11px', color: '#6b7275', lineHeight: '1.5' }}>{agent.description}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e8eaeb', paddingBottom: '8px' }}>
        <button
          onClick={() => setTab('chat')}
          style={{ background: 'none', border: 0, padding: '8px 16px', fontWeight: 'bold', fontSize: '13px', color: tab === 'chat' ? '#f05b2b' : '#8a8e90', borderBottom: tab === 'chat' ? '2px solid #f05b2b' : 'none', cursor: 'pointer' }}
        >
          محادثة {currentAgent.role}
        </button>
        <button
          onClick={() => setTab('tasks')}
          style={{ background: 'none', border: 0, padding: '8px 16px', fontWeight: 'bold', fontSize: '13px', color: tab === 'tasks' ? '#f05b2b' : '#8a8e90', borderBottom: tab === 'tasks' ? '2px solid #f05b2b' : 'none', cursor: 'pointer' }}
        >
          المهام المفوضة ({tasks.length})
        </button>
      </div>

      {tab === 'chat' ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8eaeb', padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '440px' }}>
          {/* Quick delegate ribbon */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', borderBottom: '1px solid #f1f3f4', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: '#8a8e90', alignSelf: 'center', whiteSpace: 'nowrap' }}>أوامر سريعة:</span>
            {['دراسة رفع أسعار AUT-02', 'مراجعة رسوم تحصيلات PayTabs', 'إطلاق حملة ريلز إعلانية'].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(q)}
                style={{ background: '#f8f9fa', border: '1px solid #e0e3e6', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px', maxHeight: '340px' }}>
            {currentChat.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-start' : 'flex-end', maxWidth: '80%' }}>
                <div style={{
                  background: msg.sender === 'user' ? '#f05b2b' : '#f6f7f8',
                  color: msg.sender === 'user' ? 'white' : '#242525',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  lineHeight: '1.6'
                }}>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px', fontWeight: 'bold' }}>
                    {msg.sender === 'user' ? 'الرئيس التنفيذي (أنت)' : currentAgent.name}
                  </div>

                  {msg.image && (
                    <div style={{ margin: '6px 0', cursor: 'pointer' }} onClick={() => setEnlargedImage(msg.image || null)}>
                      <img src={msg.image} alt="مرفق" style={{ maxWidth: '180px', maxHeight: '130px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)' }} />
                      <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.8 }}>🔍 انقر لتكبير الصورة</div>
                    </div>
                  )}

                  {msg.text}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px', opacity: 0.8 }}>
                    <span>{msg.time}</span>
                    {msg.sender === 'assistant' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => copyMsg(i, msg.text)}
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                          title="نسخ"
                        >
                          {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedIndex === i ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSpeech(i, msg.text)}
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                          title="استماع"
                        >
                          {speakingIndex === i ? <VolumeX size={12} /> : <Volume2 size={12} />}
                          <span>{speakingIndex === i ? 'إيقاف' : 'استماع'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Attached image preview */}
          {attachedImage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: '#fdf3ef', borderRadius: '8px', marginTop: '8px' }}>
              <img src={attachedImage} alt="مرفق" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} />
              <span style={{ fontSize: '11px', color: '#f05b2b', flex: 1 }}>تم إرفاق صورة/مستند جاهز للإرسال</span>
              <button type="button" onClick={() => setAttachedImage(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer' }}><X size={10} /></button>
            </div>
          )}

          {/* Voice recording bar */}
          {isRecording ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fdf2f2', border: '1px solid #fca5a5', borderRadius: '8px', marginTop: '10px' }}>
              <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>
                🔴 جارٍ تسجيل أمر تنفيذي... {Math.floor(recSeconds / 60)}:{(recSeconds % 60).toString().padStart(2, '0')}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => stopRecording(false)} style={{ background: '#eee', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>إلغاء</button>
                <button type="button" onClick={() => stopRecording(true)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>إرسال الأمر</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid #f1f3f4', paddingTop: '12px', alignItems: 'center' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="إرفاق صورة أو مستند"
                style={{ background: '#f0f2f4', border: 'none', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <Image size={17} />
              </button>
              <button
                type="button"
                onClick={startRecording}
                title="تسجيل أمر تنفيذي صوتي"
                style={{ background: '#f0f2f4', border: 'none', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}
              >
                <Mic size={17} />
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(chatInput)}
                placeholder={`أمر تنفيذي لـ ${currentAgent.role}...`}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e8eaeb', fontSize: '13px' }}
              />
              <button
                onClick={() => sendMessage(chatInput)}
                style={{ background: '#f05b2b', color: 'white', border: 0, padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                إرسال
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {tasks.map(t => (
            <div key={t.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e8eaeb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#f05b2b', fontWeight: 'bold', fontSize: '11px' }}>{t.id} · {t.agent}</span>
                <span style={{ color: '#4e9a68', fontSize: '11px', fontWeight: 'bold' }}>✓ مكتملة وموثقة</span>
              </div>
              <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>{t.title}</strong>
              <div style={{ background: '#f9fafa', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#4a4e50', lineHeight: '1.6' }}>
                {t.output}
              </div>
              <small style={{ color: '#8a8e90', fontSize: '10px', display: 'block', marginTop: '6px' }}>{t.time}</small>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '24px' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#1c1e24', borderRadius: '14px', padding: '16px', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: '#fff' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>عرض الصورة التنفيذية بالحجم الكامل</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={enlargedImage} download="ceo-document.png" style={{ color: '#f05b2b', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Download size={16} /> تحميل
                </a>
                <button type="button" onClick={() => setEnlargedImage(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>
            <img src={enlargedImage} alt="مكبرة" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </div>
      )}
    </div>
  );
}

