import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKanbanStore } from '../store/useKanbanStore';
import type { Task } from '../types/kanban';
import { TaskModal } from '../components/Board/TaskModal';
import { Select } from '../components/ui/Select';
import { getColorStyles } from '../utils/colors';
import { Search, Circle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const GlobalView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tasks, projects } = useKanbanStore();

  const [viewMode, setViewMode] = useState<'list' | 'projects'>(() => {
    const saved = localStorage.getItem('global_view_mode');
    return (saved === 'projects' || saved === 'list') ? saved : 'list';
  });

  const handleSetViewMode = (mode: 'list' | 'projects') => {
    setViewMode(mode);
    localStorage.setItem('global_view_mode', mode);
  };

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
    { value: 'ARCHIVED', label: t('archived') },
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

    const matchesStatus =
      statusFilter === 'ARCHIVED'
        ? task.archived === true
        : task.archived !== true && (statusFilter === 'ALL' || task.status === statusFilter);

    const matchesProject = projectFilter === 'ALL' || task.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleRowClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const getStatusBadgeClass = (status: string, archived?: boolean) => {
    if (archived) {
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-500/25 dark:border-purple-900/20';
    }
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

  const getStatusLabel = (status: string, archived?: boolean) => {
    if (archived) {
      return t('archived');
    }
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

      {/* View Switcher and Results */}
      <div className="flex flex-col gap-4">
        {/* View Mode Toggle */}
        <div className="flex justify-end">
          <div className="flex items-center bg-slate-100/60 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/40 shadow-xs">
            <button
              onClick={() => handleSetViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-blue-650 dark:text-blue-450 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('list_view')}
            </button>
            <button
              onClick={() => handleSetViewMode('projects')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 ${
                viewMode === 'projects'
                  ? 'bg-white dark:bg-slate-800 text-blue-650 dark:text-blue-450 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('projects_view')}
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          /* Results Listing - List View */
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
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold uppercase border ${getStatusBadgeClass(task.status, task.archived)}`}>
                              {getStatusLabel(task.status, task.archived)}
                            </span>
                          </td>
                          {/* Navigate to Project Task Link */}
                          <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/project/${task.projectId}?task=${task.id}`);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/40 cursor-pointer inline-flex items-center justify-center"
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
        ) : (
          /* Results Listing - Projects Column View */
          <div className="flex gap-6 items-start overflow-x-auto pb-4 max-w-full -mx-4 px-4 sm:mx-0 sm:px-0">
            {(projectFilter === 'ALL' ? projects : projects.filter((p) => p.id === projectFilter)).map((project) => {
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
                      onClick={() => navigate(`/project/${project.id}`)}
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
                      projectTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleRowClick(task)}
                          className="group glass-card p-4 rounded-xl cursor-pointer border border-slate-200/40 dark:border-slate-800/20 hover:border-blue-500/40 dark:hover:border-blue-400/40 hover:shadow-xs transition-all duration-200 text-left flex flex-col gap-2 relative"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-semibold text-slate-850 dark:text-slate-100 break-words line-clamp-2 flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {task.title}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/project/${task.projectId}?task=${task.id}`);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer shrink-0 inline-flex items-center justify-center"
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
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(task.status, task.archived)}`}>
                              {getStatusLabel(task.status, task.archived)}
                            </span>
                            {task.deadline && (
                              <span className="text-[9px] font-bold font-mono text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/60 px-1.5 py-0.5 rounded">
                                {task.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
