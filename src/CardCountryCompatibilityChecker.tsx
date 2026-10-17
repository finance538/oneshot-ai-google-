import { useState } from 'react';
import {
  CreditCard, Search, Globe, CheckCircle2, XCircle, AlertTriangle,
  Zap, Building, ShieldCheck, Sparkles, RefreshCw, ArrowRight, Info
} from 'lucide-react';
import {
  GATEWAY_COUNTRY_MATRICES,
  lookupBin,
  KNOWN_BINS,
  type BinInfo,
  type CountrySupportInfo
} from './gatewayCountriesData';
import './CardCountryCompatibilityChecker.css';

interface Props {
  onApplyCardToSimulator?: (cardDetails: {
    number: string;
    scheme: string;
    country: string;
    countryCode: string;
    gatewayId: string;
  }) => void;
}

export default function CardCountryCompatibilityChecker({ onApplyCardToSimulator }: Props) {
  const [cardNumber, setCardNumber] = useState('');
  const [selectedGatewayFilter, setSelectedGatewayFilter] = useState<string>('all');
  const [analyzedBin, setAnalyzedBin] = useState<BinInfo | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);

  // Quick Preset Cards
  const PRESET_TEST_CARDS = [
    { label: 'مدى - مصرف الراجحي', number: '5888 4600 0000 1234', bin: '588846', country: 'السعودية 🇸🇦' },
    { label: 'مدى - مصرف الإنماء', number: '5888 4500 0000 5678', bin: '588845', country: 'السعودية 🇸🇦' },
    { label: 'فيزا - بنك الرياض', number: '4111 1100 0000 9999', bin: '411111', country: 'السعودية 🇸🇦' },
    { label: 'ماستركارد - الإمارات دبي الوطني', number: '5424 0012 3456 7890', bin: '542400', country: 'الإمارات 🇦🇪' },
    { label: 'كي نت - الوطني الكويتي', number: '5196 3800 0000 4321', bin: '519638', country: 'الكويت 🇰🇼' },
    { label: 'بنفت - البحرين الوطني', number: '5078 0300 0000 8765', bin: '507803', country: 'البحرين 🇧🇭' },
    { label: 'ميزة - بنك مصر', number: '5078 0900 0000 2468', bin: '507809', country: 'مصر 🇪🇬' },
    { label: 'فيزا - تشيس بنك (أمريكا)', number: '4000 0012 3456 0002', bin: '400000', country: 'أمريكا 🇺🇸' },
    { label: 'ماستركارد - دويتشه بنك', number: '5105 1099 8877 6655', bin: '510510', country: 'ألمانيا 🇩🇪' },
  ];

  const handleCardInputChange = (raw: string) => {
    // Keep digits and format with spaces every 4 digits
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 19);
    const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);

    if (digitsOnly.length >= 6) {
      const bin6 = digitsOnly.slice(0, 6);
      const res = lookupBin(bin6);
      setAnalyzedBin(res);
      setHasEvaluated(true);
    } else {
      setAnalyzedBin(null);
      setHasEvaluated(false);
    }
  };

  const handleSelectPreset = (card: typeof PRESET_TEST_CARDS[0]) => {
    setCardNumber(card.number);
    const res = lookupBin(card.bin);
    setAnalyzedBin(res);
    setHasEvaluated(true);
  };

  const handleEvaluateClick = () => {
    const digitsOnly = cardNumber.replace(/\D/g, '');
    if (digitsOnly.length < 6) {
      alert('يرجى إدخال 6 أرقام على الأقل للبطاقة للتمكن من فحص الـ BIN والتوافقية.');
      return;
    }
    const res = lookupBin(digitsOnly.slice(0, 6));
    setAnalyzedBin(res);
    setHasEvaluated(true);
  };

  // Evaluate compatibility per gateway
  const compatibilityResults = GATEWAY_COUNTRY_MATRICES.filter(gw => {
    if (selectedGatewayFilter === 'all') return true;
    return gw.gatewayId === selectedGatewayFilter;
  }).map(gw => {
    if (!analyzedBin) {
      return {
        gateway: gw,
        supported: false,
        level: 'unsupported' as const,
        reason: 'لم يتم إدخال بطاقة بعد',
        approvalRate: '0%',
        recommendation: 'أدخل رقم البطاقة للتحليل'
      };
    }

    const isGlobalScheme = ['Visa', 'Mastercard', 'AMEX'].includes(analyzedBin.scheme);
    const countryMatch = gw.supportedCountries.find(c => 
      c.code === analyzedBin.countryCode || (analyzedBin.countryCode === 'GLOBAL')
    );

    const schemeSupport = gw.supportedSchemes.some(s => 
      s.name.toLowerCase().includes(analyzedBin.scheme.toLowerCase()) ||
      (analyzedBin.scheme === 'Mada' && s.name.includes('مدى')) ||
      (analyzedBin.scheme === 'KNET' && s.name.includes('KNET')) ||
      (analyzedBin.scheme === 'Benefit' && s.name.includes('Benefit'))
    );

    // Specific logic
    let supported = false;
    let level: 'full' | 'partial' | 'unsupported' = 'unsupported';
    let statusText = '';
    let approvalRate = '0%';
    let technicalNotes = '';
    let recommendation = '';

    if (analyzedBin.scheme === 'Mada') {
      if (['paytabs', 'noon', 'myfatoorah'].includes(gw.gatewayId)) {
        supported = true;
        level = 'full';
        statusText = 'مدعومة بالكامل 100% (تسوية مدى محلية مباشرة)';
        approvalRate = '97%';
        technicalNotes = 'توجيه مباشر عبر الشبكة الوطنية السعودية مع 3DS2 محلي';
        recommendation = 'البوابة المثالية والأعلى قبولاً لهذه البطاقة';
      } else if (gw.gatewayId === 'telr') {
        supported = true;
        level = 'partial';
        statusText = 'قبول جزئي (معالجة كبطاقة فيزا/ماستركارد دولية)';
        approvalRate = '78%';
        technicalNotes = 'لا تدعم مسار مدى المحلي، قد تخضع لرسوم تحويل عملة أو رفض من بعض البنوك السعودية';
        recommendation = 'توجيه المعاملة إلى PayTabs أو نون لتحقيق أعلى نسبة قبول';
      } else if (gw.gatewayId === 'tabby') {
        supported = true;
        level = 'full';
        statusText = 'مدعومة عبر أقساط تابي بالعملة السعودية';
        approvalRate = '94%';
        technicalNotes = 'يتم تقسيم الدفعة على 4 دفعات بدون فوائد';
        recommendation = 'صالحة لدفعات الشراء بالأقساط';
      }
    } else if (analyzedBin.scheme === 'KNET') {
      if (gw.gatewayId === 'myfatoorah') {
        supported = true;
        level = 'full';
        statusText = 'مدعومة أصلياً (الربط المباشر لشبكة KNET الكويتية)';
        approvalRate = '98%';
        technicalNotes = 'معالجة عبر صفحة التحقق الخاصة بـ KNET';
        recommendation = 'البوابة الموصى بها لبطاقات KNET في الكويت';
      } else if (['paytabs', 'telr'].includes(gw.gatewayId)) {
        supported = false;
        level = 'unsupported';
        statusText = 'غير مدعومة (شبكة KNET المحلية غير مدمجة)';
        approvalRate = '0%';
        technicalNotes = 'البطاقة لا تحتوي على شعار فيزا أو ماستركارد خارجي';
        recommendation = 'يجب توجيه العميل لبوابة ماي فاتورة لمعالجة KNET';
      }
    } else if (analyzedBin.scheme === 'Benefit') {
      if (gw.gatewayId === 'paytabs' || gw.gatewayId === 'myfatoorah') {
        supported = true;
        level = 'full';
        statusText = 'مدعومة بالكامل (مسار بنفت البحريني المباشر)';
        approvalRate = '96%';
        technicalNotes = 'تسوية بالدينار البحريني BHD';
        recommendation = 'توجيه المعاملة مباشرة';
      } else {
        supported = false;
        level = 'unsupported';
        statusText = 'غير مدعومة (تقتصر على بوابات الربط البحريني)';
        approvalRate = '0%';
        technicalNotes = 'تتطلب الربط مع شبكة Benefit';
        recommendation = 'استخدم PayTabs أو ماي فاتورة';
      }
    } else if (analyzedBin.scheme === 'Meeza') {
      if (gw.gatewayId === 'paytabs' || gw.gatewayId === 'myfatoorah') {
        supported = true;
        level = 'full';
        statusText = 'مدعومة بالكامل في مصر (شبكة ميزة القومية)';
        approvalRate = '95%';
        technicalNotes = 'تسوية مباشرة بالجنيه المصري EGP مع البنك المركزي المصري';
        recommendation = 'الخيار الأنسب للمعاملات المصرية';
      } else {
        supported = false;
        level = 'unsupported';
        statusText = 'غير مدعومة';
        approvalRate = '0%';
        technicalNotes = 'شبكة محلية مصرية غير مفعلة في هذه البوابة';
        recommendation = 'توجيه للبوابة المصرية';
      }
    } else {
      // International Cards (Visa / Mastercard / AMEX)
      if (countryMatch || isGlobalScheme) {
        supported = true;
        level = 'full';
        statusText = `مدعومة بالكامل (${analyzedBin.scheme} دولية)`;
        approvalRate = countryMatch ? `${countryMatch.avgApprovalRate}%` : '89%';
        technicalNotes = 'معالجة دولية متعددة العملات مع فحص 3D Secure 2';
        recommendation = 'معاملة قياسية مقبولة على الفور';
      } else {
        supported = false;
        level = 'unsupported';
        statusText = 'دولة البطاقة خارج النطاق الجغرافي للبوابة';
        approvalRate = '0%';
        technicalNotes = 'تم تقييد الدولة بسبب ضوابط مكافحة الاحتيال وقوانين الترخيص';
        recommendation = 'يجب تفعيل قبول العمليات الدولية لهذه البوابة';
      }
    }

    return {
      gateway: gw,
      supported,
      level,
      statusText,
      approvalRate,
      technicalNotes,
      recommendation
    };
  });

  return (
    <div className="card-country-checker-container">
      {/* Top Banner */}
      <div className="checker-header-banner">
        <div className="checker-header-text">
          <div className="checker-badge">
            <Sparkles size={16} />
            <span>أداة اللودر الذكية · فاحص التوافقية الفوري</span>
          </div>
          <h3>فاحص توافقية أرقام البطاقات مع الدول والبوابات المدعومة</h3>
          <p>
            أدخل أي رقم بطاقة بنكية (تجريبي أو حقيقي) للحصول فوراً على كشف الـ BIN، دولة الإصدار، البنك المصدر،
            وفحص توافقية البطاقة مع جميع بوابات الدفع (PayTabs، تيلر، ماي فاتورة، نون، تابي، بي زاتي) مع نسبة القبول المتوقعة.
          </p>
        </div>
      </div>

      {/* Input & Quick Presets Section */}
      <div className="checker-interactive-box">
        <div className="checker-input-section">
          <label className="input-label-main">
            <CreditCard size={18} />
            <span>رقم البطاقة المراد اختباره (Card Number):</span>
          </label>
          <div className="card-input-wrapper">
            <input
              type="text"
              dir="ltr"
              className="card-large-input"
              placeholder="xxxx xxxx xxxx xxxx (مثال: 5888 4600 0000 1234)"
              value={cardNumber}
              onChange={(e) => handleCardInputChange(e.target.value)}
              maxLength={23}
            />
            <button
              type="button"
              className="check-now-btn"
              onClick={handleEvaluateClick}
            >
              <Zap size={16} />
              <span>فحص التوافقية الفوري</span>
            </button>
          </div>
          <span className="input-hint">
            * يتم فحص الـ BIN (أول 6-8 أرقام) فورياً لتحديد البنك والدولة والشبكة بدقة متناهية.
          </span>
        </div>

        {/* Quick Test Cards Presets */}
        <div className="preset-cards-group">
          <div className="preset-label-row">
            <span>بطاقات اختبار سريعة شائعة:</span>
            <small>انقر لتجربة الفحص الفوري</small>
          </div>
          <div className="preset-buttons-wrap">
            {PRESET_TEST_CARDS.map((card, idx) => (
              <button
                key={idx}
                type="button"
                className={`preset-btn ${cardNumber.replace(/\s/g, '').startsWith(card.bin) ? 'selected' : ''}`}
                onClick={() => handleSelectPreset(card)}
              >
                <span className="p-title">{card.label}</span>
                <span className="p-sub">{card.country}</span>
                <code className="p-bin">{card.bin}</code>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live BIN Analysis Card */}
      {analyzedBin && (
        <div className="analyzed-bin-card">
          <div className="bin-card-header">
            <div className="bin-title-group">
              <ShieldCheck size={20} className="icon-success" />
              <div>
                <h4>نتيجة تحليل الـ BIN للبطاقة: <code dir="ltr">{analyzedBin.bin}</code></h4>
                <span className="bin-sub">تم التعرف على مواصفات البطاقة والبنك المصدر بنجاح</span>
              </div>
            </div>
            <span className={`scheme-pill scheme-${analyzedBin.scheme.toLowerCase()}`}>
              {analyzedBin.scheme}
            </span>
          </div>

          <div className="bin-specs-grid">
            <div className="spec-item">
              <span className="spec-label">البنك المصدر (Issuer Bank):</span>
              <strong className="spec-val">{analyzedBin.bankName}</strong>
            </div>
            <div className="spec-item">
              <span className="spec-label">دولة الإصدار (Issuing Country):</span>
              <strong className="spec-val">{analyzedBin.countryName} ({analyzedBin.countryCode})</strong>
            </div>
            <div className="spec-item">
              <span className="spec-label">نوع البطاقة وفئتها (Type & Tier):</span>
              <strong className="spec-val">{analyzedBin.cardType} · {analyzedBin.tier}</strong>
            </div>
            <div className="spec-item">
              <span className="spec-label">نطاق الشبكة (Network Scope):</span>
              <strong className="spec-val">
                {analyzedBin.isLocalOnly ? 'شبكة محلية خاصة بالدولة' : 'شبكة تقبل المعالجة الدولية والمحلية'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Gateway Results Filter */}
      {hasEvaluated && analyzedBin && (
        <div className="results-container">
          <div className="results-header-bar">
            <div className="res-title-text">
              <h4>مصفوفة التوافقية الفورية عبر بوابات الدفع</h4>
              <span>نتائج مباشرة توضح مدى قبول البطاقة <strong dir="ltr">{cardNumber.slice(0, 7)}...</strong> في كل بوابة</span>
            </div>

            <div className="filter-pills-bar">
              <button
                type="button"
                className={`filter-btn ${selectedGatewayFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedGatewayFilter('all')}
              >
                جميع البوابات ({GATEWAY_COUNTRY_MATRICES.length})
              </button>
              {GATEWAY_COUNTRY_MATRICES.map(gw => (
                <button
                  key={gw.gatewayId}
                  type="button"
                  className={`filter-btn ${selectedGatewayFilter === gw.gatewayId ? 'active' : ''}`}
                  onClick={() => setSelectedGatewayFilter(gw.gatewayId)}
                >
                  {gw.gatewayName.split('(')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Table of Gateway Results */}
          <div className="table-responsive-wrapper">
            <table className="compatibility-table">
              <thead>
                <tr>
                  <th>بوابة الدفع</th>
                  <th>حالة التوافقية</th>
                  <th>نسبة القبول المتوقعة</th>
                  <th>المتطلبات التقنية والتحقق</th>
                  <th>التوصية وخطة التوجيه</th>
                  <th>إجراء تجريبي</th>
                </tr>
              </thead>
              <tbody>
                {compatibilityResults.map((item) => {
                  const isAccepted = item.level === 'full';
                  const isPartial = item.level === 'partial';

                  return (
                    <tr key={item.gateway.gatewayId} className={`row-status-${item.level}`}>
                      <td className="col-gw">
                        <div className="gw-info-cell">
                          <strong>{item.gateway.gatewayName}</strong>
                          <span className="gw-hq">{item.gateway.headquarters}</span>
                          <span className="gw-pci">{item.gateway.pciCompliance}</span>
                        </div>
                      </td>
                      <td className="col-status">
                        <div className={`status-badge-pill ${item.level}`}>
                          {isAccepted && <CheckCircle2 size={16} />}
                          {isPartial && <AlertTriangle size={16} />}
                          {!isAccepted && !isPartial && <XCircle size={16} />}
                          <span>{item.statusText}</span>
                        </div>
                      </td>
                      <td className="col-rate">
                        <span className={`rate-pill rate-${item.level}`}>
                          {item.approvalRate}
                        </span>
                      </td>
                      <td className="col-notes">
                        <div className="notes-cell">
                          <span>{item.technicalNotes}</span>
                        </div>
                      </td>
                      <td className="col-rec">
                        <div className="rec-cell">
                          <span>{item.recommendation}</span>
                        </div>
                      </td>
                      <td className="col-action">
                        {onApplyCardToSimulator && (
                          <button
                            type="button"
                            className="apply-sim-btn"
                            onClick={() => onApplyCardToSimulator({
                              number: cardNumber || '5888 4600 0000 1234',
                              scheme: analyzedBin.scheme,
                              country: analyzedBin.countryName,
                              countryCode: analyzedBin.countryCode,
                              gatewayId: item.gateway.gatewayId
                            })}
                            title="نقل هذه البطاقة للبوابة في معالج الدفع الافتراضي"
                          >
                            <span>تجربة بالمحاكي</span>
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Guidance Box */}
          <div className="compatibility-guidance-box">
            <Info size={20} className="guide-icon" />
            <div className="guide-content">
              <strong>قواعد التوجيه الذكي (Smart Routing Advice):</strong>
              <p>
                بطاقات الشبكات المحلية مثل (مدى) تحقق نسبة قبول تفوق 96% عندما يتم توجيهها للبوابات ذات الربط المباشر مع البنك المركزي
                (مثل PayTabs أو نون)، بينما يقل معدل القبول إلى 78% وتُفرض رسوم تبادل دولية عند توجيهها لبوابات تعتمد على فيزا/ماستركارد الدولية خارج المملكة.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
