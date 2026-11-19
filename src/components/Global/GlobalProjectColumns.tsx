import React from 'react';
import { useTranslation } from 'react-i18next';
import { Circle, ExternalLink } from 'lucide-react';
import type { Task, Project } from '../../types/kanban';
import { getColorStyles, resolveProjectColorVar } from '../../utils/colors';
import { stripMarkdown } from '../../utils/markdown';
import { StatusBadge } from '../ui/StatusBadge';

interface GlobalProjectColumnsProps {
  projects: Project[];
  filteredTasks: Task[];
  onTaskClick: (task: Task) => void;
  onOpenProject: (projectId: string) => void;
  onOpenInProject: (projectId: string, taskId: string) => void;
}

export const GlobalProjectColumns: React.FC<GlobalProjectColumnsProps> = ({
  projects,
  filteredTasks,
  onTaskClick,
  onOpenProject,
  onOpenInProject,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-5 items-start overflow-x-auto pb-4 max-w-full -mx-4 px-4 sm:mx-0 sm:px-0">
      {projects.map((project) => {
        const projectTasks = filteredTasks.filter((t) => t.projectId === project.id);
        const colorStyles = getColorStyles(project.color);
        const projectColorVar = resolveProjectColorVar(project.color);

        return (
          <div
            key={project.id}
            className="w-[300px] shrink-0 flex flex-col rounded-2xl glass-panel p-3.5"
          >
            {/* Project Header */}
            <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-200/70 dark:border-white/8 select-none">
              <div className="flex items-center gap-2 min-w-0">
                <Circle size={8} className={`fill-current ${colorStyles.text} shrink-0`} />
                <h4
                  className="text-xs font-semibold text-slate-800 dark:text-slate-100 tracking-wide truncate pr-1"
                  title={project.name}
                >
                  {project.name}
                </h4>
                <span className="text-2xs font-semibold font-mono tabular-nums px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 shrink-0">
                  {projectTasks.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenProject(project.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/50 transition-colors cursor-pointer inline-flex items-center justify-center"
                title={t('open_project')}
                aria-label={t('open_project')}
              >
                <ExternalLink size={14} />
              </button>
            </div>

            {/* Project Tasks */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[520px] min-h-[120px] pr-0.5">
              {projectTasks.length === 0 ? (
                <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                  {t('no_tasks_search')}
                </div>
              ) : (
                projectTasks.map((task) => {
                  const cleanPreview = stripMarkdown(task.description);
                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="group glass-card p-3.5 rounded-xl cursor-pointer text-left flex flex-col gap-2 relative"
                      style={
                        projectColorVar
                          ? ({ '--project-color': projectColorVar } as React.CSSProperties)
                          : undefined
                      }
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[13px] font-medium text-slate-800 dark:text-slate-100 break-words line-clamp-2 flex-1 group-hover:text-[var(--project-color,var(--color-blue-600))] transition-colors">
                          {task.title}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInProject(task.projectId, task.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-75 text-slate-400 hover:text-[var(--project-color,var(--color-blue-600))] transition-opacity duration-150 p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer shrink-0 inline-flex items-center justify-center"
                          title={t('open_in_project')}
                          aria-label={t('open_in_project')}
                        >
                          <ExternalLink size={11} />
                        </button>
                      </div>

                      {cleanPreview && (
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                          {cleanPreview}
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 dark:border-white/6">
                        <StatusBadge status={task.status} archived={task.archived} size="sm" />
                        {task.deadline && (
                          <span className="text-3xs font-semibold font-mono tabular-nums text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                            {task.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
