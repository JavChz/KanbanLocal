import React from 'react';
import { useTranslation } from 'react-i18next';
import { Circle, ExternalLink } from 'lucide-react';
import type { Task, Project } from '../../types/kanban';
import { getColorStyles } from '../../utils/colors';
import { StatusBadge } from '../ui/StatusBadge';

interface GlobalTaskTableProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onOpenInProject: (projectId: string, taskId: string) => void;
}

export const GlobalTaskTable: React.FC<GlobalTaskTableProps> = ({
  tasks,
  projects,
  onTaskClick,
  onOpenInProject,
}) => {
  const { t } = useTranslation();

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/30">
      <div className="overflow-x-auto">
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 italic">
            {t('no_tasks_search')}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-200/40 dark:bg-slate-900/30 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800">
                <th className="px-5 py-3.5 text-left w-1/2">{t('task_title')}</th>
                <th className="px-5 py-3.5 text-left">{t('project')}</th>
                <th className="px-5 py-3.5 text-left">{t('status')}</th>
                <th className="px-5 py-3.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/20">
              {tasks.map((task) => {
                const proj = projects.find((p) => p.id === task.projectId);
                const colorStyles = proj ? getColorStyles(proj.color) : { text: 'text-slate-400', bg: 'bg-slate-400' };
                const projectColorVar = proj ? `var(--color-${proj.color})` : undefined;

                return (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="group hover:bg-slate-200/30 dark:hover:bg-slate-900/10 cursor-pointer transition-colors duration-150"
                    style={projectColorVar ? { '--project-color': projectColorVar } as React.CSSProperties : undefined}
                  >
                    {/* Title & Desc */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-[var(--project-color)] transition-colors">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-slate-650 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-lg">
                          {task.description}
                        </div>
                      )}
                    </td>
                    {/* Project Tag */}
                    <td className="px-5 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {proj ? (
                        <div className="flex items-center gap-1.5">
                          <Circle size={6} className={`fill-current ${colorStyles.text}`} />
                          <span className="truncate max-w-[120px]">{proj.name}</span>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">{t('none')}</span>
                      )}
                    </td>
                    {/* Status Tag */}
                    <td className="px-5 py-4">
                      <StatusBadge status={task.status} archived={task.archived} />
                    </td>
                    {/* Navigate to Project Task Link */}
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInProject(task.projectId, task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[var(--project-color)] transition-all duration-150 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/40 cursor-pointer inline-flex items-center justify-center"
                        title={t('open_in_project')}
                      >
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
