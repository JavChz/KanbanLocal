import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, GripVertical } from 'lucide-react';
import type { Project, Task } from '../../types/kanban';
import type { ProjectStatus } from '../../utils/projectUtils';
import { resolveProjectColorVar } from '../../utils/colors';
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
  const accentColorVar = resolveProjectColorVar(project.color) || 'var(--color-blue-500)';
  const projTasks = tasks.filter((t) => t.projectId === project.id && !t.archived);
  const doneCount = projTasks.filter((t) => t.status === 'DONE').length;
  const inProgressCount = projTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const totalCount = projTasks.length;
  const donePct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const inProgressPct = totalCount > 0 ? Math.round((inProgressCount / totalCount) * 100) : 0;

  const bgConfig = project.background;
  const isBgImage = bgConfig && (bgConfig.type === 'image' || bgConfig.type === 'custom');
  const imgUrl =
    bgConfig?.type === 'image'
      ? BACKGROUND_IMAGES[bgConfig.value]
      : bgConfig?.type === 'custom'
      ? bgConfig.value
      : null;

  let statusBadgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300';
  let statusText = t('active_status');

  if (status === 'LATE') {
    statusBadgeClass = 'bg-rose-500/12 text-rose-700 dark:text-rose-300';
    statusText = t('late');
  } else if (status === 'ON_TRACK') {
    statusBadgeClass = 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';
    statusText = t('on_track');
  }

  return (
    <>
      {/* 2px top accent hairline */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] z-20"
        style={{ backgroundColor: accentColorVar }}
        aria-hidden="true"
      />

      {isBgImage && imgUrl && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${imgUrl})`,
              opacity: 0.28,
            }}
          />
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/75" />
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between h-full w-full gap-3">
        <div>
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: accentColorVar }}
              />
              <div className="min-w-0">
                <h4
                  className="font-semibold text-[15px] text-slate-900 dark:text-slate-100 truncate pr-1"
                  title={project.name}
                >
                  {project.name}
                </h4>
                {project.customId && project.customId.trim() && (
                  <p className="text-3xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider font-mono truncate leading-none mt-0.5">
                    {project.customId}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span
                className={`px-1.5 py-0.5 rounded-md text-3xs font-semibold uppercase tracking-wider ${statusBadgeClass}`}
              >
                {statusText}
              </span>
              <span
                className="text-slate-400 dark:text-slate-500 opacity-30 group-hover:opacity-90 transition-opacity p-0.5"
                title={t('drag_to_reorder')}
              >
                <GripVertical size={13} />
              </span>
            </div>
          </div>

          {project.description && project.description.trim() && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2.5 border-t border-slate-200/70 dark:border-white/8">
          <div className="flex justify-between items-center text-2xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
            <span>
              {totalCount} {t('tasks') || 'Tasks'}
            </span>
            <span className="font-mono">
              {doneCount}/{totalCount} · {donePct}%
            </span>
          </div>

          {/* Segmented 3-state micro progress bar */}
          <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {donePct > 0 && (
              <div
                className="h-full bg-emerald-500 transition-[width] duration-300"
                style={{ width: `${donePct}%` }}
              />
            )}
            {inProgressPct > 0 && (
              <div
                className="h-full bg-amber-500 transition-[width] duration-300"
                style={{ width: `${inProgressPct}%` }}
              />
            )}
          </div>

          <div className="flex justify-between items-center text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock size={11} className="shrink-0 opacity-75" />
              {relativeTime}
            </span>
            {project.deadline && (
              <span className="bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-3xs text-slate-600 dark:text-slate-300 font-mono font-semibold tabular-nums">
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

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
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
      className={`min-h-[168px] glass-card p-4.5 rounded-xl cursor-grab active:cursor-grabbing flex flex-col justify-between text-left relative overflow-hidden group select-none ${
        isDragging ? 'shadow-md ring-1 ring-blue-500/35' : ''
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
