import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Archive } from 'lucide-react';

interface ColumnHeaderProps {
  title: string;
  count: number;
  showArchiveAllDone?: boolean;
  onArchiveAllDone?: () => void;
  onAddTask: () => void;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  title,
  count,
  showArchiveAllDone,
  onArchiveAllDone,
  onAddTask,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/50 dark:border-slate-800/30 select-none">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
          {title}
        </h4>
        <span className="text-2xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          {count}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {showArchiveAllDone && onArchiveAllDone && (
          <button
            onClick={onArchiveAllDone}
            className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            title={t('archive_all_done')}
          >
            <Archive size={16} />
          </button>
        )}
        <button
          onClick={onAddTask}
          className="p-1 rounded-md text-slate-400 hover:text-[var(--project-color)] hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          title={t('add_task')}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};
