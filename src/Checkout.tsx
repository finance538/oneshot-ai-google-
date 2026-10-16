import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpLeft, Check, CreditCard, LockKeyhole, RefreshCw, ShieldCheck, X, Download } from 'lucide-react';
import { api, date, methods, money, statuses, type PublicPayment } from './platform';
import { AppearanceControls, Brand } from './Brand';
import { useAppearance } from './i18n';
import LoadingPanel from './LoadingPanel';
import CheckoutAssist, { type ContactFields } from './CheckoutAssist';

interface Paylib {
  inlineForm(options: { key: string; form: HTMLFormElement; autoSubmit: boolean; beforeSubmit: () => boolean; callback: (response: { error?: boolean; token?: string }) => void }): void;
  resetForm(): void;
}
declare global { interface Window { paylib?: Paylib } }

function billingData(form: HTMLFormElement) {
  const data = new FormData(form);
  return { phone: data.get('billingPhone'), country: data.get('billingCountry'), street: data.get('billingStreet'), city: data.get('billingCity'), state: data.get('billingState'), zip: data.get('billingZip') };
}

export default function Checkout({ id }: { id: string }) {
  const { t, language, locale } = useAppearance();
  const [payment, setPayment] = useState<PublicPayment | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState(false);
  const [iframe, setIframe] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const processing = useRef(false);
  const load = useCallback(async () => {
    try { setPayment(await api<PublicPayment>(`checkout?id=${id}`)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const submit = useCallback(async (extra: Record<string, unknown> = {}) => {
    if (processing.current) return;
    processing.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const result = await api<{ url?: string; status?: string }>(`checkout?id=${id}`, { consent, language, ...extra });
      if (result.url) {
        if (payment?.document.method === 'framed') setIframe(result.url);
        else window.location.assign(result.url);
      } else { setMessage(result.status === 'paid' ? 'تم تأكيد الدفع بنجاح.' : 'الدفع قيد التأكيد. لا تكرر العملية.'); await load(); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.'); }
    finally {
      formRef.current?.reset();
      formRef.current?.querySelectorAll('input[name="token"]').forEach(element => element.remove());
      formRef.current?.querySelector('#register-container')?.remove();
      setBusy(false); processing.current = false;
    }
  }, [id, consent, language, payment?.document.method, load]);

  useEffect(() => {
    if (payment?.document.method !== 'managed' || !payment.available || payment.document.status !== 'pending') return;
    let cancelled = false;
    let script: HTMLScriptElement | undefined;
    const form = formRef.current;
    const originalSubmit = form?.submit;
    async function configure() {
      try {
        const config = await api<{ clientKey: string; scriptUrl: string }>(`managed-config?id=${id}`);
        if (cancelled) return;
        script = window.document.createElement('script'); script.src = config.scriptUrl; script.async = true;
        await new Promise<void>((resolve, reject) => { script!.onload = () => resolve(); script!.onerror = () => reject(new Error()); window.document.head.appendChild(script!); });
        if (cancelled || !form || !window.paylib) return;
        form.submit = () => {
          const token = new FormData(form).get('token');
          if (typeof token !== 'string' || !token) { setError('تعذر إتمام الطلب.'); setBusy(false); return; }
          void submit({ paymentToken: token, billing: billingData(form) });
        };
        window.paylib.inlineForm({ key: config.clientKey, form, autoSubmit: true, beforeSubmit: () => { if (processing.current) return false; setError(''); setBusy(true); return true; }, callback: response => { if (response.error) { setBusy(false); setError('تعذر إتمام الطلب.'); } } });
        setReady(true);
      } catch { if (!cancelled) { setReady(false); setError('طريقة الدفع غير مهيأة لهذا التاجر.'); } }
    }
    void configure();
    return () => { cancelled = true; setReady(false); window.paylib?.resetForm(); if (form && originalSubmit) form.submit = originalSubmit; script?.remove(); };
  }, [id, payment?.available, payment?.document.method, payment?.document.status, submit]);

  const verify = useCallback(async () => {
    setBusy(true); setError('');
    try { const result = await api<{ status: string }>(`checkout?id=${id}`, { action: 'verify' }); setMessage(result.status === 'paid' ? 'تم تأكيد الدفع بنجاح.' : 'الدفع قيد التأكيد. لا تكرر العملية.'); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.'); }
    finally { setBusy(false); }
  }, [id, load]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get('returned') === '1') { setMessage('العودة من البوابة ليست تأكيداً للدفع.'); void verify(); } }, [verify]);

  function cardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (payment?.document.method === 'managed') return;
    const data = new FormData(event.currentTarget);
    void submit({ card: { pan: data.get('pan'), cvv: data.get('cvv'), month: data.get('month'), year: data.get('year') }, billing: billingData(event.currentTarget) });
  }

  function useDetails(fields: ContactFields) {
    const mapping: Partial<Record<keyof ContactFields, string>> = { phone: 'billingPhone', country: 'billingCountry', street: 'billingStreet', city: 'billingCity', state: 'billingState', zip: 'billingZip' };
    for (const [field, name] of Object.entries(mapping)) {
      const input = formRef.current?.elements.namedItem(name);
      if (input instanceof HTMLInputElement && fields[field as keyof ContactFields]) input.value = fields[field as keyof ContactFields]!;
    }
  }

  const document = payment?.document;
  const expired = document ? new Date(document.expiresAt).getTime() < Date.now() : false;
  const closed = document?.status === 'paid' || document?.status === 'cancelled' || expired;
  const cardForm = document?.method === 'managed' || document?.method === 'own';
  const billingFields = [{ name: 'billingPhone', label: 'الهاتف', autocomplete: 'billing tel', limit: 25 }, { name: 'billingCountry', label: 'الدولة (رمز حرفين)', autocomplete: 'billing country', limit: 2 }, { name: 'billingStreet', label: 'العنوان', autocomplete: 'billing street-address', limit: 150 }, { name: 'billingCity', label: 'المدينة', autocomplete: 'billing address-level2', limit: 100 }, { name: 'billingState', label: 'المنطقة', autocomplete: 'billing address-level1', limit: 100 }, { name: 'billingZip', label: 'الرمز البريدي', autocomplete: 'billing postal-code', limit: 15 }];

  return <div className="checkout-page"><header className="checkout-header"><Brand /><AppearanceControls /></header><main className="checkout-layout"><section className="checkout-summary"><div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255, 85, 0, 0.1)', border: '1px solid rgba(255, 85, 0, 0.3)', borderRadius: '20px', width: 'fit-content', marginBottom: '8px' }}><img src="/oneshot.svg" alt="" width="18" height="18" /><strong style={{ fontSize: '0.85rem', color: '#ff5500' }}>OneShot Pay · ون شوت باي</strong></div><span className="eyebrow">{t('من طلب إلى دفعة')}</span><h1>{document?.merchantName || t('صفحة دفع آمنة')}</h1><p>{t('من علامتك إلى دفعتك.')}</p><div className="checkout-art" aria-hidden="true"><img src="/oneshot.svg" alt="" /><CreditCard size={36} /></div><div className="checkout-assurance"><ShieldCheck size={23} /><div><strong>{t('صفحة دفع آمنة')}</strong><p>{t('المبالغ مؤكدة من بوابة الدفع، وليست من عودة المتصفح.')}</p></div></div><div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}><a href="/oneshot-app.apk" download="oneshot-pay.apk" className="outline-button" style={{ fontSize: '0.8rem', padding: '6px 12px' }}><Download size={14} /><span>{t('تحميل تطبيق OneShot Pay (APK)')}</span></a><small dir="ltr">POWERED BY {document?.gateway === 'telr' ? 'TELR' : 'PAYTABS'} · ONESHOT PAY</small></div></section><section className="checkout-card">{loading ? <LoadingPanel /> : document && <><div className="checkout-card-heading"><div><span className="eyebrow">{t(methods.find(method => method.id === document.method)?.name || '')}</span><h2>{document.title}</h2></div><span className={`status-badge status-${document.status}`}><span />{t(statuses[document.status] || document.status)}</span></div><div className="checkout-amount">{money(document.amount, locale)}<span>SAR</span></div><div className="checkout-details"><span>{t('المستفيد')}</span><strong>{document.merchantName}</strong><span>{t('صلاحية الرابط')}</span><strong>{date(document.expiresAt, locale)}</strong>{document.method === 'recurring' && <><span>{t('التجديد التلقائي')}</span><strong>{t(document.interval === 'yearly' ? 'سنوي' : 'شهري')}</strong></>}</div>{document.status === 'paid' && <div className="paid-confirmation"><Check size={30} /><strong>{t('تم تأكيد الدفع بنجاح.')}</strong></div>}{closed && document.status !== 'paid' && <div className="message error">{t('هذا الرابط مكتمل أو ملغى أو منتهي الصلاحية.')}</div>}{!payment.available && !closed && <div className="message error">{t('طريقة الدفع غير مهيأة لهذا التاجر.')}</div>}
      {!closed && payment.available && <>{document.method === 'recurring' && <label className="consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /><span>{t('أوافق على التجديد التلقائي بالمبلغ المعروض وبالدورية المحددة. الإلغاء يوقف الدفعات المستقبلية ولا يسترد دفعة بدأت بالفعل.')}</span></label>}{cardForm ? <><CheckoutAssist id={id} kind="payment" aiEnabled={!!payment.aiEnabled} onUse={useDetails} /><form ref={formRef} onSubmit={cardSubmit} className="card-entry-form"><label>{t('رقم البطاقة')}<input {...(document.method === 'managed' ? { 'data-paylib': 'number' } : { name: 'pan' })} inputMode="numeric" required maxLength={23} dir="ltr" autoComplete="cc-number" placeholder="•••• •••• •••• ••••" /></label><div className="form-row card-expiry"><label>{t('الشهر')}<input {...(document.method === 'managed' ? { 'data-paylib': 'expmonth' } : { name: 'month' })} inputMode="numeric" required pattern="[0-9]{1,2}" maxLength={2} dir="ltr" placeholder="MM" autoComplete="cc-exp-month" /></label><label>{t('السنة')}<input {...(document.method === 'managed' ? { 'data-paylib': 'expyear' } : { name: 'year' })} inputMode="numeric" required pattern="[0-9]{4}" maxLength={4} dir="ltr" placeholder="YYYY" autoComplete="cc-exp-year" /></label><label>{t('رمز الأمان')}<input {...(document.method === 'managed' ? { 'data-paylib': 'cvv' } : { name: 'cvv' })} type="password" inputMode="numeric" required pattern="[0-9]{3,4}" maxLength={4} dir="ltr" autoComplete="cc-csc" /></label></div><h3>{t('عنوان الفوترة الحقيقي')}</h3><div className="billing-grid">{billingFields.map(field => <label key={field.name}>{t(field.label)}<input name={field.name} autoComplete={field.autocomplete} maxLength={field.limit} required dir="auto" /></label>)}</div><button className="primary-button checkout-pay" disabled={busy || (document.method === 'managed' && !ready)}>{t(busy ? 'جارٍ التنفيذ…' : 'ادفع الآن')}<ArrowUpLeft size={18} /></button></form></> : <button className="primary-button checkout-pay" disabled={busy || (document.method === 'recurring' && !consent)} onClick={() => void submit()}>{t(busy ? 'جارٍ التنفيذ…' : 'ادفع الآن')}<ArrowUpLeft size={18} /></button>}</>}
      <div className="checkout-secondary"><button className="text-button" disabled={busy} onClick={() => void verify()}><RefreshCw size={15} />{t('التحقق من حالة الدفع')}</button><button className="text-button" onClick={() => window.print()}>{t('طباعة')}</button></div>
    </>}{error && <p className="message error" role="alert">{t(error)}</p>}{message && <p className="message success" role="status">{t(message)}</p>}<div className="checkout-security"><LockKeyhole size={15} /><span>{t('صفحة دفع آمنة')}</span></div></section></main><footer className="checkout-footer">oneShot / PAYMENT STUDIO</footer>{iframe && <div className="iframe-overlay"><div className="iframe-toolbar"><ShieldCheck size={18} /><strong>{t('صفحة دفع آمنة')}</strong><a href={iframe} target="_blank" rel="noreferrer">{t('فتح الدفع في صفحة مستقلة')}</a><button className="icon-button" aria-label={t('إغلاق')} onClick={() => { setIframe(null); void verify(); }}><X size={22} /></button></div><iframe src={iframe} title={t('صفحة دفع آمنة')} allow="payment" /></div>}</div>;
}
