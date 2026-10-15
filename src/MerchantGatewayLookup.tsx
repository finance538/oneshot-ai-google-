import { useState, type FormEvent } from 'react';
import { api, openPaymentLink } from './platform';
import { useAppearance } from './i18n';
import { gatewayName, type Gateway } from '../shared/policy';

type Result = { merchant: { name: string; accountId: string }; gateways: Gateway[]; links: { id: string; title: string }[] };
export default function MerchantGatewayLookup() {
  const { tr } = useAppearance();
  const [lookup, setLookup] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function search(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null);
    try { setResult(await api<Result>('platform', { action: 'lookup-merchant-gateways', lookup: lookup.trim() })); }
    catch (caught) { setError(caught instanceof Error ? caught.message : tr('تعذر جلب البوابات.', 'Could not retrieve gateways.')); }
    finally { setBusy(false); }
  }
  return <section className="panel settings-panel">
    <h2>{tr('استرجاع بوابات التاجر', 'Retrieve merchant gateways')}</h2>
    <p>{tr('ابحث ببريد التاجر أو رقمه لعرض بواباته المتاحة وروابط الدفع المنشورة.', 'Find a merchant by email or account number to view available gateways and published payment links.')}</p>
    <form onSubmit={event => void search(event)}>
      <label>{tr('بريد التاجر أو رقم الحساب', 'Merchant email or account number')}<input dir="ltr" value={lookup} onChange={event => setLookup(event.target.value)} required maxLength={254} autoComplete="off" /></label>
      <button className="primary-button" disabled={busy}>{busy ? tr('جارٍ البحث…', 'Searching…') : tr('استرجاع البوابات', 'Retrieve gateways')}</button>
    </form>
    {error && <p role="alert" className="form-error">{error}</p>}
    {result && <div aria-live="polite"><h3>{result.merchant.name}</h3><p dir="ltr">{result.merchant.accountId}</p>
      <p>{result.gateways.length ? result.gateways.map(gatewayName).join(' · ') : tr('لا توجد بوابات مفعّلة حالياً.', 'No gateways are currently enabled.')}</p>
      {result.links.map(link => <p key={link.id}><a className="outline-button" href={openPaymentLink(link.id)} target="_blank" rel="noreferrer">{link.title}</a></p>)}
      {!result.links.length && <p>{tr('لم ينشر التاجر روابط دفع متاحة.', 'This merchant has no published payment links.')}</p>}
    </div>}
  </section>;
}
