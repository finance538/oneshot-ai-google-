import { useState, type FormEvent } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Send,
  Sparkles,
  KeyRound,
  Store,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Layers,
  Smartphone,
  Monitor,
  Code2,
  ShieldCheck,
  FileText,
  Search
} from 'lucide-react';
import type { Platform } from './platform';
import { api } from './platform';
import { useAppearance } from './i18n';
import { KNOWN_GATEWAYS, type GatewayDefinition, type IntegrationType } from './gatewaysData';
import './GatewayIntegrationManager.css';

interface GatewayIntegrationManagerProps {
  platform: Platform;
  onRefresh: () => Promise<void>;
}

export default function GatewayIntegrationManager({
  platform,
  onRefresh,
}: GatewayIntegrationManagerProps) {
  const { t, tr } = useAppearance();

  // Search & Gateway catalog state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>('paytabs');
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>('hosted');

  // Custom Gateway Modal / Form State (When merchant has a custom unlisted gateway)
  const [showCustomGatewayModal, setShowCustomGatewayModal] = useState(false);
  const [customGwName, setCustomGwName] = useState('');
  const [customGwCountry, setCustomGwCountry] = useState('المملكة العربية السعودية');
  const [customGwWebsite, setCustomGwWebsite] = useState('');
  const [customGwIntegrationType, setCustomGwIntegrationType] = useState('hosted');
  const [customGwFields, setCustomGwFields] = useState([
    { key: 'MERCHANT_ID', value: '' },
    { key: 'API_KEY', value: '' },
    { key: 'SECRET_KEY', value: '' },
  ]);
  const [customGwNotes, setCustomGwNotes] = useState('');

  // Dynamic values form state for selected gateway
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const myRequests = platform.gatewayRequests || [];
  const adminRequests = platform.adminGatewayRequests || [];
  const isAdmin = platform.isAdmin;

  // Payment gateways are provisioned from the platform administrator account only:
  // every connected gateway runs under that account, so other dashboard users get a read-only view.
  if (!isAdmin) {
    const platformGateways: { id: 'paytabs' | 'telr'; label: string; english: string }[] = [
      { id: 'paytabs', label: 'بيتابس (PayTabs)', english: 'PayTabs Gateway' },
      { id: 'telr', label: 'تيلر (Telr)', english: 'Telr Gateway' },
    ];
    return (
      <div className="gateway-integration-hub">
        <section className="panel gateway-hub-intro">
          <div className="hub-intro-header">
            <div className="hub-tag">
              <ShieldCheck size={16} />
              <span>{tr('بوابات الدفع', 'PAYMENT GATEWAYS')}</span>
            </div>
            <h2>بوابات الدفع مرتبطة بحساب مسؤول المنصة</h2>
            <p>
              ربط البوابات وإدخال بياناتها يتم من <strong>حساب مسؤول المنصة</strong> فقط، وكل البوابات المربوطة تعمل تحت ذلك
              الحساب. لا تُطلب منك أي بيانات ربط — ما يُفعّل هناك يتاح تلقائيًا في محفظتك وصفحات الدفع، وتُحصَّل المبالغ في
              حساب المنصة ثم تظهر في محفظتك ورصيدك.
            </p>
          </div>
          <div className="gw-catalog-grid">
            {platformGateways.map((gateway) => {
              const allowed = Boolean(platform.policy?.gateways?.[gateway.id]);
              return (
                <article key={gateway.id} className="gw-catalog-card">
                  <div className="gw-card-top">
                    <h3>{gateway.label}</h3>
                  </div>
                  <p className="gw-short-desc">{gateway.english}</p>
                  <div className="gw-card-footer">
                    <span className="gw-it-badge">{allowed ? 'مفعّلة على المنصة' : 'متوقفة على المنصة'}</span>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="gw-alert-banner success">
            <Info size={18} />
            <span>الظهور الفعلي للبوابة في صفحة الدفع يعتمد على توصيل بياناتها في حساب المسؤول.</span>
          </div>
        </section>
      </div>
    );
  }

  const currentGateway = KNOWN_GATEWAYS.find((g) => g.id === selectedGatewayId) || KNOWN_GATEWAYS[0];
  const currentIntegration =
    currentGateway.integrationTypes.find((it) => it.id === selectedIntegrationId) ||
    currentGateway.integrationTypes[0];

  const handleCopy = async (textToCopy: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedKey(identifier);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCustomerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const variables: Record<string, string> = {
        INTEGRATION_TYPE: currentIntegration.id,
        INTEGRATION_NAME: currentIntegration.name,
        ...formValues,
      };

      await api('platform', {
        action: 'submit-gateway-request',
        gateway: currentGateway.id,
        variables,
        notes: formNotes,
      });

      setStatusMsg({
        type: 'success',
        text: `تم إرسال متغيرات ربط ${currentGateway.name} (${currentIntegration.name}) بنجاح إلى فريق الإدارة! ستتم المراجعة والتفعيل خلال وقت وجيز.`,
      });

      setFormValues({});
      setFormNotes('');
      await onRefresh();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'تعذر إرسال المتغيرات. تأكد من إدخال القيم المطلوبة.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomGatewaySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const variables: Record<string, string> = {
        IS_CUSTOM_GATEWAY: 'true',
        GATEWAY_NAME: customGwName,
        GATEWAY_COUNTRY: customGwCountry,
        GATEWAY_WEBSITE: customGwWebsite,
        INTEGRATION_TYPE: customGwIntegrationType,
      };

      customGwFields.forEach((f) => {
        if (f.key.trim() && f.value.trim()) {
          variables[f.key.trim().toUpperCase()] = f.value.trim();
        }
      });

      await api('platform', {
        action: 'submit-gateway-request',
        gateway: `custom_${customGwName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        variables,
        notes: customGwNotes,
      });

      setStatusMsg({
        type: 'success',
        text: `تم تسجيل تفاصيل البوابة المخصصة (${customGwName}) بنجاح وإرسالها للإدارة للربط!`,
      });

      setShowCustomGatewayModal(false);
      setCustomGwName('');
      setCustomGwWebsite('');
      setCustomGwNotes('');
      await onRefresh();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'تعذر تسجيل البوابة.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminStatusUpdate = async (requestId: string, newStatus: 'pending' | 'configured' | 'rejected') => {
    try {
      await api('platform', {
        action: 'update-gateway-request',
        id: requestId,
        status: newStatus,
      });
      await onRefresh();
    } catch (err: any) {
      alert(err?.message || 'تعذر تحديث الحالة.');
    }
  };

  const filteredGateways = KNOWN_GATEWAYS.filter(
    (gw) =>
      gw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gw.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gw.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="gateway-integration-hub">
      {/* Intro Banner */}
      <section className="panel gateway-hub-intro">
        <div className="hub-intro-header">
          <div className="hub-tag">
            <Sparkles size={16} />
            <span>{tr('مركز ربط جميع بوابات الدفع الإلكتروني', 'ALL-IN-ONE GATEWAY HUB')}</span>
          </div>
          <h2>ربط وتكوين بوابات الدفع الإلكتروني بجميع أنواع الربط</h2>
          <p>
            سواء كنت تربط عبر <strong>تطبيقات الجوال (Mobile SDK)</strong>، أو عبر{' '}
            <strong>صفحة الدفع المستضافة (Hosted)</strong>، أو <strong>الإطار المدمج (iFrame)</strong>، أو{' '}
            <strong>الربط المباشر للخوادم (Direct API)</strong>. اختر البوابة المطلوبة (تيلر، بيتابس، ماي فاتورة، بي زاتي، تابي، نون، بي وان)،
            أو أضف أي بوابة مخصصة جديدة لتسجيل تفاصيلها مباشرة لحسابك.
          </p>

          <div className="hub-header-actions">
            <div className="search-gateway-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="ابحث عن بوابة بالاسم أو الدولة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="primary-button add-custom-gw-btn"
              onClick={() => setShowCustomGatewayModal(true)}
            >
              <Plus size={16} />
              <span>إضافة بوابة دفع غير موجودة</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className={`gw-alert-banner ${statusMsg.type}`}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Gateways Catalog Cards */}
        <div className="gw-catalog-grid">
          {filteredGateways.map((gw) => {
            const isSelected = selectedGatewayId === gw.id;
            return (
              <article
                key={gw.id}
                className={`gw-catalog-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedGatewayId(isSelected ? null : gw.id);
                  setSelectedIntegrationId(gw.integrationTypes[0].id);
                  setFormValues({});
                }}
              >
                <div className="gw-card-top">
                  <div className={`gw-logo-badge ${gw.logoTheme}`}>{gw.english.split(' ')[0]}</div>
                  <span className="gw-country-pill">{gw.country}</span>
                </div>
                <h3>{gw.name}</h3>
                <p className="gw-short-desc">{gw.description}</p>

                {/* Available Integration Types Tags */}
                <div className="gw-integration-badges-strip">
                  {gw.integrationTypes.map((it) => (
                    <span key={it.id} className="gw-it-badge">
                      {it.id === 'mobile' ? '📱 جوال' : it.id === 'hosted' ? '🌐 هوست' : it.id === 'framed' ? '🖼️ مدمج' : '⚡ مباشر'}
                    </span>
                  ))}
                </div>

                <div className="gw-card-footer">
                  <span className="action-hint">
                    {isSelected ? 'إغلاق نافذة الربط' : 'اضغط لاختيار نوع الربط وإدخال المفاتيح'}
                  </span>
                  <span className="expand-arrow">
                    {isSelected ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Expanded Integration Section for Selected Gateway */}
      {selectedGatewayId && currentGateway && (
        <section className="panel gw-detail-panel animate-fade-in">
          <div className="gw-detail-header">
            <div>
              <span className="subtle-badge">{currentGateway.english} · Configuration & Keys</span>
              <h2>تكوين وربط {currentGateway.name}</h2>
              <p className="gw-detail-subdesc">
                اختر نوع الربط المناسب لطبيعة متجرك (جوال، هوست، إطار، أو API)، ثم أدخل المفاتيح المطلوبة ليتم ربطها.
              </p>
            </div>
            {currentGateway.website && (
              <a
                href={currentGateway.website}
                target="_blank"
                rel="noreferrer"
                className="gw-portal-link"
              >
                <span>لوحة تحكم البوابة</span>
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          {/* Integration Types Selector Tabs */}
          <div className="integration-tabs-wrapper">
            <label className="section-selector-label">
              <Layers size={16} />
              <span>اختر نوع الربط المطلوب لهذه البوابة:</span>
            </label>
            <div className="integration-tabs-grid">
              {currentGateway.integrationTypes.map((it) => {
                const isCurrent = selectedIntegrationId === it.id;
                return (
                  <button
                    key={it.id}
                    type="button"
                    className={`it-selection-card ${isCurrent ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedIntegrationId(it.id);
                      setFormValues({});
                    }}
                  >
                    <div className="it-card-top">
                      {it.id === 'mobile' ? (
                        <Smartphone size={18} className="it-icon" />
                      ) : it.id === 'hosted' ? (
                        <Monitor size={18} className="it-icon" />
                      ) : (
                        <Code2 size={18} className="it-icon" />
                      )}
                      <span className="it-badge-tag">{it.badge}</span>
                    </div>
                    <strong>{it.name}</strong>
                    <p>{it.description}</p>
                    <small className="it-suitability">مناسب لـ: {it.suitableFor}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form for the selected integration type */}
          <form className="gw-credentials-form" onSubmit={handleCustomerSubmit}>
            <div className="form-legend-box">
              <KeyRound size={20} />
              <div>
                <h4>
                  إدخال متغيرات ومفاتيح الربط لنوع: <span>{currentIntegration.name}</span>
                </h4>
                <p>
                  المتغيرات المدخلة مشفرة وآمنة تماماً، ويتم تحويلها لمتغيرات بيئة خاصة بمتجرك لتفعيل
                  استقبال المدفوعات فوراً.
                </p>
              </div>
            </div>

            <div className="gw-form-fields-grid">
              {currentIntegration.requiredFields.map((field) => (
                <div className="gw-field-group" key={field.key}>
                  <label>
                    <span>{field.label}</span>
                    <code>{field.key}</code>
                  </label>
                  <input
                    type={field.isSecret ? 'password' : 'text'}
                    dir="ltr"
                    placeholder={field.placeholder}
                    value={formValues[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>

            <div className="gw-field-group full-width">
              <label>
                <span>ملاحظات إضافية أو روابط Webhook خاصة بك (اختياري)</span>
              </label>
              <textarea
                rows={2}
                placeholder="أدخل أي ملاحظات خاصة بإصدار الـ SDK، أو حساب العملة، أو إعدادات المتجر..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className="gw-form-actions">
              <button className="primary-button" type="submit" disabled={submitting}>
                <Send size={16} />
                <span>{submitting ? 'جارٍ الإرسال...' : `إرسال طلب ربط ${currentGateway.name}`}</span>
              </button>
              <div className="security-notice-inline">
                <ShieldCheck size={16} />
                <span>تشفير من طرف لطرف · متوافق مع معايير PCI-DSS</span>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Custom Gateway Modal */}
      {showCustomGatewayModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog-box animate-fade-in">
            <div className="modal-dialog-header">
              <h3>إضافة بوابة دفع جديدة وغير موجودة بالقائمة</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowCustomGatewayModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCustomGatewaySubmit}>
              <div className="modal-body-content">
                <p className="modal-intro-text">
                  إذا كنت تتعامل مع بوابة دفع إضافية غير مدرجة بالقائمة، يمكنك إدخال اسمها وتحديد نوع
                  الربط والمتغيرات المطلوبة وسيتم اعتمادها في حسابك.
                </p>

                <div className="modal-input-row">
                  <label>اسم بوابة الدفع:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Checkout.com أو Geidea أو Payfort"
                    value={customGwName}
                    onChange={(e) => setCustomGwName(e.target.value)}
                  />
                </div>

                <div className="modal-input-row">
                  <label>دولة البوابة ونطاق العمل:</label>
                  <input
                    type="text"
                    placeholder="المملكة العربية السعودية، الإمارات، دولي..."
                    value={customGwCountry}
                    onChange={(e) => setCustomGwCountry(e.target.value)}
                  />
                </div>

                <div className="modal-input-row">
                  <label>موقع البوابة الإلكتروني / رابط الوثائق البرمجية:</label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://..."
                    value={customGwWebsite}
                    onChange={(e) => setCustomGwWebsite(e.target.value)}
                  />
                </div>

                <div className="modal-input-row">
                  <label>نوع الربط المستخدم:</label>
                  <select
                    value={customGwIntegrationType}
                    onChange={(e) => setCustomGwIntegrationType(e.target.value)}
                  >
                    <option value="hosted">صفحة دفع مستضافة (Hosted Checkout)</option>
                    <option value="mobile">ربط تطبيقات الجوال (Mobile SDK / App)</option>
                    <option value="framed">إطار مدمج (Embedded iFrame)</option>
                    <option value="direct_api">ربط خوادم مباشر (Direct Server API)</option>
                  </select>
                </div>

                <div className="custom-fields-builder">
                  <label>حقول ومتغيرات البوابة (اسم المفتاح والقيمة):</label>
                  {customGwFields.map((f, idx) => (
                    <div key={idx} className="dynamic-field-pair">
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="اسم المتغير (مثال: ENTITY_ID)"
                        value={f.key}
                        onChange={(e) => {
                          const updated = [...customGwFields];
                          updated[idx].key = e.target.value;
                          setCustomGwFields(updated);
                        }}
                      />
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="القيمة السرية للمتغير"
                        value={f.value}
                        onChange={(e) => {
                          const updated = [...customGwFields];
                          updated[idx].value = e.target.value;
                          setCustomGwFields(updated);
                        }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="outline-button add-field-btn"
                    onClick={() =>
                      setCustomGwFields([...customGwFields, { key: '', value: '' }])
                    }
                  >
                    <Plus size={14} /> إضافة حقل متغير آخر
                  </button>
                </div>

                <div className="modal-input-row">
                  <label>ملاحظات إضافية:</label>
                  <textarea
                    rows={2}
                    placeholder="أي تفاصيل خاصة بتشغيل هذه البوابة..."
                    value={customGwNotes}
                    onChange={(e) => setCustomGwNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-dialog-footer">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setShowCustomGatewayModal(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? 'جارٍ الحفظ...' : 'حفظ وإرسال تفاصيل البوابة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer's Previous Requests Table */}
      {myRequests.length > 0 && (
        <section className="panel gw-previous-requests">
          <div className="section-heading">
            <Clock size={20} />
            <div>
              <h3>سجل طلبات ربط البوابات الخاصة بك</h3>
              <p>حالة مراجعة وتفعيل المتغيرات التي قمت بإرسالها مسبقاً</p>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>البوابة</th>
                  <th>نوع الربط</th>
                  <th>تاريخ الإرسال</th>
                  <th>المتغيرات المرسلة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong className="gw-name-badge">
                        {req.gateway.replace('custom_', '').toUpperCase()}
                      </strong>
                    </td>
                    <td>
                      <span className="req-it-pill">
                        {req.variables?.INTEGRATION_NAME || req.variables?.INTEGRATION_TYPE || 'قياسي'}
                      </span>
                    </td>
                    <td>{new Date(req.createdAt).toLocaleDateString('ar-SA')}</td>
                    <td>
                      <div className="vars-summary">
                        {Object.keys(req.variables || {})
                          .filter((k) => !k.startsWith('INTEGRATION_'))
                          .map((k) => (
                            <span key={k} className="var-chip">
                              {k}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill pill-${req.status}`}>
                        {req.status === 'configured'
                          ? 'تم التفعيل والربط'
                          : req.status === 'rejected'
                          ? 'مرفوض'
                          : 'قيد المراجعة والربط'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ADMIN RECEPTION PANEL (Receiving Gateway Requests) */}
      {isAdmin && (
        <section className="panel admin-finance-hub">
          <div className="finance-hub-header">
            <div className="finance-badge">
              <Store size={18} />
              <span>استقبال طلبات ربط البوابات (حساب الأدمن)</span>
            </div>
            <h2>طلبات ربط البوابات الواردة من التجار والعملاء</h2>
            <p>
              يستقبل الأدمن هنا جميع طلبات التجار بمختلف بوابات الدفع (تيلر، بيتابس، ماي فاتورة، بي زاتي،
              تابي، نون، بي وان، وغيرها)، بجميع أنواع الربط (جوال، هوست، إطار، API)، مع إمكانية نسخ كل
              متغير بضغطة زر وتغيير حالة الطلب فور تفعيله.
            </p>
          </div>

          {!adminRequests.length ? (
            <div className="empty-admin-requests">
              <Info size={24} />
              <span>لا توجد طلبات ربط جديدة من العملاء حالياً.</span>
            </div>
          ) : (
            <div className="admin-requests-list">
              {adminRequests.map((req) => {
                const gwUpper = req.gateway.replace('custom_', '').toUpperCase();
                const prefix = `${gwUpper}_${req.merchantId.replace(/-/g, '').toUpperCase()}`;

                return (
                  <article className="admin-req-card" key={req.id}>
                    <div className="req-card-top">
                      <div className="req-merchant-info">
                        <strong>متجر: {req.merchantName || 'تاجر بدون اسم'}</strong>
                        <span className="req-merchant-sub">
                          معرّف التاجر: <code>{req.merchantId}</code> • مقدم الطلب: {req.submittedBy}
                        </span>
                      </div>
                      <div className="req-status-controls">
                        <span className={`status-pill pill-${req.status}`}>
                          {req.status === 'configured'
                            ? 'تم الربط والتفعيل'
                            : req.status === 'rejected'
                            ? 'مرفوض'
                            : 'معلق بانتظار الإعداد'}
                        </span>
                        <div className="status-buttons">
                          <button
                            type="button"
                            className="status-btn check"
                            title="تحديد كمكتمل"
                            onClick={() => handleAdminStatusUpdate(req.id, 'configured')}
                          >
                            <Check size={14} /> تم التفعيل
                          </button>
                          <button
                            type="button"
                            className="status-btn cancel"
                            title="تحديد كمعلق"
                            onClick={() => handleAdminStatusUpdate(req.id, 'pending')}
                          >
                            معلق
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="req-vars-box">
                      <div className="vars-box-header">
                        <span>المتغيرات الصالحة للنسخ واللصق:</span>
                        <div className="req-tags-bundle">
                          <span className="req-gateway-badge">{gwUpper}</span>
                          {req.variables?.INTEGRATION_NAME && (
                            <span className="req-it-name-badge">
                              {req.variables.INTEGRATION_NAME}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="copy-vars-list">
                        {Object.entries(req.variables || {})
                          .filter(([key]) => !key.startsWith('INTEGRATION_'))
                          .map(([key, val]) => {
                            const envVarName = `${prefix}_${key}`;
                            const isCopied = copiedKey === `${req.id}-${key}`;

                            return (
                              <div className="copy-var-row" key={key}>
                                <div className="env-meta">
                                  <span className="env-name" dir="ltr">
                                    {envVarName}
                                  </span>
                                  <span className="env-val" dir="ltr">
                                    {val}
                                  </span>
                                </div>
                                <div className="copy-actions">
                                  <button
                                    type="button"
                                    className={`copy-btn ${isCopied ? 'copied' : ''}`}
                                    onClick={() =>
                                      handleCopy(`${envVarName}=${val}`, `${req.id}-${key}`)
                                    }
                                    title="نسخ الاسم والقيمة معاً"
                                  >
                                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                    <span>{isCopied ? 'تم النسخ!' : 'نسخ المتغير'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="copy-btn-val"
                                    onClick={() => handleCopy(val, `${req.id}-${key}-val`)}
                                    title="نسخ القيمة فقط"
                                  >
                                    القيمة فقط
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {req.notes && (
                        <div className="req-notes">
                          <strong>ملاحظات العميل:</strong> {req.notes}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
