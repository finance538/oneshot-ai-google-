// PaymentFailuresDashboard.tsx
// AI Assistant Dashboard for Payment Failures & Gateway Decline Diagnostics with Programmatic Categorization

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, ShieldAlert, CreditCard, Layers, ServerCrash, Settings,
  CheckCircle2, ArrowRight, Search, Filter, RefreshCw, Sparkles, Copy,
  Check, Info, BarChart3, ChevronDown, ChevronUp, ExternalLink, HelpCircle,
  TrendingDown, ArrowUpRight, MessageSquare, ShieldCheck, X, FileSpreadsheet,
  AlertCircle, BellRing, Flame, Sliders, Radio, TrendingUp, Zap, CheckCheck
} from 'lucide-react';
import {
  FAILURE_CATEGORIES,
  REASON_CODES,
  GATEWAYS_FAILURE_STATS,
  SAMPLE_FAILURE_TRANSACTIONS,
  INITIAL_SPIKE_ALERTS,
  generateCustomSpikeAlert,
  diagnoseCardDecline,
  type FailureCategoryId,
  type GatewayFailureStats,
  type DetailedFailureTransaction,
  type CardDeclineDiagnosis,
  type FailureSpikeAlert
} from './paymentFailuresData';
import './PaymentFailuresDashboard.css';

interface PaymentFailuresDashboardProps {
  onConsultAi?: (prompt: string) => void;
}

export default function PaymentFailuresDashboard({ onConsultAi }: PaymentFailuresDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'diagnostics' | 'declines_log' | 'ai_recommendations'>('overview');
  
  // Spike Alerts State
  const [alerts, setAlerts] = useState<FailureSpikeAlert[]>(INITIAL_SPIKE_ALERTS);
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'active' | 'resolved'>('all');
  const [alertGatewayFilter, setAlertGatewayFilter] = useState<string>('all');
  const [alertActionNotice, setAlertActionNotice] = useState<string | null>(null);
  
  // Spike Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simGateway, setSimGateway] = useState('telr');
  const [simReason, setSimReason] = useState('THREEDS_AUTH_FAILED');
  const [simSpikePct, setSimSpikePct] = useState(160);
  const [isScanning, setIsScanning] = useState(false);

  // Diagnostics State
  const [inputCardOrBin, setInputCardOrBin] = useState('588846');
  const [selectedGateway, setSelectedGateway] = useState('telr');
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>('');
  const [diagnosedResult, setDiagnosedResult] = useState<CardDeclineDiagnosis>(() =>
    diagnoseCardDecline('588846', 'telr')
  );

  // Filters State for Log
  const [logGatewayFilter, setLogGatewayFilter] = useState<string>('all');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedTxDetail, setSelectedTxDetail] = useState<DetailedFailureTransaction | null>(null);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  // Run Diagnosis
  const handleRunDiagnosis = (cardToDiagnose?: string, gatewayToDiagnose?: string, forcedReason?: string) => {
    const card = cardToDiagnose !== undefined ? cardToDiagnose : inputCardOrBin;
    const gw = gatewayToDiagnose !== undefined ? gatewayToDiagnose : selectedGateway;
    const rCode = forcedReason !== undefined ? forcedReason : (selectedReasonCode || undefined);
    
    const result = diagnoseCardDecline(card, gw, rCode);
    setDiagnosedResult(result);
  };

  // Quick Preset Selector for Diagnostics
  const handleSelectPreset = (presetCard: string, presetGw: string, presetReason: string) => {
    setInputCardOrBin(presetCard);
    setSelectedGateway(presetGw);
    setSelectedReasonCode(presetReason);
    handleRunDiagnosis(presetCard, presetGw, presetReason);
    setActiveTab('diagnostics');
  };

  // Alert Action Handlers
  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        const nextStatus = a.status === 'resolved' ? 'active' : 'resolved';
        return { ...a, status: nextStatus };
      }
      return a;
    }));
    setAlertActionNotice('تم تحديث حالة التنبيه بنجاح.');
    setTimeout(() => setAlertActionNotice(null), 3000);
  };

  const handleApplyFailover = (alert: FailureSpikeAlert, targetGw?: string) => {
    const destination = (targetGw || 'paytabs').toUpperCase();
    setAlertActionNotice(`⚡ تم تفعيل التوجيه الذكي التلقائي (Smart Failover) بنجاح: تم تحويل عمليات ${alert.gatewayName} المتأثرة برفض ${alert.reasonDetails.titleAr} مباشرة إلى ${destination}.`);
    setTimeout(() => setAlertActionNotice(null), 4500);
  };

  const handleInspectAlertCard = (sampleCard: string, gatewayId: string, reasonCode: string) => {
    setInputCardOrBin(sampleCard);
    setSelectedGateway(gatewayId);
    setSelectedReasonCode(reasonCode);
    handleRunDiagnosis(sampleCard, gatewayId, reasonCode);
    setActiveTab('diagnostics');
  };

  const handleTriggerSimulatedSpike = () => {
    const newAlert = generateCustomSpikeAlert(simGateway, simReason, simSpikePct);
    setAlerts(prev => [newAlert, ...prev]);
    setActiveTab('alerts');
    setAlertActionNotice(`🚨 تم اكتشاف ومحاكاة زيادة مفاجئة بنسبة (+${simSpikePct}%) على بوابة ${newAlert.gatewayName} بسبب ${newAlert.reasonDetails.titleAr}.`);
    setTimeout(() => setAlertActionNotice(null), 4000);
  };

  const handleScanGateways = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setAlertActionNotice('✅ تم مسح وتحديث تدفقات البوابات (Telr, PayTabs, Tap, Stripe, Urway): تم تأكيد رصد معدلات الارتفاع اللحظية.');
      setTimeout(() => setAlertActionNotice(null), 3500);
    }, 1100);
  };

  // Active Alerts Computations
  const activeAlertsCount = useMemo(() => alerts.filter(a => a.status === 'active').length, [alerts]);
  const criticalAlertsCount = useMemo(() => alerts.filter(a => a.status === 'active' && a.severity === 'critical').length, [alerts]);
  const topActiveAlert = useMemo(() => alerts.find(a => a.status === 'active') || alerts[0], [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (alertSeverityFilter === 'critical' && a.severity !== 'critical') return false;
      if (alertSeverityFilter === 'warning' && a.severity !== 'warning') return false;
      if (alertSeverityFilter === 'active' && a.status !== 'active') return false;
      if (alertSeverityFilter === 'resolved' && a.status !== 'resolved') return false;
      if (alertGatewayFilter !== 'all' && a.gatewayId !== alertGatewayFilter) return false;
      return true;
    });
  }, [alerts, alertSeverityFilter, alertGatewayFilter]);

  // Filtered Failures List
  const filteredTransactions = useMemo(() => {
    return SAMPLE_FAILURE_TRANSACTIONS.filter(tx => {
      if (logGatewayFilter !== 'all' && tx.gateway !== logGatewayFilter) return false;
      const reasonMeta = REASON_CODES[tx.reasonCode];
      if (logCategoryFilter !== 'all' && reasonMeta?.categoryId !== logCategoryFilter) return false;
      if (logSearchQuery.trim()) {
        const query = logSearchQuery.toLowerCase();
        const matchesRef = tx.transactionRef.toLowerCase().includes(query);
        const matchesCard = tx.cardMasked.toLowerCase().includes(query) || tx.bin.includes(query);
        const matchesBank = tx.bankName.toLowerCase().includes(query);
        const matchesCustomer = tx.customerName.toLowerCase().includes(query) || tx.customerEmail.toLowerCase().includes(query);
        const matchesCode = tx.rawErrorCode.toLowerCase().includes(query) || tx.reasonCode.toLowerCase().includes(query);
        if (!matchesRef && !matchesCard && !matchesBank && !matchesCustomer && !matchesCode) {
          return false;
        }
      }
      return true;
    });
  }, [logGatewayFilter, logCategoryFilter, logSearchQuery]);

  // Overall Global Statistics Calculation
  const globalStats = useMemo(() => {
    let totalAttempts = 0;
    let totalFailed = 0;
    const categoryTotals: Record<FailureCategoryId, number> = {
      FRAUD_SECURITY: 0,
      FUNDS_LIMITS: 0,
      GATEWAY_BIN: 0,
      TECH_PROCESSOR: 0,
      COMPLIANCE_CONFIG: 0
    };

    GATEWAYS_FAILURE_STATS.forEach(gw => {
      totalAttempts += gw.totalAttempts;
      totalFailed += gw.failedCount;
      gw.topFailureCategories.forEach(cat => {
        categoryTotals[cat.categoryId] = (categoryTotals[cat.categoryId] || 0) + cat.count;
      });
    });

    const failureRate = totalAttempts > 0 ? (totalFailed / totalAttempts) * 100 : 0;
    const recoverableCount = SAMPLE_FAILURE_TRANSACTIONS.filter(t => t.isRecoverable).length;
    const recoverableRate = SAMPLE_FAILURE_TRANSACTIONS.length > 0
      ? (recoverableCount / SAMPLE_FAILURE_TRANSACTIONS.length) * 100
      : 80;

    return {
      totalAttempts,
      totalFailed,
      failureRate: failureRate.toFixed(1),
      recoverableRate: recoverableRate.toFixed(0),
      categoryTotals
    };
  }, []);

  return (
    <div className="failures-dashboard-root" dir="rtl">
      {/* Top Header Banner */}
      <section className="failures-header-card">
        <div className="failures-header-content">
          <div className="failures-header-badge">
            <Sparkles size={16} />
            <span>AI PAYMENT INTELLIGENCE · وحدة تشخيص الرفض</span>
          </div>
          <h2>لوحة تحليل حالات الرفض (Failures AI Dashboard)</h2>
          <p>
            تحليل ذكي ومباشر لكل عملية دفع مرفوضة على بواباتك (Telr, PayTabs, Tap, Stripe, Urway)، مع تصنيف برمجي ملون للأسباب (أمان، رصيد، عدم توافق الـ BIN، أعطال تقنية) لتمكين التاجر من استرداد المبيعات المفقودة فوراً.
          </p>
        </div>

        {/* Global Key Metrics Pills */}
        <div className="failures-kpi-grid">
          <div className="kpi-mini-card">
            <span className="kpi-label">إجمالي العمليات المرفوضة</span>
            <strong className="kpi-value text-red">{globalStats.totalFailed.toLocaleString()}</strong>
            <span className="kpi-subtext">من أصل {globalStats.totalAttempts.toLocaleString()} محاولة</span>
          </div>
          <div className="kpi-mini-card">
            <span className="kpi-label">معدل الرفض العام (Failures Rate)</span>
            <strong className="kpi-value text-orange">{globalStats.failureRate}%</strong>
            <span className="kpi-subtext">عبر كافة البوابات النشطة</span>
          </div>
          <div className="kpi-mini-card">
            <span className="kpi-label">نسبة العمليات القابلة للاسترداد</span>
            <strong className="kpi-value text-green">{globalStats.recoverableRate}%</strong>
            <span className="kpi-subtext">بمجرد توجيه العميل أو تبديل البوابة</span>
          </div>
        </div>
      </section>

      {/* Action Notification Toast Banner */}
      {alertActionNotice && (
        <div className="alert-action-toast view-fade-in" role="status">
          <Sparkles size={16} />
          <span>{alertActionNotice}</span>
          <button type="button" onClick={() => setAlertActionNotice(null)} className="toast-close">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Live Spike Alert Top Ticker Banner */}
      {activeAlertsCount > 0 && (
        <div className="dashboard-spike-alert-banner view-fade-in">
          <div className="alert-banner-left">
            <span className="live-pulse-dot" />
            <div className="alert-banner-icon-box">
              <BellRing size={18} className="bell-shake" />
            </div>
            <div className="alert-banner-text">
              <div className="alert-banner-title">
                <strong>🚨 اكتشاف زيادة مفاجئة في حالات الرفض ({activeAlertsCount} تنبيهات حرجة لبوابات الدفع)</strong>
                <span className="alert-banner-chip">{topActiveAlert.gatewayName}: +{topActiveAlert.spikePercentage}% قفزة</span>
              </div>
              <p className="alert-banner-desc">
                السبب البرمجي الأبرز: <strong>{topActiveAlert.reasonDetails.titleAr} ({topActiveAlert.primaryReasonCode})</strong> · {topActiveAlert.technicalSummaryAr}
              </p>
            </div>
          </div>
          <div className="alert-banner-actions">
            <button
              type="button"
              className="alert-banner-btn-primary"
              onClick={() => setActiveTab('alerts')}
            >
              <Zap size={14} />
              <span>فحص وإدارة التنبيهات ({activeAlertsCount})</span>
            </button>
            <button
              type="button"
              className="alert-banner-btn-secondary"
              onClick={() => handleInspectAlertCard(topActiveAlert.sampleCardForTesting, topActiveAlert.gatewayId, topActiveAlert.primaryReasonCode)}
            >
              <CreditCard size={14} />
              <span>تشخيص البطاقة المتأثرة فوراً</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="failures-nav-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          <span>مقارنة أداء البوابات والتحليل العام</span>
        </button>

        <button
          type="button"
          className={`tab-btn tab-btn-alerts ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <BellRing size={16} className={activeAlertsCount > 0 ? "bell-pulse-icon text-red" : ""} />
          <span>تنبيهات الارتفاع المفاجئ (Spike Alerts)</span>
          {activeAlertsCount > 0 && (
            <span className="tab-alert-badge">{activeAlertsCount} نشط</span>
          )}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          <CreditCard size={16} />
          <span>محلل وتشخيص رفض بطاقة معينة (AI Diagnostics)</span>
          <span className="tab-chip-pill">فوري</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'declines_log' ? 'active' : ''}`}
          onClick={() => setActiveTab('declines_log')}
        >
          <Layers size={16} />
          <span>سجل العمليات المرفوضة المباشر ({filteredTransactions.length})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'ai_recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai_recommendations')}
        >
          <Sparkles size={16} />
          <span>توصيات الذكاء الاصطناعي لرفع القبول</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW & GATEWAY BREAKDOWN */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="failures-tab-content view-fade-in">
          {/* Active Spike Alerts Callout Banner inside Overview */}
          {activeAlertsCount > 0 && (
            <div className="overview-spike-alert-callout">
              <div className="callout-header">
                <div className="callout-icon-title">
                  <div className="callout-pulse-badge">
                    <span className="pulse-ring" />
                    <BellRing size={18} />
                  </div>
                  <div>
                    <h4>🚨 اكتشاف زيادة مفاجئة في حالات الرفض ({activeAlertsCount} تنبيهات حرجة)</h4>
                    <p>رصد محرك الذكاء الاصطناعي قفزات غير اعتيادية في نسب الرفض لبوابات الدفع مع توضيح الأسباب البرمجية المسببة.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="callout-cta-btn"
                  onClick={() => setActiveTab('alerts')}
                >
                  <span>عرض جميع التنبيهات ({activeAlertsCount})</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="callout-spikes-grid">
                {alerts.filter(a => a.status === 'active').slice(0, 2).map(alert => (
                  <div key={alert.id} className="callout-spike-card" style={{ borderRightColor: alert.categoryDetails.color }}>
                    <div className="callout-spike-top">
                      <span className="callout-gw-badge" style={{ backgroundColor: alert.brandColor }}>
                        {alert.gatewayName}
                      </span>
                      <span className="callout-spike-pct">+{alert.spikePercentage}% ارتفاع مفاجئ</span>
                    </div>
                    <div className="callout-spike-reason">
                      <strong>السبب البرمجي: {alert.reasonDetails.titleAr}</strong>
                      <span className="callout-codes">[{alert.rawGatewayCodes.slice(0, 3).join(', ')}]</span>
                    </div>
                    <p className="callout-summary">{alert.technicalSummaryAr}</p>
                    <div className="callout-actions-row">
                      <button
                        type="button"
                        className="callout-sub-btn"
                        onClick={() => handleApplyFailover(alert, alert.recommendedActions[0]?.targetGateway)}
                      >
                        <Zap size={13} />
                        <span>تفعيل التوجيه الذكي</span>
                      </button>
                      <button
                        type="button"
                        className="callout-sub-btn-ghost"
                        onClick={() => handleInspectAlertCard(alert.sampleCardForTesting, alert.gatewayId, alert.primaryReasonCode)}
                      >
                        <CreditCard size={13} />
                        <span>تشخيص فوري</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Programmatic Category Legend Bar */}
          <div className="category-legend-card">
            <div className="legend-title">
              <Layers size={17} />
              <strong>التصنيف والتلوين البرمجي لأسباب الرفض (Failures Categorization):</strong>
            </div>
            <div className="legend-pills-row">
              {Object.values(FAILURE_CATEGORIES).map(cat => (
                <div
                  key={cat.id}
                  className="legend-pill"
                  style={{
                    backgroundColor: cat.bgTint,
                    borderColor: cat.borderColor,
                    color: cat.color
                  }}
                >
                  <span className="legend-dot" style={{ backgroundColor: cat.color }} />
                  <strong>{cat.nameAr}</strong>
                  <span className="legend-count">({globalStats.categoryTotals[cat.id] || 0} حالة)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gateways Cards Grid */}
          <div className="gateways-grid-section">
            <div className="section-title-wrap">
              <h3>معدلات وأسباب الرفض لكل بوابة دفع نشطة</h3>
              <p>توزيع برمجيات الرفض مع بيان أكثر أسباب التعثر شيوعاً لكل مزود</p>
            </div>

            <div className="gateways-cards-container">
              {GATEWAYS_FAILURE_STATS.map(gw => {
                const totalCatCount = gw.topFailureCategories.reduce((acc, c) => acc + c.count, 0) || 1;
                return (
                  <div key={gw.gatewayId} className="gateway-stat-card">
                    <div className="gw-card-header">
                      <div className="gw-brand-wrap">
                        <span className="gw-badge-logo" style={{ backgroundColor: gw.brandColor }}>
                          {gw.logoText}
                        </span>
                        <div>
                          <h4>{gw.gatewayName}</h4>
                          <small className="gw-attempts-text">
                            {gw.totalAttempts.toLocaleString()} محاولة دفع إجمالية
                          </small>
                        </div>
                      </div>

                      <div className="gw-rate-indicator">
                        <span className="rate-num text-orange">{gw.failureRate}%</span>
                        <span className="rate-sub">نسبة الرفض ({gw.failedCount} عملية)</span>
                      </div>
                    </div>

                    {/* Visual Segmented Progress Bar */}
                    <div className="gw-segmented-bar" title="التوزيع البرمجي لأسباب الرفض">
                      {gw.topFailureCategories.map(cat => {
                        const meta = FAILURE_CATEGORIES[cat.categoryId];
                        const widthPct = Math.max(8, (cat.count / totalCatCount) * 100);
                        return (
                          <div
                            key={cat.categoryId}
                            className="bar-segment"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: meta.color
                            }}
                            title={`${meta.nameAr}: ${cat.count} (${cat.percentage}%)`}
                          />
                        );
                      })}
                    </div>

                    {/* Breakdown by Category Badges */}
                    <div className="gw-categories-breakdown">
                      {gw.topFailureCategories.map(cat => {
                        const meta = FAILURE_CATEGORIES[cat.categoryId];
                        return (
                          <div
                            key={cat.categoryId}
                            className="cat-breakdown-row"
                            style={{
                              backgroundColor: meta.bgTint,
                              borderColor: meta.borderColor,
                              color: meta.color
                            }}
                          >
                            <span className="cat-bullet" style={{ backgroundColor: meta.color }} />
                            <span className="cat-name">{meta.nameAr}</span>
                            <strong className="cat-pct">{cat.percentage}% ({cat.count})</strong>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Diagnosis Snippet */}
                    <div className="gw-ai-note">
                      <div className="gw-ai-head">
                        <Sparkles size={14} />
                        <strong>توصية الـ AI الخاصة ببوابة {gw.gatewayName}:</strong>
                      </div>
                      <p>{gw.aiSummary}</p>
                    </div>

                    {/* Action button */}
                    <button
                      type="button"
                      className="gw-action-btn"
                      onClick={() => {
                        setSelectedGateway(gw.gatewayId);
                        handleRunDiagnosis(inputCardOrBin, gw.gatewayId);
                        setActiveTab('diagnostics');
                      }}
                    >
                      <CreditCard size={14} />
                      <span>اختبار وتشخيص بطاقة على هذه البوابة</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: SPIKE ALERTS (تنبيهات الارتفاع المفاجئ في حالات الرفض) */}
      {/* ============================================================== */}
      {activeTab === 'alerts' && (
        <div className="failures-tab-content view-fade-in">
          {/* Alerts KPI Banner */}
          <div className="alerts-kpis-container">
            <div className="alert-kpi-item border-red">
              <div className="alert-kpi-icon-wrap bg-red">
                <BellRing size={20} />
              </div>
              <div className="alert-kpi-info">
                <span className="alert-kpi-label">تنبيهات حرجة نشطة</span>
                <strong className="alert-kpi-val text-red">{criticalAlertsCount} تنبيهات حرجة</strong>
                <span className="alert-kpi-sub">{activeAlertsCount} إجمالي التنبيهات المفتوحة</span>
              </div>
            </div>

            <div className="alert-kpi-item border-orange">
              <div className="alert-kpi-icon-wrap bg-orange">
                <TrendingUp size={20} />
              </div>
              <div className="alert-kpi-info">
                <span className="alert-kpi-label">أعلى قفزة مفاجئة مرصودة</span>
                <strong className="alert-kpi-val text-orange">+210% ارتفاع</strong>
                <span className="alert-kpi-sub">بوابة سترايب لبطاقات مدى</span>
              </div>
            </div>

            <div className="alert-kpi-item border-purple">
              <div className="alert-kpi-icon-wrap bg-purple">
                <Layers size={20} />
              </div>
              <div className="alert-kpi-info">
                <span className="alert-kpi-label">أبرز الأسباب البرمجية للقفزات</span>
                <strong className="alert-kpi-val text-purple">3D Secure & Insufficient Funds</strong>
                <span className="alert-kpi-sub">أكواد E01 و 51 و Scheme Blocked</span>
              </div>
            </div>

            <div className="alert-kpi-item border-green">
              <div className="alert-kpi-icon-wrap bg-green">
                <ShieldCheck size={20} />
              </div>
              <div className="alert-kpi-info">
                <span className="alert-kpi-label">الحماية الآلية المتاحة</span>
                <strong className="alert-kpi-val text-green">Auto-Failover جاهز</strong>
                <span className="alert-kpi-sub">توجيه بديل بضغطة زر واحدة</span>
              </div>
            </div>
          </div>

          {/* Alerts Filter & Action Bar */}
          <div className="alerts-control-bar">
            <div className="alerts-filter-pills">
              <button
                type="button"
                className={`filter-pill-btn ${alertSeverityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setAlertSeverityFilter('all')}
              >
                الكل ({alerts.length})
              </button>
              <button
                type="button"
                className={`filter-pill-btn pill-critical ${alertSeverityFilter === 'critical' ? 'active' : ''}`}
                onClick={() => setAlertSeverityFilter('critical')}
              >
                🚨 حرجة ({alerts.filter(a => a.severity === 'critical').length})
              </button>
              <button
                type="button"
                className={`filter-pill-btn pill-warning ${alertSeverityFilter === 'warning' ? 'active' : ''}`}
                onClick={() => setAlertSeverityFilter('warning')}
              >
                ⚠️ تحذيرات ({alerts.filter(a => a.severity === 'warning').length})
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${alertSeverityFilter === 'active' ? 'active' : ''}`}
                onClick={() => setAlertSeverityFilter('active')}
              >
                نشطة فقط ({activeAlertsCount})
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${alertSeverityFilter === 'resolved' ? 'active' : ''}`}
                onClick={() => setAlertSeverityFilter('resolved')}
              >
                تم حلها ({alerts.filter(a => a.status === 'resolved').length})
              </button>
            </div>

            <div className="alerts-actions-side">
              <select
                className="alerts-gw-select"
                value={alertGatewayFilter}
                onChange={e => setAlertGatewayFilter(e.target.value)}
              >
                <option value="all">كافة البوابات</option>
                <option value="telr">Telr (تيلر)</option>
                <option value="paytabs">PayTabs (بيتابس)</option>
                <option value="stripe">Stripe (سترايب)</option>
                <option value="tap">Tap Payments (تاب)</option>
              </select>

              <button
                type="button"
                className="alerts-scan-btn"
                onClick={handleScanGateways}
                disabled={isScanning}
              >
                <RefreshCw size={15} className={isScanning ? "spin-icon" : ""} />
                <span>{isScanning ? 'جارِ فحص التدفقات...' : 'فحص ومسح البوابات الآن'}</span>
              </button>

              <button
                type="button"
                className={`alerts-simulator-toggle-btn ${isSimulatorOpen ? 'active' : ''}`}
                onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              >
                <Sliders size={15} />
                <span>محاكي الارتفاع المفاجئ والحساسية</span>
              </button>
            </div>
          </div>

          {/* Spike Simulator & Sensitivity Drawer */}
          {isSimulatorOpen && (
            <div className="spike-simulator-drawer view-fade-in">
              <div className="simulator-head">
                <div className="sim-title-wrap">
                  <Sliders size={18} />
                  <h4>محاكي كشف الارتفاع المفاجئ (Spike Detector Simulator) وضبط عتبة التنبيه</h4>
                </div>
                <button
                  type="button"
                  className="sim-close-btn"
                  onClick={() => setIsSimulatorOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <p className="sim-desc">
                تتيح لك هذه الأداة تجربة واختبار نظام التنبيهات الفورية؛ يمكنك محاكاة قفزة مفاجئة في حالات الرفض لأي بوابة دفع وتحديد السبب البرمجي (مثل: Insufficient funds أو 3D secure failure) للتحقق من سرعة رصد النظام وكفاءة التوجيه التلقائي.
              </p>

              <div className="sim-controls-grid">
                <label className="sim-field">
                  <span>بوابة الدفع المستهدفة بالمحاكاة:</span>
                  <select
                    value={simGateway}
                    onChange={e => setSimGateway(e.target.value)}
                    className="sim-input"
                  >
                    <option value="telr">Telr (تيلر)</option>
                    <option value="paytabs">PayTabs (بيتابس)</option>
                    <option value="stripe">Stripe (سترايب)</option>
                    <option value="tap">Tap Payments (تاب)</option>
                    <option value="urway">Urway (يورواي)</option>
                    <option value="moyasar">Moyasar (ميسر)</option>
                  </select>
                </label>

                <label className="sim-field">
                  <span>السبب البرمجي للرفض المستهدف بالقفزة:</span>
                  <select
                    value={simReason}
                    onChange={e => setSimReason(e.target.value)}
                    className="sim-input"
                  >
                    <option value="THREEDS_AUTH_FAILED">[أمان] فشل التحقق 3D Secure / انقطاع رمز OTP</option>
                    <option value="INSUFFICIENT_FUNDS">[رصيد] رصيد غير كافٍ في الحساب (كود 51 / E04)</option>
                    <option value="DAILY_LIMIT_EXCEEDED">[حدود] تجاوز الحد اليومي للشراء الإلكتروني (كود 61)</option>
                    <option value="BIN_BLOCKED_BY_GATEWAY">[توافق] حظر البوابة لبطاقات السفر المسبقة الدفع</option>
                    <option value="CARD_TYPE_NOT_SUPPORTED">[امتثال] رفض بطاقات مدى المحلية على بوابة دولية</option>
                    <option value="IP_COUNTRY_MISMATCH">[أمان] تعارض الدولة واستخدام برامج VPN</option>
                    <option value="ISSUER_UNAVAILABLE">[تقني] انقطاع مؤقت في مقسم البنك المصدر (كود 91)</option>
                  </select>
                </label>

                <label className="sim-field">
                  <span>نسبة الزيادة المفاجئة المستهدفة (+{simSpikePct}%):</span>
                  <input
                    type="range"
                    min={40}
                    max={250}
                    step={10}
                    value={simSpikePct}
                    onChange={e => setSimSpikePct(Number(e.target.value))}
                    className="sim-range"
                  />
                  <div className="range-labels">
                    <span>+40% (تحذير منخفض)</span>
                    <span>+140% (حرج)</span>
                    <span>+250% (طفرة قصوى)</span>
                  </div>
                </label>
              </div>

              <div className="sim-footer">
                <button
                  type="button"
                  className="sim-launch-btn"
                  onClick={handleTriggerSimulatedSpike}
                >
                  <Zap size={16} />
                  <span>⚡ تشغيل محاكاة رصد زيادة مفاجئة الآن</span>
                </button>
              </div>
            </div>
          )}

          {/* List of Spike Alert Cards */}
          <div className="spike-alerts-cards-list">
            {filteredAlerts.length === 0 ? (
              <div className="no-alerts-card">
                <CheckCircle2 size={40} className="text-green" />
                <h3>لا توجد تنبيهات مطابقة لهذا الفلتر حالياً</h3>
                <p>معدلات الرفض على بواباتك تعمل ضمن الحدود الطبيعية المستقرة.</p>
              </div>
            ) : (
              filteredAlerts.map(alert => {
                const isCrit = alert.severity === 'critical';
                const isResolved = alert.status === 'resolved';

                return (
                  <div
                    key={alert.id}
                    className={`spike-alert-card ${isCrit ? 'card-critical' : 'card-warning'} ${isResolved ? 'card-resolved' : ''}`}
                  >
                    {/* Alert Card Header */}
                    <div className="alert-card-header">
                      <div className="alert-gw-and-badge">
                        <span
                          className="alert-gw-badge-pill"
                          style={{ backgroundColor: alert.brandColor }}
                        >
                          {alert.gatewayName}
                        </span>

                        <span className={`alert-severity-tag ${isCrit ? 'tag-critical' : 'tag-warning'}`}>
                          {isCrit ? '🚨 تنبيه حرج (Critical Spike)' : '⚠️ تحذير زيادة مفاجئة (Warning)'}
                        </span>

                        <span className="alert-time-pill">
                          <Radio size={12} className="pulse-dot" />
                          <span>{alert.timestamp} · {alert.timeframe}</span>
                        </span>

                        {isResolved && (
                          <span className="alert-resolved-tag">
                            <CheckCheck size={13} />
                            <span>تم الحل والتعافي</span>
                          </span>
                        )}
                      </div>

                      <div className="alert-status-action">
                        <button
                          type="button"
                          className="resolve-toggle-btn"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          {isResolved ? 'إعادة فتح التنبيه' : 'تعليم كمحلول'}
                        </button>
                      </div>
                    </div>

                    {/* Alert Headline & Metrics Comparison */}
                    <div className="alert-headline-box">
                      <div className="alert-spike-metric-badge">
                        <Flame size={20} />
                        <div>
                          <strong>+{alert.spikePercentage}%</strong>
                          <small>زيادة مفاجئة في الرفض</small>
                        </div>
                      </div>

                      <div className="alert-headline-text">
                        <h3>{alert.technicalSummaryAr}</h3>
                        <div className="alert-rates-compare">
                          <div className="rate-compare-pill">
                            <span>المعدل المعتاد الطبيعي:</span>
                            <strong>{alert.baselineFailureRate}% ({alert.normalBaselineCount} عملية)</strong>
                          </div>
                          <span className="rate-arrow">⬅️</span>
                          <div className="rate-compare-pill alert-jump-pill">
                            <span>المعدل الحالي أثناء القفزة:</span>
                            <strong className={isCrit ? "text-red" : "text-orange"}>
                              {alert.currentFailureRate}% ({alert.failureCountInWindow} عملية مرفوضة)
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Programmatic Reason & Codes (السبب البرمجي للرفض) */}
                    <div
                      className="programmatic-cause-box"
                      style={{
                        backgroundColor: alert.categoryDetails.bgTint,
                        borderColor: alert.categoryDetails.borderColor
                      }}
                    >
                      <div className="cause-box-top">
                        <div className="cause-cat-badge" style={{ color: alert.categoryDetails.color }}>
                          <ShieldAlert size={16} />
                          <strong>التصنيف البرمجي: {alert.categoryDetails.nameAr}</strong>
                        </div>
                        <span className="cause-english-title">
                          {alert.reasonDetails.titleEn} [{alert.primaryReasonCode}]
                        </span>
                      </div>

                      <div className="cause-main-title">
                        <h4>السبب البرمجي الدقيق: {alert.reasonDetails.titleAr}</h4>
                      </div>

                      {/* Raw Gateway Error Codes */}
                      <div className="raw-codes-row">
                        <span className="raw-codes-label">الأكواد البرمجية المستلمة من مقسم البوابة:</span>
                        <div className="raw-codes-tags">
                          {alert.rawGatewayCodes.map(code => (
                            <code key={code} className="code-tag">
                              {code}
                            </code>
                          ))}
                        </div>
                      </div>

                      {/* Deep Technical Explanation */}
                      <div className="cause-diagnosis-text">
                        <p>{alert.programmaticDiagnosisAr}</p>
                      </div>

                      {/* Affected BINs / Banks */}
                      <div className="affected-bins-section">
                        <span className="bins-title">البنوك وبطاقات الـ BIN الأكثر تأثراً بهذه الزيادة المفاجئة:</span>
                        <div className="bins-chips-row">
                          {alert.affectedBinsSample.map(item => (
                            <div key={item.bin} className="bin-chip">
                              <span className="bin-code">{item.bin}</span>
                              <span className="bin-lbl">{item.label}</span>
                              <strong className="bin-cnt">({item.count} حالة)</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recommended Remediation Actions Toolkit */}
                    <div className="alert-actions-toolkit">
                      <div className="toolkit-title">
                        <Zap size={16} />
                        <strong>إجراءات التدخل السريع المقترحة من محرك الذكاء الاصطناعي:</strong>
                      </div>

                      <div className="toolkit-buttons-row">
                        {alert.recommendedActions.map(action => (
                          <div key={action.id} className="action-pill-card">
                            <div className="action-pill-info">
                              <strong>{action.titleAr}</strong>
                              <p>{action.descriptionAr}</p>
                            </div>

                            {action.actionType === 'auto_failover' && (
                              <button
                                type="button"
                                className="action-exec-btn btn-primary"
                                onClick={() => handleApplyFailover(alert, action.targetGateway)}
                              >
                                <Zap size={14} />
                                <span>تفعيل التوجيه فوراً</span>
                              </button>
                            )}

                            {action.actionType === 'inspect_card' && (
                              <button
                                type="button"
                                className="action-exec-btn btn-secondary"
                                onClick={() => handleInspectAlertCard(alert.sampleCardForTesting, alert.gatewayId, alert.primaryReasonCode)}
                              >
                                <CreditCard size={14} />
                                <span>تشخيص عينة البطاقة</span>
                              </button>
                            )}

                            {action.actionType === 'customer_broadcast' && (
                              <button
                                type="button"
                                className="action-exec-btn btn-secondary"
                                onClick={() => {
                                  setAlertActionNotice(`📢 تم تجهيز نموذج إشعار العملاء لسبب ${alert.reasonDetails.titleAr}: "${alert.reasonDetails.customerAdviceAr}".`);
                                  setTimeout(() => setAlertActionNotice(null), 4000);
                                }}
                              >
                                <MessageSquare size={14} />
                                <span>تجهيز إشعار العملاء</span>
                              </button>
                            )}

                            {action.actionType === 'risk_rule_relax' && (
                              <button
                                type="button"
                                className="action-exec-btn btn-secondary"
                                onClick={() => {
                                  setAlertActionNotice(`🛡️ تم إرسال طلب تحديث قواعد المخاطر لجدار حماية بوابة ${alert.gatewayName}.`);
                                  setTimeout(() => setAlertActionNotice(null), 3500);
                                }}
                              >
                                <Settings size={14} />
                                <span>تعديل حساسية الحماية</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Consult AI Assistant Button */}
                      <div className="alert-consult-ai-row">
                        <button
                          type="button"
                          className="consult-ai-prompt-btn"
                          onClick={() => {
                            const prompt = `حلل لي الزيادة المفاجئة في حالات الرفض على بوابة ${alert.gatewayName} بسبب ${alert.reasonDetails.titleAr} (${alert.primaryReasonCode}) وما هي الإجراءات العاجلة لاسترداد العمليات المرفوضة؟`;
                            if (onConsultAi) {
                              onConsultAi(prompt);
                            } else {
                              handleCopy(`ai-${alert.id}`, prompt);
                              setAlertActionNotice('تم نسخ استفسار التحليل الذكي للذكاء الاصطناعي بنجاح!');
                              setTimeout(() => setAlertActionNotice(null), 3000);
                            }
                          }}
                        >
                          <Sparkles size={14} />
                          <span>استشارة الـ AI المساعد حول هذا التنبيه وكيفية استرداد المبيعات المفقودة</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SPECIFIC CARD DECLINE DIAGNOSTICS (المحلل الفوري) */}
      {/* ============================================================== */}
      {activeTab === 'diagnostics' && (
        <div className="failures-tab-content view-fade-in">
          <div className="diagnostics-layout-grid">
            {/* Input & Parameters Panel */}
            <div className="diagnostics-input-panel">
              <div className="panel-inner-header">
                <CreditCard size={18} />
                <h3>فحص بطاقة معينة ومعرفة سبب الرفض فوراً</h3>
              </div>
              <p className="panel-desc">
                أدخل رقم البطاقة أو الـ BIN المكون من 6 أرقام، واختر البوابة لتحليل سبب الرفض برمجياً وكشف البنك المصدر والحل المقترح.
              </p>

              {/* Quick Presets */}
              <div className="presets-section">
                <span className="presets-label">⚡ نماذج بطاقات شائعة التعثر للاختبار الفوري:</span>
                <div className="presets-buttons-wrap">
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => handleSelectPreset('588846', 'telr', 'INSUFFICIENT_FUNDS')}
                  >
                    🇸🇦 مدى الراجحي (رصيد غير كافٍ)
                  </button>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => handleSelectPreset('457865', 'telr', 'BIN_BLOCKED_BY_GATEWAY')}
                  >
                    🇸🇦 سفر بلس مسبقة الدفع (حظر تيلر للـ BIN)
                  </button>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => handleSelectPreset('411111', 'paytabs', 'DAILY_LIMIT_EXCEEDED')}
                  >
                    🇸🇦 فيزا بنك الرياض (تجاوز الحد اليومي)
                  </button>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => handleSelectPreset('542400', 'tap', 'IP_COUNTRY_MISMATCH')}
                  >
                    🇦🇪 ماستركارد الإمارات (تعارض IP / VPN)
                  </button>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => handleSelectPreset('588845', 'stripe', 'CARD_TYPE_NOT_SUPPORTED')}
                  >
                    🇸🇦 مدى الإنماء (رفض سترايب لمدى)
                  </button>
                </div>
              </div>

              {/* Form Controls */}
              <div className="diag-form-row">
                <label className="diag-field-label">
                  <span>رقم البطاقة أو الـ BIN (6 أرقام):</span>
                  <input
                    type="text"
                    value={inputCardOrBin}
                    onChange={e => setInputCardOrBin(e.target.value)}
                    placeholder="مثال: 588846 أو 457865901234..."
                    className="diag-input"
                    maxLength={19}
                  />
                </label>

                <label className="diag-field-label">
                  <span>بوابة الدفع المستهدفة:</span>
                  <select
                    value={selectedGateway}
                    onChange={e => setSelectedGateway(e.target.value)}
                    className="diag-select"
                  >
                    <option value="telr">Telr (تيلر)</option>
                    <option value="paytabs">PayTabs (بيتابس)</option>
                    <option value="tap">Tap Payments (تاب)</option>
                    <option value="stripe">Stripe (سترايب)</option>
                    <option value="urway">Urway (يورواي)</option>
                    <option value="moyasar">Moyasar (ميسر)</option>
                  </select>
                </label>
              </div>

              <div className="diag-form-row">
                <label className="diag-field-label">
                  <span>سبب الرفض الملحوظ (اختياري / أو اترك الذكاء الاصطناعي يستنتجه):</span>
                  <select
                    value={selectedReasonCode}
                    onChange={e => setSelectedReasonCode(e.target.value)}
                    className="diag-select"
                  >
                    <option value="">-- استنتاج آلي ذكي حسب قيود البنك والـ BIN --</option>
                    {Object.values(REASON_CODES).map(r => (
                      <option key={r.code} value={r.code}>
                        [{r.categoryId}] {r.titleAr}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                className="diag-submit-btn"
                onClick={() => handleRunDiagnosis()}
              >
                <Sparkles size={17} />
                <span>تشخيص الرفض برمجياً الآن</span>
              </button>
            </div>

            {/* Diagnostic Result Card */}
            <div className="diagnostics-result-panel">
              {/* Virtual Card View */}
              <div className="virtual-card-preview">
                <div className="card-top-row">
                  <span className="card-chip-sim" />
                  <span className="card-scheme-pill">{diagnosedResult.scheme}</span>
                </div>
                <div className="card-number-sim">
                  {diagnosedResult.bin} •• •••• ••••
                </div>
                <div className="card-bottom-row">
                  <div>
                    <small>البنك المصدر:</small>
                    <strong>{diagnosedResult.bankName}</strong>
                  </div>
                  <div>
                    <small>النوع / الدولة:</small>
                    <span>{diagnosedResult.cardType} · {diagnosedResult.country}</span>
                  </div>
                </div>
              </div>

              {/* Categorization Alert Banner with Programmatic Coloring */}
              <div
                className="diag-category-banner"
                style={{
                  backgroundColor: diagnosedResult.matchedCategory.bgTint,
                  borderColor: diagnosedResult.matchedCategory.borderColor,
                  color: diagnosedResult.matchedCategory.color
                }}
              >
                <div className="diag-cat-title-row">
                  <span
                    className="diag-cat-dot"
                    style={{ backgroundColor: diagnosedResult.matchedCategory.color }}
                  />
                  <div>
                    <span className="cat-tag-label">التصنيف البرمجي الدقيق:</span>
                    <h4>{diagnosedResult.matchedCategory.nameAr} ({diagnosedResult.matchedCategory.nameEn})</h4>
                  </div>
                </div>
                <p className="cat-desc-p">{diagnosedResult.matchedCategory.descriptionAr}</p>
              </div>

              {/* Specific Reason & Gateway Error Code */}
              <div className="reason-breakdown-card">
                <div className="reason-head">
                  <div className="reason-title-block">
                    <AlertCircle size={18} style={{ color: diagnosedResult.matchedCategory.color }} />
                    <div>
                      <h3>{diagnosedResult.matchedReason.titleAr}</h3>
                      <small>{diagnosedResult.matchedReason.titleEn}</small>
                    </div>
                  </div>

                  <div className="raw-code-pill" dir="ltr">
                    <code>{diagnosedResult.rawResponseSimulated.code}</code>
                    <small>HTTP {diagnosedResult.rawResponseSimulated.httpStatus}</small>
                  </div>
                </div>

                <div className="explanation-bubble">
                  <div className="bubble-head">
                    <Sparkles size={15} />
                    <strong>تحليل الـ AI لأسباب رفض هذه البطاقة:</strong>
                  </div>
                  <p>{diagnosedResult.aiExplanation}</p>
                </div>

                {/* Remediation Action Steps */}
                <div className="roadmap-box">
                  <strong className="roadmap-title">
                    <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                    خارطة الحل المقترح للتاجر لاسترداد هذه الدفعة:
                  </strong>
                  <ol className="roadmap-list">
                    {diagnosedResult.actionableRoadmap.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Alternative Gateway Recommendation */}
                <div className="alt-gateway-card">
                  <div className="alt-gw-info">
                    <span className="alt-chip">البوابة البديلة الموصى بها فوراً:</span>
                    <h4>بوابة {diagnosedResult.recommendedAlternativeGateway.toUpperCase()}</h4>
                    <p>
                      نسبة قبول بطاقات {diagnosedResult.bankName} على هذه البوابة: <strong>{diagnosedResult.acceptanceConfidenceOnAlternative}%</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="switch-gw-btn"
                    onClick={() => {
                      setSelectedGateway(diagnosedResult.recommendedAlternativeGateway);
                      handleRunDiagnosis(diagnosedResult.bin, diagnosedResult.recommendedAlternativeGateway);
                    }}
                  >
                    <span>فحص القبول على البوابة البديلة</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Customer Notification Message Box */}
                <div className="customer-msg-box">
                  <div className="cust-msg-head">
                    <MessageSquare size={15} />
                    <strong>رسالة توجيه مقترحة للعميل (لحفظ العملية وتجنب هروبه):</strong>
                  </div>
                  <blockquote className="cust-msg-quote">
                    "{diagnosedResult.suggestedCustomerMessage}"
                  </blockquote>
                  <div className="cust-msg-actions">
                    <button
                      type="button"
                      className="copy-msg-btn"
                      onClick={() => handleCopy('customer-msg', diagnosedResult.suggestedCustomerMessage)}
                    >
                      {copiedKey === 'customer-msg' ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey === 'customer-msg' ? 'تم نسخ الرسالة' : 'نسخ الرسالة للعميل'}</span>
                    </button>

                    {onConsultAi && (
                      <button
                        type="button"
                        className="consult-ai-btn"
                        onClick={() => {
                          const prompt = `حلل لي حالة رفض البطاقة ذات الـ BIN (${diagnosedResult.bin}) الصادرة من ${diagnosedResult.bankName} على بوابة ${diagnosedResult.gateway}. سبب الرفض: ${diagnosedResult.matchedReason.titleAr}. ما هي أفضل خطة لتفادي الرفض في عمليات هذا البنك؟`;
                          onConsultAi(prompt);
                        }}
                      >
                        <Sparkles size={14} />
                        <span>استشر مساعد AI حول هذه المعاملة</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: LIVE DECLINES LOG & AUDIT EXPLORER */}
      {/* ============================================================== */}
      {activeTab === 'declines_log' && (
        <div className="failures-tab-content view-fade-in">
          {/* Filters Bar */}
          <div className="declines-filter-bar">
            <div className="search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="بحث برقم البطاقة، الـ BIN، اسم العميل، البنك، أو كود الخطأ..."
                value={logSearchQuery}
                onChange={e => setLogSearchQuery(e.target.value)}
              />
              {logSearchQuery && (
                <button type="button" className="clear-btn" onClick={() => setLogSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="select-filters-wrap">
              <select
                value={logGatewayFilter}
                onChange={e => setLogGatewayFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">كل البوابات (All Gateways)</option>
                <option value="telr">Telr (تيلر)</option>
                <option value="paytabs">PayTabs (بيتابس)</option>
                <option value="tap">Tap Payments (تاب)</option>
                <option value="stripe">Stripe (سترايب)</option>
                <option value="urway">Urway (يورواي)</option>
              </select>

              <select
                value={logCategoryFilter}
                onChange={e => setLogCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">كل الفئات البرمجية (All Categories)</option>
                {Object.values(FAILURE_CATEGORIES).map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="declines-table-container">
            <table className="declines-table">
              <thead>
                <tr>
                  <th>المرجع والوقت</th>
                  <th>البوابة</th>
                  <th>البطاقة والبنك</th>
                  <th>المبلغ</th>
                  <th>التصنيف البرمجي والسبب</th>
                  <th>كود البنك</th>
                  <th>قابل للاسترداد؟</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => {
                  const reasonMeta = REASON_CODES[tx.reasonCode] || REASON_CODES.INSUFFICIENT_FUNDS;
                  const catMeta = FAILURE_CATEGORIES[reasonMeta.categoryId];
                  const formattedTime = new Date(tx.timestamp).toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={tx.id} className="decline-table-row">
                      {/* Ref & Time */}
                      <td>
                        <div className="ref-cell">
                          <strong className="ref-code" dir="ltr">{tx.transactionRef}</strong>
                          <small>{formattedTime}</small>
                        </div>
                      </td>

                      {/* Gateway */}
                      <td>
                        <span className={`gw-tag gw-tag-${tx.gateway}`}>
                          {tx.gateway.toUpperCase()}
                        </span>
                      </td>

                      {/* Card & Bank */}
                      <td>
                        <div className="card-bank-cell">
                          <span className="card-num" dir="ltr">{tx.cardMasked}</span>
                          <small>{tx.bankName} · {tx.country}</small>
                        </div>
                      </td>

                      {/* Amount */}
                      <td>
                        <div className="amount-cell">
                          <strong>{tx.amount.toLocaleString()}</strong>
                          <small>{tx.currency}</small>
                        </div>
                      </td>

                      {/* Programmatic Category & Reason */}
                      <td>
                        <div className="cat-badge-cell">
                          <span
                            className="reason-category-badge"
                            style={{
                              backgroundColor: catMeta.bgTint,
                              borderColor: catMeta.borderColor,
                              color: catMeta.color
                            }}
                          >
                            <span className="badge-bullet" style={{ backgroundColor: catMeta.color }} />
                            <span>{catMeta.nameAr}</span>
                          </span>
                          <span className="reason-title-text">{reasonMeta.titleAr}</span>
                        </div>
                      </td>

                      {/* Raw Code */}
                      <td>
                        <code className="error-code-badge" dir="ltr">
                          {tx.rawErrorCode}
                        </code>
                      </td>

                      {/* Recoverable */}
                      <td>
                        {tx.isRecoverable ? (
                          <span className="recoverable-pill yes">
                            <CheckCircle2 size={13} />
                            <span>نعم (سهل)</span>
                          </span>
                        ) : (
                          <span className="recoverable-pill no">
                            <X size={13} />
                            <span>حظر أمني</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => {
                            setSelectedTxDetail(tx);
                            setInputCardOrBin(tx.bin);
                            setSelectedGateway(tx.gateway);
                            setSelectedReasonCode(tx.reasonCode);
                            handleRunDiagnosis(tx.bin, tx.gateway, tx.reasonCode);
                          }}
                        >
                          <span>فحص وتشخيص</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!filteredTransactions.length && (
                  <tr>
                    <td colSpan={8} className="empty-table-cell">
                      <div className="empty-message-wrap">
                        <AlertTriangle size={28} />
                        <h4>لا توجد حالات رفض مطابقة لمعايير البحث الحالية</h4>
                        <p>جرّب اختيار بوابة أخرى أو إزالة الفلاتر لعرض كافة السجلات.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Transaction Detail Modal if Selected */}
          {selectedTxDetail && (
            <div className="tx-modal-overlay" onClick={() => setSelectedTxDetail(null)}>
              <div className="tx-modal-content" onClick={e => e.stopPropagation()}>
                <div className="tx-modal-header">
                  <div className="modal-title-wrap">
                    <ShieldAlert size={20} className="text-red" />
                    <div>
                      <h3>تفاصيل تشخيص العملية: {selectedTxDetail.transactionRef}</h3>
                      <small>البوابة: {selectedTxDetail.gateway.toUpperCase()} · الوقت: {new Date(selectedTxDetail.timestamp).toLocaleString('ar-SA')}</small>
                    </div>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={() => setSelectedTxDetail(null)}>
                    <X size={18} />
                  </button>
                </div>

                <div className="tx-modal-body">
                  <div className="modal-info-grid">
                    <div className="info-item">
                      <label>اسم العميل والبريد:</label>
                      <strong>{selectedTxDetail.customerName}</strong>
                      <small dir="ltr">{selectedTxDetail.customerEmail}</small>
                    </div>
                    <div className="info-item">
                      <label>البطاقة والـ BIN:</label>
                      <strong dir="ltr">{selectedTxDetail.cardMasked}</strong>
                      <small>{selectedTxDetail.cardScheme} · {selectedTxDetail.cardType}</small>
                    </div>
                    <div className="info-item">
                      <label>البنك والدولة:</label>
                      <strong>{selectedTxDetail.bankName}</strong>
                      <small>{selectedTxDetail.country}</small>
                    </div>
                    <div className="info-item">
                      <label>قيمة العملية:</label>
                      <strong className="text-orange">{selectedTxDetail.amount} {selectedTxDetail.currency}</strong>
                      <small>كود الاستجابة: {selectedTxDetail.rawErrorCode}</small>
                    </div>
                  </div>

                  <div className="modal-note-box">
                    <div className="note-title">
                      <Sparkles size={16} />
                      <strong>تشخيص الذكاء الاصطناعي لهذه المحاولة:</strong>
                    </div>
                    <p>{selectedTxDetail.aiDiagnosticNote}</p>
                  </div>

                  <div className="modal-actions-bar">
                    <button
                      type="button"
                      className="primary-action-btn"
                      onClick={() => {
                        setSelectedTxDetail(null);
                        setActiveTab('diagnostics');
                      }}
                    >
                      <CreditCard size={15} />
                      <span>فتح في أداة التشخيص الكاملة وتوليد الحل</span>
                    </button>

                    {onConsultAi && (
                      <button
                        type="button"
                        className="consult-action-btn"
                        onClick={() => {
                          const prompt = `أحتاج خطة عمل للتعامل مع العميل ${selectedTxDetail.customerName} الذي رُفضت بطاقته (${selectedTxDetail.cardMasked}) على بوابة ${selectedTxDetail.gateway}. سبب الرفض: ${selectedTxDetail.rawErrorMessage}. كيف نحافظ على إتمام الطلب؟`;
                          setSelectedTxDetail(null);
                          onConsultAi(prompt);
                        }}
                      >
                        <Sparkles size={15} />
                        <span>استشارة الـ AI لإعادة المحاولة</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: AI GATEWAY OPTIMIZATION ADVISOR */}
      {/* ============================================================== */}
      {activeTab === 'ai_recommendations' && (
        <div className="failures-tab-content view-fade-in">
          <div className="ai-advisor-header">
            <Sparkles size={24} className="text-orange" />
            <div>
              <h3>استراتيجيات وتوصيات الذكاء الاصطناعي لرفع القبول (+22%)</h3>
              <p>خطة عمل مدروسة برمجياً ومصرفياً مبنية على سلوك المقاسم البنكية الخليجية وحظر الـ BINs</p>
            </div>
          </div>

          <div className="ai-strategies-grid">
            <article className="strategy-card">
              <div className="strategy-icon-box bg-purple">
                <Layers size={22} />
              </div>
              <div className="strategy-content">
                <span className="strategy-tag">استراتيجية رقم 1 · حظر الـ BIN</span>
                <h4>تفعيل التوجيه الذكي التلقائي (Smart Fallback Routing)</h4>
                <p>
                  41% من حالات الرفض على بوابة تيلر سببها بطاقات الـ Prepaid (سفر بلس / Urpay / بطاقات السفر). عند رفض أي بطاقة بسبب عدم توافق الـ BIN، يتم تحويل مسار الطلب فورياً في الخلفية إلى بوابة PayTabs أو Urway دون أن يشعر العميل بأي انقطاع.
                </p>
                <div className="strategy-impact text-green">
                  <strong>+12% زيادة متوقعة في المبيعات المكتملة</strong>
                </div>
              </div>
            </article>

            <article className="strategy-card">
              <div className="strategy-icon-box bg-red">
                <ShieldAlert size={22} />
              </div>
              <div className="strategy-content">
                <span className="strategy-tag">استراتيجية رقم 2 · توثيق 3DS</span>
                <h4>التحول الصارم إلى بروتوكول 3DS 2.2 Frictionless Flow</h4>
                <p>
                  الكثير من العملاء يتراجعون عند ظهور صفحة التحقق البنكي المعقدة. تفعيل إصدار 3DS2 الأحدث يسمح للبنك المصدر بتمرير 70% من العمليات الموثوقة دون طلب رمز OTP (Frictionless)، مما يقضي على هجران سلة الشراء في مرحلة الدفع.
                </p>
                <div className="strategy-impact text-green">
                  <strong>انخفاض بنسبة 45% في هجران نافذة الدفع</strong>
                </div>
              </div>
            </article>

            <article className="strategy-card">
              <div className="strategy-icon-box bg-orange">
                <CreditCard size={22} />
              </div>
              <div className="strategy-content">
                <span className="strategy-tag">استراتيجية رقم 3 · حدود الرصيد</span>
                <h4>نظام التنبيه الفوري لرفع حد الشراء الإلكتروني (POS Limit)</h4>
                <p>
                  بدلاً من إظهار رسالة عامة "تم رفض البطاقة"، يتم إرسال رسالة برمجية موجهة باللغة العربية: "بطاقتك تجاوزت الحد اليومي للشراء عبر الإنترنت. يمكنك فتح تطبيق بنكك والضغط على خيار تمكين الشراء بالإنترنت ثم إتمام الدفع بنقرة واحدة".
                </p>
                <div className="strategy-impact text-green">
                  <strong>استرداد 60% من عمليات الرصيد والحدود اليومية</strong>
                </div>
              </div>
            </article>

            <article className="strategy-card">
              <div className="strategy-icon-box bg-blue">
                <ServerCrash size={22} />
              </div>
              <div className="strategy-content">
                <span className="strategy-tag">استراتيجية رقم 4 · أعطال المقسم</span>
                <h4>إعادة المحاولة الذكية الآمنة (Idempotent Smart Retries)</h4>
                <p>
                  عند حدوث كود 91 (Issuer Switch Down) أو انتهاء مهلة البوابة، يقوم النظام بجدولة إعادة محاولة تلقائية بعد 90 ثانية مع الحفاظ على مفتاح فريد (Idempotency Key) لتفادي الخصم المزدوج نهائياً.
                </p>
                <div className="strategy-impact text-green">
                  <strong>حماية 100% من الخصم المزدوج ومطالبات الاسترداد</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
