import React, { useState } from 'react';
import { useKanbanStore } from '../store/useKanbanStore';
import type { Task } from '../types/kanban';
import { TaskModal } from '../components/Board/TaskModal';
import { Select } from '../components/ui/Select';
import { getColorStyles } from '../utils/colors';
import { Search, Circle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const GlobalView: React.FC = () => {
  const { t } = useTranslation();
  const { tasks, projects } = useKanbanStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Status options for Select dropdown
  const statusOptions = [
    { value: 'ALL', label: t('all_statuses') },
    { value: 'TODO', label: t('todo') },
    { value: 'IN_PROGRESS', label: t('in_progress') },
    { value: 'DONE', label: t('done') },
  ];

  // Project options for Select dropdown
  const projectOptions = [
    { value: 'ALL', label: t('all_projects') },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  // Filter tasks based on search, status, and project filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;

    const matchesProject = projectFilter === 'ALL' || task.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleRowClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/35';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/25 dark:border-amber-900/20';
      case 'DONE':
        return 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-500/25 dark:border-green-900/20';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TODO':
        return t('todo');
      case 'IN_PROGRESS':
        return t('in_progress');
      case 'DONE':
        return t('done');
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50 md:text-4xl">
          {t('global_view')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('global_view_desc')}
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4.5 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
        {/* Search input */}
        <div className="flex-1 w-full relative flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1">
            <Search size={12} />
            {t('search')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-sm"
            />
            <Search size={14} className="absolute left-3.5 top-3 text-slate-500 dark:text-slate-400" />
          </div>
        </div>

        {/* Project Selector */}
        <div className="w-full md:w-64">
          <Select
            label={t('project')}
            options={projectOptions}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          />
        </div>

        {/* Status Selector */}
        <div className="w-full md:w-52">
          <Select
            label={t('status')}
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Results Listing */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/30">
        <div className="overflow-x-auto">
          {filteredTasks.length === 0 ? (
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
                {filteredTasks.map((task) => {
                  const proj = projects.find((p) => p.id === task.projectId);
                  const colorStyles = proj ? getColorStyles(proj.color) : { text: 'text-slate-400', bg: 'bg-slate-400' };

                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleRowClick(task)}
                      className="group hover:bg-slate-200/30 dark:hover:bg-slate-900/10 cursor-pointer transition-colors duration-150"
                    >
                      {/* Title & Desc */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold uppercase border ${getStatusBadgeClass(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </td>
                      {/* Edit Arrow Icon */}
                      <td className="px-5 py-4 text-right">
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all duration-150 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
};
