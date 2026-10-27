import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban, Check, ChevronRight, CreditCard, Crown, Cpu, ExternalLink, Gift,
  Globe, LayoutDashboard, Loader2, Megaphone, MessageSquare, Plus, RefreshCw,
  Search, ShieldCheck, Sparkles, Trash2, Users, Wrench, Zap,
} from 'lucide-react';
import { api } from './platform';
import './SuperAdmin.css';
import {
  APP_STATUSES, SUBDOMAINS, type AdminUserRow, type AppStatus, type ClientContext,
  type FeedbackRow, type ProviderHealth, type SuperAdminConfig, type SubdomainId,
} from '../shared/superadmin';

type Section = 'overview' | 'gatekeeper' | 'ai' | 'users' | 'vip' | 'feedback' | 'pay' | 'security';

const SECTIONS: { id: Section; label: string; icon: typeof Globe }[] = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'gatekeeper', label: 'البوابات والتطبيقات', icon: Globe },
  { id: 'ai', label: 'غرفة الذكاء الاصطناعي', icon: Cpu },
  { id: 'users', label: 'المستخدمون', icon: Users },
  { id: 'vip', label: 'عملاء VIP', icon: Crown },
  { id: 'feedback', label: 'الملاحظات والبلاغات', icon: MessageSquare },
  { id: 'pay', label: 'الدفع والباقات', icon: CreditCard },
  { id: 'security', label: 'الأمان والعمليات', icon: ShieldCheck },
];

const PROVIDER_LABEL: Record<string, string> = {
  gemini: 'Google Gemini', vps: 'سيرفر VPS', 'ollama-cloud': 'Ollama Cloud', openai: 'OpenAI', nous: 'Nous Portal',
};

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      className={`sa-toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className="sa-toggle-knob" />
    </button>
  );
}

export default function SuperAdmin() {
  const [snapshot, setSnapshot] = useState<{
    config: SuperAdminConfig; version: number; users: AdminUserRow[]; feedback: FeedbackRow[];
    clients: ClientContext[]; providers: ProviderHealth[];
  } | null>(null);
  const [section, setSection] = useState<Section>('overview');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await api<{
        config: SuperAdminConfig; version: number; users: AdminUserRow[]; feedback: FeedbackRow[];
        clients: ClientContext[]; providers: ProviderHealth[];
      }>('super-admin');
      setSnapshot(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'تعذر تحميل اللوحة.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const run = useCallback(async (action: Record<string, unknown>, success = 'تم الحفظ.') => {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const result = await api<{ ok: boolean; version: number; config: SuperAdminConfig }>('super-admin', { ...action, version: snapshot?.version ?? 0 });
      if (result.config) setSnapshot(prev => prev ? { ...prev, config: result.config, version: result.version } : prev);
      setNotice(success);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.');
    } finally {
      setBusy(false);
    }
  }, [snapshot, load]);

  const config = snapshot?.config ?? null;

  if (!snapshot) {
    return (
      <div className="sa-shell">
        <div className="sa-loading"><Loader2 className="spin" size={28} />جارٍ تحميل لوحة التحكم المركزية…</div>
      </div>
    );
  }

  return (
    <div className="sa-shell" dir="rtl">
      <header className="sa-topbar">
        <div className="sa-brand">
          <span className="sa-logo">◉</span>
          <div>
            <h1>لوحة التحكم المركزية</h1>
            <span className="sa-sub">OneShot Super-Admin Command Center</span>
          </div>
        </div>
        <div className="sa-topbar-actions">
          {notice && <span className="sa-notice"><Check size={15} />{notice}</span>}
          {error && <span className="sa-error">{error}</span>}
          <button className="sa-btn sa-btn-ghost" onClick={() => void load()} disabled={busy}>
            <RefreshCw size={15} className={busy ? 'spin' : ''} />تحديث
          </button>
          <span className={`sa-mode-pill ${config?.commercial ? 'live' : ''}`}>
            {config?.commercial ? 'تجاري · Commercial' : 'بيتا مجانية · Beta'}
          </span>
        </div>
      </header>

      <div className="sa-layout">
        <nav className="sa-sidebar">
          {SECTIONS.map(s => (
            <button key={s.id} className={`sa-nav ${section === s.id ? 'active' : ''}`} onClick={() => setSection(s.id)}>
              <s.icon size={17} /><span>{s.label}</span><ChevronRight size={14} className="sa-nav-arrow" />
            </button>
          ))}
        </nav>

        <main className="sa-content">
          {section === 'overview' && <Overview snapshot={snapshot} run={run} busy={busy} onSection={setSection} />}
          {section === 'gatekeeper' && config && <Gatekeeper config={config} run={run} busy={busy} />}
          {section === 'ai' && config && <AiRoom config={config} providers={snapshot.providers} run={run} busy={busy} />}
          {section === 'users' && <UsersSection users={snapshot.users} run={run} busy={busy} />}
          {section === 'vip' && <VipSection clients={snapshot.clients} run={run} busy={busy} />}
          {section === 'feedback' && <FeedbackSection feedback={snapshot.feedback} run={run} busy={busy} />}
          {section === 'pay' && config && <PaySection config={config} run={run} busy={busy} />}
          {section === 'security' && <SecuritySection />}
        </main>
      </div>
    </div>
  );
}

function Card({ title, icon, children, action }: { title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="sa-card">
      <header className="sa-card-head">
        <span className="sa-card-title">{icon}{title}</span>
        {action}
      </header>
      {children}
    </section>
  );
}

// ===== 1. نظرة عامة =====
function Overview({ snapshot, run, busy, onSection }: {
  snapshot: { config: SuperAdminConfig; version: number; users: AdminUserRow[]; feedback: FeedbackRow[]; clients: ClientContext[]; providers: ProviderHealth[] };
  run: (a: Record<string, unknown>, s?: string) => void; busy: boolean; onSection: (s: Section) => void;
}) {
  const { config, users, feedback, clients, providers } = snapshot;
  const okProviders = providers.filter(p => p.status === 'ok').length;
  const banned = users.filter(u => u.banned).length;
  const openFeedback = feedback.filter(f => !f.rewarded).length;
  const stats = [
    { label: 'المستخدمون', value: users.length, icon: Users, section: 'users' as Section },
    { label: 'مزوّدو النماذج سليمون', value: `${okProviders}/${providers.length}`, icon: Cpu, section: 'ai' as Section },
    { label: 'عملاء VIP', value: clients.length, icon: Crown, section: 'vip' as Section },
    { label: 'بلاغات غير مُعالجة', value: openFeedback, icon: MessageSquare, section: 'feedback' as Section },
  ];
  return (
    <div className="sa-stack">
      <Card title="مفتاح التحول التجاري (Beta → Commercial)" icon={<Sparkles size={16} />}
        action={<Toggle on={config.commercial} onChange={v => run({ action: 'set-commercial', enabled: v }, v ? 'فعّلت الإطلاق التجاري.' : 'أعدت البيتا المجانية.')} disabled={busy} />}>
        <p className="sa-muted">{config.commercial
          ? 'الخدمات الآن خلف باقات واشتراكات مدفوعة (بالريال السعودي).'
          : 'كل الخدمات مجانية 100% أثناء فترة البيتا. فعّل للانتقال إلى الباقات والاشتراكات.'}</p>
      </Card>

      <div className="sa-stat-grid">
        {stats.map(s => (
          <button key={s.label} className="sa-stat" onClick={() => onSection(s.section)}>
            <s.icon size={20} /><span className="sa-stat-value">{s.value}</span><span className="sa-stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      <Card title="صحة مزوّدي النماذج" icon={<Zap size={16} />}>
        <div className="sa-provider-row">
          {providers.map(p => (
            <div key={p.id} className={`sa-provider-chip ${p.status}`}>
              <span className="sa-provider-dot" />
              <strong>{p.label}</strong>
              <span className="sa-provider-detail">{p.status === 'disabled' ? 'معطّل' : p.status === 'ok' ? (p.latencyMs != null ? `${p.latencyMs}ms` : 'مهيّأ') : 'خطأ'}</span>
            </div>
          ))}
        </div>
        <p className="sa-muted">التفاصيل الكاملة في قسم «غرفة الذكاء الاصطناعي».</p>
      </Card>

      <Card title="آخر المستخدمين المحظورين" icon={<Ban size={16} />}>
        {banned === 0 ? <p className="sa-muted">لا يوجد مستخدمون محظورون.</p> : (
          <p className="sa-muted">{banned} حساب محظور حالياً — راجع قسم المستخدمين لرفع الحظر.</p>
        )}
      </Card>
    </div>
  );
}

// ===== 2. البوابات والتطبيقات =====
function Gatekeeper({ config, run, busy }: { config: SuperAdminConfig; run: (a: Record<string, unknown>, s?: string) => void; busy: boolean }) {
  return (
    <div className="sa-stack">
      <Card title="حالة النطاقات الفرعية" icon={<Globe size={16} />}>
        <div className="sa-subdomain-list">
          {SUBDOMAINS.map(sub => {
            const status = config.subdomains[sub.id].status;
            return (
              <div key={sub.id} className="sa-subdomain">
                <div className="sa-subdomain-info">
                  <strong>{sub.name}</strong>
                  <code dir="ltr">{sub.host}</code>
                </div>
                <div className="sa-status-pills">
                  {APP_STATUSES.map(s => (
                    <button key={s.id} className={`sa-status-pill ${status === s.id ? 'active' : ''}`}
                      style={status === s.id ? { background: s.color, color: '#0a0a0f' } : undefined}
                      disabled={busy}
                      onClick={() => run({ action: 'set-subdomain', id: sub.id, status: s.id }, `حدّثت حالة ${sub.name}.`)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="الشريط الإعلاني العام (Global Top Banner)" icon={<Megaphone size={16} />}
        action={<Toggle on={config.banner.enabled} onChange={v => run({ action: 'toggle-banner', enabled: v }, v ? 'فعّلت الشريط الإعلاني.' : 'أوقفت الشريط الإعلاني.')} disabled={busy} />}>
        <BannerEditor banner={config.banner} run={run} busy={busy} />
      </Card>

      <Card title="مفاتيح أدوات OneShot AI و Media" icon={<Wrench size={16} />}>
        <div className="sa-tool-list">
          {([
            ['storeInspector', 'فاحص المتاجر'],
            ['adStudio', 'استوديو الإعلانات'],
            ['slangGenerator', 'مولد الأوامر العامّي'],
            ['docStudio', 'استوديو الوثائقيات 30 دقيقة'],
            ['contractTranslator', 'مترجم العقود'],
          ] as const).map(([key, label]) => (
            <div key={key} className="sa-tool-row">
              <span>{label}</span>
              <Toggle on={config.tools[key]} onChange={v => run({ action: 'toggle-tool', tool: key, enabled: v }, `حدّثت ${label}.`)} disabled={busy} />
            </div>
          ))}
        </div>
        <p className="sa-muted">المفاتيح سارية فوراً على موقع OneShot الرئيسي دون نشر جديد.</p>
      </Card>
    </div>
  );
}

function BannerEditor({ banner, run, busy }: { banner: SuperAdminConfig['banner']; run: (a: Record<string, unknown>, s?: string) => void; busy: boolean }) {
  const [draft, setDraft] = useState(banner);
  useEffect(() => setDraft(banner), [banner]);
  return (
    <div className="sa-banner-editor">
      <div className="sa-banner-preview" style={{ background: draft.background, color: draft.foreground }}>
        <span>{draft.textAr}</span>
        {draft.badges.map(b => <em key={b}>{b}</em>)}
      </div>
      <div className="sa-grid-2">
        <label>النص العربي<input value={draft.textAr} onChange={e => setDraft({ ...draft, textAr: e.target.value })} /></label>
        <label>النص الإنجليزي<input dir="ltr" value={draft.textEn} onChange={e => setDraft({ ...draft, textEn: e.target.value })} /></label>
        <label>لون الخلفية<input type="color" value={draft.background} onChange={e => setDraft({ ...draft, background: e.target.value })} /></label>
        <label>لون النص<input type="color" value={draft.foreground} onChange={e => setDraft({ ...draft, foreground: e.target.value })} /></label>
      </div>
      <label>الشارات (مفصولة بفاصلة)<input dir="ltr" value={draft.badges.join(', ')} onChange={e => setDraft({ ...draft, badges: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></label>
      <button className="sa-btn sa-btn-primary" disabled={busy} onClick={() => run({ action: 'toggle-banner', enabled: banner.enabled, banner: draft }, 'حُدّث الشريط الإعلاني.')}>
        <Check size={15} />حفظ الشريط
      </button>
    </div>
  );
}

// ===== 3. غرفة الذكاء الاصطناعي =====
function AiRoom({ config, providers, run, busy }: { config: SuperAdminConfig; providers: ProviderHealth[]; run: (a: Record<string, unknown>, s?: string) => void; busy: boolean }) {
  const tiers: { id: keyof SuperAdminConfig['modelRouting']['bindings']; label: string }[] = [
    { id: 'tier-1', label: 'Tier 1 · سريع' },
    { id: 'tier-2', label: 'Tier 2 · احترافي' },
    { id: 'tier-3', label: 'Tier 3 · استدلال' },
    { id: 'tier-x', label: 'Tier X · Abliterated' },
  ];
  return (
    <div className="sa-stack">
      <Card title="مؤشر صحة النماذج الحي" icon={<Zap size={16} />}>
        <div className="sa-health-list">
          {providers.map(p => (
            <div key={p.id} className="sa-health-row">
              <div>
                <strong>{p.label}</strong>
                <span className={`sa-health-detail ${p.status}`}>{p.detail}</span>
              </div>
              <span className={`sa-health-badge ${p.status}`}>
                {p.status === 'ok' ? 'متصل' : p.status === 'disabled' ? 'معطّل' : 'خطأ'}
              </span>
            </div>
          ))}
        </div>
        <div className="sa-provider-toggles">
          {(Object.keys(config.providers) as (keyof SuperAdminConfig['providers'])[]).map(id => (
            <div key={id} className="sa-tool-row">
              <span>{PROVIDER_LABEL[id]}</span>
              <Toggle on={config.providers[id].enabled} onChange={v => run({ action: 'set-provider', id, enabled: v }, `حدّثت ${PROVIDER_LABEL[id]}.`)} disabled={busy} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="تبديل النماذج الديناميكي" icon={<Cpu size={16} />}
        action={<div className="sa-inline-toggle"><span>التوجيه التلقائي</span><Toggle on={config.modelRouting.autoRouter} onChange={v => run({ action: 'set-auto-router', enabled: v }, v ? 'فعّلت التوجيه التلقائي.' : 'أوقفت التوجيه التلقائي.')} disabled={busy} /></div>}>
        <div className="sa-binding-list">
          {tiers.map(t => {
            const b = config.modelRouting.bindings[t.id];
            return (
              <div key={t.id} className="sa-binding">
                <span className="sa-binding-tier">{t.label}</span>
                <select value={b.provider} disabled={busy} onChange={e => run({ action: 'set-binding', tier: t.id, provider: e.target.value, model: b.model }, `حدّثت ${t.label}.`)}>
                  <option value="auto">تلقائي</option>
                  {Object.keys(config.providers).map(p => <option key={p} value={p}>{PROVIDER_LABEL[p]}</option>)}
                </select>
                <input dir="ltr" value={b.model} disabled={busy} onChange={e => { /* حفظ النموذج عند الخروج */ }}
                  onBlur={e => { if (e.target.value !== b.model) run({ action: 'set-binding', tier: t.id, provider: b.provider, model: e.target.value }, `حدّثت ${t.label}.`); }} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="حماية الميزانية (Fair-Use Limit)" icon={<ShieldCheck size={16} />}
        action={<Toggle on={config.fairUse.enabled} onChange={v => run({ action: 'set-fair-use', enabled: v, dailyQuestions: config.fairUse.dailyQuestions }, v ? 'فعّلت سقف الاستهلاك.' : 'أوقفت سقف الاستهلاك.')} disabled={busy} />}>
        <div className="sa-fairuse">
          <span>الحد الأقصى اليومي للأسئلة لكل مستخدم مجاني:</span>
          <input type="number" min={1} value={config.fairUse.dailyQuestions} disabled={busy || !config.fairUse.enabled}
            onBlur={e => { const n = Number(e.target.value); if (n > 0 && n !== config.fairUse.dailyQuestions) run({ action: 'set-fair-use', enabled: config.fairUse.enabled, dailyQuestions: n }, 'حُدّث سقف الاستهلاك.'); }} />
        </div>
        <p className="sa-muted">يمنع استنزاف الـ APIs من البوتات والحسابات المتعددة أثناء البيتا.</p>
      </Card>
    </div>
  );
}

// ===== 4. المستخدمون =====
function UsersSection({ users, run, busy }: { users: AdminUserRow[]; run: (a: Record<string, unknown>, s?: string) => void; busy: boolean }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => users.filter(u => (u.name + u.id).toLowerCase().includes(q.toLowerCase())), [users, q]);
  return (
    <div className="sa-stack">
      <Card title={`المستخدمون المسجلون (${users.length})`} icon={<Users size={16} />}
        action={<label className="sa-search"><Search size={14} /><input placeholder="بحث…" value={q} onChange={e => setQ(e.target.value)} /></label>}>
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead><tr><th>الحساب</th><th>الطبقة</th><th>X</th><th>الكوادر</th><th>استهلاك اليوم</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className={u.banned ? 'banned' : ''}>
                  <td><strong>{u.name}</strong><code dir="ltr">{u.id.slice(0, 8)}…</code></td>
                  <td><span className="sa-tag">{u.tier}</span></td>
                  <td>{u.tierX ? '✓' : '—'}</td>
                  <td><span className="sa-muted">{u.staff.length ? u.staff.join(' · ') : 'الأساسي'}</span></td>
                  <td>{u.usageToday}</td>
                  <td>{u.banned ? <span className="sa-tag danger">محظور</span> : <span className="sa-tag ok">نشط</span>}</td>
                  <td>
                    <div className="sa-row-actions">
                      <button className="sa-btn sa-btn-sm" disabled={busy} onClick={() => run({ action: 'grant-tier', userId: u.id, tier: 'tier-3', note: 'ترقية VIP من اللوحة' }, 'رقّيت الحساب إلى VIP.')}>ترقية VIP</button>
                      {u.banned
                        ? <button className="sa-btn sa-btn-sm" disabled={busy} onClick={() => run({ action: 'unban-user', userId: u.id }, 'أُعيد تفعيل الحساب.')}>إلغاء الحظر</button>
                        : <button className="sa-btn sa-btn-sm danger" disabled={busy} onClick={() => run({ action: 'ban-user', userId: u.id }, 'حُظر الحساب.')}><Ban size={13} />حظر</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sa-muted">ملاحظة: البريد الإلكتروني غير مخزّن في قاعدة المنصة — يظهر معرّف الهوية (Netlify Identity). لعرض البريد يجب ربط Netlify Identity Admin API.</p>
      </Card>
    </div>
  );
}

// ===== 5. عملاء VIP =====
function VipSection({ clients, run, busy }: { clients: ClientContext[]; run: (a: Record<string, unknown>, s?: string) => void; busy: boolean }) {
  const [editing, setEditing] = useState<ClientContext | null>(null);
  const seed = () => setEditing({
    id: '', name: 'نواف عبد الرحمن السويلم', nameEn: 'Nawaf Abdulrahman Al-Suwailim',
    title: 'رئيس مجلس إدارة ومستشار استراتيجي',
    guardrails: ['عدم ذكره كـ«قاضٍ سابق»', 'عدم ذكره كـ«محامٍ مرخّص» حالياً'],
    projects: ['حلقات الريلز القانونية 1-2-3', 'حلقات السرد التاريخي 30 دقيقة', 'مترجم العقود (شركات الطاقة والعائلية)'],
    createdAt: '', updatedAt: '',
  });
  return (
    <div className="sa-stack">
      <Card title={`مساحات عمل عملاء VIP (${clients.length})`} icon={<Crown size={16} />}
        action={<button className="sa-btn sa-btn-primary" onClick={seed}><Plus size={15} />عميل جديد</button>}>
        {clients.length === 0 && !editing && (
          <div className="sa-empty"><p className="sa-muted">لا يوجد عملاء بعد. أضف أول عميل (مثلاً: نواف عبد الرحمن السويلم).</p>
            <button className="sa-btn sa-btn-primary" onClick={seed}><Plus size={15} />إضافة نواف السويلم</button>
          </div>
        )}
        <div className="sa-client-list">
          {clients.map(c => (
            <div key={c.id} className="sa-client">
              <div className="sa-client-head">
                <div><strong>{c.name}</strong><span className="sa-muted">{c.title}</span></div>
                <div className="sa-row-actions">
                  <button className="sa-btn sa-btn-sm" onClick={() => setEditing(c)}>تعديل</button>
                  <button className="sa-btn sa-btn-sm danger" disabled={busy} onClick={() => run({ action: 'delete-client', id: c.id }, 'حُذف العميل.')}><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="sa-client-guardrails">
                <span className="sa-label">قيود النظام الإلزامية:</span>
                {c.guardrails.map((g, i) => <span key={i} className="sa-guardrail"><ShieldCheck size={12} />{g}</span>)}
              </div>
              <div className="sa-client-projects">
                <span className="sa-label">المشاريع:</span>
                {c.projects.map((p, i) => <span key={i} className="sa-project">{p}</span>)}
              </div>
            </div>
          ))}
        </div>
        {editing && <ClientEditor client={editing} onClose={() => setEditing(null)} onSave={(c) => { run({ action: 'save-client', client: c }, 'حُفظ العميل.'); setEditing(null); }} busy={busy} />}
      </Card>
    </div>
  );
}

function ClientEditor({ client, onClose, onSave, busy }: { client: ClientContext; onClose: () => void; onSave: (c: ClientContext) => void; busy: boolean }) {
  const [draft, setDraft] = useState(client);
  return (
    <div className="sa-modal">
      <div className="sa-modal-box">
        <h3>{client.id ? 'تعديل عميل VIP' : 'عميل VIP جديد'}</h3>
        <label>الاسم العربي<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
        <label>الاسم الإنجليزي<input dir="ltr" value={draft.nameEn} onChange={e => setDraft({ ...draft, nameEn: e.target.value })} /></label>
        <label>المسمى الرسمي<input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
        <label>قيود النظام (سطر لكل قيد)<textarea rows={3} value={draft.guardrails.join('\n')} onChange={e => setDraft({ ...draft, guardrails: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} /></label>
        <label>المشاريع (سطر لكل مشروع)<textarea rows={3} value={draft.projects.join('\n')} onChange={e => setDraft({ ...draft, projects: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} /></label>
        <div className="sa-modal-actions">
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="sa-btn sa-btn-primary" disabled={busy} onClick={() => onSave(draft)}><Check size={15} />حفظ</button>
        </div>
      </div>
    </div>
  );
}

// ===== 6. الملاحظات والبلاغات =====
const CATEGORY_LABEL: Record<string, string> = { bug: '🐛 خطأ تقني', feature: '💡 اقتراح ميزة', rating: '⭐ تقييم عام' };
function FeedbackSection({ feedback, run, busy }: { feedback: FeedbackRow[]; run: (a: Record<string, unknown>, s?: string) => void; busy: boolean }) {
  return (
    <div className="sa-stack">
      <Card title={`بلاغات واقتراحات البيتا (${feedback.length})`} icon={<MessageSquare size={16} />}>
        {feedback.length === 0 && <p className="sa-muted">لا توجد بلاغات بعد. تظهر هنا كل بلاغات الزر العائم فور إرسالها.</p>}
        <div className="sa-feedback-list">
          {feedback.map(f => (
            <div key={f.id} className={`sa-feedback ${f.rewarded ? 'rewarded' : ''}`}>
              <div className="sa-feedback-head">
                <span className="sa-tag">{CATEGORY_LABEL[f.category] ?? f.category}</span>
                <span className="sa-muted">{new Date(f.createdAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}</span>
                {f.rewarded && <span className="sa-tag gold">كافأته ✓</span>}
              </div>
              <p className="sa-feedback-msg">{f.message}</p>
              <div className="sa-feedback-meta">
                <code dir="ltr">صفحة: {f.page || '—'}</code>
                {f.modelId && <code dir="ltr">نموذج: {f.modelId}</code>}
                <code dir="ltr">معرّف: {f.userId.slice(0, 8)}…</code>
              </div>
              {!f.rewarded && (
                <button className="sa-btn sa-btn-sm" disabled={busy} onClick={() => run({ action: 'feedback-reward', feedbackId: f.id }, 'كافأت المتعاون (منحة Tier 2 + إيميل شكر).')}>
                  <Gift size={13} />مكافأة المتعاون
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="sa-muted">الزر العائم يرسل نسخة إلى support@1shotcam.com ويحفظ البلاغ هنا تلقائياً.</p>
      </Card>
    </div>
  );
}

// ===== 7. الدفع والباقات =====
function PaySection({ config, run, busy }: { config: SuperAdminConfig; run: (a: Record<string, unknown>, s?: string) => void; busy: boolean }) {
  const [plan, setPlan] = useState<{ id: string; nameAr: string; nameEn: string; priceSar: number; features: string }>({ id: '', nameAr: '', nameEn: '', priceSar: 0, features: '' });
  const [coupon, setCoupon] = useState<{ code: string; percent: number }>({ code: '', percent: 0 });
  return (
    <div className="sa-stack">
      <Card title="مفتاح التحول التجاري" icon={<Sparkles size={16} />}
        action={<Toggle on={config.commercial} onChange={v => run({ action: 'set-commercial', enabled: v }, v ? 'فعّلت الإطلاق التجاري.' : 'أعدت البيتا المجانية.')} disabled={busy} />}>
        <p className="sa-muted">{config.commercial ? 'الوضع التجاري مفعّل — الباقات والاشتراكات سارية.' : 'الوضع: مجاني 100% (بيتا).'}</p>
      </Card>

      <Card title="الباقات والأسعار (ريال سعودي)" icon={<CreditCard size={16} />}>
        <div className="sa-plan-list">
          {config.plans.map(p => (
            <div key={p.id} className="sa-plan">
              <div className="sa-plan-head">
                <strong>{p.nameAr} <span className="sa-muted" dir="ltr">{p.nameEn}</span></strong>
                <span className="sa-price">{p.priceSar} <small>ر.س</small></span>
              </div>
              <ul>{p.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
              <button className="sa-btn sa-btn-sm danger" disabled={busy} onClick={() => run({ action: 'delete-plan', id: p.id }, 'حُذفت الباقة.')}><Trash2 size={13} />حذف</button>
            </div>
          ))}
        </div>
        <div className="sa-plan-form">
          <input placeholder="المعرّف (id)" dir="ltr" value={plan.id} onChange={e => setPlan({ ...plan, id: e.target.value })} />
          <input placeholder="الاسم العربي" value={plan.nameAr} onChange={e => setPlan({ ...plan, nameAr: e.target.value })} />
          <input placeholder="الاسم الإنجليزي" dir="ltr" value={plan.nameEn} onChange={e => setPlan({ ...plan, nameEn: e.target.value })} />
          <input placeholder="السعر (ر.س)" type="number" value={plan.priceSar || ''} onChange={e => setPlan({ ...plan, priceSar: Number(e.target.value) })} />
          <input placeholder="المزايا (مفصولة بفاصلة)" value={plan.features} onChange={e => setPlan({ ...plan, features: e.target.value })} />
          <button className="sa-btn sa-btn-primary" disabled={busy} onClick={() => {
            run({ action: 'save-plan', plan: { id: plan.id, nameAr: plan.nameAr, nameEn: plan.nameEn, priceSar: plan.priceSar, features: plan.features.split(',').map(s => s.trim()).filter(Boolean) } }, 'حُفظت الباقة.');
            setPlan({ id: '', nameAr: '', nameEn: '', priceSar: 0, features: '' });
          }}><Plus size={15} />إضافة باقة</button>
        </div>
      </Card>

      <Card title="أكواد الخصم" icon={<Gift size={16} />}>
        <div className="sa-coupon-list">
          {config.coupons.map(c => (
            <div key={c.code} className="sa-coupon">
              <code dir="ltr">{c.code}</code><span>{c.percent}%</span>
              <span className={`sa-tag ${c.active ? 'ok' : 'danger'}`}>{c.active ? 'فعّال' : 'موقوف'}</span>
              <button className="sa-btn sa-btn-sm danger" disabled={busy} onClick={() => run({ action: 'delete-coupon', code: c.code }, 'حُذف الكوبون.')}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div className="sa-coupon-form">
          <input placeholder="الكود" dir="ltr" value={coupon.code} onChange={e => setCoupon({ ...coupon, code: e.target.value })} />
          <input placeholder="نسبة الخصم %" type="number" value={coupon.percent || ''} onChange={e => setCoupon({ ...coupon, percent: Number(e.target.value) })} />
          <button className="sa-btn sa-btn-primary" disabled={busy} onClick={() => {
            run({ action: 'save-coupon', coupon: { code: coupon.code, percent: coupon.percent, active: true } }, 'أُضيف الكوبون.');
            setCoupon({ code: '', percent: 0 });
          }}><Plus size={15} />إضافة كوبون</button>
        </div>
      </Card>
    </div>
  );
}

// ===== 8. الأمان والعمليات =====
function SecuritySection() {
  const [purged, setPurged] = useState(false);
  return (
    <div className="sa-stack">
      <Card title="مصادقة الدخول" icon={<ShieldCheck size={16} />}>
        <p className="sa-muted">هذه اللوحة محمية بصلاحية المالك فقط (Role-Based Access Control عبر Netlify Identity — دور «admin» أو قائمة ADMIN_EMAILS)، مع تحقق من أصل الطلب وحد أقصى لعدد الطلبات في الساعة.</p>
      </Card>
      <Card title="سجل العمليات (Live Logs)" icon={<RefreshCw size={16} />}>
        <p className="sa-muted">كل تعديل على الإعدادات يُسجَّل في جدول settings_audit (المُعدِّل + النسخة + الطابع الزمني)، ومحاولات الطلب غير الطبيعية تُرفض تلقائياً بحد المعدل (throttle).</p>
        <ul className="sa-log-list">
          <li><span className="sa-tag ok">حماية</span>تحقق النسخة يمنع الكتابة المتزامنة (409 عند التضارب).</li>
          <li><span className="sa-tag ok">حماية</span>مصدر الطلب (Same-Origin) إلزامي لكل كتابة.</li>
          <li><span className="sa-tag gold">مراقبة</span>كل منحة/حظر/مكافأة تُقيَّد في سجل التراخيص.</li>
        </ul>
      </Card>
      <Card title="تنظيف الكاش وإعادة ضبط المسارات" icon={<Zap size={16} />}
        action={<button className="sa-btn sa-btn-primary" onClick={() => { try { if ('caches' in window) void caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))); } catch { /* ignore */ } localStorage.clear(); setPurged(true); setTimeout(() => setPurged(false), 3000); }}>
          <Wrench size={15} />تنظيف الكاش
        </button>}>
        <p className="sa-muted">{purged ? '✓ نُظّف الكاش المحلي وأُعيد ضبط المسارات.' : 'ينظّف كاش المتصفح المحلي (Service Worker + LocalStorage) ويعيد تحميل المسارات دون نشر جديد.'}</p>
      </Card>
    </div>
  );
}
