import { useEffect, useRef, useState } from 'react';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  X,
  Sparkles,
} from 'lucide-react';

import './AppInstallBanner.css';
import { useAppearance } from './i18n';
import type { InstallPrompt } from './platform';
import { useDialogAccessibility } from './useDialogAccessibility';

interface AppInstallBannerProps {
  installPrompt: InstallPrompt | null;
  onDismiss?: () => void;
  autoCloseSeconds?: number;
}

export default function AppInstallBanner({
  installPrompt,
  onDismiss,
  autoCloseSeconds = 12,
}: AppInstallBannerProps) {
  const { tr, language } = useAppearance();
  const [secondsLeft, setSecondsLeft] = useState(autoCloseSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [platformType, setPlatformType] = useState<'ios' | 'android' | 'other'>('other');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  useDialogAccessibility(cardRef, visible, handleClose);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    if (isIOS) setPlatformType('ios');
    else if (isAndroid) setPlatformType('android');
    else setPlatformType('other');
  }, []);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setVisible(false);
          if (onDismiss) onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, secondsLeft, onDismiss]);

  const handleNativeInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      handleClose();
    }
  };

  if (!visible) return null;

  return (
    <div
      className="install-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div className="install-modal-card" ref={cardRef} tabIndex={-1}>
        <div className="install-modal-header">
          <div
            className="timer-badge"
            title={tr('سيغلق تلقائياً ما لم يتم التفاعل', 'Auto-closes unless interacted with')}
          >
            <span>{secondsLeft}s</span>
          </div>
          <button
            type="button"
            className="install-modal-close"
            onClick={handleClose}
            aria-label={tr('إغلاق نافذة التثبيت', 'Close install dialog')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="install-modal-hero">
          <div className="app-icon-wrapper">
            <img src="/icons/icon-192.png" alt="oneShot Brand Studio Icon" width="64" height="64" />
            <span className="app-icon-badge">PWA</span>
          </div>
          <div className="install-hero-text">
            <span className="install-kicker">
              <Sparkles size={14} />
              <span>{tr('تطبيق oneShot الذكي', 'oneShot Smart App')}</span>
            </span>
            <h2 id="install-modal-title">
              {tr('قم بتثبيت التطبيق لتجربة أسرع وأفضل', 'Install the oneShot App for Faster Access')}
            </h2>
            <p>
              {tr(
                'التثبيت يتم مباشرة عبر المتصفح ليتحمل كأيقونة تطبيق على هاتفك سواء للآيفون أو الأندرويد، أو عبر حزمة الـ APK.',
                'Install directly from your browser as a home-screen web app on iOS or Android, or download the direct Android APK package.',
              )}
            </p>
          </div>
        </div>

        <div className="install-guides-tabs">
          <div className={`install-guide-box ${platformType === 'ios' ? 'highlighted' : ''}`}>
            <div className="guide-title">
              <Smartphone size={18} />
              <strong>{tr('تثبيت على الآيفون (iOS Safari)', 'Install on iPhone / iPad (iOS Safari)')}</strong>
            </div>
            <ol className="guide-steps">
              <li>
                {tr('اضغط على زر المشاركة', 'Tap the Share button')}{' '}
                <Share2 size={15} className="inline-icon" aria-hidden="true" />{' '}
                {tr('في أسفل شريط سفاري.', 'in the Safari toolbar.')}
              </li>
              <li>
                {tr('مرر للأسفل واختر', 'Scroll down and select')}{' '}
                <strong>{tr('«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)', '“Add to Home Screen”')}</strong>{' '}
                <PlusSquare size={15} className="inline-icon" aria-hidden="true" />.
              </li>
              <li>
                {tr(
                  'اضغط إضافة (Add)، وسيظهر تطبيق oneShot كأيقونة رسمية على شاشتك.',
                  'Tap Add to place the official oneShot icon on your home screen.',
                )}
              </li>
            </ol>
          </div>

          <div className={`install-guide-box ${platformType === 'android' ? 'highlighted' : ''}`}>
            <div className="guide-title">
              <Smartphone size={18} />
              <strong>{tr('تثبيت على أندرويد (Android)', 'Install on Android')}</strong>
            </div>
            <ol className="guide-steps">
              {installPrompt ? (
                <li>
                  {tr(
                    'يمكنك الضغط على زر التثبيت المباشر أدناه وسيُضاف فوراً.',
                    'Tap the direct browser install button below to add the app immediately.',
                  )}
                </li>
              ) : (
                <li>
                  {tr(
                    'اضغط على قائمة المتصفح (⋮) في الأعلى.',
                    'Open the browser menu (⋮) in the top corner.',
                  )}
                </li>
              )}
              <li>
                {tr('اختر', 'Select')}{' '}
                <strong>{tr('«تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».', '“Install app” or “Add to Home screen”.')}</strong>
              </li>
              <li>
                {tr(
                  'أو قم بتحميل حزمة الـ APK المباشرة للمعاينة السريعة.',
                  'Or download the direct Android APK package below.',
                )}
              </li>
            </ol>
          </div>
        </div>

        <div className="install-modal-actions">
          {installPrompt && (
            <button
              type="button"
              className="install-btn-primary"
              onClick={handleNativeInstall}
            >
              <Smartphone size={18} />
              <span>{tr('تثبيت عبر المتصفح فوراً', 'Install in Browser Now')}</span>
            </button>
          )}

          <a
            className="install-btn-secondary"
            href="/oneshot-hub.apk"
            download="oneshot-hub.apk"
            target="_blank"
            rel="noreferrer"
            onClick={() => handleClose()}
          >
            <Download size={18} />
            <span>{tr('تحميل بصيغة APK (للأندرويد)', 'Download Android APK')}</span>
          </a>

          <button type="button" className="install-btn-text" onClick={handleClose}>
            {tr('المتابعة عبر الويب', 'Continue in Browser')}
          </button>
        </div>
      </div>
    </div>
  );
}

