import { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, Check, AlertTriangle,
  RotateCcw, Sparkles, Sliders, Lock, Info, ExternalLink
} from 'lucide-react';
import { initialSecuritySystems, type SecuritySystem } from './securitySystemsData';
import './SecuritySystemsManager.css';

export default function SecuritySystemsManager() {
  const [systems, setSystems] = useState<SecuritySystem[]>(() => {
    const saved = localStorage.getItem('oneshot_security_systems');
    return saved ? JSON.parse(saved) : initialSecuritySystems;
  });

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [saveNotice, setSaveNotice] = useState(false);

  useEffect(() => {
    localStorage.setItem('oneshot_security_systems', JSON.stringify(systems));
  }, [systems]);

  const handleToggle = (id: string) => {
    setSystems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل ترغب بإعادة تعيين إعدادات الحماية إلى الحالة الآمنة الافتراضية؟')) {
      setSystems(initialSecuritySystems);
      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 2500);
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
            <span>لوحة تحكم أنظمة حماية بوابات الدفع (خاص بالتاجر فقط)</span>
          </div>
          <button type="button" className="outline-button reset-btn" onClick={handleResetDefaults}>
            <RotateCcw size={15} />
            <span>استعادة الإعدادات الموصى بها</span>
          </button>
        </div>

        <h2>إدارة أنظمة الحماية ومكافحة الاحتيال وقواعد البوابات</h2>
        <p>
          تتيح لك هذه الصفحة التحكم الكامل في تفعيل وتعطيل أنظمة الحماية الأمنية للبوابات المرتبطة بحسابك
          (التحقق الثنائي 3DS، فحص الـ IP والدولة، حاظر الـ VPN، كشف محاولات التخمين، إلزامية CVV).
          كل نظام يوضح بالتفصيل: ما يفعله عند تشغيله، وما هي المخاطر الدقيقة إذا قمت بفصله، لمساعدتك في
          إجراء اختبارات دقيقة مع فريق اللودر أو لضبط قواعد متجرك.
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
                ? 'مستوى الحماية الحالي: مرتفع ومحصن ضد الهجمات وعمليات الاحتيال الدولية.'
                : 'تنبيه: قمت بتعطيل بعض أنظمة الحماية الأساسية. تأكد من أن هذا الإجراء مؤقت لغرض الاختبار.'}
            </span>
          </div>
        </div>

        {saveNotice && (
          <div className="sec-save-banner animate-fade-in">
            <Check size={16} />
            <span>تم حفظ التعديلات وتطبيقها فوراً على جميع بوابات الدفع وبيئة الاختبار.</span>
          </div>
        )}
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
