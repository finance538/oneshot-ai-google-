import { Moon, Sun } from 'lucide-react';
import { appearanceLink, languages, useAppearance, type Language } from './i18n';

export function Brand() {
  const { t } = useAppearance();
  return <a className="brand" href={appearanceLink('/')} aria-label={`oneShot · ${t('مساحة التاجر')}`}><img className="brand-logo" src="/oneshot.svg" alt="" width="44" height="44" /><span className="brand-name" dir="ltr">one<span className="brand-shot">Shot</span><small>PAYMENT STUDIO</small></span></a>;
}

export function AppearanceControls() {
  const { language, theme, setLanguage, setTheme, t } = useAppearance();
  return <div className="appearance-controls"><select aria-label={t('اللغة')} value={language} onChange={event => setLanguage(event.target.value as Language)}>{languages.map(item => <option key={item.id} value={item.id} lang={item.id}>{item.name}</option>)}</select><button className="icon-button theme-button" aria-label={t(theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي')} title={t(theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي')} aria-pressed={theme === 'light'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button></div>;
}
