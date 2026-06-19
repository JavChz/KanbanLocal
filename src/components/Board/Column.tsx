import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../../types/kanban';
import { TaskCard } from './TaskCard';
import { Plus, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (title: string, status: TaskStatus) => void;
}

export const Column: React.FC<ColumnProps> = ({
  status,
  title,
  tasks,
  onTaskClick,
  onAddTask,
}) => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [isAdding, setIsAdding] = useState(false);
  // Listen for the custom shortcut event to trigger task creation in the TODO column
  useEffect(() => {
    if (status === 'TODO') {
      const handleTrigger = () => {
        setIsAdding(true);
      };
      window.addEventListener('trigger-add-todo', handleTrigger);
      return () => {
        window.removeEventListener('trigger-add-todo', handleTrigger);
      };
    }
  }, [status]);

  const [taskTitle, setTaskTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      onAddTask(taskTitle.trim(), status);
      setTaskTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] max-w-sm flex flex-col rounded-2xl glass-panel p-4 transition-all duration-200 ${
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
        <button
          onClick={() => setIsAdding(true)}
          className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          title={t('add_task')}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto min-h-[250px]">
        {/* Inline Task Form */}
        {isAdding && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/3 animate-fade-in"
          >
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder={t('task_title')}
              className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
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
        )}

        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 select-none cursor-pointer hover:bg-slate-200/20 dark:hover:bg-slate-900/10 group transition-all duration-200 min-h-[150px]"
          >
            <Plus size={18} className="text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mb-1.5" />
            <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors italic text-center">
              {t('no_tasks')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
