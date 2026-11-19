import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import type { Project } from '../../types/kanban';

interface GlobalFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  projectFilter: string;
  onProjectFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  projects: Project[];
  onClearFilters?: () => void;
}

export const GlobalFilterToolbar: React.FC<GlobalFilterToolbarProps> = ({
  search,
  onSearchChange,
  projectFilter,
  onProjectFilterChange,
  statusFilter,
  onStatusFilterChange,
  projects,
  onClearFilters,
}) => {
  const { t } = useTranslation();

  const statusOptions = [
    { value: 'ALL', label: t('all_statuses') },
    { value: 'TODO', label: t('todo') },
    { value: 'IN_PROGRESS', label: t('in_progress') },
    { value: 'DONE', label: t('done') },
    { value: 'ARCHIVED', label: t('archived') },
  ];

  const projectOptions = [
    { value: 'ALL', label: t('all_projects') },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const hasActiveFilters = Boolean(search) || projectFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <div className="glass-panel p-3 rounded-xl flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
      {/* Search input */}
      <div className="flex-1 relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('search_placeholder')}
          aria-label={t('search')}
          className="glass-input w-full h-9 pl-9 pr-8 rounded-lg text-xs sm:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-0.5 rounded"
            aria-label={t('clear_filters')}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Project & Status Selectors */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <select
          aria-label={t('project')}
          value={projectFilter}
          onChange={(e) => onProjectFilterChange(e.target.value)}
          className="glass-input h-9 px-3 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer sm:w-48"
        >
          {projectOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>

        <select
          aria-label={t('status')}
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="glass-input h-9 px-3 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer sm:w-44"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-9 px-3 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
          >
            {t('clear_filters')}
          </button>
        )}
      </div>
    </div>
  );
};
