import { useAppearance } from './i18n';

export default function LoadingPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useAppearance();
  return <div className={`studio-loading ${compact ? 'compact' : ''}`} role="status" aria-live="polite"><span className="studio-loading-label">{t('جارٍ التحميل…')}</span><div className="studio-loading-shapes" aria-hidden="true"><span className="studio-skeleton title" /><span className="studio-skeleton" /><span className="studio-skeleton short" /></div></div>;
}
