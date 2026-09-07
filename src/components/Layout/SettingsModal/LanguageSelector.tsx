import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKanbanStore } from '../../../store/useKanbanStore';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages: { code: 'en' | 'fr' | 'ja' | 'es'; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸 🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷 🇨🇦' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'es', label: 'Español', flag: '🇪🇸 🇲🇽' },
];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useKanbanStore();
  const { t, i18n } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const handleLanguageChange = (lang: 'en' | 'fr' | 'ja' | 'es') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex flex-col gap-2 text-left relative">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <Globe size={13} />
        {t('language')}
      </span>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all font-medium cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5 items-center">
            {language === 'en' && (
              <>
                <img src="https://flagcdn.com/w20/us.png" alt="US" className="h-3 object-contain rounded-xs" />
                <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="h-3 object-contain rounded-xs" />
              </>
            )}
            {language === 'fr' && (
              <>
                <img src="https://flagcdn.com/w20/fr.png" alt="FR" className="h-3 object-contain rounded-xs" />
                <img src="https://flagcdn.com/w20/ca.png" alt="CA" className="h-3 object-contain rounded-xs" />
              </>
            )}
            {language === 'es' && (
              <>
                <img src="https://flagcdn.com/w20/es.png" alt="ES" className="h-3 object-contain rounded-xs" />
                <img src="https://flagcdn.com/w20/mx.png" alt="MX" className="h-3 object-contain rounded-xs" />
              </>
            )}
            {language === 'ja' && (
              <img src="https://flagcdn.com/w20/jp.png" alt="JP" className="h-3 object-contain rounded-xs" />
            )}
          </div>
          <span>
            {language === 'en' && 'English'}
            {language === 'fr' && 'Français'}
            {language === 'es' && 'Español'}
            {language === 'ja' && '日本語'}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Options */}
      {isLangDropdownOpen && (
        <>
          {/* Backdrop overlay to close when clicking outside */}
          <div className="fixed inset-0 z-30" onClick={() => setIsLangDropdownOpen(false)} />

          <div className="absolute top-full left-0 right-0 mt-1.5 glass-panel p-1.5 rounded-xl shadow-xl z-40 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-fade-in flex flex-col gap-1">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    handleLanguageChange(lang.code);
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/55 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5 items-center w-9 justify-center flex-shrink-0">
                      {lang.code === 'en' && (
                        <>
                          <img src="https://flagcdn.com/w20/us.png" alt="US" className="h-2.5 object-contain rounded-xs" />
                          <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="h-2.5 object-contain rounded-xs" />
                        </>
                      )}
                      {lang.code === 'fr' && (
                        <>
                          <img src="https://flagcdn.com/w20/fr.png" alt="FR" className="h-2.5 object-contain rounded-xs" />
                          <img src="https://flagcdn.com/w20/ca.png" alt="CA" className="h-2.5 object-contain rounded-xs" />
                        </>
                      )}
                      {lang.code === 'es' && (
                        <>
                          <img src="https://flagcdn.com/w20/es.png" alt="ES" className="h-2.5 object-contain rounded-xs" />
                          <img src="https://flagcdn.com/w20/mx.png" alt="MX" className="h-2.5 object-contain rounded-xs" />
                        </>
                      )}
                      {lang.code === 'ja' && (
                        <img src="https://flagcdn.com/w20/jp.png" alt="JP" className="h-2.5 object-contain rounded-xs" />
                      )}
                    </div>
                    <span>{lang.label}</span>
                  </div>
                  {isSelected && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
