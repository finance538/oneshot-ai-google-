import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react';
import { api, date, money, paymentLink, statuses } from './platform';
import { useAppearance } from './i18n';
import { walletServices } from '../shared/services';
import { gatewayName } from '../shared/policy';
import './Wallet.css';

interface WalletOrder {
  id: string;
  sku: string;
  title: string;
  amount: number;
  status: string;
  billingCycle: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
}
interface WalletData {
  wallet: { balance: number };
  gateways: string[];
  paymentsEnabled: boolean;
  entries: { id: string; amount: number; description: string; createdAt: string }[];
  topups: { id: string; amount: number; gateway: string; status: string; createdAt: string }[];
  orders: WalletOrder[];
  adminOrders?: WalletOrder[];
}

export default function Wallet() {
  const { tr, locale } = useAppearance();
  const [data, setData] = useState<WalletData | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [gateway, setGateway] = useState('');
  const [amount, setAmount] = useState('');
  const [sku, setSku] = useState(new URLSearchParams(window.location.search).get('sku') || '');
  const topupRequest = useRef(crypto.randomUUID());
  const purchaseRequest = useRef(crypto.randomUUID());
  const selectable = walletServices;
  const selected = selectable.find(product => product.sku === sku);

  const load = useCallback(async () => {
    const result = await api<WalletData>('wallet');
    setData(result);
    setGateway(current => result.gateways.includes(current) ? current : result.gateways[0] || '');
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try { if (active) await load(); }
      catch (problem) { if (active) setError(problem instanceof Error ? problem.message : 'تعذر تحميل المحفظة.'); }
    }
    void initialize();
    return () => { active = false; };
  }, [load]);

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await load(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : tr('تعذر إتمام العملية.', 'Unable to complete the operation.')); }
    finally { setBusy(false); }
  }

  async function topup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const result = await api<{ documentId: string }>('wallet', { action: 'topup', amount, gateway, requestId: topupRequest.current });
      window.location.assign(paymentLink(result.documentId));
    });
  }

  async function purchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const result = await api<{ order: WalletOrder }>('wallet', { action: 'purchase', sku, requestId: purchaseRequest.current });
      setNotice(tr('تم دفع الخدمة من المحفظة. رقم الطلب: ', 'Service paid from wallet. Order: ') + result.order.id);
    });
  }

  const returned = new URLSearchParams(window.location.search).get('topup');
  return <div className="wallet-space">
    {error && <div className="message error" role="alert">{error}</div>}
    {notice && <div className="message success" role="status">{notice}</div>}
    <section className="wallet-balance panel">
      <div><span className="eyebrow">ONESHOT / WALLET</span><h2>{tr('رصيدك لخدمات ونشوت', 'Your oneShot service balance')}</h2><p>{tr('اشحن مرة، وادفع مقابل الخدمات من مكان واحد.', 'Top up your balance and pay for services in one place.')}</p></div>
      <div className="wallet-total"><WalletCards size={27} /><strong>{data ? money(data.wallet.balance, locale) : '—'}</strong><span>SAR</span></div>
      <button className="icon-button" aria-label={tr('تحديث المحفظة', 'Refresh wallet')} disabled={busy} onClick={() => void run(load)}><RefreshCw size={19} /></button>
    </section>
    {returned && <div className="panel wallet-return"><p>{tr('عودة المتصفح لا تعني اكتمال الشحن. تحقق من البوابة لتحديث رصيدك.', 'Returning here does not confirm payment. Verify with the gateway to update your balance.')}</p><button className="secondary-button" disabled={busy} onClick={() => void run(async () => { const result = await api<{ status: string }>('wallet', { action: 'verify', id: returned }); setNotice(result.status === 'paid' ? tr('تم تأكيد الشحن.', 'Top-up confirmed.') : tr('لم يكتمل الدفع بعد.', 'Payment is not complete yet.')); })}>{tr('تحقق من الشحن', 'Verify top-up')}</button></div>}
    <div className="wallet-actions">
      <section className="panel wallet-form"><span className="eyebrow">01 / TOP UP</span><h2>{tr('شحن المحفظة', 'Top up wallet')}</h2><p>{tr('وسائل الدفع العامة هي البوابات المربوطة بحساب مسؤول الموقع.', 'Site-wide payment methods use the gateways connected to the site administrator.')}</p>
        <form onSubmit={topup}><label>{tr('المبلغ بالريال', 'Amount in SAR')}<input type="number" min="1" max="10000" step="0.01" required value={amount} onChange={event => { setAmount(event.target.value); topupRequest.current = crypto.randomUUID(); }} /></label><label>{tr('بوابة الدفع', 'Payment gateway')}<select value={gateway} required onChange={event => { setGateway(event.target.value); topupRequest.current = crypto.randomUUID(); }}><option value="" disabled>{tr('اختر بوابة', 'Select a gateway')}</option>{data?.gateways.map(provider => <option key={provider} value={provider}>{gatewayName(provider)}</option>)}</select></label>
        <button className="primary-button" disabled={busy || !data?.gateways.length}>{tr('متابعة الدفع الآمن', 'Continue to secure payment')}<ArrowUpRight size={17} /></button></form>
        {data && !data.gateways.length && <p role="status">{tr('لا توجد بوابة مفعّلة حالياً. يُظهر ربط بوابة المسؤول وتفعيلها هنا تلقائياً.', 'No gateway is available. Connected, enabled administrator gateways appear here automatically.')}</p>}
        <small className="wallet-security"><ShieldCheck size={16} />{tr('لا يضاف الرصيد إلا بعد تأكيد الدفع من الخادم.', 'Balance is credited only after server-side payment verification.')}</small>
      </section>
      <section className="panel wallet-form"><span className="eyebrow">02 / SERVICES</span><h2>{tr('ادفع من رصيدك', 'Pay from your balance')}</h2><p>{tr('اختر خدمة جاهزة بسعر ثابت. الخدمات المخصصة تتطلب تأكيداً من الفريق.', 'Choose a ready-to-sell fixed-price service. Custom services require team confirmation.')}</p>
        <form onSubmit={purchase}><label>{tr('خدمة ونشوت', 'oneShot service')}<select value={selected ? sku : ''} required onChange={event => { setSku(event.target.value); purchaseRequest.current = crypto.randomUUID(); }}><option value="" disabled>{tr('اختر الخدمة', 'Select a service')}</option>{selectable.map(product => <option key={product.sku} value={product.sku}>{product.sku} · {tr(product.nameAr, product.nameEn)}</option>)}</select></label>
        {selected && <div className="wallet-service-price"><strong>{money(Math.round(selected.amount * 100), locale)} SAR</strong><p>{selected.billingCycle === 'monthly' ? tr('دفعة لشهر واحد فقط؛ لا يوجد تجديد تلقائي أو خصم متكرر.', 'One month only; no automatic renewal or recurring debit.') : tr('دفعة واحدة للخدمة المحددة.', 'One payment for the selected service.')}</p><small>{tr('يتم تسجيل طلب مدفوع، ويتابع فريق ونشوت التنفيذ والتسليم.', 'A paid order is recorded; the oneShot team handles fulfillment and delivery.')}</small></div>}
        <button className="primary-button" disabled={busy || !selected || !data?.paymentsEnabled || data.wallet.balance < Math.round((selected?.amount || 0) * 100)}>{tr('تأكيد الشراء من المحفظة', 'Confirm wallet purchase')}</button></form>
        {selected && data && data.wallet.balance < Math.round(selected.amount * 100) && <p>{tr('رصيدك غير كافٍ لهذه الخدمة. اشحن المحفظة أولاً.', 'Insufficient balance for this service. Top up first.')}</p>}
      </section>
    </div>
    <section className="panel wallet-history"><h2>{tr('حركات المحفظة', 'Wallet activity')}</h2>{!data ? <p role="status">{tr('جارٍ تحميل الرصيد والحركات…', 'Loading balance and activity…')}</p> : !data.entries.length ? <p>{tr('محفظتك جاهزة. يظهر أول شحن أو شراء هنا.', 'Your wallet is ready. Your first top-up or purchase appears here.')}</p> : <div className="table-scroll"><table><thead><tr><th>{tr('العملية', 'Activity')}</th><th>{tr('المبلغ', 'Amount')}</th><th>{tr('التاريخ', 'Date')}</th></tr></thead><tbody>{data.entries.map(entry => <tr key={entry.id}><td>{entry.description}</td><td className={entry.amount > 0 ? 'wallet-credit' : ''} dir="ltr">{entry.amount > 0 ? '+' : '−'}{money(Math.abs(entry.amount), locale)} SAR</td><td>{date(entry.createdAt, locale)}</td></tr>)}</tbody></table></div>}</section>
    {!!data?.topups.length && <section className="panel wallet-history"><h2>{tr('عمليات الشحن', 'Top-ups')}</h2><div className="table-scroll"><table><thead><tr><th>{tr('البوابة', 'Gateway')}</th><th>{tr('المبلغ', 'Amount')}</th><th>{tr('الحالة', 'Status')}</th><th>{tr('متابعة', 'Continue')}</th></tr></thead><tbody>{data.topups.map(item => <tr key={item.id}><td>{gatewayName(item.gateway)}</td><td>{money(item.amount, locale)} SAR</td><td>{statuses[item.status] || item.status}</td><td>{item.status !== 'paid' && <><a href={paymentLink(item.id)}>{tr('إكمال الدفع', 'Continue payment')}</a><button className="icon-button" disabled={busy} aria-label={tr('التحقق من الشحن', 'Verify top-up')} onClick={() => void run(async () => { const result = await api<{ status: string }>('wallet', { action: 'verify', id: item.id }); setNotice(result.status === 'paid' ? tr('تم تأكيد الشحن.', 'Top-up confirmed.') : tr('لم يكتمل الدفع بعد.', 'Payment is not complete yet.')); })}><RefreshCw size={16} /></button></>}</td></tr>)}</tbody></table></div></section>}
    <section className="panel wallet-history"><h2>{tr('طلبات خدماتي', 'My service orders')}</h2>{!data?.orders.length ? <p>{tr('لا توجد طلبات مدفوعة من المحفظة بعد.', 'No wallet-paid orders yet.')}</p> : data.orders.map(order => <div className="wallet-order" key={order.id}><div><strong>{order.title}</strong><small>{order.id}</small></div><span>{money(order.amount, locale)} SAR · {order.status === 'fulfilled' ? tr('تم التنفيذ', 'Fulfilled') : tr('مدفوع — بانتظار التنفيذ', 'Paid — awaiting fulfillment')}</span></div>)}</section>
    {data?.adminOrders && <section className="panel wallet-history"><h2>{tr('طلبات العملاء — المسؤول', 'Customer orders — administrator')}</h2>{!data.adminOrders.length ? <p>{tr('لا توجد طلبات عملاء بعد.', 'No customer orders yet.')}</p> : data.adminOrders.map(order => <div className="wallet-order" key={order.id}><div><strong>{order.title}</strong><small>{order.id} · {money(order.amount, locale)} SAR</small><small>{order.customerName} · <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></small></div>{order.status === 'fulfilled' ? <span>{tr('تم التنفيذ', 'Fulfilled')}</span> : <button className="secondary-button" disabled={busy} onClick={() => void run(async () => { await api('wallet', { action: 'fulfill', id: order.id }); })}>{tr('تأكيد تنفيذ الطلب', 'Mark fulfilled')}</button>}</div>)}</section>}
  </div>;
}
