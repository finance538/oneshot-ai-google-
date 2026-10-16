import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Bell, Check, LockKeyhole, RefreshCw, Search, ShieldCheck, Sparkles, X, BarChart3 } from 'lucide-react';
import { operationKinds, operationLabels, type OperationRecord, type OperationsState } from '../shared/operations';
import { api, date } from './platform';
import AdminAssistant from './AdminAssistant';
import PaymentFailuresDashboard from './PaymentFailuresDashboard';
import './OperationsCenter.css';

type Review = { action: 'set-read'; record: OperationRecord; read: boolean } | { action: 'request-api-setup'; merchantId: string };
const auditLabels: Record<string, string> = { alert_read: 'تأكيد قراءة تنبيه', alert_unread: 'إعادة تنبيه إلى غير مقروء', api_setup_requested: 'تسجيل طلب إعداد API فقط' };

export default function OperationsCenter({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [tab, setTab] = useState<'failures_dashboard' | 'assistant' | 'monitoring'>('failures_dashboard');
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [state, setState] = useState<OperationsState | null>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [unread, setUnread] = useState(false);
  const [filters, setFilters] = useState({ query: '', kind: '', merchantId: '', unread: false });
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [setupTenant, setSetupTenant] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [approved, setApproved] = useState(false);
  const requestSequence = useRef(0);
  const reviewHeading = useRef<HTMLHeadingElement>(null);

  const refresh = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, unread: String(filters.unread), offset: String(offset) });
      const result = await api<OperationsState>(`operations?${params}`);
      if (sequence !== requestSequence.current) return;
      setState(result); setError(''); setUpdatedAt(new Date().toISOString());
    } catch (caught) {
      if (sequence !== requestSequence.current) return;
      setState(null); setError(caught instanceof Error ? caught.message : 'تعذر تحميل المراقبة.');
    } finally { if (sequence === requestSequence.current) setLoading(false); }
  }, [filters, offset]);

  useEffect(() => {
    if (tab !== 'monitoring') return;
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 30000);
    return () => { window.clearInterval(timer); requestSequence.current += 1; };
  }, [refresh, tab]);
  useEffect(() => { if (review) reviewHeading.current?.focus(); }, [review]);

  function search(event: FormEvent) {
    event.preventDefault(); setOffset(0); setFilters({ query, kind, merchantId, unread });
  }

  function propose(next: Review) { setApproved(false); setNotice(''); setReview(next); }

  async function confirm() {
    if (!review || !approved || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const body = review.action === 'set-read'
        ? { action: review.action, id: review.record.id, read: review.read, confirmation: true }
        : { action: review.action, merchantId: review.merchantId, confirmation: true };
      await api('operations', body);
      setNotice(review.action === 'set-read' ? 'تم حفظ حالة التنبيه لحسابك وتسجيل التأكيد.' : 'سُجّل طلب الإعداد فقط. لم يُربط أي API ولم تُحفظ أسرار.');
      setReview(null); setApproved(false); await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر حفظ الإجراء.'); }
    finally { setBusy(false); }
  }

  return <div className="operations-center" dir="rtl">
    {tab === 'monitoring' && <section className="panel operations-heading">
      <div className="operations-symbol"><ShieldCheck size={30} aria-hidden="true" /></div>
      <div><span className="eyebrow">ONESHOT / OPERATIONS CENTER</span><h2>رؤية تشغيلية. صلاحيات محسوبة.</h2><p>بيانات فعلية دون أسماء أو بريد أو مفاتيح. المراقبة لا تعتمد على تشغيل الذكاء الاصطناعي.</p></div>
      <span className="operations-preview">DEPLOY PREVIEW ONLY</span>
    </section>}
    <div className="operations-tabs" aria-label="أقسام مركز العمليات">
      <button type="button" aria-pressed={tab === 'failures_dashboard'} onClick={() => setTab('failures_dashboard')}>
        <BarChart3 size={17} />لوحة تحليل حالات الرفض (Failures AI)
      </button>
      <button type="button" aria-pressed={tab === 'assistant'} onClick={() => setTab('assistant')}>
        <Sparkles size={17} />مساعد onshot (Chat)
      </button>
      <button type="button" aria-pressed={tab === 'monitoring'} onClick={() => setTab('monitoring')}>
        <Bell size={17} />السجلات والتنبيهات{state && <span>{state.unread}</span>}
      </button>
    </div>
    {tab === 'monitoring' && error && <div className="alert" role="alert">{error}</div>}
    {tab === 'monitoring' && notice && <div className="success-message" role="status">{notice}</div>}
    {tab === 'failures_dashboard' ? (
      <PaymentFailuresDashboard
        onConsultAi={(prompt) => {
          setAssistantPrompt(prompt);
          setTab('assistant');
        }}
      />
    ) : tab === 'assistant' ? (
      <AdminAssistant onRefresh={onRefresh} initialPrompt={assistantPrompt} />
    ) : <>
      <section className="panel operations-monitor">
        <div className="operations-section-title"><div><span className="eyebrow">LIVE RECORDS / REDACTED</span><h2>سجل النشاط</h2></div><button type="button" className="outline-button" disabled={loading} onClick={() => void refresh()}><RefreshCw size={16} />تحديث</button></div>
        <p className="operations-caption">تسجيلات الحساب والدخول الناجح من أحداث Netlify Identity ووقت الدخول الذي يتحقق منه الخادم عند تحميل مساحة التاجر. لا يشمل الدخول الفاشل أو زوار الدفع دون حساب.</p>
        <form className="operations-filters" onSubmit={search}>
          <label>معرّف السجل / النوع / البوابة<input value={query} maxLength={100} placeholder="gateway_request أو معرّف" onChange={event => setQuery(event.target.value)} /></label>
          <label>نوع النشاط<select value={kind} onChange={event => setKind(event.target.value)}><option value="">جميع الأنواع</option>{operationKinds.map(value => <option key={value} value={value}>{operationLabels[value]}</option>)}</select></label>
          <label>نطاق التاجر<input value={merchantId} maxLength={36} placeholder="UUID — اتركه فارغاً لجميع التجار" onChange={event => setMerchantId(event.target.value)} /></label>
          <label className="operations-checkbox"><input type="checkbox" checked={unread} onChange={event => setUnread(event.target.checked)} />غير مقروء فقط</label>
          <button className="primary-button" type="submit" disabled={loading}><Search size={16} />بحث</button>
        </form>
        <div className="operations-live-meta"><span>{state ? `${state.unread} تنبيه غير مقروء في النطاق المحدد` : 'لا توجد بيانات مؤكدة حالياً'}</span><small>{updatedAt && `آخر تحديث ناجح: ${date(updatedAt)} · تحديث كل 30 ثانية`}</small></div>
        {loading && !state ? <div className="operations-skeleton" aria-label="تحميل السجلات" aria-busy="true"><span /><span /><span /></div> : state && !state.records.length ? <div className="operations-empty"><Bell size={24} /><h3>لا توجد سجلات تطابق البحث</h3><p>تظهر الأحداث بعد التسجيل أو الدخول أو تحميل مساحة التاجر في المعاينة. لا يوجد سجل كامل للدخول السابق ولم تُنشأ بيانات تجريبية.</p></div> : state && <ul className="operations-records">{state.records.map(record => <li key={record.id} className={record.read ? '' : 'operations-unread'}>
          <div className="operations-record-main"><span className="operations-read-indicator" aria-label={record.read ? 'مقروء' : 'غير مقروء'} /><div><strong>{operationLabels[record.kind]}</strong><small>{date(record.createdAt)}{record.provider ? ` · ${record.provider}` : ''}</small></div></div>
          <div className="operations-record-identifiers"><span>السجل <code dir="ltr">{record.subjectId}</code></span><span>التاجر <code dir="ltr">{record.merchantId ?? 'لا توجد مساحة تاجر مرتبطة'}</code></span></div>
          <button className="outline-button" type="button" disabled={busy} onClick={() => propose({ action: 'set-read', record, read: !record.read })}>{record.read ? 'مراجعة: غير مقروء' : 'مراجعة: مقروء'}</button>
        </li>)}</ul>}
        <div className="operations-pagination"><button type="button" className="outline-button" disabled={!offset || loading} onClick={() => setOffset(current => Math.max(0, current - 50))}>السابق</button><span>صفحة {Math.floor(offset / 50) + 1} · حتى 50 سجلاً</span><button type="button" className="outline-button" disabled={!state?.hasMore || offset >= 10000 || loading} onClick={() => setOffset(current => current + 50)}>التالي</button></div>
      </section>
      {review && <section className="panel operations-review" aria-labelledby="operations-review-heading">
        <span className="eyebrow">EXPLICIT REVIEW / NO AUTOMATIC ACTIONS</span><h2 id="operations-review-heading" ref={reviewHeading} tabIndex={-1}>مراجعة قبل الحفظ</h2>
        {review.action === 'set-read' ? <><p>تغيير حالة تنبيه «{operationLabels[review.record.kind]}» إلى <strong>{review.read ? 'مقروء' : 'غير مقروء'}</strong> لحسابك فقط.</p><code dir="ltr">{review.record.id}</code></> : <><p>تسجيل طلب إعداد API للتاجر التالي فقط، دون تفعيل اتصال أو استقبال بيانات اعتماد:</p><code dir="ltr">{review.merchantId}</code></>}
        <label className="operations-checkbox"><input type="checkbox" checked={approved} onChange={event => setApproved(event.target.checked)} />راجعت المعرّف والتغيير وأوافق على تسجيل الإجراء في التدقيق.</label>
        <div className="operations-review-buttons"><button className="primary-button" type="button" disabled={!approved || busy} onClick={() => void confirm()}><Check size={16} />تأكيد وحفظ</button><button className="outline-button" type="button" disabled={busy} onClick={() => { setReview(null); setApproved(false); }}><X size={16} />إلغاء دون تعديل</button></div>
      </section>}
      <section className="panel operations-providers"><div className="operations-section-title"><div><span className="eyebrow">PROVIDER AUTHORIZATION / REQUIRED</span><h2>حدود التكامل</h2></div><LockKeyhole size={23} /></div><p className="operations-caption">هذه الأدوات غير مفعّلة. وجود مفتاح وحده لا يفعّلها؛ يلزم مزوّد مفوّض ومحوّل آمن واختبارات قبل أي إجراء.</p>
        {state ? <div className="operations-provider-list">{state.providers.map(provider => <article key={provider.id}><div><h3>{provider.name}</h3><span className="status-badge status-pending">غير متاح · يتطلب إعداداً</span></div><p>{provider.reason}</p><details><summary>متطلبات التفعيل الآمن</summary><p>{provider.requirements}</p></details></article>)}</div> : <p>حالة التكامل غير متاحة من الخادم. لا توجد أدوات خارجية نشطة في هذه الواجهة.</p>}
        {state && <form className="operations-setup-form" onSubmit={event => { event.preventDefault(); if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(setupTenant.trim())) propose({ action: 'request-api-setup', merchantId: setupTenant.trim() }); else setError('أدخل معرّف UUID صالحاً للتاجر.'); }}><label>طلب إعداد API للعميل — معرّف التاجر فقط<input value={setupTenant} maxLength={36} onChange={event => setSetupTenant(event.target.value)} required placeholder="UUID فقط — لا تدخل أسراراً" /></label><button type="submit" className="outline-button" disabled={busy}>مراجعة طلب إعداد</button><small>يتحقق الخادم من وجود التاجر. الطلب ليس تفويضاً من العميل وليس اتصالاً فعّالاً.</small></form>}
      </section>
      <section className="panel operations-audit"><span className="eyebrow">YOUR CONFIRMED ACTIONS</span><h2>سجل تدقيق حسابك</h2>{state?.audit.length ? <ul>{state.audit.map(entry => <li key={entry.id}><div><strong>{auditLabels[entry.action] ?? entry.action}</strong><small>{date(entry.createdAt)}</small></div><code dir="ltr">{entry.eventId ?? entry.merchantId}</code></li>)}</ul> : <p className="operations-caption">تظهر آخر 30 عملية مؤكدة لحسابك؛ لا تُحفظ نصوص المحادثة أو بيانات الاعتماد.</p>}</section>
    </>}
  </div>;
}
