import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Archive, ArrowDownWideNarrow } from 'lucide-react';
import type { TaskStatus } from '../../types/kanban';

interface ColumnHeaderProps {
  status?: TaskStatus;
  title: string;
  count: number;
  showArchiveAllDone?: boolean;
  onArchiveAllDone?: () => void;
  onAddTask: () => void;
  onPrioritize?: () => void;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  status,
  title,
  count,
  showArchiveAllDone,
  onArchiveAllDone,
  onAddTask,
  onPrioritize,
}) => {
  const { t } = useTranslation();

  const statusDotClass =
    status === 'DONE'
      ? 'bg-emerald-500'
      : status === 'IN_PROGRESS'
      ? 'bg-amber-500'
      : 'bg-slate-400 dark:bg-slate-500';

  return (
    <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-200/70 dark:border-white/8 select-none">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass}`} />
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wider uppercase">
          {title}
        </h4>
        <span className="text-2xs font-semibold font-mono tabular-nums px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
          {count}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {count > 1 && onPrioritize && (
          <button
            type="button"
            onClick={onPrioritize}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--project-color,var(--color-blue-500))] hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title={t('prioritize_column', 'Sort column by priority (Eisenhower matrix)')}
          >
            <ArrowDownWideNarrow size={14} />
          </button>
        )}
        {showArchiveAllDone && onArchiveAllDone && (
          <button
            type="button"
            onClick={onArchiveAllDone}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title={t('archive_all_done')}
          >
            <Archive size={15} />
          </button>
        )}
        <button
          type="button"
          onClick={onAddTask}
          className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--project-color,var(--color-blue-500))] hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          title={t('add_task')}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
};
