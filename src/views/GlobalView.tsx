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
    return saved === 'projects' || saved === 'list' ? saved : 'list';
  });

  const handleSetViewMode = (mode: 'list' | 'projects') => {
    setViewMode(mode);
    localStorage.setItem('global_view_mode', mode);
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null;

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
    setSelectedTaskId(task.id);
    setIsTaskModalOpen(true);
  };

  const handleOpenInProject = (projectId: string, taskId: string) => {
    navigate(`/project/${projectId}?task=${taskId}`);
  };

  const displayedProjects =
    projectFilter === 'ALL' ? projects : projects.filter((p) => p.id === projectFilter);

  const handleClearFilters = () => {
    setSearch('');
    setProjectFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="flex flex-col gap-5 h-full animate-fade-in text-left">
      {/* Compact Workspace Header with Docked View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {t('global_view')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('global_view_desc')}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center self-start sm:self-center bg-slate-200/70 dark:bg-slate-900/70 p-1 rounded-xl border border-slate-200/80 dark:border-white/8 shrink-0">
          <button
            type="button"
            onClick={() => handleSetViewMode('list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t('list_view')}
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode('projects')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
              viewMode === 'projects'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t('projects_view')}
          </button>
        </div>
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
        onClearFilters={handleClearFilters}
      />

      {/* Results */}
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

      {/* Task Details Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
};
