import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Star,
  Clock,
  Coffee,
  Plus,
  Search,
  Filter,
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
import type { Task, TaskPriority, TaskStatus } from '../types/kanban';
import { TaskModal } from '../components/Board/TaskModal';
import { getColorStyles } from '../utils/colors';
import { getFlagsFromPriority } from '../utils/priority';

// Quadrant Task Card
interface MatrixTaskCardProps {
  task: Task;
  projectColor?: string;
  projectName?: string;
  onClick: (e: React.MouseEvent) => void;
  onOpenInProject?: (projectId: string, taskId: string) => void;
  isDragging?: boolean;
}

const MatrixTaskCard: React.FC<MatrixTaskCardProps> = ({
  task,
  projectColor,
  projectName,
  onClick,
  onOpenInProject,
  isDragging = false,
}) => {
  const { t } = useTranslation();
  const colorStyles = projectColor ? getColorStyles(projectColor) : { text: 'text-slate-400', bg: 'bg-slate-400' };

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl cursor-grab active:cursor-grabbing text-left flex flex-col justify-between gap-2 h-full min-h-[66px] transition-all duration-150 select-none group relative border ${
        isDragging
          ? 'shadow-xl ring-2 ring-blue-500/50 bg-white dark:bg-slate-800 scale-[1.02] border-blue-500/40 opacity-90'
          : 'bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-800 dark:text-slate-100 line-clamp-2 flex-1 leading-snug">
          {task.title}
        </span>
        {onOpenInProject && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInProject(task.projectId, task.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity p-0.5 rounded cursor-pointer shrink-0"
            title={t('open_in_project', 'Open in project')}
          >
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      {/* Meta indicators: Project, Deadline, Status */}
      <div className="flex items-center gap-1.5 flex-wrap text-2xs">
        {projectName && (
          <div className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/70 px-1.5 py-0.5 rounded-md">
            <span className={`w-1.5 h-1.5 rounded-full ${colorStyles.bg}`} />
            <span className="truncate max-w-[100px]">{projectName}</span>
          </div>
        )}

        {task.deadline && (
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono bg-slate-100/70 dark:bg-slate-800/70 px-1.5 py-0.5 rounded-md">
            <Calendar size={10} className="text-slate-400" />
            <span>{task.deadline}</span>
          </div>
        )}

        {task.status === 'DONE' && (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
            <CheckCircle2 size={10} />
            <span>{t('done')}</span>
          </span>
        )}
      </div>
    </div>
  );
};

// Draggable Task Card for Quadrants and Drawer
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
    opacity: isDragging ? 0.35 : 1,
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

// Quadrant Visual Theme Configuration
interface QuadrantTheme {
  iconBg: string;
  cardBg: string;
  border: string;
}

// Droppable Quadrant Container
interface QuadrantContainerProps {
  id: TaskPriority;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tasks: Task[];
  theme: QuadrantTheme;
  projectsMap: Map<string, { name: string; color: string }>;
  onTaskClick: (task: Task) => void;
  onAddTask: (priority: TaskPriority) => void;
  onOpenInProject: (projectId: string, taskId: string) => void;
}

const QuadrantContainer: React.FC<QuadrantContainerProps> = ({
  id,
  title,
  subtitle,
  icon,
  tasks,
  theme,
  projectsMap,
  onTaskClick,
  onAddTask,
  onOpenInProject,
}) => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col transition-colors duration-150 h-full ${theme.cardBg} ${
        isOver ? 'bg-blue-500/10 dark:bg-blue-500/15 ring-2 ring-inset ring-blue-500' : ''
      }`}
    >
      {/* Quadrant Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 select-none bg-slate-100/40 dark:bg-slate-900/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${theme.iconBg}`}>
            {icon}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700/60">
            {tasks.length}
          </span>
          <button
            type="button"
            onClick={() => onAddTask(id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={`${t('add_task')} (${title})`}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto max-h-[380px] min-h-[220px]">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto select-none">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 opacity-30 ${theme.iconBg}`}>
              {icon}
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('no_tasks_in_quadrant', 'No tasks here')}
            </p>
            <p className="text-2xs text-slate-600 dark:text-slate-400 mt-0.5">
              {t('drop_or_add_hint', 'Drop tasks here or click + to add')}
            </p>
            <button
              type="button"
              onClick={() => onAddTask(id)}
              className="mt-3 px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-200 bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
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

// Droppable Unassigned Tasks Drawer (Triage Box)
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
      className={`rounded-2xl border transition-all duration-200 p-4 backdrop-blur-md flex flex-col gap-3 ${
        isOver
          ? 'ring-2 ring-blue-500 bg-blue-500/15 dark:bg-blue-950/40 border-blue-400 shadow-md scale-[1.003]'
          : isDraggingActive
          ? 'border-dashed border-blue-400/60 bg-blue-500/[0.03] ring-1 ring-blue-400/30'
          : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Inbox size={13} />
          </div>
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
            {t('unprioritized_inbox', 'Unprioritized Tasks')}
          </h4>
          <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {tasks.length}
          </span>
          <span className="text-2xs text-slate-400 hidden sm:inline">
            · {t('unprioritized_desc', 'Drag tasks into any section to set priority')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {t('hide', 'Hide')}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showUnassignedDrawer, setShowUnassignedDrawer] = useState(true);

  const handleStatusFilterChange = (status: MatrixStatusFilter) => {
    setStatusFilter(status);
    localStorage.setItem('matrix_status_filter', status);
  };

  // Map projects for fast lookup
  const projectsMap = React.useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    projects.forEach((p) => map.set(p.id, { name: p.name, color: p.color }));
    return map;
  }, [projects]);

  // Filter tasks
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

  // Group tasks into Eisenhower sections
  const quadrantTasks = React.useMemo(() => {
    const urgent: Task[] = [];
    const plan: Task[] = [];
    const delegate: Task[] = [];
    const later: Task[] = [];
    const unassigned: Task[] = [];

    filteredTasks.forEach((task) => {
      // If priority is explicitly 'none', it is definitely unassigned/unprioritized
      if (task.priority === 'none') {
        unassigned.push(task);
        return;
      }

      // If priority is set to one of the 4 sections, respect it directly
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

      // Fallback only if priority was never set (e.g. legacy tasks with only boolean flags)
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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Multi-tier collision detection: pointerWithin first for fast, exact drawer/quadrant hit, then rectIntersection, fallback to closestCorners
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
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

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

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenInProject = (projectId: string, taskId: string) => {
    navigate(`/project/${projectId}?task=${taskId}`);
  };

  const handleCreateTaskInQuadrant = (quadrant: TaskPriority) => {
    const targetProjectId = projectFilter !== 'ALL' ? projectFilter : projects[0]?.id;
    if (!targetProjectId) {
      navigate('/?action=new-project');
      return;
    }

    const flags = getFlagsFromPriority(quadrant);
    const defaultTitle = t('add_task', 'New Task');

    addTask({
      title: defaultTitle,
      projectId: targetProjectId,
      status: 'TODO' as TaskStatus,
      priority: quadrant,
      isUrgent: flags.isUrgent,
      isImportant: flags.isImportant,
    });
  };

  // Active dragging task
  const activeTask = activeDragId ? tasks.find((t) => t.id === activeDragId) : null;
  const activeTaskProject = activeTask ? projectsMap.get(activeTask.projectId) : undefined;

  return (
    <div className="flex flex-col gap-3 h-full animate-fade-in text-left">
      {/* Unified Command Toolbar (Single-Row, Standardized Controls) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md select-none">
        {/* Left: View Title & Context */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Layers size={16} />
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('eisenhower_matrix', 'Eisenhower Matrix')}
          </h1>
        </div>

        {/* Right: Streamlined Controls (Search, Project, Status with Active/Hide Done, and Unprioritized Panel Toggle) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <div className="relative w-44 sm:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder', 'Search tasks...')}
              className="w-full pl-7.5 pr-6 h-8 rounded-lg text-xs bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 focus:border-blue-500/60 focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-1">
            <Filter size={12} className="text-slate-400 hidden sm:block" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg text-xs bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 cursor-pointer font-medium focus:outline-hidden"
            >
              <option value="ALL">{t('all_projects', 'All Projects')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter with Active (Hide Done) option */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value as MatrixStatusFilter)}
            className="h-8 px-2.5 rounded-lg text-xs bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 cursor-pointer font-medium focus:outline-hidden"
          >
            <option value="ACTIVE">{t('status_active', 'Active (Hide Done)')}</option>
            <option value="ALL">{t('status', 'Status')}: {t('all', 'All')}</option>
            <option value="TODO">{t('todo')}</option>
            <option value="IN_PROGRESS">{t('in_progress')}</option>
            <option value="DONE">{t('done')}</option>
            <option value="ARCHIVED">{t('archived', 'Archived')}</option>
          </select>

          {/* Unprioritized Panel Toggle Button (Neutral UI element, no loud primary styling) */}
          <button
            type="button"
            onClick={() => setShowUnassignedDrawer(!showUnassignedDrawer)}
            title={showUnassignedDrawer ? t('hide', 'Hide') : t('unprioritized_inbox', 'Unprioritized Tasks')}
            className={`inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              showUnassignedDrawer
                ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300/80 dark:border-slate-700 shadow-2xs'
                : 'bg-slate-100/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200/70 dark:border-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {showUnassignedDrawer ? (
              <PanelBottomClose size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
            ) : (
              <PanelBottomOpen size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
            )}
            <span>{t('unprioritized', 'Unprioritized')}</span>
            <span className="font-mono text-2xs px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
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
      >
        {/* Unified 2x2 Matrix Frame */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md overflow-hidden flex flex-col flex-1 shadow-xs">
          {/* Top Urgency Column Axis Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800/80 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/40 dark:bg-slate-900/50 select-none">
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={13} className="text-rose-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-rose-500/90 font-mono">
                  {t('urgent', 'Urgent')}
                </span>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                {t('urgent_axis_hint', 'Do immediately')}
              </span>
            </div>
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400/90 font-mono">
                  {t('not_urgent', 'Not Urgent')}
                </span>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                {t('not_urgent_axis_hint', 'Schedule & plan')}
              </span>
            </div>
          </div>

          {/* 2x2 Matrix Cells with Intersecting Grid Dividing Lines */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800/80 flex-1">
            {/* Column 1: Urgent (Top: Urgent, Bottom: Delegate) */}
            <div className="flex flex-col divide-y divide-slate-200/80 dark:divide-slate-800/80 flex-1">
              {/* Row 1: Urgent (Urgent & Important) */}
              <QuadrantContainer
                id="urgent_important"
                title={t('quadrant_1_title', 'Urgent')}
                subtitle={t('quadrant_1_desc', 'Crises, deadlines & pressing issues')}
                icon={<Flame size={14} />}
                tasks={quadrantTasks.urgent}
                theme={{
                  iconBg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/15',
                  cardBg: 'bg-rose-500/[0.02]',
                  border: '',
                }}
                projectsMap={projectsMap}
                onTaskClick={handleOpenTask}
                onAddTask={handleCreateTaskInQuadrant}
                onOpenInProject={handleOpenInProject}
              />

              {/* Row 2: Delegate (Urgent & Not Important) */}
              <QuadrantContainer
                id="urgent_not_important"
                title={t('quadrant_3_title', 'Delegate')}
                subtitle={t('quadrant_3_desc', 'Interruptions & minor tasks')}
                icon={<Clock size={14} />}
                tasks={quadrantTasks.delegate}
                theme={{
                  iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15',
                  cardBg: 'bg-amber-500/[0.02]',
                  border: '',
                }}
                projectsMap={projectsMap}
                onTaskClick={handleOpenTask}
                onAddTask={handleCreateTaskInQuadrant}
                onOpenInProject={handleOpenInProject}
              />
            </div>

            {/* Column 2: Not Urgent (Top: Plan, Bottom: Later) */}
            <div className="flex flex-col divide-y divide-slate-200/80 dark:divide-slate-800/80 flex-1">
              {/* Row 1: Plan (Not Urgent & Important) */}
              <QuadrantContainer
                id="not_urgent_important"
                title={t('quadrant_2_title', 'Plan')}
                subtitle={t('quadrant_2_desc', 'Planning, deep work & growth')}
                icon={<Star size={14} className="fill-current" />}
                tasks={quadrantTasks.plan}
                theme={{
                  iconBg: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15',
                  cardBg: 'bg-blue-500/[0.02]',
                  border: '',
                }}
                projectsMap={projectsMap}
                onTaskClick={handleOpenTask}
                onAddTask={handleCreateTaskInQuadrant}
                onOpenInProject={handleOpenInProject}
              />

              {/* Row 2: Later (Not Urgent & Not Important) */}
              <QuadrantContainer
                id="not_urgent_not_important"
                title={t('quadrant_4_title', 'Later')}
                subtitle={t('quadrant_4_desc', 'Time wasters & backlog')}
                icon={<Coffee size={14} />}
                tasks={quadrantTasks.later}
                theme={{
                  iconBg: 'bg-slate-500/10 text-slate-500 dark:bg-slate-400/15',
                  cardBg: 'bg-slate-500/[0.02]',
                  border: '',
                }}
                projectsMap={projectsMap}
                onTaskClick={handleOpenTask}
                onAddTask={handleCreateTaskInQuadrant}
                onOpenInProject={handleOpenInProject}
              />
            </div>
          </div>
        </div>

        {/* Unprioritized Tasks Drawer (Triage Box) */}
        {(showUnassignedDrawer || activeDragId !== null) && (
          <UnassignedDrawer
            tasks={quadrantTasks.unassigned}
            projectsMap={projectsMap}
            isDraggingActive={activeDragId !== null}
            onTaskClick={handleOpenTask}
            onOpenInProject={handleOpenInProject}
            onClose={() => setShowUnassignedDrawer(false)}
          />
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="w-64 opacity-95 scale-105 rotate-1">
              <MatrixTaskCard
                task={activeTask}
                projectName={activeTaskProject?.name}
                projectColor={activeTaskProject?.color}
                onClick={() => {}}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
