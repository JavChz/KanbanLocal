import React from 'react';
import { Link } from 'react-router-dom';
import { Kanban, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobileHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const { t } = useTranslation();

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 glass-panel border-b border-slate-200/50 dark:border-slate-800/30 sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
        <Kanban size={20} className="text-blue-500" />
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
