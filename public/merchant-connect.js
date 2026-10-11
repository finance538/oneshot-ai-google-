(() => {
  const script = document.currentScript;
  if (!script?.src) return;
  const destination = new URL(script.src).origin;
  if (!['1shotcam.com', 'www.1shotcam.com', 'lustrous-salmiakki-3375b0.netlify.app'].includes(window.location.hostname)) return;
  const loginLabels = ['sign in', 'signin', 'log in', 'login', 'تسجيل الدخول'];
  const signupLabels = ['sign up', 'signup', 'register', 'إنشاء حساب', 'انشاء حساب'];
  const connected = new WeakSet();
  function connect() {
    const elements = [...document.querySelectorAll('a, button')];
    for (const kind of ['login', 'signup']) {
      const labels = kind === 'login' ? loginLabels : signupLabels;
      const explicit = elements.filter(element => element.getAttribute('data-oneshot-auth') === kind);
      const matching = explicit.length ? explicit : elements.filter(element => labels.includes(element.textContent.trim().toLowerCase().replace(/\s+/g, ' '))).slice(-1);
      for (const element of matching) {
        if (connected.has(element)) continue;
        const url = new URL(kind === 'login' ? '/sign-in' : '/sign-up', destination);
        const source = new URL(window.location.href);
        for (const key of ['lang', 'theme']) if (source.searchParams.has(key)) url.searchParams.set(key, source.searchParams.get(key));
        if (element.tagName === 'A') element.setAttribute('href', url.href);
        element.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); window.location.assign(url.href); }, true);
        connected.add(element);
      }
    }
  }
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; connect(); });
  });
  function start() { connect(); observer.observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
