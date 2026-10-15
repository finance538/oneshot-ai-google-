import { useEffect, useRef, useState } from 'react';
import { ArrowUpLeft, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import { AppearanceControls, Brand } from './Brand';
import { api, methods, money, paymentLink } from './platform';
import { useAppearance } from './i18n';
import LoadingPanel from './LoadingPanel';

export interface PublicSitePay {
  merchantName: string;
  minimum: number;
  maximum: number;
  choices: string[];
  gateways: string[];
  enabled: boolean;
  adminConnected: boolean;
}

const gatewayNames: Record<string, string> = { paytabs: 'PayTabs', telr: 'Telr', ngenius: 'N-Genius KSA' };

export function sitePayLabel(choice: string, translate: (phrase: string) => string) {
  const [gateway, method] = choice.split(':');
  const known = methods.find(item => item.id === method);
  return `${gatewayNames[gateway] || gateway} · ${known ? translate(known.name) : method}`;
}

export default function SitePay() {
  const { t, tr, locale } = useAppearance();
  const [payment, setPayment] = useState<PublicSitePay | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [customerName, setName] = useState('');
  const [customerEmail, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [choice, setChoice] = useState('');
  const requestId = useRef(crypto.randomUUID());
  const processing = useRef(false);

  useEffect(() => {
    let mounted = true;
    void api<PublicSitePay>('site-pay').then(result => { if (mounted) { setPayment(result); setChoice(result.choices[0] || ''); } }).catch(caught => { if (mounted) setError(caught instanceof Error ? caught.message : 'تعذر تحميل الصفحة.'); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processing.current) return;
    processing.current = true; setBusy(true); setError('');
    try {
      const result = await api<{ id: string }>('site-pay', { requestId: requestId.current, customerName, customerEmail, amount, choice });
      window.location.assign(paymentLink(result.id));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.'); processing.current = false; setBusy(false); }
  }

  const available = payment?.enabled && !!payment.choices.length;
  const blocked = !loading && !!payment && !available;
  return <div className="checkout-page">
    <header className="checkout-header"><Brand /><AppearanceControls /></header>
    <main className="checkout-layout">
      <section className="checkout-summary">
        <span className="eyebrow">{tr('صفحة دفع oneShot', 'ONESHOT CHECKOUT')}</span>
        <h1>{payment?.merchantName || t('الدفع عبر oneShot')}</h1>
        <p>{t('ادفع مباشرة عبر بوابات الدفع المعتمدة، بلا وسيط.')}</p>
        <div className="checkout-art" aria-hidden="true"><img src="/oneshot.svg" alt="" /><CreditCard size={35} /></div>
        <div className="checkout-assurance"><ShieldCheck size={23} /><div><strong>{t('صفحة دفع آمنة')}</strong><p>{t('المبالغ مؤكدة من بوابة الدفع، وليست من عودة المتصفح.')}</p></div></div>
        <a className="text-button" href="https://1shotcam.com/">{t('العودة إلى oneShot')}<ArrowUpLeft size={16} /></a>
      </section>
      <section className="checkout-card">
        {loading ? <LoadingPanel /> : payment && <>
          <div className="checkout-card-heading"><div><span className="eyebrow">{t('صفحة الدفع العامة')}</span><h2>{payment.merchantName}</h2></div><CreditCard size={23} /></div>
          {available
            ? <><div className="open-amount-range"><span>{t('الحد الأدنى')} <strong>{money(payment.minimum, locale)} SAR</strong></span><span>{t('الحد الأعلى')} <strong>{money(payment.maximum, locale)} SAR</strong></span></div>
              <form onSubmit={event => void submit(event)}>
                <label>{t('اسم العميل')}<input value={customerName} onChange={event => setName(event.target.value)} autoComplete="name" required maxLength={100} /></label>
                <label>{t('بريد العميل')}<input type="email" value={customerEmail} onChange={event => setEmail(event.target.value)} autoComplete="email" required maxLength={254} dir="ltr" /></label>
                <label>{t('المبلغ بالريال السعودي')}<input type="number" value={amount} onChange={event => setAmount(event.target.value)} min={payment.minimum / 100} max={payment.maximum / 100} step="0.01" required dir="ltr" placeholder="0.00" /></label>
                <label>{t('طريقة الدفع')}<select value={choice} onChange={event => setChoice(event.target.value)} required>{payment.choices.map(value => <option key={value} value={value}>{sitePayLabel(value, t)}</option>)}</select></label>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="primary-button" type="submit" disabled={busy}>{busy ? t('جارٍ التنفيذ…') : t('متابعة إلى الدفع')}<LockKeyhole size={18} /></button>
              </form>
              <p className="fine-print">{t('تُنشأ صفحة الفاتورة على oneShot، والدفع يتم على بوابة الدفع الرسمية.')}</p></>
            : <div className="empty-state" role="status">
                <span className="eyebrow">{t('الصفحة غير مهيأة')}</span>
                <h3>{payment.adminConnected ? t('بوابات الدفع بلا طريقة متاحة') : t('لا توجد بوابة دفع مفعّلة بعد')}</h3>
                <p>{payment.adminConnected ? t('البوابات مربوطة، لكن لا توجد طريقة دفع مسموحة حالياً من إعدادات المنصة.') : t('لا يصدر رابط دفع حقيقي قبل ربط بوابة واحدة على الأقل (PayTabs أو Telr) من لوحة تحكم المشرف.')}</p>
                {blocked && error && <p className="form-error" role="alert">{error}</p>}
              </div>}
        </>}
        {!loading && !payment && <div className="empty-state" role="alert"><span className="eyebrow">{t('تعذر التحميل')}</span><p>{error || t('تعذر تحميل الصفحة.')}</p></div>}
      </section>
    </main>
  </div>;
}
