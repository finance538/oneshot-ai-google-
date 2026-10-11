import { useEffect, useRef, useState } from 'react';
import { ArrowUpLeft, Link2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { AppearanceControls, Brand } from './Brand';
import { api, methods, money, paymentLink, type PublicOpenLink } from './platform';
import { useAppearance } from './i18n';
import LoadingPanel from './LoadingPanel';
import CheckoutAssist, { type ContactFields } from './CheckoutAssist';

export default function OpenCheckout({ id }: { id: string }) {
  const { t, tr, locale } = useAppearance();
  const [payment, setPayment] = useState<PublicOpenLink | null>(null);
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
    void api<PublicOpenLink>(`open-checkout?id=${id}`).then(result => { if (mounted) { setPayment(result); setChoice(result.choices[0] || ''); } }).catch(caught => { if (mounted) setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.'); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processing.current) return;
    processing.current = true; setBusy(true); setError('');
    try {
      const result = await api<{ id: string }>(`open-checkout?id=${id}`, { requestId: requestId.current, customerName, customerEmail, amount, choice });
      window.location.assign(paymentLink(result.id));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.'); processing.current = false; setBusy(false); }
  }

  function useDetails(fields: ContactFields) { if (fields.name) setName(fields.name); if (fields.email) setEmail(fields.email); }
  const available = payment?.enabled && !!payment.choices.length;

  return <div className="checkout-page"><header className="checkout-header"><Brand /><AppearanceControls /></header><main className="checkout-layout"><section className="checkout-summary"><span className="eyebrow">{tr('رابط واحد. الخيار لك.', 'ONE LINK. YOUR CHOICE.')}</span><h1>{payment?.link.merchantName || t('رابط مفتوح')}</h1><p>{t('اختر المبلغ وطريقة الدفع')}</p><div className="checkout-art" aria-hidden="true"><img src="/oneshot.svg" alt="" /><Link2 size={35} /></div><div className="checkout-assurance"><ShieldCheck size={23} /><div><strong>{t('صفحة دفع آمنة')}</strong><p>{t('المبالغ مؤكدة من بوابة الدفع، وليست من عودة المتصفح.')}</p></div></div><a className="text-button" href="https://1shotcam.com/">{t('العودة إلى oneShot')}<ArrowUpLeft size={16} /></a></section><section className="checkout-card">{loading ? <LoadingPanel /> : payment && <><div className="checkout-card-heading"><div><span className="eyebrow">{t('رابط مفتوح')}</span><h2>{payment.link.title}</h2></div><Link2 size={23} /></div><div className="open-amount-range"><span>{t('الحد الأدنى')} <strong>{money(payment.link.minimum, locale)} SAR</strong></span><span>{t('الحد الأعلى')} <strong>{money(payment.link.maximum, locale)} SAR</strong></span></div>{available ? <><CheckoutAssist id={id} kind="open" aiEnabled={payment.aiEnabled} onUse={useDetails} /><form onSubmit={event => void submit(event)}><label>{t('اسم العميل')}<input value={customerName} onChange={event => setName(event.target.value)} autoComplete="name" required maxLength={100} /></label><label>{t('بريد العميل')}<input type="email" value={customerEmail} onChange={event => setEmail(event.target.value)} autoComplete="email" required maxLength={254} dir="ltr" /></label><label>{t('المبلغ بالريال السعودي')}<input type="number" value={amount} onChange={event => setAmount(event.target.value)} min={payment.link.minimum / 100} max={payment.link.maximum / 100} step="0.01" required dir="ltr" placeholder="0.00" /></label><label>{t('طريقة الدفع')}<select aria-label={t('طريقة الدفع')} value={choice} onChange={event => setChoice(event.target.value)} required>{payment.choices.map(value => { const [gateway, method] = value.split(':'); return <option key={value} value={value}>{gateway === 'telr' ? 'Telr' : 'PayTabs'} · {t(methods.find(item => item.id === method)?.name || method)}</option>; })}</select></label><button className="primary-button checkout-pay" disabled={busy || !choice}>{t(busy ? 'جارٍ التنفيذ…' : 'متابعة إلى الدفع')}<ArrowUpLeft size={18} /></button></form></> : <p className="message error">{t('طريقة الدفع غير مهيأة لهذا التاجر.')}</p>}</>}{error && <p className="message error" role="alert">{t(error)}</p>}<div className="checkout-security"><LockKeyhole size={16} /><span>{t('صفحة دفع آمنة')}</span></div></section></main><footer className="checkout-footer">oneShot / PAYMENT STUDIO</footer></div>;
}
