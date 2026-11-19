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
      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-slate-300/80 dark:border-white/10 hover:border-[var(--project-color,#3b82f6)]/50 bg-transparent hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04] text-slate-500 dark:text-slate-300 hover:text-[var(--project-color,#3b82f6)] dark:hover:text-[var(--project-color,#60a5fa)] transition-colors duration-150 cursor-pointer select-none w-full group active:scale-[0.99]"
    >
      <Plus
        size={14}
        className="text-slate-400 dark:text-slate-400 group-hover:text-[var(--project-color,#3b82f6)] dark:group-hover:text-[var(--project-color,#60a5fa)] transition-colors duration-150"
      />
      <span className="text-xs font-medium tracking-wide transition-colors">
        {t('add_task')}
      </span>
    </button>
  );
};
