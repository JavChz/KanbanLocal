import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import type { Task, TaskStatus } from '../../types/kanban';
import { TaskCard } from './TaskCard';
import { AddTaskButton } from './AddTaskButton';
import { ColumnHeader } from './ColumnHeader';
import { ColumnTaskComposer } from './ColumnTaskComposer';

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task, e: React.MouseEvent) => void;
  onAddTask: (title: string, status: TaskStatus, position?: 'top' | 'bottom') => void;
  onArchiveAllDone?: () => void;
  onPrioritize?: () => void;
}

export const Column: React.FC<ColumnProps> = ({
  status,
  title,
  tasks,
  onTaskClick,
  onAddTask,
  onArchiveAllDone,
  onPrioritize,
}) => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [isAdding, setIsAdding] = useState(false);
  const [addingPosition, setAddingPosition] = useState<'top' | 'bottom'>('top');

  // Listen for shortcut event to trigger task creation in the TODO column
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

  const handleSaveTask = (taskTitle: string) => {
    onAddTask(taskTitle, status, addingPosition);
  };

  const handleCancelTask = () => {
    setIsAdding(false);
  };

  const handleStartAddTop = () => {
    setAddingPosition('top');
    setIsAdding(true);
  };

  const handleStartAddBottom = () => {
    setAddingPosition('bottom');
    setIsAdding(true);
  };

  return (
    <div
      ref={setNodeRef}
      data-drag-over={isOver ? 'true' : undefined}
      className={`w-full md:w-auto md:flex-1 min-w-0 md:min-w-[280px] flex flex-col rounded-2xl glass-panel p-3.5 transition-[background-color,border-color,box-shadow] duration-150 board-column ${
        isOver
          ? 'bg-slate-200/45 dark:bg-slate-800/45 ring-1 ring-[var(--project-color,var(--color-blue-500))]/35'
          : ''
      }`}
    >
      {/* Column Header */}
      <ColumnHeader
        status={status}
        title={title}
        count={tasks.length}
        showArchiveAllDone={status === 'DONE' && tasks.length > 0}
        onArchiveAllDone={onArchiveAllDone}
        onAddTask={handleStartAddTop}
        onPrioritize={onPrioritize}
      />

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-[140px]">
        {/* Inline Task Form (Top) */}
        {isAdding && addingPosition === 'top' && (
          <ColumnTaskComposer
            onSave={(titleText) => {
              handleSaveTask(titleText);
            }}
            onCancel={handleCancelTask}
          />
        )}

        {tasks.length === 0 && !isAdding ? (
          <div
            className={`flex-1 min-h-[120px] rounded-xl border border-dashed flex items-center justify-center p-4 text-center text-xs transition-colors duration-150 select-none ${
              isOver
                ? 'border-[var(--project-color,var(--color-blue-500))]/50 text-slate-600 dark:text-slate-300 bg-slate-200/30 dark:bg-white/[0.03]'
                : 'border-slate-300/60 dark:border-white/8 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span>{t('no_tasks')}</span>
          </div>
        ) : (
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={(e) => onTaskClick(task, e)} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {/* Column Footer: Bottom Add Task Button or Composer */}
      {isAdding && addingPosition === 'bottom' ? (
        <div className="mt-2 pt-0.5">
          <ColumnTaskComposer
            onSave={(titleText) => {
              handleSaveTask(titleText);
            }}
            onCancel={handleCancelTask}
          />
        </div>
      ) : (
        !isAdding && (
          <div className="mt-2 pt-0.5">
            <AddTaskButton onClick={handleStartAddBottom} />
          </div>
        )
      )}
    </div>
  );
};
