import { useState } from 'react';
import { MapPin, Sparkles, Check, ShieldCheck } from 'lucide-react';
import { api } from './platform';
import { useAppearance } from './i18n';

export type ContactFields = Partial<Record<'name' | 'email' | 'phone' | 'country' | 'street' | 'city' | 'state' | 'zip', string>>;

export default function CheckoutAssist({ id, kind, aiEnabled, onUse }: { id: string; kind: 'open' | 'payment'; aiEnabled: boolean; onUse: (fields: ContactFields) => void }) {
  const { t } = useAppearance();
  const [input, setInput] = useState('');
  const [consent, setConsent] = useState(false);
  const [fields, setFields] = useState<ContactFields | null>(null);
  const [location, setLocation] = useState<{ country: string; city: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const labels: Record<keyof ContactFields, string> = { name: 'الاسم', email: 'البريد الإلكتروني', phone: 'الهاتف', country: 'الدولة (رمز حرفين)', street: 'العنوان', city: 'المدينة', state: 'المنطقة', zip: 'الرمز البريدي' };

  async function extract() {
    setBusy(true); setError(''); setFields(null);
    try { const result = await api<{ fields: ContactFields }>('checkout-assist', { id, kind, text: input, consent }); setFields(result.fields); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.'); }
    finally { setBusy(false); }
  }

  async function suggestLocation() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/checkout-location', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const result = await response.json() as { country: string; city: string };
      if (!result.country) throw new Error();
      setLocation(result);
    } catch { setError('لا توجد بيانات موقع متاحة. أدخل عنوانك الحقيقي.'); }
    finally { setBusy(false); }
  }

  return <details className="checkout-assist"><summary><Sparkles size={17} />{t('تعبئة بياناتي')}</summary><div className="assist-body"><p className="helper-note">{t('الموقع تقريبي ولا يحدد هويتك أو عنوان الفوترة. BIN يحدد معلومات جهة إصدار البطاقة، لا اسمك أو إيميلك.')}</p>{aiEnabled && <><label>{t('ألصق بياناتك الحقيقية فقط: الاسم، البريد، الهاتف والعنوان. لا تدخل بيانات البطاقة.')}<textarea value={input} onChange={event => { setInput(event.target.value); setFields(null); }} maxLength={2000} rows={4} /></label><label className="consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /><span>{t('أوافق على إرسال هذا النص إلى خدمة AI لترتيبه، وأراجع النتائج قبل استخدامها.')}</span></label></>}<div className="assist-actions">{aiEnabled && <button type="button" className="outline-button" disabled={busy || !consent || !input.trim()} onClick={() => void extract()}><Sparkles size={15} />{t('استخراج بياناتي بالذكاء الاصطناعي')}</button>}<button type="button" className="outline-button" disabled={busy} onClick={() => void suggestLocation()}><MapPin size={15} />{t('اقتراح الموقع حسب IP')}</button></div>{busy && <p role="status">{t('جارٍ التنفيذ…')}</p>}{error && <p className="form-error" role="alert">{t(error)}</p>}{location && <div className="location-suggestion"><MapPin size={17} /><span>{location.country}{location.city ? ` · ${location.city}` : ''}</span><small>{t('راجع بياناتك قبل الدفع.')}</small></div>}{fields && <div className="assist-review"><p>{t('راجع بياناتك قبل الدفع.')}</p><dl>{Object.entries(fields).map(([key, value]) => <div key={key}><dt>{t(labels[key as keyof ContactFields])}</dt><dd dir="auto">{value}</dd></div>)}</dl><button type="button" className="primary-button" onClick={() => { onUse(fields); setFields(null); setInput(''); setConsent(false); }}><Check size={16} />{t('مراجعة واستخدام البيانات')}</button></div>}<small className="assist-privacy"><ShieldCheck size={14} />{t('لم يتم إرسال بيانات البطاقة إلى AI.')}</small></div></details>;
}
