import { useState, useMemo } from 'react';
import {
  Globe, Shield, CreditCard, CheckCircle2, XCircle, AlertTriangle,
  Search, ExternalLink, Sparkles, SlidersHorizontal, Check,
  Zap, ArrowRight, Building, Award, RefreshCw, HelpCircle
} from 'lucide-react';
import {
  GATEWAY_COUNTRY_MATRICES,
  KNOWN_BINS,
  lookupBin,
  type GatewayCountryMatrix,
  type BinInfo
} from './gatewayCountriesData';
import './GatewayCountryMatrixManager.css';

interface GatewayCountryMatrixManagerProps {
  onSelectGatewayForTest?: (gatewayId: string) => void;
}

export default function GatewayCountryMatrixManager({
  onSelectGatewayForTest
}: GatewayCountryMatrixManagerProps) {
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('paytabs');
  const [activeTab, setActiveTab] = useState<'supported' | 'unsupported' | 'schemes' | 'bin_checker'>('supported');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<'all' | 'gcc' | 'arab' | 'international'>('all');

  // BIN Checker state
  const [binInput, setBinInput] = useState('');
  const [analyzedBin, setAnalyzedBin] = useState<BinInfo | null>(() => lookupBin('588846'));

  const activeGateway = useMemo(() => {
    return GATEWAY_COUNTRY_MATRICES.find(g => g.gatewayId === selectedGatewayId) || GATEWAY_COUNTRY_MATRICES[0];
  }, [selectedGatewayId]);

  const filteredSupportedCountries = useMemo(() => {
    return activeGateway.supportedCountries.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.currencies.some(curr => curr.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (selectedRegionFilter === 'all') return true;
      if (selectedRegionFilter === 'gcc') return ['SA', 'AE', 'KW', 'BH', 'OM', 'QA'].includes(c.code);
      if (selectedRegionFilter === 'arab') return ['EG', 'JO', 'SA', 'AE', 'KW', 'BH', 'OM', 'QA'].includes(c.code);
      if (selectedRegionFilter === 'international') return ['US', 'GB', 'CN', 'EU'].includes(c.code);
      return true;
    });
  }, [activeGateway, searchQuery, selectedRegionFilter]);

  const handleRunBinLookup = (code: string) => {
    setBinInput(code);
    const result = lookupBin(code);
    setAnalyzedBin(result);
  };

  return (
    <div className="gateway-country-matrix-manager">
      {/* Hero Header */}
      <div className="matrix-hero">
        <div className="matrix-hero-content">
          <div className="matrix-badge">
            <Globe size={16} />
            <span>فاحص توافقية البوابات مع الدول والبطاقات (Global Country & Card Matrix)</span>
          </div>
          <h2>فاحص الدول والبطاقات المدعومة لكل بوابة دفع</h2>
          <p>
            أداة مرجعية حية تُبيّن لك بدقة: ما هي الدول وشبكات البطاقات (مدى، KNET، بنفت، ميزة، فيزا، ماستركارد)
            المدعومة لكل بوابة، الدول غير المدعومة، مع فاحص BIN ذكي لمعرفة توافقية أي بطاقة بنكية قبل المعالجة.
          </p>
        </div>

        <div className="matrix-hero-stats">
          <div className="hero-stat-card">
            <span className="stat-label">البوابات المفحوصة</span>
            <span className="stat-num">{GATEWAY_COUNTRY_MATRICES.length}</span>
            <span className="stat-sub">مرخصة ومعتمدة</span>
          </div>
          <div className="hero-stat-card">
            <span className="stat-label">الشبكات المحلية</span>
            <span className="stat-num">8+</span>
            <span className="stat-sub">مدى، كي نت، بنفت، ميزة</span>
          </div>
          <div className="hero-stat-card">
            <span className="stat-label">فحص BIN فوري</span>
            <span className="stat-num">100%</span>
            <span className="stat-sub">كشف الدولة والبنك</span>
          </div>
        </div>
      </div>

      {/* Gateway Selector Row */}
      <div className="gateway-selector-bar">
        <span className="selector-title">
          <Building size={18} />
          <span>اختر بوابة الدفع للفحص:</span>
        </span>
        <div className="gateway-pills-container">
          {GATEWAY_COUNTRY_MATRICES.map(gw => (
            <button
              key={gw.gatewayId}
              type="button"
              className={`gateway-pill ${selectedGatewayId === gw.gatewayId ? 'active' : ''}`}
              onClick={() => setSelectedGatewayId(gw.gatewayId)}
            >
              <strong>{gw.gatewayName}</strong>
              <small>{gw.headquarters}</small>
            </button>
          ))}
        </div>
      </div>

      {/* Active Gateway Overview Card */}
      <div className="active-gw-overview-card">
        <div className="gw-overview-header">
          <div>
            <div className="gw-tags-row">
              <span className="badge-tag">{activeGateway.badge}</span>
              <span className="badge-pci"><Award size={14} /> {activeGateway.pciCompliance}</span>
            </div>
            <h3>{activeGateway.gatewayName} <small>({activeGateway.englishName})</small></h3>
            <p className="gw-overview-desc">{activeGateway.description}</p>
          </div>

          <div className="gw-region-box">
            <span className="region-title">نطاق التغطية الجغرافية:</span>
            <strong>{activeGateway.coverageRegion}</strong>
          </div>
        </div>

        {/* Navigation Tabs inside Gateway View */}
        <div className="matrix-tabs-row">
          <button
            type="button"
            className={`matrix-tab-btn ${activeTab === 'supported' ? 'active' : ''}`}
            onClick={() => setActiveTab('supported')}
          >
            <CheckCircle2 size={16} />
            <span>الدول والعملات المدعومة ({activeGateway.supportedCountries.length})</span>
          </button>

          <button
            type="button"
            className={`matrix-tab-btn ${activeTab === 'unsupported' ? 'active' : ''}`}
            onClick={() => setActiveTab('unsupported')}
          >
            <XCircle size={16} />
            <span>الدول غير المدعومة / المحظورة ({activeGateway.unsupportedCountries.length})</span>
          </button>

          <button
            type="button"
            className={`matrix-tab-btn ${activeTab === 'schemes' ? 'active' : ''}`}
            onClick={() => setActiveTab('schemes')}
          >
            <CreditCard size={16} />
            <span>شبكات البطاقات وطرق الدفع ({activeGateway.supportedSchemes.length})</span>
          </button>

          <button
            type="button"
            className={`matrix-tab-btn ${activeTab === 'bin_checker' ? 'active highlight' : 'highlight'}`}
            onClick={() => setActiveTab('bin_checker')}
          >
            <Sparkles size={16} />
            <span>فاحص BIN والبطاقات التفاعلي (Live Card Checker)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Supported Countries */}
      {activeTab === 'supported' && (
        <div className="matrix-tab-content">
          <div className="filter-and-search-toolbar">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="ابحث بالدولة أو العملة أو كود الدولة (مثال: SA, SAR, مصر)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="region-filters">
              <button
                type="button"
                className={`filter-btn ${selectedRegionFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedRegionFilter('all')}
              >
                الكل
              </button>
              <button
                type="button"
                className={`filter-btn ${selectedRegionFilter === 'gcc' ? 'active' : ''}`}
                onClick={() => setSelectedRegionFilter('gcc')}
              >
                دول الخليج العربي
              </button>
              <button
                type="button"
                className={`filter-btn ${selectedRegionFilter === 'arab' ? 'active' : ''}`}
                onClick={() => setSelectedRegionFilter('arab')}
              >
                العالم العربي ومصر
              </button>
              <button
                type="button"
                className={`filter-btn ${selectedRegionFilter === 'international' ? 'active' : ''}`}
                onClick={() => setSelectedRegionFilter('international')}
              >
                دولياً وأمريكا
              </button>
            </div>
          </div>

          <div className="countries-grid">
            {filteredSupportedCountries.map(country => (
              <div key={country.code} className="country-card">
                <div className="country-card-header">
                  <div className="flag-and-name">
                    <span className="country-flag">{country.flag}</span>
                    <div>
                      <h4>{country.name}</h4>
                      <small>{country.english} ({country.code})</small>
                    </div>
                  </div>

                  <span className={`support-level-tag ${country.supportLevel}`}>
                    {country.supportLevel === 'full' ? 'دعم كامل 100%' : 'دعم جزئي (دولي)'}
                  </span>
                </div>

                <div className="country-stats-row">
                  <div className="c-stat">
                    <small>نسبة قبول الدفع</small>
                    <strong className="high-rate">{country.avgApprovalRate}%</strong>
                  </div>
                  <div className="c-stat">
                    <small>العملات المدعومة</small>
                    <div className="currency-pills">
                      {country.currencies.map(c => <span key={c} className="curr-pill">{c}</span>)}
                    </div>
                  </div>
                </div>

                {country.localCards.length > 0 && (
                  <div className="local-cards-box">
                    <span className="box-title">البطاقات والمحافظ المحلية:</span>
                    <div className="card-names-row">
                      {country.localCards.map(lc => (
                        <span key={lc} className="local-card-pill">
                          <Check size={12} /> {lc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="intl-cards-box">
                  <span className="box-title">البطاقات الدولية:</span>
                  <span className="intl-cards-text">{country.internationalCards.join(' · ') || 'عبر الشبكات الدولية'}</span>
                </div>

                <p className="country-notes-text">
                  <strong>ملاحظات البوابة:</strong> {country.notes}
                </p>

                <div className="country-card-footer">
                  <span className="security-tag">
                    {country.requires3DS ? '🔒 إلزامي التحقق الثنائي 3DS' : '⚡ 3DS اختياري / ديناميكي'}
                  </span>
                  {onSelectGatewayForTest && (
                    <button
                      type="button"
                      className="test-gw-btn"
                      onClick={() => onSelectGatewayForTest(activeGateway.gatewayId)}
                    >
                      <span>اختبار في اللودر</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Unsupported Countries */}
      {activeTab === 'unsupported' && (
        <div className="matrix-tab-content">
          <div className="unsupported-banner">
            <AlertTriangle size={24} />
            <div>
              <strong>الدول المقيدة أو غير المدعومة في {activeGateway.gatewayName}</strong>
              <p>
                الطلبات الواردة من هذه الدول أو البطاقات الصادرة منها ستواجه رفضاً فورياً برمز خطأ <code>BLOCKED_GEO_RESTRICTION</code> أو <code>SANCTIONED_COUNTRY</code>.
              </p>
            </div>
          </div>

          <div className="unsupported-table-wrapper">
            <table className="unsupported-table">
              <thead>
                <tr>
                  <th>الدولة</th>
                  <th>رمز الدولة</th>
                  <th>سبب عدم الدعم أو الحظر</th>
                  <th>الإجراء الوقائي المطلوب من التاجر</th>
                </tr>
              </thead>
              <tbody>
                {activeGateway.unsupportedCountries.map(u => (
                  <tr key={u.code}>
                    <td>
                      <span className="unsupported-country-cell">
                        <span className="un-flag">{u.flag}</span>
                        <strong>{u.name}</strong>
                      </span>
                    </td>
                    <td><code>{u.code}</code></td>
                    <td className="reason-cell">{u.reason}</td>
                    <td>
                      <span className="prevention-badge">
                        فلترة الـ IP وحظر الطلب قبل الإرسال للبوابة لتفادي رسوم الرفض
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Schemes */}
      {activeTab === 'schemes' && (
        <div className="matrix-tab-content">
          <div className="schemes-grid">
            {activeGateway.supportedSchemes.map(scheme => (
              <div key={scheme.name} className="scheme-card">
                <div className="scheme-header">
                  <span className="scheme-icon">{scheme.icon}</span>
                  <div>
                    <h4>{scheme.name}</h4>
                    <span className={scheme.localNetwork ? 'local-network-tag' : 'intl-network-tag'}>
                      {scheme.localNetwork ? 'شبكة دفع وطنية ومحلية' : 'شبكة عالمية'}
                    </span>
                  </div>
                </div>
                <div className="scheme-body">
                  <span className="scheme-coverage-label">نطاق التغطية:</span>
                  <p>{scheme.coverage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Interactive BIN & Card Checker */}
      {activeTab === 'bin_checker' && (
        <div className="matrix-tab-content bin-checker-section">
          <div className="bin-checker-hero">
            <div>
              <h3>فاحص BIN وتحليل توافقية البطاقة على جميع البوابات</h3>
              <p>
                أدخل أول 6 أرقام من أي بطاقة لمعرفة البنك المصدر، الدولة، نوع البطاقة، وفحص هل هذه البطاقة مقبولة
                على كل بوابة من بواباتك المسجلة، وما هي نسبة القبول المتوقعة.
              </p>
            </div>
          </div>

          {/* Preset Buttons for Quick Testing */}
          <div className="quick-bins-bar">
            <span className="quick-bins-title">نماذج سريعة للتجربة:</span>
            <div className="quick-bins-pills">
              {KNOWN_BINS.map(b => (
                <button
                  key={b.bin}
                  type="button"
                  className={`quick-bin-btn ${binInput.startsWith(b.bin) ? 'active' : ''}`}
                  onClick={() => handleRunBinLookup(b.bin)}
                >
                  <span>{b.bankName.split(' ')[0]} {b.scheme}</span>
                  <code>{b.bin}</code>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Input */}
          <div className="bin-input-row">
            <div className="bin-field-box">
              <label>أدخل أول 6 أرقام (BIN) للبطاقة:</label>
              <div className="bin-input-wrap">
                <CreditCard size={18} />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="مثال: 588846 أو 411111"
                  value={binInput}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setBinInput(val);
                    if (val.length >= 6) {
                      setAnalyzedBin(lookupBin(val));
                    }
                  }}
                />
                <button
                  type="button"
                  className="bin-lookup-action"
                  onClick={() => handleRunBinLookup(binInput)}
                >
                  <Search size={16} />
                  <span>فحص وتحليل</span>
                </button>
              </div>
            </div>

            {analyzedBin && (
              <div className="bin-result-summary-card">
                <div className="bin-summary-head">
                  <span className="summary-title">نتيجة فحص الـ BIN ({analyzedBin.bin}):</span>
                  <span className="scheme-tag">{analyzedBin.scheme}</span>
                </div>
                <div className="summary-grid">
                  <div>
                    <small>البنك المصدر:</small>
                    <strong>{analyzedBin.bankName}</strong>
                  </div>
                  <div>
                    <small>دولة الإصدار:</small>
                    <strong>{analyzedBin.countryName} ({analyzedBin.countryCode})</strong>
                  </div>
                  <div>
                    <small>نوع البطاقة:</small>
                    <strong>{analyzedBin.cardType} ({analyzedBin.tier})</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cross-Gateway Compatibility Matrix Table */}
          {analyzedBin && (
            <div className="cross-gateway-results">
              <h4>مصفوفة التوافقية لهذه البطاقة عبر جميع بوابات الدفع:</h4>
              <div className="results-table-wrap">
                <table className="cross-results-table">
                  <thead>
                    <tr>
                      <th>بوابة الدفع</th>
                      <th>حالة الدعم للبطاقة</th>
                      <th>نسبة القبول المتوقعة</th>
                      <th>متطلبات المعالجة والتحقق</th>
                      <th>القرار التقني الموصى به</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GATEWAY_COUNTRY_MATRICES.map(gw => {
                      // Check if gateway supports this country and scheme
                      const countryMatch = gw.supportedCountries.find(c =>
                        c.code === analyzedBin.countryCode || analyzedBin.countryCode === 'GLOBAL'
                      );
                      const isSchemeSupported = gw.supportedSchemes.some(s =>
                        s.name.toLowerCase().includes(analyzedBin.scheme.toLowerCase())
                      );
                      const isSupported = Boolean(countryMatch && isSchemeSupported);

                      let statusBadge = (
                        <span className="res-badge success">
                          <CheckCircle2 size={14} /> مقبولة ومدعومة بالكامل
                        </span>
                      );
                      let rate = countryMatch ? `${countryMatch.avgApprovalRate}%` : '85%';
                      let req = 'التحقق الثنائي 3DS2 وتطابق العملة';
                      let recommendation = 'توجيه المعاملة مباشرة للبوابة';

                      if (analyzedBin.scheme === 'Mada' && gw.gatewayId !== 'paytabs' && gw.gatewayId !== 'noon' && gw.gatewayId !== 'myfatoorah') {
                        statusBadge = (
                          <span className="res-badge warning">
                            <AlertTriangle size={14} /> قبول جزئي (عبر شبكة فيزا/ماستركارد)
                          </span>
                        );
                        rate = '78%';
                        req = 'توجيه البطاقة كـ Credit بدلاً من Debit محلي';
                        recommendation = 'يُفضل تحويلها إلى بيتابس أو نون للحصول على تسوية مدى المباشرة';
                      } else if (!countryMatch && analyzedBin.countryCode !== 'GLOBAL') {
                        statusBadge = (
                          <span className="res-badge danger">
                            <XCircle size={14} /> غير مدعومة (دولة خارج التغطية)
                          </span>
                        );
                        rate = '0%';
                        req = 'ستُرفض تلقائياً من البوابة';
                        recommendation = 'حظر المعاملة أو توجيهها لبوابة بديلة تدعم هذه الدولة';
                      }

                      return (
                        <tr key={gw.gatewayId}>
                          <td>
                            <strong>{gw.gatewayName}</strong>
                            <small>{gw.headquarters}</small>
                          </td>
                          <td>{statusBadge}</td>
                          <td>
                            <strong className="rate-value">{rate}</strong>
                          </td>
                          <td>{req}</td>
                          <td>
                            <span className="rec-text">{recommendation}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
