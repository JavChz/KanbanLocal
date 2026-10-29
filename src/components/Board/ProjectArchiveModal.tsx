import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';
import {
  ArchiveRestore,
  Trash2,
  Search,
  X,
  ArrowUpDown,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Calendar,
  Clock,
  Tag as TagIcon,
  ExternalLink,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { useKanbanStore } from '../../store/useKanbanStore';
import { toast } from '../../store/useToastStore';
import type { Task, TaskStatus, TaskPriority } from '../../types/kanban';

interface ProjectArchiveModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
}

type SortField = 'archivedAt' | 'createdAt' | 'priority' | 'title';
type SortDirection = 'desc' | 'asc';

const PRIORITY_WEIGHTS: Record<TaskPriority | 'none', number> = {
  urgent_important: 4,
  not_urgent_important: 3,
  urgent_not_important: 2,
  not_urgent_not_important: 1,
  none: 0,
};

export const ProjectArchiveModal: React.FC<ProjectArchiveModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onSelectTask,
}) => {
  const { t, i18n } = useTranslation();
  const { tasks, projects, updateTask, deleteTask } = useKanbanStore();

  const project = projects.find((p) => p.id === projectId);
  const projectColorVar = project ? `var(--color-${project.color})` : undefined;

  // Filter & Sort States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [sortBy, setSortBy] = useState<SortField>('archivedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Confirmation Modals
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);

  // All archived tasks for this project
  const allArchivedTasks = useMemo(() => {
    return tasks.filter((task) => task.projectId === projectId && task.archived);
  }, [tasks, projectId]);

  // Breakdown counts by status
  const statusCounts = useMemo(() => {
    return {
      all: allArchivedTasks.length,
      TODO: allArchivedTasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: allArchivedTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      DONE: allArchivedTasks.filter((t) => t.status === 'DONE').length,
    };
  }, [allArchivedTasks]);

  // Filtered & Sorted Tasks
  const displayedTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = allArchivedTasks.filter((task) => {
      // Status filter
      if (statusFilter !== 'ALL' && task.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (query) {
        const titleMatch = task.title.toLowerCase().includes(query);
        const descMatch = (task.description || '').toLowerCase().includes(query);
        const tagMatch = task.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!titleMatch && !descMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'archivedAt') {
        const timeA = a.archivedAt ?? a.createdAt ?? 0;
        const timeB = b.archivedAt ?? b.createdAt ?? 0;
        comparison = timeA - timeB;
      } else if (sortBy === 'createdAt') {
        const timeA = a.createdAt ?? 0;
        const timeB = b.createdAt ?? 0;
        comparison = timeA - timeB;
      } else if (sortBy === 'priority') {
        const weightA = PRIORITY_WEIGHTS[a.priority || 'none'] ?? 0;
        const weightB = PRIORITY_WEIGHTS[b.priority || 'none'] ?? 0;
        comparison = weightA - weightB;
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [allArchivedTasks, search, statusFilter, sortBy, sortDirection]);

  // Date Formatter
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return t('date_unknown');
    try {
      return new Intl.DateTimeFormat(i18n.language || 'en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  // Handlers
  const handleConfirmSingleDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleRestoreTask = (taskId: string) => {
    updateTask(taskId, { archived: false });
  };

  const handleRestoreAllDisplayed = () => {
    if (displayedTasks.length === 0) return;
    displayedTasks.forEach((task) => {
      updateTask(task.id, { archived: false });
    });
    toast.success(
      t('tasks_moved_success', {
        count: displayedTasks.length,
        target: project?.name || t('project'),
      })
    );
  };

  const handleConfirmDeleteAll = () => {
    displayedTasks.forEach((task) => {
      deleteTask(task.id);
    });
    setIsDeleteAllConfirmOpen(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const isFiltering = search.trim().length > 0 || statusFilter !== 'ALL';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('archive_title')}
        size="xl"
        style={projectColorVar ? ({ '--project-color': projectColorVar } as React.CSSProperties) : undefined}
      >
        <div className="flex flex-col gap-4 text-left">
          {/* Header Stats & Bulk Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-100/60 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Archive size={14} className="text-blue-550 dark:text-blue-400" />
                <span>
                  {t('total_archived')}: <strong className="text-slate-900 dark:text-slate-100 font-bold">{allArchivedTasks.length}</strong>
                </span>
              </div>
              {isFiltering && (
                <span className="text-2xs text-slate-500 dark:text-slate-400">
                  ({displayedTasks.length} {t('active')})
                </span>
              )}
            </div>

            {allArchivedTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRestoreAllDisplayed}
                  disabled={displayedTasks.length === 0}
                  className="flex items-center gap-1.5 hover:text-green-600 dark:hover:text-green-400"
                  title={t('restore_all')}
                >
                  <RotateCcw size={13} />
                  <span>{t('restore_all')}</span>
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteAllConfirmOpen(true)}
                  disabled={displayedTasks.length === 0}
                  className="flex items-center gap-1.5"
                  title={t('delete_all_archived')}
                >
                  <Trash2 size={13} />
                  <span>{t('delete_all_archived')}</span>
                </Button>
              </div>
            )}
          </div>

          {allArchivedTasks.length > 0 && (
            <>
              {/* Toolbar: Search, Last Status Filter, Sort controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className="glass-input w-full pl-9 pr-8 py-2 rounded-lg text-xs"
                  />
                  <Search
                    size={14}
                    className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={t('cancel')}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Status Segmented Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-900/60 p-1 rounded-xl shrink-0 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t('all_statuses')} ({statusCounts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('TODO')}
                    className={`px-2 py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'TODO'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t('todo')} ({statusCounts.TODO})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('IN_PROGRESS')}
                    className={`px-2 py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'IN_PROGRESS'
                        ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t('in_progress')} ({statusCounts.IN_PROGRESS})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('DONE')}
                    className={`px-2 py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'DONE'
                        ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t('done')} ({statusCounts.DONE})
                  </button>
                </div>

                {/* Sort Selector & Toggle */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/40 rounded-lg px-2 py-1">
                    <ArrowUpDown size={12} className="text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortField)}
                      className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                      title={t('sort_by')}
                    >
                      <option value="archivedAt" className="bg-white dark:bg-slate-900">
                        {t('sort_archived_date')}
                      </option>
                      <option value="createdAt" className="bg-white dark:bg-slate-900">
                        {t('sort_created_date')}
                      </option>
                      <option value="priority" className="bg-white dark:bg-slate-900">
                        {t('sort_priority')}
                      </option>
                      <option value="title" className="bg-white dark:bg-slate-900">
                        {t('sort_title')}
                      </option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={toggleSortDirection}
                    className="p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/40 bg-slate-100/80 dark:bg-slate-900/60 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title={sortDirection === 'desc' ? t('sort_desc') : t('sort_asc')}
                  >
                    {sortDirection === 'desc' ? (
                      <ArrowDownNarrowWide size={15} />
                    ) : (
                      <ArrowUpNarrowWide size={15} />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Archived Tasks List */}
          <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
            {allArchivedTasks.length === 0 ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400 italic flex flex-col items-center gap-2">
                <Archive size={32} className="text-slate-300 dark:text-slate-700" />
                <span>{t('no_archived_tasks')}</span>
              </div>
            ) : displayedTasks.length === 0 ? (
              <div className="py-14 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-3">
                <Search size={28} className="text-slate-300 dark:text-slate-700" />
                <span className="text-sm font-medium">{t('no_archived_tasks_match')}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  {t('clear_filters')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {displayedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/50 bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100/70 dark:hover:bg-slate-850/50 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                  >
                    {/* Left details click area */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer text-left"
                      onClick={() => onSelectTask(task)}
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-md">
                          {task.title}
                        </span>

                        {/* Last Status Badge (shows which column it came from) */}
                        <div className="flex items-center gap-1" title={`${t('last_status')}: ${task.status}`}>
                          <StatusBadge status={task.status} size="sm" />
                        </div>

                        {/* Priority Badge */}
                        {task.priority && task.priority !== 'none' && (
                          <PriorityBadge priority={task.priority} compact />
                        )}
                      </div>

                      {/* Description snippet */}
                      {task.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-1.5">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata Line: Tags, Deadline, Links, Timestamps */}
                      <div className="flex items-center gap-3 flex-wrap text-2xs text-slate-450 dark:text-slate-400">
                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <TagIcon size={10} className="shrink-0 text-slate-400" />
                            <div className="flex items-center gap-1 flex-wrap">
                              {task.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Deadline */}
                        {task.deadline && (
                          <div className="flex items-center gap-1 font-mono">
                            <Clock size={10} className="text-slate-400" />
                            <span>{task.deadline}</span>
                          </div>
                        )}

                        {/* Links Count */}
                        {task.links && task.links.length > 0 && (
                          <div className="flex items-center gap-1">
                            <ExternalLink size={10} className="text-slate-400" />
                            <span>{task.links.length} {t('links')}</span>
                          </div>
                        )}

                        {/* Archived Date */}
                        <div
                          className="flex items-center gap-1 text-slate-500 dark:text-slate-400"
                          title={`${t('archived_date_label')}: ${formatDate(task.archivedAt)}`}
                        >
                          <Archive size={11} className="text-slate-400 shrink-0" />
                          <span>
                            {t('archived_date_label')}: {formatDate(task.archivedAt || task.createdAt)}
                          </span>
                        </div>

                        {/* Created Date */}
                        {task.createdAt && (
                          <div
                            className="flex items-center gap-1 text-slate-400 dark:text-slate-500 hidden md:flex"
                            title={`${t('created_date_label')}: ${formatDate(task.createdAt)}`}
                          >
                            <Calendar size={11} className="text-slate-400 shrink-0" />
                            <span>
                              {t('created_date_label')}: {formatDate(task.createdAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRestoreTask(task.id)}
                        className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400"
                        title={t('unarchive')}
                      >
                        <ArchiveRestore size={13} />
                        <span className="text-2xs font-semibold">{t('unarchive')}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setTaskToDelete(task.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="flex items-center gap-1"
                        title={t('delete')}
                      >
                        <Trash2 size={13} />
                        <span className="text-2xs font-semibold">{t('delete')}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Single Task Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmSingleDelete}
        title={t('delete')}
        message={t('confirm_delete_task')}
        confirmText={t('delete')}
      />

      {/* Delete All Tasks Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteAllConfirmOpen}
        onClose={() => setIsDeleteAllConfirmOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title={t('delete_all_archived')}
        message={t('confirm_delete_all_archived', { count: displayedTasks.length })}
        confirmText={t('delete')}
      />
    </>
  );
};
