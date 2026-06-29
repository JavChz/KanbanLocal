import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock } from 'lucide-react';
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
        console.log("TaskCard onClick triggered, transform:", transform);
        // Prevent click if we were dragging
        if (transform && (Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3)) {
          console.log("Click ignored due to dragging transform");
          return;
        }
        onClick(e);
      }}
      className={`glass-card p-4.5 rounded-xl cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-100 flex flex-col items-start gap-2 select-none active:cursor-grabbing ${
        isDragging ? 'shadow-md border-blue-500/50 scale-[1.01]' : ''
      }`}
    >
      <span className="text-left w-full break-words pr-2">{task.title}</span>
      {task.deadline && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono bg-slate-100 dark:bg-slate-900/60 px-1.5 py-0.5 rounded">
          <Clock size={11} className="text-slate-400 dark:text-slate-500" />
          <span>{task.deadline}</span>
        </div>
      )}
    </div>
  );
};
