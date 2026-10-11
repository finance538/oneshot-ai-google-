const messages = {
  ar: ['نحتاج إلى الاتصال بالإنترنت.', 'حفاظاً على أمانك، لا تُحفظ بيانات العملاء أو صفحات الدفع دون اتصال. أعد الاتصال ثم حدّث الصفحة.', 'إعادة المحاولة'],
  en: ['An internet connection is required.', 'For your security, customer data and payment pages are not stored offline. Reconnect, then refresh the page.', 'Try again'],
  zh: ['需要连接互联网。', '为确保安全，客户数据与支付页面不会离线保存。请重新连接并刷新页面。', '重试'],
  ru: ['Требуется подключение к интернету.', 'Для вашей безопасности данные клиентов и страницы оплаты не сохраняются офлайн. Подключитесь к сети и обновите страницу.', 'Повторить'],
  fr: ['Une connexion internet est nécessaire.', 'Pour votre sécurité, les données clients et les pages de paiement ne sont pas conservées hors ligne. Reconnectez-vous, puis actualisez la page.', 'Réessayer'],
};
const params = new URLSearchParams(window.location.search);
const language = Object.hasOwn(messages, params.get('lang')) ? params.get('lang') : 'ar';
const [title, description, retry] = messages[language];
document.documentElement.lang = language;
document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
document.documentElement.dataset.theme = params.get('theme') === 'light' ? 'light' : 'dark';
document.querySelector('meta[name="theme-color"]').content = params.get('theme') === 'light' ? '#f5f4f1' : '#0a0b0e';
document.title = `oneShot · ${title}`;
document.querySelector('h1').textContent = title;
document.querySelector('main p').textContent = description;
document.getElementById('retry').textContent = retry;
document.getElementById('retry').addEventListener('click', () => window.location.reload());
