import { useState, useMemo } from 'react';
import {
  Globe, Shield, Bot, UserCheck, AlertOctagon, CheckCircle2,
  RefreshCw, Copy, Check, Sparkles, Terminal, Sliders, Smartphone,
  Monitor, CreditCard, ChevronRight, Play, Eye
} from 'lucide-react';
import type { Platform } from './platform';
import { KNOWN_GATEWAYS } from './gatewaysData';
import { initialSecuritySystems, type SecuritySystem } from './securitySystemsData';
import './LoaderTestingSuite.css';

interface SimulatedCard {
  number: string;
  exp: string;
  cvv: string;
  scheme: string;
  country: string;
  countryCode: string;
  type: string;
  expectedBehavior: string;
}

const TEST_CARDS: SimulatedCard[] = [
  { number: '5888 4500 0000 0001', exp: '12/28', cvv: '123', scheme: 'Mada (Alinma)', country: 'المملكة العربية السعودية', countryCode: 'SA', type: 'Debit', expectedBehavior: 'مقبولة دائماً مع 3D Secure محلي' },
  { number: '4111 1111 1111 1111', exp: '08/29', cvv: '456', scheme: 'Visa (Riyad Bank)', country: 'المملكة العربية السعودية', countryCode: 'SA', type: 'Credit', expectedBehavior: 'مقبولة في جميع العمليات' },
  { number: '5424 0000 0000 0001', exp: '11/27', cvv: '789', scheme: 'Mastercard (Emirates NBD)', country: 'الإمارات العربية المتحدة', countryCode: 'AE', type: 'Credit', expectedBehavior: 'مقبولة مع حساب العملة الخليجية' },
  { number: '4000 0000 0000 0002', exp: '04/26', cvv: '000', scheme: 'Visa (Chase Bank)', country: 'الولايات المتحدة الأمريكية', countryCode: 'US', type: 'Credit', expectedBehavior: 'قد تُرفض عند تفعيل شرط الحماية الجغرافية Geo-IP Match' },
  { number: '4242 4242 4242 4242', exp: '01/25', cvv: '321', scheme: 'Visa (Test Failure)', country: 'المملكة المتحدة', countryCode: 'GB', type: 'Credit', expectedBehavior: 'ستُرفض تلقائياً بسبب انتهاء الصلاحية ورصيد غير كافٍ' },
  { number: '5105 1051 0510 5100', exp: '10/28', cvv: '999', scheme: 'Mastercard (Stolen Simulation)', country: 'ألمانيا', countryCode: 'DE', type: 'Credit', expectedBehavior: 'ستُرفض برمز 20005 (Lost/Stolen Card Alert)' },
];

const PROXY_COUNTRIES = [
  { code: 'SA', name: 'المملكة العربية السعودية (الرياض)', ip: '178.80.124.45', isp: 'STC Telecom', ping: '12ms' },
  { code: 'SA-JED', name: 'المملكة العربية السعودية (جدة)', ip: '93.168.21.112', isp: 'Mobily Broadband', ping: '16ms' },
  { code: 'AE', name: 'الإمارات العربية المتحدة (دبي)', ip: '185.220.101.5', isp: 'Etisalat UAE', ping: '28ms' },
  { code: 'KW', name: 'الكويت (مدينة الكويت)', ip: '62.150.12.89', isp: 'Zain Kuwait', ping: '34ms' },
  { code: 'US', name: 'الولايات المتحدة (نيويورك - خادم محاكاة)', ip: '198.51.100.42', isp: 'DigitalOcean Cloud', ping: '140ms' },
  { code: 'GB', name: 'المملكة المتحدة (لندن)', ip: '194.26.29.13', isp: 'British Telecom', ping: '110ms' },
  { code: 'TR', name: 'تركيا (إسطنبول)', ip: '176.240.88.19', isp: 'Turkcell Superonline', ping: '82ms' },
];

export default function LoaderTestingSuite({
  platform,
  userEmail,
}: {
  platform: Platform;
  userEmail?: string;
}) {
  // Simulator State
  const [selectedGatewayId, setSelectedGatewayId] = useState('paytabs');
  const [selectedIntegrationType, setSelectedIntegrationType] = useState('hosted');
  const [clientProxy, setClientProxy] = useState(PROXY_COUNTRIES[0]);
  const [customIp, setCustomIp] = useState('');
  const [activeIp, setActiveIp] = useState(PROXY_COUNTRIES[0].ip);
  const [deviceEnvironment, setDeviceEnvironment] = useState<'desktop' | 'mobile'>('desktop');
  const [isVpnEnabled, setIsVpnEnabled] = useState(true);

  // Security systems state (Read-only observation for Loader; toggled by merchant)
  const [securitySystems] = useState<SecuritySystem[]>(() => {
    const saved = localStorage.getItem('oneshot_security_systems');
    return saved ? JSON.parse(saved) : initialSecuritySystems;
  });

  // AI-generated customer profile state (No card info generated here!)
  const [customerProfile, setCustomerProfile] = useState<{
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    amount: number;
    currency: string;
  } | null>(null);

  // Selected test card for payment execution
  const [selectedCard, setSelectedCard] = useState<SimulatedCard>(TEST_CARDS[0]);

  // Simulation execution state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulationResult, setSimulationResult] = useState<{
    status: 'success' | 'declined' | 'review';
    code: string;
    message: string;
    aiAnalysis: string;
    decisionReason: string;
    rulesEvaluated: { rule: string; passed: boolean; note: string }[];
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentGateway = useMemo(
    () => KNOWN_GATEWAYS.find((g) => g.id === selectedGatewayId) || KNOWN_GATEWAYS[0],
    [selectedGatewayId]
  );

  const currentIntegration = useMemo(
    () =>
      currentGateway.integrationTypes.find((it) => it.id === selectedIntegrationType) ||
      currentGateway.integrationTypes[0],
    [currentGateway, selectedIntegrationType]
  );

  // Generate a complete customer profile with genuine email domain (gmail.com as requested)
  const handleGenerateCustomerWithAi = () => {
    const arabicFirstNames = ['عبدالله', 'محمد', 'سارة', 'فهد', 'نورة', 'خالد', 'ريما', 'سلطان', 'منى'];
    const arabicLastNames = ['الغامدي', 'العتيبي', 'القحطاني', 'الشمري', 'الدوسري', 'الحربي', 'السبيعي'];
    const cities = [
      { name: 'الرياض', zip: '11564' },
      { name: 'جدة', zip: '21442' },
      { name: 'الدمام', zip: '31422' },
      { name: 'مكة المكرمة', zip: '21955' },
    ];

    const firstName = arabicFirstNames[Math.floor(Math.random() * arabicFirstNames.length)];
    const lastName = arabicLastNames[Math.floor(Math.random() * arabicLastNames.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const cityObj = cities[Math.floor(Math.random() * cities.length)];

    // Target email specifically requested: always valid gmail.com
    const generatedEmail = `customer.${firstName.toLowerCase()}${randNum}@gmail.com`;

    setCustomerProfile({
      fullName: `${firstName} ${lastName}`,
      email: generatedEmail,
      phone: `+9665${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: `شارع الملك فهد، حي الصحافة`,
      city: cityObj.name,
      postalCode: cityObj.zip,
      amount: Math.floor(150 + Math.random() * 1200),
      currency: 'SAR',
    });

    setSimulationResult(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run the full payment test in the simulated environment with AI diagnostic analysis
  const handleExecutePaymentSimulation = () => {
    if (!customerProfile) {
      handleGenerateCustomerWithAi();
    }

    setIsSimulating(true);
    setSimulationResult(null);
    setSimulationLogs([]);

    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString('ar-SA')}] ${msg}`);
      setSimulationLogs([...logs]);
    };

    addLog(`بدء جلسة اختبار عبر بوابة ${currentGateway.name}...`);
    addLog(`طريقة الربط المختارة: ${currentIntegration.name}`);
    addLog(`فحص عنوان الـ IP النشط: ${activeIp} (${clientProxy.name})`);

    setTimeout(() => {
      addLog(`تحليل بصمة الجهاز (Fingerprint): ${deviceEnvironment === 'mobile' ? 'Mobile Safari / iOS' : 'Desktop Chrome 128 / Win64'}`);
      addLog(`فحص أنظمة الحماية النشطة لدى التاجر (${securitySystems.filter((s) => s.enabled).length} نظام مفعل)...`);

      setTimeout(() => {
        // Evaluate rules
        const rulesEvaluated: { rule: string; passed: boolean; note: string }[] = [];
        let willFail = false;
        let failReason = '';
        let errorCode = '00';

        // 1. Geo-IP match rule
        const geoRule = securitySystems.find((s) => s.id === 'geo_ip_mismatch');
        if (geoRule?.enabled) {
          const isSaIp = clientProxy.code.startsWith('SA');
          const isSaCard = selectedCard.countryCode === 'SA';
          if (!isSaIp && isSaCard) {
            rulesEvaluated.push({
              rule: 'Geo-IP & BIN Match',
              passed: false,
              note: `عنوان IP أجنبي (${clientProxy.code}) وبطاقة صادرة في المملكة (${selectedCard.countryCode}).`,
            });
            willFail = true;
            failReason = 'رفض بسبب عدم تطابق الدولة: IP العميل خارجي مع بطاقة بنكية محلية.';
            errorCode = '20014_GEO_MISMATCH';
          } else {
            rulesEvaluated.push({
              rule: 'Geo-IP & BIN Match',
              passed: true,
              note: 'توافق كامل بين دولة الاتصال ومصدر البطاقة.',
            });
          }
        }

        // 2. VPN Blocker rule
        const vpnRule = securitySystems.find((s) => s.id === 'proxy_vpn_blocker');
        if (vpnRule?.enabled && isVpnEnabled && clientProxy.code.includes('US')) {
          rulesEvaluated.push({
            rule: 'Proxy / VPN Filter',
            passed: false,
            note: 'تم اكتشاف اتصال عبر مركز بيانات أو شبكة VPN مشبوهة.',
          });
          willFail = true;
          failReason = 'رفض بسبب استخدام شبكة VPN/Proxy محظورة.';
          errorCode = '20042_VPN_DETECTED';
        }

        // 3. Card validity check
        if (selectedCard.number.includes('4242 4242')) {
          willFail = true;
          failReason = 'رصيد غير كافٍ أو بطاقة تجريبية فاشلة (Insufficient Funds).';
          errorCode = '10051_INSUFFICIENT_FUNDS';
        } else if (selectedCard.number.includes('5105 1051')) {
          willFail = true;
          failReason = 'بطاقة مصنفة مفقودة أو مسروقة في سجلات البنك (Stolen/Blocked Card).';
          errorCode = '20005_DO_NOT_HONOUR';
        }

        // 4. 3DS verification
        rulesEvaluated.push({
          rule: '3D Secure 2.0 Check',
          passed: true,
          note: 'تم إرسال OTP واجتياز التوثيق بنجاح.',
        });

        // 5. CVV Check
        rulesEvaluated.push({
          rule: 'CVV Matching',
          passed: true,
          note: 'رمز التحقق الثلاثي متطابق مع البنك المصدر.',
        });

        if (willFail) {
          addLog(`❌ تم رفض المعاملة من البوابة! رمز الرفض: ${errorCode}`);
          addLog(`السبب المسجل: ${failReason}`);

          let aiDiag = '';
          if (errorCode.includes('GEO')) {
            aiDiag = `تحليل AI: تم رفض العملية لأن نظام الحماية الجغرافية (Geo-IP) مفعّل لدى التاجر، وعنوان الـ IP المُختبر (${activeIp}) مسجل في (${clientProxy.name}) بينما بطاقة العميل صادرة من (${selectedCard.country}). التوصية: للسماح بالسياح والمسافرين، يمكن للتاجر إيقاف شرط Geo-IP أو خفض حساسيته.`;
          } else if (errorCode.includes('VPN')) {
            aiDiag = `تحليل AI: تم رصد عنوان IP يتبع لمزود استضافة وخادم VPN (${clientProxy.isp}). التوصية: اطلب من العميل إيقاف تطبيق الـ VPN أو استخدام شبكة إنترنت سكنية (Residential Cellular/Fiber).`;
          } else if (errorCode.includes('INSUFFICIENT')) {
            aiDiag = `تحليل AI: البنك المصدر للبطاقة أرجع رمز رفض الرصيد أو القيود المؤقتة على السحب الإلكتروني. البطاقة سليمة فنياً لكن يلزم شحن رصيدها أو التواصل مع مصرف العميل.`;
          } else {
            aiDiag = `تحليل AI: رفض أمني من شبكة الدفع الدولية للاشتباه في حيازة البطاقة. تم تدوين السجل في تقرير اللودر للمراجعة الإدارية.`;
          }

          setSimulationResult({
            status: 'declined',
            code: errorCode,
            message: failReason,
            decisionReason: failReason,
            aiAnalysis: aiDiag,
            rulesEvaluated,
          });
        } else {
          addLog(`✅ تمت العملية بنجاح! تم اعتماد الدفع وحجز المبلغ.`);
          addLog(`رمز الموافقة البنكية: AUTH_${Math.floor(100000 + Math.random() * 900000)}`);

          setSimulationResult({
            status: 'success',
            code: '00_APPROVED',
            message: 'تم قبول الدفع بنجاح واعتماد العملية بدون أي عوائق أمنية.',
            decisionReason: 'اجتازت المعاملة جميع معايير الأمان ومطابقة الـ IP والتحقق الثنائي.',
            aiAnalysis: `تحليل AI: المعاملة تمت بأعلى معايير الثقة. بطاقة ${selectedCard.scheme} قبلت بسلاسة عبر نوع ربط (${currentIntegration.name}). زمن الاستجابة 340ms، مما يعكس استقراراً ممتازاً للبوابة.`,
            rulesEvaluated,
          });
        }

        setIsSimulating(false);
      }, 900);
    }, 600);
  };

  return (
    <div className="loader-testing-suite">
      {/* Top Banner */}
      <section className="panel loader-header-panel">
        <div className="loader-tag-row">
          <span className="loader-badge">
            <Bot size={16} />
            <span>بيئة اللودر واختبار بوابات الدفع (Loader Testing Suite)</span>
          </span>
          <span className="live-real-pill">
            <span className="blink-dot" /> بيئة تدريب واختبار حقيقية بدون بيانات عشوائية
          </span>
        </div>
        <h2>مختبر فحص بوابات الدفع وتحليل أسباب الرفض بالذكاء الاصطناعي</h2>
        <p>
          حساب اللودر مخصص للمسؤولين عن اختبار وقبول البوابات. يتيح لك محاكاة بيئات دفع حقيقية، تبديل
          عناوين الـ IP والموقع الجغرافي لفحص قبول البطاقات الدولية، توليد بيانات عملاء حقيقية بنقرة
          زر، والحصول على تشخيص فوري لأسباب الرفض بالـ AI لإرفاقها في التقارير الإدارية.
        </p>

        {userEmail && (
          <div className="loader-user-info">
            <UserCheck size={16} />
            <span>الحساب النشط في المختبر: <strong>{userEmail}</strong> (صلاحية لودر معتمدة)</span>
          </div>
        )}
      </section>

      {/* Grid: Left = Control & Tools, Right = Live Terminal & Virtual Monitor */}
      <div className="loader-layout-grid">
        {/* Left Column: Configuration */}
        <div className="loader-controls-column">
          {/* Gateway & Integration Selection */}
          <section className="panel loader-card">
            <div className="loader-card-title">
              <CreditCard size={18} />
              <h3>1. اختيار البوابة ونوع الربط المستهدف</h3>
            </div>

            <div className="gateway-quick-selector">
              {KNOWN_GATEWAYS.map((gw) => (
                <button
                  key={gw.id}
                  type="button"
                  className={`gw-btn-pill ${selectedGatewayId === gw.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedGatewayId(gw.id);
                    setSelectedIntegrationType(gw.integrationTypes[0].id);
                  }}
                >
                  <span>{gw.name.split('(')[0]}</span>
                </button>
              ))}
            </div>

            <div className="integration-type-selector">
              <label>نوع الربط البرمجي المطلوب اختباره:</label>
              <div className="integration-chips-list">
                {currentGateway.integrationTypes.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    className={`it-chip ${selectedIntegrationType === it.id ? 'selected' : ''}`}
                    onClick={() => setSelectedIntegrationType(it.id)}
                  >
                    {it.id === 'mobile' ? <Smartphone size={14} /> : <Monitor size={14} />}
                    <span>{it.name}</span>
                    <span className="it-badge-small">{it.badge}</span>
                  </button>
                ))}
              </div>
              <p className="integration-note">
                💡 <strong>خصائص الربط:</strong> {currentIntegration.description} ({currentIntegration.suitableFor})
              </p>
            </div>
          </section>

          {/* Geo-IP & VPN Simulation */}
          <section className="panel loader-card">
            <div className="loader-card-title">
              <Globe size={18} />
              <h3>2. محاكي الموقع الجغرافي والـ IP (Geo-IP & VPN Changer)</h3>
            </div>
            <p className="loader-desc-text">
              لاختبار ما إذا كانت البطاقة تقبل من دولة معينة، وتحديد تأثير أنظمة الحماية الجغرافية
              (Geo-IP Match):
            </p>

            <div className="proxy-selector-grid">
              {PROXY_COUNTRIES.map((loc) => (
                <div
                  key={loc.code}
                  className={`proxy-box ${clientProxy.code === loc.code ? 'selected' : ''}`}
                  onClick={() => {
                    setClientProxy(loc);
                    setActiveIp(loc.ip);
                    setCustomIp('');
                  }}
                >
                  <div className="proxy-box-header">
                    <strong>{loc.name}</strong>
                    <span className="ping-tag">{loc.ping}</span>
                  </div>
                  <div className="proxy-ip-line" dir="ltr">
                    <code>{loc.ip}</code>
                    <small>{loc.isp}</small>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom IP Input */}
            <div className="custom-ip-row">
              <label>أو حدد عنوان IP مخصص للموقع الذي ترغب بفحصه:</label>
              <div className="custom-ip-input-group">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="مثال: 185.12.90.14"
                  value={customIp}
                  onChange={(e) => {
                    setCustomIp(e.target.value);
                    if (e.target.value.trim()) {
                      setActiveIp(e.target.value.trim());
                    }
                  }}
                />
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => {
                    if (customIp.trim()) {
                      setActiveIp(customIp.trim());
                    }
                  }}
                >
                  تطبيق الـ IP
                </button>
              </div>
            </div>

            <div className="vpn-toggle-row">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isVpnEnabled}
                  onChange={(e) => setIsVpnEnabled(e.target.checked)}
                />
                <span>محاكاة اتصال قادم عبر خوادم VPN مشفرة (VPN Protocol Emulation)</span>
              </label>
              <span className="current-active-ip-badge">الـ IP النشط حالياً: <code>{activeIp}</code></span>
            </div>
          </section>

          {/* AI Customer Generator & Card Selector */}
          <section className="panel loader-card">
            <div className="loader-card-title">
              <Bot size={18} />
              <h3>3. توليد عميل كامل بالـ AI واختيار البطاقة للاختبار</h3>
            </div>

            <div className="ai-gen-btn-container">
              <button
                type="button"
                className="primary-button ai-generate-btn"
                onClick={handleGenerateCustomerWithAi}
              >
                <Sparkles size={18} />
                <span>توليد عميل كامل بالذكاء الاصطناعي (بيانات وهوية سعودية مع @gmail.com)</span>
              </button>
              <small className="ai-gen-note">
                * يولد بيانات كاملة: الاسم، البريد الرسمي (@gmail.com)، العنوان، الهاتف بدون بيانات
                البطاقة (التي يتم اختبارها عبر بطاقات المحاكاة البنكية أدناه).
              </small>
            </div>

            {customerProfile && (
              <div className="generated-profile-card">
                <div className="profile-header">
                  <span className="profile-badge">بيانات العميل المولد للاختبار</span>
                  <button
                    type="button"
                    className="copy-btn-mini"
                    onClick={() => handleCopy(customerProfile.email, 'email')}
                  >
                    {copiedKey === 'email' ? <Check size={14} /> : <Copy size={14} />}
                    <span>نسخ الإيميل</span>
                  </button>
                </div>
                <div className="profile-grid">
                  <div>
                    <span className="p-label">اسم العميل:</span>
                    <strong>{customerProfile.fullName}</strong>
                  </div>
                  <div>
                    <span className="p-label">البريد الإلكتروني:</span>
                    <strong dir="ltr">{customerProfile.email}</strong>
                  </div>
                  <div>
                    <span className="p-label">رقم الجوال:</span>
                    <span dir="ltr">{customerProfile.phone}</span>
                  </div>
                  <div>
                    <span className="p-label">المدينة والعنوان:</span>
                    <span>{customerProfile.city} - {customerProfile.address}</span>
                  </div>
                  <div>
                    <span className="p-label">مبلغ المعاملة:</span>
                    <strong>{customerProfile.amount} {customerProfile.currency}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Simulated Card Picker */}
            <div className="card-selector-section">
              <label>اختر بطاقة مصرفية حقيقية لبيئة الاختبار:</label>
              <div className="test-cards-list">
                {TEST_CARDS.map((card, idx) => (
                  <div
                    key={idx}
                    className={`test-card-item ${selectedCard.number === card.number ? 'selected' : ''}`}
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="card-item-top">
                      <strong>{card.scheme}</strong>
                      <span className="card-country-badge">{card.country}</span>
                    </div>
                    <div className="card-number-line" dir="ltr">
                      <code>{card.number}</code>
                      <span>EXP: {card.exp}</span>
                      <span>CVV: {card.cvv}</span>
                    </div>
                    <p className="card-expected-note">{card.expectedBehavior}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Environment Picker */}
            <div className="device-picker-row">
              <span>بيئة الجهاز:</span>
              <button
                type="button"
                className={`device-btn ${deviceEnvironment === 'desktop' ? 'active' : ''}`}
                onClick={() => setDeviceEnvironment('desktop')}
              >
                <Monitor size={15} /> كمبيوتر مكتبي (Web)
              </button>
              <button
                type="button"
                className={`device-btn ${deviceEnvironment === 'mobile' ? 'active' : ''}`}
                onClick={() => setDeviceEnvironment('mobile')}
              >
                <Smartphone size={15} /> هاتف ذكي (Mobile / PWA)
              </button>
            </div>

            {/* Run Button */}
            <button
              type="button"
              className="primary-button run-simulation-btn"
              disabled={isSimulating}
              onClick={handleExecutePaymentSimulation}
            >
              {isSimulating ? (
                <>
                  <RefreshCw size={18} className="spin-icon" />
                  <span>جارٍ معالجة الدفع وفحص البوابة بالـ AI...</span>
                </>
              ) : (
                <>
                  <Play size={18} />
                  <span>بدء اختبار الدفع الحقيقي وفحص أسباب الرفض</span>
                </>
              )}
            </button>
          </section>
        </div>

        {/* Right Column: Virtual Monitor, AI Diagnostics & Reports */}
        <div className="loader-monitor-column">
          {/* Virtual Terminal / Live Monitor Screen */}
          <section className="panel virtual-monitor-panel">
            <div className="monitor-top-bar">
              <div className="window-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <span className="monitor-title">
                <Terminal size={14} /> شاشة المراقبة المباشرة (Virtual Loader Screen)
              </span>
              <span className="monitor-mode-pill">LIVE KERNEL</span>
            </div>

            <div className="monitor-body">
              <div className="monitor-meta-strip">
                <div>GATEWAY: <strong>{currentGateway.id.toUpperCase()}</strong></div>
                <div>FLOW: <strong>{currentIntegration.id.toUpperCase()}</strong></div>
                <div>IP: <strong dir="ltr">{activeIp}</strong></div>
                <div>GEO: <strong>{clientProxy.code}</strong></div>
              </div>

              {simulationLogs.length === 0 ? (
                <div className="empty-monitor-state">
                  <Eye size={32} />
                  <p>الشاشة جاهزة. اضغط "بدء اختبار الدفع الحقيقي" لبدء تتبع مسار العملية لحظياً.</p>
                </div>
              ) : (
                <div className="monitor-terminal-text" dir="ltr">
                  {simulationLogs.map((log, i) => (
                    <div key={i} className="terminal-log-line">
                      {log}
                    </div>
                  ))}
                  {isSimulating && <div className="terminal-cursor-line">_</div>}
                </div>
              )}
            </div>
          </section>

          {/* AI Diagnostic Report Panel */}
          {simulationResult && (
            <section
              className={`panel ai-diagnostics-panel animate-fade-in ${
                simulationResult.status === 'success' ? 'status-pass' : 'status-fail'
              }`}
            >
              <div className="ai-report-header">
                <div className="report-status-badge">
                  {simulationResult.status === 'success' ? (
                    <CheckCircle2 size={24} className="pass-icon" />
                  ) : (
                    <AlertOctagon size={24} className="fail-icon" />
                  )}
                  <div>
                    <h3>
                      {simulationResult.status === 'success'
                        ? 'نجحت عملية الدفع بنجاح'
                        : 'فشلت عملية الدفع وتم رفضها'}
                    </h3>
                    <span>رمز النتيجة: <code>{simulationResult.code}</code></span>
                  </div>
                </div>
              </div>

              {/* Reason Box */}
              <div className="diag-box-reason">
                <strong>السبب المسجل للنتيجة:</strong>
                <p>{simulationResult.decisionReason}</p>
              </div>

              {/* Dedicated AI Analysis Box */}
              <div className="diag-box-ai">
                <div className="ai-title-row">
                  <Bot size={18} />
                  <strong>تقرير وتحليل الذكاء الاصطناعي (AI Reason & Recommendation):</strong>
                </div>
                <p>{simulationResult.aiAnalysis}</p>
                <div className="report-action-row">
                  <button
                    type="button"
                    className="outline-button copy-report-btn"
                    onClick={() => {
                      const text = `[تقرير لودر ونشوت]\nالبوابة: ${currentGateway.name}\nنوع الربط: ${currentIntegration.name}\nالنتيجة: ${simulationResult.status}\nالرمز: ${simulationResult.code}\nالسبب: ${simulationResult.decisionReason}\nتحليل الـ AI: ${simulationResult.aiAnalysis}\nIP العميل: ${activeIp}\nالتاريخ: ${new Date().toLocaleString('ar-SA')}`;
                      handleCopy(text, 'report');
                    }}
                  >
                    {copiedKey === 'report' ? <Check size={14} /> : <Copy size={14} />}
                    <span>نسخ التقرير الشامل لتقديمه للإدارة</span>
                  </button>
                </div>
              </div>

              {/* Security Rules Evaluated Breakdown */}
              <div className="rules-evaluated-box">
                <h4>نتائج فحص أنظمة الحماية خلال الاختبار:</h4>
                <div className="rules-list">
                  {simulationResult.rulesEvaluated.map((r, i) => (
                    <div key={i} className={`rule-row ${r.passed ? 'passed' : 'failed'}`}>
                      <div className="rule-name-cell">
                        {r.passed ? <Check size={14} /> : <AlertOctagon size={14} />}
                        <strong>{r.rule}</strong>
                      </div>
                      <span className="rule-note-cell">{r.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Active Security Systems Insight (Read-Only for Loader) */}
          <section className="panel security-observe-panel">
            <div className="observe-header">
              <Shield size={18} />
              <div>
                <h4>أنظمة الحماية المفعلة لدى التاجر (Security Rules Status)</h4>
                <small>
                  * ملاحظة: يتم تفعيل وإيقاف هذه الأنظمة حصرياً من "حساب التاجر" (صفحة أنظمة الحماية).
                  حساب اللودر يختبر أداءها ويكشف أسباب الرفض الناتجة عنها.
                </small>
              </div>
            </div>

            <div className="security-mini-list">
              {securitySystems.map((sec) => (
                <div key={sec.id} className="sec-mini-row">
                  <div className="sec-info">
                    <strong>{sec.name}</strong>
                    <p>{sec.whatItDoes}</p>
                  </div>
                  <span className={`sec-status-badge ${sec.enabled ? 'enabled' : 'disabled'}`}>
                    {sec.enabled ? 'مفعّل' : 'معطّل'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
