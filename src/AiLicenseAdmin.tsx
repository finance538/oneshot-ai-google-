// AiLicenseAdmin.tsx
// إدارة تراخيص الذكاء الاصطناعي — من الإدارة فقط: منح طبقة، منح المستوى الرابع X،
// ومنح/سحب كادر لكل مستخدم. كل ما هنا يُنفَّذ على السيرفر (`platform` action) ولا
// يعتمد على المتصفح: المنح يُخزَّن في قاعدة البيانات ويُقرأ في كل طلب.

import { useCallback, useEffect, useState } from 'react';
import { Check, Flame, KeyRound, RefreshCw, ShieldAlert, UserCheck, UserX } from 'lucide-react';
import { api, type Platform } from './platform';
import { staffRoster } from '../shared/staff-roster';
import './AiLicenseAdmin.css';

interface Entitlement { ownerId: string; tier: string; tierX: boolean; grantedBy: string | null; note: string | null; updatedAt: string }
interface StaffGrant { ownerId: string; staffId: string; grantedBy: string; createdAt: string }
interface AiAdminPayload { entitlements: Entitlement[]; staffGrants: StaffGrant[] }

const tierLabels: Record<string, string> = {
  'tier-1': 'المستوى الأول (سريع)',
  'tier-2': 'المستوى الثاني (مهني)',
  'tier-3': 'المستوى الثالث (استدلال عميق)',
};

export default function AiLicenseAdmin() {
  const [ownerId, setOwnerId] = useState('');
  const [tier, setTier] = useState('tier-2');
  const [tierX, setTierX] = useState(false);
  const [note, setNote] = useState('');
  const [staffId, setStaffId] = useState(staffRoster[0]?.id || 'customer_care');
  const [data, setData] = useState<AiAdminPayload>({ entitlements: [], staffGrants: [] });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await api<Platform>('platform');
      setData({ entitlements: result.aiAdmin?.entitlements || [], staffGrants: result.aiAdmin?.staffGrants || [] });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'تعذر تحميل التراخيص.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function run(body: Record<string, unknown>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      await api('platform', body);
      setNotice(success);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'تعذر تنفيذ الطلب.');
    } finally { setBusy(false); }
  }

  // معرّف المستخدم في Netlify Identity يبدأ بـ uuid أو hash؛ نقبل النص كما هو ونترك الخادم يرفض ما ليس صالحاً.
  const valid = ownerId.trim().length >= 6;

  return (
    <section className="ai-license-admin">
      <header className="ala-header">
        <div>
          <h3><KeyRound size={18} /> تراخيص طبقات الذكاء الاصطناعي والكوادر</h3>
          <p>الترخيص يُمنح لكل مستخدم على حدة. الطبقات الثلاث تُحسب بالاستخدام، والمستوى الرابع X لا يُعرض للبيع — يُمنح من هنا فقط.</p>
        </div>
        <button type="button" className="ala-refresh" onClick={() => void load()} disabled={busy}>
          <RefreshCw size={15} /> تحديث
        </button>
      </header>

      <div className="ala-form">
        <label>
          <span>معرّف المستخدم (Netlify Identity user id)</span>
          <input value={ownerId} onChange={event => setOwnerId(event.target.value)} dir="ltr" placeholder="مثال: 188d6e00-2cbb-4b52-ac90-b35a1b0d9d0b" />
        </label>
        <label>
          <span>الطبقة</span>
          <select value={tier} onChange={event => setTier(event.target.value)}>
            {Object.entries(tierLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="ala-checkbox">
          <input type="checkbox" checked={tierX} onChange={event => setTierX(event.target.checked)} />
          <span>منح المستوى الرابع X (Abliterated) — غير معروض للبيع</span>
        </label>
        <label>
          <span>ملاحظة (اختياري)</span>
          <input value={note} onChange={event => setNote(event.target.value)} placeholder="سبب المنحة" maxLength={200} />
        </label>

        <div className="ala-actions">
          <button
            type="button"
            className="ala-primary"
            disabled={!valid || busy}
            onClick={() => void run({ action: 'grant-tier', ownerId: ownerId.trim(), tier, tierX, ...(note ? { note } : {}) }, 'تم تحديث ترخيص الطبقة.')}
          >
            <Check size={15} /> منح/تحديث الطبقة
          </button>
          <button
            type="button"
            className="ala-danger"
            disabled={!valid || busy}
            onClick={() => void run({ action: 'grant-tier', ownerId: ownerId.trim(), tierX: true }, 'تم منح المستوى الرابع X.')}
          >
            <Flame size={15} /> منح Tier X
          </button>
          <button
            type="button"
            className="ala-plain"
            disabled={!valid || busy}
            onClick={() => void run({ action: 'grant-tier', ownerId: ownerId.trim(), tier, tierX: false }, 'تم سحب ترخيص X (بقيت الطبقة).')}
          >
            <ShieldAlert size={15} /> سحب Tier X
          </button>
        </div>

        <div className="ala-staff-row">
          <label>
            <span>ترخيص كادر</span>
            <select value={staffId} onChange={event => setStaffId(event.target.value)}>
              {staffRoster.map(member => <option key={member.id} value={member.id}>{member.name} — {member.arabicRole}</option>)}
            </select>
          </label>
          <button type="button" className="ala-plain" disabled={!valid || busy} onClick={() => void run({ action: 'grant-staff', ownerId: ownerId.trim(), staffId }, 'تم منح الكادر.')}>
            <UserCheck size={15} /> منح الكادر
          </button>
          <button type="button" className="ala-plain" disabled={!valid || busy} onClick={() => void run({ action: 'revoke-staff', ownerId: ownerId.trim(), staffId }, 'تم سحب الكادر.')}>
            <UserX size={15} /> سحب الكادر
          </button>
        </div>

        {notice && <p className="ala-notice">{notice}</p>}
        {error && <p className="ala-error">{error}</p>}
        <p className="ala-hint">خدمة العملاء والمرشد متاحان لكل حساب بدون ترخيص. البقية تحتاج منحاً من هنا.</p>
      </div>

      <div className="ala-tables">
        <div>
          <h4>تراخيص الطبقات ({data.entitlements.length})</h4>
          {data.entitlements.length ? (
            <table>
              <thead><tr><th>المستخدم</th><th>الطبقة</th><th>X</th><th>مُنحت بواسطة</th><th>التاريخ</th></tr></thead>
              <tbody>
                {data.entitlements.map(row => (
                  <tr key={row.ownerId}>
                    <td dir="ltr">{row.ownerId}</td>
                    <td>{tierLabels[row.tier] || row.tier}</td>
                    <td>{row.tierX ? 'نعم' : 'لا'}</td>
                    <td dir="ltr">{row.grantedBy || '—'}</td>
                    <td>{new Date(row.updatedAt).toLocaleDateString('ar-SA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="ala-empty">لا توجد منح بعد — كل الحسابات على الافتراضي (المستوى الأول).</p>}
        </div>

        <div>
          <h4>تراخيص الكوادر ({data.staffGrants.length})</h4>
          {data.staffGrants.length ? (
            <table>
              <thead><tr><th>المستخدم</th><th>الكادر</th><th>مُنح بواسطة</th></tr></thead>
              <tbody>
                {data.staffGrants.map(row => (
                  <tr key={`${row.ownerId}:${row.staffId}`}>
                    <td dir="ltr">{row.ownerId}</td>
                    <td>{staffRoster.find(member => member.id === row.staffId)?.name || row.staffId}</td>
                    <td dir="ltr">{row.grantedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="ala-empty">لا توجد تراخيص كوادر بعد.</p>}
        </div>
      </div>
    </section>
  );
}
