import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKanbanStore } from '../store/useKanbanStore';
import type { Task } from '../types/kanban';
import { TaskModal } from '../components/Board/TaskModal';
import { GlobalFilterToolbar } from '../components/Global/GlobalFilterToolbar';
import { GlobalTaskTable } from '../components/Global/GlobalTaskTable';
import { GlobalProjectColumns } from '../components/Global/GlobalProjectColumns';
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenInProject = (projectId: string, taskId: string) => {
    navigate(`/project/${projectId}?task=${taskId}`);
  };

  const displayedProjects = projectFilter === 'ALL'
    ? projects
    : projects.filter((p) => p.id === projectFilter);

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
      <GlobalFilterToolbar
        search={search}
        onSearchChange={setSearch}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        projects={projects}
      />

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
          <GlobalTaskTable
            tasks={filteredTasks}
            projects={projects}
            onTaskClick={handleTaskClick}
            onOpenInProject={handleOpenInProject}
          />
        ) : (
          <GlobalProjectColumns
            projects={displayedProjects}
            filteredTasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onOpenProject={(projId) => navigate(`/project/${projId}`)}
            onOpenInProject={handleOpenInProject}
          />
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
