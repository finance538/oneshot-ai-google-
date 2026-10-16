import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  Sliders,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  Activity,
  Flame,
  Award
} from 'lucide-react';
import { api } from './platform';
import { useAppearance } from './i18n';
import './PredictivePaymentAnalytics.css';

interface DailyPoint {
  day: string;
  amount: number;
}

interface PredictiveMetrics {
  totalPaid: number;
  paidCount: number;
  pendingCount: number;
  customers: number;
  daily?: DailyPoint[];
}

export interface PredictiveAnalyticsData {
  predictedVolume: {
    minSAR: number;
    maxSAR: number;
    expectedSAR: number;
    confidencePercent: number;
    trendDirection: 'positive' | 'stable' | 'declining';
    growthRateEstimate: string;
  };
  healthScore: number;
  summary: string;
  keyInsights: {
    title: string;
    detail: string;
    impact: 'positive' | 'neutral' | 'warning';
  }[];
  frictionPoints: {
    riskArea: string;
    observed: string;
    recommendation: string;
  }[];
  optimizationStrategies: {
    id: string;
    title: string;
    category: 'conversion' | 'gateway_routing' | 'checkout_ux' | 'cashflow';
    expectedLift: string;
    actionLabel: string;
    actionView: string;
    description: string;
  }[];
}

interface PredictivePaymentAnalyticsProps {
  metrics: PredictiveMetrics;
  onNavigate?: (view: string) => void;
  onNotify?: (message: string) => void;
}

export default function PredictivePaymentAnalytics({
  metrics,
  onNavigate,
  onNotify,
}: PredictivePaymentAnalyticsProps) {
  const { tr, locale } = useAppearance();
  const [mode, setMode] = useState<'growth' | 'risk' | 'cashflow'>('growth');
  const [timeframe, setTimeframe] = useState<'7d' | '14d' | '30d'>('7d');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PredictiveAnalyticsData | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const [appliedStrategies, setAppliedStrategies] = useState<Record<string, boolean>>({});

  const runAnalysis = useCallback(async (selectedMode = mode, selectedTimeframe = timeframe) => {
    setLoading(true);
    try {
      const res = await api<{
        success: boolean;
        analytics: PredictiveAnalyticsData;
        analyzedAt: string;
      }>('predictive-analytics', {
        mode: selectedMode,
        timeframe: selectedTimeframe,
        metrics,
      });

      if (res && res.analytics) {
        setData(res.analytics);
        setLastAnalyzed(res.analyzedAt || new Date().toISOString());
        if (onNotify) {
          onNotify(tr('تم تحديث التحليلات التنبؤية عبر Gemini AI بنجاح.', 'Gemini predictive analytics updated successfully.'));
        }
      }
    } catch (err) {
      console.warn('Predictive analytics API error:', err);
      // Fallback data is automatically handled server-side or generated gracefully
    } finally {
      setLoading(false);
    }
  }, [metrics, mode, timeframe, onNotify, tr]);

  // Initial analysis on mount or when mode changes
  useEffect(() => {
    void runAnalysis(mode, timeframe);
  }, [mode, timeframe, runAnalysis]);

  const handleApplyStrategy = (strategy: PredictiveAnalyticsData['optimizationStrategies'][0]) => {
    setAppliedStrategies(prev => ({ ...prev, [strategy.id]: true }));
    if (onNotify) {
      onNotify(`تم تفعيل الاستراتيجية: "${strategy.title}"`);
    }
    if (onNavigate && strategy.actionView) {
      onNavigate(strategy.actionView);
    }
  };

  const formatSAR = (amount: number) => {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <section className="predictive-analytics-widget" dir="rtl">
      {/* Widget Header */}
      <div className="paw-header">
        <div className="paw-title-group">
          <div className="paw-badge">
            <Sparkles size={16} className="paw-sparkle-icon" />
            <span>GEMINI AI FINTECH INTELLIGENCE</span>
          </div>
          <h2>{tr('التحليلات التنبؤية للمدفوعات واستراتيجيات التحسين', 'Predictive Payment Analytics & Optimization')}</h2>
          <p>
            {tr(
              'تحليل مدعوم بذكاء Gemini الاصطناعي لسجلات المبيعات، ومعدلات قبول البوابات، وتوقع التدفقات النقدية مع توصيات فورية لزيادة الإيرادات.',
              'AI-driven analysis of transaction velocity, gateway acceptance, and revenue forecasting with actionable growth strategies.'
            )}
          </p>
        </div>

        {/* Action & Filter Controls */}
        <div className="paw-controls">
          <div className="paw-segmented-mode">
            <button
              type="button"
              className={`paw-mode-btn ${mode === 'growth' ? 'active' : ''}`}
              onClick={() => setMode('growth')}
            >
              <TrendingUp size={14} />
              <span>{tr('زيادة النمو والتحويل', 'Growth & Lift')}</span>
            </button>
            <button
              type="button"
              className={`paw-mode-btn ${mode === 'risk' ? 'active' : ''}`}
              onClick={() => setMode('risk')}
            >
              <ShieldAlert size={14} />
              <span>{tr('تقليل الرفض والتعثر', 'Decline Prevention')}</span>
            </button>
            <button
              type="button"
              className={`paw-mode-btn ${mode === 'cashflow' ? 'active' : ''}`}
              onClick={() => setMode('cashflow')}
            >
              <DollarSign size={14} />
              <span>{tr('توقع التدفق النقدي', 'Cash Flow')}</span>
            </button>
          </div>

          <div className="paw-actions-row">
            <select
              className="paw-timeframe-select"
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as '7d' | '14d' | '30d')}
              aria-label="نطاق التحليل"
            >
              <option value="7d">{tr('آخر 7 أيام', 'Last 7 Days')}</option>
              <option value="14d">{tr('آخر 14 يوماً', 'Last 14 Days')}</option>
              <option value="30d">{tr('آخر شهر', 'Last 30 Days')}</option>
            </select>

            <button
              type="button"
              className="primary-button paw-refresh-btn"
              disabled={loading}
              onClick={() => void runAnalysis(mode, timeframe)}
            >
              <RefreshCw size={15} className={loading ? 'spinning' : ''} />
              <span>{loading ? tr('جارٍ التحليل عبر Gemini…', 'Analyzing…') : tr('تحديث التوقعات', 'Refresh Analytics')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Predictive Overview Grid */}
      {data && (
        <div className="paw-metrics-deck">
          {/* Main Forecast Card */}
          <div className="paw-forecast-card">
            <div className="forecast-glow" />
            <div className="forecast-header">
              <span className="forecast-tag">
                <Flame size={14} />
                {tr('التوقع المالي للدورة القادمة', 'Forecast Next Period')}
              </span>
              <span className="confidence-pill">
                <Award size={13} />
                {data.predictedVolume.confidencePercent}% {tr('دقة التوقع', 'Confidence')}
              </span>
            </div>

            <div className="forecast-value-row">
              <div className="forecast-number">
                <strong>{formatSAR(data.predictedVolume.expectedSAR)}</strong>
                <span className="forecast-currency">SAR</span>
              </div>
              <div className={`growth-pill ${data.predictedVolume.trendDirection}`}>
                <TrendingUp size={15} />
                <span>{data.predictedVolume.growthRateEstimate}</span>
              </div>
            </div>

            <div className="forecast-range">
              <span>{tr('النطاق المتوقع:', 'Expected Range:')} </span>
              <strong>{formatSAR(data.predictedVolume.minSAR)} SAR</strong> — <strong>{formatSAR(data.predictedVolume.maxSAR)} SAR</strong>
            </div>

            <p className="paw-summary-text">{data.summary}</p>
          </div>

          {/* Health Score & Quick Indicators */}
          <div className="paw-indicator-card">
            <div className="indicator-top">
              <span>{tr('مؤشر صحة المعاملات والقبول', 'Payment Health Score')}</span>
              <Activity size={18} color="#f05b2b" />
            </div>
            <div className="score-display">
              <span className="score-num">{data.healthScore}</span>
              <span className="score-max">/100</span>
            </div>
            <div className="score-bar">
              <div
                className="score-fill"
                style={{ width: `${Math.min(100, Math.max(10, data.healthScore))}%` }}
              />
            </div>
            <p className="score-note">
              {data.healthScore >= 85
                ? tr('أداء استثنائي. معدل إتمام العمليات يتفوق على متوسط السوق المحلي.', 'Exceptional performance. Checkout conversion is above market average.')
                : tr('أداء جيد مع إمكانية تسريع السداد بتفعيل الروابط الموحدة.', 'Good performance with room for acceleration via open multi-gateway links.')}
            </p>
          </div>
        </div>
      )}

      {/* Deep Insights & Friction Points Grid */}
      {data && (
        <div className="paw-insights-grid">
          {/* Key Insights */}
          <div className="paw-subpanel">
            <div className="subpanel-header">
              <Lightbulb size={18} color="#ffb703" />
              <h3>{tr('رؤى الاتجاهات وأنماط السداد (Key Trends)', 'Payment Trend Insights')}</h3>
            </div>
            <div className="insights-list">
              {data.keyInsights.map((insight, idx) => (
                <div key={idx} className={`insight-item impact-${insight.impact}`}>
                  <div className="insight-bullet" />
                  <div>
                    <strong>{insight.title}</strong>
                    <p>{insight.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Friction Points & Risk Areas */}
          <div className="paw-subpanel">
            <div className="subpanel-header">
              <AlertTriangle size={18} color="#f05b2b" />
              <h3>{tr('نقاط الاحتكاك والتعثر المكتشفة (Friction Points)', 'Conversion Friction Points')}</h3>
            </div>
            <div className="friction-list">
              {data.frictionPoints.map((item, idx) => (
                <div key={idx} className="friction-item">
                  <div className="friction-area-badge">{item.riskArea}</div>
                  <p className="friction-observed">
                    <strong>{tr('الملاحظة:', 'Observed:')} </strong>
                    {item.observed}
                  </p>
                  <p className="friction-recommendation">
                    <strong>{tr('التوصية:', 'Recommendation:')} </strong>
                    {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Optimization Strategies */}
      {data && data.optimizationStrategies.length > 0 && (
        <div className="paw-strategies-section">
          <div className="strategies-header">
            <div>
              <span className="eyebrow" style={{ color: '#f05b2b' }}>ACTIONABLE AI OPTIMIZATIONS</span>
              <h3>{tr('استراتيجيات التحسين المقترحة من Gemini AI', 'Gemini AI Optimization Strategies')}</h3>
              <p>
                {tr(
                  'إجراءات فورية تم استخلاصها من سلوك عملائك ومعدلات بوابات الدفع لتحقيق أقصى إيراد.',
                  'Direct actionable improvements derived from customer habits and gateway velocities to maximize revenue.'
                )}
              </p>
            </div>
          </div>

          <div className="strategies-grid">
            {data.optimizationStrategies.map(strat => {
              const isApplied = Boolean(appliedStrategies[strat.id]);
              return (
                <div key={strat.id} className={`strategy-card ${isApplied ? 'applied' : ''}`}>
                  <div className="strat-top">
                    <span className="strat-lift-tag">
                      <Zap size={14} />
                      {strat.expectedLift}
                    </span>
                    <span className="strat-cat-tag">{strat.category}</span>
                  </div>

                  <h4 className="strat-title">{strat.title}</h4>
                  <p className="strat-desc">{strat.description}</p>

                  <div className="strat-footer">
                    <button
                      type="button"
                      className={isApplied ? 'outline-button' : 'primary-button'}
                      onClick={() => handleApplyStrategy(strat)}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 size={15} color="#00ff88" />
                          <span>{tr('تم التطبيق', 'Applied')}</span>
                        </>
                      ) : (
                        <>
                          <span>{strat.actionLabel || tr('تطبيق الاستراتيجية', 'Apply Strategy')}</span>
                          <ArrowUpRight size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Timestamp */}
      <div className="paw-footer">
        <span>
          {tr('تحليل ذكاء اصطناعي فوري مبني على خوارزميات Gemini 2.5/3.8 Flash المتوافقة مع بوابات الدفع بالسعودية.', 'Real-time AI analysis powered by Gemini Flash models tuned for Saudi payment networks.')}
        </span>
        {lastAnalyzed && (
          <span className="paw-last-time">
            {tr('آخر تحديث:', 'Last updated:')} {new Date(lastAnalyzed).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </section>
  );
}
