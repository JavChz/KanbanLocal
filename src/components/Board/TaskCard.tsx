import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlignLeft, CheckSquare, Clock, Link2 } from 'lucide-react';
import type { Task } from '../../types/kanban';
import { PriorityBadge } from '../ui/PriorityBadge';
import { getChecklistProgress, getDeadlineState } from '../../utils/markdown';

interface TaskCardVisualProps {
  task: Task;
  onClick?: (e: React.MouseEvent) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
  dragRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
  dragProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const TaskCardVisual: React.FC<TaskCardVisualProps> = ({
  task,
  onClick,
  isDragging = false,
  isOverlay = false,
  dragRef,
  style,
  dragProps,
}) => {
  const tags = task.tags ?? [];
  const visibleTags = tags.slice(0, 3);
  const extraTags = Math.max(0, tags.length - 3);
  const checklist = getChecklistProgress(task.description);
  const hasProseDescription = checklist.total === 0 && Boolean(task.description?.trim());
  const linkCount = task.links?.length ?? 0;
  const deadlineState = getDeadlineState(task.deadline, task.status === 'DONE');

  const deadlineClasses =
    deadlineState === 'overdue'
      ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border border-rose-500/25'
      : deadlineState === 'today'
      ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25'
      : deadlineState === 'soon'
      ? 'bg-amber-500/8 text-amber-700 dark:text-amber-300'
      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300';

  const checklistComplete = checklist.total > 0 && checklist.done === checklist.total;

  const hasMetaRow = Boolean(
    task.deadline ||
      (task.priority && task.priority !== 'none') ||
      checklist.total > 0 ||
      hasProseDescription ||
      linkCount > 0
  );

  return (
    <div
      ref={dragRef}
      style={style}
      {...dragProps}
      onClick={onClick}
      className={`glass-card p-3.5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 flex flex-col items-start gap-2 select-none ${
        isOverlay
          ? 'shadow-2xl ring-1 ring-[var(--project-color,var(--color-blue-500))]/40 rotate-[1.2deg] cursor-grabbing'
          : 'cursor-grab active:cursor-grabbing'
      } ${isDragging ? 'ring-1 ring-[var(--project-color,var(--color-blue-500))]/40' : ''}`}
    >
      <span className="text-left w-full break-words text-[13.5px] font-medium leading-snug text-slate-800 dark:text-slate-100">
        {task.title}
      </span>

      {visibleTags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded-md text-3xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/5 truncate max-w-[110px]"
            >
              #{tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-3xs font-mono font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 tabular-nums">
              +{extraTags}
            </span>
          )}
        </div>
      )}

      {hasMetaRow && (
        <div className="flex items-center justify-between gap-2 w-full pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.priority && task.priority !== 'none' && (
              <PriorityBadge priority={task.priority} compact />
            )}
            {task.deadline && (
              <div
                className={`flex items-center gap-1 text-3xs font-semibold font-mono tabular-nums px-1.5 py-0.5 rounded-md ${deadlineClasses}`}
              >
                <Clock size={10} className="shrink-0 opacity-80" />
                <span>{task.deadline}</span>
              </div>
            )}
          </div>

          {(checklist.total > 0 || hasProseDescription || linkCount > 0) && (
            <div className="flex items-center gap-2 text-3xs font-mono text-slate-400 dark:text-slate-500 shrink-0 ml-auto tabular-nums">
              {checklist.total > 0 && (
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    checklistComplete ? 'text-emerald-600 dark:text-emerald-400' : ''
                  }`}
                >
                  <CheckSquare size={11} />
                  <span>
                    {checklist.done}/{checklist.total}
                  </span>
                </span>
              )}
              {hasProseDescription && (
                <AlignLeft size={11} className="opacity-80" aria-hidden="true" />
              )}
              {linkCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <Link2 size={11} />
                  <span>{linkCount}</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  return (
    <TaskCardVisual
      task={task}
      dragRef={setNodeRef}
      style={style}
      dragProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
      onClick={(e) => {
        if (transform && (Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3)) {
          return;
        }
        onClick(e);
      }}
    />
  );
};
