import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Task } from '../../types/kanban';

interface HomeStatsProps {
  tasks: Task[];
}

export const HomeStats: React.FC<HomeStatsProps> = ({ tasks }) => {
  const { t } = useTranslation();

  const activeTasks = tasks.filter((t) => !t.archived);
  const totalTasks = activeTasks.length;
  const backlogTasks = activeTasks.filter((t) => t.status === 'TODO').length;
  const inProgressTasks = activeTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedTasks = activeTasks.filter((t) => t.status === 'DONE').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="glass-panel rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('backlog') || 'Backlog'}
          </span>
          <span className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {backlogTasks}
          </span>
        </div>

        <span className="hidden sm:block w-px h-4 bg-slate-200 dark:bg-white/10" aria-hidden="true" />

        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('in_progress')}
          </span>
          <span className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {inProgressTasks}
          </span>
        </div>

        <span className="hidden sm:block w-px h-4 bg-slate-200 dark:bg-white/10" aria-hidden="true" />

        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
            {t('completed') || 'Completed'}
          </span>
          <span className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {completedTasks}
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
              {' '}
              / {totalTasks}
            </span>
          </span>
        </div>
      </div>

      {/* Compact Completion Progress Bar */}
      <div className="flex items-center gap-3 sm:min-w-[180px]">
        <div className="flex-1 h-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-[var(--ease-out-expo)]"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <span className="text-xs font-semibold font-mono tabular-nums text-slate-700 dark:text-slate-300 w-9 text-right">
          {completionRate}%
        </span>
      </div>
    </div>
  );
};
