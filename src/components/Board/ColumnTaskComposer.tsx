import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';

interface ColumnTaskComposerProps {
  onSave: (title: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export const ColumnTaskComposer: React.FC<ColumnTaskComposerProps> = ({
  onSave,
  onCancel,
  placeholder,
}) => {
  const { t } = useTranslation();
  const [taskTitle, setTaskTitle] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCloseOrSave = useCallback(() => {
    if (taskTitle.trim()) {
      onSave(taskTitle.trim());
      onCancel();
    } else {
      onCancel();
    }
  }, [taskTitle, onSave, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      onSave(taskTitle.trim());
      setTaskTitle('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        handleCloseOrSave();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleCloseOrSave]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 p-2.5 rounded-xl border border-[var(--project-color,var(--color-blue-500))]/35 bg-white/85 dark:bg-slate-900/70 shadow-xs animate-composer-in"
    >
      <input
        ref={inputRef}
        type="text"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        placeholder={placeholder || t('task_title')}
        className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
        onKeyDown={handleKeyDown}
        autoFocus
        required
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-3xs text-slate-400 dark:text-slate-500 pl-0.5 select-none">
          Enter · Esc
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            aria-label={t('cancel')}
          >
            <X size={14} />
          </button>
          <button
            type="submit"
            className="p-1 rounded-md text-slate-400 hover:text-[var(--project-color,var(--color-blue-500))] hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            aria-label={t('add_task')}
          >
            <Check size={14} />
          </button>
        </div>
      </div>
    </form>
  );
};
