import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';

interface ColumnTaskComposerProps {
  onSave: (title: string) => void;
  onCancel: () => void;
}

export const ColumnTaskComposer: React.FC<ColumnTaskComposerProps> = ({
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [taskTitle, setTaskTitle] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCloseOrSave = useCallback(() => {
    if (taskTitle.trim()) {
      onSave(taskTitle.trim());
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
      handleCloseOrSave();
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
      className="flex flex-col gap-2 p-3 rounded-xl border animate-fade-in"
      style={{
        borderColor: 'color-mix(in srgb, var(--project-color) 30%, var(--color-slate-200))',
        backgroundColor: 'color-mix(in srgb, var(--project-color) 4%, transparent)',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        placeholder={t('task_title')}
        className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
        onKeyDown={handleKeyDown}
        autoFocus
        required
      />
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-200/30 dark:hover:bg-slate-800/30 cursor-pointer"
        >
          <X size={14} />
        </button>
        <button
          type="submit"
          className="p-1 rounded text-slate-400 hover:text-[var(--project-color)] hover:bg-slate-200/30 dark:hover:bg-slate-800/30 cursor-pointer"
        >
          <Check size={14} />
        </button>
      </div>
    </form>
  );
};
