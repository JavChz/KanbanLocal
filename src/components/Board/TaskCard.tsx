import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types/kanban';

interface TaskCardProps {
  task: Task;
  onClick: (e: React.MouseEvent) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Prevent click if we were dragging
        if (transform && (Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3)) {
          return;
        }
        onClick(e);
      }}
      className={`glass-card p-4.5 rounded-xl cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-100 flex items-center justify-between select-none active:cursor-grabbing ${
        isDragging ? 'shadow-md border-blue-500/50 scale-[1.01]' : ''
      }`}
    >
      <span className="truncate pr-2">{task.title}</span>
    </div>
  );
};
