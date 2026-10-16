import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getSettings, getUser, handleAuthCallback, login, logout, onAuthChange, requestPasswordRecovery, signup, updateUser, type User } from '@netlify/identity';
import { ArrowUpLeft, ShieldCheck } from 'lucide-react';
import { AppearanceControls, Brand } from './Brand';
import { appearanceLink, useAppearance } from './i18n';
import { api } from './platform';
import './CustomerAccount.css';

type Profile = { fullName: string; email: string; phone: string };
type Mode = 'login' | 'signup' | 'reset' | 'password';

export default function CustomerAccount() {
  const { tr } = useAppearance();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<Mode>(new URLSearchParams(location.search).get('mode') === 'password' ? 'password' : 'login');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const initialization = useRef<Promise<Awaited<ReturnType<typeof handleAuthCallback>>> | null>(null);

  async function refresh() {
    const current = await getUser();
    setUser(current);
    setProfile(null);
    if (current) setProfile((await api<{ profile: Profile }>('customer-profile')).profile);
  }

  useEffect(() => {
    let active = true;
    initialization.current ??= handleAuthCallback();
    void (async () => {
      try {
        const callback = await initialization.current;
        if (!active) return;
        if (callback?.type === 'recovery') setMode('password');
        const settings = await getSettings();
        if (!active) return;
        setSignupEnabled(!settings.disableSignup);
        await refresh();
      } catch { if (active) setError(tr('تعذر تحميل الحساب. حاول مجدداً.', 'Unable to load your account. Please try again.')); }
      finally { if (active) setReady(true); }
    })();
    const unsubscribe = onAuthChange(event => {
      if (event === 'logout' && active) { setUser(null); setProfile(null); setMode('login'); }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(''); setNotice('');
    try {
      const email = String(data.get('email') || '').trim();
      const password = String(data.get('password') || '');
      if (mode === 'password') {
        await updateUser({ password });
        setMode('login');
        history.replaceState(null, '', appearanceLink('/customer'));
        setNotice(tr('تم تحديث كلمة المرور.', 'Password updated.'));
        await refresh();
      } else if (user) {
        const result = await api<{ profile: Profile }>('customer-profile', { fullName: data.get('fullName'), phone: data.get('phone') });
        setProfile(result.profile);
        setNotice(tr('تم حفظ بياناتك.', 'Your details are saved.'));
      } else if (mode === 'reset') {
        await requestPasswordRecovery(email);
        setNotice(tr('إذا كان البريد مسجلاً، ستصلك رسالة لاستعادة كلمة المرور.', 'If this email is registered, you’ll receive a password reset link.'));
      } else if (mode === 'signup') {
        await signup(email, password, { full_name: String(data.get('fullName') || '').trim(), account_type: 'customer' });
        setNotice(tr('راجع بريدك لتأكيد حسابك، ثم سجّل الدخول.', 'Check your inbox to confirm your account, then sign in.'));
        await refresh();
      } else {
        await login(email, password);
        await refresh();
      }
    } catch {
      setError(tr('تعذر إتمام الطلب. تحقق من البيانات وتأكيد بريدك، ثم حاول مجدداً.', 'Unable to complete the request. Check your details and email confirmation, then try again.'));
    } finally { setBusy(false); }
  }

  function changeMode(next: Mode) { setMode(next); setError(''); setNotice(''); }
  return <div className="customer-account">
    <header className="customer-header"><a href={appearanceLink('/')} aria-label="oneShot"><Brand /></a><AppearanceControls /></header>
    <main className="customer-layout">
      <section className="customer-story"><span className="customer-kicker">ONESHOT / YOUR ACCOUNT</span><h1>{tr('كل بداية قوية،', 'Every great start,')}<br /><em>{tr('تبدأ بخطوة.', 'starts with one shot.')}</em></h1><p>{tr('مساحتك الخاصة في oneShot. حساب واحد لحفظ بياناتك والعودة إليها في أي وقت.', 'Your own space at oneShot. One account to keep your details close, whenever you need them.')}</p><div className="customer-trust"><ShieldCheck size={22} /><span>{tr('دخول آمن. بياناتك في مساحتك.', 'Secure sign-in. Your details, in your space.')}</span></div><a href={appearanceLink('/')} className="customer-back">{tr('العودة إلى الاستوديو', 'Back to the studio')} <ArrowUpLeft size={18} /></a></section>
      <section className="customer-card" aria-busy={busy || !ready}>
        <span className="customer-kicker">{user ? 'MY PROFILE' : 'WELCOME TO ONESHOT'}</span>
        <h2>{mode === 'password' ? tr('كلمة مرور جديدة', 'New password') : user ? tr('حسابي', 'My account') : mode === 'signup' ? tr('أنشئ حساب العميل', 'Create your customer account') : mode === 'reset' ? tr('استعادة كلمة المرور', 'Reset your password') : tr('أهلاً بعودتك', 'Welcome back')}</h2>
        {!ready ? <p role="status">{tr('جارٍ تحميل الحساب…', 'Loading your account…')}</p> : <>
          {!user && ['login', 'signup'].includes(mode) && <div className="customer-tabs"><button type="button" disabled={busy} aria-pressed={mode === 'login'} onClick={() => changeMode('login')}>{tr('تسجيل الدخول', 'Sign in')}</button>{signupEnabled && <button type="button" disabled={busy} aria-pressed={mode === 'signup'} onClick={() => changeMode('signup')}>{tr('حساب جديد', 'Create account')}</button>}</div>}
          {user && !profile && mode !== 'password' ? <button onClick={() => { setBusy(true); void refresh().catch(() => setError(tr('تعذر تحميل البيانات.', 'Unable to load details.'))).finally(() => setBusy(false)); }} disabled={busy}>{tr('إعادة تحميل بياناتي', 'Reload my details')}</button> : <form onSubmit={submit} key={`${mode}-${user?.id || 'guest'}`}>
            {mode !== 'password' && (user || mode === 'signup') && <label>{tr('الاسم الكامل', 'Full name')}<input name="fullName" defaultValue={profile?.fullName} autoComplete="name" required maxLength={100} /></label>}
            {mode !== 'password' && <label>{tr('البريد الإلكتروني', 'Email address')}<input name="email" type="email" dir="ltr" autoComplete="email" defaultValue={user?.email} readOnly={!!user} required maxLength={254} /></label>}
            {user && mode !== 'password' && <label>{tr('الهاتف (اختياري)', 'Phone (optional)')}<input name="phone" type="tel" dir="ltr" autoComplete="tel" defaultValue={profile?.phone} maxLength={30} /></label>}
            {(mode === 'password' || (!user && mode !== 'reset')) && <label>{tr('كلمة المرور', 'Password')}<input name="password" type="password" dir="ltr" required minLength={mode === 'login' ? undefined : 8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />{mode !== 'login' && <small>{tr('٨ أحرف على الأقل', 'At least 8 characters')}</small>}</label>}
            <button className="customer-submit" disabled={busy || (mode === 'signup' && !signupEnabled)}>{busy ? tr('جارٍ المتابعة…', 'Please wait…') : user || mode === 'password' ? tr('حفظ التغييرات', 'Save changes') : mode === 'signup' ? tr('إنشاء الحساب', 'Create account') : mode === 'reset' ? tr('إرسال رابط الاستعادة', 'Send reset link') : tr('تسجيل الدخول', 'Sign in')}</button>
          </form>}
          {!user && <button className="customer-text" disabled={busy} onClick={() => changeMode(mode === 'reset' ? 'login' : 'reset')}>{mode === 'reset' ? tr('العودة للدخول', 'Back to sign in') : tr('نسيت كلمة المرور؟', 'Forgot password?')}</button>}
          {user && <button className="customer-text" disabled={busy} onClick={() => { setBusy(true); void logout().then(() => { setUser(null); setProfile(null); setMode('login'); setNotice(''); }).catch(() => setError(tr('تعذر تسجيل الخروج.', 'Unable to sign out.'))).finally(() => setBusy(false)); }}>{tr('تسجيل الخروج', 'Sign out')}</button>}
        </>}
        {error && <p className="customer-error" role="alert">{error}</p>}{notice && <p className="customer-notice" role="status">{notice}</p>}
        <footer><a href={appearanceLink('/privacy')}>{tr('سياسة الخصوصية', 'Privacy policy')}</a><span>oneShot Brand Studio</span></footer>
      </section>
    </main>
  </div>;
}
