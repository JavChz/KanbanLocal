import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const options: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun size={15} />, label: t('light_mode') },
    { mode: 'system', icon: <Monitor size={15} />, label: t('system_default') },
    { mode: 'dark', icon: <Moon size={15} />, label: t('dark_mode') },
  ];

  return (
    <div className="flex flex-col gap-2 text-left w-full">
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
        {t('theme')}
      </span>
      <div className="glass-panel p-1 rounded-xl flex gap-1 w-full">
        {options.map(({ mode, icon, label }) => {
          const isActive = theme === mode;
          return (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow dark:bg-blue-500'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
              title={label}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
