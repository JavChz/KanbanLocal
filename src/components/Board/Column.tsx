import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
}

export const Column: React.FC<ColumnProps> = ({
  status,
  title,
  tasks,
  onTaskClick,
  onAddTask,
  onArchiveAllDone,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [isAdding, setIsAdding] = useState(false);
  const [addingPosition, setAddingPosition] = useState<'top' | 'bottom'>('top');

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

  const handleSaveTask = (taskTitle: string) => {
    onAddTask(taskTitle, status, addingPosition);
    setIsAdding(false);
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
      className={`flex-1 min-w-[280px] flex flex-col rounded-2xl glass-panel p-4 transition-all duration-200 board-column ${
        isOver ? 'bg-slate-200/40 dark:bg-slate-800/20 scale-[1.005] ring-1 ring-[var(--project-color)]/20' : ''
      }`}
    >
      {/* Column Header */}
      <ColumnHeader
        title={title}
        count={tasks.length}
        showArchiveAllDone={status === 'DONE' && tasks.length > 0}
        onArchiveAllDone={onArchiveAllDone}
        onAddTask={handleStartAddTop}
      />

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto min-h-[250px]">
        {/* Inline Task Form (Top) */}
        {isAdding && addingPosition === 'top' && (
          <ColumnTaskComposer
            onSave={handleSaveTask}
            onCancel={handleCancelTask}
          />
        )}

        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={(e) => onTaskClick(task, e)} />
            ))}
          </div>
        </SortableContext>

        {/* Inline Task Form (Bottom) */}
        {isAdding && addingPosition === 'bottom' && (
          <ColumnTaskComposer
            onSave={handleSaveTask}
            onCancel={handleCancelTask}
          />
        )}
      </div>

      {/* Bottom Add Task Button */}
      {!isAdding && (
        <AddTaskButton onClick={handleStartAddBottom} />
      )}
    </div>
  );
};
