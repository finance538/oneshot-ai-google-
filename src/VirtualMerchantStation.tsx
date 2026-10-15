import { useState, useEffect } from 'react';
import {
  Monitor, Cpu, Activity, Mail, ArrowUpRight, CheckCircle2,
  Clock, Shield, Wifi, Terminal, RefreshCw, Eye, Sparkles
} from 'lucide-react';
import './VirtualMerchantStation.css';

interface VirtualEvent {
  id: string;
  timestamp: string;
  source: 'ai_agent' | 'order_stream' | 'email_inbox' | 'gateway_bridge' | 'fraud_guard';
  title: string;
  detail: string;
  status: 'active' | 'completed' | 'analyzing' | 'warning';
}

const SAMPLE_EVENTS: VirtualEvent[] = [
  {
    id: 'e1',
    timestamp: 'منذ لحظات',
    source: 'order_stream',
    title: 'طلب دفع جديد قيد المعالجة (SAR 450.00)',
    detail: 'العميل: سارة القحطاني · وسيلة الدفع: مدى / 3DS Verified · البوابة: PayTabs',
    status: 'completed',
  },
  {
    id: 'e2',
    timestamp: 'قبل 20 ثانية',
    source: 'ai_agent',
    title: 'وكيل الذكاء الاصطناعي (AI CEO) يحلل معدل التحويل',
    detail: 'رصد زيادة بنسبة 18% في عمليات الدفع عبر الجوال بعد تفعيل ربط Apple Pay السلس.',
    status: 'analyzing',
  },
  {
    id: 'e3',
    timestamp: 'قبل دقيقة',
    source: 'email_inbox',
    title: 'فحص إشعارات البريد الإلكتروني والـ Webhooks',
    detail: 'استلام إشعار IPN من بوابة Telr لتأكيد حجز معاملة رقم #TLR-99410.',
    status: 'active',
  },
  {
    id: 'e4',
    timestamp: 'قبل دقيقتين',
    source: 'fraud_guard',
    title: 'درع مكافحة الاحتيال (Risk Guard) يفحص محاولة دفع',
    detail: 'مطابقة الـ IP السعودي مع بطاقة الراجحي ومدى · نسبة الأمان: 99.8% (تم التمرير).',
    status: 'completed',
  },
  {
    id: 'e5',
    timestamp: 'قبل 4 دقائق',
    source: 'gateway_bridge',
    title: 'مزامنة مفاتيح الربط لبوابة ماي فاتورة',
    detail: 'تم استدعاء InitiateSession واختبار الاتصال بنجاح مع سيرفرات البوابة.',
    status: 'completed',
  },
];

export default function VirtualMerchantStation() {
  const [events, setEvents] = useState<VirtualEvent[]>(SAMPLE_EVENTS);
  const [activeWindow, setActiveWindow] = useState<'pipeline' | 'ai_feed' | 'system_matrix'>('pipeline');
  const [isPulseActive, setIsPulseActive] = useState(true);

  // Simulate subtle real-time event updates
  useEffect(() => {
    const timer = setInterval(() => {
      const dynamicEventTitles = [
        {
          source: 'order_stream' as const,
          title: `طلب دفع جديد مكتمل (${Math.floor(100 + Math.random() * 800)} SAR)`,
          detail: 'تم اعتماد العملية وإصدار الفاتورة الضريبية عبر بوابة الدفع بنجاح.',
        },
        {
          source: 'email_inbox' as const,
          title: 'الـ AI يتنقل ويفحص إشعارات الاستفسارات البريدية',
          detail: 'تحديث حالة تذكرة دعم عميل وتأكيد رابط الدفع المفتوح.',
        },
        {
          source: 'ai_agent' as const,
          title: 'فحص صحة البوابات النشطة (Health Check)',
          detail: 'زمن استجابة البوابات: PayTabs 210ms · Telr 180ms · MyFatoorah 240ms.',
        },
      ];

      const chosen = dynamicEventTitles[Math.floor(Math.random() * dynamicEventTitles.length)];
      const newEvt: VirtualEvent = {
        id: `e-${Date.now()}`,
        timestamp: 'الآن',
        source: chosen.source,
        title: chosen.title,
        detail: chosen.detail,
        status: 'active',
      };

      setEvents((prev) => [newEvt, ...prev.slice(0, 7)]);
    }, 14000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="virtual-merchant-station">
      {/* Station Outer Frame */}
      <div className="station-bezel">
        {/* Screen Top Header */}
        <div className="station-top-bar">
          <div className="screen-indicators">
            <span className="power-led" />
            <span className="station-name">ONESHOT VIRTUAL WORKSTATION // محطة المدير الافتراضية</span>
          </div>

          <div className="station-tabs-controls">
            <button
              type="button"
              className={`st-tab ${activeWindow === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveWindow('pipeline')}
            >
              <Activity size={14} />
              <span>متابعة مسار الطلبات (Live Pipeline)</span>
            </button>
            <button
              type="button"
              className={`st-tab ${activeWindow === 'ai_feed' ? 'active' : ''}`}
              onClick={() => setActiveWindow('ai_feed')}
            >
              <Cpu size={14} />
              <span>شاشة عمل الـ AI والتنقل بين العمليات</span>
            </button>
            <button
              type="button"
              className={`st-tab ${activeWindow === 'system_matrix' ? 'active' : ''}`}
              onClick={() => setActiveWindow('system_matrix')}
            >
              <Shield size={14} />
              <span>حالة أمان البوابات (Security Grid)</span>
            </button>
          </div>

          <div className="station-stats-pills">
            <span className="live-telemetry-tag">
              <span className="telemetry-dot" /> STREAMING 60FPS
            </span>
          </div>
        </div>

        {/* Screen Display Area */}
        <div className="station-display-screen">
          {activeWindow === 'pipeline' && (
            <div className="pipeline-view animate-fade-in">
              <div className="pipeline-header">
                <div>
                  <h3>شاشة تتبع الطلبات والمراقبة الإدارية المباشرة</h3>
                  <p>
                    كأنك مدير يراقب حركة المتجر لحظة بلحظة: تتبع دخول الطلب، تحويله للبوابة، فحص الـ AI،
                    وحجز المبالغ أمام عينيك.
                  </p>
                </div>
                <div className="live-speed-box">
                  <Wifi size={16} />
                  <span>سرعة استجابة الخادم: <strong>14ms</strong></span>
                </div>
              </div>

              {/* Event Stream Cards */}
              <div className="pipeline-events-scroll">
                {events.map((evt) => (
                  <div key={evt.id} className={`station-event-card evt-${evt.source}`}>
                    <div className="evt-icon-wrapper">
                      {evt.source === 'order_stream' && <Activity size={18} />}
                      {evt.source === 'ai_agent' && <Sparkles size={18} />}
                      {evt.source === 'email_inbox' && <Mail size={18} />}
                      {evt.source === 'fraud_guard' && <Shield size={18} />}
                      {evt.source === 'gateway_bridge' && <Cpu size={18} />}
                    </div>

                    <div className="evt-content">
                      <div className="evt-title-row">
                        <strong>{evt.title}</strong>
                        <span className="evt-time">{evt.timestamp}</span>
                      </div>
                      <p className="evt-detail">{evt.detail}</p>
                    </div>

                    <div className="evt-status-pill">
                      <span className={`status-glow ${evt.status}`} />
                      <span>{evt.status === 'completed' ? 'تم التنفيذ' : 'جارٍ المعالجة'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeWindow === 'ai_feed' && (
            <div className="ai-feed-view animate-fade-in">
              <div className="ai-simulation-screen">
                <div className="ai-screen-toolbar">
                  <span className="sim-title">
                    <Terminal size={14} /> محاكاة جهاز الذكاء الاصطناعي الإداري (Virtual AI Desktop)
                  </span>
                  <span className="ai-state-indicator">
                    <span className="ai-dot-pulse" /> AI AGENT ACTIVE & COMMUNICATING
                  </span>
                </div>

                <div className="ai-task-split">
                  {/* Left: AI Active Processes */}
                  <div className="ai-active-tasks">
                    <h4>المهام الذكية الجارية في الخلفية:</h4>
                    <div className="ai-task-item active-task">
                      <div className="task-header">
                        <Mail size={16} className="task-icon" />
                        <strong>مراقبة الإيميلات والطلبات الواردة</strong>
                      </div>
                      <p>يقوم الـ AI بفرز رسائل إشعارات الدفع والتحقق من عدم وجود تأخير في الردود.</p>
                      <div className="task-progress">
                        <div className="progress-bar-fill" style={{ width: '84%' }} />
                      </div>
                    </div>

                    <div className="ai-task-item">
                      <div className="task-header">
                        <Cpu size={16} className="task-icon" />
                        <strong>فحص وموازنة الأحمال بين بوابات الدفع (Smart Routing)</strong>
                      </div>
                      <p>توجيه العمليات تلقائياً للبوابة ذات أعلى معدل نجاح بالبطاقة المستخدمة.</p>
                      <div className="task-progress">
                        <div className="progress-bar-fill" style={{ width: '95%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Right: Real-time Terminal Log */}
                  <div className="ai-terminal-box">
                    <div className="term-head">
                      <span>CONSOLE FEED // AI LOGS</span>
                      <RefreshCw size={13} className="spin-slow" />
                    </div>
                    <div className="term-lines" dir="ltr">
                      <code>&gt; [AI_DISPATCHER] Polling inbox notifications: 0 unhandled alerts.</code>
                      <code>&gt; [ROUTING_ENGINE] Selected primary provider: PayTabs (Latency: 190ms).</code>
                      <code>&gt; [FRAUD_MONITOR] BIN check SA: Alinma Mada verified. 3DS 2.0 passed.</code>
                      <code>&gt; [ORDER_EXEC] Invoice #ONESHOT-1048 settled. Webhook dispatched.</code>
                      <code>&gt; [AUTO_CEO] Conversion optimization matrix updated. Ready for next query.</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeWindow === 'system_matrix' && (
            <div className="matrix-view animate-fade-in">
              <div className="matrix-grid">
                <div className="matrix-stat-card">
                  <div className="m-icon"><Shield size={20} /></div>
                  <div className="m-text">
                    <span className="m-val">100%</span>
                    <span className="m-lbl">حماية التشفير وتوقيع الـ Webhook</span>
                  </div>
                </div>
                <div className="matrix-stat-card">
                  <div className="m-icon"><Wifi size={20} /></div>
                  <div className="m-text">
                    <span className="m-val">99.98%</span>
                    <span className="m-lbl">استقرار خوادم بوابات الدفع</span>
                  </div>
                </div>
                <div className="matrix-stat-card">
                  <div className="m-icon"><Activity size={20} /></div>
                  <div className="m-text">
                    <span className="m-val">340ms</span>
                    <span className="m-lbl">متوسط زمن إتمام عملية الدفع</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
