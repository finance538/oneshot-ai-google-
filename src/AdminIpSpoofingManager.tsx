import { useState, useEffect, useMemo } from 'react';
import {
  Globe, Shield, Wifi, RefreshCw, Check, CheckCircle2,
  AlertTriangle, Sliders, Server, Cpu, Play, Copy, ArrowRight,
  ExternalLink, Layers, Sparkles, X, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import {
  SPOOFED_COUNTRIES_CATALOG,
  DEFAULT_ADMIN_IP_CONFIG,
  getGatewayGeoRules,
  type SpoofedCountry,
  type AdminIpSpoofingConfig
} from './adminIpSpoofingData';
import './AdminIpSpoofingManager.css';

interface AdminIpSpoofingManagerProps {
  onNotify?: (message: string) => void;
}

export default function AdminIpSpoofingManager({ onNotify }: AdminIpSpoofingManagerProps) {
  // Load configuration from local storage or defaults
  const [config, setConfig] = useState<AdminIpSpoofingConfig>(() => {
    try {
      const saved = localStorage.getItem('oneshot_admin_ip_spoofing');
      return saved ? { ...DEFAULT_ADMIN_IP_CONFIG, ...JSON.parse(saved) } : DEFAULT_ADMIN_IP_CONFIG;
    } catch {
      return DEFAULT_ADMIN_IP_CONFIG;
    }
  });

  const [regionFilter, setRegionFilter] = useState<'all' | 'gcc' | 'arab' | 'europe' | 'north_america' | 'asia'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customIpInput, setCustomIpInput] = useState(config.customIp || '');
  const [customCountryInput, setCustomCountryInput] = useState(config.customCountryName || '');
  const [customCityInput, setCustomCityInput] = useState(config.customCityName || '');
  const [customIspInput, setCustomIspInput] = useState(config.customIsp || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAdvancedHeaders, setShowAdvancedHeaders] = useState(false);

  // Live Geo-Probe State
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<{
    timestamp: string;
    gateway: string;
    sentIp: string;
    resolvedCountry: string;
    resolvedCity: string;
    isp: string;
    headers: Record<string, string>;
    status: 'passed' | 'warning' | 'rejected';
    score: number;
    decision: string;
    reasons: string[];
  } | null>(null);

  // Selected preset country
  const currentCountry = useMemo(() => {
    return SPOOFED_COUNTRIES_CATALOG.find(c => c.code === config.selectedCountryCode) || SPOOFED_COUNTRIES_CATALOG[0];
  }, [config.selectedCountryCode]);

  // Filtered countries
  const filteredCountries = useMemo(() => {
    if (regionFilter === 'all') return SPOOFED_COUNTRIES_CATALOG;
    return SPOOFED_COUNTRIES_CATALOG.filter(c => c.region === regionFilter);
  }, [regionFilter]);

  // Current effective IP and Country
  const activeIp = config.isCustomActive && config.customIp ? config.customIp : currentCountry.ip;
  const activeCountryName = config.isCustomActive && config.customCountryName ? config.customCountryName : currentCountry.countryName;
  const activeCityName = config.isCustomActive && config.customCityName ? config.customCityName : currentCountry.cityName;
  const activeIsp = config.isCustomActive && config.customIsp ? config.customIsp : currentCountry.isp;

  // Compatibility rules for currently selected location
  const geoRules = useMemo(() => {
    return getGatewayGeoRules(currentCountry);
  }, [currentCountry]);

  // Save changes to localStorage and broadcast to other components
  const saveConfig = (newConfig: AdminIpSpoofingConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('oneshot_admin_ip_spoofing', JSON.stringify(newConfig));
      // Also sync active IP to the testing suite proxy
      const countryObj = SPOOFED_COUNTRIES_CATALOG.find(c => c.code === newConfig.selectedCountryCode);
      if (countryObj) {
        localStorage.setItem('oneshot_test_active_proxy', JSON.stringify({
          code: countryObj.code,
          name: newConfig.isCustomActive ? `${newConfig.customCountryName} (${newConfig.customCityName})` : `${countryObj.countryName} (${countryObj.cityName})`,
          ip: newConfig.isCustomActive && newConfig.customIp ? newConfig.customIp : countryObj.ip,
          isp: newConfig.isCustomActive && newConfig.customIsp ? newConfig.customIsp : countryObj.isp,
          ping: countryObj.avgLatency
        }));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      if (onNotify) onNotify('تم حفظ وتطبيق إعدادات انتحال الـ IP بنجاح.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCountry = (country: SpoofedCountry) => {
    const updated = {
      ...config,
      selectedCountryCode: country.code,
      isCustomActive: false
    };
    saveConfig(updated);
  };

  const handleApplyCustomIp = (e: React.FormEvent) => {
    e.preventDefault();
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9]?)$/;
    if (!ipRegex.test(customIpInput.trim())) {
      alert('يرجى إدخال عنوان IPv4 صالح (مثال: 178.80.124.45)');
      return;
    }

    const updated: AdminIpSpoofingConfig = {
      ...config,
      customIp: customIpInput.trim(),
      customCountryName: customCountryInput.trim() || 'موقع مخصص',
      customCityName: customCityInput.trim() || 'شبكة تجريبية',
      customIsp: customIspInput.trim() || 'Dedicated Proxy ISP',
      isCustomActive: true
    };
    saveConfig(updated);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل تريد استعادة الإعدادات الافتراضية لانتحال الموقع الجغرافي؟')) {
      saveConfig(DEFAULT_ADMIN_IP_CONFIG);
      setCustomIpInput('');
      setCustomCountryInput('');
      setCustomCityInput('');
      setCustomIspInput('');
    }
  };

  // Run live probe test with spoofed headers
  const handleRunGeoProbe = (gatewayTarget: string = 'paytabs') => {
    setIsProbing(true);
    setProbeResult(null);

    setTimeout(() => {
      const headersSent: Record<string, string> = {};
      if (config.injectHeaders.xForwardedFor) headersSent['X-Forwarded-For'] = `${activeIp}, 10.0.4.15`;
      if (config.injectHeaders.cfConnectingIp) headersSent['CF-Connecting-IP'] = activeIp;
      if (config.injectHeaders.xRealIp) headersSent['X-Real-IP'] = activeIp;
      if (config.injectHeaders.trueClientIp) headersSent['True-Client-IP'] = activeIp;
      if (config.injectHeaders.clientGeoCountry) headersSent['X-Client-Geo-Country'] = currentCountry.code.slice(0, 2);

      const targetRule = geoRules.find(r => r.gatewayId === gatewayTarget) || geoRules[0];
      const isBlocked = targetRule.supportLevel === 'blocked';
      const isRestricted = targetRule.supportLevel === 'restricted';

      const reasons: string[] = [];
      let score = 98;
      let status: 'passed' | 'warning' | 'rejected' = 'passed';
      let decision = 'الطلب مقبول ومعتمد للدفع';

      if (isBlocked) {
        status = 'rejected';
        score = 25;
        decision = `تم رفض الطلب بواسطة جدار الحماية الجغرافي لبوابة ${targetRule.gatewayName}`;
        reasons.push(`الدولة المحاكاة (${activeCountryName}) غير مدرجة في النطاق الجغرافي المسموح.`);
        reasons.push('السياسة الأمنية للبوابة ترفض طلبات الـ IP الصادرة خارج مناطق التغطية المحددة.');
      } else if (isRestricted) {
        status = 'warning';
        score = 65;
        decision = 'الطلب قيد المراجعة الأمنية الإضافية (3DS Step-Up)';
        reasons.push('الـ IP المحاكى صادر من خارج النطاق الإقليمي الأساسي للبوابة.');
        reasons.push('يتطلب تفعيل التحقق الثنائي وإدخال رمز OTP إضافي لإتمام الدفع.');
      } else {
        reasons.push(`محاكاة: تم افتراض قبول العنوان (${activeIp}) كعنوان محلي معتمد — لا يوجد فحص شبكي فعلي.`);
        reasons.push(`محاكاة: مزود الخدمة ${activeIsp} وزمن الاستجابة ${currentCountry.avgLatency} مأخوذان من جدول مرجعي داخل الواجهة، لا من استعلام حقيقي.`);
        reasons.push('محاكاة: لا تُرسل أي ترويسات X-Forwarded-For ولا يوجد فحص Geo-IP أو قواعد احتيال فعلية — النتيجة محسوبة محليًا.');
      }

      setProbeResult({
        timestamp: new Date().toLocaleTimeString('ar-SA'),
        gateway: targetRule.gatewayName,
        sentIp: activeIp,
        resolvedCountry: activeCountryName,
        resolvedCity: activeCityName,
        isp: activeIsp,
        headers: headersSent,
        status,
        score,
        decision,
        reasons
      });

      setIsProbing(false);
    }, 850);
  };

  return (
    <div className="admin-ip-spoofing-manager">
      {/* Top Header Card */}
      <div className="ip-spoofing-hero">
        <div className="ip-spoofing-hero-content">
          <div className="ip-badge-header">
            <span className="live-pulse" />
            <span>نظام محاكاة وتوجيه الـ IP الجغرافي (Geo IP Spoofing Engine)</span>
          </div>
          <h2>تغيير الموقع الجغرافي لطلبات الدفع التجريبية</h2>
          <p>
            تسمح هذه الواجهة لمدير المنصة بتحديد الدولة وعنوان الـ IP المحقون في ترويسات كل طلب دفع اختباري،
            لضمان توافقية بوابات الدفع (بيتابس، تيلر، ماي فاتورة، تابي، بي زاتي) مع معايير الحظر الجغرافي والتحقق من العملات.
          </p>
        </div>

        <div className="hero-toggle-card">
          <div className="hero-toggle-info">
            <strong>حالة محاكاة الـ IP</strong>
            <span>{config.enabled ? 'مفعل لجميع اختبارات البوابات' : 'معطل (استخدام IP الخادم الفعلي)'}</span>
          </div>
          <button
            type="button"
            className={`ip-master-switch ${config.enabled ? 'active' : ''}`}
            onClick={() => saveConfig({ ...config, enabled: !config.enabled })}
          >
            <span className="switch-knob" />
            <span>{config.enabled ? 'مفعّل' : 'معطّل'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="ip-save-alert" role="status">
          <CheckCircle2 size={18} />
          <span>تم تحديث وتثبيت إعدادات الـ IP Spoofing بنجاح وتطبيقها على كافة اختبارات المنصة.</span>
        </div>
      )}

      {/* Active IP Status Monitor Banner */}
      <div className="active-geo-status-banner">
        <div className="status-grid-item">
          <span className="meta-label">الموقع الجغرافي الفعّال</span>
          <div className="meta-value flag-val">
            <span className="big-flag">{config.isCustomActive ? '🌐' : currentCountry.flag}</span>
            <div>
              <strong>{activeCountryName}</strong>
              <small>{activeCityName}</small>
            </div>
          </div>
        </div>

        <div className="status-grid-item">
          <span className="meta-label">عنوان الـ IP المحاكى (Spoofed IP)</span>
          <div className="meta-value ip-val">
            <code dir="ltr">{activeIp}</code>
            <button
              className="mini-copy-btn"
              onClick={() => handleCopy(activeIp, 'active_ip')}
              title="نسخ عنوان الـ IP"
            >
              {copiedKey === 'active_ip' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="status-grid-item">
          <span className="meta-label">مزود الخدمة والشبكة (ISP / ASN)</span>
          <div className="meta-value">
            <span className="isp-name">{activeIsp}</span>
          </div>
        </div>

        <div className="status-grid-item">
          <span className="meta-label">نمط التشغيل للطلبات</span>
          <div className="meta-value">
            <span className="mode-pill">
              {config.proxyMode === 'fixed' && 'تثبيت الموقع المختار'}
              {config.proxyMode === 'auto_card_bin' && 'مطابقة دولة البطاقة تلقائياً'}
              {config.proxyMode === 'fraud_stress' && 'محاكاة احتيال (Mismatch)'}
              {config.proxyMode === 'random_rotation' && 'تدوير عشوائي للمواقع'}
            </span>
          </div>
        </div>

        <div className="status-grid-actions">
          <button
            className="probe-quick-btn"
            disabled={isProbing || !config.enabled}
            onClick={() => handleRunGeoProbe('paytabs')}
          >
            {isProbing ? <RefreshCw className="spin" size={15} /> : <Play size={15} />}
            <span>فحص تجريبي للموقع</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="ip-section-card">
        <div className="ip-card-header">
          <div className="header-icon-box">
            <Sliders size={20} />
          </div>
          <div>
            <h3>سياسة تطبيق الـ IP على طلبات الدفع</h3>
            <p>اختر السلوك البرمجي الذي سيتم اعتماده عند توليد أو تجربة طلب دفع عبر البوابات.</p>
          </div>
        </div>

        <div className="mode-selection-grid">
          {[
            {
              id: 'fixed',
              title: 'تثبيت الموقع الجغرافي المحدد',
              badge: 'الوضع القياسي',
              desc: 'يتم إرسال كافة طلبات الدفع بنفس الـ IP والدولة المحددة أدناه بغض النظر عن البطاقة المستخدمة.'
            },
            {
              id: 'auto_card_bin',
              title: 'مطابقة دولة الـ IP مع بطاقة الدفع (Auto-Match)',
              badge: 'موصى به',
              desc: 'يقوم النظام تلقائياً باختيار IP سعودي لبطاقات مدى، وإماراتي لبطاقات بنك دبي، وأمريكي لبطاقات تشيس لتفادي الرفض الجغرافي.'
            },
            {
              id: 'fraud_stress',
              title: 'محاكاة تعارض جغرافي (Geo-Fraud Stress Test)',
              badge: 'اختبار الحماية',
              desc: 'يتعمد إرسال طلب ببطاقة سعودية من IP أمريكي أو أوروبي لاختبار يقظة أنظمة كشف الاحتيال ورفض المعاملة.'
            },
            {
              id: 'random_rotation',
              title: 'تدوير عشوائي للمواقع (Random Rotation)',
              badge: 'اختبار التنوع',
              desc: 'يتم تغيير عنوان الـ IP والدولة مع كل نقرة تجربة أو إرسال طلب دفع لفحص استقرار البوابات.'
            }
          ].map(mode => (
            <div
              key={mode.id}
              className={`mode-option-card ${config.proxyMode === mode.id ? 'selected' : ''}`}
              onClick={() => saveConfig({ ...config, proxyMode: mode.id as AdminIpSpoofingConfig['proxyMode'] })}
            >
              <div className="mode-top">
                <span className="mode-radio">{config.proxyMode === mode.id && <span className="radio-dot" />}</span>
                <strong>{mode.title}</strong>
              </div>
              <span className="mode-badge">{mode.badge}</span>
              <p>{mode.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preset Countries Grid */}
      <div className="ip-section-card">
        <div className="ip-card-header">
          <div className="header-icon-box">
            <Globe size={20} />
          </div>
          <div className="header-flex-text">
            <div>
              <h3>كتالوج المواقع الجغرافية المعتمدة (Geo Catalog)</h3>
              <p>حدد الدولة والموقع الذي ترغب في انتحاله كوجهة لطلبات الاختبار الحالية.</p>
            </div>
            <div className="region-filter-tabs">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'gcc', label: 'الخليج العربي' },
                { id: 'arab', label: 'الدول العربية' },
                { id: 'europe', label: 'أوروبا' },
                { id: 'north_america', label: 'أمريكا الشمالية' },
                { id: 'asia', label: 'آسيا' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`region-tab ${regionFilter === f.id ? 'active' : ''}`}
                  onClick={() => setRegionFilter(f.id as typeof regionFilter)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="countries-grid">
          {filteredCountries.map(country => {
            const isSelected = !config.isCustomActive && config.selectedCountryCode === country.code;
            return (
              <div
                key={country.code}
                className={`country-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectCountry(country)}
              >
                <div className="country-card-header">
                  <span className="country-flag">{country.flag}</span>
                  <div className="country-title">
                    <strong>{country.countryName}</strong>
                    <small>{country.cityName}</small>
                  </div>
                  {isSelected && <span className="active-tag"><Check size={12} /> نشط</span>}
                </div>

                <div className="country-card-details">
                  <div className="detail-line">
                    <span>IP المخصص:</span>
                    <code dir="ltr">{country.ip}</code>
                  </div>
                  <div className="detail-line">
                    <span>مزود الشبكة:</span>
                    <span className="truncate-text">{country.isp}</span>
                  </div>
                  <div className="detail-line">
                    <span>زمن الاستجابة:</span>
                    <span className="latency-text">{country.avgLatency}</span>
                  </div>
                </div>

                <div className="card-supported-chips">
                  {country.supportedCards.slice(0, 3).map(card => (
                    <span key={card} className="card-chip">{card}</span>
                  ))}
                  {country.supportedCards.length > 3 && (
                    <span className="card-chip more">+{country.supportedCards.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom IP & Advanced Proxy Settings */}
      <div className="ip-section-card">
        <div className="ip-card-header">
          <div className="header-icon-box">
            <Server size={20} />
          </div>
          <div>
            <h3>إدخال عنوان IP مخصص وخادم محاكاة مستقل (Custom IP)</h3>
            <p>أدخل عنوان IPv4 فريد مع تحديد بيانات الدولة والمدينة لاختبار سيناريوهات جغرافية محددة.</p>
          </div>
        </div>

        <form onSubmit={handleApplyCustomIp} className="custom-ip-form">
          <div className="form-grid-row">
            <label className="form-field">
              <span>عنوان IPv4 المخصص *</span>
              <input
                type="text"
                dir="ltr"
                placeholder="178.80.124.45"
                value={customIpInput}
                onChange={e => setCustomIpInput(e.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span>اسم الدولة</span>
              <input
                type="text"
                placeholder="المملكة العربية السعودية"
                value={customCountryInput}
                onChange={e => setCustomCountryInput(e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>المدينة</span>
              <input
                type="text"
                placeholder="الرياض"
                value={customCityInput}
                onChange={e => setCustomCityInput(e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>مزود خدمة الإنترنت (ISP)</span>
              <input
                type="text"
                placeholder="Saudi Telecom Dedicated"
                value={customIspInput}
                onChange={e => setCustomIspInput(e.target.value)}
              />
            </label>
          </div>

          <div className="custom-ip-actions">
            <button type="submit" className="primary-ip-btn">
              <Check size={16} />
              <span>تطبيق وتفعيل الـ IP المخصص</span>
            </button>
            {config.isCustomActive && (
              <button
                type="button"
                className="outline-ip-btn danger"
                onClick={() => saveConfig({ ...config, isCustomActive: false })}
              >
                <X size={16} />
                <span>إلغاء التخصيص والعودة للكتالوج</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* HTTP Header Injection Settings */}
      <div className="ip-section-card">
        <div
          className="ip-card-header toggleable"
          onClick={() => setShowAdvancedHeaders(!showAdvancedHeaders)}
        >
          <div className="header-icon-box">
            <Layers size={20} />
          </div>
          <div className="header-flex-text">
            <div>
              <h3>ترويسات الحقن الأمني لبروتوكول HTTP (Header Spoofing)</h3>
              <p>تحديد الترويسات التي يتم إرسالها إلى البوابات لمحاكاة عناوين الشبكة الأصلية والبروكسي.</p>
            </div>
            <button type="button" className="icon-collapse-btn">
              {showAdvancedHeaders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {showAdvancedHeaders && (
          <div className="advanced-headers-content">
            <div className="headers-grid">
              {[
                {
                  key: 'xForwardedFor',
                  header: 'X-Forwarded-For',
                  desc: 'المعيار العالمي لتمرير الـ IP للعميل عبر خوادم البروكسي وبوابات التوجيه.',
                  val: `${activeIp}, 10.0.0.1`
                },
                {
                  key: 'cfConnectingIp',
                  header: 'CF-Connecting-IP',
                  desc: 'ترويسة جدار حماية Cloudflare المستخدمة للتحقق من موقع العميل المباشر.',
                  val: activeIp
                },
                {
                  key: 'xRealIp',
                  header: 'X-Real-IP',
                  desc: 'ترويسة خوادم Nginx / HAProxy الأصلية لنقل IP العميل الحقيقي بدون تعديل.',
                  val: activeIp
                },
                {
                  key: 'trueClientIp',
                  header: 'True-Client-IP',
                  desc: 'ترويسة شبكات Akamai CDN لتجاوز طبقات البروكسي الداخلية.',
                  val: activeIp
                },
                {
                  key: 'clientGeoCountry',
                  header: 'X-Client-Geo-Country',
                  desc: 'رمز الدولة الجغرافي بصيغة ISO-3166-1 alpha-2 لتسهيل مطابقة السياسات.',
                  val: currentCountry.code.slice(0, 2)
                }
              ].map(item => (
                <div key={item.key} className="header-config-row">
                  <label className="header-checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.injectHeaders[item.key as keyof typeof config.injectHeaders]}
                      onChange={e => {
                        const updated = {
                          ...config,
                          injectHeaders: {
                            ...config.injectHeaders,
                            [item.key]: e.target.checked
                          }
                        };
                        saveConfig(updated);
                      }}
                    />
                    <div className="header-text">
                      <strong>{item.header}</strong>
                      <small>{item.desc}</small>
                    </div>
                  </label>
                  <code className="header-preview" dir="ltr">{item.val}</code>
                </div>
              ))}
            </div>

            <div className="extra-toggles-row">
              <label className="toggle-chip">
                <input
                  type="checkbox"
                  checked={config.simulateLatency}
                  onChange={e => saveConfig({ ...config, simulateLatency: e.target.checked })}
                />
                <span>محاكاة زمن تأخير الشبكة الجغرافي (Network Latency Simulator: {currentCountry.avgLatency})</span>
              </label>

              <label className="toggle-chip">
                <input
                  type="checkbox"
                  checked={config.simulateVpnDetection}
                  onChange={e => saveConfig({ ...config, simulateVpnDetection: e.target.checked })}
                />
                <span>محاكاة بصمة خادم VPN / Datacenter لاختبار أنظمة الحظر المتقدمة</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Gateway Geo-Compatibility Matrix */}
      <div className="ip-section-card">
        <div className="ip-card-header">
          <div className="header-icon-box">
            <Shield size={20} />
          </div>
          <div>
            <h3>مصفوفة توافق البوابات مع الدولة الحالية ({activeCountryName})</h3>
            <p>تحليل فوري لمدى قبول ورفض كل بوابة لعمليات الدفع المنطلقة من هذا الموقع الجغرافي.</p>
          </div>
        </div>

        <div className="compatibility-table-wrapper">
          <table className="geo-matrix-table">
            <thead>
              <tr>
                <th>بوابة الدفع</th>
                <th>حالة التوافقية الجغرافية</th>
                <th>العملات المتوافقة</th>
                <th>ملاحظات قواعد الأمان والقبول</th>
                <th>إجراء تجربة</th>
              </tr>
            </thead>
            <tbody>
              {geoRules.map(rule => (
                <tr key={rule.gatewayId}>
                  <td>
                    <strong>{rule.gatewayName}</strong>
                  </td>
                  <td>
                    {rule.supportLevel === 'native' && (
                      <span className="compat-pill native">
                        <CheckCircle2 size={13} /> متوافقة بالكامل (Native)
                      </span>
                    )}
                    {rule.supportLevel === 'supported' && (
                      <span className="compat-pill supported">
                        <Check size={13} /> مدعومة مع فحص 3DS
                      </span>
                    )}
                    {rule.supportLevel === 'restricted' && (
                      <span className="compat-pill restricted">
                        <AlertTriangle size={13} /> مقيدة بشروط إضافية
                      </span>
                    )}
                    {rule.supportLevel === 'blocked' && (
                      <span className="compat-pill blocked">
                        <X size={13} /> محظورة جغرافياً (Geo-Blocked)
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="currency-tags">
                      {rule.supportedCurrencies.map(curr => (
                        <span key={curr} className="curr-tag">{curr}</span>
                      ))}
                    </div>
                  </td>
                  <td className="notes-cell">
                    <span>{rule.notes}</span>
                  </td>
                  <td>
                    <button
                      className="test-probe-row-btn"
                      disabled={isProbing || !config.enabled}
                      onClick={() => handleRunGeoProbe(rule.gatewayId)}
                    >
                      <Play size={13} />
                      <span>فحص</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Probe Result Modal / Display */}
      {probeResult && (
        <div className="probe-result-card" role="region" aria-label="نتيجة الفحص الجغرافي">
          <div className="probe-result-header">
            <div className="probe-title-group">
              <Sparkles size={20} className="accent-sparkle" />
              <div>
                <h4>تقرير فحص المحاكاة الجغرافية لبوابة {probeResult.gateway}</h4>
                <small>تم التنفيذ في: {probeResult.timestamp} · درجة تقديرية محسوبة محليًا (محاكاة): {probeResult.score}%</small>
              </div>
            </div>
            <button className="close-probe-btn" onClick={() => setProbeResult(null)}>
              <X size={18} />
            </button>
          </div>

          <div className={`probe-status-summary status-${probeResult.status}`}>
            <div className="summary-icon">
              {probeResult.status === 'passed' && <CheckCircle2 size={24} />}
              {probeResult.status === 'warning' && <AlertTriangle size={24} />}
              {probeResult.status === 'rejected' && <X size={24} />}
            </div>
            <div>
              <strong>{probeResult.decision}</strong>
              <p>الـ IP المنتحل: {probeResult.sentIp} ({probeResult.resolvedCountry} - {probeResult.resolvedCity}) عبر {probeResult.isp}</p>
            </div>
          </div>

          <div className="probe-details-grid">
            <div className="probe-reasons-box">
              <strong>تحليل نظام الأمان ومكافحة الاحتيال:</strong>
              <ul>
                {probeResult.reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="probe-headers-box">
              <strong>الترويسات المحقونة المرسلة في الطلب (Injected Headers):</strong>
              <div className="headers-code-block" dir="ltr">
                {Object.entries(probeResult.headers).map(([k, v]) => (
                  <div key={k}>
                    <span className="hdr-key">{k}:</span> <span className="hdr-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Reset & Helper Bar */}
      <div className="ip-footer-bar">
        <div className="footer-notice">
          <Lock size={16} />
          <span>
            هذه الإعدادات محصورة بحساب مسؤول المنصة (Admin)، وتنعكس تلقائياً على واجهة اختبار اللودر (Loader Suite)
            وكافة روابط وعمليات الدفع الاختبارية المنشأة في بيئة المحاكاة.
          </span>
        </div>
        <button
          type="button"
          className="reset-defaults-btn"
          onClick={handleResetDefaults}
        >
          <RefreshCw size={15} />
          <span>استعادة الإعدادات الافتراضية</span>
        </button>
      </div>
    </div>
  );
}
