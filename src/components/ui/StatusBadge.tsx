import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TaskStatus } from '../../types/kanban';

export interface StatusBadgeProps {
  status: TaskStatus | string;
  archived?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  archived,
  size = 'default',
  className = '',
}) => {
  const { t } = useTranslation();

  const getStatusBadgeClass = () => {
    if (archived) {
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-500/25 dark:border-purple-900/20';
    }
    switch (status) {
      case 'TODO':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/35';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/25 dark:border-amber-900/20';
      case 'DONE':
        return 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-500/25 dark:border-green-900/20';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusLabel = () => {
    if (archived) {
      return t('archived');
    }
    switch (status) {
      case 'TODO':
        return t('todo');
      case 'IN_PROGRESS':
        return t('in_progress');
      case 'DONE':
        return t('done');
      default:
        return status;
    }
  };

  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-[9px]'
    : 'px-2 py-0.5 text-3xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider ${sizeClasses} ${getStatusBadgeClass()} ${className}`}
    >
      {getStatusLabel()}
    </span>
  );
};
