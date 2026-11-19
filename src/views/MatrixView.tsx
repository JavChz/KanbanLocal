import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Star,
  Coffee,
  Plus,
  Search,
  Layers,
  Inbox,
  CheckCircle2,
  Calendar,
  ExternalLink,
  PanelBottomClose,
  PanelBottomOpen,
  X,
} from 'lucide-react';
import {
  DndContext,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, CollisionDetection } from '@dnd-kit/core';
import { useKanbanStore } from '../store/useKanbanStore';
import { toast } from '../store/useToastStore';
import type { Task, TaskPriority, TaskStatus } from '../types/kanban';
import { TaskModal } from '../components/Board/TaskModal';
import { ColumnTaskComposer } from '../components/Board/ColumnTaskComposer';
import { getColorStyles } from '../utils/colors';
import { getDeadlineState } from '../utils/markdown';
import { getFlagsFromPriority } from '../utils/priority';

interface MatrixTaskCardProps {
  task: Task;
  projectColor?: string;
  projectName?: string;
  onClick: (e: React.MouseEvent) => void;
  onOpenInProject?: (projectId: string, taskId: string) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}

const MatrixTaskCard: React.FC<MatrixTaskCardProps> = ({
  task,
  projectColor,
  projectName,
  onClick,
  onOpenInProject,
  isDragging = false,
  isOverlay = false,
}) => {
  const { t } = useTranslation();
  const colorStyles = projectColor
    ? getColorStyles(projectColor)
    : { text: 'text-slate-400', bg: 'bg-slate-400' };
  const deadlineState = getDeadlineState(task.deadline, task.status === 'DONE');
  const deadlineClasses =
    deadlineState === 'overdue'
      ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300'
      : deadlineState === 'today'
      ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400';

  return (
    <div
      onClick={onClick}
      className={`glass-card p-3 rounded-xl text-left flex flex-col justify-between gap-2 min-h-[64px] select-none group relative ${
        isOverlay
          ? 'shadow-2xl ring-1 ring-blue-500/40 rotate-[1deg] cursor-grabbing'
          : isDragging
          ? 'ring-1 ring-blue-500/40 cursor-grabbing'
          : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-medium text-slate-800 dark:text-slate-100 line-clamp-2 flex-1 leading-snug">
          {task.title}
        </span>
        {onOpenInProject && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInProject(task.projectId, task.id);
            }}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-75 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-opacity p-0.5 rounded cursor-pointer shrink-0"
            title={t('open_in_project', 'Open in project')}
            aria-label={t('open_in_project', 'Open in project')}
          >
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      {/* Meta indicators: Project, Deadline, Status */}
      {(projectName || task.deadline || task.status === 'DONE') && (
        <div className="flex items-center gap-1.5 flex-wrap text-2xs">
          {projectName && (
            <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md">
              <span className={`w-1.5 h-1.5 rounded-full ${colorStyles.bg}`} />
              <span className="truncate max-w-[110px]">{projectName}</span>
            </div>
          )}

          {task.deadline && (
            <div
              className={`flex items-center gap-1 font-mono font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${deadlineClasses}`}
            >
              <Calendar size={10} className="opacity-75" />
              <span>{task.deadline}</span>
            </div>
          )}

          {task.status === 'DONE' && (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              <CheckCircle2 size={10} />
              <span>{t('done')}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const DraggableMatrixCard: React.FC<MatrixTaskCardProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.task.id,
    data: { task: props.task },
  });

  const handleClick = (e: React.MouseEvent) => {
    if (transform && (Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3)) {
      return;
    }
    props.onClick(e);
  };

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none select-none"
    >
      <MatrixTaskCard {...props} isDragging={isDragging} onClick={handleClick} />
    </div>
  );
};

interface QuadrantTheme {
  dotClass: string;
  cardBg: string;
}

interface QuadrantContainerProps {
  id: TaskPriority;
  title: string;
  subtitle: string;
  tasks: Task[];
  theme: QuadrantTheme;
  projectsMap: Map<string, { name: string; color: string }>;
  isAddingHere: boolean;
  onStartAdd: (priority: TaskPriority) => void;
  onSaveNewTask: (priority: TaskPriority, title: string) => void;
  onCancelAdd: () => void;
  onTaskClick: (task: Task) => void;
  onOpenInProject: (projectId: string, taskId: string) => void;
}

const QuadrantContainer: React.FC<QuadrantContainerProps> = ({
  id,
  title,
  subtitle,
  tasks,
  theme,
  projectsMap,
  isAddingHere,
  onStartAdd,
  onSaveNewTask,
  onCancelAdd,
  onTaskClick,
  onOpenInProject,
}) => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col transition-colors duration-150 h-full ${theme.cardBg} ${
        isOver ? 'bg-blue-500/[0.08] dark:bg-blue-500/[0.12] ring-1 ring-inset ring-blue-500/60' : ''
      }`}
    >
      {/* Quadrant Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/70 dark:border-white/8 select-none bg-slate-100/45 dark:bg-slate-900/35">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.dotClass}`} />
          <div className="flex flex-col min-w-0">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
            <p className="text-3xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-mono font-semibold tabular-nums px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/8">
            {tasks.length}
          </span>
          <button
            type="button"
            onClick={() => onStartAdd(id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
            title={`${t('add_task')} (${title})`}
            aria-label={`${t('add_task')} (${title})`}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto max-h-[380px] min-h-[210px]">
        {isAddingHere && (
          <ColumnTaskComposer
            onSave={(newTitle) => onSaveNewTask(id, newTitle)}
            onCancel={onCancelAdd}
          />
        )}

        {tasks.length === 0 && !isAddingHere ? (
          <div className="flex-1 flex flex-col items-center justify-center p-5 text-center my-auto select-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('no_tasks_in_quadrant', 'No tasks here')}
            </p>
            <p className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5">
              {t('drop_or_add_hint', 'Drop tasks here or click + to add')}
            </p>
            <button
              type="button"
              onClick={() => onStartAdd(id)}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 bg-slate-100/80 dark:bg-slate-800/70 hover:bg-slate-200/80 dark:hover:bg-slate-700/70 transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-slate-200/80 dark:border-white/8"
            >
              <Plus size={12} />
              <span>{t('add_task')}</span>
            </button>
          </div>
        ) : (
          tasks.map((task) => {
            const projectInfo = projectsMap.get(task.projectId);
            return (
              <DraggableMatrixCard
                key={task.id}
                task={task}
                projectName={projectInfo?.name}
                projectColor={projectInfo?.color}
                onClick={() => onTaskClick(task)}
                onOpenInProject={onOpenInProject}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

interface UnassignedDrawerProps {
  tasks: Task[];
  projectsMap: Map<string, { name: string; color: string }>;
  isDraggingActive?: boolean;
  onTaskClick: (task: Task) => void;
  onOpenInProject: (projectId: string, taskId: string) => void;
  onClose: () => void;
}

const UnassignedDrawer: React.FC<UnassignedDrawerProps> = ({
  tasks,
  projectsMap,
  isDraggingActive = false,
  onTaskClick,
  onOpenInProject,
  onClose,
}) => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: 'none' });

  return (
    <div
      ref={setNodeRef}
      className={`glass-panel rounded-xl transition-colors duration-150 p-4 flex flex-col gap-3 ${
        isOver
          ? 'ring-2 ring-blue-500 bg-blue-500/10 dark:bg-blue-950/35 border-blue-400'
          : isDraggingActive
          ? 'border-dashed border-blue-400/60 ring-1 ring-blue-400/30'
          : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox size={14} className="text-slate-500 dark:text-slate-400" />
          <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            {t('unprioritized_inbox', 'Unprioritized Tasks')}
          </h4>
          <span className="text-2xs font-mono font-semibold tabular-nums px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {tasks.length}
          </span>
          <span className="text-2xs text-slate-400 dark:text-slate-500 hidden sm:inline">
            · {t('unprioritized_desc', 'Drag tasks into any section to set priority')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {t('hide', 'Hide')}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="py-5 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>{t('all_tasks_prioritized', 'All tasks are prioritized. Drag tasks here to unprioritize.')}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1 auto-rows-fr">
          {tasks.map((task) => {
            const projectInfo = projectsMap.get(task.projectId);
            return (
              <DraggableMatrixCard
                key={task.id}
                task={task}
                projectName={projectInfo?.name}
                projectColor={projectInfo?.color}
                onClick={() => onTaskClick(task)}
                onOpenInProject={onOpenInProject}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// Overlaid drop pill shown when the unprioritized drawer is collapsed so dragging never shifts page height
const FloatingUnassignDropPill: React.FC = () => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: 'none' });

  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[var(--z-sticky)] animate-toast-in px-4 py-2.5 rounded-full border shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold select-none transition-colors duration-150 ${
        isOver
          ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/50'
          : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-300/80 dark:border-white/15'
      }`}
    >
      <Inbox size={14} />
      <span>{t('unprioritized_inbox', 'Drop here to unprioritize')}</span>
    </div>
  );
};

type MatrixStatusFilter = 'ACTIVE' | 'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';

export const MatrixView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tasks, projects, updateTask, addTask } = useKanbanStore();

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<MatrixStatusFilter>(() => {
    const saved = localStorage.getItem('matrix_status_filter');
    if (
      saved === 'ACTIVE' ||
      saved === 'ALL' ||
      saved === 'TODO' ||
      saved === 'IN_PROGRESS' ||
      saved === 'DONE' ||
      saved === 'ARCHIVED'
    ) {
      return saved;
    }
    return 'ACTIVE';
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeCardWidth, setActiveCardWidth] = useState<number | undefined>(undefined);
  const [showUnassignedDrawer, setShowUnassignedDrawer] = useState(true);
  const [addingQuadrant, setAddingQuadrant] = useState<TaskPriority | null>(null);

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null;

  const handleStatusFilterChange = (status: MatrixStatusFilter) => {
    setStatusFilter(status);
    localStorage.setItem('matrix_status_filter', status);
  };

  const projectsMap = React.useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    projects.forEach((p) => map.set(p.id, { name: p.name, color: p.color }));
    return map;
  }, [projects]);

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ARCHIVED'
          ? task.archived === true
          : task.archived !== true &&
            (statusFilter === 'ALL'
              ? true
              : statusFilter === 'ACTIVE'
              ? task.status !== 'DONE'
              : task.status === statusFilter);

      const matchesProject = projectFilter === 'ALL' || task.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [tasks, search, statusFilter, projectFilter]);

  const quadrantTasks = React.useMemo(() => {
    const urgent: Task[] = [];
    const plan: Task[] = [];
    const delegate: Task[] = [];
    const later: Task[] = [];
    const unassigned: Task[] = [];

    filteredTasks.forEach((task) => {
      if (task.priority === 'none') {
        unassigned.push(task);
        return;
      }
      if (task.priority === 'urgent_important') {
        urgent.push(task);
        return;
      }
      if (task.priority === 'not_urgent_important') {
        plan.push(task);
        return;
      }
      if (task.priority === 'urgent_not_important') {
        delegate.push(task);
        return;
      }
      if (task.priority === 'not_urgent_not_important') {
        later.push(task);
        return;
      }

      if (task.isUrgent === true && task.isImportant === true) {
        urgent.push(task);
      } else if (task.isUrgent === false && task.isImportant === true) {
        plan.push(task);
      } else if (task.isUrgent === true && task.isImportant === false) {
        delegate.push(task);
      } else if (
        task.isUrgent === false &&
        task.isImportant === false &&
        task.isUrgent !== undefined &&
        task.isImportant !== undefined &&
        task.priority !== undefined
      ) {
        later.push(task);
      } else {
        unassigned.push(task);
      }
    });

    return { urgent, plan, delegate, later, unassigned };
  }, [filteredTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const collisionDetectionStrategy: CollisionDetection = React.useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    return closestCorners(args);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    setActiveCardWidth(event.active.rect.current.initial?.width);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveCardWidth(undefined);

    if (!over) return;

    const taskId = active.id as string;
    const targetQuadrant = over.id as TaskPriority;

    if (targetQuadrant === 'none') {
      updateTask(taskId, {
        priority: 'none',
        isUrgent: undefined,
        isImportant: undefined,
      });
      return;
    }

    if (
      targetQuadrant === 'urgent_important' ||
      targetQuadrant === 'not_urgent_important' ||
      targetQuadrant === 'urgent_not_important' ||
      targetQuadrant === 'not_urgent_not_important'
    ) {
      const flags = getFlagsFromPriority(targetQuadrant);
      updateTask(taskId, {
        priority: targetQuadrant,
        isUrgent: flags.isUrgent,
        isImportant: flags.isImportant,
      });
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setActiveCardWidth(undefined);
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsTaskModalOpen(true);
  };

  const handleOpenInProject = (projectId: string, taskId: string) => {
    navigate(`/project/${projectId}?task=${taskId}`);
  };

  const handleStartAddInQuadrant = (quadrant: TaskPriority) => {
    const targetProjectId = projectFilter !== 'ALL' ? projectFilter : projects[0]?.id;
    if (!targetProjectId) {
      navigate('/?action=new-project');
      return;
    }
    setAddingQuadrant(quadrant);
  };

  const handleSaveTaskInQuadrant = (quadrant: TaskPriority, title: string) => {
    const targetProjectId = projectFilter !== 'ALL' ? projectFilter : projects[0]?.id;
    if (!targetProjectId) {
      navigate('/?action=new-project');
      return;
    }

    const flags = getFlagsFromPriority(quadrant);
    addTask({
      title,
      projectId: targetProjectId,
      status: 'TODO' as TaskStatus,
      priority: quadrant,
      isUrgent: flags.isUrgent,
      isImportant: flags.isImportant,
    });

    if (statusFilter === 'DONE' || statusFilter === 'ARCHIVED') {
      toast.info(`${title} → ${t('todo')}`, {
        action: {
          label: t('status_active', 'Active'),
          onClick: () => handleStatusFilterChange('ACTIVE'),
        },
      });
    }
  };

  const activeTask = activeDragId ? tasks.find((t) => t.id === activeDragId) : null;
  const activeTaskProject = activeTask ? projectsMap.get(activeTask.projectId) : undefined;

  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in text-left">
      {/* Unified Command Toolbar */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl select-none">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {t('eisenhower_matrix', 'Eisenhower Matrix')}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <div className="relative w-44 sm:w-52">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder', 'Search tasks...')}
              className="glass-input w-full pl-8 pr-7 h-8 rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <select
            aria-label={t('project')}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="glass-input h-8 px-2.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900">
              {t('all_projects', 'All Projects')}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            aria-label={t('status')}
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value as MatrixStatusFilter)}
            className="glass-input h-8 px-2.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="ACTIVE" className="bg-white dark:bg-slate-900">
              {t('status_active', 'Active (Hide Done)')}
            </option>
            <option value="ALL" className="bg-white dark:bg-slate-900">
              {t('status', 'Status')}: {t('all', 'All')}
            </option>
            <option value="TODO" className="bg-white dark:bg-slate-900">
              {t('todo')}
            </option>
            <option value="IN_PROGRESS" className="bg-white dark:bg-slate-900">
              {t('in_progress')}
            </option>
            <option value="DONE" className="bg-white dark:bg-slate-900">
              {t('done')}
            </option>
            <option value="ARCHIVED" className="bg-white dark:bg-slate-900">
              {t('archived', 'Archived')}
            </option>
          </select>

          {/* Unprioritized Panel Toggle */}
          <button
            type="button"
            onClick={() => setShowUnassignedDrawer(!showUnassignedDrawer)}
            title={
              showUnassignedDrawer ? t('hide', 'Hide') : t('unprioritized_inbox', 'Unprioritized Tasks')
            }
            className={`inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              showUnassignedDrawer
                ? 'bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-900 dark:text-slate-100 border-slate-300/80 dark:border-white/12'
                : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/8 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {showUnassignedDrawer ? (
              <PanelBottomClose size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
            ) : (
              <PanelBottomOpen size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
            )}
            <span>{t('unprioritized', 'Unprioritized')}</span>
            <span className="font-mono text-2xs tabular-nums px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              {quadrantTasks.unassigned.length}
            </span>
          </button>
        </div>
      </div>

      {/* DndContext Wrapping the Matrix */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Unified 2x2 Matrix Frame */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col flex-1">
          {/* Top Urgency Column Axis Bar (hidden on single-column mobile layout) */}
          <div className="hidden md:flex border-b border-slate-200/70 dark:border-white/8 bg-slate-100/50 dark:bg-slate-900/45 select-none">
            <div className="w-9 shrink-0 flex items-center justify-center border-r border-slate-200/70 dark:border-white/8 text-slate-400 dark:text-slate-500">
              <Layers size={13} className="opacity-50" />
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200/70 dark:divide-white/8 flex-1">
              <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={13} className="text-rose-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">
                    {t('urgent', 'Urgent')}
                  </span>
                </div>
                <span className="text-2xs text-slate-500 dark:text-slate-400">
                  {t('urgent_axis_hint', 'Do immediately')}
                </span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-blue-500 dark:text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
                    {t('not_urgent', 'Not Urgent')}
                  </span>
                </div>
                <span className="text-2xs text-slate-500 dark:text-slate-400">
                  {t('not_urgent_axis_hint', 'Schedule & plan')}
                </span>
              </div>
            </div>
          </div>

          {/* 2x2 Matrix Cells */}
          <div className="flex flex-col divide-y divide-slate-200/70 dark:divide-white/8 flex-1">
            {/* Row 1: Important (Urgent & Plan) */}
            <div className="flex flex-1 min-h-0">
              <div className="relative w-8 sm:w-9 shrink-0 flex items-center justify-center border-r border-slate-200/70 dark:border-white/8 bg-slate-100/50 dark:bg-slate-900/45 select-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rotate-90 whitespace-nowrap flex items-center gap-1.5">
                    <Star size={11} className="text-amber-500 fill-amber-500/20 -rotate-90 shrink-0" />
                    <span className="text-3xs sm:text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                      {t('important', 'Important')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/70 dark:divide-white/8 flex-1 min-w-0">
                <QuadrantContainer
                  id="urgent_important"
                  title={t('quadrant_1_title', 'Urgent')}
                  subtitle={t('quadrant_1_desc', 'Crises, deadlines & pressing issues')}
                  tasks={quadrantTasks.urgent}
                  theme={{
                    dotClass: 'bg-rose-500',
                    cardBg: 'bg-rose-500/[0.015]',
                  }}
                  projectsMap={projectsMap}
                  isAddingHere={addingQuadrant === 'urgent_important'}
                  onStartAdd={handleStartAddInQuadrant}
                  onSaveNewTask={handleSaveTaskInQuadrant}
                  onCancelAdd={() => setAddingQuadrant(null)}
                  onTaskClick={handleOpenTask}
                  onOpenInProject={handleOpenInProject}
                />

                <QuadrantContainer
                  id="not_urgent_important"
                  title={t('quadrant_2_title', 'Plan')}
                  subtitle={t('quadrant_2_desc', 'Planning, deep work & growth')}
                  tasks={quadrantTasks.plan}
                  theme={{
                    dotClass: 'bg-blue-500',
                    cardBg: 'bg-blue-500/[0.015]',
                  }}
                  projectsMap={projectsMap}
                  isAddingHere={addingQuadrant === 'not_urgent_important'}
                  onStartAdd={handleStartAddInQuadrant}
                  onSaveNewTask={handleSaveTaskInQuadrant}
                  onCancelAdd={() => setAddingQuadrant(null)}
                  onTaskClick={handleOpenTask}
                  onOpenInProject={handleOpenInProject}
                />
              </div>
            </div>

            {/* Row 2: Not Important (Delegate & Later) */}
            <div className="flex flex-1 min-h-0">
              <div className="relative w-8 sm:w-9 shrink-0 flex items-center justify-center border-r border-slate-200/70 dark:border-white/8 bg-slate-100/50 dark:bg-slate-900/45 select-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rotate-90 whitespace-nowrap flex items-center gap-1.5">
                    <Coffee size={11} className="text-slate-400 -rotate-90 shrink-0" />
                    <span className="text-3xs sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                      {t('not_important', 'Not Important')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/70 dark:divide-white/8 flex-1 min-w-0">
                <QuadrantContainer
                  id="urgent_not_important"
                  title={t('quadrant_3_title', 'Delegate')}
                  subtitle={t('quadrant_3_desc', 'Interruptions & minor tasks')}
                  tasks={quadrantTasks.delegate}
                  theme={{
                    dotClass: 'bg-amber-500',
                    cardBg: 'bg-amber-500/[0.015]',
                  }}
                  projectsMap={projectsMap}
                  isAddingHere={addingQuadrant === 'urgent_not_important'}
                  onStartAdd={handleStartAddInQuadrant}
                  onSaveNewTask={handleSaveTaskInQuadrant}
                  onCancelAdd={() => setAddingQuadrant(null)}
                  onTaskClick={handleOpenTask}
                  onOpenInProject={handleOpenInProject}
                />

                <QuadrantContainer
                  id="not_urgent_not_important"
                  title={t('quadrant_4_title', 'Later')}
                  subtitle={t('quadrant_4_desc', 'Time wasters & backlog')}
                  tasks={quadrantTasks.later}
                  theme={{
                    dotClass: 'bg-slate-400 dark:bg-slate-500',
                    cardBg: 'bg-slate-500/[0.015]',
                  }}
                  projectsMap={projectsMap}
                  isAddingHere={addingQuadrant === 'not_urgent_not_important'}
                  onStartAdd={handleStartAddInQuadrant}
                  onSaveNewTask={handleSaveTaskInQuadrant}
                  onCancelAdd={() => setAddingQuadrant(null)}
                  onTaskClick={handleOpenTask}
                  onOpenInProject={handleOpenInProject}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Unprioritized Tasks Drawer (Triage Box) */}
        {showUnassignedDrawer && (
          <UnassignedDrawer
            tasks={quadrantTasks.unassigned}
            projectsMap={projectsMap}
            isDraggingActive={activeDragId !== null}
            onTaskClick={handleOpenTask}
            onOpenInProject={handleOpenInProject}
            onClose={() => setShowUnassignedDrawer(false)}
          />
        )}

        {/* Floating Unprioritize drop pill when drawer is hidden during active drag */}
        {!showUnassignedDrawer && activeDragId !== null && <FloatingUnassignDropPill />}

        {/* Drag Overlay */}
        {createPortal(
          <DragOverlay
            zIndex={80}
            dropAnimation={{
              duration: 180,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {activeTask ? (
              <div style={activeCardWidth ? { width: `${activeCardWidth}px` } : { width: '260px' }}>
                <MatrixTaskCard
                  task={activeTask}
                  projectName={activeTaskProject?.name}
                  projectColor={activeTaskProject?.color}
                  onClick={() => {}}
                  isOverlay
                />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

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
