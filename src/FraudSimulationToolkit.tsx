import { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert, Terminal, Zap, Play, RefreshCw, CheckCircle2,
  AlertTriangle, XCircle, Sliders, Lock, Cpu, Globe, ArrowRight,
  Sparkles, Key, AlertOctagon, Layers, FileCode
} from 'lucide-react';
import './FraudSimulationToolkit.css';

interface AttackLog {
  id: string;
  time: string;
  type: 'info' | 'warn' | 'block' | 'success';
  message: string;
}

export default function FraudSimulationToolkit() {
  const [activeTool, setActiveTool] = useState<
    'carding' | 'tampering' | 'webhook_forgery' | 'race_condition' | 'risk_calculator'
  >('carding');

  // Tool 1: Carding Simulator
  const [velocityRate, setVelocityRate] = useState<number>(15);
  const [cardingRunning, setCardingRunning] = useState(false);
  const [cardingLogs, setCardingLogs] = useState<AttackLog[]>([]);
  const [cardingStats, setCardingStats] = useState({ sent: 0, blocked: 0, allowed: 0, ipBanned: false });

  // Tool 2: Parameter Tampering Simulator
  const [originalAmount, setOriginalAmount] = useState('3500.00');
  const [tamperedAmount, setTamperedAmount] = useState('1.00');
  const [tamperedCurrency, setTamperedCurrency] = useState('SAR');
  const [tamperingResult, setTamperingResult] = useState<{
    status: 'idle' | 'testing' | 'blocked' | 'vulnerable';
    details?: string;
    hashSent?: string;
    hashExpected?: string;
  }>({ status: 'idle' });

  // Tool 3: Webhook Signature Forgery
  const [webhookStatus, setWebhookStatus] = useState<{
    tested: boolean;
    result?: 'rejected' | 'accepted_vulnerable';
    reason?: string;
  }>({ tested: false });

  // Tool 4: Race Condition / Double Spending
  const [raceResult, setRaceResult] = useState<{
    tested: boolean;
    thread1?: string;
    thread2?: string;
    idempotent: boolean;
  }>({ tested: false, idempotent: true });

  // Tool 5: Risk Calculator
  const [riskCountryIp, setRiskCountryIp] = useState('US');
  const [riskCountryCard, setRiskCountryCard] = useState('SA');
  const [riskProxyType, setRiskProxyType] = useState<'residential' | 'vpn' | 'tor' | 'direct'>('vpn');
  const [riskAmount, setRiskAmount] = useState('4500');

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [cardingLogs]);

  // Run Carding Simulation
  const handleStartCardingSimulation = () => {
    if (cardingRunning) return;
    setCardingRunning(true);
    setCardingLogs([]);
    setCardingStats({ sent: 0, blocked: 0, allowed: 0, ipBanned: false });

    const total = velocityRate;
    let current = 0;
    let allowedCount = 0;
    let blockedCount = 0;

    const interval = setInterval(() => {
      current++;
      const timeStr = new Date().toLocaleTimeString('ar-SA', { hour12: false });

      if (current <= 3) {
        allowedCount++;
        setCardingLogs(prev => [
          ...prev,
          {
            id: String(current),
            time: timeStr,
            type: 'info',
            message: `[REQ #${current}] محاولة دفع ببطاقة مُجرفة BIN #588845... تم تمريرها للمصرف (الطلب ضمن الحد المسموح)`,
          },
        ]);
      } else if (current === 4) {
        blockedCount++;
        setCardingLogs(prev => [
          ...prev,
          {
            id: String(current),
            time: timeStr,
            type: 'warn',
            message: `[REQ #${current}] ⚠️ تحذير أمني: رصد سرعة مشبوهة (Velocity Threshold Exceeded: >3 req/sec)`,
          },
        ]);
      } else {
        blockedCount++;
        const isBanned = current >= 7;
        setCardingLogs(prev => [
          ...prev,
          {
            id: String(current),
            time: timeStr,
            type: 'block',
            message: `[REQ #${current}] 🛑 تم حظر الطلب تلقائياً برمز 429 (Too Many Requests) - ${
              isBanned ? 'تم عزل عنوان الـ IP وإدراجه بالقائمة السوداء مؤقتاً' : 'تفعيل تحدي CAPTCHA'
            }`,
          },
        ]);
        if (isBanned) {
          setCardingStats(s => ({ ...s, ipBanned: true }));
        }
      }

      setCardingStats(s => ({
        ...s,
        sent: current,
        allowed: allowedCount,
        blocked: blockedCount,
      }));

      if (current >= total) {
        clearInterval(interval);
        setCardingRunning(false);
        setCardingLogs(prev => [
          ...prev,
          {
            id: 'finish',
            time: new Date().toLocaleTimeString('ar-SA', { hour12: false }),
            type: 'success',
            message: `✅ اكتمل اختبار الهجوم: درع مكافحة التجريف صدَّ ${blockedCount} من أصل ${total} محاولة، وحمى البوابة بنجاح.`,
          },
        ]);
      }
    }, 180);
  };

  // Run Parameter Tampering Simulation
  const handleTestTampering = () => {
    setTamperingResult({ status: 'testing' });
    setTimeout(() => {
      if (originalAmount !== tamperedAmount) {
        setTamperingResult({
          status: 'blocked',
          details: 'تم رفض العملية فوراً! خوارزمية HMAC-SHA256 كشفت عدم تطابق البصمة الرقمية (Hash Signature Mismatch). لم يتم الخصم.',
          hashSent: 'a9f4c398102d7e1194b308e2f89b4c023412',
          hashExpected: 'e812d47781a93b5840283c749911e3b00451',
        });
      } else {
        setTamperingResult({
          status: 'vulnerable',
          details: 'المبلغ لم يتم تعديله، لا يوجد تلاعب.',
        });
      }
    }, 600);
  };

  // Run Webhook Forgery Simulation
  const handleTestWebhookForgery = () => {
    setTimeout(() => {
      setWebhookStatus({
        tested: true,
        result: 'rejected',
        reason: 'فشل التحقق من التوقيع السري (whsec_...)! تم إهمال الإشعار وحظر مصدر الإرسال المشبوه برمز 401 Unauthorized.',
      });
    }, 500);
  };

  // Run Race Condition Simulation
  const handleTestRaceCondition = () => {
    setTimeout(() => {
      setRaceResult({
        tested: true,
        thread1: 'الخيط الأول (Thread #1): تم حجز الطلب وقبول العملية برقم مرجعي TXN-849102.',
        thread2: 'الخيط الثاني (Thread #2): رُفض الطلب بنظام الـ Idempotency Key لمنع السحب المزدوج (Status: 409 Conflict).',
        idempotent: true,
      });
    }, 500);
  };

  // Calculate Risk Score
  const calculateRisk = () => {
    let score = 15; // base score
    if (riskCountryIp !== riskCountryCard) score += 40; // geo mismatch
    if (riskProxyType === 'vpn') score += 25;
    if (riskProxyType === 'tor') score += 40;
    if (riskProxyType === 'direct') score -= 5;
    if (Number(riskAmount) > 3000) score += 15;
    return Math.min(100, Math.max(0, score));
  };

  const calculatedRiskScore = calculateRisk();

  return (
    <div className="fraud-simulation-toolkit">
      {/* Hero Header */}
      <div className="toolkit-hero">
        <div className="toolkit-hero-text">
          <div className="toolkit-tag">
            <ShieldAlert size={16} />
            <span>مختبر محاكاة هجمات الاحتيال واختبار الاختراق (Fraud Penetration Testing Suite)</span>
          </div>
          <h2>أدوات محاكاة طرق الاحتيال المالي واكتشاف الثغرات</h2>
          <p>
            مجموعة أدوات حية لاختبار مناعة بوابات الدفع والمتجر ضد أحدث أساليب الهجوم:
            تخمين البطاقات السريع (Carding)، التلاعب بالمبالغ المشفرة (Parameter Tampering)، تزوير إشعارات الويب هوك، وهجمات السحب المزدوج.
          </p>
        </div>

        <div className="toolkit-hero-badges">
          <div className="t-badge">
            <Cpu size={16} />
            <span>محاكي لحظي (Real-time Sandbox)</span>
          </div>
          <div className="t-badge active">
            <Lock size={16} />
            <span>معايير PCI-DSS و OWASP</span>
          </div>
        </div>
      </div>

      {/* Tool Navigation Tabs */}
      <div className="toolkit-nav">
        <button
          type="button"
          className={`tool-nav-btn ${activeTool === 'carding' ? 'active' : ''}`}
          onClick={() => setActiveTool('carding')}
        >
          <Zap size={16} />
          <span>1. محاكي هجمات Carding والتخمين</span>
        </button>

        <button
          type="button"
          className={`tool-nav-btn ${activeTool === 'tampering' ? 'active' : ''}`}
          onClick={() => setActiveTool('tampering')}
        >
          <Sliders size={16} />
          <span>2. محاكي التلاعب بالمبالغ (Tampering)</span>
        </button>

        <button
          type="button"
          className={`tool-nav-btn ${activeTool === 'webhook_forgery' ? 'active' : ''}`}
          onClick={() => setActiveTool('webhook_forgery')}
        >
          <FileCode size={16} />
          <span>3. محاكي تزوير الويب هوك (Webhook)</span>
        </button>

        <button
          type="button"
          className={`tool-nav-btn ${activeTool === 'race_condition' ? 'active' : ''}`}
          onClick={() => setActiveTool('race_condition')}
        >
          <Layers size={16} />
          <span>4. محاكي السحب المزدوج (Race Condition)</span>
        </button>

        <button
          type="button"
          className={`tool-nav-btn ${activeTool === 'risk_calculator' ? 'active' : ''}`}
          onClick={() => setActiveTool('risk_calculator')}
        >
          <Sparkles size={16} />
          <span>5. محلل مؤشر المخاطر الجغرافي (Risk Score)</span>
        </button>
      </div>

      {/* TOOL 1: Carding Simulator */}
      {activeTool === 'carding' && (
        <div className="tool-box-container">
          <div className="tool-header-block">
            <div>
              <h3>محاكي هجمات تجريف البطاقات وسرعة الطلبات (Carding Velocity Attack)</h3>
              <p>
                يقوم المحتالون بإرسال عشرات الطلبات المتتالية بأرقام بطاقات عشوائية لتحديد البطاقات الصالحة.
                هذه الأداة تحاكي هذا الهجوم لاختبار سرعة تفعيل درع Rate-Limiting وعزل الـ IP.
              </p>
            </div>
            <div className="tool-actions-top">
              <label className="rate-selector-label">
                <span>كثافة الطلبات:</span>
                <select
                  value={velocityRate}
                  onChange={e => setVelocityRate(Number(e.target.value))}
                  disabled={cardingRunning}
                >
                  <option value={5}>5 طلبات / ثانية (ضغط خفيف)</option>
                  <option value={15}>15 طلباً / ثانية (هجوم متوسط)</option>
                  <option value={30}>30 طلباً / ثانية (هجوم مكثف)</option>
                </select>
              </label>

              <button
                type="button"
                className="btn-run-attack"
                disabled={cardingRunning}
                onClick={handleStartCardingSimulation}
              >
                {cardingRunning ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
                <span>{cardingRunning ? 'جاري تنفيذ الهجوم…' : 'إطلاق محاكاة الهجوم'}</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="carding-stats-grid">
            <div className="c-stat-box">
              <span className="stat-label">إجمالي الطلبات المرسلة</span>
              <span className="stat-val">{cardingStats.sent} / {velocityRate}</span>
            </div>
            <div className="c-stat-box">
              <span className="stat-label">الطلبات المسموحة</span>
              <span className="stat-val allowed">{cardingStats.allowed}</span>
            </div>
            <div className="c-stat-box">
              <span className="stat-label">الطلبات المحظورة بالدرع</span>
              <span className="stat-val blocked">{cardingStats.blocked}</span>
            </div>
            <div className="c-stat-box">
              <span className="stat-label">حالة حظر الـ IP (Banned)</span>
              <span className={`stat-val ${cardingStats.ipBanned ? 'banned' : ''}`}>
                {cardingStats.ipBanned ? '🔴 محظور ومدرج بالقائمة' : '🟢 قيد المراقبة'}
              </span>
            </div>
          </div>

          {/* Live Terminal Log */}
          <div className="terminal-wrapper" ref={terminalRef}>
            <div className="terminal-top-bar">
              <span className="terminal-dot red" />
              <span className="terminal-dot yellow" />
              <span className="terminal-dot green" />
              <span className="terminal-title">سجل هجوم البطاقات المباشر (Simulator Terminal Output)</span>
            </div>
            <div className="terminal-body">
              {cardingLogs.length === 0 ? (
                <div className="terminal-placeholder">
                  اضغط على زر &quot;إطلاق محاكاة الهجوم&quot; للبدء في توليد الطلبات وفحص استجابة درع الأمان...
                </div>
              ) : (
                cardingLogs.map(log => (
                  <div key={log.id} className={`terminal-log-line log-${log.type}`}>
                    <span className="log-time">[{log.time}]</span>
                    <span className="log-msg">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOOL 2: Parameter Tampering */}
      {activeTool === 'tampering' && (
        <div className="tool-box-container">
          <div className="tool-header-block">
            <div>
              <h3>محاكي التلاعب ببيانات ومبالغ الدفع (Parameter & Amount Tampering)</h3>
              <p>
                يقوم المهاجم باعتراض طلب الدفع (MITM) وتغيير قيمة المنتج من 3,500 ريال إلى 1.00 ريال بهدف الشراء بسعر رمزي.
                هذه الأداة تختبر ما إذا كان نظام التوقيع المشفر (HMAC Hash) سيكشف التغيير أم لا.
              </p>
            </div>
          </div>

          <div className="tampering-playground">
            <div className="payload-box original">
              <div className="box-badge">الطلب الأصلي من المتجر</div>
              <div className="field-group">
                <label>اسم المنتج:</label>
                <input type="text" readOnly value="MacBook Pro M3 Max" />
              </div>
              <div className="field-group">
                <label>المبلغ الأصلي:</label>
                <input
                  type="text"
                  value={originalAmount}
                  onChange={e => setOriginalAmount(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label>العملة:</label>
                <input type="text" readOnly value="SAR" />
              </div>
            </div>

            <div className="tampering-arrow">
              <AlertTriangle size={24} />
              <span>اعتراض وتعديل</span>
            </div>

            <div className="payload-box tampered">
              <div className="box-badge danger">الطلب المعدل بواسطة المهاجم</div>
              <div className="field-group">
                <label>اسم المنتج:</label>
                <input type="text" readOnly value="MacBook Pro M3 Max" />
              </div>
              <div className="field-group">
                <label>المبلغ بعد التلاعب:</label>
                <input
                  type="text"
                  value={tamperedAmount}
                  onChange={e => setTamperedAmount(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label>العملة:</label>
                <select
                  value={tamperedCurrency}
                  onChange={e => setTamperedCurrency(e.target.value)}
                >
                  <option value="SAR">SAR (ريال سعودي)</option>
                  <option value="USD">USD (تغيير العملة)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="tampering-action-row">
            <button
              type="button"
              className="btn-test-tampering"
              onClick={handleTestTampering}
            >
              <Play size={16} />
              <span>إرسال الطلب المتلاعب به وفحص صمود التوقيع الرقمي</span>
            </button>
          </div>

          {tamperingResult.status === 'blocked' && (
            <div className="tampering-result-card success">
              <CheckCircle2 size={24} />
              <div>
                <h4>تم صد التلاعب بنجاح! البوابة رفضت المعاملة</h4>
                <p>{tamperingResult.details}</p>
                <div className="hash-details-grid">
                  <div>
                    <small>الهاش المحسوب من خادم البوابة:</small>
                    <code>{tamperingResult.hashExpected}</code>
                  </div>
                  <div>
                    <small>الهاش المرسل من الطلب المتلاعب به:</small>
                    <code>{tamperingResult.hashSent}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: Webhook Signature Forgery */}
      {activeTool === 'webhook_forgery' && (
        <div className="tool-box-container">
          <div className="tool-header-block">
            <div>
              <h3>محاكي تزوير إشعارات الويب هوك (Webhook Signature Forgery)</h3>
              <p>
                يحاول المحتال إرسال إشعار وهمي (Fake Webhook Payload) يفيد بأن العملية مدفوعة بنجاح (Paid)
                دون امتلاك المفتاح السري (Webhook Secret Key) لخداع المتجر لتسليم المنتج دون دفع حقيقي.
              </p>
            </div>
          </div>

          <div className="webhook-test-box">
            <div className="webhook-code-mock">
              <pre>
{`POST /api/webhooks/payment-callback HTTP/1.1
Host: your-store.com
Content-Type: application/json
X-Signature: INVALID_FORGED_SIGNATURE_HASH_99182a

{
  "event": "transaction.success",
  "order_id": "ORD-948102",
  "amount": 2500.00,
  "currency": "SAR",
  "status": "PAID"
}`}
              </pre>
            </div>

            <button
              type="button"
              className="btn-test-webhook"
              onClick={handleTestWebhookForgery}
            >
              <Zap size={16} />
              <span>إرسال إشعار Webhook المزور واختبار نظام التحقق</span>
            </button>

            {webhookStatus.tested && (
              <div className="webhook-res-banner">
                <CheckCircle2 size={24} />
                <div>
                  <h4>نجاح الدفاع الأمني: الويب هوك المزور رُفض فوراً</h4>
                  <p>{webhookStatus.reason}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOOL 4: Race Condition */}
      {activeTool === 'race_condition' && (
        <div className="tool-box-container">
          <div className="tool-header-block">
            <div>
              <h3>محاكي هجمات السحب المزدوج والتسابق (Race Condition & Double Spend)</h3>
              <p>
                إرسال طلبين في نفس الجزء من الثانية (Millisecond) لنفس الرصيد أو نفس العملية لاختبار هل يمكن استغلال
                تأخير المعالجة وسحب الرصيد مرتين قبل تحديث قاعدة البيانات.
              </p>
            </div>
          </div>

          <div className="race-test-panel">
            <button
              type="button"
              className="btn-run-race"
              onClick={handleTestRaceCondition}
            >
              <Layers size={16} />
              <span>إرسال عمليتي دفع متزامنتين في جزء من الثانية (Race Simulation)</span>
            </button>

            {raceResult.tested && (
              <div className="race-results-display">
                <div className="thread-card success">
                  <span className="thread-title">مسار المعالجة الأول:</span>
                  <p>{raceResult.thread1}</p>
                </div>
                <div className="thread-card blocked">
                  <span className="thread-title">مسار المعالجة المتزامن (الاحتيالي):</span>
                  <p>{raceResult.thread2}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOOL 5: Risk Calculator */}
      {activeTool === 'risk_calculator' && (
        <div className="tool-box-container">
          <div className="tool-header-block">
            <div>
              <h3>محلل وحاسبة مؤشر مخاطر الاحتيال (Fraud Risk Scoring Engine)</h3>
              <p>
                يحسب مؤشر الخطر (من 0 إلى 100) بناءً على تطابق دولة البطاقة مع دولة الـ IP ونوع الاتصال وقيمة المعاملة.
              </p>
            </div>
          </div>

          <div className="risk-calc-grid">
            <div className="calc-inputs-col">
              <div className="c-input-group">
                <label>دولة عنوان الـ IP للعميل:</label>
                <select value={riskCountryIp} onChange={e => setRiskCountryIp(e.target.value)}>
                  <option value="SA">🇸🇦 المملكة العربية السعودية</option>
                  <option value="AE">🇦🇪 الإمارات العربية المتحدة</option>
                  <option value="KW">🇰🇼 الكويت</option>
                  <option value="US">🇺🇸 الولايات المتحدة الأمريكية</option>
                  <option value="DE">🇩🇪 ألمانيا / خادم سحابي</option>
                </select>
              </div>

              <div className="c-input-group">
                <label>دولة بنك إصدار البطاقة (BIN Country):</label>
                <select value={riskCountryCard} onChange={e => setRiskCountryCard(e.target.value)}>
                  <option value="SA">🇸🇦 المملكة العربية السعودية (مدى / الراجحي)</option>
                  <option value="AE">🇦🇪 الإمارات (بنك دبي الوطني)</option>
                  <option value="KW">🇰🇼 الكويت (بنك الكويت الوطني)</option>
                  <option value="US">🇺🇸 أمريكا (Chase Bank)</option>
                </select>
              </div>

              <div className="c-input-group">
                <label>نوع الاتصال ومستوى التخفي:</label>
                <select
                  value={riskProxyType}
                  onChange={e => setRiskProxyType(e.target.value as any)}
                >
                  <option value="direct">اتصال منزلي مباشر (Residential/Fiber)</option>
                  <option value="vpn">VPN تجاري كاشف (NordVPN/ExpressVPN)</option>
                  <option value="tor">شبكة Tor / خادم Data Center مشبوه</option>
                  <option value="residential">بروكسي سكني متقدم (Residential Proxy)</option>
                </select>
              </div>

              <div className="c-input-group">
                <label>قيمة العملية (SAR):</label>
                <input
                  type="number"
                  value={riskAmount}
                  onChange={e => setRiskAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="calc-result-col">
              <div className="score-meter-box">
                <span className="meter-label">مؤشر المخاطر المحسوب:</span>
                <div className={`score-circle ${calculatedRiskScore > 60 ? 'high' : calculatedRiskScore > 30 ? 'medium' : 'low'}`}>
                  <span className="score-number">{calculatedRiskScore}</span>
                  <span className="score-total">/ 100</span>
                </div>

                <div className="score-decision">
                  {calculatedRiskScore >= 70 ? (
                    <span className="decision-tag block">🔴 القرار التلقائي: حظر فوري (AUTO-BLOCK)</span>
                  ) : calculatedRiskScore >= 40 ? (
                    <span className="decision-tag review">🟡 القرار التلقائي: تحويل للتحقق الثنائي 3DS2 الإلزامي ومراجعة يدوية</span>
                  ) : (
                    <span className="decision-tag approve">🟢 القرار التلقائي: قبول وتمرير آمن (AUTO-APPROVE)</span>
                  )}
                </div>

                <div className="risk-factors-breakdown">
                  <span className="factors-title">أسباب تقييم الخطر:</span>
                  <ul>
                    {riskCountryIp !== riskCountryCard && (
                      <li className="danger">تطابق جغرافي مفقود: دولة الـ IP ({riskCountryIp}) تختلف عن دولة إصدار البطاقة ({riskCountryCard}) (+40 نقطة).</li>
                    )}
                    {riskProxyType === 'vpn' && (
                      <li className="warn">تم كشف استخدام خادم VPN تجاري (+25 نقطة).</li>
                    )}
                    {riskProxyType === 'tor' && (
                      <li className="danger">تم رصد اتصال عبر شبكة Tor / خوادم إخفاء هوية (+40 نقطة).</li>
                    )}
                    {Number(riskAmount) > 3000 && (
                      <li className="warn">قيمة العملية تتجاوز 3,000 ريال (+15 نقطة).</li>
                    )}
                    {riskCountryIp === riskCountryCard && riskProxyType === 'direct' && (
                      <li className="good">تطابق جغرافي مثالي واتصال محلي آمن ومباشر.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
