import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useKanbanStore } from '../../../store/useKanbanStore';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages: { code: 'en' | 'fr' | 'ja' | 'es'; label: string; shortCode: string }[] = [
  { code: 'en', label: 'English', shortCode: 'EN' },
  { code: 'fr', label: 'Français', shortCode: 'FR' },
  { code: 'ja', label: '日本語', shortCode: 'JA' },
  { code: 'es', label: 'Español', shortCode: 'ES' },
];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useKanbanStore();
  const { t, i18n } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 240,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeLanguage = languages.find((l) => l.code === language) ?? languages[0];

  const handleLanguageChange = (lang: 'en' | 'fr' | 'ja' | 'es') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleToggle = () => {
    if (!isLangDropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedHeight = 190;
      const openAbove =
        rect.bottom + 6 + estimatedHeight > window.innerHeight - 12 &&
        rect.top - estimatedHeight - 6 > 12;
      setMenuRect({
        top: openAbove ? rect.top - estimatedHeight - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsLangDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isLangDropdownOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setIsLangDropdownOpen(false);
      }
    };

    const handleReposition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuRect({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', handleReposition, { passive: true });
    window.addEventListener('scroll', handleReposition, { capture: true, passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isLangDropdownOpen]);

  return (
    <div className="flex flex-col gap-2 text-left relative">
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
        <Globe size={13} />
        {t('language')}
      </span>

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-white/20 transition-colors font-medium cursor-pointer"
        aria-expanded={isLangDropdownOpen}
      >
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-7 h-5 rounded-md text-3xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
            {activeLanguage.shortCode}
          </span>
          <span>{activeLanguage.label}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-150 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Portaled Dropdown Options */}
      {isLangDropdownOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[var(--z-popover)]"
              onClick={() => setIsLangDropdownOpen(false)}
            />
            <div
              style={{
                top: `${menuRect.top}px`,
                left: `${menuRect.left}px`,
                width: `${menuRect.width}px`,
              }}
              className="fixed glass-panel p-1.5 rounded-xl shadow-2xl z-[var(--z-popover)] border border-slate-200/90 dark:border-white/12 bg-white dark:bg-slate-900 animate-popover-in flex flex-col gap-0.5"
            >
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-900/[0.07] dark:bg-white/[0.09] text-slate-950 dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-7 h-5 rounded text-3xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                        {lang.shortCode}
                      </span>
                      <span>{lang.label}</span>
                    </div>
                    {isSelected && <Check size={13} className="text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
