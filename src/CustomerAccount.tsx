import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getSettings, getUser, handleAuthCallback, login, logout, onAuthChange, requestPasswordRecovery, signup, updateUser, type User } from '@netlify/identity';
import { ArrowUpLeft, CheckCircle2, MailCheck, RefreshCw, ShieldCheck, ShoppingBag, WalletCards } from 'lucide-react';
import { AppearanceControls, Brand } from './Brand';
import { appearanceLink, useAppearance } from './i18n';
import { api } from './platform';
import { walletServices } from '../shared/services';
import {
  clearStoredReturnDestination,
  formatLocalizedAuthError,
  normalizePathname,
  persistReturnDestination,
  resolveCustomerReturnDestination,
} from './storefront/routes';
import './CustomerAccount.css';

type Profile = { fullName: string; email: string; phone: string };
type Mode = 'login' | 'signup' | 'reset' | 'password' | 'confirm';

interface CustomerAccountProps {
  initialReturnTo?: string | null;
  initialSku?: string | null;
  onAuthenticated?: (user: User) => void;
}

export default function CustomerAccount({
  initialReturnTo,
  initialSku,
  onAuthenticated,
}: CustomerAccountProps = {}) {
  const { tr, language, number } = useAppearance();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<Mode>(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get('mode');
    if (requestedMode === 'password') return 'password';
    if (requestedMode === 'signup') return 'signup';
    if (requestedMode === 'confirm') return 'confirm';
    if (requestedMode === 'reset') return 'reset';
    return 'login';
  });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingName, setPendingName] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const initialization = useRef<Promise<Awaited<ReturnType<typeof handleAuthCallback>>> | null>(null);

  const resolvedReturn = resolveCustomerReturnDestination(window.location.search, window.location.pathname);
  const targetDestination = initialReturnTo
    ? persistReturnDestination(initialReturnTo, initialSku) || resolvedReturn.destination
    : resolvedReturn.destination;
  const activeSku = initialSku || resolvedReturn.sku;
  const selectedService = activeSku ? walletServices.find(item => item.sku === activeSku) : undefined;

  useEffect(() => {
    if (targetDestination && targetDestination !== '/customer') {
      persistReturnDestination(targetDestination, activeSku);
    }
  }, [targetDestination, activeSku]);

  useEffect(() => {
    const onWalletRoute = normalizePathname(window.location.pathname) === '/wallet';
    if (onWalletRoute) {
      document.title = tr(
        'محفظة العميل وشراء الخدمات | oneShot Brand Studio',
        'Customer Wallet & Service Checkout | oneShot Brand Studio',
      );
    } else {
      document.title = tr(
        'حساب العميل | oneShot Brand Studio',
        'Customer Account | oneShot Brand Studio',
      );
    }
  }, [language, tr]);

  function redirectIfNeeded(authenticatedUser: User, currentMode: Mode) {
    if (currentMode === 'password') return false;
    if (onAuthenticated) {
      onAuthenticated(authenticatedUser);
      return true;
    }
    const { destination } = resolveCustomerReturnDestination(window.location.search, window.location.pathname);
    if (destination && destination !== '/customer' && normalizePathname(window.location.pathname) !== normalizePathname(destination.split('?')[0])) {
      clearStoredReturnDestination();
      window.location.replace(appearanceLink(destination));
      return true;
    }
    return false;
  }

  async function refresh(currentMode = mode) {
    const current = await getUser();
    setUser(current);
    setProfile(null);
    if (current) {
      if (redirectIfNeeded(current, currentMode)) return;
      const result = await api<{ profile: Profile }>('customer-profile');
      setProfile(result.profile);
    }
  }

  useEffect(() => {
    let active = true;
    initialization.current ??= handleAuthCallback();
    void (async () => {
      try {
        const callback = await initialization.current;
        if (!active) return;
        let initialMode: Mode = mode;
        if (callback?.type === 'recovery') {
          initialMode = 'password';
          setMode('password');
        }
        try {
          const settings = await getSettings();
          if (active) setSignupEnabled(!settings.disableSignup);
        } catch {
          // Keep signup enabled by default when settings endpoint is unreachable in local/offline preview
        }
        if (!active) return;
        await refresh(initialMode);
      } catch (caught) {
        if (active) setError(formatLocalizedAuthError(caught, tr));
      } finally {
        if (active) setReady(true);
      }
    })();
    const unsubscribe = onAuthChange(event => {
      if (event === 'logout' && active) {
        setUser(null);
        setProfile(null);
        setMode('login');
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const email = String(data.get('email') || pendingEmail || '').trim();
      const password = String(data.get('password') || '');
      if (mode === 'password') {
        await updateUser({ password });
        setMode('login');
        setNotice(tr('تم تحديث كلمة المرور بنجاح.', 'Password updated successfully.'));
        const current = await getUser();
        if (current && redirectIfNeeded(current, 'login')) return;
        history.replaceState(null, '', appearanceLink(targetDestination || '/customer'));
        await refresh('login');
      } else if (user) {
        const result = await api<{ profile: Profile }>('customer-profile', {
          fullName: data.get('fullName'),
          phone: data.get('phone'),
        });
        setProfile(result.profile);
        setNotice(tr('تم حفظ بياناتك بنجاح.', 'Your details have been saved.'));
      } else if (mode === 'reset') {
        await requestPasswordRecovery(email);
        if (targetDestination && targetDestination !== '/customer') {
          persistReturnDestination(targetDestination, activeSku);
        }
        setNotice(
          tr(
            'إذا كان البريد مسجلاً، ستصلك رسالة لاستعادة كلمة المرور مع الاحتفاظ بوجهتك المختارة.',
            'If this email is registered, you will receive a password recovery link and return to your selected service.',
          ),
        );
      } else if (mode === 'signup') {
        const fullName = String(data.get('fullName') || '').trim();
        if (targetDestination && targetDestination !== '/customer') {
          persistReturnDestination(targetDestination, activeSku);
        }
        setPendingEmail(email);
        setPendingName(fullName);
        setPendingPassword(password);
        const result = await signup(email, password, {
          full_name: fullName,
          account_type: 'customer',
          ...(activeSku ? { pending_sku: activeSku } : {}),
          ...(targetDestination ? { return_to: targetDestination } : {}),
        });
        if (result.authenticated) {
          await refresh('login');
        } else {
          setMode('confirm');
          setNotice(
            tr(
              'أرسلنا رابط تأكيد الحساب إلى بريدك الإلكتروني. افتح الرسالة لتفعيل الحساب ثم تابع مباشرة.',
              'We sent a confirmation link to your email address. Open the email to activate your account, then continue.',
            ),
          );
        }
      } else {
        await login(email, password);
        await refresh('login');
      }
    } catch (caught) {
      setError(formatLocalizedAuthError(caught, tr));
    } finally {
      setBusy(false);
    }
  }

  async function resendOrRetryConfirmation() {
    if (!pendingEmail) {
      changeMode('signup');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (pendingPassword) {
        try {
          await login(pendingEmail, pendingPassword);
          await refresh('login');
          return;
        } catch {
          // Account not yet confirmed; attempt safe re-signup/resend
        }
        await signup(pendingEmail, pendingPassword, {
          full_name: pendingName,
          account_type: 'customer',
          ...(activeSku ? { pending_sku: activeSku } : {}),
          ...(targetDestination ? { return_to: targetDestination } : {}),
        });
      }
      setNotice(
        tr(
          'تم إرسال طلب تأكيد جديد. تحقق من صندوق الوارد والرسائل غير المرغوب فيها (Spam)، ثم اضغط تسجيل الدخول بعد التفعيل.',
          'A fresh confirmation request was sent. Check your inbox and spam folder, then click Sign in once confirmed.',
        ),
      );
    } catch (caught) {
      setError(formatLocalizedAuthError(caught, tr));
    } finally {
      setBusy(false);
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    setError('');
    setNotice('');
  }

  const walletHref = appearanceLink(activeSku ? `/wallet?sku=${encodeURIComponent(activeSku)}` : '/wallet');

  return (
    <div className="customer-account" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="customer-header">
        <a href={appearanceLink('/')} aria-label="oneShot Brand Studio">
          <Brand />
        </a>
        <div className="customer-header-actions">
          <a href={appearanceLink('/products')} className="customer-nav-link">
            <ShoppingBag size={16} />
            <span>{tr('كتالوج الخدمات', 'Services Catalog')}</span>
          </a>
          <a href={walletHref} className="customer-nav-link customer-nav-wallet">
            <WalletCards size={16} />
            <span>{tr('المحفظة', 'Wallet')}</span>
          </a>
          <AppearanceControls />
        </div>
      </header>
      <main className="customer-layout">
        <section className="customer-story">
          <span className="customer-kicker">ONESHOT / YOUR ACCOUNT</span>
          <h1>
            {tr('كل بداية قوية،', 'Every great start,')}
            <br />
            <em>{tr('تبدأ بخطوة.', 'starts with one shot.')}</em>
          </h1>
          <p>
            {tr(
              'مساحتك الخاصة كعميل في oneShot. حساب واحد لحفظ بياناتك، شحن محفظتك، وشراء الخدمات الجاهزة فوراً دون تحويلك إلى حساب تاجر.',
              'Your dedicated customer space at oneShot. One account to keep your details, top up your wallet, and purchase ready-to-sell services without becoming a merchant.',
            )}
          </p>
          {selectedService && (
            <div className="customer-selected-service" role="status">
              <WalletCards size={20} />
              <div>
                <strong>
                  {selectedService.sku} · {tr(selectedService.nameAr, selectedService.nameEn)}
                </strong>
                <span>
                  {tr('الخدمة المختارة محفوظة لك — السعر الثابت: ', 'Selected service preserved — fixed price: ')}
                  {number(selectedService.amount)} SAR
                </span>
              </div>
            </div>
          )}
          <div className="customer-trust">
            <ShieldCheck size={22} />
            <span>{tr('دخول آمن. بياناتك ومحفظتك في مساحتك.', 'Secure sign-in. Your details and wallet, in your space.')}</span>
          </div>
          <div className="customer-quick-links">
            <a href={walletHref} className="customer-wallet-cta">
              <WalletCards size={18} />
              <span>
                {activeSku
                  ? tr(`المتابعة إلى المحفظة لشراء (${activeSku})`, `Continue to Wallet for (${activeSku})`)
                  : tr('فتح محفظة العميل وشراء الخدمات', 'Open Customer Wallet & Services')}
              </span>
            </a>
            <a href={appearanceLink('/')} className="customer-back">
              {tr('العودة إلى الاستوديو', 'Back to the studio')} <ArrowUpLeft size={18} />
            </a>
          </div>
        </section>
        <section className="customer-card" aria-busy={busy || !ready}>
          <span className="customer-kicker">{user ? 'MY PROFILE' : mode === 'confirm' ? 'CHECK YOUR INBOX' : 'WELCOME TO ONESHOT'}</span>
          <h2>
            {mode === 'password'
              ? tr('كلمة مرور جديدة', 'New password')
              : mode === 'confirm'
                ? tr('راجع بريدك الإلكتروني', 'Check your inbox')
                : user
                  ? tr('حسابي', 'My account')
                  : mode === 'signup'
                    ? tr('أنشئ حساب العميل', 'Create your customer account')
                    : mode === 'reset'
                      ? tr('استعادة كلمة المرور', 'Reset your password')
                      : tr('أهلاً بعودتك', 'Welcome back')}
          </h2>
          {!ready ? (
            <p role="status">{tr('جارٍ تحميل الحساب…', 'Loading your account…')}</p>
          ) : mode === 'confirm' && !user ? (
            <div className="customer-confirm-step" role="status" aria-live="polite">
              <div className="customer-confirm-icon">
                <MailCheck size={28} />
              </div>
              <p>
                {tr(
                  `أرسلنا رسالة تفعيل إلى ${pendingEmail || 'بريدك الإلكتروني'}. افتح الرابط داخل الرسالة لتأكيد حسابك ثم عد لتسجيل الدخول.`,
                  `We sent a confirmation link to ${pendingEmail || 'your email address'}. Open the link in your inbox to verify your account, then sign in.`,
                )}
              </p>
              {activeSku && (
                <small className="customer-confirm-sku">
                  <CheckCircle2 size={15} />
                  <span>
                    {tr(
                      `تم حفظ الخدمة المختارة (${activeSku}) للانتقال إليها فور تسجيل الدخول.`,
                      `Your selected service (${activeSku}) is saved and will open as soon as you sign in.`,
                    )}
                  </span>
                </small>
              )}
              <div className="customer-confirm-actions">
                <button
                  type="button"
                  className="customer-submit"
                  disabled={busy}
                  onClick={() => changeMode('login')}
                >
                  {tr('تم التأكيد — تسجيل الدخول الآن', 'I confirmed my email — Sign in now')}
                </button>
                <button
                  type="button"
                  className="customer-secondary-btn"
                  disabled={busy}
                  onClick={() => void resendOrRetryConfirmation()}
                >
                  <RefreshCw size={16} />
                  <span>{tr('إعادة الفحص أو إعادة إرسال التأكيد', 'Retry or resend confirmation email')}</span>
                </button>
                <button
                  type="button"
                  className="customer-text"
                  disabled={busy}
                  onClick={() => changeMode('signup')}
                >
                  {tr('تعديل البريد الإلكتروني أو البيانات', 'Edit email address or details')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {!user && ['login', 'signup'].includes(mode) && (
                <div className="customer-tabs">
                  <button
                    type="button"
                    disabled={busy}
                    aria-pressed={mode === 'login'}
                    onClick={() => changeMode('login')}
                  >
                    {tr('تسجيل الدخول', 'Sign in')}
                  </button>
                  {signupEnabled && (
                    <button
                      type="button"
                      disabled={busy}
                      aria-pressed={mode === 'signup'}
                      onClick={() => changeMode('signup')}
                    >
                      {tr('حساب عميل جديد', 'New customer account')}
                    </button>
                  )}
                </div>
              )}
              {user && !profile && mode !== 'password' ? (
                <button
                  onClick={() => {
                    setBusy(true);
                    void refresh()
                      .catch(() => setError(tr('تعذر تحميل البيانات.', 'Unable to load details.')))
                      .finally(() => setBusy(false));
                  }}
                  disabled={busy}
                >
                  {tr('إعادة تحميل بياناتي', 'Reload my details')}
                </button>
              ) : (
                <form onSubmit={submit} key={`${mode}-${user?.id || 'guest'}`}>
                  {mode !== 'password' && (user || mode === 'signup') && (
                    <label>
                      {tr('الاسم الكامل', 'Full name')}
                      <input
                        name="fullName"
                        defaultValue={profile?.fullName || pendingName}
                        autoComplete="name"
                        required
                        maxLength={100}
                      />
                    </label>
                  )}
                  {mode !== 'password' && (
                    <label>
                      {tr('البريد الإلكتروني', 'Email address')}
                      <input
                        name="email"
                        type="email"
                        dir="ltr"
                        autoComplete="email"
                        defaultValue={user?.email || pendingEmail}
                        readOnly={!!user}
                        required
                        maxLength={254}
                      />
                    </label>
                  )}
                  {user && mode !== 'password' && (
                    <label>
                      {tr('الهاتف (اختياري)', 'Phone (optional)')}
                      <input
                        name="phone"
                        type="tel"
                        dir="ltr"
                        autoComplete="tel"
                        defaultValue={profile?.phone}
                        maxLength={30}
                      />
                    </label>
                  )}
                  {(mode === 'password' || (!user && mode !== 'reset')) && (
                    <label>
                      {tr('كلمة المرور', 'Password')}
                      <input
                        name="password"
                        type="password"
                        dir="ltr"
                        required
                        minLength={mode === 'login' ? undefined : 8}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      />
                      {mode !== 'login' && (
                        <small>{tr('8 أحرف على الأقل', 'At least 8 characters')}</small>
                      )}
                    </label>
                  )}
                  <button
                    className="customer-submit"
                    disabled={busy || (mode === 'signup' && !signupEnabled)}
                  >
                    {busy
                      ? tr('جارٍ المتابعة…', 'Please wait…')
                      : user || mode === 'password'
                        ? tr('حفظ التغييرات', 'Save changes')
                        : mode === 'signup'
                          ? tr('إنشاء حساب العميل', 'Create customer account')
                          : mode === 'reset'
                            ? tr('إرسال رابط الاستعادة', 'Send reset link')
                            : tr('تسجيل الدخول', 'Sign in')}
                  </button>
                </form>
              )}
              {!user && (
                <button
                  className="customer-text"
                  disabled={busy}
                  onClick={() => changeMode(mode === 'reset' ? 'login' : 'reset')}
                >
                  {mode === 'reset' ? tr('العودة للدخول', 'Back to sign in') : tr('نسيت كلمة المرور؟', 'Forgot password?')}
                </button>
              )}
              {user && (
                <div className="customer-signed-in-actions">
                  <a href={walletHref} className="customer-wallet-cta">
                    <WalletCards size={18} />
                    <span>
                      {activeSku
                        ? tr(`إتمام شراء الخدمة (${activeSku}) من المحفظة`, `Complete purchase of (${activeSku}) in Wallet`)
                        : tr('الانتقال إلى المحفظة وطلبات الخدمات', 'Go to Wallet & Service Orders')}
                    </span>
                  </a>
                  <button
                    className="customer-text"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      void logout()
                        .then(() => {
                          setUser(null);
                          setProfile(null);
                          setMode('login');
                          setNotice('');
                        })
                        .catch(() => setError(tr('تعذر تسجيل الخروج.', 'Unable to sign out.')))
                        .finally(() => setBusy(false));
                    }}
                  >
                    {tr('تسجيل الخروج', 'Sign out')}
                  </button>
                </div>
              )}
            </>
          )}
          {error && (
            <p className="customer-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="customer-notice" role="status">
              {notice}
            </p>
          )}
          <footer>
            <a href={appearanceLink('/privacy')}>{tr('سياسة الخصوصية', 'Privacy policy')}</a>
            <span>oneShot Brand Studio</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

