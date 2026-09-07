import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Select } from '../ui/Select';
import type { Project } from '../../types/kanban';

interface GlobalFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  projectFilter: string;
  onProjectFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  projects: Project[];
}

export const GlobalFilterToolbar: React.FC<GlobalFilterToolbarProps> = ({
  search,
  onSearchChange,
  projectFilter,
  onProjectFilterChange,
  statusFilter,
  onStatusFilterChange,
  projects,
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

  return (
    <div className="glass-panel p-4.5 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
      {/* Search input */}
      <div className="flex-1 w-full relative flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1">
          <Search size={12} />
          {t('search')}
        </label>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search_placeholder')}
            className="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-sm"
          />
          <Search size={14} className="absolute left-3.5 top-3 text-slate-500 dark:text-slate-400" />
        </div>
      </div>

      {/* Project Selector */}
      <div className="w-full md:w-64">
        <Select
          label={t('project')}
          options={projectOptions}
          value={projectFilter}
          onChange={(e) => onProjectFilterChange(e.target.value)}
        />
      </div>

      {/* Status Selector */}
      <div className="w-full md:w-52">
        <Select
          label={t('status')}
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        />
      </div>
    </div>
  );
};
