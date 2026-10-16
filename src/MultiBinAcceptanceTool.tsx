import React, { useState, useMemo } from 'react';
import {
  CreditCard, CheckCircle2, ShieldCheck, Sparkles, Filter,
  ArrowRight, Copy, Check, Info, FileSpreadsheet, Layers,
  ChevronDown, ChevronUp, AlertCircle, RefreshCw, XCircle,
  BrainCircuit, Globe, Building2, TrendingUp, ShieldAlert,
  Zap, Sliders, ArrowUpRight
} from 'lucide-react';
import {
  analyzeBinsByCardType,
  CategoryAcceptanceGroup,
  MultiBinAnalysisReport
} from './multiBinAcceptanceService';
import {
  predictCardSuccessRateByBankAndCountry,
  SUPPORTED_ISSUING_BANKS,
  SUPPORTED_COUNTRIES,
  BankCountryPredictionResult
} from './historicalPredictionModel';
import './MultiBinAcceptanceTool.css';

// Preset sample packages for rapid testing
const PRESET_BIN_BUNDLES = [
  {
    title: 'حزمة بنكية خليجية مشكلة (مدى + بلاتينيوم + سفر + شركات)',
    bins: '588846, 458838, 457812, 468547, 542400',
    desc: 'مجموعة تمثل سلة مشتريات حقيقية لمتجر سعودي/إماراتي'
  },
  {
    title: 'سلة بطاقات مدى وبنوك سعودية فقط',
    bins: '588846, 588845, 457865',
    desc: 'لفحص البوابات التي تضمن 100% لشبكة مدى الوطنية'
  },
  {
    title: 'سلة بطاقات فيزا وماستركارد ائتمانية فاخرة',
    bins: '458838, 400000, 510510, 411111',
    desc: 'فحص بطاقات النخبة الائتمانية الدولية والمحلية'
  },
  {
    title: 'سلة بطاقات عالية المخاطر (مسبقة الدفع + افتراضية)',
    bins: '457812, 407523, 484722',
    desc: 'كشف البوابات المحافظة التي تحظر البطاقات الافتراضية ومسبقة الدفع'
  }
];

export const MultiBinAcceptanceTool: React.FC = () => {
  const [inputBinsText, setInputBinsText] = useState<string>('588846, 458838, 457812, 407523, 468547');
  const [filterMode, setFilterMode] = useState<'all' | '100_only'>('100_only');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // Predictive Model State (قبل إدخال البطاقة بناءً على البنك المصدر والدولة)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('SA');
  const [selectedBankId, setSelectedBankId] = useState<string>('alrajhi');
  const [selectedCardCategory, setSelectedCardCategory] = useState<
    'Debit Mada' | 'Credit Classic' | 'Credit Platinum/Signature' | 'Prepaid / Travel' | 'Virtual / Digital Wallet' | 'Corporate / Business'
  >('Debit Mada');
  const [selectedScheme, setSelectedScheme] = useState<
    'Mada' | 'Visa' | 'Mastercard' | 'AMEX' | 'KNET' | 'Benefit'
  >('Mada');
  const [showPredictionModel, setShowPredictionModel] = useState<boolean>(true);

  // Filter banks available for the selected country
  const banksForSelectedCountry = useMemo(() => {
    return SUPPORTED_ISSUING_BANKS.filter(b => b.countryCode === selectedCountryCode);
  }, [selectedCountryCode]);

  // Handle Country Change & update default bank
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    const available = SUPPORTED_ISSUING_BANKS.filter(b => b.countryCode === countryCode);
    if (available.length > 0) {
      setSelectedBankId(available[0].id);
      setSelectedScheme(available[0].defaultScheme);
      setSelectedCardCategory(available[0].defaultCategory);
    }
  };

  // Run AI Historical Predictive Forecast
  const prediction: BankCountryPredictionResult = useMemo(() => {
    return predictCardSuccessRateByBankAndCountry({
      bankId: selectedBankId,
      countryCode: selectedCountryCode,
      cardCategory: selectedCardCategory,
      scheme: selectedScheme
    });
  }, [selectedBankId, selectedCountryCode, selectedCardCategory, selectedScheme]);

  // Perform Multi-BIN Analysis
  const report: MultiBinAnalysisReport = useMemo(() => {
    return analyzeBinsByCardType(inputBinsText);
  }, [inputBinsText]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleExpand = (catId: string) => {
    setExpandedDetails(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Quick Action to inject bank's representative BINs into input textarea
  const handleInjectBankBins = (bankId: string) => {
    const sampleBinsByBank: Record<string, string> = {
      alrajhi: '588846, 458838, 457812, 407523, 468547',
      snb: '457865, 524188, 484783',
      alinma: '588845, 458838',
      riyad: '411111, 457812',
      enbd: '542400, 400000',
      adcb: '458838, 542400',
      fab: '411111, 542400',
      nbk: '519638, 400000',
      kfh: '519638, 542400',
      bisb: '588846, 458838',
      qnb: '542400, 458838',
      nbe: '524188, 542400',
      chase: '400000, 411111',
      hsbc: '400000, 542400'
    };
    const bins = sampleBinsByBank[bankId] || '588846, 458838';
    setInputBinsText(bins);
  };

  const visibleCategories = useMemo(() => {
    if (selectedCategoryTab === 'all') {
      return report.categoriesFound;
    }
    return report.categoriesFound.filter(c => c.category === selectedCategoryTab);
  }, [report.categoriesFound, selectedCategoryTab]);

  return (
    <div className="multi-bin-tool-container" dir="rtl">
      {/* Header Banner */}
      <div className="multi-bin-header-card">
        <div className="header-badge">
          <Layers className="icon-sm" />
          <span>محلل توافقية البنات حسب نوع البطاقة (Grouped by Card Type)</span>
        </div>
        <h2 className="tool-main-title">
          فاحص بوابات القبول القطعي 100% للبطاقات
        </h2>
        <p className="tool-subtitle">
          أدخل قائمة من الـ BINs لعدة بطاقات دفعة واحدة (أو بطاقة واحدة). يقوم المحلل تلقائياً بتصنيف البطاقات
          إلى <strong>«أنواع بطاقات متجانسة»</strong> (مدى، ائتمانية فاخرة، مسبقة الدفع، رقمية، شركات)
          ويحدد لك <strong>حصراً البوابات التي تقبل كل نوع بنسبة 100% قطعية</strong> دون أي استثناء.
        </p>

        {/* Quick Presets */}
        <div className="presets-section">
          <span className="presets-label">⚡ حزم تجريبية جاهزة للتحميل الفوري:</span>
          <div className="presets-grid">
            {PRESET_BIN_BUNDLES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-btn"
                onClick={() => setInputBinsText(preset.bins)}
              >
                <span className="preset-btn-title">{preset.title}</span>
                <span className="preset-btn-bins">({preset.bins})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AI PREDICTIVE SUCCESS MODEL COMPONENT (PRE-INPUT FORECASTING BY BANK & COUNTRY) */}
      {/* ========================================================================= */}
      <div className="prediction-model-card">
        <div className="prediction-header">
          <div className="prediction-header-info">
            <div className="prediction-badge-icon">
              <BrainCircuit className="icon-md" style={{ color: '#c4b5fd' }} />
            </div>
            <div>
              <div className="prediction-tag">
                <Sparkles className="icon-xs" />
                <span>نموذج تنبؤ الذكاء الاصطناعي (AI Pre-Input Prediction Model)</span>
              </div>
              <h3 className="prediction-title">
                توقع نسبة نجاح البطاقة قبل إدخالها استناداً إلى سجل العمليات التاريخي
              </h3>
              <p className="prediction-subtitle">
                حلل الذكاء الاصطناعي أكثر من <strong>2,800+ عملية تاريخية</strong> مسجلة في سجل النظام.
                حدد الدولة والبنك المصدر وفئة البطاقة لتتوقع بدقة نسبة القبول، وأعلى بوابة موصى بها،
                وأبرز أسباب الرفض المحتملة قبل كتابة أرقام البطاقة.
              </p>
            </div>
          </div>

          <div className="prediction-confidence-badge">
            <span className="confidence-dot" />
            <span>ثقة النموذج: {prediction.confidenceLevel === 'very_high' ? 'عالية جداً (99%)' : 'عالية (95%)'}</span>
          </div>
        </div>

        {/* Parameter Selector Form */}
        <div className="prediction-form-grid">
          {/* Country Selector */}
          <div className="prediction-form-field">
            <label className="prediction-form-label">
              <Globe className="icon-xs" style={{ color: '#00c3ff' }} />
              دولة الإصدار (Issuing Country):
            </label>
            <select
              className="prediction-select"
              value={selectedCountryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.nameAr} ({c.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Issuer Bank Selector */}
          <div className="prediction-form-field">
            <label className="prediction-form-label">
              <Building2 className="icon-xs" style={{ color: '#ff5500' }} />
              البنك المصدر (Issuing Bank):
            </label>
            <select
              className="prediction-select"
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
            >
              {banksForSelectedCountry.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameAr} ({b.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Card Category Archetype Selector */}
          <div className="prediction-form-field">
            <label className="prediction-form-label">
              <CreditCard className="icon-xs" style={{ color: '#00e676' }} />
              فئة ونوع البطاقة (Card Archetype):
            </label>
            <select
              className="prediction-select"
              value={selectedCardCategory}
              onChange={(e) => setSelectedCardCategory(e.target.value as any)}
            >
              <option value="Debit Mada">خصم مباشر / مدى (Debit Mada)</option>
              <option value="Credit Classic">ائتمانية كلاسيكية (Credit Classic)</option>
              <option value="Credit Platinum/Signature">ائتمانية فاخرة (Platinum / Infinite)</option>
              <option value="Prepaid / Travel">مسبقة الدفع / سفر (Prepaid / Travel)</option>
              <option value="Virtual / Digital Wallet">رقمية / محفظة (Virtual Neo-Bank)</option>
              <option value="Corporate / Business">شركات وأعمال (Corporate / Business)</option>
            </select>
          </div>

          {/* Scheme Selector */}
          <div className="prediction-form-field">
            <label className="prediction-form-label">
              <Layers className="icon-xs" style={{ color: '#ffaa00' }} />
              شبكة المعالجة (Card Scheme):
            </label>
            <select
              className="prediction-select"
              value={selectedScheme}
              onChange={(e) => setSelectedScheme(e.target.value as any)}
            >
              <option value="Mada">شبكة مدى (Mada)</option>
              <option value="Visa">فيزا العالمية (Visa)</option>
              <option value="Mastercard">ماستركارد (Mastercard)</option>
              <option value="KNET">كي نت الكويتية (KNET)</option>
              <option value="Benefit">بنفت البحرينية (Benefit)</option>
              <option value="AMEX">أمريكان إكسبريس (AMEX)</option>
            </select>
          </div>
        </div>

        {/* Prediction Output Hero Banner */}
        <div className="prediction-output-banner">
          {/* Circular Score Gauge */}
          <div className="prediction-score-box">
            <div className={`score-circular-wrapper ${
              prediction.predictedSuccessRate >= 90 ? 'rate-high' :
              prediction.predictedSuccessRate >= 75 ? 'rate-medium' : 'rate-low'
            }`}>
              <div className="score-value">{prediction.predictedSuccessRate}%</div>
            </div>
            <div className="score-label">نسبة النجاح المتوقعة بالذكاء الاصطناعي</div>
            <div className={`risk-level-tag ${prediction.riskLevel}`}>
              {prediction.riskLabelAr}
            </div>
          </div>

          {/* Prediction AI Analysis & Narrative */}
          <div className="prediction-details-area">
            <div>
              <div className="ai-narrative-box">
                <div className="ai-narrative-header">
                  <Sparkles className="icon-xs" />
                  <span>تحليل الذكاء الاصطناعي استناداً للبيانات التاريخية:</span>
                </div>
                <p style={{ margin: 0 }}>{prediction.aiPredictionNarrativeAr}</p>
              </div>

              <div className="historical-data-strip" style={{ marginTop: '10px' }}>
                <div className="data-strip-item">
                  <span>سجل العمليات المفحوصة:</span>
                  <strong>{prediction.historicalOperationsEvaluated.toLocaleString('ar-EG')} عملية</strong>
                </div>
                <div className="data-strip-item">
                  <span>العمليات الناجحة:</span>
                  <strong style={{ color: '#00e676' }}>{prediction.historicalSuccessfulCount}</strong>
                </div>
                <div className="data-strip-item">
                  <span>العمليات المرفوضة:</span>
                  <strong style={{ color: '#ef4444' }}>{prediction.historicalFailedCount}</strong>
                </div>
                <div className="data-strip-item">
                  <span>المعدل التاريخي الأساسي:</span>
                  <strong>{prediction.historicalBaselineRate}%</strong>
                </div>
              </div>
            </div>

            <div className="pre-input-advice-card">
              <Zap className="icon-sm" style={{ color: '#ffaa00', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>توصية الذكاء الاصطناعي الاستباقية قبل إدخال البطاقة:</strong>
                <p style={{ margin: '4px 0 0 0' }}>{prediction.preInputAdviceAr}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gateway Rankings Forecast */}
        <div className="predicted-gateways-container">
          <div className="predicted-gw-title">
            <span>🏆 توقعات نسب القبول وترتيب البوابات لهذا البنك ({prediction.bankNameAr}):</span>
            <button
              type="button"
              className="btn-apply-bins"
              onClick={() => handleInjectBankBins(prediction.bankId)}
            >
              <ArrowDownToLineIcon className="icon-xs" />
              تحميل بينات {prediction.bankNameAr} في صندوق الفحص أدناه
            </button>
          </div>

          <div className="predicted-gateways-grid">
            {prediction.gatewayRankings.map((gw) => (
              <div
                key={gw.gatewayId}
                className={`predicted-gw-card ${gw.isOptimal ? 'optimal' : ''}`}
              >
                <div className="predicted-gw-top">
                  <div className="gw-meta-group">
                    <span className="gw-logo-mini">{gw.logo}</span>
                    <div>
                      <h5 className="gw-name-text">{gw.gatewayName}</h5>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{gw.badge}</span>
                    </div>
                  </div>
                  <div className={`predicted-rate-pill ${
                    gw.predictedRate >= 95 ? 'high' : gw.predictedRate >= 75 ? 'medium' : 'low'
                  }`}>
                    {gw.predictedRate}%
                  </div>
                </div>

                <div className="predicted-gw-verdict">
                  {gw.isOptimal && <Sparkles className="icon-xs" style={{ color: '#00e676' }} />}
                  <span><strong>القرار:</strong> {gw.routingVerdict}</span>
                </div>

                <div className="predicted-gw-action-row">
                  <span>المحاولات التاريخية: {gw.historicalAttempts}</span>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00c3ff',
                      fontSize: '0.73rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                    onClick={() =>
                      handleCopy(
                        `توجيه ذكي: عند استقبال بطاقة ${prediction.bankNameAr} (${prediction.cardCategory}) وجه إلى [${gw.gatewayName}] بنسبة نجاح متوقعة ${gw.predictedRate}%`,
                        `pred-copy-${gw.gatewayId}`
                      )
                    }
                  >
                    {copiedText === `pred-copy-${gw.gatewayId}` ? (
                      <>
                        <Check className="icon-xs" /> تم النسخ
                      </>
                    ) : (
                      <>
                        <Copy className="icon-xs" /> نسخ التوجيه
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Predicted Failure Root Causes Pills */}
        <div className="predicted-risks-box">
          <div className="predicted-risks-title">
            <ShieldAlert className="icon-xs" />
            <span>أبرز أسباب الرفض التاريخية المتوقعة لهذا البنك والنوع وطرق تفاديها استباقياً:</span>
          </div>

          <div className="risks-list-grid">
            {prediction.topPredictedFailureRisks.map((risk, idx) => (
              <div key={idx} className="risk-pill-card">
                <div className="risk-pill-header">
                  <span>{risk.reasonAr}</span>
                  <span className="risk-prob-tag">{risk.probability}% من حالات الرفض</span>
                </div>
                <div className="risk-mitigation-text">
                  <strong style={{ color: '#cbd5e1' }}>الحل المسبق:</strong> {risk.mitigationActionAr}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input Form Box */}
      <div className="bin-input-card">
        <div className="input-card-header">
          <div className="input-title-group">
            <CreditCard className="icon-md" style={{ color: '#ff5500' }} />
            <div>
              <h3 className="input-title">صندوق إدخال الـ BINs (عدة بطاقات أو بطاقة واحدة)</h3>
              <p className="input-help">
                أدخل أول 6 أو 8 أرقام من البطاقات مفصولة بفواصل أو أسطر جديدة أو مسافات.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="clear-btn"
            onClick={() => setInputBinsText('')}
          >
            <RefreshCw className="icon-xs" />
            مسح الحقول
          </button>
        </div>

        <textarea
          className="bin-textarea"
          rows={3}
          value={inputBinsText}
          onChange={(e) => setInputBinsText(e.target.value)}
          placeholder="مثال: 588846, 458838, 457812, 407523, 468547..."
        />

        <div className="input-stats-bar">
          <div className="stat-pill">
            <span className="stat-label">إجمالي البنات المدخلة:</span>
            <span className="stat-val">{report.totalInputBins}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">الأنواع المكتشفة:</span>
            <span className="stat-val" style={{ color: '#ff5500' }}>
              {report.categoriesFound.length} أنواع مصرفية
            </span>
          </div>
          {report.universal100Gateways.length > 0 && (
            <div className="stat-pill success">
              <ShieldCheck className="icon-xs" />
              <span className="stat-label">بوابات تقبل 100% عبر كافة الأنواع:</span>
              <span className="stat-val">
                {report.universal100Gateways.map(g => g.gatewayName.split(' ')[0]).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Universal 100% Gateways Highlight (If any exist for ALL entered BINs) */}
      {report.universal100Gateways.length > 0 && (
        <div className="universal-100-banner">
          <div className="universal-banner-icon">
            <Sparkles className="icon-lg" style={{ color: '#00e676' }} />
          </div>
          <div className="universal-banner-content">
            <div className="universal-tag">
              🏆 بوابة ذهبية موحدة — 100% قبول مضمون لجميع مدخلاتك
            </div>
            <h3 className="universal-title">
              {report.universal100Gateways.map(u => u.gatewayName).join(' و ')}
            </h3>
            <p className="universal-desc">
              هذه البوابات تقبل بنسبة <strong>100% قطعية</strong> جميع أنواع البطاقات التي أدخلتها أعلاه
              بدون أي حظر للـ BIN وبدون أي قيود أو استثناءات للمخاطر. التوجيه إليها يضمن صفر حالات رفض (Zero Decline).
            </p>
          </div>
        </div>
      )}

      {/* Category Tabs & Filter Toolbar */}
      <div className="toolbar-wrapper">
        <div className="category-filter-tabs">
          <button
            type="button"
            className={`tab-filter-btn ${selectedCategoryTab === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategoryTab('all')}
          >
            جميع الأنواع ({report.categoriesFound.length})
          </button>
          {report.categoriesFound.map((cat) => (
            <button
              key={cat.category}
              type="button"
              className={`tab-filter-btn ${selectedCategoryTab === cat.category ? 'active' : ''}`}
              onClick={() => setSelectedCategoryTab(cat.category)}
            >
              <span>{cat.icon}</span>
              <span>{cat.categoryTitleAr.split('(')[0]}</span>
              <span className="badge-count">({cat.bins.length})</span>
            </button>
          ))}
        </div>

        <div className="view-toggle-group">
          <button
            type="button"
            className={`toggle-btn ${filterMode === '100_only' ? 'active' : ''}`}
            onClick={() => setFilterMode('100_only')}
          >
            <CheckCircle2 className="icon-xs" />
            عرض بوابات الـ 100% فقط
          </button>
          <button
            type="button"
            className={`toggle-btn ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            <Filter className="icon-xs" />
            عرض كافة البوابات والحالات
          </button>
        </div>
      </div>

      {/* Categories Results Grid */}
      <div className="categories-results-container">
        {visibleCategories.length === 0 ? (
          <div className="empty-state-box">
            <AlertCircle className="icon-lg" style={{ color: '#ff9800' }} />
            <h4>لا توجد بيانات للعرض</h4>
            <p>يرجى إدخال أرقام BIN صالحة أعلاه لبدء فحص البوابات التي تقبلها بنسبة 100% كنوع.</p>
          </div>
        ) : (
          visibleCategories.map((group) => {
            const isExpanded = !!expandedDetails[group.category];
            const has100Gateways = group.guaranteedGateways.length > 0;

            return (
              <div key={group.category} className="category-card">
                {/* Category Card Header */}
                <div className="category-card-header" style={{ borderRightColor: group.badgeColor }}>
                  <div className="category-header-main">
                    <div className="cat-icon-badge" style={{ backgroundColor: `${group.badgeColor}22` }}>
                      <span className="cat-emoji">{group.icon}</span>
                    </div>
                    <div>
                      <div className="cat-type-pill" style={{ color: group.badgeColor }}>
                        نوع البطاقة (Card Type Category)
                      </div>
                      <h3 className="category-title">{group.categoryTitleAr}</h3>
                      <p className="category-desc">{group.categoryDescAr}</p>
                    </div>
                  </div>

                  <div className="category-header-stats">
                    <div className="rate-badge">
                      <span className="rate-lbl">مؤشر القبول التقريبي للنوع</span>
                      <span className="rate-num">{group.overallCategorySafetyScore}%</span>
                    </div>
                    <div className="bins-count-badge">
                      {group.bins.length} بطاقات تنتمي لهذا النوع
                    </div>
                  </div>
                </div>

                {/* Sub-bins included in this category */}
                <div className="included-bins-strip">
                  <span className="bins-strip-label">الـ BINs المندرجة تحت هذا النوع:</span>
                  <div className="bins-pill-list">
                    {group.bins.map((b) => (
                      <span key={b.bin} className="bin-tag" title={`${b.bankName} - ${b.tierName}`}>
                        <strong>{b.bin}</strong> ({b.scheme} - {b.bankName.split('(')[0]})
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Routing Advice for this specific category */}
                <div className="category-ai-advice">
                  <Sparkles className="icon-sm" style={{ color: '#ffaa00' }} />
                  <span>{group.aiRecommendation}</span>
                </div>

                {/* SECTION: 100% GUARANTEED GATEWAYS (Primary Focus of User Request) */}
                <div className="gateways-showcase-section">
                  <div className="section-title-wrap">
                    <div className="section-title-icon-100">
                      <CheckCircle2 className="icon-sm" />
                    </div>
                    <div>
                      <h4 className="section-title-text">
                        البوابات التي تقبل هذا النوع بنسبة 100% قطعية:
                      </h4>
                      <p className="section-subtitle-text">
                        تقبل كافة الـ BINs المندرجة تحت نوع ({group.categoryTitleAr.split('(')[0]}) بدون أي رفض أو قيود.
                      </p>
                    </div>
                  </div>

                  {has100Gateways ? (
                    <div className="guaranteed-gateways-grid">
                      {group.guaranteedGateways.map((gw) => (
                        <div key={gw.gatewayId} className="gateway-card-100">
                          <div className="gw-card-top">
                            <div className="gw-badge-100">
                              <ShieldCheck className="icon-xs" />
                              <span>قبول 100% مضمون</span>
                            </div>
                            <span className="gw-acceptance-ratio">
                              {gw.acceptedBinCount} من {gw.totalBinsInCategory} مقبولة
                            </span>
                          </div>

                          <div className="gw-main-info">
                            <span className="gw-logo-symbol">{gw.logo}</span>
                            <div>
                              <h5 className="gw-name">{gw.gatewayName}</h5>
                              <span className="gw-badge-sub">{gw.badge}</span>
                            </div>
                          </div>

                          <div className="gw-perks">
                            <div className="perk-item">
                              <span className="perk-dot" />
                              <span>بروتوكول 3D Secure 2 مدعوم بالكامل</span>
                            </div>
                            <div className="perk-item">
                              <span className="perk-dot" />
                              <span>توافقية مباشرة مع شبكة المعالجة {group.bins[0]?.scheme || 'البنكية'}</span>
                            </div>
                          </div>

                          <div className="gw-action-row">
                            <button
                              type="button"
                              className="gw-route-btn"
                              onClick={() =>
                                handleCopy(
                                  `قاعدة توجيه لـ [${group.categoryTitleAr}]: توجيه فوري بنسبة 100% للبوابة (${gw.gatewayName})`,
                                  `rule-${group.category}-${gw.gatewayId}`
                                )
                              }
                            >
                              {copiedText === `rule-${group.category}-${gw.gatewayId}` ? (
                                <>
                                  <Check className="icon-xs" />
                                  تم نسخ قاعدة التوجيه
                                </>
                              ) : (
                                <>
                                  <Copy className="icon-xs" />
                                  نسخ قاعدة التوجيه لهذه البوابة
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-100-warning-card">
                      <XCircle className="icon-md" style={{ color: '#f44336' }} />
                      <div>
                        <h5>لا توجد بوابة تقدم قبولاً بنسبة 100% قطعية لهذا النوع!</h5>
                        <p>
                          هذا النوع من البطاقات ({group.categoryTitleAr.split('(')[0]}) يخضع لقيود مخاطر
                          أو حظر بوابي جزئي. اضغط على زر عرض الحالات أدناه للتعرف على أسباب الرفض أو الشروط.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION: Partial & Rejected Gateways (Visible if Filter is set to 'all' or when toggled) */}
                {filterMode === 'all' && (
                  <div className="other-gateways-section">
                    <button
                      type="button"
                      className="toggle-details-btn"
                      onClick={() => toggleExpand(group.category)}
                    >
                      <span>
                        عرض البوابات المشروطة ({group.partialGateways.length}) والبوابات التي ترفض هذا النوع ({group.rejectedGateways.length})
                      </span>
                      {isExpanded ? <ChevronUp className="icon-sm" /> : <ChevronDown className="icon-sm" />}
                    </button>

                    {isExpanded && (
                      <div className="expanded-other-grid">
                        {/* Conditional / Partial Gateways */}
                        {group.partialGateways.length > 0 && (
                          <div className="other-subgroup">
                            <h5 className="subgroup-title conditional">
                              ⚠️ بوابات ذات قبول مشروط أو جزئي (ليست 100%):
                            </h5>
                            <div className="subgroup-cards-list">
                              {group.partialGateways.map((gw) => (
                                <div key={gw.gatewayId} className="subgroup-card conditional">
                                  <div className="subgroup-card-header">
                                    <span className="gw-logo-xs">{gw.logo}</span>
                                    <strong>{gw.gatewayName}</strong>
                                    <span className="status-badge conditional">
                                      {gw.acceptancePercentage}% قبول
                                    </span>
                                  </div>
                                  {gw.reasonsOrConditions.length > 0 && (
                                    <p className="condition-note">
                                      <strong>الشرط أو سبب عدم الوصول لـ 100%:</strong> {gw.reasonsOrConditions[0]}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rejected Gateways */}
                        {group.rejectedGateways.length > 0 && (
                          <div className="other-subgroup">
                            <h5 className="subgroup-title rejected">
                              ⛔ بوابات ترفض أو تحظر هذا النوع:
                            </h5>
                            <div className="subgroup-cards-list">
                              {group.rejectedGateways.map((gw) => (
                                <div key={gw.gatewayId} className="subgroup-card rejected">
                                  <div className="subgroup-card-header">
                                    <span className="gw-logo-xs">{gw.logo}</span>
                                    <strong>{gw.gatewayName}</strong>
                                    <span className="status-badge rejected">غير مقبولة (0%)</span>
                                  </div>
                                  {gw.reasonsOrConditions.length > 0 && (
                                    <p className="condition-note">
                                      <strong>سبب الحظر:</strong> {gw.reasonsOrConditions[0]}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Matrix Guide */}
      <div className="matrix-guide-card">
        <div className="guide-header">
          <Info className="icon-md" style={{ color: '#29b6f6' }} />
          <div>
            <h4 className="guide-title">كيف يتم احتساب نسبة الـ 100% ونموذج التنبؤ التاريخي؟</h4>
            <p className="guide-subtitle">معايير التصنيف المصرفي ومطابقة الـ Acquirer Switches والتعلم من سجل العمليات</p>
          </div>
        </div>
        <div className="guide-grid">
          <div className="guide-item">
            <strong>1. التنبؤ الاستباقي للذكاء الاصطناعي:</strong>
            <p>
              يحلل النموذج سجل العمليات السابق لـ 2,800+ عملية ويجمع بين معاملات البنك المصدر والدولة وفئة البطاقة لتوقع نسبة النجاح بدقة وتحديد أعلى بوابة قبل أن يقوم التاجر بإدخال البطاقة في النظام.
            </p>
          </div>
          <div className="guide-item">
            <strong>2. التصنيف النوعي المتجانس:</strong>
            <p>
              البطاقات لا تعامل كأرقام عشوائية؛ فكل BIN ينتمي لـ Product Archetype (مدى جاري، ائتماني ممتاز، مسبق دفع، شركات).
              الأداة تجمع الـ BINs المتشابهة لتخبرك بالسلوك الشامل للنوع.
            </p>
          </div>
          <div className="guide-item">
            <strong>3. شرط القبول القطعي 100%:</strong>
            <p>
              لكي تظهر البوابة في قائمة الـ 100%، يجب أن تكون <em>كافة البطاقات والـ BINs</em> المندرجة تحت هذا النوع مقبولة
              بالكامل في البوابة دون وجود أي شرط حظر للـ BIN أو قيود مخاطر الاحتيال.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple inline helper icon for download
const ArrowDownToLineIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 17V3" />
    <path d="m6 11 6 6 6-6" />
    <path d="M19 21H5" />
  </svg>
);

export default MultiBinAcceptanceTool;

