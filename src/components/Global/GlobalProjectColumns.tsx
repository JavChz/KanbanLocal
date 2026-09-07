import React from 'react';
import { useTranslation } from 'react-i18next';
import { Circle, ExternalLink } from 'lucide-react';
import type { Task, Project } from '../../types/kanban';
import { getColorStyles } from '../../utils/colors';
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
    <div className="flex gap-6 items-start overflow-x-auto pb-4 max-w-full -mx-4 px-4 sm:mx-0 sm:px-0">
      {projects.map((project) => {
        const projectTasks = filteredTasks.filter((t) => t.projectId === project.id);
        const colorStyles = getColorStyles(project.color);

        return (
          <div
            key={project.id}
            className="w-[300px] shrink-0 flex flex-col rounded-2xl glass-panel p-4 border border-slate-200/50 dark:border-slate-800/30"
          >
            {/* Project Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200/50 dark:border-slate-800/30 select-none">
              <div className="flex items-center gap-2 min-w-0">
                <Circle size={8} className={`fill-current ${colorStyles.text} shrink-0`} />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide truncate pr-1" title={project.name}>
                  {project.name}
                </h4>
                <span className="text-2xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                  {projectTasks.length}
                </span>
              </div>
              <button
                onClick={() => onOpenProject(project.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-650 dark:hover:text-blue-450 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer inline-flex items-center justify-center"
                title={t('open_project')}
              >
                <ExternalLink size={14} />
              </button>
            </div>

            {/* Project Tasks */}
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[520px] min-h-[120px] pr-0.5">
              {projectTasks.length === 0 ? (
                <div className="py-10 text-center text-slate-400 dark:text-slate-550 text-xs italic">
                  {t('no_tasks_search')}
                </div>
              ) : (
                projectTasks.map((task) => {
                  const projectColorVar = `var(--color-${project.color})`;
                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="group glass-card p-4 rounded-xl cursor-pointer border border-slate-200/40 dark:border-slate-800/20 hover:border-[var(--project-color)]/40 hover:shadow-xs transition-all duration-200 text-left flex flex-col gap-2 relative"
                      style={{ '--project-color': projectColorVar } as React.CSSProperties}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-slate-850 dark:text-slate-100 break-words line-clamp-2 flex-1 group-hover:text-[var(--project-color)] transition-colors">
                          {task.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInProject(task.projectId, task.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[var(--project-color)] transition-all duration-150 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer shrink-0 inline-flex items-center justify-center"
                          title={t('open_in_project')}
                        >
                          <ExternalLink size={11} />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {task.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-100/50 dark:border-slate-800/10">
                        <StatusBadge status={task.status} archived={task.archived} size="sm" />
                        {task.deadline && (
                          <span className="text-[9px] font-bold font-mono text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/60 px-1.5 py-0.5 rounded">
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
