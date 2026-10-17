import { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Check, AlertTriangle,
  RotateCcw, Sparkles, Sliders, Lock, Info, ExternalLink
} from 'lucide-react';
import { initialSecuritySystems, type SecuritySystem } from './securitySystemsData';
import './SecuritySystemsManager.css';
import { useTestingWorkspace } from './TestingWorkspace';

export default function SecuritySystemsManager() {
  const { settings, update } = useTestingWorkspace();
  const systems = initialSecuritySystems.map(system => ({
    ...system, enabled: settings.securityRules[system.id as keyof typeof settings.securityRules],
  }));
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const handleToggle = (id: string) => update(previous => ({
    ...previous,
    securityRules: { ...previous.securityRules, [id]: !previous.securityRules[id as keyof typeof previous.securityRules] },
  }));

  const handleResetDefaults = () => {
    if (window.confirm('هل ترغب بإعادة تعيين إعدادات الحماية إلى الحالة الآمنة الافتراضية؟')) {
      update(previous => ({ ...previous, securityRules: Object.fromEntries(initialSecuritySystems.map(system => [system.id, system.enabled])) as typeof previous.securityRules }));
    }
  };

  const activeCount = systems.filter((s) => s.enabled).length;
  const filteredSystems =
    filterCategory === 'all'
      ? systems
      : systems.filter((s) => s.category === filterCategory);

  return (
    <div className="security-systems-manager">
      {/* Header Banner */}
      <section className="panel security-mgmt-intro">
        <div className="sec-header-top">
          <div className="sec-badge">
            <Lock size={16} />
            <span>قواعد الحماية في بيئة الاختبار</span>
          </div>
          <button type="button" className="outline-button reset-btn" onClick={handleResetDefaults}>
            <RotateCcw size={15} />
            <span>استعادة الإعدادات الموصى بها</span>
          </button>
        </div>

        <h2>إعداد سيناريوهات الحماية ومكافحة الاحتيال</h2>
        <p>
          اضبط قواعد المحاكاة لحسابك واختبر أثرها في أدوات اللودر. استخدم زر حفظ إعدادات الأدوات للاحتفاظ بها عبر الأجهزة.
          هذه الخيارات لا تغيّر حماية الدفع الفعلية؛ تُدار قواعد 3DS وCVV ومكافحة الاحتيال الحقيقية لدى بوابة الدفع.
        </p>

        <div className="sec-summary-bar">
          <div className="summary-stat">
            <span className="summary-val">{activeCount} / {systems.length}</span>
            <span className="summary-lbl">الأنظمة النشطة حالياً</span>
          </div>
          <div className="summary-note">
            <ShieldCheck size={18} className="shield-ok" />
            <span>
              {activeCount >= 6
                ? 'سيناريو الاختبار يتضمن معظم قواعد الحماية.'
                : 'بعض قواعد المحاكاة غير مفعّلة لهذا السيناريو.'}
            </span>
          </div>
        </div>

      </section>

      {/* Category Tabs */}
      <div className="category-filter-tabs">
        <button
          type="button"
          className={`cat-tab ${filterCategory === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCategory('all')}
        >
          جميع الأنظمة ({systems.length})
        </button>
        <button
          type="button"
          className={`cat-tab ${filterCategory === 'card_verification' ? 'active' : ''}`}
          onClick={() => setFilterCategory('card_verification')}
        >
          التحقق من البطاقات (3DS & CVV)
        </button>
        <button
          type="button"
          className={`cat-tab ${filterCategory === 'geo' ? 'active' : ''}`}
          onClick={() => setFilterCategory('geo')}
        >
          الموقع الجغرافي والدول (Geo-IP)
        </button>
        <button
          type="button"
          className={`cat-tab ${filterCategory === 'network' ? 'active' : ''}`}
          onClick={() => setFilterCategory('network')}
        >
          فحص الشبكات والـ VPN
        </button>
        <button
          type="button"
          className={`cat-tab ${filterCategory === 'anti_fraud' ? 'active' : ''}`}
          onClick={() => setFilterCategory('anti_fraud')}
        >
          مكافحة الاحتيال والذكاء الاصطناعي
        </button>
      </div>

      {/* Systems Cards Grid */}
      <div className="systems-cards-grid">
        {filteredSystems.map((sys) => (
          <article
            key={sys.id}
            className={`system-card ${sys.enabled ? 'is-enabled' : 'is-disabled'}`}
          >
            <div className="sys-card-header">
              <div className="sys-title-group">
                <div className="sys-status-icon">
                  {sys.enabled ? (
                    <ShieldCheck size={22} className="icon-enabled" />
                  ) : (
                    <ShieldAlert size={22} className="icon-disabled" />
                  )}
                </div>
                <div>
                  <h3>{sys.name}</h3>
                  <span className={`risk-tag risk-${sys.riskLevel}`}>
                    مستوى التأثير الأمني: {sys.riskLevel === 'critical' ? 'حرج جداً' : sys.riskLevel === 'high' ? 'عالي' : 'متوسط'}
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="sys-toggle-control">
                <button
                  type="button"
                  role="switch"
                  aria-checked={sys.enabled}
                  aria-label={sys.name}
                  className={`switch-btn ${sys.enabled ? 'on' : 'off'}`}
                  onClick={() => handleToggle(sys.id)}
                >
                  <span className="switch-thumb" />
                </button>
                <span className="switch-status-text">
                  {sys.enabled ? 'مفعّل وشغال' : 'مفصول / معطّل'}
                </span>
              </div>
            </div>

            <p className="sys-description">{sys.description}</p>

            <div className="sys-impact-grid">
              {/* What it does when enabled */}
              <div className="impact-box enabled-impact">
                <div className="impact-head">
                  <Check size={15} />
                  <strong>ماذا يفعل عند التشغيل (إذا فعلناه):</strong>
                </div>
                <p>{sys.whatItDoes}</p>
                <span className="benefit-sub">
                  ✨ <strong>النتيجة:</strong> {sys.consequencesIfEnabled}
                </span>
              </div>

              {/* What happens if disabled */}
              <div className="impact-box disabled-impact">
                <div className="impact-head">
                  <AlertTriangle size={15} />
                  <strong>ماذا يحدث عند الفصل (إذا عطلناه):</strong>
                </div>
                <p>{sys.consequencesIfDisabled}</p>
                <span className="warning-sub">
                  ⚠️ <strong>تأثير إيقافه:</strong> يسمح بمرور المحاولات لتجربة السلوك بدون هذا القيد،
                  مع زيادة مخاطر الاحتيال.
                </span>
              </div>
            </div>

            <div className="sys-footer">
              <span className="sys-cat-badge">التصنيف: {sys.category}</span>
              {sys.recommended && (
                <span className="recommended-pill">موصى بتفعيله دائماً لحسابات الإنتاج</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
