// AiTierManager.tsx
// Interactive 4-Tier AI Control Panel & Ollama Model Selector
// Supports Tier 1 (Fast), Tier 2 (Pro), Tier 3 (Reasoning), and Tier X (Admin-Only Abliterated / Uncensored, behind an admin passcode)
// ملاحظة: بوابة Tier X هنا حاجز واجهة فقط — أي تنفيذ فعلي مقيّد يجب أن يتحقق من الدور على الخادم.
// With Intelligent Auto-Router and Server Credentials Configuration

import React, { useState } from 'react';
import {
  Zap, Cpu, BrainCircuit, Flame, Lock, Unlock, ShieldAlert,
  Server, KeyRound, Check, Sparkles, X, AlertTriangle,
  Compass, Activity
} from 'lucide-react';
import {
  AI_TIERS,
  ADMIN_TIER_X_SECRET,
  type AiTierId,
  type OllamaModelDefinition,
  type OllamaServerConfig,
  saveOllamaConfig
} from './aiModelsData';
import { useAppearance } from './i18n';
import './AiTierManager.css';

interface AiTierManagerProps {
  config: OllamaServerConfig;
  onConfigChange: (newConfig: OllamaServerConfig) => void;
  onClose?: () => void;
}

export const AiTierManager: React.FC<AiTierManagerProps> = ({
  config,
  onConfigChange,
  onClose,
}) => {
  const { language, dir } = useAppearance();
  const [selectedTierTab, setSelectedTierTab] = useState<AiTierId>(
    config.activeTier === 'auto' ? 'tier-3' : config.activeTier
  );
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccessNotice, setAdminSuccessNotice] = useState('');
  const [serverHostInput, setServerHostInput] = useState(config.host);
  const [serverNotice, setServerNotice] = useState('');
  const [showServerSettings, setShowServerSettings] = useState(false);

  const langKey = (['ar', 'en', 'zh', 'ru', 'fr'].includes(language) ? language : 'ar') as 'ar' | 'en' | 'zh' | 'ru' | 'fr';

  // Handle Tier X unlock attempt
  const handleUnlockTierX = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccessNotice('');

    if (adminPasswordInput.trim() === ADMIN_TIER_X_SECRET) {
      const updated: OllamaServerConfig = {
        ...config,
        isTierXUnlocked: true,
        adminSecret: adminPasswordInput.trim(),
        unlockedAt: new Date().toISOString(),
      };
      onConfigChange(updated);
      saveOllamaConfig(updated);
      setAdminSuccessNotice(
        langKey === 'ar'
          ? 'تم التحقق من كلمة مرور المسؤول بنجاح! تم فتح المستوى الرابع (Tier X: Abliterated Models) بالكامل.'
          : 'Admin secret verified successfully! Tier X (Abliterated Models) is now fully unlocked.'
      );
      setTimeout(() => {
        setShowAdminModal(false);
        setSelectedTierTab('tier-x');
      }, 1200);
    } else {
      setAdminError(
        langKey === 'ar'
          ? 'كلمة المرور غير صحيحة. يرجى إدخال كلمة سر الخادم المعتمدة للمسؤول.'
          : 'Invalid admin secret. Please provide the authorized server password.'
      );
    }
  };

  const handleLockTierX = () => {
    const updated: OllamaServerConfig = {
      ...config,
      isTierXUnlocked: false,
      activeTier: config.activeTier === 'tier-x' ? 'tier-3' : config.activeTier,
      selectedModelId: config.selectedModelId.includes('abliterated') ? 'deepseek-r1:70b' : config.selectedModelId,
    };
    onConfigChange(updated);
    saveOllamaConfig(updated);
    if (selectedTierTab === 'tier-x') {
      setSelectedTierTab('tier-3');
    }
  };

  const handleSelectModel = (model: OllamaModelDefinition) => {
    const updated: OllamaServerConfig = {
      ...config,
      activeTier: model.tier,
      selectedModelId: model.id,
      isAutoRouterEnabled: false,
    };
    onConfigChange(updated);
    saveOllamaConfig(updated);
  };

  const handleToggleAutoRouter = () => {
    const nextState = !config.isAutoRouterEnabled;
    const updated: OllamaServerConfig = {
      ...config,
      isAutoRouterEnabled: nextState,
      activeTier: nextState ? 'auto' : selectedTierTab,
    };
    onConfigChange(updated);
    saveOllamaConfig(updated);
  };

  const handleSaveServerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: OllamaServerConfig = {
      ...config,
      host: serverHostInput.trim() || 'http://localhost:11434',
    };
    onConfigChange(updated);
    saveOllamaConfig(updated);
    setServerNotice(
      langKey === 'ar'
        ? 'تم حفظ عنوان خادم Ollama بنجاح.'
        : 'Ollama server endpoint saved successfully.'
    );
    setTimeout(() => setServerNotice(''), 3000);
  };

  const getTierIcon = (tierId: AiTierId) => {
    switch (tierId) {
      case 'tier-1': return <Zap className="tier-tab-icon" size={18} />;
      case 'tier-2': return <Cpu className="tier-tab-icon" size={18} />;
      case 'tier-3': return <BrainCircuit className="tier-tab-icon" size={18} />;
      case 'tier-x': return <Flame className="tier-tab-icon" size={18} />;
    }
  };

  const currentTier = AI_TIERS[selectedTierTab];

  return (
    <div className="ai-tier-manager-container" dir={dir}>
      {/* Header bar */}
      <div className="ai-tier-header">
        <div className="ai-tier-title-group">
          <div className="ai-tier-logo-badge">
            <Sparkles size={24} className="sparkle-icon" />
          </div>
          <div>
            <div className="ai-tier-badge-pill">
              <span>{langKey === 'ar' ? 'منظومة Ollama السحابية والمحلية' : 'Ollama Core Engine'}</span>
              <span className="ai-tier-dot" />
              <span>4 Tiers Architecture</span>
            </div>
            <h2 className="ai-tier-main-title">
              {langKey === 'ar'
                ? 'مستويات الذكاء الاصطناعي ونظام التوجيه الذكي'
                : 'AI Model Tiers & Smart Intelligent Router'}
            </h2>
            <p className="ai-tier-subtitle">
              {langKey === 'ar'
                ? '3 مستويات ذكاء معتمدة + المستوى الرابع (X: Abliterated) للمسؤول مع خوارزمية التوجيه الذاتي التلقائي.'
                : '3 Standard Intelligence Tiers + Admin Tier X (Abliterated Core) with Auto Smart Router.'}
            </p>
          </div>
        </div>

        <div className="ai-tier-actions">
          <button
            type="button"
            className={`auto-router-toggle-btn ${config.isAutoRouterEnabled ? 'active' : ''}`}
            onClick={handleToggleAutoRouter}
            title={langKey === 'ar' ? 'تفعيل أو تعطيل التوجيه التلقائي الذكي' : 'Toggle Auto Smart Router'}
          >
            <Compass size={16} />
            <span>
              {config.isAutoRouterEnabled
                ? (langKey === 'ar' ? 'التوجيه الذكي: نشط 🎯' : 'Smart Router: Active 🎯')
                : (langKey === 'ar' ? 'تحديد يدوي للنموذج' : 'Manual Model Selection')}
            </span>
          </button>

          <button
            type="button"
            className="server-settings-toggle-btn"
            onClick={() => setShowServerSettings(!showServerSettings)}
          >
            <Server size={16} />
            <span>{langKey === 'ar' ? 'إعدادات السيرفر' : 'Server Config'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              className="ai-tier-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Auto Router Status Ribbon */}
      {config.isAutoRouterEnabled && (
        <div className="auto-router-ribbon">
          <Activity size={18} className="pulse-icon" />
          <div>
            <strong>
              {langKey === 'ar'
                ? 'نظام التوجيه الذكي يحلل كل استفسار تلقائياً:'
                : 'Intelligent Router Analyzes Queries Automatically:'}
            </strong>{' '}
            <span>
              {langKey === 'ar'
                ? 'يوجه المحادثات اليومية لـ Tier 1، الأسئلة الفنية لـ Tier 2، المعضلات والاستدلال لـ Tier 3، والفحوصات الأمنية لـ Tier X (عند التفعيل).'
                : 'Routes everyday chats to Tier 1, technical questions to Tier 2, reasoning to Tier 3, and deep audits to Tier X.'}
            </span>
          </div>
        </div>
      )}

      {/* Server Settings Drawer */}
      {showServerSettings && (
        <div className="server-config-card">
          <div className="server-config-header">
            <Server size={18} />
            <h4>{langKey === 'ar' ? 'بيانات اتصال خادم Ollama والاعتماد' : 'Ollama Host & Server Credentials'}</h4>
          </div>
          <form onSubmit={handleSaveServerSettings} className="server-config-form">
            <div className="server-input-row">
              <label>
                <span>{langKey === 'ar' ? 'عنوان خادم Ollama (Host Endpoint):' : 'Ollama Host Endpoint:'}</span>
                <input
                  type="text"
                  value={serverHostInput}
                  onChange={(e) => setServerHostInput(e.target.value)}
                  placeholder="http://localhost:11434 أو عنوان الـ VPS"
                  dir="ltr"
                />
              </label>
              <label>
                <span>{langKey === 'ar' ? 'كلمة سر السيرفر الإدارية (Server Key):' : 'Server Admin Secret:'}</span>
                <input
                  type="password"
                  value={config.adminSecret ? '••••••••••••••••' : ''}
                  placeholder="•••••••• (يُدخل من إعدادات الإدارة)"
                  readOnly
                  dir="ltr"
                />
              </label>
              <button type="submit" className="save-server-btn">
                <Check size={16} />
                <span>{langKey === 'ar' ? 'حفظ الربط' : 'Save Endpoint'}</span>
              </button>
            </div>
            {serverNotice && <p className="server-notice-text">{serverNotice}</p>}
          </form>
        </div>
      )}

      {/* Tiers Navigation Tabs */}
      <div className="tiers-tabs-nav">
        {(['tier-1', 'tier-2', 'tier-3', 'tier-x'] as AiTierId[]).map((tierId) => {
          const tier = AI_TIERS[tierId];
          const isSelected = selectedTierTab === tierId;
          const isTierX = tierId === 'tier-x';
          const isLocked = isTierX && !config.isTierXUnlocked;

          return (
            <button
              key={tierId}
              type="button"
              className={`tier-tab-btn ${isSelected ? 'active' : ''} ${isTierX ? 'tier-x-tab' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => {
                if (isLocked) {
                  setShowAdminModal(true);
                } else {
                  setSelectedTierTab(tierId);
                }
              }}
            >
              <div className="tier-tab-top">
                {getTierIcon(tierId)}
                <span className="tier-badge-label">{tier.badge}</span>
                {isTierX && (
                  config.isTierXUnlocked ? (
                    <span className="unlocked-pill">
                      <Unlock size={12} /> {langKey === 'ar' ? 'مفعل' : 'Unlocked'}
                    </span>
                  ) : (
                    <span className="locked-pill">
                      <Lock size={12} /> {langKey === 'ar' ? 'للمسؤول فقط' : 'Admin Only'}
                    </span>
                  )
                )}
              </div>
              <h3 className="tier-tab-name">
                {tier.title[langKey] || tier.title.ar}
              </h3>
              <p className="tier-tab-summary">
                {tier.models.length} {langKey === 'ar' ? 'نماذج Ollama مدمجة' : 'Ollama Models'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Tier Overview Banner */}
      <div
        className={`active-tier-banner ${selectedTierTab === 'tier-x' ? 'tier-x-banner' : ''}`}
        style={{
          borderLeftColor: currentTier.accentColor,
          borderRightColor: currentTier.accentColor,
        }}
      >
        <div className="tier-banner-header">
          <div className="tier-banner-left">
            <span
              className="tier-level-indicator"
              style={{ background: currentTier.accentColor }}
            >
              {currentTier.badge}
            </span>
            <h3>{currentTier.title[langKey] || currentTier.title.ar}</h3>
          </div>

          {selectedTierTab === 'tier-x' && config.isTierXUnlocked && (
            <button
              type="button"
              className="lock-tier-x-btn"
              onClick={handleLockTierX}
              title={langKey === 'ar' ? 'إعادة قفل المستوى الرابع لأسباب أمنية' : 'Re-lock Tier X'}
            >
              <Lock size={14} />
              <span>{langKey === 'ar' ? 'إعادة القفل الأمني' : 'Lock Tier X'}</span>
            </button>
          )}
        </div>

        <p className="tier-banner-desc">
          {currentTier.subtitle[langKey] || currentTier.subtitle.ar}
        </p>

        {selectedTierTab === 'tier-x' && (
          <div className="tier-x-warning-box">
            <ShieldAlert size={20} className="warning-icon" />
            <div>
              <strong>
                {langKey === 'ar'
                  ? 'تنبيه أمني شديد الأهمية (Abliterated Models):'
                  : 'High Security Notice (Abliterated Models):'}
              </strong>
              <p>
                {langKey === 'ar'
                  ? 'تم إلغاء أوزان التوافق ومرشحات الرقابة الصناعية (Censorship Guardrails) في هذه النماذج لتمكين المسؤول من التحليل الجنائي الواقعي واختبار اختراق أنظمة الحماية وتجاوز الـ Blacklists بدون أي حجب.'
                  : 'De-aligned and abliterated weights allow direct vulnerability analysis, bypass simulation, and raw penetration testing without safety refusals.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Models Grid in Active Tier */}
      <div className="tier-models-grid">
        {currentTier.models.map((model) => {
          const isSelected = config.selectedModelId === model.id && !config.isAutoRouterEnabled;
          const isModelAbliterated = model.isAbliterated;

          return (
            <div
              key={model.id}
              className={`model-card ${isSelected ? 'selected' : ''} ${isModelAbliterated ? 'abliterated-card' : ''}`}
            >
              <div className="model-card-top">
                <div className="model-identity">
                  <span className="model-family-tag">{model.family}</span>
                  <span className="model-param-tag">{model.parameterSize}</span>
                  {isModelAbliterated && (
                    <span className="abliterated-badge">
                      <Flame size={12} /> ABLITERATED
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className={`model-select-btn ${isSelected ? 'is-active' : ''}`}
                  onClick={() => handleSelectModel(model)}
                >
                  {isSelected ? (
                    <>
                      <Check size={14} />
                      <span>{langKey === 'ar' ? 'النموذج النشط' : 'Active'}</span>
                    </>
                  ) : (
                    <span>{langKey === 'ar' ? 'اختيار' : 'Select'}</span>
                  )}
                </button>
              </div>

              <h4 className="model-card-name">{model.name}</h4>
              <p className="model-card-desc">
                {model.description[langKey] || model.description.ar}
              </p>

              <div className="model-meta-info">
                <div className="meta-row">
                  <span className="meta-label">{langKey === 'ar' ? 'سياق الذاكرة:' : 'Context Window:'}</span>
                  <span className="meta-val" dir="ltr">{model.contextWindow.toLocaleString()} tokens</span>
                </div>
              </div>

              <div className="model-strengths-box">
                <span className="strengths-title">
                  {langKey === 'ar' ? 'نقاط القوة البارزة:' : 'Key Strengths:'}
                </span>
                <ul className="strengths-list">
                  {model.strengths.map((strength, idx) => (
                    <li key={idx}>
                      <Check size={12} className="check-bullet" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="model-tags-footer">
                {model.recommendedFor.map((rec, rIdx) => (
                  <span key={rIdx} className="recommendation-tag">{rec}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Unlock Modal for Tier X */}
      {showAdminModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAdminModal(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-icon-badge">
                <Flame size={24} />
              </div>
              <div>
                <h3>{langKey === 'ar' ? 'تفعيل المستوى الرابع X (نماذج ABLITERATED)' : 'Unlock Tier X (Abliterated Core)'}</h3>
                <span className="admin-only-tag">{langKey === 'ar' ? 'خاص بالمسؤول فقط' : 'ADMIN CREDENTIAL REQUIRED'}</span>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setShowAdminModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="admin-modal-desc">
              {langKey === 'ar'
                ? 'يتطلب فتح نماذج المستوى الرابع X (النماذج الحرة المفرغة من القيود الصناعية) إدخال كلمة سر الخادم المعتمدة للمسؤول:'
                : 'Unlocking Tier X abliterated uncensored models requires the authorized server administrator password:'}
            </p>

            <form onSubmit={handleUnlockTierX} className="admin-unlock-form">
              <div className="password-input-group">
                <KeyRound size={18} className="input-key-icon" />
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder={langKey === 'ar' ? 'أدخل رمز فتح Tier X...' : 'Enter the Tier X passcode...'}
                  required
                  autoFocus
                  dir="ltr"
                />
              </div>

              {adminError && (
                <div className="modal-error-alert">
                  <AlertTriangle size={16} />
                  <span>{adminError}</span>
                </div>
              )}

              {adminSuccessNotice && (
                <div className="modal-success-alert">
                  <Check size={16} />
                  <span>{adminSuccessNotice}</span>
                </div>
              )}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAdminModal(false)}
                >
                  {langKey === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="unlock-submit-btn">
                  <Unlock size={16} />
                  <span>{langKey === 'ar' ? 'تأكيد وفتح المستوى X' : 'Authenticate & Unlock Tier X'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiTierManager;
