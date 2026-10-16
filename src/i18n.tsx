import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isCustomerPath, isStorefrontPath } from './storefront/routes';
import { french, storefrontTranslations } from './locales';

export type Language = 'ar' | 'en' | 'zh' | 'ru' | 'fr';
type Theme = 'dark' | 'light';
export const languages: { id: Language; name: string }[] = [{ id: 'ar', name: 'العربية' }, { id: 'en', name: 'English' }, { id: 'zh', name: '中文' }, { id: 'ru', name: 'Русский' }, { id: 'fr', name: 'Français' }];
const phrases: [string, string, string, string][] = [
  ['نظرة عامة', 'Overview', '概览', 'Обзор'],
  ['روابط الدفع', 'Payment links', '支付链接', 'Платёжные ссылки'],
  ['الفواتير', 'Invoices', '发票', 'Счета'],
  ['الاشتراكات', 'Subscriptions', '订阅', 'Подписки'],
  ['طرق الربط', 'Integrations', '集成方式', 'Интеграции'],
  ['إعدادات التاجر', 'Merchant settings', '商户设置', 'Настройки продавца'],
  ['إدارة المنصة', 'Platform controls', '平台管理', 'Управление платформой'],
  ['تسجيل الدخول باستخدام Google', 'Continue with Google', '使用 Google 登录', 'Войти через Google'],
  ['إنشاء حساب باستخدام Google', 'Sign up with Google', '使用 Google 注册', 'Регистрация через Google'],
  ['مستويات الذكاء الاصطناعي ونظام التوجيه الذكي', 'AI Model Tiers & Smart Router', 'AI 模型分级与智能路由', 'Уровни ИИ и умная маршрутизация'],
  ['المستوى الأول: السريع والموفّر', 'Tier 1: Fast & Efficient', '第一级：快速与高效', 'Уровень 1: Быстрый и экономичный'],
  ['المستوى الثاني: الاحترافي والمتقدم', 'Tier 2: Pro & Analytical', '第二级：专业与深度分析', 'Уровень 2: Профессиональный и аналитический'],
  ['المستوى الثالث: الاستدلال العميق والمنطق المعقد', 'Tier 3: Deep Reasoning & Expert', '第三级：深度推理与专家逻辑', 'Уровень 3: Глубокое рассуждение и логика'],
  ['المستوى الرابع (X): النماذج الحرة المفرغة من القيود', 'Tier X: Abliterated Core', '第四级 (X)：无限制去审查核心引擎', 'Уровень X: Модели без ограничений (Abliterated)'],
  ['خاص بالمسؤول فقط', 'Admin Only', '仅限管理员', 'Только для администратора'],
  ['التوجيه الذكي: نشط', 'Smart Router: Active', '智能路由：已激活', 'Умная маршрутизация: Активна'],
  ['تحديد يدوي للنموذج', 'Manual Selection', '手动选择', 'Ручной выбор'],
  ['إعدادات السيرفر', 'Server Settings', '服务器设置', 'Настройки сервера'],
  ['نماذج Ollama المدمجة', 'Integrated Ollama Models', '内置 Ollama 模型', 'Встроенные модели Ollama'],
  ['سجل العمليات التاريخي', 'Historical Operation Logs', '历史交易日志', 'История операций'],
  ['الوضع الليلي', 'Dark mode', '深色模式', 'Тёмная тема'],
  ['الوضع النهاري', 'Light mode', '浅色模式', 'Светлая тема'],
  ['اللغة', 'Language', '语言', 'Язык'],
  ['فتح القائمة', 'Open menu', '打开菜单', 'Открыть меню'],
  ['إغلاق', 'Close', '关闭', 'Закрыть'],
  ['مساحة التاجر', 'Merchant workspace', '商户工作区', 'Кабинет продавца'],
  ['تسجيل الدخول', 'Sign in', '登录', 'Войти'],
  ['إنشاء حساب', 'Sign up', '注册', 'Создать аккаунт'],
  ['تسجيل الخروج', 'Sign out', '退出登录', 'Выйти'],
  ['البريد الإلكتروني', 'Email', '电子邮箱', 'Электронная почта'],
  ['كلمة المرور', 'Password', '密码', 'Пароль'],
  ['الاسم', 'Name', '姓名', 'Имя'],
  ['نسيت كلمة المرور', 'Forgot password', '忘记密码', 'Забыли пароль'],
  ['استعادة كلمة المرور', 'Reset password', '重置密码', 'Восстановить пароль'],
  ['كلمة مرور جديدة', 'New password', '新密码', 'Новый пароль'],
  ['إرسال رابط الاستعادة', 'Send reset link', '发送重置链接', 'Отправить ссылку'],
  ['قبول الدعوة', 'Accept invitation', '接受邀请', 'Принять приглашение'],
  ['حفظ', 'Save', '保存', 'Сохранить'],
  ['تم الحفظ.', 'Saved.', '已保存。', 'Сохранено.'],
  ['جارٍ التنفيذ…', 'Working…', '处理中…', 'Обработка…'],
  ['جارٍ التحميل…', 'Loading…', '加载中…', 'Загрузка…'],
  ['تم إرسال الرابط. راجع بريدك.', 'Link sent. Check your email.', '链接已发送，请查看邮箱。', 'Ссылка отправлена. Проверьте почту.'],
  ['راجع بريدك لتأكيد الحساب قبل الدخول.', 'Check your email to confirm your account before signing in.', '请先通过邮件确认账户，再登录。', 'Подтвердите аккаунт по электронной почте перед входом.'],
  ['التسجيل غير متاح حالياً.', 'Signups are currently unavailable.', '目前无法注册。', 'Регистрация сейчас недоступна.'],
  ['دخول واحد. أعمال أكثر.', 'One sign-in. More possibilities.', '一次登录，更多可能。', 'Один вход. Больше возможностей.'],
  ['من علامتك إلى دفعتك.', 'From your brand to your next payment.', '从品牌到下一笔收款。', 'От вашего бренда — к оплате.'],
  ['مساحة واحدة لروابطك وفواتيرك وعملائك، بهوية oneShot.', 'One workspace for your payment links, invoices and customers. Unmistakably oneShot.', '在 oneShot 工作区统一管理支付链接、发票和客户。', 'Ссылки, счета и клиенты в одном кабинете в стиле oneShot.'],
  ['زيارة موقع oneShot', 'Visit oneShot', '访问 oneShot', 'На сайт oneShot'],
  ['ابدأ مساحة التاجر', 'Create your workspace', '创建工作区', 'Создать кабинет'],
  ['اسم المتجر', 'Store name', '店铺名称', 'Название магазина'],
  ['أنشئ مساحتك المستقلة لتبدأ استقبال المدفوعات.', 'Create an independent workspace to start accepting payments.', '创建独立工作区，开始接收付款。', 'Создайте отдельный кабинет для приёма платежей.'],
  ['طلب دفع جديد', 'New payment request', '新建支付请求', 'Новый запрос оплаты'],
  ['رابط مفتوح جديد', 'New open link', '新建自选金额链接', 'Новая ссылка со свободной суммой'],
  ['رابط مفتوح', 'Open payment link', '自选金额链接', 'Ссылка со свободной суммой'],
  ['طلبات بمبلغ ثابت', 'Fixed-amount requests', '固定金额请求', 'Запросы с фиксированной суммой'],
  ['روابط بمبلغ يحدده العميل', 'Customer-defined amounts', '客户自选金额', 'Сумму выбирает клиент'],
  ['رابط واحد تشاركه مراراً؛ يحدد كل عميل المبلغ وطريقة الدفع المتاحة له.', 'Share one reusable link. Each customer chooses their amount and an available payment method.', '重复分享同一链接，每位客户可选择金额和可用支付方式。', 'Делитесь одной ссылкой многократно. Каждый клиент выбирает сумму и доступный способ оплаты.'],
  ['إجمالي المدفوعات', 'Total collected', '收款总额', 'Всего получено'],
  ['عمليات مكتملة', 'Confirmed payments', '已确认付款', 'Подтверждённые платежи'],
  ['طلبات معلقة', 'Pending requests', '待付款请求', 'Ожидающие запросы'],
  ['العملاء', 'Customers', '客户', 'Клиенты'],
  ['آخر الطلبات', 'Latest requests', '最新请求', 'Последние запросы'],
  ['نشاط آخر 7 أيام', 'Last 7 days', '最近 7 天', 'Последние 7 дней'],
  ['المبالغ مؤكدة من بوابة الدفع، وليست من عودة المتصفح.', 'Totals are confirmed by the gateway, not by a browser redirect.', '金额由支付网关确认，而不是通过浏览器跳转确认。', 'Суммы подтверждает шлюз, а не возврат браузера.'],
  ['لا توجد طلبات بعد.', 'No requests yet.', '暂无请求。', 'Запросов пока нет.'],
  ['لا توجد روابط مفتوحة بعد.', 'No open links yet.', '暂无自选金额链接。', 'Открытых ссылок пока нет.'],
  ['لا توجد اشتراكات بعد.', 'No subscriptions yet.', '暂无订阅。', 'Подписок пока нет.'],
  ['ابحث عن عميل أو طلب', 'Search customers or requests', '搜索客户或请求', 'Поиск клиентов и запросов'],
  ['العميل / الطلب', 'Customer / request', '客户 / 请求', 'Клиент / запрос'],
  ['المبلغ', 'Amount', '金额', 'Сумма'],
  ['طريقة الدفع', 'Payment method', '支付方式', 'Способ оплаты'],
  ['الحالة', 'Status', '状态', 'Статус'],
  ['التاريخ', 'Date', '日期', 'Дата'],
  ['الرابط', 'Link', '链接', 'Ссылка'],
  ['نسخ الرابط', 'Copy link', '复制链接', 'Копировать ссылку'],
  ['فتح الرابط', 'Open link', '打开链接', 'Открыть ссылку'],
  ['تم نسخ الرابط.', 'Link copied.', '链接已复制。', 'Ссылка скопирована.'],
  ['تعذر النسخ. استخدم الرابط الظاهر.', 'Copy failed. Use the displayed link.', '复制失败，请使用显示的链接。', 'Не удалось скопировать. Используйте показанную ссылку.'],
  ['إلغاء', 'Cancel', '取消', 'Отменить'],
  ['إلغاء الطلب لا يسترد دفعة بدأت بالفعل.', 'Cancelling a request does not refund a payment already started.', '取消请求不会退还已发起的付款。', 'Отмена запроса не возвращает уже начатый платёж.'],
  ['إيقاف الاشتراك', 'Cancel subscription', '取消订阅', 'Отключить подписку'],
  ['الخصم القادم', 'Next charge', '下次扣款', 'Следующее списание'],
  ['شهري', 'Monthly', '每月', 'Ежемесячно'],
  ['سنوي', 'Yearly', '每年', 'Ежегодно'],
  ['عنوان الطلب', 'Request title', '请求标题', 'Название запроса'],
  ['اسم العميل', 'Customer name', '客户姓名', 'Имя клиента'],
  ['بريد العميل', 'Customer email', '客户邮箱', 'Почта клиента'],
  ['بوابة الدفع', 'Payment gateway', '支付网关', 'Платёжный шлюз'],
  ['إنشاء الرابط', 'Create link', '创建链接', 'Создать ссылку'],
  ['الحد الأدنى', 'Minimum amount', '最低金额', 'Минимальная сумма'],
  ['الحد الأعلى', 'Maximum amount', '最高金额', 'Максимальная сумма'],
  ['طرق الدفع المسموحة', 'Allowed payment methods', '允许的支付方式', 'Разрешённые способы оплаты'],
  ['لا توجد طريقة مهيأة. أكمل إعدادات التاجر أولاً.', 'No methods configured. Complete merchant settings first.', '尚未配置支付方式，请先完成商户设置。', 'Нет настроенных способов оплаты. Сначала настройте кабинет.'],
  ['متصل', 'Configured', '已配置', 'Настроено'],
  ['غير مهيأ', 'Not configured', '未配置', 'Не настроено'],
  ['جاهز', 'Available', '可用', 'Доступно'],
  ['غير متاح', 'Unavailable', '不可用', 'Недоступно'],
  ['الصفحة المستضافة', 'Hosted checkout', '托管收银台', 'Платёжная страница'],
  ['صفحة الدفع المستضافة', 'Hosted checkout', '托管收银台', 'Платёжная страница'],
  ['الدفع داخل الموقع', 'Embedded checkout', '嵌入式收银台', 'Встроенная оплата'],
  ['الدفع من الجوال', 'Mobile / PWA checkout', '移动端 / PWA 支付', 'Оплата с телефона / PWA'],
  ['مدى وApple Pay', 'Mada and Apple Pay', 'Mada 和 Apple Pay', 'Mada и Apple Pay'],
  ['النموذج المُدار', 'Managed Form', '托管表单', 'Управляемая форма'],
  ['نموذجك الخاص', 'Own Form', '自定义表单', 'Собственная форма'],
  ['تحصيل دوري بعد موافقة العميل؛ ليس تخزيناً لبيانات البطاقة.', 'Recurring billing requires customer consent; card data is not stored.', '定期扣款需要客户同意，不保存银行卡信息。', 'Регулярные списания требуют согласия клиента; данные карты не сохраняются.'],
  ['المتاح يعتمد على إعدادات المسؤول وتفعيل حساب البوابة.', 'Availability depends on administrator settings and gateway account activation.', '可用性取决于管理员设置和支付网关账户开通情况。', 'Доступность зависит от настроек администратора и активации у провайдера.'],
  ['معرّف التاجر', 'Merchant ID', '商户 ID', 'ID продавца'],
  ['أسماء المتغيرات فقط؛ لا تدخل المفاتيح هنا.', 'Variable names only. Do not enter private keys here.', '此处仅显示变量名，请勿输入私密密钥。', 'Здесь только имена переменных. Не вводите секретные ключи.'],
  ['أضف القيم في Netlify بنطاق Functions، ثم أعد النشر.', 'Set values in Netlify with Functions scope, then redeploy.', '在 Netlify 设置变量并确保 Functions 可读取，然后重新部署。', 'Укажите значения в Netlify для Functions и повторите развёртывание.'],
  ['إعادة فحص الربط', 'Recheck configuration', '重新检查配置', 'Проверить настройки'],
  ['تثبيت التطبيق', 'Install app', '安装应用', 'Установить приложение'],
  ['افتح قائمة المتصفح واختر تثبيت التطبيق أو الإضافة للشاشة الرئيسية.', 'Use your browser menu to install the app or add it to your home screen.', '通过浏览器菜单安装应用或添加到主屏幕。', 'Установите приложение через меню браузера или добавьте на главный экран.'],
  ['التحكم للمسؤول فقط ويُطبّق من الخادم.', 'Administrator-only controls, enforced on the server.', '仅管理员可控制，并由服务器强制执行。', 'Только для администратора. Правила применяются на сервере.'],
  ['استقبال المدفوعات', 'Accept payments', '接收付款', 'Приём платежей'],
  ['إنشاء طلبات جديدة', 'Create new requests', '创建新请求', 'Создание запросов'],
  ['الروابط المفتوحة', 'Open payment links', '自选金额链接', 'Открытые платёжные ссылки'],
  ['مساعد التعبئة الذكي', 'AI autofill assistant', 'AI 信息填写助手', 'ИИ-помощник заполнения'],
  ['تشغيل جميع الميزات', 'Enable all features', '启用所有功能', 'Включить все функции'],
  ['إيقاف جميع الميزات', 'Disable all features', '停用所有功能', 'Отключить все функции'],
  ['حفظ إعدادات المنصة', 'Save platform settings', '保存平台设置', 'Сохранить настройки платформы'],
  ['الحمايات الأساسية دائمة', 'Core safeguards stay on', '核心安全措施始终启用', 'Базовая защита всегда включена'],
  ['توقيع الإشعارات، تأكيد المبلغ والتاجر، عزل الحسابات وحماية المفاتيح لا يمكن تعطيلها. CVV و3D Secure ومكافحة الاحتيال تُدار لدى البوابة.', 'Callback signatures, amount and merchant verification, tenant isolation and key protection cannot be disabled. CVV, 3D Secure and fraud controls are managed by the gateway.', '回调签名、金额及商户验证、账户隔离和密钥保护不可停用。CVV、3D Secure 和风控由支付网关管理。', 'Проверку подписи, суммы и продавца, изоляцию аккаунтов и защиту ключей отключить нельзя. CVV, 3D Secure и антифрод управляются шлюзом.'],
  ['إيقاف ميزة لا يلغي جلسة دفع بدأت بالفعل لدى البوابة.', 'Disabling a feature does not revoke a session already created at the gateway.', '停用功能不会撤销已在网关创建的支付会话。', 'Отключение функции не отменяет сессию, уже созданную шлюзом.'],
  ['العودة إلى oneShot', 'Back to oneShot', '返回 oneShot', 'Вернуться в oneShot'],
  ['صفحة دفع آمنة', 'Secure checkout', '安全支付', 'Безопасная оплата'],
  ['من طلب إلى دفعة', 'From request to payment', '从请求到付款', 'От запроса к оплате'],
  ['المستفيد', 'Payee', '收款方', 'Получатель'],
  ['صلاحية الرابط', 'Expires', '有效期', 'Срок действия'],
  ['اختر المبلغ وطريقة الدفع', 'Choose your amount and payment method', '选择金额和支付方式', 'Выберите сумму и способ оплаты'],
  ['المبلغ بالريال السعودي', 'Amount in Saudi riyals', '金额（沙特里亚尔）', 'Сумма в саудовских риялах'],
  ['متابعة إلى الدفع', 'Continue to payment', '继续付款', 'Перейти к оплате'],
  ['ادفع الآن', 'Pay now', '立即支付', 'Оплатить'],
  ['التحقق من حالة الدفع', 'Check payment status', '查看支付状态', 'Проверить статус платежа'],
  ['طباعة', 'Print', '打印', 'Печать'],
  ['تم تأكيد الدفع بنجاح.', 'Payment confirmed.', '付款已确认。', 'Оплата подтверждена.'],
  ['الدفع قيد التأكيد. لا تكرر العملية.', 'Payment is awaiting confirmation. Do not pay again.', '付款正在确认中，请勿重复支付。', 'Платёж ожидает подтверждения. Не платите повторно.'],
  ['العودة من البوابة ليست تأكيداً للدفع.', 'Returning from the gateway is not proof of payment.', '从网关返回并不表示支付成功。', 'Возврат со шлюза не подтверждает оплату.'],
  ['هذا الرابط مكتمل أو ملغى أو منتهي الصلاحية.', 'This link is completed, cancelled or expired.', '此链接已完成、已取消或已过期。', 'Ссылка оплачена, отменена или просрочена.'],
  ['طريقة الدفع غير مهيأة لهذا التاجر.', 'This payment method is unavailable for this merchant.', '此商户尚未启用该支付方式。', 'Этот способ оплаты недоступен продавцу.'],
  ['صفحة الدفع العامة', 'Public checkout page', '公共收银台页面', 'Публичная платёжная страница'],
  ['صفحة الدفع على pay.1shotcam.com', 'Checkout page at pay.1shotcam.com', 'pay.1shotcam.com 收银台', 'Платёжная страница pay.1shotcam.com'],
  ['صفحة واحدة يدفع منها عملاؤك مباشرة عبر بواباتك المفعّلة، بلا إنشاء رابط لكل عملية.', 'One page your customers pay on directly through your enabled gateways — no per-sale links.', '一个页面，客户可直接通过已启用的网关付款，无需逐笔创建链接。', 'Одна страница: клиенты платят напрямую через подключённые шлюзы, без ссылки на каждую продажу.'],
  ['البوابات المفعّلة', 'Enabled gateways', '已启用的网关', 'Подключённые шлюзы'],
  ['لا توجد بوابة مفعّلة بعد', 'No gateway connected yet', '尚未连接网关', 'Шлюз ещё не подключён'],
  ['فتح الصفحة', 'Open page', '打开页面', 'Открыть страницу'],
  ['الصفحة فعّالة: تظهر فقط بوابات حساب المشرف المفعّلة.', 'Page is live: it shows only the admin account’s enabled gateways.', '页面已上线：仅显示管理员账户已启用的网关。', 'Страница активна: отображаются только включённые шлюзы аккаунта администратора.'],
  ['متغيرات Netlify المطلوبة قبل تفعيل الصفحة', 'Netlify variables required before the page goes live', '页面启用前所需的 Netlify 变量', 'Переменные Netlify для включения страницы'],
  ['ادفع مباشرة عبر بوابات الدفع المعتمدة، بلا وسيط.', 'Pay directly through the approved payment gateways, no middleman.', '通过经批准的支付网关直接付款，无需中间环节。', 'Платите напрямую через одобренные платёжные шлюзы, без посредников.'],
  ['الدفع عبر oneShot', 'Pay with oneShot', '使用 oneShot 付款', 'Оплата через oneShot'],
  ['الصفحة غير مهيأة', 'Page not configured', '页面未配置', 'Страница не настроена'],
  ['لا توجد بوابة دفع مفعّلة بعد', 'No payment gateway is enabled yet', '尚未启用支付网关', 'Платёжный шлюз ещё не включён'],
  ['بوابات الدفع بلا طريقة متاحة', 'Gateway has no available method', '网关没有可用的支付方式', 'У шлюза нет доступного способа оплаты'],
  ['البوابات مربوطة، لكن لا توجد طريقة دفع مسموحة حالياً من إعدادات المنصة.', 'Gateways are connected, but no payment method is currently allowed in the platform settings.', '网关已连接，但平台设置当前未允许任何支付方式。', 'Шлюзы подключены, но в настройках платформы сейчас не разрешён ни один способ оплаты.'],
  ['لا يصدر رابط دفع حقيقي قبل ربط بوابة واحدة على الأقل (PayTabs أو Telr) من لوحة تحكم المشرف.', 'No real payment link is issued before at least one gateway (PayTabs or Telr) is connected from the admin dashboard.', '在管理员后台连接至少一个网关（PayTabs 或 Telr）之前，不会生成真实支付链接。', 'Реальная платёжная ссылка не создаётся, пока в панели администратора не подключён хотя бы один шлюз (PayTabs или Telr).'],
  ['تُنشأ صفحة الفاتورة على oneShot، والدفع يتم على بوابة الدفع الرسمية.', 'The invoice page is created on oneShot; the payment itself happens on the official gateway.', '账单页面在 oneShot 创建，付款在官方网关完成。', 'Счёт создаётся на oneShot, оплата проходит на официальном шлюзе.'],
  ['تعذر تحميل الصفحة.', 'Could not load the page.', '无法加载页面。', 'Не удалось загрузить страницу.'],
  ['راجع بياناتك قبل الدفع.', 'Review your details before paying.', '付款前请核对信息。', 'Проверьте данные перед оплатой.'],
  ['أوافق على التجديد التلقائي بالمبلغ المعروض وبالدورية المحددة. الإلغاء يوقف الدفعات المستقبلية ولا يسترد دفعة بدأت بالفعل.', 'I consent to automatic renewal for the displayed amount and interval. Cancellation stops future charges, not a payment already started.', '我同意按所示金额和周期自动续费。取消仅停止后续扣款，不退还已发起的付款。', 'Я согласен на автопродление по указанной сумме и периодичности. Отмена останавливает будущие списания, но не возвращает уже начатый платёж.'],
  ['رقم البطاقة', 'Card number', '卡号', 'Номер карты'],
  ['الشهر', 'Month', '月', 'Месяц'],
  ['السنة', 'Year', '年', 'Год'],
  ['رمز الأمان', 'Security code', '安全码', 'Код безопасности'],
  ['عنوان الفوترة الحقيقي', 'Your actual billing address', '真实账单地址', 'Ваш настоящий платёжный адрес'],
  ['الهاتف', 'Phone', '电话', 'Телефон'],
  ['الدولة (رمز حرفين)', 'Country (2-letter code)', '国家（两位字母代码）', 'Страна (код из двух букв)'],
  ['العنوان', 'Street address', '街道地址', 'Адрес'],
  ['المدينة', 'City', '城市', 'Город'],
  ['المنطقة', 'State / region', '省 / 地区', 'Область / регион'],
  ['الرمز البريدي', 'Postal code', '邮政编码', 'Почтовый индекс'],
  ['تعبئة بياناتي', 'Fill my details', '填写我的信息', 'Заполнить мои данные'],
  ['ألصق بياناتك الحقيقية فقط: الاسم، البريد، الهاتف والعنوان. لا تدخل بيانات البطاقة.', 'Paste only your actual name, email, phone and address. Never enter card details.', '仅粘贴真实姓名、邮箱、电话和地址，请勿输入银行卡信息。', 'Введите только настоящие имя, почту, телефон и адрес. Не вводите данные карты.'],
  ['أوافق على إرسال هذا النص إلى خدمة AI لترتيبه، وأراجع النتائج قبل استخدامها.', 'I consent to sending this text to the AI service for extraction and will review the results before using them.', '我同意将此文本发送给 AI 服务进行整理，并在使用前核对结果。', 'Я согласен отправить этот текст ИИ для извлечения данных и проверю результат перед использованием.'],
  ['استخراج بياناتي بالذكاء الاصطناعي', 'Extract my details with AI', '使用 AI 提取我的信息', 'Извлечь мои данные с ИИ'],
  ['اقتراح الموقع حسب IP', 'Suggest location from IP', '根据 IP 建议位置', 'Предложить местоположение по IP'],
  ['الموقع تقريبي ولا يحدد هويتك أو عنوان الفوترة. BIN يحدد معلومات جهة إصدار البطاقة، لا اسمك أو إيميلك.', 'Location is approximate, not your identity or billing address. A card BIN identifies issuer information, not your name or email.', '位置仅为大致信息，不能确定身份或账单地址。银行卡 BIN 反映发卡机构信息，不包含姓名或邮箱。', 'Местоположение приблизительное: это не личность и не платёжный адрес. BIN определяет сведения об эмитенте, а не имя или почту.'],
  ['لا توجد بيانات موقع متاحة. أدخل عنوانك الحقيقي.', 'Location is unavailable. Enter your actual address.', '位置不可用，请输入真实地址。', 'Местоположение недоступно. Введите настоящий адрес.'],
  ['مراجعة واستخدام البيانات', 'Review and use details', '核对并使用信息', 'Проверить и использовать данные'],
  ['لم يتم إرسال بيانات البطاقة إلى AI.', 'Card data is never sent to AI.', '银行卡信息不会发送给 AI。', 'Данные карты не отправляются ИИ.'],
  ['بانتظار الدفع', 'Awaiting payment', '等待付款', 'Ожидает оплаты'],
  ['مكتمل', 'Paid', '已付款', 'Оплачено'],
  ['غير ناجح', 'Failed', '失败', 'Неудачно'],
  ['ملغى', 'Cancelled', '已取消', 'Отменено'],
  ['رابط منشور', 'Published', '已发布', 'Опубликовано'],
  ['قيد المعالجة', 'Processing', '处理中', 'Обрабатывается'],
  ['نشط', 'Active', '启用', 'Активно'],
  ['متوقف', 'Disabled', '停用', 'Отключено'],
  ['جارٍ التحصيل', 'Charging', '扣款中', 'Списание'],
  ['يتطلب المراجعة', 'Needs review', '需要审核', 'Нужна проверка'],
  ['متأخر', 'Past due', '逾期', 'Просрочено'],
  ['مطابقة عملية غير مؤكدة', 'Reconcile an unconfirmed payment', '核对未确认付款', 'Сверить неподтверждённый платёж'],
  ['مرجع العملية', 'Transaction reference', '交易参考号', 'Номер транзакции'],
  ['انسخ المرجع من لوحة البوابة. يتحقق الخادم من التاجر والمبلغ والطلب.', 'Copy the reference from the gateway dashboard. The server verifies merchant, amount and request.', '从网关后台复制参考号，服务器将验证商户、金额和请求。', 'Скопируйте номер из кабинета шлюза. Сервер проверит продавца, сумму и запрос.'],
  ['مطابقة آمنة', 'Verify securely', '安全核验', 'Безопасно проверить'],
  ['رابط الدخول', 'Sign-in link', '登录链接', 'Ссылка входа'],
  ['رابط إنشاء الحساب', 'Sign-up link', '注册链接', 'Ссылка регистрации'],
  ['ضع هذين الرابطين على زري موقع oneShot الآخر. الربط ينقل الزائر ولا يشارك جلسات الحسابات بين النطاقات.', 'Use these links for the buttons on your other oneShot site. This redirects visitors; it does not share login sessions across domains.', '将这两个链接用于另一 oneShot 网站的按钮。链接会跳转访客，不会跨域共享登录会话。', 'Укажите эти ссылки на кнопках другого сайта oneShot. Это переход, а не обмен сессиями между доменами.'],
  ['تعذر إتمام الطلب.', 'Unable to complete the request.', '无法完成请求。', 'Не удалось выполнить запрос.'],
  ['تعذر تحميل مساحة التاجر. تحقق من اتصالك وإعدادات قاعدة البيانات.', 'Unable to load the workspace. Check your connection and database configuration.', '无法加载工作区，请检查网络和数据库配置。', 'Не удалось загрузить кабинет. Проверьте подключение и настройки базы.'],
  ['تعذر إكمال التحقق من الحساب. تحقق من صلاحية الرابط وتفعيل Identity.', 'Unable to verify the account. Check the link and Identity configuration.', '无法验证账户，请检查链接有效性和 Identity 配置。', 'Не удалось подтвердить аккаунт. Проверьте ссылку и настройки Identity.'],
  ['تعذر إتمام الطلب. تحقق من إعدادات المنصة أو حاول لاحقاً.', 'Request unavailable. Check platform settings or try again later.', '请求暂不可用，请检查平台设置或稍后重试。', 'Запрос недоступен. Проверьте настройки платформы или повторите позже.'],
  ['هذه الميزة متوقفة بواسطة مسؤول المنصة.', 'This feature is disabled by the platform administrator.', '平台管理员已停用此功能。', 'Функция отключена администратором платформы.'],
  ['المبلغ خارج حدود الرابط.', 'The amount is outside this link’s limits.', '金额超出此链接的限制。', 'Сумма выходит за пределы ссылки.'],
  ['البريد الإلكتروني غير صالح.', 'Enter a valid email.', '请输入有效邮箱。', 'Укажите корректную почту.'],
  ['توجد محاولة قيد المعالجة. لا تكرر الدفع؛ تحقق من الحالة أولاً.', 'A payment is in progress. Check its status before paying again.', '付款正在处理中，请先查看状态，不要重复付款。', 'Платёж обрабатывается. Проверьте статус перед повторной оплатой.'],
  ['خدمة التعبئة الذكية غير متاحة حالياً.', 'AI autofill is currently unavailable.', 'AI 填写服务暂不可用。', 'ИИ-заполнение сейчас недоступно.'],
  ['لا تُدخل بيانات البطاقة أو كلمات المرور.', 'Do not enter card details or passwords.', '请勿输入银行卡信息或密码。', 'Не вводите данные карты или пароли.'],
  ['تعذر استخراج البيانات. أدخلها يدوياً.', 'Unable to extract details. Enter them manually.', '无法提取信息，请手动填写。', 'Не удалось извлечь данные. Заполните вручную.'],
  ['لم توجد بيانات واضحة. أدخلها يدوياً.', 'No explicit details found. Enter them manually.', '未找到明确信息，请手动填写。', 'Явные данные не найдены. Заполните вручную.'],
  ['تغيرت الإعدادات. حدّث الصفحة قبل الحفظ.', 'Settings changed. Refresh before saving.', '设置已更改，请刷新后再保存。', 'Настройки изменились. Обновите страницу перед сохранением.'],
  ['التجديد التلقائي', 'Automatic renewal', '自动续费', 'Автопродление'],
  ['فتح الدفع في صفحة مستقلة', 'Open checkout in a new page', '在独立页面打开支付', 'Открыть оплату на отдельной странице'],
  ['فريق كامل يشتغل معك 24/7 — بدون رواتب، بدون عقود، وبدون تكلفة ثابتة.', 'A full team on duty 24/7 — no salaries, no contracts, no fixed cost.', '全天候 24/7 的完整团队 — 无需薪资，无需合同，无固定成本。', 'Команда на связи 24/7 — без зарплат, без договоров, без постоянных расходов.'],
  ['ونشوت تجمع لك بوابات دفع مصرفية مرخّصة، فوترة فورية، وحماية متقدمة — مع سوق موظفي AI جاهزين: دعم عملاء، مسوّق، مبرمج، ومحاسب قانوني. شغّل اللي تحتاجه وقت ما تحتاجه، وادفع عن كل نموذج تستخدمه فقط.', 'OneShot brings licensed payment gateways, instant invoicing and advanced protection onto one platform — plus a ready AI workforce: support, marketing, engineering and accounting. Activate whatever you need, whenever you need it, and pay only for the models you actually use.', 'OneShot 将持牌支付网关、即时开票与高级防护整合到一个平台 — 并配备现成的 AI 员工团队：客服、营销、工程与会计。按需启用，只为实际使用的模型付费。', 'OneShot объединяет лицензированные платёжные шлюзы, мгновенное выставление счетов и продвинутую защиту — плюс готовый штат ИИ-сотрудников: поддержка, маркетинг, разработка и бухгалтерия. Подключайте нужное и платите только за используемые модели.'],
];

const errorGroups: [string[], string, string, string][] = [
  [['مصدر الطلب غير مسموح.', 'طريقة الطلب غير مسموحة.'], 'This request is not allowed.', '不允许此请求。', 'Этот запрос не разрешён.'],
  [['صيغة الطلب غير مدعومة.', 'صيغة الطلب غير صالحة.', 'بيانات الطلب غير صالحة.', 'إعدادات غير صالحة.', 'معرّف غير صالح.', 'عملية غير معروفة.'], 'Invalid request data. Check your input.', '请求数据无效，请检查输入。', 'Некорректные данные запроса. Проверьте ввод.'],
  [['الطلب أكبر من الحد المسموح.'], 'The request is too large.', '请求超出大小限制。', 'Запрос слишком большой.'],
  [['أكمل الحقول المطلوبة بالقيم الصحيحة.', 'أكمل بيانات عنوان الفوترة.', 'الدولة أو رقم الهاتف غير صالح.', 'بيانات البطاقة مطلوبة.', 'بيانات البطاقة غير صالحة.'], 'Check all required contact, billing and card fields.', '请检查所有必填的联系信息、账单地址和银行卡信息。', 'Проверьте обязательные контактные данные, адрес и поля карты.'],
  [['أدخل مبلغاً صالحاً بمنزلتين عشريتين كحد أقصى.', 'المبلغ خارج النطاق المسموح.', 'الحد الأعلى أقل من الحد الأدنى.'], 'Enter an amount within the allowed limits, with at most two decimal places.', '请输入允许范围内的金额，最多两位小数。', 'Введите сумму в допустимых пределах: не более двух знаков после запятой.'],
  [['سجّل الدخول للمتابعة.'], 'Sign in to continue.', '请登录后继续。', 'Войдите, чтобы продолжить.'],
  [['أنشئ مساحة التاجر أولاً.'], 'Create your merchant workspace first.', '请先创建商户工作区。', 'Сначала создайте кабинет продавца.'],
  [['يتطلب حساب هذا التاجر ربط بيانات PayTabs في إعدادات Netlify بواسطة مسؤول المنصة.', 'عنوان بوابة التاجر غير صالح.', 'تشفير الاشتراكات غير مهيأ.', 'حساب Telr الخاص بهذا التاجر غير مهيأ.'], 'This integration needs configuration by the platform administrator.', '此集成需要由平台管理员完成配置。', 'Эту интеграцию должен настроить администратор платформы.'],
  [['تعذر الاتصال ببوابة الدفع. لا تكرر العملية قبل التحقق من حالتها.', 'تعذر إتمام طلب Telr. تحقق من حالة الدفع قبل تكرار المحاولة.', 'لم تصل بيانات جلسة الدفع. راجع البوابة قبل تكرار المحاولة.', 'لم يصل رابط الدفع من Telr.', 'لم تصل بيانات جلسة Telr.', 'لم تصل بيانات الرابط من البوابة.', 'لم تُرجع البوابة رابطاً صالحاً.', 'تعذر تنفيذ الطلب في بوابة الدفع.'], 'The payment session could not be confirmed. Check the gateway before retrying.', '无法确认支付会话，请先检查支付网关再重试。', 'Платёжную сессию не удалось подтвердить. Проверьте шлюз перед повтором.'],
  [['رفضت بوابة الدفع الطلب. راجع إعدادات حساب التاجر.'], 'The gateway rejected the request. Check the merchant account configuration.', '支付网关拒绝了请求，请检查商户账户配置。', 'Шлюз отклонил запрос. Проверьте настройки аккаунта продавца.'],
  [['استجابة البوابة غير صالحة.', 'رابط البوابة غير صالح.', 'رابط Telr غير صالح.', 'تأكيد Telr لا يطابق الطلب.', 'بيانات التأكيد لا تطابق طلب الدفع.', 'توقيع غير صالح.'], 'Payment verification failed. Contact the merchant.', '付款验证失败，请联系商户。', 'Проверка платежа не пройдена. Свяжитесь с продавцом.'],
  [['وصلت إلى الحد المسموح للمحاولات. حاول لاحقاً.'], 'Too many attempts. Try again later.', '尝试次数过多，请稍后重试。', 'Слишком много попыток. Повторите позже.'],
  [['محاولة الدفع غير موجودة.', 'رابط الدفع غير موجود.', 'طلب الدفع غير موجود.', 'الاشتراك غير موجود.'], 'The requested payment item was not found.', '未找到所请求的付款记录。', 'Запрошенная платёжная запись не найдена.'],
  [['هذه الإعدادات لمسؤول المنصة فقط.'], 'These settings are restricted to the platform administrator.', '这些设置仅限平台管理员操作。', 'Эти настройки доступны только администратору платформы.'],
  [['الموافقة مطلوبة.', 'الموافقة الصريحة على التجديد التلقائي مطلوبة.'], 'Your explicit consent is required.', '需要您的明确同意。', 'Необходимо ваше явное согласие.'],
  [['نماذج البطاقة تتطلب رابط HTTPS آمناً.'], 'Card forms require a secure HTTPS connection.', '银行卡表单需要安全的 HTTPS 连接。', 'Формы карты требуют защищённого HTTPS-соединения.'],
  [['التأكيد لم يصل بعد. انتظر إشعار بوابة الدفع.', 'توجد محاولة دفع أخرى قيد المعالجة.', 'لا يوجد مرجع للتحقق. راجع بوابة الدفع قبل تكرار المحاولة.'], 'Payment is not confirmed yet. Check its status before trying again.', '付款尚未确认，请先查询状态再重试。', 'Платёж ещё не подтверждён. Проверьте его статус перед повтором.'],
  [['تم إيقاف مسار الدفع المشترك؛ استخدم مساحة التاجر المستقلة.', 'نموذج الدفع غير متاح.', 'اختر طريقة دفع متاحة.'], 'Use an available payment method in the merchant’s independent workspace.', '请使用商户独立工作区中可用的支付方式。', 'Используйте доступный способ оплаты в отдельном кабинете продавца.'],
  [['تعذر إنشاء الطلب. حاول لاحقاً.', 'لا يمكن إلغاء هذا الطلب أو أنه غير موجود.'], 'This action could not be completed for the request.', '无法对此请求完成该操作。', 'Не удалось выполнить действие для этого запроса.'],
];
for (const [messages, english, chinese, russian] of errorGroups) for (const message of messages) phrases.push([message, english, chinese, russian]);
const dictionary = new Map(phrases.map(phrase => [phrase[0], phrase]));
const englishDictionary = new Map(phrases.map(phrase => [phrase[1], phrase]));
const languageIndex: Record<Exclude<Language, 'fr'>, number> = { ar: 0, en: 1, zh: 2, ru: 3 };
export function translate(phrase: string, language: Language) {
  const entry = dictionary.get(phrase);
  if (language === 'fr') return french[entry?.[1] ?? phrase] ?? storefrontTranslations.get(entry?.[1] ?? phrase)?.fr ?? entry?.[1] ?? phrase;
  return entry?.[languageIndex[language]] ?? (language === 'zh' || language === 'ru' ? storefrontTranslations.get(phrase)?.[language] : undefined) ?? phrase;
}

export function translatePair(arabic: string, english: string, language: Language) {
  if (language === 'ar') return arabic;
  if (language === 'en') return english;
  const entry = dictionary.get(arabic) ?? englishDictionary.get(english);
  if (entry) return language === 'fr' ? french[entry[1]] ?? entry[1] : entry[languageIndex[language]];
  return storefrontTranslations.get(english)?.[language] ?? (language === 'fr' ? french[english] : undefined) ?? english;
}

const Appearance = createContext<{ language: Language; theme: Theme; setLanguage: (value: Language) => void; setTheme: (value: Theme) => void }>({ language: 'ar', theme: 'dark', setLanguage: () => undefined, setTheme: () => undefined });

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const params = new URLSearchParams(window.location.search);
  const [language, setLanguage] = useState<Language>(languages.some(item => item.id === params.get('lang')) ? params.get('lang') as Language : 'ar');
  const [theme, setTheme] = useState<Theme>(() => {
    const requested = params.get('theme');
    if (requested === 'light' || requested === 'dark') return requested;
    try { return localStorage.getItem('oneshot:theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('oneshot:theme', theme); } catch { /* Storage may be disabled. */ }
    if (!isStorefrontPath(window.location.pathname)) document.title = `oneShot Payments | ${translate('مساحة التاجر', language)}`;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', language);
    url.searchParams.set('theme', theme);
    window.history.replaceState(null, '', url);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0d0f' : '#f7f7f5');
  }, [language, theme]);
  return <Appearance.Provider value={{ language, theme, setLanguage, setTheme }}>{children}</Appearance.Provider>;
}

export function useAppearance() {
  const context = useContext(Appearance);
  const locale = ({ ar: 'ar-SA', en: 'en-GB', zh: 'zh-CN', ru: 'ru-RU', fr: 'fr-FR' } as const)[context.language];
  return { ...context, t: (phrase: string) => translate(phrase, context.language), tr: (arabic: string, english: string) => translatePair(arabic, english, context.language), number: (amount: number) => new Intl.NumberFormat(locale).format(amount), locale, dir: context.language === 'ar' ? 'rtl' as const : 'ltr' as const };
}

export function appearanceLink(path: string) {
  const url = new URL(path, window.location.origin);
  const current = new URLSearchParams(window.location.search);
  for (const key of ['lang', 'theme']) if (current.has(key)) url.searchParams.set(key, current.get(key)!);
  return url.href;
}
