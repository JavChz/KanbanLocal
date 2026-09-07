import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useKanbanStore } from '../../store/useKanbanStore';
import { AppLogo } from '../ui/AppLogo';

interface MobileHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { projects } = useKanbanStore();

  const match = location.pathname.match(/^\/project\/([^/]+)/);
  const activeProject = match ? projects.find((p) => p.id === match[1]) : null;
  const projectAccentColor = activeProject
    ? activeProject.color.startsWith('#')
      ? activeProject.color
      : `var(--color-${activeProject.color})`
    : undefined;

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 glass-panel border-b border-slate-200/50 dark:border-slate-800/30 sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-100">
        <AppLogo
          size={22}
          accentColor={projectAccentColor}
          className="shadow-sm flex-shrink-0 transition-all duration-300"
          style={
            projectAccentColor
              ? {
                  boxShadow: `0 2px 8px color-mix(in srgb, ${projectAccentColor} 30%, transparent)`,
                }
              : undefined
          }
        />
        <span className="tracking-wide">{t('app_title')}</span>
      </Link>
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 cursor-pointer"
        aria-label="Toggle Navigation"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </header>
  );
};
