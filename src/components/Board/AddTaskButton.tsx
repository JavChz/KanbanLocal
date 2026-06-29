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
      className="flex items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-3 select-none cursor-pointer hover:bg-slate-200/20 dark:hover:bg-slate-900/10 group transition-all duration-200 w-full min-h-[44px]"
    >
      <Plus size={14} className="text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
      <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors italic text-center">
        {t('add_task')}
      </span>
    </button>
  );
};
