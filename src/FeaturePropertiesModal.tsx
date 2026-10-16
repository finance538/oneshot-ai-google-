import { X, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Info, Terminal, Sparkles } from 'lucide-react';
import { FEATURE_PROPERTIES_CATALOG, type FeatureProperty } from './featurePropertiesData';
import './FeaturePropertiesModal.css';

interface FeaturePropertiesModalProps {
  propertyKey: string | null;
  onClose: () => void;
}

export default function FeaturePropertiesModal({ propertyKey, onClose }: FeaturePropertiesModalProps) {
  if (!propertyKey) return null;

  const prop: FeatureProperty = FEATURE_PROPERTIES_CATALOG[propertyKey] || {
    id: propertyKey,
    name: `خاصية النظام: ${propertyKey}`,
    technicalKey: `system.${propertyKey}`,
    category: 'policy',
    shortDesc: 'خاصية تشغيلية وتحكمية في إعدادات المنصة وبوابات الدفع.',
    detailedPurpose: 'هذه الخاصية مسؤولة عن إدارة وضبط تدفق العمليات وحماية بيانات الدفع واستقرار المعاملات عبر المنصة.',
    whatHappensWhenEnabled: 'تعمل الميزة بكامل طاقتها البرمجية وفق المعايير المصرفية المعتمدة.',
    whatHappensWhenDisabled: 'يتوقف تفعيل الميزة عن العمليات الجديدة مع الحفاظ على استقرار الجلسات الحالية.',
    securityImpactScore: 'متوسط',
    supportedGateways: ['جميع البوابات المتصلة'],
    bestPractices: 'قم بمراجعة تقارير العمليات وسجلات الاختبار قبل تغيير حالة هذا المفتاح.'
  };

  return (
    <div className="feature-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="feature-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="feature-modal-header">
          <div className="prop-title-group">
            <div className="prop-badge-icon">
              <Info size={20} />
            </div>
            <div>
              <div className="prop-meta-tags">
                <span className="prop-category-tag">{prop.category}</span>
                <code className="prop-tech-key" dir="ltr">{prop.technicalKey}</code>
              </div>
              <h3>{prop.name}</h3>
            </div>
          </div>
          <button className="prop-close-btn" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        {/* Short Description */}
        <p className="prop-short-desc">{prop.shortDesc}</p>

        {/* Detailed Purpose */}
        <div className="prop-section-block">
          <div className="block-title">
            <Layers size={16} />
            <span>ما هي فائدة هذه الخاصية وكيف تعمل؟</span>
          </div>
          <p className="block-text">{prop.detailedPurpose}</p>
        </div>

        {/* Consequence Grid: Enabled vs Disabled */}
        <div className="consequence-grid">
          <div className="consequence-box enabled-box">
            <div className="consequence-title">
              <CheckCircle2 size={18} />
              <span>ماذا يحدث عند التشغيل (Enabled)؟</span>
            </div>
            <p>{prop.whatHappensWhenEnabled}</p>
          </div>

          <div className="consequence-box disabled-box">
            <div className="consequence-title">
              <AlertTriangle size={18} />
              <span>ماذا يحدث عند الإيقاف (Disabled)؟</span>
            </div>
            <p>{prop.whatHappensWhenDisabled}</p>
          </div>
        </div>

        {/* Impact & Gateways */}
        <div className="prop-meta-footer">
          <div className="impact-box">
            <span className="impact-label">مستوى الأثر الأمني:</span>
            <span className={`impact-badge score-${prop.securityImpactScore.includes('حرج') ? 'critical' : prop.securityImpactScore.includes('مرتفع') ? 'high' : 'medium'}`}>
              <ShieldAlert size={14} />
              {prop.securityImpactScore}
            </span>
          </div>

          <div className="gateways-chip-list">
            <span className="impact-label">البوابات المتأثرة:</span>
            <div className="chips-row">
              {prop.supportedGateways.map(gw => (
                <span key={gw} className="gw-chip">{gw}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Best Practice Tip */}
        <div className="best-practice-tip">
          <Sparkles size={16} />
          <div>
            <strong>توصية الخبراء الأمنية:</strong>
            <span>{prop.bestPractices}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="modal-footer-actions">
          <button type="button" className="close-action-btn" onClick={onClose}>
            فهمت، إغلاق نافذة الخصائص
          </button>
        </div>
      </div>
    </div>
  );
}
