import { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  X,
  Sparkles,
} from 'lucide-react';

import './AppInstallBanner.css';
import type { InstallPrompt } from './platform';

interface AppInstallBannerProps {
  installPrompt: InstallPrompt | null;
  onDismiss?: () => void;
  autoCloseSeconds?: number;
}

export default function AppInstallBanner({
  installPrompt,
  onDismiss,
  autoCloseSeconds = 3,
}: AppInstallBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState(autoCloseSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [platformType, setPlatformType] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // Detect iOS vs Android
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

  const handleClose = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

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
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
    >
      <div className="install-modal-card">
        {/* Header with Close X and Timer */}
        <div className="install-modal-header">
          <div className="timer-badge" title="سيغلق تلقائياً ما لم يتم التفاعل">
            <span>{secondsLeft}s</span>
          </div>
          <button
            className="install-modal-close"
            onClick={handleClose}
            aria-label="إغلاق التنبيه"
          >
            <X size={20} />
          </button>
        </div>

        {/* Brand App Icon & Title */}
        <div className="install-modal-hero">
          <div className="app-icon-wrapper">
            <img src="/icons/icon-192.png" alt="OneShot Icon" width="64" height="64" />
            <span className="app-icon-badge">PWA</span>
          </div>
          <div className="install-hero-text">
            <span className="install-kicker">
              <Sparkles size={14} />
              <span>تطبيق OneShot الذكي</span>
            </span>
            <h2 id="install-modal-title">قم بتثبيت التطبيق لتجربة أسرع وأفضل</h2>
            <p>
              التثبيت يتم مباشرة عبر المتصفح ليتحمل كأيقونة تطبيق على هاتفك سواء للآيفون أو الأندرويد، أو عبر حزمة الـ APK.
            </p>
          </div>
        </div>

        {/* Steps for iOS / Android */}
        <div className="install-guides-tabs">
          {/* iOS Safari Guide */}
          <div className={`install-guide-box ${platformType === 'ios' ? 'highlighted' : ''}`}>
            <div className="guide-title">
              <Smartphone size={18} />
              <strong>تثبيت على الآيفون (iOS Safari)</strong>
            </div>
            <ol className="guide-steps">
              <li>
                اضغط على زر المشاركة <Share2 size={15} className="inline-icon" /> في أسفل شريط سفاري.
              </li>
              <li>
                مرر للأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية»</strong> (Add to Home Screen) <PlusSquare size={15} className="inline-icon" />.
              </li>
              <li>اضغط <strong>إضافة (Add)</strong>، وسيظهر تطبيق OneShot كأيقونة رسمية على شاشتك.</li>
            </ol>
          </div>

          {/* Android Chrome Guide */}
          <div className={`install-guide-box ${platformType === 'android' ? 'highlighted' : ''}`}>
            <div className="guide-title">
              <Smartphone size={18} />
              <strong>تثبيت على أندرويد (Android)</strong>
            </div>
            <ol className="guide-steps">
              {installPrompt ? (
                <li>
                  يمكنك الضغط على زر التثبيت المباشر أدناه وسيُضاف فوراً.
                </li>
              ) : (
                <li>اضغط على قائمة المتصفح (⋮) أعلى اليمين.</li>
              )}
              <li>اختر <strong>«تثبيت التطبيق»</strong> أو «إضافة إلى الشاشة الرئيسية».</li>
              <li>أو قم بتحميل حزمة الـ APK المباشرة للمعاينة السريعة.</li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="install-modal-actions">
          {installPrompt && (
            <button
              className="install-btn-primary"
              onClick={handleNativeInstall}
            >
              <Smartphone size={18} />
              <span>تثبيت عبر المتصفح فوراً</span>
            </button>
          )}

          <a
            className="install-btn-secondary"
            href="https://github.com/finance538/oneshot-ai-google-/releases/latest/download/oneshot-hub.apk"
            download="oneshot-hub.apk"
            target="_blank"
            rel="noreferrer"
            onClick={() => handleClose()}
          >
            <Download size={18} />
            <span>تحميل بصيغة APK (للأندرويد)</span>
          </a>

          <button className="install-btn-text" onClick={handleClose}>
            المتابعة عبر الويب
          </button>
        </div>
      </div>
    </div>
  );
}
