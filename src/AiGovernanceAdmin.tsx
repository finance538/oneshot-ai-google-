import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Zap,
  Mic,
  Search,
  MapPin,
  Users,
  Check,
  RotateCcw,
  Sliders,
  Cpu,
  Lock,
  Flame,
  Award
} from 'lucide-react';
import {
  type AiGovernanceMatrix,
  type RoleAiPermissions,
  getStoredAiGovernance,
  saveAiGovernance,
  subscribeToAiGovernance,
  defaultAiGovernance
} from './aiGovernanceData';
import './AiGovernanceAdmin.css';

interface AiGovernanceAdminProps {
  adminEmail?: string;
  onNotify?: (message: string) => void;
}

export default function AiGovernanceAdmin({ adminEmail = 'finance@1shotcam.com', onNotify }: AiGovernanceAdminProps) {
  const [matrix, setMatrix] = useState<AiGovernanceMatrix>(getStoredAiGovernance);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAiGovernance(updated => {
      setMatrix(updated);
    });
    return unsub;
  }, []);

  const updateRole = (role: 'merchant' | 'marketer' | 'loader', patch: Partial<RoleAiPermissions>) => {
    setMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        ...patch,
      },
    }));
  };

  const toggleModel = (role: 'merchant' | 'marketer' | 'loader', model: 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite') => {
    const current = matrix[role].allowedModels;
    const exists = current.includes(model);
    const updated = exists ? current.filter(m => m !== model) : [...current, model];
    // Keep at least one model
    if (updated.length === 0) return;
    updateRole(role, { allowedModels: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAiGovernance(matrix, adminEmail);
      setSavedSuccess(true);
      if (onNotify) onNotify('تم حفظ وتحديث صلاحيات الذكاء الاصطناعي بنجاح.');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      if (onNotify) onNotify('تعذر الحفظ إلى الخادم، تم الحفظ محلياً.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setMatrix(defaultAiGovernance);
    await saveAiGovernance(defaultAiGovernance, adminEmail);
    if (onNotify) onNotify('تمت استعادة الإعدادات الافتراضية بنجاح.');
  };

  return (
    <section className="ai-gov-container">
      {/* Admin 100% Unrestricted Power Banner */}
      <div className="ai-gov-admin-banner">
        <div className="banner-glow" />
        <div className="banner-content">
          <div className="banner-header">
            <span className="power-pill">
              <Flame size={15} /> 100% Full Unrestricted Power
            </span>
            <span className="verified-pill">
              <ShieldCheck size={14} /> حساب الأدمن التنفيذي
            </span>
          </div>
          <h2>صلاحيات الذكاء الاصطناعي للأدمن: قوة كاملة 100% ومطلقة</h2>
          <p>
            حساب الأدمن يعمل بجميع خواصه ونماذجه بدون أي قيود: وصول مباشر لأقوى النماذج (Gemini 4 Argon)، التفريغ الصوتي عبر الميكروفون، محرك البحث الحي، خرائط جوجل، ومكتب الرئيس التنفيذي وكوادر الموظفين.
          </p>
          <div className="admin-badges-list">
            <span className="active-cap-tag"><Cpu size={14} /> Gemini 4 Argon (تفكير معمّق)</span>
            <span className="active-cap-tag"><Zap size={14} /> Gemini 3.8 Flash & Lite</span>
            <span className="active-cap-tag"><Mic size={14} /> التفريغ الصوتي المباشر</span>
            <span className="active-cap-tag"><Search size={14} /> Google Search Grounding</span>
            <span className="active-cap-tag"><MapPin size={14} /> Google Maps Grounding</span>
            <span className="active-cap-tag"><Users size={14} /> CEO Suite & AI Staff (موظفين)</span>
            <span className="active-cap-tag"><Award size={14} /> استفسارات غير محدودة</span>
          </div>
        </div>
      </div>

      {/* Control Matrix for Other Roles */}
      <div className="ai-gov-header">
        <div>
          <span className="eyebrow">AI GOVERNANCE & PERMISSIONS MATRIX</span>
          <h3>لوحة حوكمة وتحديد صلاحيات الـ AI للحسابات الأخرى</h3>
          <p>حدد بدقة الميزات والنماذج المسموحة لكل دور داخل المنصة (التجار، المسوّقين، مختبري اللودر).</p>
        </div>
        <div className="ai-gov-top-actions">
          <button type="button" className="outline-button" onClick={handleReset} disabled={saving}>
            <RotateCcw size={15} />
            <span>استعادة الافتراضي</span>
          </button>
          <button type="button" className="primary-button save-gov-btn" onClick={handleSave} disabled={saving}>
            {savedSuccess ? <Check size={16} /> : <Sliders size={16} />}
            <span>{saving ? 'جارٍ الحفظ…' : savedSuccess ? 'تم الحفظ بنجاح' : 'حفظ الصلاحيات'}</span>
          </button>
        </div>
      </div>

      <div className="roles-grid">
        {/* Merchant Card */}
        <article className="role-card highlight-card">
          <div className="role-card-header">
            <div>
              <span className="role-tag-pill merchant-pill">حساب التاجر (CEO & موظفو الـ AI)</span>
              <h4>صلاحيات حساب التجار والعملاء</h4>
            </div>
            <Users className="role-icon" size={24} />
          </div>
          <p className="role-desc">
            مخصص لإدارة المتجر، مكتب الـ CEO، وكوادر الذكاء الاصطناعي كموظفين مؤتمتين للمبيعات والفواتير.
          </p>

          <div className="gov-section">
            <label className="gov-label">النماذج المسموحة</label>
            <div className="checkbox-options">
              <label className="check-box-label">
                <input
                  type="checkbox"
                  checked={matrix.merchant.allowedModels.includes('gemini-4-argon')}
                  onChange={() => toggleModel('merchant', 'gemini-4-argon')}
                />
                <span>Gemini 4 Argon (النموذج الأقوى)</span>
              </label>
              <label className="check-box-label">
                <input
                  type="checkbox"
                  checked={matrix.merchant.allowedModels.includes('gemini-3.8-flash')}
                  onChange={() => toggleModel('merchant', 'gemini-3.8-flash')}
                />
                <span>Gemini 3.8 Flash (المتوازن والسريع)</span>
              </label>
              <label className="check-box-label">
                <input
                  type="checkbox"
                  checked={matrix.merchant.allowedModels.includes('gemini-3.1-flash-lite')}
                  onChange={() => toggleModel('merchant', 'gemini-3.1-flash-lite')}
                />
                <span>Gemini 3.1 Flash-Lite (خفيف وفوري)</span>
              </label>
            </div>
          </div>

          <div className="gov-section">
            <label className="gov-label">أدوات الذكاء الاصطناعي المتقدمة</label>
            <div className="toggle-list">
              <label className="toggle-row">
                <span>
                  <strong>مكتب الرئيس التنفيذي (CEO Suite)</strong>
                  <small>مركز القيادة التنفيذي واتخاذ القرارات وإصدار التوجيهات</small>
                </span>
                <input
                  type="checkbox"
                  checked={matrix.merchant.allowCeoSuite}
                  onChange={e => updateRole('merchant', { allowCeoSuite: e.target.checked })}
                />
              </label>

              <label className="toggle-row">
                <span>
                  <strong>كوادر الـ AI كموظفين (AI Staff Marketplace)</strong>
                  <small>توظيف وتكليف موظفي ذكاء اصطناعي لإنشاء الفواتير والعقود</small>
                </span>
                <input
                  type="checkbox"
                  checked={matrix.merchant.allowAiStaff}
                  onChange={e => updateRole('merchant', { allowAiStaff: e.target.checked })}
                />
              </label>

              <label className="toggle-row">
                <span>
                  <strong>التفريغ الصوتي بالميكروفون (Voice Transcribe)</strong>
                  <small>تسجيل الملاحظات والأوامر الصوتية باللغة العربية مباشرة</small>
                </span>
                <input
                  type="checkbox"
                  checked={matrix.merchant.allowVoiceTranscription}
                  onChange={e => updateRole('merchant', { allowVoiceTranscription: e.target.checked })}
                />
              </label>

              <label className="toggle-row">
                <span>
                  <strong>أدوات التحقق (Google Search & Maps Grounding)</strong>
                  <small>مطابقة الأسعار والتأكد اللحظي من المعلومات</small>
                </span>
                <input
                  type="checkbox"
                  checked={matrix.merchant.allowSearchGrounding}
                  onChange={e => updateRole('merchant', { allowSearchGrounding: e.target.checked, allowMapsGrounding: e.target.checked })}
                />
              </label>
            </div>
          </div>

          <div className="gov-section">
            <label className="gov-label">الحد اليومي للاستفسارات</label>
            <div className="quota-row">
              <input
                type="number"
                min="10"
                max="5000"
                value={matrix.merchant.maxDailyPrompts}
                onChange={e => updateRole('merchant', { maxDailyPrompts: Number(e.target.value) || 100 })}
              />
              <span className="quota-unit">استفسار / يوم لكل تاجر</span>
            </div>
          </div>
        </article>

        {/* Marketer Card */}
        <article className="role-card">
          <div className="role-card-header">
            <div>
              <span className="role-tag-pill marketer-pill">حساب المسوّق (Marketer)</span>
              <h4>صلاحيات حسابات المسوّقين</h4>
            </div>
            <Sparkles className="role-icon" size={24} />
          </div>
          <p className="role-desc">
            مخصص لصناعة المحتوى الإعلاني، صياغة حملات الروابط، وحساب نسب العمولات.
          </p>

          <div className="gov-section">
            <label className="gov-label">النماذج المسموحة</label>
            <div className="checkbox-options">
              <label className="check-box-label">
                <input
                  type="checkbox"
                  checked={matrix.marketer.allowedModels.includes('gemini-4-argon')}
                  onChange={() => toggleModel('marketer', 'gemini-4-argon')}
                />
                <span>Gemini 4 Argon</span>
              </label>
              <label className="check-box-label">
                <input
                  type="checkbox"
                  checked={matrix.marketer.allowedModels.includes('gemini-3.8-flash')}
                  onChange={() => toggleModel('marketer', 'gemini-3.8-flash')}
                />
                <span>Gemini 3.8 Flash</span>
              </label>
              <label className="check-box-label">
                <input
                  type="checkbox"
                  checked={matrix.marketer.allowedModels.includes('gemini-3.1-flash-lite')}
                  onChange={() => toggleModel('marketer', 'gemini-3.1-flash-lite')}
                />
                <span>Gemini 3.1 Flash-Lite</span>
              </label>
            </div>
          </div>

          <div className="gov-section">
            <label className="gov-label">الميزات الإضافية</label>
            <div className="toggle-list">
              <label className="toggle-row">
                <span>
                  <strong>التفريغ الصوتي</strong>
                  <small>إملاء الأفكار التسويقية صوتياً</small>
                </span>
                <input
                  type="checkbox"
                  checked={matrix.marketer.allowVoiceTranscription}
                  onChange={e => updateRole('marketer', { allowVoiceTranscription: e.target.checked })}
                />
              </label>
              <label className="toggle-row">
                <span>
                  <strong>بحث جوجل المباشر</strong>
                  <small>متابعة صيحات السوق والكلمات المفتاحية</small>
                </span>
                <input
                  type="checkbox"
                  checked={matrix.marketer.allowSearchGrounding}
                  onChange={e => updateRole('marketer', { allowSearchGrounding: e.target.checked })}
                />
              </label>
            </div>
          </div>

          <div className="gov-section">
            <label className="gov-label">الحد اليومي للاستفسارات</label>
            <div className="quota-row">
              <input
                type="number"
                min="10"
                max="2000"
                value={matrix.marketer.maxDailyPrompts}
                onChange={e => updateRole('marketer', { maxDailyPrompts: Number(e.target.value) || 50 })}
              />
              <span className="quota-unit">استفسار / يوم لكل مسوّق</span>
            </div>
          </div>
        </article>

        {/* Loader / Tester Card */}
        <article className="role-card">
          <div className="role-card-header">
            <div>
              <span className="role-tag-pill loader-pill">حساب اللودر (Loader / Tester)</span>
              <h4>صلاحيات حساب مختبري البوابات</h4>
            </div>
            <Cpu className="role-icon" size={24} />
          </div>
          <p className="role-desc">
            مخصص للمحاكاة الفنية، اختبارات BIN، وتشخيص أخطاء الاستجابة والويب هوك.
          </p>

          <div className="gov-section">
            <label className="gov-label">النماذج المسموحة</label>
            <div className="checkbox-options">
              <label className="check-box-label">
                <input
                  type="checkbox"
                  checked={matrix.loader.allowedModels.includes('gemini-3.8-flash')}
                  onChange={() => toggleModel('loader', 'gemini-3.8-flash')}
                />
                <span>Gemini 3.8 Flash</span>
              </label>
              <label className="check-box-label">
                <input
                  type="checkbox"
                  checked={matrix.loader.allowedModels.includes('gemini-3.1-flash-lite')}
                  onChange={() => toggleModel('loader', 'gemini-3.1-flash-lite')}
                />
                <span>Gemini 3.1 Flash-Lite</span>
              </label>
            </div>
          </div>

          <div className="gov-section">
            <label className="gov-label">الحد اليومي للاستفسارات</label>
            <div className="quota-row">
              <input
                type="number"
                min="5"
                max="500"
                value={matrix.loader.maxDailyPrompts}
                onChange={e => updateRole('loader', { maxDailyPrompts: Number(e.target.value) || 20 })}
              />
              <span className="quota-unit">استفسار / يوم لكل مختبر</span>
            </div>
          </div>
        </article>
      </div>

      <div className="ai-gov-footer-bar">
        <div className="footer-status">
          <ShieldCheck size={16} color="#00ff88" />
          <span>آخر تحديث للقواعد: {new Date(matrix.updatedAt).toLocaleString('ar-SA')} ({matrix.updatedBy})</span>
        </div>
        <button type="button" className="primary-button" onClick={handleSave} disabled={saving}>
          {saving ? 'جارٍ الحفظ…' : 'تطبيق القواعد على جميع الحسابات'}
        </button>
      </div>
    </section>
  );
}
