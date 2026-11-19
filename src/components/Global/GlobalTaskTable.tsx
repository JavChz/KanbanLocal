import React from 'react';
import { useTranslation } from 'react-i18next';
import { Circle, ExternalLink } from 'lucide-react';
import type { Task, Project } from '../../types/kanban';
import { getColorStyles, resolveProjectColorVar } from '../../utils/colors';
import { stripMarkdown } from '../../utils/markdown';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';

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
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('no_tasks_search')}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-900/50 text-2xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-white/8">
                <th className="px-5 py-3 text-left w-2/5">{t('task_title')}</th>
                <th className="px-5 py-3 text-left">{t('project')}</th>
                <th className="px-5 py-3 text-left">{t('priority', 'Priority')}</th>
                <th className="px-5 py-3 text-left">{t('status')}</th>
                <th className="px-5 py-3 text-right w-14"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/6">
              {tasks.map((task) => {
                const proj = projects.find((p) => p.id === task.projectId);
                const colorStyles = proj
                  ? getColorStyles(proj.color)
                  : { text: 'text-slate-400', bg: 'bg-slate-400' };
                const projectColorVar = resolveProjectColorVar(proj?.color);
                const cleanPreview = stripMarkdown(task.description);

                return (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="group hover:bg-slate-900/[0.025] dark:hover:bg-white/[0.03] cursor-pointer transition-colors duration-150"
                    style={
                      projectColorVar
                        ? ({ '--project-color': projectColorVar } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100 text-sm group-hover:text-[var(--project-color,var(--color-blue-600))] transition-colors">
                        {task.title}
                      </div>
                      {cleanPreview && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-lg">
                          {cleanPreview}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {proj ? (
                        <div className="flex items-center gap-1.5">
                          <Circle size={6} className={`fill-current ${colorStyles.text} shrink-0`} />
                          <span className="truncate max-w-[140px]">{proj.name}</span>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">{t('none')}</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {task.priority && task.priority !== 'none' ? (
                        <PriorityBadge priority={task.priority} />
                      ) : (
                        <span className="text-2xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={task.status} archived={task.archived} />
                    </td>

                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInProject(task.projectId, task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-75 text-slate-400 hover:text-[var(--project-color,var(--color-blue-600))] transition-opacity duration-150 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer inline-flex items-center justify-center"
                        title={t('open_in_project')}
                        aria-label={t('open_in_project')}
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
