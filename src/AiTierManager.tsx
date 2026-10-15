// AiTierManager.tsx
// لوحة طبقات الذكاء الاصطناعي — الواجهة تعرض فقط، والقرار على السيرفر.
// الترتيب: 4 طبقات. الثلاث المدفوعة تُختار بترخيص الحساب، و Tier X (Abliterated)
// لا يُفتح هنا أبداً: يظهر مقفلاً بنص «بترخيص من الإدارة» ويُفعّل فقط عندما يكون
// الترخيص صادراً فعلاً من السيرفر (`aiLicense.tierX`). لا باسورد واجهة بعد الآن.

import React, { useState } from 'react';
import {
  Zap, Cpu, BrainCircuit, Flame, Lock, Unlock, ShieldAlert,
  Server, Check, Sparkles, X, AlertTriangle, Compass, Activity
} from 'lucide-react';
import { aiTiers, tierModels, tierOrder, type AiTierId } from '../shared/ai-tiers';
import { saveOllamaConfig, type OllamaServerConfig } from './aiModelsData';
import type { AiLicenseView } from './platform';
import { useAppearance } from './i18n';
import './AiTierManager.css';

interface AiTierManagerProps {
  config: OllamaServerConfig;
  onConfigChange: (newConfig: OllamaServerConfig) => void;
  onClose?: () => void;
  /** ترخيص الحساب كما أرجعه السيرفر. غيابه = أعلى طبقة مجانية فقط. */
  license?: AiLicenseView;
}

const tierIcons: Record<AiTierId, React.ReactNode> = {
  'tier-1': <Zap className="tier-tab-icon" size={18} />,
  'tier-2': <Cpu className="tier-tab-icon" size={18} />,
  'tier-3': <BrainCircuit className="tier-tab-icon" size={18} />,
  'tier-x': <Flame className="tier-tab-icon" size={18} />,
};

export const AiTierManager: React.FC<AiTierManagerProps> = ({
  config,
  onConfigChange,
  onClose,
  license,
}) => {
  const { language, dir } = useAppearance();
  const langKey = (['ar', 'en', 'zh', 'ru', 'fr'].includes(language) ? language : 'ar') as 'ar' | 'en' | 'zh' | 'ru' | 'fr';
  const ar = langKey === 'ar';
  // الكتالوج المشترك يحمل نصين (عربي/إنجليزي) فقط؛ بقية اللغات تعرض العربي.
  const tx = (text: { ar: string; en: string }) => (langKey === 'en' ? text.en : text.ar);

  const activeLicense: AiLicenseView = license ?? { tier: 'tier-1', tierX: false, staff: [], admin: false, tiers: ['tier-1'], source: 'default' };
  const licensedTiers = activeLicense.tiers.length ? activeLicense.tiers : ['tier-1'];

  const [selectedTier, setSelectedTier] = useState<AiTierId>(
    config.activeTier === 'auto' ? 'tier-3' : (config.activeTier as AiTierId)
  );
  const [notice, setNotice] = useState('');
  const [serverHostInput, setServerHostInput] = useState(config.host);
  const [serverNotice, setServerNotice] = useState('');
  const [showServerSettings, setShowServerSettings] = useState(false);

  const isLicensed = (tier: AiTierId) => licensedTiers.includes(tier);
  const currentTier = aiTiers[selectedTier];
  const currentModels = tierModels[selectedTier];

  const save = (updated: OllamaServerConfig) => {
    onConfigChange(updated);
    saveOllamaConfig(updated);
  };

  const handleSelectTier = (tier: AiTierId) => {
    setNotice('');
    if (!isLicensed(tier)) {
      setNotice(
        tier === 'tier-x'
          ? (ar ? 'المستوى الرابع X لا يُفتح من هنا: يُمنح من إدارة المنصة للحساب، ونماذجه تحتاج توقيع ترخيص على البوابة.' : 'Tier X is granted by the platform admin; its models require a gateway licence signature.')
          : (ar ? `الطبقة ${aiTiers[tier].label.ar} غير مرخّصة لحسابك. راسل إدارة المنصة لتفعيلها.` : `${tier} is not licensed for this account.`)
      );
      return;
    }
    setSelectedTier(tier);
  };

  const handleSelectModel = (modelId: string, tier: AiTierId) => {
    setNotice('');
    if (!isLicensed(tier)) { setNotice(ar ? 'هذه الطبقة غير مرخّصة لحسابك.' : 'This tier is not licensed for your account.'); return; }
    save({ ...config, activeTier: tier, selectedModelId: modelId, isAutoRouterEnabled: false });
  };

  const handleToggleAutoRouter = () => {
    const next = !config.isAutoRouterEnabled;
    save({ ...config, isAutoRouterEnabled: next, activeTier: next ? 'auto' : selectedTier });
  };

  const handleSaveServerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    save({ ...config, host: serverHostInput.trim() || 'http://localhost:11434' });
    setServerNotice(ar ? 'تم حفظ عنوان الخادم.' : 'Endpoint saved.');
    setTimeout(() => setServerNotice(''), 3000);
  };

  return (
    <div className="ai-tier-manager-container" dir={dir}>
      <div className="ai-tier-header">
        <div className="ai-tier-title-group">
          <div className="ai-tier-logo-badge">
            <Sparkles size={24} className="sparkle-icon" />
          </div>
          <div>
            <div className="ai-tier-badge-pill">
              <span>{ar ? 'طبقات الذكاء الاصطناعي' : 'AI Tiers'}</span>
              <span className="ai-tier-dot" />
              <span>{ar ? 'ترخيص لكل حساب' : 'Per-account licence'}</span>
            </div>
            <h2 className="ai-tier-main-title">
              {ar ? 'المستويات ونظام التوجيه الذكي' : 'AI Model Tiers & Smart Router'}
            </h2>
            <p className="ai-tier-subtitle">
              {ar
                ? `ترخيص حسابك: ${aiTiers[activeLicense.tier].label.ar}${activeLicense.tierX ? ' + المستوى الرابع X' : ''} — كل سؤال يُحاسب على الطبقة التي نُفّذ بها فعلاً.`
                : `Your licence: ${aiTiers[activeLicense.tier].label.en}${activeLicense.tierX ? ' + Tier X' : ''}.`}
            </p>
          </div>
        </div>

        <div className="ai-tier-actions">
          <button
            type="button"
            className={`auto-router-toggle-btn ${config.isAutoRouterEnabled ? 'active' : ''}`}
            onClick={handleToggleAutoRouter}
            title={ar ? 'تفعيل أو تعطيل التوجيه التلقائي' : 'Toggle auto router'}
          >
            <Compass size={16} />
            <span>
              {config.isAutoRouterEnabled
                ? (ar ? 'التوجيه الذكي: نشط' : 'Smart Router: Active')
                : (ar ? 'تحديد يدوي' : 'Manual selection')}
            </span>
          </button>

          <button type="button" className="server-settings-toggle-btn" onClick={() => setShowServerSettings(!showServerSettings)}>
            <Server size={16} />
            <span>{ar ? 'إعدادات السيرفر' : 'Server config'}</span>
          </button>

          {onClose && (
            <button type="button" className="ai-tier-close-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {config.isAutoRouterEnabled && (
        <div className="auto-router-ribbon">
          <Activity size={18} className="pulse-icon" />
          <div>
            <strong>{ar ? 'التوجيه الذكي يقرأ كل سؤال ويختار الطبقة على السيرفر:' : 'The router picks the tier server-side:'}</strong>{' '}
            <span>
              {ar
                ? 'سؤال عام → المستوى الأول، سياق تقني أو برمجي → الثاني، تحليل ومخاطر → الثالث، ولا يتجاوز أبداً طبقة ترخيصك.'
                : 'General → Tier 1, technical/coding → Tier 2, analysis/risk → Tier 3 — never above your licence.'}
            </span>
          </div>
        </div>
      )}

      {showServerSettings && (
        <div className="server-config-card">
          <div className="server-config-header">
            <Server size={18} />
            <h4>{ar ? 'عنوان خادم Ollama' : 'Ollama host'}</h4>
          </div>
          <form onSubmit={handleSaveServerSettings} className="server-config-form">
            <div className="server-input-row">
              <label>
                <span>{ar ? 'عنوان الخادم:' : 'Endpoint:'}</span>
                <input type="text" value={serverHostInput} onChange={(e) => setServerHostInput(e.target.value)} placeholder="http://127.0.0.1:11434" dir="ltr" />
              </label>
              <label>
                <span>{ar ? 'ترخيص الحساب:' : 'Account licence:'}</span>
                <input type="text" value={`${activeLicense.tier}${activeLicense.tierX ? ' + tier-x' : ''}`} readOnly dir="ltr" />
              </label>
              <button type="submit" className="save-server-btn">
                <Check size={16} />
                <span>{ar ? 'حفظ' : 'Save'}</span>
              </button>
            </div>
            {serverNotice && <p className="server-notice-text">{serverNotice}</p>}
          </form>
        </div>
      )}

      <div className="tiers-tabs-nav">
        {tierOrder.map((tierId) => {
          const tier = aiTiers[tierId];
          const isSelected = selectedTier === tierId;
          const licensed = isLicensed(tierId);
          const isTierX = tierId === 'tier-x';
          return (
            <button
              key={tierId}
              type="button"
              className={`tier-tab-btn ${isSelected ? 'active' : ''} ${isTierX ? 'tier-x-tab' : ''} ${licensed ? '' : 'locked'}`}
              onClick={() => handleSelectTier(tierId)}
            >
              <div className="tier-tab-top">
                {tierIcons[tierId]}
                <span className="tier-badge-label">{tier.badge}</span>
                {licensed ? (
                  <span className="unlocked-pill">
                    <Unlock size={12} /> {ar ? 'مرخّص' : 'Licensed'}
                  </span>
                ) : (
                  <span className="locked-pill">
                    <Lock size={12} /> {isTierX ? (ar ? 'بترخيص من الإدارة' : 'Admin grant') : (ar ? 'غير مرخّص' : 'Not licensed')}
                  </span>
                )}
              </div>
              <h3 className="tier-tab-name">{tx(tier.label)}</h3>
              <p className="tier-tab-summary">
                {tier.pricePerQuestionSar === null
                  ? (ar ? 'غير معروض للبيع — منحة إدارية' : 'Not for sale — admin grant')
                  : `${tier.pricePerQuestionSar} ${ar ? 'ر.س / سؤال' : 'SAR / question'}`}
              </p>
            </button>
          );
        })}
      </div>

      <div
        className={`active-tier-banner ${selectedTier === 'tier-x' ? 'tier-x-banner' : ''}`}
        style={{ borderLeftColor: currentTier.accent, borderRightColor: currentTier.accent }}
      >
        <div className="tier-banner-header">
          <div className="tier-banner-left">
            <span className="tier-level-indicator" style={{ background: currentTier.accent }}>{currentTier.badge}</span>
            <h3>{tx(currentTier.label)}</h3>
          </div>
          {isLicensed(selectedTier) ? (
            <span className="unlocked-pill"><Check size={13} /> {ar ? 'مفعّل على حسابك' : 'Active on your account'}</span>
          ) : (
            <span className="locked-pill"><Lock size={13} /> {ar ? 'يحتاج ترخيصاً' : 'Licence required'}</span>
          )}
        </div>

        <p className="tier-banner-desc">{tx(currentTier.summary)}</p>

        <div className="model-meta-info">
          <div className="meta-row">
            <span className="meta-label">{ar ? 'التسعير:' : 'Pricing:'}</span>
            <span className="meta-val">
              {currentTier.pricePerQuestionSar === null
                ? (ar ? 'ليست للبيع — تُمنح من الإدارة لحسابات محددة' : 'Not for sale — granted per account')
                : `${currentTier.pricePerQuestionSar} ${ar ? 'ر.س لكل سؤال يُنفَّذ على هذه الطبقة' : 'SAR per question executed on this tier'}`}
            </span>
          </div>
          <div className="meta-row">
            <span className="meta-label">{ar ? 'الموديلات الفعلية على السيرفر:' : 'Real server models:'}</span>
            <span className="meta-val" dir="ltr">{currentModels.map(model => model.id).join(' · ')}</span>
          </div>
        </div>

        {(selectedTier === 'tier-x' || !isLicensed(selectedTier)) && (
          <div className="tier-x-warning-box">
            {selectedTier === 'tier-x' ? <ShieldAlert size={20} className="warning-icon" /> : <AlertTriangle size={20} className="warning-icon" />}
            <div>
              <strong>
                {selectedTier === 'tier-x'
                  ? (ar ? 'المستوى الرابع X — بترخيص من الإدارة:' : 'Tier X — admin grant:')
                  : (ar ? 'طبقة غير مرخّصة:' : 'Unlicensed tier:')}
              </strong>
              <p>
                {selectedTier === 'tier-x'
                  ? (ar
                    ? 'نماذج مفرغة من المرشحات (Abliterated) وغير معروضة للبيع. لا يوجد باسورد لفتحها من الواجهة: تُفعّل فقط عندما يمنحها مسؤول المنصة لحسابك، وعندها توقّع البوابة كل طلب ترخيص لحظي. أي محاولة لطلبها بلا ترخيص تُرفض على السيرفر.'
                    : 'Abliterated models, not for sale. No UI password unlocks them: the platform admin grants them per account, and the gateway signs each request.')
                  : (ar
                    ? 'هذه الطبقة تحتاج ترخيصاً من إدارة المنصة. الترتيب والاستخدام لا يعتمدان على المتصفح — التنفيذ يُرفض على السيرفر إن لم يكن الترخيص صادراً.'
                    : 'This tier needs a platform grant. Enforcement is server-side.')}
              </p>
            </div>
          </div>
        )}

        {notice && <div className="modal-error-alert"><AlertTriangle size={16} /><span>{notice}</span></div>}
      </div>

      <div className="tier-models-grid">
        {currentModels.map((model) => {
          const isSelected = config.selectedModelId === model.id && !config.isAutoRouterEnabled;
          return (
            <div key={model.id} className={`model-card ${isSelected ? 'selected' : ''} ${model.abliterated ? 'abliterated-card' : ''}`}>
              <div className="model-card-top">
                <div className="model-identity">
                  <span className="model-family-tag">{model.id.split(':')[0]}</span>
                  {model.abliterated && <span className="abliterated-badge"><Flame size={12} /> ABLITERATED</span>}
                </div>
                <button
                  type="button"
                  className={`model-select-btn ${isSelected ? 'is-active' : ''}`}
                  onClick={() => handleSelectModel(model.id, model.tier)}
                  disabled={!isLicensed(model.tier)}
                >
                  {isSelected ? <><Check size={14} /><span>{ar ? 'النشط' : 'Active'}</span></> : <span>{ar ? 'اختيار' : 'Select'}</span>}
                </button>
              </div>
              <h4 className="model-card-name">{tx(model.label)}</h4>
              <p className="model-card-desc">{tx(model.note)}</p>
              <div className="model-meta-info">
                <div className="meta-row">
                  <span className="meta-label">{ar ? 'اسم الموديل على السيرفر:' : 'Server model id:'}</span>
                  <span className="meta-val" dir="ltr">{model.id}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiTierManager;
