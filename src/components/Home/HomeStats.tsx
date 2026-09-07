import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListTodo, Clock, CheckCircle } from 'lucide-react';
import type { Task } from '../../types/kanban';

interface HomeStatsProps {
  tasks: Task[];
}

export const HomeStats: React.FC<HomeStatsProps> = ({ tasks }) => {
  const { t } = useTranslation();

  const activeTasks = tasks.filter((t) => !t.archived);
  const totalTasks = activeTasks.length;
  const backlogTasks = activeTasks.filter((t) => t.status === 'TODO').length;
  const inProgressTasks = activeTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedTasks = activeTasks.filter((t) => t.status === 'DONE').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Stat item 1: Backlog */}
      <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left transition-all hover:shadow-md duration-300">
        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
          <ListTodo size={20} />
        </div>
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wider">
            {t('backlog') || 'Backlog'}
          </span>
          <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
            {backlogTasks}
          </span>
        </div>
      </div>

      {/* Stat item 2: In Progress */}
      <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left transition-all hover:shadow-md duration-300">
        <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          <Clock size={20} />
        </div>
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wider">
            {t('in_progress')}
          </span>
          <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
            {inProgressTasks}
          </span>
        </div>
      </div>

      {/* Stat item 3: Completed tasks with circular progress ring */}
      <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left justify-between transition-all hover:shadow-md duration-300">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wider">
              {t('completed') || 'Completed'}
            </span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {completedTasks} <span className="text-2xs text-slate-500">/ {totalTasks}</span>
            </span>
          </div>
        </div>

        {/* Centered Circular Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="19"
              className="stroke-slate-100 dark:stroke-slate-855"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              cx="24"
              cy="24"
              r="19"
              className="stroke-green-600 dark:stroke-green-500 transition-all duration-500"
              strokeWidth="3.5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 19}
              strokeDashoffset={2 * Math.PI * 19 * (1 - (totalTasks > 0 ? completedTasks / totalTasks : 0))}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[10px] font-extrabold font-mono text-slate-800 dark:text-slate-100">
            {completionRate}%
          </span>
        </div>
      </div>
    </div>
  );
};
