import { useMemo, useState, type FormEvent } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  DollarSign,
  ExternalLink,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { walletServices } from '../shared/services';
import { useAppearance } from './i18n';
import { api, date, type MarketerAccount, type MarketerCampaign } from './platform';
import './MarketerDashboard.css';

export type MarketerTab = 'marketer_overview' | 'marketer_campaigns' | 'marketer_catalog' | 'marketer_creatives';

const channelLabels: Record<string, { ar: string; en: string }> = {
  social: { ar: 'منصات التواصل (X / سناب / إنستغرام)', en: 'Social Media (X / Snap / IG)' },
  google_ads: { ar: 'إعلانات جوجل (Google Ads)', en: 'Google Ads' },
  whatsapp: { ar: 'واتساب والمجموعات المباشرة', en: 'WhatsApp & Direct Groups' },
  content: { ar: 'صناعة المحتوى والمراجعات', en: 'Content & Reviews' },
  direct: { ar: 'توصية ومبيعات مباشرة', en: 'Direct B2B Referral' },
};

export function MarketerDashboard({
  marketerAccount,
  campaigns,
  activeTab,
  onNavigateTab,
  onRefresh,
}: {
  marketerAccount: MarketerAccount | null;
  campaigns: MarketerCampaign[];
  activeTab: MarketerTab;
  onNavigateTab: (tab: MarketerTab) => void;
  onRefresh: () => Promise<void>;
}) {
  const { tr, number } = useAppearance();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Campaign creation state
  const [campaignTitle, setCampaignTitle] = useState('');
  const [targetSku, setTargetSku] = useState('ALL');
  const [utmSlug, setUtmSlug] = useState('');
  const [channel, setChannel] = useState('social');

  // Catalog state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [estimatedMonthlySales, setEstimatedMonthlySales] = useState(5);

  // Profile state
  const [profileName, setProfileName] = useState(marketerAccount?.fullName || '');
  const [profileNotes, setProfileNotes] = useState(marketerAccount?.notes || '');

  const referralCode = marketerAccount?.referralCode || 'MKT-PENDING';
  const commissionRate = marketerAccount?.commissionRate ?? 10;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.1shotcam.com';
  const mainReferralLink = `${baseUrl}/?ref=${encodeURIComponent(referralCode)}`;

  async function copyText(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 2200);
    } catch {
      setError(tr('تعذر النسخ التلقائي. انسخ النص يدوياً.', 'Could not copy automatically. Please copy manually.'));
    }
  }

  async function handleCreateCampaign(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      await api('platform', {
        action: 'create-marketer-campaign',
        title: campaignTitle,
        targetProductSku: targetSku,
        utmCampaign: utmSlug,
        channel,
      });
      setCampaignTitle('');
      setUtmSlug('');
      setFeedback(tr('تم إنشاء رابط الحملة التسويقية بنجاح.', 'Marketing campaign link created successfully.'));
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('تعذر إنشاء الحملة.', 'Could not create campaign.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleCampaign(id: string, enabled: boolean) {
    setBusy(true);
    setError('');
    try {
      await api('platform', { action: 'toggle-marketer-campaign', id, enabled });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('تعذر تحديث الحملة.', 'Could not update campaign.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCampaign(id: string) {
    setBusy(true);
    setError('');
    try {
      await api('platform', { action: 'delete-marketer-campaign', id });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('تعذر حذف الحملة.', 'Could not delete campaign.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      await api('platform', {
        action: 'update-marketer-profile',
        fullName: profileName,
        notes: profileNotes,
      });
      setFeedback(tr('تم حفظ بيانات ملف المسوّق بنجاح.', 'Marketer profile updated successfully.'));
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('تعذر تحديث الملف.', 'Could not update profile.'));
    } finally {
      setBusy(false);
    }
  }

  const filteredServices = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return walletServices;
    return walletServices.filter(
      item =>
        item.sku.toLowerCase().includes(q) ||
        item.nameAr.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q),
    );
  }, [catalogSearch]);

  const averageServiceCommission = useMemo(() => {
    if (!walletServices.length) return 0;
    const avgPrice = walletServices.reduce((sum, item) => sum + item.amount, 0) / walletServices.length;
    return Math.round((avgPrice * commissionRate) / 100);
  }, [commissionRate]);

  // ===== بوابة انتظار اعتماد الإدارة للمسوّق الجديد أو المرفوض =====
  if (!marketerAccount || marketerAccount.status !== 'approved') {
    const isRejected = marketerAccount?.status === 'rejected';
    return (
      <section className="mkt-pending-gate">
        <div className="mkt-pending-header">
          <div className="mkt-pending-icon">
            {isRejected ? <XCircle size={28} /> : <Clock3 size={28} />}
          </div>
          <div>
            <span className={`status-badge ${isRejected ? 'status-failed' : 'status-pending'}`}>
              {isRejected
                ? tr('تم رفض أو تعليق الطلب', 'Application Rejected / Suspended')
                : tr('جارٍ تفعيل الحساب', 'Account activation pending')}
            </span>
            <h2 style={{ margin: '10px 0 6px' }}>
              {isRejected
                ? tr('طلب حساب المسوّق غير معتمد حالياً', 'Marketer Account Application Not Approved')
                : tr('حساب المسوّق الخاص بك قيد المراجعة من الإدارة', 'Your Marketer Account Is Awaiting Admin Approval')}
            </h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>
              {isRejected
                ? tr(
                    'تمت مراجعة طلبك لتفعيل حساب المسوّق ولم يتم اعتماده في الوقت الحالي. يمكنك التواصل مع فريق المنصة لمزيد من التفاصيل.',
                    'Your marketer account application was reviewed by the platform administrator and is currently not approved.',
                  )
                : tr(
                    'يُفعّل الحساب تلقائياً. حدّث حالة الحساب للمتابعة.',
                    'Accounts activate automatically. Refresh your account status to continue.',
                  )}
            </p>
          </div>
        </div>

        <div className="mkt-steps">
          <div className="mkt-step done">
            <strong>{tr('1. تسجيل حساب المسوّق', '1. Marketer Registration')}</strong>
            <small>{tr('تم استلام بياناتك بنجاح', 'Registration received')}</small>
          </div>
          <div className={`mkt-step ${isRejected ? '' : 'active'}`}>
            <strong>{tr('2. تفعيل تلقائي', '2. Automatic activation')}</strong>
            <small>
              {isRejected
                ? tr('لم يتم الاعتماد', 'Not approved')
                : tr('قيد المراجعة من مسؤول المنصة', 'Awaiting admin review')}
            </small>
          </div>
          <div className="mkt-step">
            <strong>{tr('3. تفعيل لوحة المسوّق', '3. Marketer Portal Unlock')}</strong>
            <small>{tr('إصدار روابط الإحالة والعمولات', 'Referral links & commissions')}</small>
          </div>
        </div>

        {marketerAccount && (
          <div className="list-card" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', width: '100%' }}>
              <div>
                <small style={{ color: 'rgba(255,255,255,0.55)' }}>{tr('اسم المسوّق', 'Marketer Name')}</small>
                <div><strong>{marketerAccount.fullName}</strong></div>
              </div>
              <div>
                <small style={{ color: 'rgba(255,255,255,0.55)' }}>{tr('البريد الإلكتروني', 'Email')}</small>
                <div><code dir="ltr">{marketerAccount.email}</code></div>
              </div>
              <div>
                <small style={{ color: 'rgba(255,255,255,0.55)' }}>{tr('كود الإحالة المحجوز', 'Reserved Referral Code')}</small>
                <div><code dir="ltr">{marketerAccount.referralCode || '—'}</code></div>
              </div>
              <div>
                <small style={{ color: 'rgba(255,255,255,0.55)' }}>{tr('تاريخ الطلب', 'Submitted On')}</small>
                <div><strong>{date(marketerAccount.createdAt)}</strong></div>
              </div>
            </div>
            {marketerAccount.notes && (
              <p style={{ marginTop: '12px', marginBottom: 0, color: 'rgba(255,255,255,0.72)' }}>
                <strong>{tr('ملاحظات الطلب:', 'Application Notes:')}</strong> {marketerAccount.notes}
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="primary-button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onRefresh();
              } finally {
                setBusy(false);
              }
            }}
          >
            <RefreshCw size={16} />
            {tr('تحديث حالة الاعتماد الآن', 'Check Approval Status Now')}
          </button>
          <span className="mkt-isolation-badge">
            <ShieldCheck size={16} />
            {tr(
              'صلاحيات المسوّقين معزولة تماماً عن صلاحيات الإدارة والتجار',
              'Marketer permissions are strictly isolated from Admin & Merchant controls',
            )}
          </span>
        </div>
      </section>
    );
  }

  // ===== لوحة المسوّق المعتمد (تظهر فقط الخيارات المرتبطة بصلاحيات المسوّق) =====
  const activeCampaignsCount = campaigns.filter(c => c.enabled).length;
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
  const totalEarnedSar = campaigns.reduce((sum, c) => sum + (c.earnedCommission || 0), 0) / 100;

  return (
    <div className="mkt-portal">
      {error && (
        <div className="banner error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError('')}>{tr('إغلاق', 'Close')}</button>
        </div>
      )}
      {feedback && (
        <div className="banner ok" role="status">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')}>{tr('إغلاق', 'Close')}</button>
        </div>
      )}

      {activeTab === 'marketer_overview' && (
        <>
          <section className="mkt-hero-card">
            <div className="mkt-hero-copy">
              <span className="mkt-role-pill">
                <Award size={15} />
                {tr('بوابة المسوّق المعتمد · Approved Marketer Portal', 'Approved Marketer Portal')}
              </span>
              <h2>
                {tr('مرحباً بك في لوحة التسويق بالعمولة،', 'Welcome to your Marketer Dashboard,')}{' '}
                {marketerAccount.fullName}
              </h2>
              <p>
                {tr(
                  'هذه اللوحة مصممة حصرياً لصلاحياتك كمسوّق معتمد لدى ونشوت: انسخ رابط الإحالة الخاص بك، أنشئ حملات تسويقية مخصصة لكل خدمة أو منتج، وتابع عمولاتك بكل شفافية دون أي تداخل مع إعدادات التجار أو إدارة المنصة.',
                  'This dashboard is tailored exclusively to your marketer permissions: share your referral link, launch tracked campaigns for OneShot services, and track your commissions.',
                )}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="primary-button" onClick={() => onNavigateTab('marketer_campaigns')}>
                  <Plus size={16} />
                  {tr('إنشاء حملة إحالة جديدة', 'Create Referral Campaign')}
                </button>
                <button className="outline-button" onClick={() => onNavigateTab('marketer_catalog')}>
                  <ShoppingBag size={16} />
                  {tr('كتالوج العمولات والخدمات', 'Commission & Product Catalog')}
                </button>
                <span className="mkt-isolation-badge">
                  <ShieldCheck size={15} />
                  {tr('حساب مسوّق معتمد · صلاحيات مستقلة', 'Verified Marketer · Isolated Role')}
                </span>
              </div>
            </div>

            <div className="mkt-referral-box">
              <div>
                <small style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>
                  {tr('كود الإحالة الرسمي الخاص بك', 'Your Official Referral Code')}
                </small>
                <div className="mkt-referral-row">
                  <code dir="ltr">{referralCode}</code>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void copyText('code', referralCode)}
                  >
                    {copiedKey === 'code' ? <Check size={15} /> : <Copy size={15} />}
                    {copiedKey === 'code' ? tr('تم النسخ', 'Copied') : tr('نسخ الكود', 'Copy Code')}
                  </button>
                </div>
              </div>

              <div>
                <small style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>
                  {tr('رابط الإحالة المباشر للمتجر', 'Direct Storefront Referral Link')}
                </small>
                <div className="mkt-referral-row">
                  <code dir="ltr">{mainReferralLink}</code>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void copyText('main-link', mainReferralLink)}
                  >
                    {copiedKey === 'main-link' ? <Check size={15} /> : <Copy size={15} />}
                    {copiedKey === 'main-link' ? tr('تم النسخ', 'Copied') : tr('نسخ الرابط', 'Copy Link')}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="mkt-metrics-grid">
            <article className="mkt-metric-card">
              <span>
                <DollarSign size={16} />
                {tr('نسبة العمولة المعتمدة', 'Approved Commission Rate')}
              </span>
              <strong>{commissionRate}%</strong>
              <small>{tr('تُحتسب عن كل طلب مكتمل عبر رابطك', 'Earned on every completed referral order')}</small>
            </article>

            <article className="mkt-metric-card">
              <span>
                <Target size={16} />
                {tr('الحملات التسويقية النشطة', 'Active Campaigns')}
              </span>
              <strong>{number(activeCampaignsCount)}</strong>
              <small>
                {tr('من إجمالي', 'Out of')} {number(campaigns.length)} {tr('حملة مسجلة', 'created campaigns')}
              </small>
            </article>

            <article className="mkt-metric-card">
              <span>
                <TrendingUp size={16} />
                {tr('إجمالي النقرات والتفاعل', 'Total Referral Clicks')}
              </span>
              <strong>{number(totalClicks)}</strong>
              <small>{tr('زيارات الروابط التسويقية الخاصة بك', 'Visits via your tracking links')}</small>
            </article>

            <article className="mkt-metric-card">
              <span>
                <Award size={16} />
                {tr('التحويلات والعمولات المحققة', 'Confirmed Conversions')}
              </span>
              <strong>
                {number(totalConversions)} · {number(totalEarnedSar)} {tr('ر.س', 'SAR')}
              </strong>
              <small>{tr('تُضاف إلى محفظة المسوّق بعد تأكيد الطلب', 'Credited to your wallet upon fulfillment')}</small>
            </article>
          </section>

          <section className="split-grid">
            <div className="panel">
              <h3>{tr('أحدث حملاتك التسويقية', 'Your Recent Marketing Campaigns')}</h3>
              {campaigns.length === 0 ? (
                <div className="empty-card">
                  <Megaphone size={28} />
                  <p>
                    {tr(
                      'لم تقم بإنشاء حملة مخصصة بعد. أنشئ حملتك الأولى لتتبع أداء كل قناة تسويقية بدقة.',
                      'No custom campaigns yet. Create your first campaign to track each marketing channel.',
                    )}
                  </p>
                  <button className="primary-button" onClick={() => onNavigateTab('marketer_campaigns')}>
                    <Plus size={16} />
                    {tr('إنشاء حملة الآن', 'Create Campaign Now')}
                  </button>
                </div>
              ) : (
                <div className="stack-list">
                  {campaigns.slice(0, 4).map(camp => {
                    const campUrl =
                      camp.targetProductSku === 'ALL'
                        ? `${baseUrl}/?ref=${encodeURIComponent(referralCode)}&utm_source=${encodeURIComponent(camp.channel)}&utm_campaign=${encodeURIComponent(camp.utmCampaign)}`
                        : `${baseUrl}/products/${encodeURIComponent(camp.targetProductSku)}?ref=${encodeURIComponent(referralCode)}&utm_source=${encodeURIComponent(camp.channel)}&utm_campaign=${encodeURIComponent(camp.utmCampaign)}`;
                    return (
                      <article className="list-card" key={camp.id}>
                        <div>
                          <div className="card-title-row">
                            <strong>{camp.title}</strong>
                            <span className={`status-badge ${camp.enabled ? 'status-paid' : 'status-cancelled'}`}>
                              {camp.enabled ? tr('نشطة', 'Active') : tr('متوقفة', 'Paused')}
                            </span>
                          </div>
                          <p>
                            {channelLabels[camp.channel]?.ar || camp.channel} · SKU: {camp.targetProductSku}
                          </p>
                          <code dir="ltr">{campUrl}</code>
                        </div>
                        <div className="card-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => void copyText(`camp-${camp.id}`, campUrl)}
                          >
                            {copiedKey === `camp-${camp.id}` ? <Check size={15} /> : <Copy size={15} />}
                            {copiedKey === `camp-${camp.id}` ? tr('تم النسخ', 'Copied') : tr('نسخ الرابط', 'Copy')}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="panel">
              <h3>{tr('ملخص صلاحيات المسوّق المعتمدة', 'Approved Marketer Permissions Summary')}</h3>
              <div className="stack-list">
                <div className="list-card">
                  <div>
                    <strong>{tr('روابط الإحالة وحملات UTM المخصصة', 'Custom Referral & UTM Links')}</strong>
                    <p>
                      {tr(
                        'إنشاء عدد غير محدود من روابط التتبع المخصصة لكل خدمة أو باقة في كتالوج ونشوت.',
                        'Create unlimited tracking links for any service or package in the OneShot catalog.',
                      )}
                    </p>
                  </div>
                  <CheckCircle2 size={20} color="#10b981" />
                </div>
                <div className="list-card">
                  <div>
                    <strong>{tr('كتالوج العمولات الفوري وحاسبة الأرباح', 'Commission Catalog & Profit Calculator')}</strong>
                    <p>
                      {tr(
                        'الاطلاع على الأسعار الرسمية لكل خدمة وحساب عمولتك بالريال السعودي قبل بدء الترويج.',
                        'View official service prices and calculate your exact SAR commission per sale.',
                      )}
                    </p>
                  </div>
                  <CheckCircle2 size={20} color="#10b981" />
                </div>
                <div className="list-card">
                  <div>
                    <strong>{tr('القوالب الإعلانية الجاهزة والمحفظة المالية', 'Ready Ad Creatives & Commission Wallet')}</strong>
                    <p>
                      {tr(
                        'نسخ نصوص تسويقية مدمجة برابط إحالتك ومتابعة رصيدك في محفظة ونشوت.',
                        'Copy ready-made promotional copy with your referral link and manage your balance in Wallet.',
                      )}
                    </p>
                  </div>
                  <CheckCircle2 size={20} color="#10b981" />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'marketer_campaigns' && (
        <section className="split-grid">
          <form className="panel" onSubmit={e => void handleCreateCampaign(e)}>
            <h3>{tr('إنشاء حملة تسويقية ورابط إحالة مخصص', 'Create Marketing Campaign & Referral Link')}</h3>
            <p className="panel-Description" style={{ color: 'rgba(255,255,255,0.68)', marginBottom: '14px' }}>
              {tr(
                'أنشئ رابط تتبع خاصاً بكل منصة أو إعلان لمعرفة الحملات الأكثر تحقيقاً للتحويلات والعمولات.',
                'Generate a dedicated tracking link for each channel or ad to measure conversion performance.',
              )}
            </p>

            <label>
              {tr('عنوان الحملة التسويقية', 'Campaign Title')}
              <input
                required
                maxLength={100}
                value={campaignTitle}
                onChange={e => setCampaignTitle(e.target.value)}
                placeholder={tr('مثال: حملة باقة جوجل آدز الماسية - سناب شات', 'e.g. Google Ads Diamond Promo - Snapchat')}
              />
            </label>

            <label>
              {tr('الخدمة أو المنتج المستهدف', 'Target Service or Product')}
              <select value={targetSku} onChange={e => setTargetSku(e.target.value)}>
                <option value="ALL">
                  {tr('المتجر العام — جميع خدمات ومنتجات ونشوت', 'Main Storefront — All OneShot Services')}
                </option>
                {walletServices.map(service => {
                  const comm = Math.round((service.amount * commissionRate) / 100);
                  return (
                    <option key={service.sku} value={service.sku}>
                      {service.nameAr} ({service.amount} SAR — {tr('عمولتك:', 'Commission:')} {comm} SAR)
                    </option>
                  );
                })}
              </select>
            </label>

            <div className="two-inputs">
              <label>
                {tr('القناة التسويقية', 'Marketing Channel')}
                <select value={channel} onChange={e => setChannel(e.target.value)}>
                  {Object.entries(channelLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {tr(label.ar, label.en)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {tr('معرّف التتبع (UTM Campaign)', 'UTM Campaign Slug')}
                <input
                  required
                  dir="ltr"
                  maxLength={60}
                  value={utmSlug}
                  onChange={e => setUtmSlug(e.target.value)}
                  placeholder="snap-q4-ksa"
                />
              </label>
            </div>

            <button className="primary-button" disabled={busy}>
              <Plus size={16} />
              {tr('إنشاء وتوليد رابط الحملة', 'Generate Campaign Link')}
            </button>
          </form>

          <div className="panel">
            <h3>
              {tr('حملاتك التسويقية المسجلة', 'Your Registered Campaigns')} ({number(campaigns.length)})
            </h3>
            {campaigns.length === 0 ? (
              <div className="empty-card">
                <Share2 size={28} />
                <p>{tr('لا توجد حملات مخصصة بعد. استخدم النموذج لإنشاء أول رابط حملة.', 'No campaigns created yet.')}</p>
              </div>
            ) : (
              <div className="stack-list">
                {campaigns.map(camp => {
                  const campUrl =
                    camp.targetProductSku === 'ALL'
                      ? `${baseUrl}/?ref=${encodeURIComponent(referralCode)}&utm_source=${encodeURIComponent(camp.channel)}&utm_campaign=${encodeURIComponent(camp.utmCampaign)}`
                      : `${baseUrl}/products/${encodeURIComponent(camp.targetProductSku)}?ref=${encodeURIComponent(referralCode)}&utm_source=${encodeURIComponent(camp.channel)}&utm_campaign=${encodeURIComponent(camp.utmCampaign)}`;
                  return (
                    <article className="list-card" key={camp.id}>
                      <div>
                        <div className="card-title-row">
                          <strong>{camp.title}</strong>
                          <span className={`status-badge ${camp.enabled ? 'status-paid' : 'status-cancelled'}`}>
                            {camp.enabled ? tr('نشطة', 'Active') : tr('متوقفة', 'Paused')}
                          </span>
                        </div>
                        <p>
                          {tr(channelLabels[camp.channel]?.ar || camp.channel, channelLabels[camp.channel]?.en || camp.channel)} ·{' '}
                          {camp.targetProductSku === 'ALL' ? tr('المتجر العام', 'All Services') : camp.targetProductSku} ·{' '}
                          {date(camp.createdAt)}
                        </p>
                        <code dir="ltr">{campUrl}</code>
                      </div>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => void copyText(`camp-list-${camp.id}`, campUrl)}
                        >
                          {copiedKey === `camp-list-${camp.id}` ? <Check size={15} /> : <Copy size={15} />}
                          {copiedKey === `camp-list-${camp.id}` ? tr('تم النسخ', 'Copied') : tr('نسخ الرابط', 'Copy Link')}
                        </button>
                        <button
                          type="button"
                          className="outline-button"
                          disabled={busy}
                          onClick={() => void handleToggleCampaign(camp.id, !camp.enabled)}
                        >
                          {camp.enabled ? tr('إيقاف مؤقت', 'Pause') : tr('تفعيل', 'Enable')}
                        </button>
                        <button
                          type="button"
                          className="outline-button"
                          disabled={busy}
                          onClick={() => void handleDeleteCampaign(camp.id)}
                          title={tr('حذف الحملة', 'Delete Campaign')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'marketer_catalog' && (
        <section className="panel">
          <div className="mkt-calculator-box">
            <div>
              <span className="mkt-role-pill">
                <Sparkles size={14} />
                {tr('حاسبة أرباح المسوّق التفاعلية', 'Interactive Marketer Commission Calculator')}
              </span>
              <h3 style={{ margin: '0 0 8px' }}>
                {tr('احسب دخلك المتوقع بناءً على نسبة عمولتك المعتمدة', 'Estimate Your Monthly Commission Earnings')} ({commissionRate}%)
              </h3>
              <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.72)' }}>
                {tr(
                  'حرك المؤشر لتحديد عدد المبيعات الشهرية المتوقعة عبر روابط الإحالة الخاصة بك:',
                  'Adjust the slider to estimate monthly referral sales across OneShot services:',
                )}
              </p>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span>
                  {tr('عدد الإحالات الناجحة شهرياً:', 'Estimated Monthly Referrals:')} <strong>{estimatedMonthlySales}</strong>
                </span>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={estimatedMonthlySales}
                  onChange={e => setEstimatedMonthlySales(Number(e.target.value))}
                />
              </label>
            </div>
            <div className="mkt-referral-box" style={{ textAlign: 'center' }}>
              <small style={{ color: 'rgba(255,255,255,0.65)' }}>
                {tr('متوسط العمولة الشهرية التقديرية', 'Estimated Monthly Commission')}
              </small>
              <strong style={{ fontSize: '2rem', color: '#6ee7b7' }}>
                {number(averageServiceCommission * estimatedMonthlySales)} {tr('ر.س', 'SAR')}
              </strong>
              <small style={{ color: 'rgba(255,255,255,0.5)' }}>
                {tr('بمتوسط عمولة', 'Avg. commission')} {number(averageServiceCommission)} {tr('ر.س لكل طلب', 'SAR per order')}
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>{tr('كتالوج الخدمات والمنتجات القابلة للتسويق بالعمولة', 'Affiliate Services & Products Catalog')}</h3>
              <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                {tr('انسخ رابط الإحالة المباشر لأي خدمة وشاركه مع عملائك فوراً', 'Copy the direct referral link for any service and share it with clients')}
              </small>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '260px', margin: 0 }}>
              <Search size={16} />
              <input
                type="search"
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder={tr('ابحث باسم الخدمة أو الرمز SKU...', 'Search service or SKU...')}
              />
            </label>
          </div>

          <div className="mkt-catalog-grid">
            {filteredServices.map(service => {
              const commAmount = Math.round((service.amount * commissionRate) / 100);
              const productLink = `${baseUrl}/products/${encodeURIComponent(service.sku)}?ref=${encodeURIComponent(referralCode)}`;
              return (
                <article className="mkt-catalog-card" key={service.sku}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <code dir="ltr" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>{service.sku}</code>
                      <span className="status-badge status-published">
                        {service.billingCycle === 'monthly' ? tr('شهري', 'Monthly') : tr('دفعة واحدة', 'One-time')}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '1.02rem' }}>{tr(service.nameAr, service.nameEn)}</h4>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem' }}>
                      {tr('سعر الخدمة المنشور:', 'Published Price:')} <strong>{number(service.amount)} SAR</strong>
                    </p>
                  </div>

                  <div className="mkt-commission-highlight">
                    <span>{tr('عمولتك الصافية', 'Your Commission')} ({commissionRate}%)</span>
                    <strong>{number(commAmount)} SAR</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="primary-button"
                      style={{ flex: 1 }}
                      onClick={() => void copyText(`sku-${service.sku}`, productLink)}
                    >
                      {copiedKey === `sku-${service.sku}` ? <Check size={15} /> : <Copy size={15} />}
                      {copiedKey === `sku-${service.sku}` ? tr('تم نسخ الرابط', 'Link Copied') : tr('نسخ رابط التسويق', 'Copy Referral Link')}
                    </button>
                    <button
                      type="button"
                      className="outline-button"
                      onClick={() => {
                        setTargetSku(service.sku);
                        setCampaignTitle(`${service.nameAr} - ${referralCode}`);
                        setUtmSlug(service.sku.toLowerCase());
                        onNavigateTab('marketer_campaigns');
                      }}
                    >
                      <Target size={15} />
                      {tr('تخصيص حملة', 'Campaign')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'marketer_creatives' && (
        <section className="split-grid">
          <div className="panel">
            <h3>{tr('قوالب إعلانية جاهزة مدمجة برابط الإحالة الخاص بك', 'Ready Promotional Templates with Your Referral Link')}</h3>
            <p style={{ color: 'rgba(255,255,255,0.68)', marginBottom: '16px' }}>
              {tr(
                'جميع النصوص التالية تحتوي تلقائياً على كود الإحالة ورابط التتبع الخاص بك. انسخها وشاركها مباشرة.',
                'All templates below automatically embed your referral code and tracking link.',
              )}
            </p>
            <div className="mkt-creatives-grid">
              {[
                {
                  id: 'whatsapp-promo',
                  title: tr('قالب واتساب والمراسلة المباشرة', 'WhatsApp & Direct Pitch Template'),
                  text: `مرحباً! 🚀
إذا كنت تبحث عن إنتاج مرئي احترافي، إدارة حملات Google Ads المعتمدة، أو حلول الأعمال الرقمية المتكاملة في السعودية، أنصحك بمنصة OneShot الرسمية.

تصفح الباقات والأسعار الرسمية من هنا:
${mainReferralLink}

كود الإحالة الخاص: ${referralCode}`,
                },
                {
                  id: 'social-promo',
                  title: tr('قالب منصة X / لينكدإن / سناب شات', 'X / LinkedIn / Snapchat Post Template'),
                  text: `ضاعف مبيعات متجرك وحضور علامتك التجارية مع منظومة OneShot المتكاملة:
✅ تصوير فوتوغرافي وإنتاج مرئي احترافي
✅ باقات نمو إعلانات جوجل (Google Ads)
✅ حلول أعمال رقمية وهوية بصرية متكاملة

اطلع على الكتالوج الكامل:
${mainReferralLink}
#OneShot #تسويق_رقمي #التجارة_الإلكترونية`,
                },
                {
                  id: 'google-ads-promo',
                  title: tr('قالب ترويج باقة إعلانات جوجل الماسية', 'Google Ads Diamond Package Pitch'),
                  text: `هل ترغب في إطلاق حملات Google Ads احترافية مع ضبط Google Tag Manager وتتبع التحويلات بدقة؟
باقة نمو إعلانات جوجل الماسية من OneShot تمنحك رصيداً إعلانياً وإدارة استراتيجية متكاملة.

التفاصيل والطلب المباشر:
${baseUrl}/?ref=${encodeURIComponent(referralCode)}#section-google-ads`,
                },
              ].map(template => (
                <article className="mkt-creative-card" key={template.id}>
                  <strong>{template.title}</strong>
                  <pre>{template.text}</pre>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void copyText(template.id, template.text)}
                  >
                    {copiedKey === template.id ? <Check size={15} /> : <Copy size={15} />}
                    {copiedKey === template.id ? tr('تم نسخ النص الإعلاني', 'Copied Template') : tr('نسخ النص الإعلاني', 'Copy Promotional Copy')}
                  </button>
                </article>
              ))}
            </div>
          </div>

          <form className="panel" onSubmit={e => void handleUpdateProfile(e)}>
            <h3>{tr('بيانات المسوّق وقنوات الترويج', 'Marketer Profile & Channels')}</h3>
            <label>
              {tr('الاسم الظاهر للمسوّق', 'Marketer Display Name')}
              <input
                required
                maxLength={100}
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
              />
            </label>
            <label>
              {tr('قنوات التسويق والنبذة التعريفية', 'Marketing Channels & Bio Notes')}
              <textarea
                rows={4}
                maxLength={400}
                value={profileNotes}
                onChange={e => setProfileNotes(e.target.value)}
                placeholder={tr('مثال: مسوّق رقمي متخصص في حملات المتاجر السعودية على سناب شات وجوجل آدز...', 'e.g. Digital marketer specializing in Saudi e-commerce campaigns...')}
              />
            </label>
            <div className="list-card" style={{ marginBottom: '14px' }}>
              <div>
                <strong>{tr('حالة الاعتماد', 'Approval Status')}</strong>
                <p>
                  {tr('معتمد من إدارة المنصة بنسبة عمولة', 'Approved by Platform Admin at')} {commissionRate}%
                </p>
              </div>
              <span className="status-badge status-paid">{tr('معتمد', 'Approved')}</span>
            </div>
            <button className="primary-button" disabled={busy}>
              {tr('حفظ تحديثات ملف المسوّق', 'Save Marketer Profile')}
            </button>
            <a
              className="outline-button"
              href={mainReferralLink}
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: '10px', justifyContent: 'center' }}
            >
              <ExternalLink size={15} />
              {tr('معاينة المتجر برابط الإحالة الخاص بك', 'Preview Storefront with Your Referral Link')}
            </a>
          </form>
        </section>
      )}
    </div>
  );
}

export function MarketerApprovalAdmin({
  marketers,
  onRefresh,
}: {
  marketers: MarketerAccount[];
  onRefresh: () => Promise<void>;
}) {
  const { tr, number } = useAppearance();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const counts = useMemo(() => {
    return {
      all: marketers.length,
      pending: marketers.filter(m => m.status === 'pending').length,
      approved: marketers.filter(m => m.status === 'approved').length,
      rejected: marketers.filter(m => m.status === 'rejected').length,
    };
  }, [marketers]);

  const filtered = useMemo(() => {
    if (filter === 'all') return marketers;
    return marketers.filter(m => m.status === filter);
  }, [marketers, filter]);

  async function handleReview(marketer: MarketerAccount, status: 'approved' | 'rejected') {
    setBusyId(marketer.id);
    setError('');
    setFeedback('');
    try {
      const commissionRate = rates[marketer.id] ?? marketer.commissionRate ?? 10;
      const reviewNote = notes[marketer.id] ?? marketer.notes ?? '';
      await api('platform', {
        action: 'review-marketer',
        id: marketer.id,
        status,
        commissionRate,
        notes: reviewNote,
      });
      setFeedback(
        status === 'approved'
          ? tr(`تم اعتماد حساب المسوّق (${marketer.fullName}) وتفعيل لوحته بنجاح.`, `Approved marketer ${marketer.fullName}.`)
          : tr(`تم رفض/إيقاف حساب المسوّق (${marketer.fullName}).`, `Rejected marketer ${marketer.fullName}.`),
      );
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('تعذر تحديث حالة المسوّق.', 'Could not update marketer status.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <span className="eyebrow">
            <UserCheck size={14} /> {tr('إدارة حسابات المسوّقين · Marketer Approvals', 'MARKETER ACCOUNT APPROVALS')}
          </span>
          <h3 style={{ margin: '6px 0' }}>
            {tr('إدارة المسوّقين والعمولات', 'Marketer accounts and commissions')}
          </h3>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.68)' }}>
            {tr(
              'تتفعّل حسابات المسوّقين تلقائياً. يمكنك هنا إدارة العمولات وإيقاف الحسابات أو إعادة تفعيلها.',
              'Marketer accounts activate automatically. Manage commissions, suspend accounts, or restore access here.',
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(
            [
              ['all', tr('الكل', 'All'), counts.all],
              ['pending', tr('بانتظار الموافقة', 'Pending'), counts.pending],
              ['approved', tr('معتمد', 'Approved'), counts.approved],
              ['rejected', tr('مرفوض', 'Rejected'), counts.rejected],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? 'primary-button' : 'outline-button'}
              onClick={() => setFilter(key)}
            >
              {label} ({number(count)})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="banner error" role="alert" style={{ marginBottom: '14px' }}>
          <span>{error}</span>
          <button onClick={() => setError('')}>{tr('إغلاق', 'Close')}</button>
        </div>
      )}
      {feedback && (
        <div className="banner ok" role="status" style={{ marginBottom: '14px' }}>
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')}>{tr('إغلاق', 'Close')}</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-card">
          <UserCheck size={28} />
          <p>{tr('لا توجد طلبات مسوّقين ضمن هذا التصنيف حالياً.', 'No marketer accounts found in this filter.')}</p>
        </div>
      ) : (
        <div className="stack-list">
          {filtered.map(marketer => {
            const currentRate = rates[marketer.id] ?? marketer.commissionRate ?? 10;
            const currentNote = notes[marketer.id] ?? marketer.notes ?? '';
            return (
              <article
                key={marketer.id}
                className={`mkt-admin-card ${marketer.status === 'pending' ? 'pending' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div className="card-title-row">
                      <strong>{marketer.fullName}</strong>
                      <span
                        className={`status-badge ${
                          marketer.status === 'approved'
                            ? 'status-paid'
                            : marketer.status === 'rejected'
                              ? 'status-failed'
                              : 'status-pending'
                        }`}
                      >
                        {marketer.status === 'approved'
                          ? tr('مسوّق معتمد', 'Approved')
                          : marketer.status === 'rejected'
                            ? tr('مرفوض / موقوف', 'Rejected')
                            : tr('جارٍ تفعيل الحساب', 'Pending Approval')}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0', color: 'rgba(255,255,255,0.72)' }}>
                      <code dir="ltr">{marketer.email}</code> · {tr('كود الإحالة:', 'Referral Code:')}{' '}
                      <code dir="ltr">{marketer.referralCode || '—'}</code> · {tr('تاريخ التسجيل:', 'Registered:')}{' '}
                      {date(marketer.createdAt)}
                    </p>
                    {marketer.reviewedBy && (
                      <small style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {tr('آخر مراجعة بواسطة:', 'Last reviewed by:')} {marketer.reviewedBy}
                      </small>
                    )}
                  </div>

                  <div className="mkt-admin-actions">
                    <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <span>{tr('العمولة %:', 'Commission %:')}</span>
                      <input
                        type="number"
                        min={1}
                        max={80}
                        style={{ width: '74px', padding: '6px 8px' }}
                        value={currentRate}
                        onChange={e => setRates(prev => ({ ...prev, [marketer.id]: Number(e.target.value) }))}
                      />
                    </label>
                    <input
                      type="text"
                      maxLength={300}
                      placeholder={tr('ملاحظة الإدارة (اختياري)...', 'Admin note (optional)...')}
                      style={{ minWidth: '200px', padding: '7px 10px' }}
                      value={currentNote}
                      onChange={e => setNotes(prev => ({ ...prev, [marketer.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="primary-button"
                      disabled={busyId === marketer.id}
                      onClick={() => void handleReview(marketer, 'approved')}
                    >
                      <Check size={15} />
                      {marketer.status === 'approved'
                        ? tr('تحديث الاعتماد', 'Update Approval')
                        : tr('اعتماد وتفعيل المسوّق', 'Approve Marketer')}
                    </button>
                    {marketer.status !== 'rejected' && (
                      <button
                        type="button"
                        className="outline-button"
                        disabled={busyId === marketer.id}
                        onClick={() => void handleReview(marketer, 'rejected')}
                      >
                        <XCircle size={15} />
                        {tr('رفض الطلب', 'Reject')}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
