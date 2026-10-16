import { useState } from 'react';
import {
  BrainCircuit, CreditCard, Sparkles, AlertTriangle, CheckCircle2,
  XCircle, ArrowRight, ShieldCheck, Zap, GitFork, RefreshCw, Send,
  HelpCircle, ChevronRight, BarChart3, Layers, Building2, Globe
} from 'lucide-react';
import {
  BANK_PROFILES_DATA,
  BankProfile,
  BankSubBinRecord,
  DECLINE_CODES_DATA,
  DeclineCodeRecord,
  STRATEGIC_AI_ADVICES
} from './aiBinIntelligenceData';
import './AiBinIntelligenceCenter.css';

interface AiBinIntelligenceCenterProps {
  onApplyCardToSimulator?: (cardInfo: { number: string; gatewayId: string; scheme: string; bankName: string }) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  tags?: string[];
}

export default function AiBinIntelligenceCenter({ onApplyCardToSimulator }: AiBinIntelligenceCenterProps) {
  const [activeTab, setActiveTab] = useState<'disparity' | 'smart_routing' | 'ai_copilot' | 'decline_codes' | 'strategy'>('disparity');
  
  // Tab 1: Bank Disparity Explorer
  const [selectedBankId, setSelectedBankId] = useState<string>('alrajhi');
  const [selectedBinForModal, setSelectedBinForModal] = useState<BankSubBinRecord | null>(null);
  const [isAiAnalyzingBank, setIsAiAnalyzingBank] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // Tab 2: Smart Routing Simulator
  const [testBinInput, setTestBinInput] = useState('457812');
  const [routingResult, setRoutingResult] = useState<{
    detectedBank: string;
    detectedType: string;
    detectedScheme: string;
    bestGateway: string;
    fallbackGateway: string;
    avoidGateway: string;
    successRate: number;
    aiRecommendation: string;
  } | null>(null);

  // Tab 3: AI Copilot Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'مرحباً بك! أنا مستشار الذكاء الاصطناعي المتخصص في هندسة المدفوعات البنكية (Payment & BIN Intelligence AI). أستطيع مساعدتك في فهم سبب قبول أو حظر أي نطاق بطاقات (BIN)، ولماذا ترفض البوابات بطاقات معينة حتى لو كانت من نفس البنك، وكيفية توجيه العمليات ومفاوضة البوابات لرفع نسبة قبول الدفع إلى أكثر من 98%. اختر استفساراً سريعاً أو اكتب سؤالك بالأسفل!',
      timestamp: 'الآن',
      tags: ['محلل BINs', 'ذكاء اصطناعي', 'توجيه ذكي']
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Tab 4: Decline Codes
  const [selectedDeclineCode, setSelectedDeclineCode] = useState<DeclineCodeRecord>(DECLINE_CODES_DATA[0]);

  const currentBank = BANK_PROFILES_DATA.find(b => b.bankId === selectedBankId) || BANK_PROFILES_DATA[0];

  // Handler: Run Bank AI Deep Diagnostic
  const handleRunBankAiDiagnostic = (bank: BankProfile) => {
    setIsAiAnalyzingBank(true);
    setAiAnalysisResult(null);

    setTimeout(() => {
      const highestBin = bank.bins.reduce((prev, curr) => (curr.approvalRateEstimate > prev.approvalRateEstimate ? curr : prev));
      const lowestBin = bank.bins.reduce((prev, curr) => (curr.approvalRateEstimate < prev.approvalRateEstimate ? curr : prev));

      const analysis = `
📊 **تشخيص الذكاء الاصطناعي لتباين بطاقات ${bank.bankNameAr}:**

1. **سبب التباين الصارخ داخل نفس البنك:**
   * أعلى بطاقة قبولاً هي: **[${highestBin.bin}] ${highestBin.tierName}** بنسبة موافقة **${highestBin.approvalRateEstimate}%**، بينما أدنى بطاقة هي **[${lowestBin.bin}] ${lowestBin.tierName}** بنسبة **${lowestBin.approvalRateEstimate}%** فقط!
   * السبب الجوهري: البطاقة الأولى تصنف كـ **${highestBin.subType}** وتملك رصيداً ومسار توثيق وطني موثوق، بينما البطاقة الأدنى تصنف كـ **${lowestBin.subType}**.
   * ${lowestBin.aiExplanation}

2. **سلوك بوابات الدفع (Telr vs PayTabs vs Noon):**
   * بوابات مثل Telr تفرض قيوداً أمنية صارمة على بطاقات الـ Virtual & Prepaid لمنع الاحتيال الدولي.
   * بينما بوابات مثل PayTabs و Noon تملك تراخيص ربط وطنية مباشرة (Mada Acquirer) وتستطيع قبول بطاقات الخصم المباشر بنسب تفوق 98%.

3. **التوصية الفورية للتاجر وفريق اللودر:**
   * تفعيل **التوجيه الديناميكي (Dynamic BIN Routing)**: إذا رصد النظام الـ BIN [${lowestBin.bin}]، يتم تحويل الدفعة تلقائياً إلى البوابة الموصى بها (${bank.bestGatewayForBank}) وتفادي إرسالها إلى البوابات الرافضة.
   * إبلاغ العميل الذي يحمل بطاقة [${lowestBin.bin}] برسالة توجيهية سلسة عند الفشل بدلاً من تركه يغادر المتجر.
      `.trim();

      setAiAnalysisResult(analysis);
      setIsAiAnalyzingBank(false);
    }, 600);
  };

  // Handler: Smart Routing Evaluation
  const handleEvaluateRouting = () => {
    const cleanBin = testBinInput.replace(/\s+/g, '').slice(0, 6);
    let matchedBin: BankSubBinRecord | null = null;
    let matchedBank: BankProfile | null = null;

    for (const bank of BANK_PROFILES_DATA) {
      const found = bank.bins.find(b => b.bin === cleanBin);
      if (found) {
        matchedBin = found;
        matchedBank = bank;
        break;
      }
    }

    if (matchedBin && matchedBank) {
      const isPrepaidOrVirtual = matchedBin.subType.includes('Prepaid') || matchedBin.subType.includes('Virtual');
      const isMadaDebit = matchedBin.subType.includes('Debit Mada');

      setRoutingResult({
        detectedBank: matchedBank.bankNameAr,
        detectedType: matchedBin.tierName,
        detectedScheme: matchedBin.scheme,
        bestGateway: isMadaDebit ? 'بيتابس (PayTabs) أو نون باي (Noon)' : isPrepaidOrVirtual ? 'بيتابس (PayTabs) مع تفعيل 3DS' : 'تيلر (Telr) أو بيتابس (PayTabs)',
        fallbackGateway: 'ماي فاتورة (MyFatoorah) كبديل فوري',
        avoidGateway: isPrepaidOrVirtual ? 'تيلر (Telr) و بي زاتي (PayZaty) - احتمال حظر عالي' : 'لا توجد موانع حظر',
        successRate: matchedBin.approvalRateEstimate,
        aiRecommendation: matchedBin.aiExplanation
      });
    } else {
      // Heuristic fallback
      setRoutingResult({
        detectedBank: 'نطاق بنكي قياسي (Standard Global / Regional BIN)',
        detectedType: cleanBin.startsWith('4') ? 'فيزا ائتمانية / خصم' : cleanBin.startsWith('5') ? 'ماستركارد ائتمانية' : 'نطاق بطاقة متنوعة',
        detectedScheme: cleanBin.startsWith('4') ? 'Visa' : cleanBin.startsWith('5') ? 'Mastercard' : 'Mada',
        bestGateway: 'بيتابس (PayTabs) أو تيلر (Telr)',
        fallbackGateway: 'ماي فاتورة (MyFatoorah)',
        avoidGateway: 'البوابات غير المرخصة محلياً',
        successRate: 88.0,
        aiRecommendation: 'يوصي الذكاء الاصطناعي بتفعيل التوجيه المتوازن وتمرير المعاملة عبر مسار 3DS 2.2 لضمان تفادي أكواد الرفض 05 و 82.'
      });
    }
  };

  // Handler: Send AI Copilot Message
  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: 'الآن'
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsAiTyping(true);

    setTimeout(() => {
      let aiReply = '';
      const q = query.toLowerCase();

      if (q.includes('الراجحي') || q.includes('مسبقة') || q.includes('سفر بلس') || q.includes('457812')) {
        aiReply = `
**تحليل الذكاء الاصطناعي لحالة مصرف الراجحي:**
البطاقات مسبقة الدفع مثل (سفر بلس 457812) وبطاقات يورباي الرقمية (407523) تختلف جذرياً في المعالجة المصرفية عن بطاقات مدى الحساب الجاري (588846):
1. **تصنيف الـ BIN في شبكة Visa:** يصنف الـ BIN كـ \`Prepaid Consumer Multi-Currency\` وليس \`Consumer Debit\`.
2. **عتبة المخاطر بالبوابات (Risk Thresholds):** محركات مثل CyberSource و Telr Risk Shield تصنف البطاقات مسبقة الدفع كعالية الخطورة لوجود احتمالية أعلى لطلبات الاسترجاع وعمليات الاحتيال.
3. **الحل العملي:** عند التعرف على هذا الـ BIN، قم بتوجيه المعاملة مباشرة إلى **PayTabs** مع خيار "3DS Mandatory" حيث تملك اتفاقية تسوية محلية داخل المملكة تقبل هذه البطاقات بنسبة 95%+.
        `.trim();
      } else if (q.includes('اقناع') || q.includes('عميل') || q.includes('رفض')) {
        aiReply = `
**استراتيجية ذكاء اصطناعي لإقناع العميل وتفادي خسارة المبيعة:**
1. **بدون رسائل خطأ مخيفة:** لا تُظهر رسالة "تم رفض بطاقتك"، بل أظهر: *"مصرفك يتطلب تأكيداً إضافياً، أو يمكنك إتمام الشراء فوراً باستخدام بطاقة أخرى أو Apple Pay"*.
2. **التحويل الصامت (Silent Fallback):** حاول فورياً عبر البوابة البديلة قبل إظهار أي فشل للعميل.
3. **توفير خيار الدفع البديل بنقرة واحدة:** إذا كانت البطاقة مسبقة الدفع، اعرض فوراً زري \`Apple Pay\` و \`مدى\`.
        `.trim();
      } else if (q.includes('شركات') || q.includes('commercial') || q.includes('business')) {
        aiReply = `
**الفرق المصرفي بين بطاقات الشركات وبطاقات الأفراد:**
* **بطاقات الأعمال (Corporate BINs):** تتطلب بيانات إضافية في طلب التفويض تُعرف بـ \`Level 2 & Level 3 Enhanced Data\` (مثل رقم السجل الضريبي وتفصيل بنود الفاتورة).
* إذا لم ترسل البوابة هذه البيانات، فإن البنك المصدر (Issuer) يرفض المعاملة تلقائياً بكود \`05 Do Not Honor\` أو \`57 Transaction Not Permitted\`.
* في المقابل، بطاقات الأفراد (Consumer BINs) تتطلب فقط بيانات المستوى الأول الأساسية (Amount + Currency).
        `.trim();
      } else if (q.includes('تفاوض') || q.includes('whitelisting') || q.includes('تيلر') || q.includes('بيتابس')) {
        aiReply = `
**دليل التفاوض مع بوابات الدفع لفتح حظر الـ BINs (Whitelisting):**
1. اطلب من مدير حسابك (Account Manager) لدى البوابة إرسال تقرير الرفض لكود \`82 Policy Decline\` الخاص بمتجرك.
2. وضح لهم أن متجرك يبيع منتجات حقيقية ويوثق الهويات، واطلب رفع عتبة الـ Velocity للـ BINs المحلية (Saudi Domestic BINs).
3. اعرض عليهم تفعيل **حماية 3DS الإلزامية بنسبة 100%** على تلك الـ BINs؛ هذا ينقل عبء المسؤولية المالية (Liability Shift) من البوابة إلى البنك المصدر، فيوافقون فوراً على فتح الحظر!
        `.trim();
      } else {
        aiReply = `
**إجابة خبير الذكاء الاصطناعي للمدفوعات:**
هذا السؤال جوهري في صناعة بوابات الدفع. تباين القبول بين بطاقات البنك الواحد يعود بالأساس إلى:
1. **نوع الـ BIN المالي:** (Debit vs Credit vs Prepaid vs Corporate).
2. **إصدار بروتوكول 3DS المدعوم:** (3DS 2.2 Frictionless مقابل 3DS 1.0 القديم).
3. **الترخيص الجغرافي للبنك المحصل (Acquirer):** محلي (Onshore) مقابل خارجي (Offshore).

💡 **نصيحة المنصة:** استخدم أداة "التوجيه الذكي (Dynamic Routing)" في هذا التبويب لبرمجة النظام على اختيار البوابة الأنسب لكل BIN تلقائياً.
        `.trim();
      }

      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: aiReply,
        timestamp: 'الآن',
        tags: ['تحليل متقدم', 'حل مصرفي']
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsAiTyping(false);
    }, 700);
  };

  return (
    <div className="ai-bin-intelligence-container">
      {/* Hero Header */}
      <div className="ai-bin-header-card">
        <div className="ai-bin-header-content">
          <div className="ai-bin-badge">
            <BrainCircuit size={16} />
            <span>AI PAYMENT & BIN INTELLIGENCE LAB</span>
          </div>
          <h2>مركز ذكاء الـ BIN والذكاء الاصطناعي (AI BIN Intelligence)</h2>
          <p>
            أدوات ذكية متقدمة تفكك لغز حظر وقبول البطاقات داخل البنك الواحد، وتكشف أسباب الرفض بدقة مصرفية، وتوفر محرك توجيه ذكي واستشارات فورية لرفع نسبة نجاح الدفع لعملائك وتجارك.
          </p>
        </div>

        <div className="ai-bin-header-stats">
          <div className="ai-stat-box">
            <span className="ai-stat-num">98.8%</span>
            <span className="ai-stat-lbl">معدل القبول بالتوجيه الذكي</span>
          </div>
          <div className="ai-stat-box">
            <span className="ai-stat-num">10+</span>
            <span className="ai-stat-lbl">أسباب للتباين المصرفي</span>
          </div>
          <div className="ai-stat-box">
            <span className="ai-stat-num">24/7</span>
            <span className="ai-stat-lbl">مستشار AI نشط</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="ai-bin-tabs-nav">
        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'disparity' ? 'active' : ''}`}
          onClick={() => setActiveTab('disparity')}
        >
          <Building2 size={17} />
          <span>تشخيص تباين الـ BINs للبنك الواحد</span>
        </button>

        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'smart_routing' ? 'active' : ''}`}
          onClick={() => setActiveTab('smart_routing')}
        >
          <GitFork size={17} />
          <span>محرك التوجيه الذكي (Dynamic Routing)</span>
        </button>

        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'ai_copilot' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai_copilot')}
        >
          <Sparkles size={17} />
          <span>مستشار AI للمدفوعات والـ BINs</span>
        </button>

        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'decline_codes' ? 'active' : ''}`}
          onClick={() => setActiveTab('decline_codes')}
        >
          <AlertTriangle size={17} />
          <span>مفكك أكواد الرفض وخطة الحل</span>
        </button>

        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'strategy' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategy')}
        >
          <Zap size={17} />
          <span>خارطة تطوير المجال وقوته للعملاء</span>
        </button>
      </div>

      {/* TAB 1: Bank Disparity Inspector */}
      {activeTab === 'disparity' && (
        <div className="ai-bin-section">
          <div className="disparity-intro-box">
            <div className="disparity-intro-text">
              <h3>🔍 لماذا يقبل بنك معين بطاقة ويرفض أخرى من نفس البنك؟</h3>
              <p>
                السبب ليس مجرد "حظ" أو عطل مؤقت؛ بل لأن البنك الواحد يصدر نطاقات BINs مختلفة تماماً من حيث:
                (1) نوع المنتج المالي Debit vs Credit vs Prepaid،
                (2) ترخيص الشبكة محلي Mada vs دولي Visa،
                (3) دعم بروتوكول 3DS 2.2،
                (4) سجل النزاعات والاحتيال التاريخي المحسوب بالبوابة لكل نطاق 6 أرقام على حدة.
              </p>
            </div>
            <button
              type="button"
              className="primary-button ai-action-btn"
              disabled={isAiAnalyzingBank}
              onClick={() => handleRunBankAiDiagnostic(currentBank)}
            >
              <BrainCircuit size={18} />
              <span>{isAiAnalyzingBank ? 'جارٍ تحليل الذكاء الاصطناعي…' : `تشخيص ذكاء اصطناعي لـ ${currentBank.bankNameAr}`}</span>
            </button>
          </div>

          {/* Bank Selector Chips */}
          <div className="bank-selector-chips">
            {BANK_PROFILES_DATA.map(bank => (
              <button
                key={bank.bankId}
                type="button"
                className={`bank-chip ${selectedBankId === bank.bankId ? 'active' : ''}`}
                onClick={() => {
                  setSelectedBankId(bank.bankId);
                  setAiAnalysisResult(null);
                }}
              >
                <span className="chip-flag">{bank.flag}</span>
                <span className="chip-name">{bank.bankNameAr}</span>
                <span className="chip-count">({bank.bins.length} نطاقات)</span>
              </button>
            ))}
          </div>

          {/* AI Analysis Result Display if triggered */}
          {aiAnalysisResult && (
            <div className="ai-diagnostic-result-card animate-fade-in">
              <div className="ai-result-header">
                <Sparkles size={20} color="#ff5500" />
                <h4>تقرير الذكاء الاصطناعي التشخيصي المعتمد</h4>
                <button
                  type="button"
                  className="icon-button text-muted"
                  onClick={() => setAiAnalysisResult(null)}
                >
                  ✕
                </button>
              </div>
              <div className="ai-result-body">
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: '1.6' }}>
                  {aiAnalysisResult}
                </pre>
              </div>
            </div>
          )}

          {/* Bank Overview Banner */}
          <div className="current-bank-summary-card">
            <div className="cbs-top">
              <div className="cbs-title">
                <span className="cbs-flag">{currentBank.flag}</span>
                <div>
                  <h4>{currentBank.bankNameAr}</h4>
                  <small>{currentBank.country} · {currentBank.issuerCategory}</small>
                </div>
              </div>
              <div className="cbs-best-gw">
                <span className="cbs-badge-label">البوابة الأنسب للبنك:</span>
                <span className="cbs-badge-val">{currentBank.bestGatewayForBank}</span>
              </div>
            </div>
            <p className="cbs-desc">{currentBank.disparityOverview}</p>
          </div>

          {/* Sub-BINs Grid */}
          <div className="sub-bins-grid">
            {currentBank.bins.map((binItem) => (
              <div key={binItem.bin} className={`sub-bin-card risk-${binItem.riskLevel}`}>
                <div className="bin-card-header">
                  <div className="bin-number-badge">
                    <code>BIN {binItem.bin}</code>
                    <span className="scheme-tag">{binItem.scheme}</span>
                  </div>
                  <span className={`risk-badge badge-${binItem.riskLevel}`}>
                    مخاطر {binItem.riskLevel === 'low' ? 'منخفضة' : binItem.riskLevel === 'medium' ? 'متوسطة' : binItem.riskLevel === 'high' ? 'مرتفعة' : 'حرجة'}
                  </span>
                </div>

                <div className="bin-card-title">
                  <h5>{binItem.tierName}</h5>
                  <span className="sub-type-badge">{binItem.subType}</span>
                </div>

                {/* Approval Rate Meter */}
                <div className="approval-rate-container">
                  <div className="approval-rate-labels">
                    <span>نسبة القبول التقديرية</span>
                    <strong>{binItem.approvalRateEstimate}%</strong>
                  </div>
                  <div className="approval-progress-bar">
                    <div
                      className="approval-progress-fill"
                      style={{
                        width: `${binItem.approvalRateEstimate}%`,
                        backgroundColor: binItem.approvalRateEstimate > 90 ? '#10b981' : binItem.approvalRateEstimate > 70 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                </div>

                {/* Gateway Acceptance Matrix for this BIN */}
                <div className="bin-gateways-matrix">
                  <span className="matrix-title">حالة القبول على البوابات:</span>
                  <div className="gw-status-chips">
                    <span className={`gw-chip status-${binItem.acceptanceStatus.paytabs}`}>
                      PayTabs: {binItem.acceptanceStatus.paytabs === 'accepted' ? '✓ مقبولة' : binItem.acceptanceStatus.paytabs === 'rejected' ? '✕ محظورة' : '⚠️ مشروطة'}
                    </span>
                    <span className={`gw-chip status-${binItem.acceptanceStatus.telr}`}>
                      Telr: {binItem.acceptanceStatus.telr === 'accepted' ? '✓ مقبولة' : binItem.acceptanceStatus.telr === 'rejected' ? '✕ محظورة' : '⚠️ مشروطة'}
                    </span>
                    <span className={`gw-chip status-${binItem.acceptanceStatus.noon}`}>
                      Noon: {binItem.acceptanceStatus.noon === 'accepted' ? '✓ مقبولة' : binItem.acceptanceStatus.noon === 'rejected' ? '✕ محظورة' : '⚠️ مشروطة'}
                    </span>
                    <span className={`gw-chip status-${binItem.acceptanceStatus.myfatoorah}`}>
                      MyFatoorah: {binItem.acceptanceStatus.myfatoorah === 'accepted' ? '✓ مقبولة' : binItem.acceptanceStatus.myfatoorah === 'rejected' ? '✕ محظورة' : '⚠️ مشروطة'}
                    </span>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="bin-explanation-box">
                  <span className="exp-label">💡 تفسير الذكاء الاصطناعي:</span>
                  <p>{binItem.aiExplanation}</p>
                </div>

                {binItem.rejectionReasonIfAny && (
                  <div className="bin-rejection-alert">
                    <AlertTriangle size={14} />
                    <span><strong>سبب الحظر المحتمل:</strong> {binItem.rejectionReasonIfAny}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="bin-card-footer">
                  {onApplyCardToSimulator && (
                    <button
                      type="button"
                      className="outline-button test-in-sim-btn"
                      onClick={() => {
                        const sampleCardNum = `${binItem.bin}0012345678`;
                        onApplyCardToSimulator({
                          number: sampleCardNum,
                          gatewayId: binItem.acceptanceStatus.paytabs === 'accepted' ? 'paytabs' : 'telr',
                          scheme: binItem.scheme,
                          bankName: currentBank.bankNameAr
                        });
                      }}
                    >
                      <span>تجربة في المختبر الافتراضي</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-button details-btn"
                    onClick={() => setSelectedBinForModal(binItem)}
                  >
                    <span>تفاصيل التوثيق الأمني</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AI Smart Routing Engine */}
      {activeTab === 'smart_routing' && (
        <div className="ai-bin-section">
          <div className="routing-engine-banner">
            <div className="reb-info">
              <GitFork size={28} color="#ff5500" />
              <div>
                <h3>محرك التوجيه الذكي متعدد البوابات (AI Dynamic Routing & Fallback)</h3>
                <p>
                  بدلاً من خسارة العميل عند حظر الـ BIN، يقوم محرك الذكاء الاصطناعي بقراءة أول 6 أرقام واختيار البوابة الأعلى قبولاً والأقل عمولة فورياً، مع تجهيز خطة تحويل احتياطية (Smart Fallback).
                </p>
              </div>
            </div>
          </div>

          <div className="routing-tester-box">
            <label className="routing-input-label">
              <span>أدخل أي رقم بطاقة أو BIN (6 أرقام) لفحص أفضل مسار توجيه:</span>
              <div className="routing-input-group">
                <input
                  type="text"
                  maxLength={19}
                  value={testBinInput}
                  onChange={(e) => setTestBinInput(e.target.value)}
                  placeholder="مثال: 457812 أو 588846 أو 542400"
                  className="routing-text-input"
                  dir="ltr"
                />
                <button
                  type="button"
                  className="primary-button routing-calc-btn"
                  onClick={handleEvaluateRouting}
                >
                  <BrainCircuit size={17} />
                  <span>حساب أفضل مسار توجيه</span>
                </button>
              </div>
            </label>

            {/* Quick Test Chips */}
            <div className="quick-bins-chips">
              <span>أمثلة سريعة:</span>
              {[
                { bin: '588846', name: 'الراجحي مدى (Debit)' },
                { bin: '457812', name: 'الراجحي سفر بلس (Prepaid مشكوك)' },
                { bin: '407523', name: 'يورباي الرقمية (Virtual)' },
                { bin: '458838', name: 'الراجحي إنفينيت (Credit)' },
                { bin: '519638', name: 'الكويت الوطني KNET' },
                { bin: '542400', name: 'الإمارات دبي الوطني وورلد' },
              ].map(item => (
                <button
                  key={item.bin}
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => {
                    setTestBinInput(item.bin);
                    setTimeout(() => handleEvaluateRouting(), 50);
                  }}
                >
                  <code>{item.bin}</code>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* Routing Result Display */}
            {routingResult && (
              <div className="routing-output-card animate-fade-in">
                <div className="roc-header">
                  <CheckCircle2 size={22} color="#10b981" />
                  <h4>خطة التوجيه الذكي الموصى بها للبطاقة (BIN: {testBinInput.slice(0, 6)})</h4>
                </div>

                <div className="roc-details-grid">
                  <div className="roc-grid-item">
                    <span className="roc-lbl">البنك المصدر</span>
                    <strong className="roc-val">{routingResult.detectedBank}</strong>
                  </div>
                  <div className="roc-grid-item">
                    <span className="roc-lbl">فئة ونوع البطاقة</span>
                    <strong className="roc-val">{routingResult.detectedType}</strong>
                  </div>
                  <div className="roc-grid-item">
                    <span className="roc-lbl">شبكة الدفع</span>
                    <strong className="roc-val">{routingResult.detectedScheme}</strong>
                  </div>
                  <div className="roc-grid-item">
                    <span className="roc-lbl">نسبة نجاح التفويض المتوقعة</span>
                    <strong className="roc-val text-success">{routingResult.successRate}%</strong>
                  </div>
                </div>

                {/* Routing Pathway */}
                <div className="routing-pathway-visual">
                  <div className="pathway-step step-primary">
                    <span className="step-tag">المسار الأول (Primary Acquirer)</span>
                    <strong className="step-title">{routingResult.bestGateway}</strong>
                    <p className="step-note">أعلى معدل قبول، عمولة منخفضة، ربط مباشر موثق.</p>
                  </div>

                  <div className="pathway-arrow">
                    <ArrowRight size={20} />
                    <small>في حال الرفض</small>
                  </div>

                  <div className="pathway-step step-fallback">
                    <span className="step-tag">المسار الاحتياطي الصامت (Smart Fallback)</span>
                    <strong className="step-title">{routingResult.fallbackGateway}</strong>
                    <p className="step-note">محاولة سريعة في الخلفية تنقذ 22% من العمليات.</p>
                  </div>

                  <div className="pathway-arrow">
                    <ArrowRight size={20} />
                    <small>تجنب كلياً</small>
                  </div>

                  <div className="pathway-step step-avoid">
                    <span className="step-tag">مسار محظور / عالي الخطورة</span>
                    <strong className="step-title">{routingResult.avoidGateway}</strong>
                    <p className="step-note">احتمال رفض وتجميد للعملية بنسبة تفوق 70%.</p>
                  </div>
                </div>

                {/* AI Advice */}
                <div className="roc-ai-footer">
                  <Sparkles size={18} color="#ff5500" />
                  <span><strong>توصية الذكاء الاصطناعي للمتجر:</strong> {routingResult.aiRecommendation}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AI Copilot Chat */}
      {activeTab === 'ai_copilot' && (
        <div className="ai-bin-section">
          <div className="copilot-container">
            {/* Quick Suggestions Chips */}
            <div className="copilot-suggested-prompts">
              <span className="csp-label">
                <Sparkles size={14} />
                <span>استفسارات سريعة مقترحة:</span>
              </span>
              {[
                'لماذا تحظر البوابات بطاقات الراجحي مسبقة الدفع 457812 وتقبل مدى؟',
                'كيف أقنع العميل بتغيير البطاقة دون خسارة المبيعة؟',
                'ما هو الفرق بين بطاقات الشركات Commercial وبطاقات الأفراد؟',
                'كيف أتفاوض مع تيلر وبيتابس لفتح الـ BIN المحظور (Whitelisting)؟',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="csp-prompt-btn"
                  onClick={() => handleSendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="copilot-messages-box">
              {messages.map((msg) => (
                <div key={msg.id} className={`copilot-bubble bubble-${msg.sender}`}>
                  <div className="bubble-header">
                    <span className="sender-name">
                      {msg.sender === 'ai' ? '🤖 خبير الذكاء الاصطناعي للمدفوعات' : '👤 أنت'}
                    </span>
                    <span className="msg-time">{msg.timestamp}</span>
                  </div>
                  <div className="bubble-content">
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: '1.6' }}>
                      {msg.text}
                    </pre>
                  </div>
                  {msg.tags && (
                    <div className="bubble-tags">
                      {msg.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="btag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isAiTyping && (
                <div className="copilot-bubble bubble-ai typing-indicator">
                  <div className="bubble-header">
                    <span className="sender-name">🤖 خبير الذكاء الاصطناعي</span>
                  </div>
                  <p>جارٍ تحليل المعطيات المصرفية والبحث في سجلات الـ BINs…</p>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="copilot-input-bar">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="اسأل الذكاء الاصطناعي عن أي بنك، أي بطاقة، أو كيفية حل مشكلة رفض معينة…"
                className="copilot-input-field"
              />
              <button
                type="button"
                className="primary-button copilot-send-btn"
                disabled={!inputQuery.trim() || isAiTyping}
                onClick={() => handleSendMessage()}
              >
                <Send size={16} />
                <span>إرسال</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Decline Codes Decoder */}
      {activeTab === 'decline_codes' && (
        <div className="ai-bin-section">
          <div className="decline-codes-layout">
            {/* Left list of codes */}
            <div className="decline-codes-list">
              <h4>شفرات الرفض المصرفية (Decline Codes)</h4>
              <p className="dcl-desc">اختر كود الرفض لمعرفة أسبابه في تباين البينات وكيفية معالجته:</p>

              <div className="dcl-items">
                {DECLINE_CODES_DATA.map((codeItem) => (
                  <button
                    key={codeItem.code}
                    type="button"
                    className={`dcl-item-btn ${selectedDeclineCode.code === codeItem.code ? 'active' : ''}`}
                    onClick={() => setSelectedDeclineCode(codeItem)}
                  >
                    <div className="dcl-code-tag">
                      <code>Code {codeItem.code}</code>
                    </div>
                    <div className="dcl-item-info">
                      <strong>{codeItem.nameAr}</strong>
                      <small>{codeItem.category}</small>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right details */}
            <div className="decline-code-details-panel">
              <div className="dcd-header">
                <div className="dcd-badge">
                  <code>Code {selectedDeclineCode.code}</code>
                  <span className="dcd-cat-tag">{selectedDeclineCode.category}</span>
                </div>
                <h3>{selectedDeclineCode.nameAr}</h3>
                <small dir="ltr">{selectedDeclineCode.nameEn}</small>
              </div>

              <div className="dcd-section">
                <h5>🔍 لماذا يحدث هذا الكود لـ BIN معين دون غيره داخل نفس البنك؟</h5>
                <p>{selectedDeclineCode.whyBinDisparityHappens}</p>
              </div>

              <div className="dcd-section section-ai">
                <div className="sec-ai-title">
                  <Sparkles size={16} color="#ff5500" />
                  <h5>التشخيص التلقائي والمعالجة بالذكاء الاصطناعي (AI Remediation)</h5>
                </div>
                <p>{selectedDeclineCode.aiSuggestedRemediation}</p>
              </div>

              <div className="dcd-section section-merchant">
                <div className="sec-ai-title">
                  <ShieldCheck size={16} color="#10b981" />
                  <h5>خطة عمل التاجر الموصى بها (Merchant Action Plan)</h5>
                </div>
                <p>{selectedDeclineCode.merchantActionPlan}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Market Strategy & Industry Power */}
      {activeTab === 'strategy' && (
        <div className="ai-bin-section">
          <div className="strategy-hero-banner">
            <h3>🚀 كيف نطور هذا المجال ونجعله نقطة قوة خارقة عند العملاء؟</h3>
            <p>
              معظم المتاجر الإلكترونية تعاني بصمت من فقدان 20% إلى 30% من مبيعاتها بسبب الرفض العشوائي للبطاقات والجهل بأسباب حظر الـ BINs. تحويل هذه المشكلة إلى ميزة تنافسية يعتمد على تطبيق أربع ركائز استراتيجية:
            </p>
          </div>

          <div className="strategy-cards-grid">
            {STRATEGIC_AI_ADVICES.map((advice, idx) => (
              <div key={idx} className="strategy-card">
                <div className="strat-top">
                  <span className="strat-cat">{advice.category}</span>
                  <h4>{advice.titleAr}</h4>
                </div>

                <p className="strat-summary">{advice.summaryAr}</p>

                <div className="strat-actions">
                  <span className="strat-actions-title">خطوات التنفيذ العملية:</span>
                  <ul>
                    {advice.actionItems.map((act, aIdx) => (
                      <li key={aIdx}>{act}</li>
                    ))}
                  </ul>
                </div>

                <div className="strat-impact">
                  <Zap size={16} color="#ff5500" />
                  <span><strong>الأثر المتوقع:</strong> {advice.expectedImpact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal for Single BIN if clicked */}
      {selectedBinForModal && (
        <div className="bin-modal-overlay" onClick={() => setSelectedBinForModal(null)}>
          <div className="bin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bin-modal-header">
              <h3>بيانات التوثيق الأمني لـ BIN {selectedBinForModal.bin}</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSelectedBinForModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="bin-modal-body">
              <div className="bmb-row">
                <span>اسم الفئة:</span>
                <strong>{selectedBinForModal.tierName}</strong>
              </div>
              <div className="bmb-row">
                <span>النوع المالي:</span>
                <strong>{selectedBinForModal.subType}</strong>
              </div>
              <div className="bmb-row">
                <span>دعم 3DS 2.2 التلقائي:</span>
                <strong className={selectedBinForModal.supports3DS2 ? 'text-success' : 'text-danger'}>
                  {selectedBinForModal.supports3DS2 ? 'نعم - مدعوم بالكامل' : 'لا - يعتمد على 3DS 1.0 القديم'}
                </strong>
              </div>
              <div className="bmb-row">
                <span>متطلبات بيانات المستوى الثالث (Level 3):</span>
                <strong>{selectedBinForModal.requiresLevel3Data ? 'مطلوبة (Corporate Requirement)' : 'غير مطلوبة (Standard Consumer)'}</strong>
              </div>
              <div className="bmb-row">
                <span>نسبة مخاطر الـ Chargeback:</span>
                <strong>{selectedBinForModal.chargebackRisk}</strong>
              </div>
              <div className="bmb-row">
                <span>تفسير الذكاء الاصطناعي:</span>
                <p style={{ margin: 0 }}>{selectedBinForModal.aiExplanation}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
