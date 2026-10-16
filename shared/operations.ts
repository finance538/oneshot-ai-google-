export const operationKinds = ['customer_registration', 'merchant_registration', 'sign_in', 'gateway_request', 'api_request'] as const;
export type OperationKind = typeof operationKinds[number];
export const operationLabels: Record<OperationKind, string> = {
  customer_registration: 'تسجيل حساب عميل', merchant_registration: 'تسجيل تاجر', sign_in: 'تسجيل دخول ناجح', gateway_request: 'طلب ربط بوابة', api_request: 'طلب ربط API للعميل',
};

export interface OperationRecord {
  id: string;
  kind: OperationKind;
  merchantId: string | null;
  subjectId: string;
  provider: string | null;
  createdAt: string;
  read: boolean;
}

export interface OperationsState {
  records: OperationRecord[];
  unread: number;
  hasMore: boolean;
  aiAvailable: boolean;
  providers: { id: string; name: string; available: false; reason: string; requirements: string }[];
  audit: { id: string; eventId: string | null; merchantId: string | null; action: string; createdAt: string }[];
}

export function previewOnly(context: string | undefined) {
  return context === 'deploy-preview';
}

export function parseOperationsQuery(input: Record<string, unknown>) {
  if (Object.keys(input).some(key => !['query', 'kind', 'offset', 'unread', 'merchantId'].includes(key))) throw new Error('حقول بحث غير مدعومة.');
  const query = input.query ?? '';
  const kind = input.kind ?? '';
  const offset = Number(input.offset ?? 0);
  const unread = input.unread ?? false;
  if (typeof query !== 'string' || query.length > 100 || !/^[a-zA-Z0-9_\- ]*$/.test(query)) throw new Error('استخدم معرّف السجل أو نوعه أو اسم البوابة للبحث، وليس بيانات شخصية.');
  if (kind !== '' && !operationKinds.includes(kind as OperationKind)) throw new Error('نوع السجل غير صالح.');
  if (!Number.isInteger(offset) || offset < 0 || offset > 10000) throw new Error('رقم الصفحة غير صالح.');
  if (typeof unread !== 'boolean') throw new Error('مرشح التنبيهات غير صالح.');
  return { query: query.trim().toLowerCase(), kind: kind as OperationKind | '', offset, unread };
}

export function requireOperationsConfirmation(input: Record<string, unknown>) {
  if (input.confirmation !== true) throw new Error('راجع التغيير وأكّده صراحةً قبل التنفيذ.');
}

export function providerBoundaries(): OperationsState['providers'] {
  return [
    { id: 'research', name: 'البحث العميق والمصادر', available: false, reason: 'لا يوجد مزوّد بحث مهيأ. لا تُنشأ نتائج أو استشهادات افتراضية.', requirements: 'حساب بحث معتمد مثل Tavily، ومحوّل خادمي يتحقق من المصادر قبل التفعيل.' },
    { id: 'email', name: 'البريد الإلكتروني', available: false, reason: 'الإرسال والمسودات غير مفعّلة دون تفويض مزوّد البريد.', requirements: 'حساب بريد مفوّض لكل عميل، ومسودة محفوظة ومراجعة المستلمين والنص ثم تأكيد إرسال منفصل وسجل تدقيق.' },
    { id: 'documents', name: 'تعبئة PDF والمستندات', available: false, reason: 'لا يوجد مزوّد مستندات أو قوالب معتمدة.', requirements: 'حساب مزوّد مستندات، وقوالب وحقول معتمدة وتخزين ملفات معزول وفحصها قبل المعالجة.' },
    { id: 'esign', name: 'العقود والتوقيع الإلكتروني', available: false, reason: 'لا يوجد مزوّد توقيع مفوّض. لا يُعتبر إنشاء نص عقد توقيعاً.', requirements: 'حساب DocuSign أو مزوّد مدعوم، وتفويض العميل وتأكيد الموقّعين والتحقق من webhooks وسجل تدقيق.' },
    { id: 'customer_api', name: 'اتصالات API للعميل', available: false, reason: 'يمكن تسجيل طلب إعداد فقط؛ لا تُقبل أو تُحفظ أسرار هنا.', requirements: 'تفويض العميل، وخزنة أسرار مشفّرة معزولة حسب التاجر، ومحوّل API بقائمة وجهات مسموحة. لا متغيرات Netlify عامة لأسرار العميل ولا إرسالها للنموذج.' },
    { id: 'browser', name: 'أتمتة المتصفح', available: false, reason: 'لا يوجد متصفح بعيد معزول ومفوّض.', requirements: 'حساب Browserbase أو مزوّد متصفح بعيد، وعزل جلسات العملاء وقائمة نطاقات مسموحة ومراجعة كل تعديل. لا استخدام لهذه الجلسة أو وصول غير مقيد للحاسوب.' },
  ];
}
