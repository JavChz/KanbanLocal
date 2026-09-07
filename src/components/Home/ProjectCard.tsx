import React from 'react';
import { useTranslation } from 'react-i18next';
import { Circle, Clock, GripVertical } from 'lucide-react';
import type { Project, Task } from '../../types/kanban';
import type { ProjectStatus } from '../../utils/projectUtils';
import { getColorStyles } from '../../utils/colors';
import { BACKGROUND_IMAGES } from '../../utils/backgrounds';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface ProjectCardContentProps {
  project: Project;
  tasks: Task[];
  status: ProjectStatus;
  relativeTime: string;
  isOverlay?: boolean;
}

export const ProjectCardContent: React.FC<ProjectCardContentProps> = ({
  project,
  tasks,
  status,
  relativeTime,
}) => {
  const { t } = useTranslation();
  const colorStyles = getColorStyles(project.color);
  const projTasks = tasks.filter((t) => t.projectId === project.id && !t.archived);
  const doneCount = projTasks.filter((t) => t.status === 'DONE').length;
  const projCompletionRate = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;
  const bgConfig = project.background;
  const isBgImage = bgConfig && (bgConfig.type === 'image' || bgConfig.type === 'custom');
  const imgUrl = bgConfig?.type === 'image'
    ? BACKGROUND_IMAGES[bgConfig.value]
    : bgConfig?.type === 'custom'
    ? bgConfig.value
    : null;

  let statusBadgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
  let statusText = t('active_status');
  let progressBarColor = colorStyles.bg;

  if (status === 'LATE') {
    statusBadgeClass = 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
    statusText = t('late');
    progressBarColor = 'bg-red-500 dark:bg-red-500';
  } else if (status === 'ON_TRACK') {
    statusBadgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
    statusText = t('on_track');
    progressBarColor = 'bg-emerald-500 dark:bg-emerald-400';
  }

  return (
    <>
      {isBgImage && imgUrl && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${imgUrl})`,
              opacity: 0.35,
            }}
          />
          <div className="absolute inset-0 bg-white/55 dark:bg-slate-900/70 backdrop-blur-[1px]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between h-full w-full">
        <div>
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Circle size={8} className={`fill-current ${colorStyles.text} shrink-0`} />
              <div className="min-w-0">
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 truncate pr-1" title={project.name}>
                  {project.name}
                </h4>
                {project.customId && project.customId.trim() && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider font-mono truncate leading-none mt-0.5">
                    ID: {project.customId}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${statusBadgeClass}`}>
                {statusText}
              </span>
              <span
                className="text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity p-0.5"
                title={t('drag_to_reorder')}
              >
                <GripVertical size={14} />
              </span>
            </div>
          </div>

          {project.description ? (
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-355 mt-2 line-clamp-1">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-2 italic">
              {t('none')}
            </p>
          )}

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5">
            <span>{projTasks.length} {t('tasks') || 'Tasks'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>{projCompletionRate}% {t('progress')}</span>
            <span>{doneCount} / {projTasks.length} Done</span>
          </div>

          <div className="w-full h-1.5 bg-slate-200/50 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
              style={{ width: `${projCompletionRate}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-medium text-slate-500 dark:text-slate-405 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock size={11} className="shrink-0" />
              {relativeTime}
            </span>
            {project.deadline && (
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 px-1.5 py-0.5 rounded text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                {project.deadline}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export interface SortableProjectCardProps {
  project: Project;
  tasks: Task[];
  status: ProjectStatus;
  relativeTime: string;
  onOpen: () => void;
}

export const SortableProjectCard: React.FC<SortableProjectCardProps> = ({
  project,
  tasks,
  status,
  relativeTime,
  onOpen,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const colorStyles = getColorStyles(project.color);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (transform && (Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3)) {
          e.preventDefault();
          return;
        }
        onOpen();
      }}
      className={`h-48 glass-card p-5 rounded-2xl cursor-grab active:cursor-grabbing flex flex-col justify-between text-left border-l-4 ${
        colorStyles.border
      } hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group select-none ${
        isDragging ? 'shadow-md ring-1 ring-blue-500/30' : ''
      }`}
    >
      <ProjectCardContent
        project={project}
        tasks={tasks}
        status={status}
        relativeTime={relativeTime}
      />
    </div>
  );
};
