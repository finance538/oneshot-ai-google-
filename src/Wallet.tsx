import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, LogOut, RefreshCw, ShieldCheck, ShoppingBag, User as UserIcon, WalletCards } from 'lucide-react';
import { logout } from '@netlify/identity';
import { api, date, money, paymentLink, statuses } from './platform';
import { AppearanceControls, Brand } from './Brand';
import { appearanceLink, useAppearance } from './i18n';
import { getServiceEligibility, isWalletEligibleSku, walletServices } from '../shared/services';
import { gatewayName } from '../shared/policy';
import {
  clearStoredReturnDestination,
  normalizePathname,
  persistReturnDestination,
  readStoredPendingSku,
} from './storefront/routes';
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
  pagination?: {
    entriesNextCursor?: string | null;
    ordersNextCursor?: string | null;
    topupsNextCursor?: string | null;
  };
}

interface WalletProps {
  standalone?: boolean;
  userEmail?: string;
  initialSku?: string | null;
  onSignOut?: () => void;
}

export default function Wallet({ standalone = false, userEmail, initialSku, onSignOut }: WalletProps = {}) {
  const { tr, locale, language } = useAppearance();
  const [data, setData] = useState<WalletData | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [gateway, setGateway] = useState('');
  const [amount, setAmount] = useState('');
  const [sku, setSku] = useState(() => {
    const urlSku = new URLSearchParams(window.location.search).get('sku')?.trim();
    if (urlSku) return urlSku;
    if (initialSku?.trim()) return initialSku.trim();
    return readStoredPendingSku() || '';
  });
  const topupRequest = useRef(crypto.randomUUID());
  const purchaseRequest = useRef(crypto.randomUUID());
  const selectable = walletServices;
  const selected = selectable.find(product => product.sku === sku);
  const requestedEligibility = sku ? getServiceEligibility(sku) : null;

  useEffect(() => {
    if (standalone) {
      document.title = tr(
        'محفظة العميل وشراء الخدمات | oneShot Brand Studio',
        'Customer Wallet & Service Checkout | oneShot Brand Studio',
      );
      clearStoredReturnDestination({ keepSku: true });
    }
  }, [standalone, language, tr]);

  useEffect(() => {
    if (!sku) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('sku') !== sku && normalizePathname(window.location.pathname) === '/wallet') {
      params.set('sku', sku);
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
    persistReturnDestination(null, sku);
    if (isWalletEligibleSku(sku)) {
      clearStoredReturnDestination({ keepSku: true });
    }
  }, [sku]);

  const load = useCallback(async () => {
    const result = await api<WalletData>('wallet');
    setData(result);
    setGateway(current => result.gateways.includes(current) ? current : result.gateways[0] || '');
  }, []);

  async function loadMore(section: 'entries' | 'orders' | 'topups', cursor: string) {
    setBusy(true);
    setError('');
    try {
      const qs = new URLSearchParams({ section, cursor });
      const result = await api<WalletData>(`wallet?${qs.toString()}`);
      setData(prev => {
        if (!prev) return result;
        return {
          ...prev,
          entries: section === 'entries' ? [...prev.entries, ...result.entries] : prev.entries,
          orders: section === 'orders' ? [...prev.orders, ...result.orders] : prev.orders,
          topups: section === 'topups' ? [...prev.topups, ...result.topups] : prev.topups,
          pagination: {
            ...prev.pagination,
            ...result.pagination,
          },
        };
      });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : tr('تعذر تحميل المزيد.', 'Unable to load more items.'));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function initialize() {
      try { if (active) await load(); }
      catch (problem) { if (active) setError(problem instanceof Error ? problem.message : tr('تعذر تحميل المحفظة.', 'Unable to load wallet.')); }
    }
    void initialize();
    return () => { active = false; };
  }, [load, tr]);

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await load(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : tr('تعذر إتمام العملية.', 'Unable to complete the operation.')); }
    finally { setBusy(false); }
  }

  async function topup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      if (sku) {
        persistReturnDestination(`/wallet?sku=${encodeURIComponent(sku)}`, sku);
      }
      const result = await api<{ documentId: string }>('wallet', { action: 'topup', amount, gateway, requestId: topupRequest.current });
      window.location.assign(paymentLink(result.documentId));
    });
  }

  async function purchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const result = await api<{ order: WalletOrder }>('wallet', { action: 'purchase', sku, requestId: purchaseRequest.current });
      clearStoredReturnDestination();
      setNotice(tr('تم دفع الخدمة من المحفظة. رقم الطلب: ', 'Service paid from wallet. Order: ') + result.order.id);
    });
  }

  const returned = new URLSearchParams(window.location.search).get('topup');
  const content = (
    <div className="wallet-space">
      {error && <div className="message error" role="alert">{error}</div>}
      {notice && <div className="message success" role="status">{notice}</div>}
      {sku && requestedEligibility && !requestedEligibility.walletEligible && (
        <div className="message error" role="status">
          {requestedEligibility.unavailable
            ? tr(
                `الرمز (${sku}) غير متاح للشراء المباشر حالياً (قيد الإنشاء والاختبار). يمكنك اختيار خدمة جاهزة بسعر ثابت أدناه أو التواصل مع الفريق.`,
                `SKU (${sku}) is currently unavailable for direct purchase (under creation and testing). Choose a ready-to-sell fixed-price service below or contact the team.`,
              )
            : tr(
                `الخدمة (${sku}) تتطلب تسعيراً مخصصاً وتأكيد النطاق قبل الدفع ولا تُخصم تلقائياً من المحفظة. اختر خدمة بسعر ثابت أو اطلب عرض سعر من الكتالوج.`,
                `Service (${sku}) requires a custom quotation and scope confirmation before payment. Choose a fixed-price service below or request a quote from the catalog.`,
              )}
        </div>
      )}
      <section className="wallet-balance panel">
        <div>
          <span className="eyebrow">ONESHOT / WALLET</span>
          <h1>{tr('رصيدك لخدمات ونشوت', 'Your oneShot service balance')}</h1>
          <p>{tr('اشحن مرة، وادفع مقابل الخدمات من مكان واحد.', 'Top up your balance and pay for services in one place.')}</p>
        </div>
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
      <section className="panel wallet-history"><h2>{tr('حركات المحفظة', 'Wallet activity')}</h2>{!data ? <p role="status">{tr('جارٍ تحميل الرصيد والحركات…', 'Loading balance and activity…')}</p> : !data.entries.length ? <p>{tr('محفظتك جاهزة. يظهر أول شحن أو شراء هنا.', 'Your wallet is ready. Your first top-up or purchase appears here.')}</p> : <><div className="table-scroll"><table><thead><tr><th>{tr('العملية', 'Activity')}</th><th>{tr('المبلغ', 'Amount')}</th><th>{tr('التاريخ', 'Date')}</th></tr></thead><tbody>{data.entries.map(entry => <tr key={entry.id}><td>{entry.description}</td><td className={entry.amount > 0 ? 'wallet-credit' : ''} dir="ltr">{entry.amount > 0 ? '+' : '−'}{money(Math.abs(entry.amount), locale)} SAR</td><td>{date(entry.createdAt, locale)}</td></tr>)}</tbody></table></div>{data.pagination?.entriesNextCursor && <button type="button" className="secondary-button wallet-load-more" disabled={busy} onClick={() => void loadMore('entries', data.pagination!.entriesNextCursor!)}>{tr('عرض المزيد من الحركات', 'Load more activity')}</button>}</>}</section>
      {!!data?.topups.length && <section className="panel wallet-history"><h2>{tr('عمليات الشحن', 'Top-ups')}</h2><div className="table-scroll"><table><thead><tr><th>{tr('البوابة', 'Gateway')}</th><th>{tr('المبلغ', 'Amount')}</th><th>{tr('الحالة', 'Status')}</th><th>{tr('متابعة', 'Continue')}</th></tr></thead><tbody>{data.topups.map(item => <tr key={item.id}><td>{gatewayName(item.gateway)}</td><td>{money(item.amount, locale)} SAR</td><td>{statuses[item.status] || item.status}</td><td>{item.status !== 'paid' && <><a href={paymentLink(item.id)}>{tr('إكمال الدفع', 'Continue payment')}</a><button className="icon-button" disabled={busy} aria-label={tr('التحقق من الشحن', 'Verify top-up')} onClick={() => void run(async () => { const result = await api<{ status: string }>('wallet', { action: 'verify', id: item.id }); setNotice(result.status === 'paid' ? tr('تم تأكيد الشحن.', 'Top-up confirmed.') : tr('لم يكتمل الدفع بعد.', 'Payment is not complete yet.')); })}><RefreshCw size={16} /></button></>}</td></tr>)}</tbody></table></div>{data.pagination?.topupsNextCursor && <button type="button" className="secondary-button wallet-load-more" disabled={busy} onClick={() => void loadMore('topups', data.pagination!.topupsNextCursor!)}>{tr('عرض المزيد من عمليات الشحن', 'Load more top-ups')}</button>}</section>}
      <section className="panel wallet-history"><h2>{tr('طلبات خدماتي', 'My service orders')}</h2>{!data?.orders.length ? <p>{tr('لا توجد طلبات مدفوعة من المحفظة بعد.', 'No wallet-paid orders yet.')}</p> : <>{data.orders.map(order => <div className="wallet-order" key={order.id}><div><strong>{order.title}</strong><small>{order.sku} · {order.id}</small></div><span>{money(order.amount, locale)} SAR · {order.status === 'fulfilled' ? tr('تم التنفيذ', 'Fulfilled') : tr('مدفوع — بانتظار التنفيذ', 'Paid — awaiting fulfillment')}</span></div>)}{data.pagination?.ordersNextCursor && <button type="button" className="secondary-button wallet-load-more" disabled={busy} onClick={() => void loadMore('orders', data.pagination!.ordersNextCursor!)}>{tr('عرض المزيد من الطلبات', 'Load more orders')}</button>}</>}</section>
      {data?.adminOrders && <section className="panel wallet-history"><h2>{tr('طلبات العملاء — المسؤول', 'Customer orders — administrator')}</h2>{!data.adminOrders.length ? <p>{tr('لا توجد طلبات عملاء بعد.', 'No customer orders yet.')}</p> : data.adminOrders.map(order => <div className="wallet-order" key={order.id}><div><strong>{order.title}</strong><small>{order.id} · {money(order.amount, locale)} SAR</small><small>{order.customerName} · <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></small></div>{order.status === 'fulfilled' ? <span>{tr('تم التنفيذ', 'Fulfilled')}</span> : <button className="secondary-button" disabled={busy} onClick={() => void run(async () => { await api('wallet', { action: 'fulfill', id: order.id }); })}>{tr('تأكيد تنفيذ الطلب', 'Mark fulfilled')}</button>}</div>)}</section>}
    </div>
  );

  if (!standalone) return content;

  return (
    <div className="wallet-standalone-shell" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="wallet-standalone-header">
        <Brand />
        <nav className="wallet-standalone-nav" aria-label={tr('روابط حساب العميل', 'Customer account navigation')}>
          <a href={appearanceLink('/products')} className="wallet-standalone-link">
            <ShoppingBag size={16} />
            <span>{tr('كتالوج الخدمات', 'Services Catalog')}</span>
          </a>
          <a href={appearanceLink('/customer')} className="wallet-standalone-link">
            <UserIcon size={16} />
            <span>{userEmail || tr('حسابي', 'My Account')}</span>
          </a>
          <AppearanceControls />
          <button
            type="button"
            className="wallet-standalone-logout"
            onClick={() => {
              void logout().finally(() => {
                if (onSignOut) onSignOut();
                else window.location.assign(appearanceLink('/customer'));
              });
            }}
          >
            <LogOut size={16} />
            <span>{tr('خروج', 'Sign out')}</span>
          </button>
        </nav>
      </header>
      <main className="wallet-standalone-main">
        {content}
      </main>
    </div>
  );
}

