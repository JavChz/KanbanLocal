import React, { useState, useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../../types/kanban';
import { TaskCard } from './TaskCard';
import { AddTaskButton } from './AddTaskButton';
import { Plus, Check, X, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task, e: React.MouseEvent) => void;
  onAddTask: (title: string, status: TaskStatus, position?: 'top' | 'bottom') => void;
  onArchiveAllDone?: () => void;
}

export const Column: React.FC<ColumnProps> = ({
  status,
  title,
  tasks,
  onTaskClick,
  onAddTask,
  onArchiveAllDone,
}) => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [isAdding, setIsAdding] = useState(false);
  const [addingPosition, setAddingPosition] = useState<'top' | 'bottom'>('top');
  const [taskTitle, setTaskTitle] = useState('');
  
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for the custom shortcut event to trigger task creation in the TODO column
  useEffect(() => {
    if (status === 'TODO') {
      const handleTrigger = () => {
        setAddingPosition('top');
        setIsAdding(true);
      };
      window.addEventListener('trigger-add-todo', handleTrigger);
      return () => {
        window.removeEventListener('trigger-add-todo', handleTrigger);
      };
    }
  }, [status]);

  const handleCloseOrSave = () => {
    if (taskTitle.trim()) {
      onAddTask(taskTitle.trim(), status, addingPosition);
    }
    setTaskTitle('');
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      onAddTask(taskTitle.trim(), status, addingPosition);
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
    if (!isAdding) return;

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
  }, [isAdding, taskTitle, status, addingPosition]);

  const renderForm = () => (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/3 animate-fade-in"
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
          onClick={() => setIsAdding(false)}
          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-200/30 dark:hover:bg-slate-800/30 cursor-pointer"
        >
          <X size={14} />
         </button>
        <button
          type="submit"
          className="p-1 rounded text-slate-400 hover:text-green-500 hover:bg-slate-200/30 dark:hover:bg-slate-800/30 cursor-pointer"
        >
          <Check size={14} />
        </button>
      </div>
    </form>
  );

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] flex flex-col rounded-2xl glass-panel p-4 transition-all duration-200 board-column ${
        isOver ? 'bg-slate-200/40 dark:bg-slate-800/20 scale-[1.005] ring-1 ring-blue-500/20' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/50 dark:border-slate-800/30 select-none">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
            {title}
          </h4>
          <span className="text-2xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {status === 'DONE' && tasks.length > 0 && onArchiveAllDone && (
            <button
              onClick={onArchiveAllDone}
              className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
              title={t('archive_all_done')}
            >
              <Archive size={16} />
            </button>
          )}
          <button
            onClick={() => {
              setAddingPosition('top');
              setIsAdding(true);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            title={t('add_task')}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto min-h-[250px]">
        {/* Inline Task Form (Top) */}
        {isAdding && addingPosition === 'top' && renderForm()}

        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={(e) => onTaskClick(task, e)} />
            ))}
          </div>
        </SortableContext>

        {/* Inline Task Form (Bottom) */}
        {isAdding && addingPosition === 'bottom' && renderForm()}

        {!isAdding && (
          <AddTaskButton
            onClick={() => {
              setAddingPosition('bottom');
              setIsAdding(true);
            }}
          />
        )}
      </div>
    </div>
  );
};
