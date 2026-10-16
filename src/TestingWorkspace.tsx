import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type SetStateAction } from 'react';
import { Check, Download, FlaskConical, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { defaultTestingSettings, importLegacyTestingSettings, testingSettingsSchema, type TestingSettings, type TestingWorkspaceRecord } from '../shared/testing-workspace';
import { walletServices } from '../shared/services';
import { api, type Platform } from './platform';
import { useAppearance } from './i18n';
import './TestingWorkspace.css';

type WorkspaceContext = {
  settings: TestingSettings; ready: boolean; saving: boolean; dirty: boolean; error: string; notice: string;
  version: number; updatedAt: string | null;
  update: (change: (previous: TestingSettings) => TestingSettings) => void;
  save: () => Promise<void>; reload: () => Promise<void>; importBrowser: () => void;
};
const Context = createContext<WorkspaceContext | null>(null);

export function TestingWorkspaceProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const { tr } = useAppearance();
  const [settings, setSettings] = useState(defaultTestingSettings);
  const [saved, setSaved] = useState<TestingWorkspaceRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const generation = useRef(0);
  const changes = useRef(0);
  const dirty = ready && JSON.stringify(settings) !== JSON.stringify(saved?.settings);

  async function reload() {
    const request = ++generation.current;
    setReady(false); setError(''); setNotice('');
    try {
      const record = await api<TestingWorkspaceRecord>('testing-workspace');
      const validated = testingSettingsSchema.parse(record.settings);
      if (request !== generation.current) return;
      setSettings(validated); setSaved({ ...record, settings: validated }); setReady(true);
    } catch {
      if (request === generation.current) setError(tr('تعذر تحميل إعدادات أدواتك. أعد المحاولة؛ لم تتغير إعداداتك المحفوظة.', 'Your tool settings could not be loaded. Retry; your saved settings have not changed.'));
    }
  }

  useEffect(() => {
    if (enabled) void reload();
    return () => { generation.current++; };
  }, [enabled]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function update(change: (previous: TestingSettings) => TestingSettings) {
    changes.current++;
    setSettings(change); setNotice('');
  }

  async function save() {
    if (!ready || saving || !saved) return;
    const parsed = testingSettingsSchema.safeParse(settings);
    if (!parsed.success) { setError(tr('تحقق من إعدادات الاختبار وعناوين IPv4 قبل الحفظ.', 'Check the test settings and IPv4 addresses before saving.')); return; }
    const request = generation.current;
    const revision = changes.current;
    setSaving(true); setError(''); setNotice('');
    try {
      const record = await api<TestingWorkspaceRecord>('testing-workspace', { settings: parsed.data, version: saved.version });
      if (request !== generation.current) return;
      setSaved(record);
      if (revision === changes.current) setSettings(record.settings);
      setNotice(tr('تم حفظ إعدادات الأدوات في حسابك.', 'Tool settings saved to your account.'));
    } catch (caught) {
      if (request === generation.current) setError(caught instanceof Error ? caught.message : tr('تعذر الحفظ.', 'Unable to save.'));
    } finally { if (request === generation.current) setSaving(false); }
  }

  function importBrowser() {
    setError(''); setNotice('');
    try {
      const imported = importLegacyTestingSettings(settings, key => localStorage.getItem(key));
      if (!imported) { setNotice(tr('لا توجد إعدادات قديمة مدعومة في هذا المتصفح.', 'No supported legacy settings were found in this browser.')); return; }
      update(() => imported);
      setNotice(tr('تم تحميل الإعدادات القديمة للمراجعة. احفظها لربطها بحسابك؛ بقيت النسخة القديمة في المتصفح.', 'Legacy settings loaded for review. Save to attach them to your account; the browser copy is preserved.'));
    } catch {
      setError(tr('تعذر قراءة الإعدادات القديمة. لم تتغير إعدادات حسابك.', 'Legacy settings could not be read. Your account settings have not changed.'));
    }
  }

  return <Context.Provider value={{ settings, ready, saving, dirty, error, notice, version: saved?.version ?? 0, updatedAt: saved?.updatedAt ?? null, update, save, reload, importBrowser }}>{children}</Context.Provider>;
}

export function useTestingWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error('Testing tools require an account workspace');
  return value;
}

export function useSimulatorSetting<K extends keyof TestingSettings['simulator']>(key: K) {
  const { settings, update } = useTestingWorkspace();
  type Value = TestingSettings['simulator'][K];
  const set = (next: SetStateAction<Value>) => update(previous => ({
    ...previous, simulator: { ...previous.simulator, [key]: typeof next === 'function' ? (next as (value: Value) => Value)(previous.simulator[key]) : next },
  }));
  return [settings.simulator[key], set] as const;
}

export function TestingSettingsPanel({ children }: { children: ReactNode }) {
  const workspace = useTestingWorkspace();
  const { tr, locale } = useAppearance();
  if (!workspace.ready) return <section className="panel testing-sync" aria-busy={!workspace.error}>
    {workspace.error ? <><p role="alert">{workspace.error}</p><button className="outline-button" onClick={() => void workspace.reload()}><RefreshCw size={16} />{tr('إعادة المحاولة', 'Retry')}</button></>
      : <p role="status">{tr('جارٍ تحميل إعدادات أدواتك…', 'Loading your tool settings…')}</p>}
  </section>;
  return <>
    <section className="panel testing-sync">
      <div className="testing-sync-heading"><ShieldCheck size={22} /><div><strong>{tr('إعدادات الأدوات مرتبطة بحسابك', 'Tool settings belong to your account')}</strong>
        <p>{workspace.dirty ? tr('تعديلات غير محفوظة', 'Unsaved changes') : workspace.version ? tr('تم تحميل النسخة المحفوظة', 'Saved settings loaded') : tr('الإعدادات الأصلية المتاحة — لم يتم الحفظ بعد', 'Available original defaults — not saved yet')}
          {workspace.updatedAt && <> · {new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(workspace.updatedAt))}</>}</p></div></div>
      <div className="testing-actions"><button className="primary-button" disabled={workspace.saving || (!workspace.dirty && workspace.version > 0)} onClick={() => void workspace.save()}><Save size={16} />{workspace.saving ? tr('جارٍ الحفظ…', 'Saving…') : tr('حفظ إعدادات الأدوات', 'Save tool settings')}</button>
        <button className="outline-button" disabled={workspace.saving} onClick={() => { if (!workspace.dirty || window.confirm(tr('تجاهل التعديلات غير المحفوظة وتحميل آخر نسخة من الحساب؟', 'Discard unsaved changes and load the latest account settings?'))) void workspace.reload(); }}><RefreshCw size={16} />{tr('تحميل المحفوظ', 'Reload saved')}</button></div>
      <details className="testing-import"><summary>{tr('استعادة إعدادات المتصفح القديم', 'Recover settings from this browser')}</summary><p>{tr('استورد فقط إذا كانت الإعدادات في هذا المتصفح تخص حسابك. تُحمّل قواعد المحاكاة وإعدادات الموقع للمراجعة قبل الحفظ، دون حذف النسخة القديمة.', 'Import only if this browser’s settings belong to your account. Simulation rules and location preferences are loaded for review before saving; the old copy is preserved.')}</p><button className="outline-button" disabled={workspace.saving} onClick={workspace.importBrowser}><Download size={16} />{tr('تحميل إعداداتي القديمة للمراجعة', 'Load my old settings for review')}</button></details>
      {workspace.error && <p className="form-error" role="alert">{workspace.error}</p>}
      {workspace.notice && <p className="testing-notice" role="status"><Check size={16} />{workspace.notice}</p>}
    </section>
    <fieldset className="testing-body" disabled={workspace.saving}>{children}</fieldset>
  </>;
}

export function TestingProductContext({ platform }: { platform: Platform }) {
  const { tr } = useAppearance();
  const [sku, setSku] = useSimulatorSetting('productSku');
  const service = walletServices.find(item => item.sku === sku);
  const capabilities = [ ['PayTabs', platform.capabilities], ['Telr', platform.telrCapabilities], ['N-Genius', platform.ngeniusCapabilities], ['Tap', platform.tapCapabilities] ] as const;
  return <section className="panel testing-product-context">
    <div><span className="eyebrow">ONESHOT / TEST CONTEXT</span><h2>{tr('نفس الخدمات. نفس الحساب.', 'Your services. Your account.')}</h2>
      <p>{platform.merchant ? `${platform.merchant.name}${platform.merchant.accountId ? ` · ${platform.merchant.accountId}` : ''}` : tr('مساحة اختبار مرتبطة بحسابك الحالي', 'Testing workspace linked to your current account')}</p>
      <p>{tr('تستخدم المحاكاة كتالوج oneShot الحالي. بيانات العملاء ونتائج الاختبار تجريبية؛ لا تُرسل دفعات ولا تُغيّر قواعد البوابات الفعلية.', 'Simulations use the current oneShot catalog. Customer data and test results are examples; no payments are sent and live gateway rules are not changed.')}</p>
    </div>
    <div><label>{tr('الخدمة المستخدمة في الاختبار', 'Service under test')}<select value={sku} onChange={event => setSku(event.target.value)}><option value="">{tr('سيناريو عام', 'General scenario')}</option>{walletServices.map(item => <option key={item.sku} value={item.sku}>{tr(item.nameAr, item.nameEn)} · {item.amount} SAR</option>)}</select></label>
      {service && <p><code>{service.sku}</code> · {service.billingCycle === 'monthly' ? tr('شهري', 'Monthly') : service.billingCycle === 'yearly' ? tr('سنوي', 'Yearly') : tr('دفعة واحدة', 'One-time')}</p>}
      {platform.merchant ? <div className="testing-gateways" aria-label={tr('حالة الربط الفعلية لهذا الحساب', 'Actual gateway connections for this account')}>{capabilities.map(([name, caps]) => <span key={name} className={caps?.connected ? 'connected' : ''}>{name} · {caps?.connected ? tr('مرتبط', 'Connected') : tr('غير مهيأ', 'Not configured')}</span>)}</div>
        : <p>{tr('أمثلة البوابات متاحة في المحاكي. لا توجد مساحة تاجر مرتبطة بهذا الحساب.', 'Gateway examples are available in the simulator. This account has no linked merchant workspace.')}</p>}
    </div>
  </section>;
}

export function TestingWorkspaceShortcut({ onOpen, admin = false }: { onOpen: () => void; admin?: boolean }) {
  const { tr } = useAppearance();
  return <section className="panel testing-shortcut"><FlaskConical size={28} /><div><span className="eyebrow">LOADER / TESTER</span><h2>{tr('أدوات الاختبار والخدمات', 'Testing tools and services')}</h2><p>{admin ? tr('محاكاة الدفع، إعدادات الموقع، مصفوفة الدول، تحليل الرفض، وإدارة تراخيص الخدمات.', 'Payment simulation, location settings, country compatibility, decline analysis, and service licenses.') : tr('اختبر خدمات متجرك وبواباته، واضبط قواعد المحاكاة، مع الاحتفاظ بروابط الدفع والفواتير الحالية.', 'Test your store’s services and gateways and configure simulation rules alongside your existing payment links and invoices.')}</p></div><button className="primary-button" onClick={onOpen}>{tr('فتح أدوات اللودر', 'Open Loader tools')}</button></section>;
}
