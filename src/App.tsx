import { createPortal } from 'react-dom';
import MerchantGatewayLookup from './MerchantGatewayLookup';
import { useCallback, useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { acceptInvite, getSettings, getUser, handleAuthCallback, login, logout, onAuthChange, requestPasswordRecovery, signup, updateUser, type User } from '@netlify/identity';
import { ArrowUpLeft, Plus, LayoutDashboard, Link2, FileText, Repeat2, Blocks, Settings2, ShieldCheck, Download, LogOut, Menu, X, Search, Copy, ExternalLink, CreditCard, Check, RefreshCw, Users, SlidersHorizontal, ArrowRight, Sparkles, Globe } from 'lucide-react';
import { api, date, methods, money, openPaymentLink, paymentLink, statuses, type InstallPrompt, type Method, type OpenLink, type PaymentDocument, type Platform } from './platform';
import { AppearanceControls, Brand } from './Brand';
import { appearanceLink, useAppearance } from './i18n';
import { defaultPolicy, gatewayName, gateways, type Gateway, type PaymentPolicy } from '../shared/policy';
import Checkout from './Checkout';
import OpenCheckout from './OpenCheckout';
import Storefront from './Storefront';
import SitePay from './SitePay';
import LoadingPanel from './LoadingPanel';
import CameraShutterSplash from './CameraShutterSplash';
import GatewayIntegrationManager from './GatewayIntegrationManager';
import OperationsCenter from './OperationsCenter';
import Wallet from './Wallet';
import CeoSuite from './CeoSuite';
import SecuritySystemsManager from './SecuritySystemsManager';
import LoaderTestingSuite from './LoaderTestingSuite';
import VirtualMerchantStation from './VirtualMerchantStation';
import AdminIpSpoofingManager from './AdminIpSpoofingManager';
import GatewayCountryMatrixManager from './GatewayCountryMatrixManager';
import FraudSimulationToolkit from './FraudSimulationToolkit';
import AiStaffMarketplace from './AiStaffMarketplace';
import FeaturePropertiesModal from './FeaturePropertiesModal';
import AiBinIntelligenceCenter from './AiBinIntelligenceCenter';
import MultiBinAcceptanceTool from './MultiBinAcceptanceTool';
import PaymentFailuresDashboard from './PaymentFailuresDashboard';
import AiTierManager from './AiTierManager';
import AiLicenseAdmin from './AiLicenseAdmin';
import OnboardingGuide, { tourCompleted } from './OnboardingGuide';
import { MarketerApprovalAdmin, MarketerDashboard, type MarketerTab } from './MarketerDashboard';
import { getSavedOllamaConfig, saveOllamaConfig, type OllamaServerConfig } from './aiModelsData';
import { isStorefrontPath } from './storefront/routes';
import GeminiAiStudio from './GeminiAiStudio';
import { Shield, FlaskConical, UserPlus, ShieldAlert, BrainCircuit, BarChart3, Award, Megaphone, ShoppingBag, UserCheck, Store } from 'lucide-react';

type View =
  | 'overview'
  | 'gemini_studio'
  | 'staff'
  | 'wallet'
  | 'ceo'
  | 'links'
  | 'invoices'
  | 'subscriptions'
  | 'integrations'
  | 'security'
  | 'loader'
  | 'settings'
  | 'admin'
  | 'assistant'
  | 'marketer_gateways'
  | 'marketer_overview'
  | 'marketer_campaigns'
  | 'marketer_catalog'
  | 'marketer_creatives';
type Auth = 'login' | 'signup' | 'reset' | 'password' | 'invite';
const navigation = [
  { id: 'overview' as const, name: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'gemini_studio' as const, name: 'استوديو الذكاء الاصطناعي (Gemini AI Suite)', icon: Sparkles },
  { id: 'staff' as const, name: 'سوق كوادر الـ AI (توظيف موظفين)', icon: UserPlus },
  { id: 'wallet' as const, name: 'محفظتي', icon: CreditCard },
  { id: 'ceo' as const, name: 'مكتب الرئيس التنفيذي (CEO Agents)', icon: Users },
  { id: 'links' as const, name: 'روابط الدفع', icon: Link2 },
  { id: 'invoices' as const, name: 'الفواتير', icon: FileText },
  { id: 'subscriptions' as const, name: 'الاشتراكات', icon: Repeat2 },
  { id: 'integrations' as const, name: 'طرق ربط البوابات', icon: Blocks },
  { id: 'security' as const, name: 'أنظمة حماية البوابات (التاجر)', icon: Shield },
  { id: 'loader' as const, name: 'أدوات اللودر واختبار البوابات', icon: FlaskConical },
  { id: 'settings' as const, name: 'إعدادات التاجر', icon: Settings2 },
  { id: 'admin' as const, name: 'إدارة المنصة واستقبال الطلبات', icon: SlidersHorizontal },
  { id: 'assistant' as const, name: 'مركز عمليات AI (Full Admin)', icon: Sparkles },
];
const marketerNavigation = [
  { id: 'marketer_overview' as const, name: 'الإحالات والعمولات', icon: LayoutDashboard },
  { id: 'marketer_gateways' as const, name: 'بوابات التجار', icon: Blocks },
  { id: 'marketer_campaigns' as const, name: 'روابط الإحالة والحملات', icon: Megaphone },
  { id: 'marketer_catalog' as const, name: 'كتالوج العمولات والمنتجات', icon: ShoppingBag },
  { id: 'marketer_creatives' as const, name: 'القوالب الإعلانية والملف', icon: Award },
  { id: 'wallet' as const, name: 'محفظة العمولات', icon: CreditCard },
];
const allNavigation = [...navigation, ...marketerNavigation.filter(item => item.id !== 'wallet')];
const guestNavigation: View[] = [];
const merchantViews = ['overview', 'gemini_studio', 'links', 'invoices', 'subscriptions', 'integrations', 'settings', 'wallet'];
const adminViews = ['admin', 'gemini_studio', 'integrations'];
const initialPlatform: Platform = { merchant: null, documents: [], subscriptions: [], attempts: [], openLinks: [] };

export default function App() {
  const payment = window.location.pathname.match(/^\/pay\/([a-f0-9-]{36})\/?$/i);
  const open = window.location.pathname.match(/^\/p\/([a-f0-9-]{36})\/?$/i);
  const sitePay = window.location.hostname.toLowerCase() === 'pay.1shotcam.com' || new URLSearchParams(window.location.search).get('site') === 'pay';
  const authCallback = window.location.hash.includes('token=') || new URLSearchParams(window.location.search).has('auth');

  return (
    <>
      {payment ? (
        <Checkout id={payment[1]} />
      ) : open ? (
        <OpenCheckout id={open[1]} />
      ) : sitePay ? (
        <SitePay />
      ) : isStorefrontPath(window.location.pathname) && !authCallback ? (
        <Storefront />
      ) : (
        <MerchantPlatform />
      )}
    </>
  );
}


function MerchantPlatform() {
  const { t, tr, locale } = useAppearance();
  const [user, setUser] = useState<User | null>(null);
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [view, setView] = useState<View>(window.location.pathname === '/wallet' ? 'wallet' : 'links');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [auth, setAuth] = useState<Auth | null>(null);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [autoconfirm, setAutoconfirm] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);
  const [create, setCreate] = useState<Method | null>(null);
  const [gateway, setGateway] = useState<Gateway>('telr');
  const [openBuilder, setOpenBuilder] = useState(false);
  const [openGatewayMode, setOpenGatewayMode] = useState<'all' | 'single'>('all');
  const [reviewAttempt, setReviewAttempt] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [tour, setTour] = useState(false);
  const [search, setSearch] = useState('');
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [signupRole, setSignupRole] = useState<'merchant' | 'marketer' | 'loader' | 'admin'>('merchant');
  const [signupStoreName, setSignupStoreName] = useState('');
  const [signupMarketerNotes, setSignupMarketerNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let current: User | null = null;
      try {
        current = await getUser();
      } catch {
        // Netlify identity is offline or running outside Netlify cloud
      }
      if (!current) {
        // A previously stored fake Google session (hardcoded identity) must never count as a login.
        if (localStorage.getItem('oneshot_google_user')) localStorage.removeItem('oneshot_google_user');
      }
      setUser(current ?? null);
      let result = initialPlatform;
      let platformError = '';
      try {
        result = await api<Platform>('platform');
      } catch (caught) {
        platformError = caught instanceof Error ? caught.message : 'خطأ غير معروف';
      }
      setPlatform(result);
      const isMarketerAccount = Boolean(current && result.accountRole === 'marketer' && !result.isAdmin);
      const isAdminAccount = Boolean(current && result.isAdmin);

      // مرشد أول تسجيل: يفتح للتجار فقط مرة واحدة لكل حساب.
      // Navigation follows the persisted account role.

      if (isMarketerAccount) {
        setView(previous => marketerNavigation.some(item => item.id === previous) ? previous : 'marketer_overview');
      } else if (isAdminAccount) {
        setView(previous => adminViews.includes(previous) ? previous : 'admin');
      } else if (result.accountRole === 'loader') {
        setView('loader');
      } else if (result.accountRole === 'admin') {
        setView('admin');
      } else if (current) {
        setView(previous => merchantViews.includes(previous) ? previous : 'links');
      }
      setError(platformError ? `تعذر تحميل بيانات الحساب — الأرقام المعروضة غير محدّثة. (${platformError})` : '');
    }
    catch { setError('تعذر تحميل بيانات الحساب. تحقق من اتصالك وإعدادات قاعدة البيانات.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function initialize() {
      try {
        const callback = await handleAuthCallback().catch(() => null);
        if (!mounted) return;
        if (callback?.type === 'recovery') setAuth('password');
        else if (callback?.type === 'invite' && callback.token) { setInvite(callback.token); setAuth('invite'); }
        else {
          const params = new URLSearchParams(window.location.search);
          const requested = params.get('auth');
          const requestedRole = params.get('role');
          if (requestedRole === 'marketer' || requestedRole === 'merchant' || requestedRole === 'loader' || requestedRole === 'admin') setSignupRole(requestedRole);
          if (requested === 'admin') setAuth('login');
          else if (requested === 'login' || ['/login', '/sign-in'].includes(window.location.pathname)) setAuth('login');
          else if (requested === 'signup' || ['/signup', '/sign-up', '/register'].includes(window.location.pathname)) setAuth('signup');
        }
        const settings = await getSettings().catch(() => ({ disableSignup: false }));
        const identity = await fetch('/.netlify/identity/settings', { headers: { accept: 'application/json' } })
          .then(response => (response.ok ? response.json() : null))
          .catch(() => null) as { external?: { google?: boolean }; autoconfirm?: boolean } | null;
        if (mounted) {
          setSignupEnabled(!settings?.disableSignup);
          setGoogleEnabled(Boolean(identity?.external?.google));
          setAutoconfirm(Boolean(identity?.autoconfirm));
        }
      } catch {
        // Identity offline or running outside Netlify cloud
      }
      if (mounted) await load();
    }
    void initialize();
    const unsubscribe = onAuthChange(() => { if (mounted) void load(); });
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => { mounted = false; unsubscribe(); window.removeEventListener('beforeinstallprompt', onPrompt); };
  }, [load]);

  async function run(action: () => Promise<unknown>, success = 'تم الحفظ.') {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(success); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.'); }
    finally { setBusy(false); }
  }

  async function copy(url: string) {
    try { await navigator.clipboard.writeText(url); setNotice('تم نسخ الرابط.'); }
    catch { setNotice(`${t('تعذر النسخ. استخدم الرابط الظاهر.')} ${url}`); }
  }

  async function install() {
    if (!installPrompt) { setNotice('افتح قائمة المتصفح واختر تثبيت التطبيق أو الإضافة للشاشة الرئيسية.'); return; }
    await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null);
  }

  function closeAuth(authenticated = !!user) {
    setAuth(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');

    // If user is not authenticated and cancels auth or was on sign-in/sign-up/dashboard, redirect back to storefront home '/'
    if (!authenticated) {
      window.location.href = appearanceLink('/');
      return;
    }

    if (['/login', '/sign-in', '/signup', '/sign-up', '/register'].includes(url.pathname)) {
      url.pathname = '/dashboard';
    }
    window.history.replaceState(null, '', url);
  }


  // Google sign-in must be a real Netlify Identity OAuth round-trip; never fake a session.
  async function handleGoogleSignIn() {
    setBusy(true); setError(''); setNotice('');
    try {
      if (!googleEnabled) {
        setError('تسجيل الدخول بجوجل غير مفعّل على الموقع حالياً. استخدم البريد وكلمة المرور، أو فعّل مزوّد Google من Netlify ← Identity ← External providers.');
        return;
      }
      const redirect = `${window.location.origin}/`;
      window.location.href = `/.netlify/identity/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`;
    } catch {
      setError('تعذر تسجيل الدخول عبر Google. حاول مجدداً.');
    } finally {
      setBusy(false);
    }
  }

  function authMessage(raw: string): string {
    const message = raw.toLowerCase();
    if (message.includes('email not confirmed')) return 'بريدك غير مؤكّد بعد. افتح رابط التأكيد الذي وصلك ثم سجّل الدخول.';
    if (message.includes('no user found') || message.includes('user not found')) return 'لا يوجد حساب بهذا البريد. أنشئ حساباً جديداً.';
    if (message.includes('already registered')) return 'هذا البريد مسجّل مسبقاً. سجّل الدخول أو استعد كلمة المرور.';
    if (message.includes('invalid') || message.includes('unauthorized')) return 'البريد أو كلمة المرور غير صحيحة.';
    if (message.includes('password')) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.';
    return raw;
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') || '');
    const password = String(data.get('password') || '');
    setBusy(true); setError(''); setNotice('');
    try {
      if (auth === 'signup') {
        const fullName = String(data.get('name') || '').trim();
        const storeName = String(data.get('storeName') || signupStoreName || fullName).trim();
        const notes = String(data.get('marketerNotes') || signupMarketerNotes || '').trim();
        try {
          await signup(email, password, {
            full_name: fullName,
            account_type: signupRole,
            store_name: signupRole === 'merchant' ? storeName : undefined,
            marketing_notes: signupRole === 'marketer' ? notes : undefined,
          });
          let authenticated = await getUser();
          if (!authenticated) {
            // اعتماد الحساب على الخادم مباشرة، فلا يبقى التسجيل معلقاً على رابط البريد.
            // Identity email confirmation remains separate from account activation.
            authenticated = await login(email, password).catch(() => null);
          }
          if (authenticated) {
            await api('platform', {
              action: 'register-account',
              role: signupRole,
              name: fullName,
              storeName: signupRole === 'merchant' ? storeName : undefined,
              notes: signupRole === 'marketer' ? notes : undefined,
            });
            if (signupRole === 'marketer') {
              setView('marketer_overview');
              setNotice('تم تفعيل حساب المسوّق تلقائياً بنجاح.');
            } else {
              setView('links');
              setNotice('تم إنشاء الحساب بنجاح.');
            }
            closeAuth(true);
          } else {
            setNotice('أُنشئ الحساب. راجع بريدك لتأكيده ثم سجّل الدخول.');
          }
        } catch (caught) {
          setError(authMessage(caught instanceof Error ? caught.message : 'خطأ غير معروف'));
          return;
        }
      }
      else if (auth === 'reset') { await requestPasswordRecovery(email); setNotice('تم إرسال الرابط. راجع بريدك.'); }
      else if (auth === 'password') { await updateUser({ password }); closeAuth(true); }
      else if (auth === 'invite' && invite) { await acceptInvite(invite, password); closeAuth(true); }
      else {
        try {
          await login(email, password);
          closeAuth(true);
          setNotice('تم تسجيل الدخول بنجاح.');
        } catch (caught) {
          setError(authMessage(caught instanceof Error ? caught.message : 'خطأ غير معروف'));
          return;
        }
      }
      await load();
    } catch { setError('تعذر إكمال التحقق من الحساب.'); }
    finally { setBusy(false); }
  }

  const policy = platform.policy ?? defaultPolicy;
  const merchant = platform.merchant;
  const isMarketer = Boolean(user && platform.accountRole === 'marketer' && !platform.isAdmin);
  const isMarketerApproved = isMarketer && platform.registrationStatus === 'approved';
  const capMap: Record<Gateway, Record<string, boolean> | undefined> = { paytabs: platform.capabilities, telr: platform.telrCapabilities, ngenius: platform.ngeniusCapabilities, tap: platform.tapCapabilities };
  const caps = capMap[gateway];
  const choices = gateways.flatMap(provider => methods.filter(method => method.id !== 'recurring' && capMap[provider]?.[method.id]).map(method => ({ value: `${provider}:${method.id}`, name: `${gatewayName(provider)} · ${t(method.name)}` })));
  const filtered = platform.documents.filter(document => (view === 'invoices' ? document.method === 'invoice' : true) && `${document.title} ${document.customerName} ${document.customerEmail}`.toLowerCase().includes(search.toLowerCase()));
  const metrics = platform.metrics ?? { totalPaid: 0, paidCount: 0, pendingCount: 0, customers: 0 };
  const canCreate = !!merchant && !isMarketer && policy.requestsEnabled && policy.paymentsEnabled;
  const cancel = (document: PaymentDocument) => void run(() => api('platform', { action: 'cancel-document', id: document.id }), 'إلغاء الطلب لا يسترد دفعة بدأت بالفعل.');

  async function testLink() {
    const created: { link?: OpenLink } = {};
    await run(async () => {
      const result = await api<{ link: OpenLink }>('platform', { action: 'create-open-link', title: 'رابط تجربة ١٠ ر.س', minimum: 10, maximum: 10, allowedMethods: choices.map(choice => choice.value) });
      created.link = result.link;
      setView('links');
    }, 'تم إنشاء رابط تجربة ١٠ ر.س.');
    if (created.link) await copy(openPaymentLink(created.link.id));
  }

  const readinessVariables = [`${platform.credentialPrefix ?? 'PAYTABS_<MERCHANT_ID>'}_SERVER_KEY`, `${platform.credentialPrefix ?? 'PAYTABS_<MERCHANT_ID>'}_PROFILE_ID`, `${platform.telrPrefix ?? 'TELR_<MERCHANT_ID>'}_STORE_ID`, `${platform.telrPrefix ?? 'TELR_<MERCHANT_ID>'}_SERVICE_API_KEY`, `${platform.ngeniusPrefix ?? 'NGENIUS_<MERCHANT_ID>'}_API_KEY`, `${platform.ngeniusPrefix ?? 'NGENIUS_<MERCHANT_ID>'}_OUTLET`, `${platform.tapPrefix ?? 'TAP_<MERCHANT_ID>'}_SECRET_KEY`, `${platform.tapPrefix ?? 'TAP_<MERCHANT_ID>'}_PUBLIC_KEY`];
  const sitePayUrl = 'https://pay.1shotcam.com/';
  const liveGateways = choices.map(choice => choice.name.split(' · ')[0]).filter((value, index, all) => all.indexOf(value) === index);
  const testButton = <button className="primary-button" disabled={!canCreate || !policy.openLinksEnabled || busy} onClick={() => void testLink()}><Sparkles size={16} />{t('رابط تجربة ١٠ ر.س')}</button>;

  const visibleNavigation = isMarketer
    ? marketerNavigation.filter(item => isMarketerApproved || item.id === 'marketer_overview')
    : navigation.filter(item => !user ? guestNavigation.includes(item.id)
      : platform.isAdmin ? adminViews.includes(item.id)
      : platform.accountRole === 'loader' ? item.id === 'loader'
      : platform.accountRole === 'admin' ? false : merchantViews.includes(item.id));
  const currentViewName = allNavigation.find(item => item.id === view)?.name || 'نظرة عامة';
  const workspaceLabel = platform.isAdmin
    ? tr('إدارة المنصة · Admin', 'Platform Admin')
    : isMarketer
      ? tr('بوابة المسوّقين · Marketer', 'Marketer Portal')
      : platform.accountRole === 'loader' ? tr('مساحة اللودر', 'Loader workspace') : t('مساحة التاجر');

  return <div className="app-shell">
    {tour && user && !platform.isAdmin && !isMarketer && <OnboardingGuide userId={user.id} onNavigate={next => setView(next as View)} onOpenChat={() => setView('staff')} onClose={() => setTour(false)} />}
    {sidebar && <button className="sidebar-scrim" aria-label={t('إغلاق')} onClick={() => setSidebar(false)} />}
    <aside className={`sidebar ${sidebar ? 'is-open' : ''}`}><Brand /><span className="workspace-label">{workspaceLabel}</span>
      <nav aria-label={tr('قائمة الحساب', 'Account navigation')}>{visibleNavigation.map(item => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} aria-current={view === item.id ? 'page' : undefined} onClick={() => { setView(item.id); setSidebar(false); }}><item.icon size={19} /><span>{t(item.name)}</span>{view === item.id && <span className="nav-active-dot" />}</button>)}</nav><div id="account-sidebar-tools" />
      {!user && <button className="nav-item nav-signup" onClick={() => setAuth('signup')}><UserPlus size={19} /><span>{t('إنشاء حساب')}</span></button>}
      {!user && <p className="nav-locked-hint">{t('بقية الأدوات تظهر بحسب صلاحية حسابك بعد تسجيل الدخول.')}</p>}
      <div className="sidebar-note"><ShieldCheck size={23} /><strong>{t('عزل الصلاحيات والحمايات دائمة')}</strong><p>{isMarketer ? tr('صلاحيات المسوّق معزولة بالكامل عن الإدارة وبوابات التجار.', 'Marketer permissions are strictly isolated from Admin and Merchant controls.') : t('المبالغ مؤكدة من بوابة الدفع، وليست من عودة المتصفح.')}</p></div><a className="sidebar-external" href={appearanceLink('/')}>{t('العودة إلى oneShot')}<ArrowUpLeft size={16} /></a>
      {user && <button className="sidebar-logout" onClick={() => void run(async () => { localStorage.removeItem('oneshot_google_user'); await logout(); setUser(null); setView('links'); })}><LogOut size={17} />{t('تسجيل الخروج')}</button>}<span className="sidebar-version">ONESHOT / PAYMENT STUDIO</span>
    </aside>
    <main className="main-content"><header className="topbar"><div className="topbar-start"><button className="icon-button mobile-menu" aria-label={t('فتح القائمة')} onClick={() => setSidebar(true)}><Menu size={21} /></button><div className="breadcrumb"><span>oneShot</span><ArrowRight size={12} /><strong>{t(currentViewName)}</strong></div></div><div className="topbar-actions"><AppearanceControls />{user ? <span className="user-avatar" title={user.email}>{platform.isAdmin ? 'A' : isMarketer ? (platform.marketerAccount?.fullName?.slice(0, 1) || 'M') : (merchant?.name.slice(0, 1) || 'o')}</span> : <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><button className="text-button" onClick={() => setAuth('login')}>{t('تسجيل الدخول')}</button></div>}</div></header>
      <div className="page-content view-transition" key={view}>
        {notice && <div className="message success" role="status">{t(notice)}<button className="icon-button" aria-label={t('إغلاق')} onClick={() => setNotice('')}><X size={16} /></button></div>}{error && <div className="message error" role="alert">{t(error)}<button className="icon-button" aria-label={t('إغلاق')} onClick={() => setError('')}><X size={16} /></button></div>}
        {!user && <section className="welcome-banner"><div className="welcome-copy"><span className="eyebrow">ONESHOT / ACCOUNTS</span><h1>{tr('حساب واحد. مساحة تناسب دورك.', 'One sign-in. Your own workspace.')}</h1><p>{tr('سجّل الدخول للوصول إلى أدواتك، أو أنشئ حساباً واختر تاجر أو مسوّق أو لودر أو مسؤول منصة.', 'Sign in to access your tools, or create an account and choose Merchant, Marketer, Loader, or Administrator.')}</p><div className="welcome-actions"><button className="primary-button" onClick={() => setAuth('login')}>{t('تسجيل الدخول')}</button><button className="outline-button" disabled={!signupEnabled} onClick={() => setAuth('signup')}>{t('إنشاء حساب')}</button></div></div></section>}
        {user && !merchant && platform.accountRole === 'merchant' && !loading && view !== 'wallet' && <section className="panel onboarding"><h2>{t('ابدأ مساحة التاجر')}</h2><p>{t('أنشئ مساحتك المستقلة لتبدأ استقبال المدفوعات.')}</p><form onSubmit={event => { event.preventDefault(); const name = new FormData(event.currentTarget).get('name'); void run(() => api('platform', { action: 'onboard', name })); }}><label>{t('اسم المتجر')}<input name="name" required maxLength={100} /></label><button className="primary-button" disabled={busy}>{t('ابدأ مساحة التاجر')}<Plus size={17} /></button></form></section>}
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              {platform.isAdmin
                ? tr('مركز تحكم وإدارة المنصة · ADMIN SUITE', 'PLATFORM ADMINISTRATION SUITE')
                : isMarketer
                  ? tr('بوابة التسويق بالعمولة · MARKETER PORTAL', 'AFFILIATE MARKETER PORTAL')
                  : tr('علامتك. أعمالك.', 'YOUR BRAND. YOUR BUSINESS.')}
            </span>
            <h1>{t(currentViewName)}</h1>
            <p>
              {isMarketer
                ? tr('لوحة مخصصة حصرياً لصلاحيات المسوّق المعتمد: إدارة روابط الإحالة، الحملات التسويقية، ومتابعة العمولات.', 'Dedicated exclusively to marketer permissions: referral links, promotional campaigns, and commission tracking.')
                : platform.isAdmin && view === 'admin'
                  ? tr('إدارة سياسات المنصة، إدارة حسابات المسوّقين والصلاحيات (منفصلة تماماً عن حسابات التجار والمسوّقين).', 'Manage platform policies, marketer accounts, and permissions.')
                  : t(view === 'links' ? 'روابط دفع مفتوحة وفواتير مؤتمتة: شارك الرابط ليحدد العميل مبلغه أو أرسل فاتورة مخصصة مباشرة.' : 'المتاح يعتمد على إعدادات المسؤول وتفعيل حساب البوابة.')}
            </p>
          </div>
          {!isMarketer && ['overview', 'links', 'invoices'].includes(view) && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="primary-button"
                disabled={!canCreate || busy}
                onClick={() => { setGateway('telr'); setCreate('invoice'); }}
                title={t('إرسال فاتورة مباشرة ومخصصة لعميل')}
              >
                <FileText size={16} />
                {t('إرسال الفواتير')}
              </button>

              <button
                className="outline-button"
                disabled={!canCreate || busy}
                onClick={() => { setGateway('telr'); setCreate('recurring'); }}
                title={t('إرسال فواتير دورية أو اشتراك')}
              >
                <Repeat2 size={16} />
                {t('إرسال فواتير دورية')}
              </button>

              <button
                className="outline-button"
                disabled={!canCreate || !policy.openLinksEnabled || busy}
                onClick={() => { setOpenGatewayMode('single'); setOpenBuilder(true); }}
                title={t('رابط مفتوح مقيّد ببوابة محددة')}
              >
                <Link2 size={16} />
                {t('رابط مفتوح لبوابة')}
              </button>

              <button
                className="primary-button"
                style={{ background: 'linear-gradient(135deg, #ff5500, #ff7700)', borderColor: '#ff5500' }}
                disabled={!canCreate || !policy.openLinksEnabled || busy}
                onClick={() => { setOpenGatewayMode('all'); setOpenBuilder(true); }}
                title={t('رابط مفتوح موحد لجميع البوابات')}
              >
                <Sparkles size={16} />
                {t('رابط مفتوح لجميع البوابات')}
              </button>
            </div>
          )}
        </div>
        {loading && <LoadingPanel compact />}
        {view === 'wallet' && user && <Wallet key={user.id} />}
        {isMarketer && ['marketer_overview', 'marketer_campaigns', 'marketer_catalog', 'marketer_creatives'].includes(view) && (
          <MarketerDashboard
            marketerAccount={platform.marketerAccount ?? null}
            campaigns={platform.marketerCampaigns ?? []}
            activeTab={view as MarketerTab}
            onNavigateTab={tab => setView(tab)}
            onRefresh={load}
          />
        )}
        {!isMarketer && view === 'gemini_studio' && <GeminiAiStudio />}
        {!isMarketer && view === 'staff' && <AiStaffMarketplace />}
        {!isMarketer && view === 'ceo' && <CeoSuite />}
        {!isMarketer && view === 'overview' && <><div className="stats-grid"><Stat title={t('إجمالي المدفوعات')} value={money(metrics.totalPaid, locale)} suffix="SAR" icon={<CreditCard size={19} />} featured /><Stat title={t('عمليات مكتملة')} value={new Intl.NumberFormat(locale).format(metrics.paidCount)} icon={<Check size={19} />} /><Stat title={t('طلبات معلقة')} value={new Intl.NumberFormat(locale).format(metrics.pendingCount)} icon={<FileText size={19} />} /><Stat title={t('العملاء')} value={new Intl.NumberFormat(locale).format(metrics.customers)} icon={<Users size={19} />} /></div><VirtualMerchantStation />{platform.isAdmin && <div className="overview-grid"><section className="panel"><div className="section-heading"><div><span className="eyebrow">{tr('صفحة الدفع العامة', 'PUBLIC CHECKOUT PAGE')}</span><h2>{t('صفحة الدفع على pay.1shotcam.com')}</h2></div><Globe size={23} /></div><p>{t('صفحة واحدة يدفع منها عملاؤك مباشرة عبر بواباتك المفعّلة، بلا إنشاء رابط لكل عملية.')}</p><div className="open-amount-range"><span>{t('الرابط')} <strong dir="ltr">{sitePayUrl}</strong></span><span>{t('البوابات المفعّلة')} <strong>{liveGateways.length ? liveGateways.join(' · ') : t('لا توجد بوابة مفعّلة بعد')}</strong></span></div><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><button className="outline-button" onClick={() => void copy(sitePayUrl)}>{t('نسخ الرابط')}<Copy size={16} /></button><a className="outline-button" href={sitePayUrl} target="_blank" rel="noreferrer">{t('فتح الصفحة')}<ExternalLink size={16} /></a></div><p className="helper-note">{tr('تشغيل الدومين: أضف pay.1shotcam.com كـ Domain alias في Netlify ← Domain management، ثم في لوحة DNS لديك اجعل سجل CNAME باسم pay يشير إلى elegant-puppy-9ddbd7.netlify.app.', 'Going live: add pay.1shotcam.com as a domain alias in Netlify → Domain management, then point the `pay` CNAME in your DNS panel to elegant-puppy-9ddbd7.netlify.app.')}</p><p className="readiness">{liveGateways.length ? t('الصفحة فعّالة: تظهر فقط بوابات حساب المشرف المفعّلة.') : `${t('متغيرات Netlify المطلوبة قبل تفعيل الصفحة')}: ${readinessVariables.join(' · ')} — ${t('القيم تُدخل في لوحة Netlify مباشرة، ولا تُكتب في أي محادثة.')}`}</p></section></div>}<div className="overview-grid"><section className="panel activity-panel"><div className="section-heading"><h2>{t('نشاط آخر 7 أيام')}</h2><span className="subtle-tag">SAR</span></div><Activity daily={platform.daily || []} /></section><section className="panel quick-panel"><span className="eyebrow">{tr('أنشئ. شارك. حصّل.', 'CREATE. SHARE. COLLECT.')}</span><Link2 size={32} /><h2>{t('رابط مفتوح لجميع البوابات')}</h2><p>{t('رابط موحد يجمع بواباتك ويدعم التحويل والتوجيه الذكي بحسب بطاقة العميل.')}</p><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><button className="primary-button" disabled={!canCreate || !policy.openLinksEnabled} onClick={() => { setOpenGatewayMode('all'); setOpenBuilder(true); }}>{t('رابط مفتوح لجميع البوابات')}<Sparkles size={16} /></button><button className="outline-button" disabled={!canCreate || !policy.openLinksEnabled} onClick={() => { setOpenGatewayMode('single'); setOpenBuilder(true); }}>{t('رابط مفتوح لبوابة')}<Link2 size={16} /></button>{testButton}</div></section></div><div className="section-heading"><h2>{t('آخر الطلبات')}</h2></div><DocumentTable documents={platform.documents.slice(0, 6)} copy={copy} cancel={cancel} busy={busy} /></>}
        {!isMarketer && ['links', 'invoices'].includes(view) && <>{view === 'links' && <section className="panel open-links-panel"><div className="section-heading"><div><span className="eyebrow">{tr('رابط مرن. بقواعدك.', 'A LINK WITHOUT LIMITS. WITH YOUR RULES.')}</span><h2>{t('روابط بمبلغ يحدده العميل')}</h2></div><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><button className="primary-button" style={{ background: 'linear-gradient(135deg, #ff5500, #ff7700)', borderColor: '#ff5500' }} disabled={!canCreate || !policy.openLinksEnabled || busy} onClick={() => { setOpenGatewayMode('all'); setOpenBuilder(true); }}><Sparkles size={16} />{t('رابط مفتوح لجميع البوابات')}</button><button className="outline-button" disabled={!canCreate || !policy.openLinksEnabled || busy} onClick={() => { setOpenGatewayMode('single'); setOpenBuilder(true); }}><Link2 size={16} />{t('رابط مفتوح لبوابة')}</button>{testButton}</div></div>{platform.isAdmin && !choices.length && <section className="panel" style={{ marginBottom: '16px' }}><div className="section-heading"><ShieldCheck size={20} /><div><h2>{t('لا توجد بوابة مفعّلة بعد')}</h2></div></div><p>{t('لا يصدر رابط دفع حقيقي قبل تفعيل بوابة واحدة على الأقل (PayTabs أو Telr) من قسم الربط، وإضافة مفاتيح البوابة في Netlify ← Site configuration ← Environment variables.')}</p>{readinessVariables.map(name => <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><code className="share-url" dir="ltr" style={{ flex: 1 }}>{name}</code><button className="outline-button" onClick={() => void copy(name)}><Copy size={15} />{tr('نسخ', 'COPY')}</button></div>)}<p className="helper-note">{t('القيم تُدخل في لوحة Netlify مباشرة، ولا تُكتب في أي محادثة.')}</p></section>}{platform.openLinks?.length ? <div className="open-link-grid">{platform.openLinks.map(link => <article className="open-link-card" key={link.id}><div className="section-heading"><Link2 size={22} /><span className={`status-badge ${link.enabled ? 'status-active' : 'status-cancelled'}`}>{t(link.enabled ? 'نشط' : 'متوقف')}</span></div><h3>{link.title}</h3><p>{money(link.minimum, locale)} — {money(link.maximum, locale)} SAR</p><code className="share-url" dir="ltr">{openPaymentLink(link.id)}</code><div className="row-actions"><button className="outline-button" onClick={() => void copy(openPaymentLink(link.id))}><Copy size={15} />{t('نسخ الرابط')}</button><a className="icon-button" aria-label={t('فتح الرابط')} href={openPaymentLink(link.id)} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a><button className="icon-button" role="switch" aria-checked={link.enabled} aria-label={t(link.enabled ? 'متوقف' : 'نشط')} disabled={busy} onClick={() => void run(() => api('platform', { action: 'toggle-open-link', id: link.id, enabled: !link.enabled }))}>{link.enabled ? <X size={16} /> : <Check size={16} />}</button></div></article>)}</div> : <Empty title={t('لا توجد روابط مفتوحة بعد.')} />}</section>}<div className="list-toolbar"><h2>{t('طلبات بمبلغ ثابت')}</h2><label className="search-field"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('ابحث عن عميل أو طلب')} /></label></div><DocumentTable documents={filtered} copy={copy} cancel={cancel} busy={busy} /></>}
        {!isMarketer && view === 'subscriptions' && <><section className="panel documents-panel">{platform.subscriptions.length ? <div className="table-scroll"><table><thead><tr><th>{t('عنوان الطلب')}</th><th>{t('الحالة')}</th><th>{t('الخصم القادم')}</th><th /></tr></thead><tbody>{platform.subscriptions.map(subscription => <tr key={subscription.id}><td>{platform.documents.find(document => document.id === subscription.documentId)?.title || subscription.documentId}</td><td><Status value={subscription.status} /></td><td>{date(subscription.nextChargeAt, locale)}</td><td>{subscription.status !== 'cancelled' && <button className="text-button danger-text" disabled={busy} onClick={() => void run(() => api('platform', { action: 'cancel-subscription', id: subscription.id }))}>{t('إيقاف الاشتراك')}</button>}</td></tr>)}</tbody></table></div> : <Empty title={t('لا توجد اشتراكات بعد.')} />}</section><p className="helper-note">{t('تحصيل دوري بعد موافقة العميل؛ ليس تخزيناً لبيانات البطاقة.')}</p>{platform.attempts.filter(attempt => !attempt.reference && platform.documents.find(document => document.id === attempt.documentId)?.method !== 'paylink').map(attempt => <button key={attempt.id} className="outline-button recovery-button" onClick={() => setReviewAttempt(attempt.id)}><ShieldCheck size={17} />{t('مطابقة عملية غير مؤكدة')} · {platform.documents.find(document => document.id === attempt.documentId)?.title}</button>)}</>}
        {!isMarketer && view === 'integrations' && (
          <GatewayIntegrationManager platform={platform} onRefresh={load} />
        )}
        {!isMarketer && view === 'security' && (
          <SecuritySystemsManager />
        )}
        {platform.accountRole === 'loader' && platform.registrationStatus === 'approved' && view === 'loader' && (
          <LoaderTestingSuite platform={platform} userEmail={user?.email} />
        )}
        {!isMarketer && view === 'settings' && <><div className="settings-grid"><section className="panel settings-panel"><h2>{t('إعدادات التاجر')}</h2>{merchant && <form onSubmit={event => { event.preventDefault(); const name = new FormData(event.currentTarget).get('name'); void run(() => api('platform', { action: 'rename', name })); }}><label>{t('اسم المتجر')}<input name="name" key={merchant.name} defaultValue={merchant.name} required maxLength={100} /></label><label>{t('معرّف التاجر')}<input value={merchant.id} readOnly dir="ltr" /></label><button className="primary-button" disabled={busy}>{t('حفظ')}<Check size={16} /></button></form>}<div className="divider" /><button className="outline-button" onClick={() => void install()}><Download size={16} />{t('تثبيت التطبيق')}</button></section><section className="panel settings-panel"><h2>{t('بوابة الدفع')}</h2><p>{t('أسماء المتغيرات فقط؛ لا تدخل المفاتيح هنا.')}</p>{[{ label: 'PayTabs', prefix: platform.credentialPrefix, suffixes: ['PROFILE_ID', 'SERVER_KEY', 'API_BASE_URL', 'CLIENT_KEY', 'MANAGED_ENABLED', 'OWN_ENABLED', 'RECURRING_ENABLED'] }, { label: 'Telr', prefix: platform.telrPrefix, suffixes: ['STORE_ID', 'SERVICE_API_KEY', 'TEST_MODE'] }].map(provider => <div className="gateway-config" key={provider.label}><h3>{provider.label}</h3>{provider.prefix && <div className="config-list" dir="ltr">{provider.suffixes.map(suffix => <code key={suffix}>{provider.prefix}_{suffix}</code>)}</div>}</div>)}<p className="helper-note">{t('أضف القيم في Netlify بنطاق Functions، ثم أعد النشر.')}</p><button className="outline-button" disabled={loading} onClick={() => void load()}><RefreshCw size={16} />{t('إعادة فحص الربط')}</button></section></div><section className="panel settings-panel connect-panel"><h2>{t('دخول واحد. أعمال أكثر.')}</h2><p>{t('ضع هذين الرابطين على زري موقع oneShot الآخر. الربط ينقل الزائر ولا يشارك جلسات الحسابات بين النطاقات.')}</p>{[{ title: 'رابط الدخول', path: '/sign-in' }, { title: 'رابط إنشاء الحساب', path: '/sign-up' }].map(link => <div key={link.path} className="connect-link"><strong>{t(link.title)}</strong><code dir="ltr">{appearanceLink(link.path)}</code><button className="icon-button" aria-label={t('نسخ الرابط')} onClick={() => void copy(appearanceLink(link.path))}><Copy size={16} /></button></div>)}</section><Safeguards /></>}
        {isMarketer && isMarketerApproved && view === 'marketer_gateways' && <MerchantGatewayLookup />}
        {platform.accountRole === 'admin' && !platform.isAdmin && <section className="panel"><h2>{tr('طلب صلاحيات الإدارة', 'Administrator access requested')}</h2><p>{tr('تم تسجيل الحساب. تتوفر أدوات الإدارة بعد منح الصلاحيات من مسؤول مخوّل.', 'Your account is registered. Administrator tools become available after an authorized administrator grants access.')}</p></section>}
        {view === 'admin' && platform.isAdmin && <AdminControls platform={platform} onSave={load} />}
        {view === 'assistant' && platform.isAdmin && user && <OperationsCenter key={user.id} onRefresh={load} />}
        <footer className="dashboard-footer"><span>oneShot <strong>Payment Studio</strong></span><span>{t('المبالغ مؤكدة من بوابة الدفع، وليست من عودة المتصفح.')}</span></footer>
      </div>
    </main>
    {auth && <Modal title={t(({ login: 'تسجيل الدخول', signup: 'إنشاء حساب', reset: 'استعادة كلمة المرور', password: 'كلمة مرور جديدة', invite: 'قبول الدعوة' } as const)[auth])} close={closeAuth}>
      {['login', 'signup'].includes(auth) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '16px', background: 'rgba(255,255,255,0.04)', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            className={auth === 'signup' ? 'primary-button' : 'text-button'}
            style={{ justifyContent: 'center', padding: '8px 10px', fontSize: '0.84rem' }}
            disabled={!signupEnabled}
            onClick={() => { setError(''); setNotice(''); setAuth('signup'); }}
          >
            <UserPlus size={14} />
            {tr('إنشاء حساب', 'Register')}
          </button>
          <button
            type="button"
            className={auth === 'login' ? 'primary-button' : 'text-button'}
            style={{ justifyContent: 'center', padding: '8px 10px', fontSize: '0.84rem' }}
            onClick={() => { setError(''); setNotice(''); setAuth('login'); }}
          >
            {tr('دخول الأعضاء', 'Sign In')}
          </button>
        </div>
      )}
      {auth === 'login' && googleEnabled && (
        <div className="google-auth-container">
          <button
            type="button"
            className="google-sign-in-button"
            onClick={handleGoogleSignIn}
            disabled={busy}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{t('تسجيل الدخول باستخدام Google')}</span>
          </button>
          <div className="auth-separator">
            <span>{tr('أو عبر البريد الإلكتروني', 'or with email')}</span>
          </div>
        </div>
      )}
      {auth === 'signup' && !signupEnabled ? (
        <p>{t('التسجيل غير متاح حالياً.')}</p>
      ) : (
        <form onSubmit={event => void authenticate(event)}>
          {auth === 'signup' && (
            <>
              <label>{tr('نوع الحساب', 'Account type')}
                <select value={signupRole} onChange={event => setSignupRole(event.target.value as typeof signupRole)}>
                  <option value="merchant">{tr('تاجر', 'Merchant')}</option>
                  <option value="marketer">{tr('مسوّق', 'Marketer')}</option>
                  <option value="loader">{tr('لودر', 'Loader')}</option>
                  <option value="admin">{tr('مسؤول منصة — يتطلب منح الصلاحيات', 'Administrator — access must be granted')}</option>
                </select>
              </label>
              <label>
                {tr(signupRole === 'marketer' ? 'اسم المسوّق الكامل' : 'اسم التاجر الكامل', 'Full Name')}
                <input name="name" autoComplete="name" required maxLength={100} />
              </label>

              {signupRole === 'merchant' ? (
                <label>
                  {tr('اسم المتجر أو النشاط التجاري (يُنشأ تلقائياً)', 'Store / Business Name (Auto-provisioned)')}
                  <input
                    name="storeName"
                    maxLength={100}
                    value={signupStoreName}
                    onChange={e => setSignupStoreName(e.target.value)}
                    placeholder={tr('اتركه فارغاً لاستخدام اسمك تلقائياً', 'Leave blank to use your name automatically')}
                  />
                </label>
              ) : (
                <label>
                  {tr('قنوات التسويق أو نبذة لطلب الاعتماد (اختياري)', 'Account notes (optional)')}
                  <input
                    name="marketerNotes"
                    maxLength={300}
                    value={signupMarketerNotes}
                    onChange={e => setSignupMarketerNotes(e.target.value)}
                    placeholder={tr('مثال: مسوّق عبر سناب شات وإعلانات جوجل...', 'e.g. Snapchat & Google Ads affiliate marketer...')}
                  />
                </label>
              )}
            </>
          )}
          {!['password', 'invite'].includes(auth) && (
            <label>
              {t('البريد الإلكتروني')}
              <input name="email" type="email" autoComplete="email" required dir="ltr" maxLength={254} />
            </label>
          )}
          {auth !== 'reset' && (
            <label>
              {t('كلمة المرور')}
              <input
                name="password"
                type="password"
                autoComplete={['login'].includes(auth) ? 'current-password' : 'new-password'}
                minLength={auth === 'login' ? undefined : 8}
                required
                dir="ltr"
              />
            </label>
          )}
          <button className="primary-button full-width" disabled={busy}>
            {t(
              busy
                ? 'جارٍ التنفيذ…'
                : auth === 'reset'
                  ? 'إرسال رابط الاستعادة'
                  : auth === 'login'
                      ? 'تسجيل الدخول'
                      : auth === 'signup'
                        ? 'إنشاء الحساب'
                        : 'حفظ',
            )}
            <ArrowUpLeft size={17} />
          </button>
          {['login'].includes(auth) && (
            <div className="auth-links">
              <button className="text-button" type="button" onClick={() => setAuth('reset')}>
                {t('نسيت كلمة المرور')}
              </button>
              {auth === 'login' && (
                <button className="text-button" type="button" disabled={!signupEnabled} onClick={() => setAuth('signup')}>
                  {t('إنشاء حساب')}
                </button>
              )}
            </div>
          )}
        </form>
      )}
      {auth === 'signup' && !autoconfirm && (
        <p className="modal-description">
          {signupRole === 'merchant'
            ? tr('يُنشأ حساب التاجر ومساحة متجرك تلقائياً وفوراً بعد التسجيل.', 'Your merchant account and workspace are created automatically upon signup.')
            : tr('تتفعّل حسابات المسوّق واللودر تلقائياً بعد تأكيد البريد. صلاحيات الإدارة تُمنح بشكل منفصل.', 'Marketer and loader accounts activate automatically after email confirmation. Administrator permissions are granted separately.')}
        </p>
      )}
      {error && <p className="form-error" role="alert">{t(error)}</p>}
      {notice && <p className="message success" role="status">{t(notice)}</p>}
    </Modal>}
    {create && <Modal title={t(create === 'invoice' ? 'إرسال فاتورة جديدة للعميل' : create === 'recurring' ? 'إرسال فاتورة دورية (اشتراك)' : 'طلب دفع جديد')} close={() => setCreate(null)}><form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void run(async () => { await api('platform', { action: 'create', gateway, method: create, title: data.get('title'), customerName: data.get('customerName'), customerEmail: data.get('customerEmail'), amount: data.get('amount'), interval: data.get('interval') }); setCreate(null); setView('links'); }); }}><label>{t('عنوان الفاتورة أو الخدمة')}<input name="title" defaultValue={create === 'invoice' ? 'فاتورة خدمة وتكامل مالي' : 'طلب دفع'} required maxLength={150} /></label><div className="form-row"><label>{t('اسم العميل')}<input name="customerName" placeholder="مثال: شركة الرواد" required maxLength={100} /></label><label>{t('المبلغ بالريال السعودي')}<input name="amount" type="number" min="1" max="9999999.99" step="0.01" required dir="ltr" placeholder="0.00" /></label></div><label>{t('بريد العميل لإرسال الفاتورة')}<input name="customerEmail" type="email" required maxLength={254} dir="ltr" placeholder="client@example.sa" /></label><label>{t('بوابة الدفع المعتمدة')}<select aria-label={t('بوابة الدفع')} value={gateway} onChange={event => { setGateway(event.target.value as Gateway); }}><option value="telr">Telr (حساب المتجر 35574 - فاينانس ميرشنت)</option><option value="paytabs">PayTabs</option><option value="ngenius">N-Genius KSA</option><option value="tap">Tap Payments</option></select></label><label>{t('طريقة الدفع')}<select aria-label={t('طريقة الدفع')} value={create} onChange={event => setCreate(event.target.value as Method)}>{methods.filter(method => caps?.[method.id] === true || (method.id === 'invoice' && gateway === 'telr')).map(method => <option key={method.id} value={method.id} disabled={!caps?.[method.id] && method.id !== 'invoice'}>{t(method.name)}{caps?.[method.id] || method.id === 'invoice' ? '' : ` — ${t('غير مهيأ')}`}</option>)}</select></label>{create === 'recurring' && <label>{t('التجديد التلقائي')}<select name="interval"><option value="monthly">{t('شهري')}</option><option value="yearly">{t('سنوي')}</option></select></label>}<button className="primary-button full-width" disabled={busy || !canCreate}>{t('إنشاء وإرسال الفاتورة')}<Link2 size={17} /></button></form>{error && <p className="form-error" role="alert">{t(error)}</p>}</Modal>}
    {openBuilder && <Modal title={t(openGatewayMode === 'all' ? 'رابط مفتوح لجميع البوابات (Multi-Gateway)' : 'رابط مفتوح لبوابة محددة (Single Gateway)')} close={() => setOpenBuilder(false)}><div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}><button type="button" className={openGatewayMode === 'all' ? 'primary-button' : 'outline-button'} style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }} onClick={() => setOpenGatewayMode('all')}><Sparkles size={15} />{t('لجميع البوابات')}</button><button type="button" className={openGatewayMode === 'single' ? 'primary-button' : 'outline-button'} style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }} onClick={() => setOpenGatewayMode('single')}><Link2 size={15} />{t('لبوابة واحدة')}</button></div><p className="modal-description">{t(openGatewayMode === 'all' ? 'رابط موحد يجمع بوابات Telr وPayTabs ومدى وApple Pay معاً؛ يحدد العميل مبلغه ويختار البوابة الأنسب.' : 'رابط مفتوح مخصص لبوابة دفع واحدة محددة (مثل Telr Store 35574 فقط).')}</p><form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void run(async () => { await api('platform', { action: 'create-open-link', title: data.get('title'), minimum: data.get('minimum'), maximum: data.get('maximum'), allowedMethods: data.getAll('choices') }); setOpenBuilder(false); setView('links'); }); }}><label>{t('عنوان الرابط المفتوح')}<input name="title" defaultValue={openGatewayMode === 'all' ? 'رابط دفع عام - جميع البوابات المتاحة' : 'رابط دفع مخصص - بوابة Telr'} required maxLength={150} /></label><div className="form-row"><label>{t('الحد الأدنى')}<input name="minimum" type="number" defaultValue="1" min="1" max="9999999.99" step="0.01" required dir="ltr" /></label><label>{t('الحد الأعلى')}<input name="maximum" type="number" defaultValue="10000" min="1" max="9999999.99" step="0.01" required dir="ltr" /></label></div><fieldset className="method-choices"><legend>{t('طرق الدفع المسموحة بالرابط')}</legend>{choices.filter(choice => openGatewayMode === 'all' || (openGatewayMode === 'single' && choice.value.startsWith('telr'))).map(choice => <label className="consent" key={choice.value}><input type="checkbox" name="choices" value={choice.value} defaultChecked /><span>{choice.name}</span></label>)}{!choices.length && <p className="form-error">{t('لا توجد طريقة مهيأة. أكمل إعدادات التاجر أولاً.')}</p>}</fieldset><button className="primary-button full-width" disabled={busy || !choices.length || !canCreate || !policy.openLinksEnabled}>{t('إنشاء الرابط المفتوح')}<Link2 size={17} /></button></form>{error && <p className="form-error" role="alert">{t(error)}</p>}</Modal>}
    {reviewAttempt && <Modal title={t('مطابقة عملية غير مؤكدة')} close={() => setReviewAttempt(null)}><p className="modal-description">{t('انسخ المرجع من لوحة البوابة. يتحقق الخادم من التاجر والمبلغ والطلب.')}</p><form onSubmit={event => { event.preventDefault(); const reference = new FormData(event.currentTarget).get('reference'); void run(async () => { await api('platform', { action: 'verify', id: reviewAttempt, reference }); setReviewAttempt(null); }); }}><label>{t('مرجع العملية')}<input name="reference" required maxLength={100} dir="ltr" /></label><button className="primary-button" disabled={busy}>{t('مطابقة آمنة')}<ShieldCheck size={17} /></button></form>{error && <p className="form-error">{t(error)}</p>}</Modal>}
  </div>;
}

function Stat({ title, value, suffix, icon, featured }: { title: string; value: string; suffix?: string; icon: ReactNode; featured?: boolean }) {
  return <article className={`stat-card ${featured ? 'featured' : ''}`}><div className="stat-top"><span>{title}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}<small>{suffix}</small></div></article>;
}

function Activity({ daily }: { daily: { day: string; amount: number }[] }) {
  const { locale } = useAppearance();
  const days = Array.from({ length: 7 }, (_, index) => { const day = new Date(); day.setUTCHours(0, 0, 0, 0); day.setUTCDate(day.getUTCDate() - 6 + index); return { date: day, amount: daily.find(item => item.day === day.toISOString().slice(0, 10))?.amount || 0 }; });
  const max = Math.max(...days.map(day => day.amount), 100);
  return <div className="chart"><div className="chart-grid" aria-hidden="true"><span /><span /><span /><span /></div>{days.map(day => <div className="chart-column" key={day.date.toISOString()}><div className="chart-value">{day.amount ? money(day.amount, locale) : ''}</div><div className="bar-track"><div className={`chart-bar ${day.amount ? '' : 'empty-bar'}`} style={{ height: `${day.amount ? Math.max(4, day.amount / max * 100) : 2}%` }} title={`${money(day.amount, locale)} SAR`} /></div><small>{new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day.date)}</small></div>)}</div>;
}

function DocumentTable({ documents, copy, cancel, busy }: { documents: PaymentDocument[]; copy: (url: string) => Promise<void>; cancel: (document: PaymentDocument) => void; busy: boolean }) {
  const { t, locale } = useAppearance();
  return <section className="panel documents-panel">{!documents.length ? <Empty title={t('لا توجد طلبات بعد.')} /> : <div className="table-scroll"><table><thead><tr>{['العميل / الطلب', 'المبلغ', 'طريقة الدفع', 'الحالة', 'التاريخ', 'الرابط'].map(label => <th key={label}>{t(label)}</th>)}</tr></thead><tbody>{documents.map(document => <tr key={document.id}><td><div className="customer-cell"><span className="customer-avatar">{document.customerName.slice(0, 1)}</span><div><strong>{document.customerName}</strong><small>{document.title}</small></div></div></td><td className="amount-cell">{money(document.amount, locale)} <small>SAR</small></td><td>{gatewayName(document.gateway)} · {t(methods.find(method => method.id === document.method)?.name || '')}</td><td><Status value={document.status} /></td><td className="date-cell">{date(document.createdAt, locale)}</td><td><div className="row-actions"><button className="icon-button" aria-label={t('نسخ الرابط')} onClick={() => void copy(paymentLink(document.id))}><Copy size={16} /></button><a className="icon-button" aria-label={t('فتح الرابط')} href={paymentLink(document.id)} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>{document.status === 'pending' && <button className="icon-button danger-text" disabled={busy} aria-label={t('إلغاء')} onClick={() => cancel(document)}><X size={16} /></button>}</div></td></tr>)}</tbody></table></div>}</section>;
}

export function Status({ value }: { value: string }) {
  const { t } = useAppearance();
  return <span className={`status-badge status-${value}`}><span />{t(statuses[value] || value)}</span>;
}

function Empty({ title }: { title: string }) { return <div className="empty-state"><div className="empty-icon"><Link2 size={27} /></div><h3>{title}</h3></div>; }

export function Safeguards() {
  const { t } = useAppearance();
  return <div className="security-banner"><ShieldCheck size={25} /><div><strong>{t('الحمايات الأساسية دائمة')}</strong><p>{t('توقيع الإشعارات، تأكيد المبلغ والتاجر، عزل الحسابات وحماية المفاتيح لا يمكن تعطيلها. CVV و3D Secure ومكافحة الاحتيال تُدار لدى البوابة.')}</p></div></div>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const { t } = useAppearance();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog className="modal" ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); close(); }}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={close} aria-label={t('إغلاق')}><X size={21} /></button></div>{children}</dialog>;
}

function AdminControls({ platform, onSave }: { platform: Platform; onSave: () => Promise<void> }) {
  const { t, tr } = useAppearance();
  const [adminTab, setAdminTab] = useState<'marketer_approvals' | 'ai_tiers' | 'failures_dashboard' | 'multi_bin_matcher' | 'country_matrix' | 'ai_bin' | 'ip_spoofing' | 'fraud_toolkit' | 'policies'>('marketer_approvals');
  const [ollamaConfig, setOllamaConfig] = useState<OllamaServerConfig>(getSavedOllamaConfig);
  const [policy, setPolicy] = useState<PaymentPolicy | null>(null);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [inspectKey, setInspectKey] = useState<string | null>(null);
  const pendingMarketersCount = (platform.adminMarketers ?? []).filter(m => m.status === 'pending').length;
  const fetchSettings = useCallback(async () => { try { const result = await api<{ policy: PaymentPolicy; version: number }>('admin-settings'); setPolicy(result.policy); setVersion(result.version); } catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.'); } }, []);
  useEffect(() => { void fetchSettings(); }, [fetchSettings]);
  async function save() {
    setBusy(true); setError(''); setNotice('');
    try { const result = await api<{ policy: PaymentPolicy; version: number }>('admin-settings', { policy, version }); setPolicy(result.policy); setVersion(result.version); setNotice('تم الحفظ.'); await onSave(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر إتمام الطلب.'); }
    finally { setBusy(false); }
  }
  function all(enabled: boolean) { setPolicy({ paymentsEnabled: enabled, requestsEnabled: enabled, openLinksEnabled: enabled, aiEnabled: enabled, gateways: Object.fromEntries(gateways.map(name => [name, enabled])) as Record<Gateway, boolean>, methods: Object.fromEntries(methods.map(method => [method.id, enabled])) as PaymentPolicy['methods'] }); }

  return (
    <div className="admin-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {document.getElementById('account-sidebar-tools') && createPortal((
      <div className="admin-nav-tabs" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="outline-button"
          style={adminTab === 'marketer_approvals' ? { background: '#ff5500', color: '#ffffff', borderColor: '#ff5500', fontWeight: 'bold' } : { fontWeight: '600' }}
          onClick={() => setAdminTab('marketer_approvals')}
        >
          <UserCheck size={18} />
          <span>
            {tr('حسابات المسوّقين والعمولات', 'Marketer accounts and commissions')}
            {pendingMarketersCount > 0 ? ` (${pendingMarketersCount})` : ''}
          </span>
        </button>



        <button
          type="button"
          className="outline-button"
          style={adminTab === 'failures_dashboard' ? { background: '#ef4444', color: '#ffffff', borderColor: '#ef4444', fontWeight: 'bold' } : { fontWeight: '600' }}
          onClick={() => setAdminTab('failures_dashboard')}
        >
          <BarChart3 size={18} />
          <span>{t('تحليل حالات رفض المدفوعات')}</span>
        </button>



        <button
          type="button"
          className="outline-button"
          style={adminTab === 'country_matrix' ? { background: '#ff5500', color: '#ffffff', borderColor: '#ff5500', fontWeight: 'bold' } : { fontWeight: '600' }}
          onClick={() => setAdminTab('country_matrix')}
        >
          <CreditCard size={18} />
          <span>{t('فاحص توافقية الدول والبطاقات (Country Matrix & BIN)')}</span>
        </button>







        <button
          type="button"
          className="outline-button"
          style={adminTab === 'policies' ? { background: '#ff5500', color: '#ffffff', borderColor: '#ff5500', fontWeight: 'bold' } : { fontWeight: '600' }}
          onClick={() => setAdminTab('policies')}
        >
          <SlidersHorizontal size={18} />
          <span>{t('سياسات المنصة وتراخيص البوابات')}</span>
        </button>
      </div>
      ), document.getElementById('account-sidebar-tools')!)}

      {adminTab === 'marketer_approvals' && (
        <MarketerApprovalAdmin marketers={platform.adminMarketers ?? []} onRefresh={onSave} />
      )}

      {adminTab === 'ai_tiers' && (
        <AiTierManager
          config={ollamaConfig}
          onConfigChange={(newCfg) => {
            setOllamaConfig(newCfg);
            saveOllamaConfig(newCfg);
          }}
          license={{ tier: 'tier-3', tierX: true, staff: [], admin: true, tiers: ['tier-1', 'tier-2', 'tier-3', 'tier-x'], source: 'admin' }}
        />
      )}

      {adminTab === 'ai_tiers' && <AiLicenseAdmin />}

      {adminTab === 'failures_dashboard' && (
        <PaymentFailuresDashboard />
      )}

      {adminTab === 'multi_bin_matcher' && (
        <MultiBinAcceptanceTool />
      )}

      {adminTab === 'country_matrix' && (
        <GatewayCountryMatrixManager />
      )}

      {adminTab === 'ai_bin' && (
        <AiBinIntelligenceCenter />
      )}

      {adminTab === 'fraud_toolkit' && (
        <FraudSimulationToolkit />
      )}

      {adminTab === 'ip_spoofing' && (
        <AdminIpSpoofingManager onNotify={setNotice} />
      )}

      {adminTab === 'policies' && (
        <section className="panel settings-panel admin-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{tr('مركز إدارة المنصة', 'PLATFORM CONTROL ROOM')}</span>
              <h2>{t('إدارة سياسات وميزات المنصة')}</h2>
              <p>{t('التحكم للمسؤول فقط ويُطبّق من الخادم.')}</p>
            </div>
            <ShieldCheck size={28} />
          </div>
          <p><button className="text-button" onClick={() => void fetchSettings()}>{t('إعادة فحص الربط')}</button></p>
          {policy && (
            <>
              <div className="admin-actions">
                <button className="outline-button" disabled={busy} onClick={() => all(true)}>{t('تشغيل جميع الميزات')}</button>
                <button className="outline-button danger-text" disabled={busy} onClick={() => all(false)}>{t('إيقاف جميع الميزات')}</button>
              </div>
              <div className="toggle-grid">
                {([{ key: 'paymentsEnabled', label: 'استقبال المدفوعات' }, { key: 'requestsEnabled', label: 'إنشاء طلبات جديدة' }, { key: 'openLinksEnabled', label: 'الروابط المفتوحة' }, { key: 'aiEnabled', label: 'مساعد التعبئة الذكي' }] as const).map(flag => (
                  <Toggle key={flag.key} label={t(flag.label)} checked={policy[flag.key]} disabled={busy} onChange={value => setPolicy({ ...policy, [flag.key]: value })} onInspect={() => setInspectKey(flag.key)} />
                ))}
                {gateways.map(provider => (
                  <Toggle key={provider} label={gatewayName(provider)} checked={policy.gateways[provider]} disabled={busy} onChange={value => setPolicy({ ...policy, gateways: { ...policy.gateways, [provider]: value } })} />
                ))}
                {methods.map(method => (
                  <Toggle key={method.id} label={t(method.name)} checked={policy.methods[method.id]} disabled={busy} onChange={value => setPolicy({ ...policy, methods: { ...policy.methods, [method.id]: value } })} />
                ))}
              </div>
              <p className="helper-note">{t('المتاح يعتمد على إعدادات المسؤول وتفعيل حساب البوابة.')}</p>
              <p className="helper-note">{t('إيقاف ميزة لا يلغي جلسة دفع بدأت بالفعل لدى البوابة.')}</p>
              <button className="primary-button" disabled={busy} onClick={() => void save()}>{t(busy ? 'جارٍ التنفيذ…' : 'حفظ إعدادات المنصة')}<Check size={17} /></button>
            </>
          )}
          <Safeguards />
        </section>
      )}

      {inspectKey && (
        <FeaturePropertiesModal propertyKey={inspectKey} onClose={() => setInspectKey(null)} />
      )}
    </div>
  );
}

function Toggle({ label, checked, disabled, onChange, onInspect }: { label: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void; onInspect?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <label className="toggle-row" style={{ flex: 1, margin: 0 }}>
        <span>{label}</span>
        <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
        <span className="toggle-track" aria-hidden="true" />
      </label>
      {onInspect && (
        <button
          type="button"
          className="info-prop-dot"
          onClick={e => { e.preventDefault(); e.stopPropagation(); onInspect(); }}
          title="معاينة خصائص وتأثير هذه الخاصية"
          style={{ marginRight: '6px' }}
        >
          ?
        </button>
      )}
    </div>
  );
}
