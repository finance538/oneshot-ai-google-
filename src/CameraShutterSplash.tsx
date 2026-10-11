import { useEffect, useState } from 'react';
import './CameraShutterSplash.css';

interface CameraShutterSplashProps {
  onComplete?: () => void;
  autoCloseTimeout?: number;
}

export default function CameraShutterSplash({
  onComplete,
  autoCloseTimeout = 1900,
}: CameraShutterSplashProps) {
  const [phase, setPhase] = useState<'shutter' | 'click' | 'open' | 'gone'>('shutter');

  useEffect(() => {
    // 1. Shutter rotation & focus
    const t1 = setTimeout(() => {
      setPhase('click'); // flash & shutter sound feel
    }, 900);

    // 2. Open aperture blades widely
    const t2 = setTimeout(() => {
      setPhase('open');
    }, 1350);

    // 3. Complete and unmount splash
    const t3 = setTimeout(() => {
      setPhase('gone');
      if (onComplete) onComplete();
    }, autoCloseTimeout);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [autoCloseTimeout, onComplete]);

  if (phase === 'gone') return null;

  return (
    <aside
      className={`camera-shutter-overlay phase-${phase}`}
      aria-label="OneShot Splash Lens Animation"
      role="dialog"
      aria-modal="true"
    >
      <div className="camera-viewfinder">
        {/* Optical grid and corner tick marks */}
        <div className="viewfinder-corner top-left" />
        <div className="viewfinder-corner top-right" />
        <div className="viewfinder-corner bottom-left" />
        <div className="viewfinder-corner bottom-right" />
        <div className="viewfinder-lens-ring" />
      </div>

      {/* Optical flash burst on click */}
      <div className="shutter-flash" />

      {/* Shutter mechanical mechanism */}
      <div className="shutter-mechanism">
        <svg
          className="shutter-svg"
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="splash-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.55" />
            </filter>
            <filter id="splash-orange-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#FF5500" floodOpacity="0.75" />
            </filter>
            <linearGradient id="splash-blade-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E232F" />
              <stop offset="50%" stopColor="#12141A" />
              <stop offset="100%" stopColor="#0B0D12" />
            </linearGradient>
            <linearGradient id="splash-blade-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF5500" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF3300" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* 6 Camera Iris / Shutter Blades with mechanical movement */}
          <g className="shutter-blades-group" transform-origin="200 200">
            {/* Blade 1 */}
            <path
              className="aperture-blade blade-1"
              d="M 389.87 216.11 A 140 140 0 0 1 325.22 328.07 Q 327.87 283.90 301.18 238.95 A 58.8 58.8 0 0 0 301.18 181.05 Q 354.39 184.94 389.87 216.11 Z"
              fill="url(#splash-blade-grad)"
              stroke="#2E3440"
              strokeWidth="1.5"
              filter="url(#splash-soft-shadow)"
            />
            {/* Blade 2 */}
            <path
              className="aperture-blade blade-2"
              d="M 314.64 334.18 A 140 140 0 0 1 185.36 334.18 Q 224.94 314.39 250.51 268.80 A 58.8 58.8 0 0 0 300.66 239.84 Q 323.90 287.87 314.64 334.18 Z"
              fill="url(#splash-blade-grad)"
              stroke="#2E3440"
              strokeWidth="1.5"
              filter="url(#splash-soft-shadow)"
            />
            {/* Blade 3 */}
            <path
              className="aperture-blade blade-3"
              d="M 174.78 328.07 A 140 140 0 0 1 110.13 216.11 Q 147.07 240.49 199.34 239.84 A 58.8 58.8 0 0 0 249.49 268.80 Q 219.51 312.93 174.78 328.07 Z"
              fill="url(#splash-blade-grad)"
              stroke="#2E3440"
              strokeWidth="1.5"
              filter="url(#splash-soft-shadow)"
            />
            {/* Blade 4 */}
            <path
              className="aperture-blade blade-4"
              d="M 110.13 203.89 A 140 140 0 0 1 174.78 91.93 Q 172.13 136.10 198.82 181.05 A 58.8 58.8 0 0 0 198.82 238.95 Q 145.61 235.06 110.13 203.89 Z"
              fill="url(#splash-blade-grad)"
              stroke="#2E3440"
              strokeWidth="1.5"
              filter="url(#splash-soft-shadow)"
            />
            {/* Blade 5 */}
            <path
              className="aperture-blade blade-5"
              d="M 185.36 85.82 A 140 140 0 0 1 314.64 85.82 Q 275.06 105.61 249.49 151.20 A 58.8 58.8 0 0 0 199.34 180.16 Q 176.10 132.13 185.36 85.82 Z"
              fill="url(#splash-blade-grad)"
              stroke="#2E3440"
              strokeWidth="1.5"
              filter="url(#splash-soft-shadow)"
            />
            {/* Blade 6 */}
            <path
              className="aperture-blade blade-6"
              d="M 325.22 91.93 A 140 140 0 0 1 389.87 203.89 Q 352.93 179.51 300.66 180.16 A 58.8 58.8 0 0 0 250.51 151.20 Q 280.49 107.07 325.22 91.93 Z"
              fill="url(#splash-blade-grad)"
              stroke="#2E3440"
              strokeWidth="1.5"
              filter="url(#splash-soft-shadow)"
            />
          </g>

          {/* Center Focus Reticle with Target Bullseye */}
          <g
            className="splash-reticle-group"
            filter="url(#splash-orange-glow)"
            transform="rotate(0 200 200)"
          >
            <circle
              cx="200"
              cy="200"
              r="48"
              fill="none"
              stroke="#FF5500"
              strokeWidth="3.2"
              strokeDasharray="8 4"
              className="reticle-pulse"
            />
            {/* Cardinal ticks */}
            <rect x="198" y="142" width="4" height="16" rx="1" fill="#FF5500" />
            <rect x="198" y="242" width="4" height="16" rx="1" fill="#FF5500" />
            <rect x="142" y="198" width="16" height="4" rx="1" fill="#FF5500" />
            <rect x="242" y="198" width="16" height="4" rx="1" fill="#FF5500" />

            {/* Core center dot */}
            <circle cx="200" cy="200" r="14" fill="#FF5500" className="center-target" />
          </g>
        </svg>

        {/* Central Brand Badge */}
        <div className="shutter-brand-title">
          <span className="brand-one">one</span>
          <span className="brand-shot">Shot</span>
          <div className="shutter-tagline">
            <span className="shutter-status-dot" />
            <span>PRECISION SHUTTER • CAPTURE READY</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
