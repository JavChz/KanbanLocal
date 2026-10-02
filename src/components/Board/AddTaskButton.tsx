import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddTaskButtonProps {
  onClick: () => void;
}

export const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-[var(--project-color,#3b82f6)]/60 bg-slate-100/60 dark:bg-slate-900/40 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-350 hover:text-[var(--project-color,#3b82f6)] dark:hover:text-[var(--project-color,#60a5fa)] shadow-xs transition-all duration-150 cursor-pointer select-none w-full group active:scale-[0.99]"
    >
      <Plus
        size={14}
        className="text-slate-500 dark:text-slate-400 group-hover:text-[var(--project-color,#3b82f6)] dark:group-hover:text-[var(--project-color,#60a5fa)] transition-transform duration-150 group-hover:scale-110"
      />
      <span className="text-xs font-semibold tracking-wide transition-colors">
        {t('add_task')}
      </span>
    </button>
  );
};
