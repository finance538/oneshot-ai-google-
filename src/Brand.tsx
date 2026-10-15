import { Moon, Sun, Globe } from 'lucide-react';
import { appearanceLink, languages, useAppearance, type Language } from './i18n';

const languageNamesByActiveLanguage: Record<Language, Record<Language, string>> = {
  ar: {
    ar: 'العربية 🇸🇦',
    en: 'الإنجليزية 🇬🇧',
    zh: 'الصينية 🇨🇳',
    ru: 'الروسية 🇷🇺',
    fr: 'الفرنسية 🇫🇷',
  },
  en: {
    ar: 'Arabic 🇸🇦',
    en: 'English 🇬🇧',
    zh: 'Chinese 🇨🇳',
    ru: 'Russian 🇷🇺',
    fr: 'French 🇫🇷',
  },
  zh: {
    ar: '阿拉伯语 🇸🇦',
    en: '英语 🇬🇧',
    zh: '中文 🇨🇳',
    ru: '俄语 🇷🇺',
    fr: '法语 🇫🇷',
  },
  ru: {
    ar: 'Арабский 🇸🇦',
    en: 'Английский 🇬🇧',
    zh: 'Китайский 🇨🇳',
    ru: 'Русский 🇷🇺',
    fr: 'Французский 🇫🇷',
  },
  fr: {
    ar: 'Arabe 🇸🇦',
    en: 'Anglais 🇬🇧',
    zh: 'Chinois 🇨🇳',
    ru: 'Russe 🇷🇺',
    fr: 'Français 🇫🇷',
  },
};

export function Brand() {
  const { t } = useAppearance();
  return <a className="brand" href={appearanceLink('/')} aria-label={`oneShot · ${t('مساحة التاجر')}`}><img className="brand-logo" src="/oneshot.svg" alt="" width="44" height="44" /><span className="brand-name" dir="ltr">one<span className="brand-shot">Shot</span><small>PAYMENT STUDIO</small></span></a>;
}

export function AppearanceControls() {
  const { language, theme, setLanguage, setTheme, t } = useAppearance();
  return (
    <div className="appearance-controls">
      <div className="language-select-wrapper">
        <Globe size={16} className="globe-icon" aria-hidden="true" />
        <select
          aria-label={t('اللغة')}
          value={language}
          onChange={event => setLanguage(event.target.value as Language)}
          className="language-dropdown-select"
        >
          {languages.map(item => (
            <option key={item.id} value={item.id} lang={item.id}>
              {languageNamesByActiveLanguage[language]?.[item.id] || item.name}
            </option>
          ))}
        </select>
      </div>
      <button
        className="icon-button theme-button"
        aria-label={t(theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي')}
        title={t(theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي')}
        aria-pressed={theme === 'light'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    </div>
  );
}
