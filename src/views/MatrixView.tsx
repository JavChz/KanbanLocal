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
  Circle,
  ExternalLink,
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

// Quadrant Card representation
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
      className={`glass-card p-3.5 rounded-xl cursor-grab active:cursor-grabbing text-left flex flex-col gap-2 transition-all duration-150 select-none group relative ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500/40 opacity-40 scale-[1.01]' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 flex-1">
          {task.title}
        </span>
        {onOpenInProject && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInProject(task.projectId, task.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity p-0.5 rounded cursor-pointer"
            title={t('open_in_project', 'Open in project')}
          >
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      {/* Meta indicators: Project, Deadline, Status */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5 text-2xs">
        {projectName && (
          <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-350">
            <Circle size={6} className={`fill-current ${colorStyles.text}`} />
            <span className="truncate max-w-[90px]">{projectName}</span>
          </div>
        )}

        {task.deadline && (
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
            <Calendar size={11} className="text-slate-400" />
            <span>{task.deadline}</span>
          </div>
        )}

        {task.status === 'DONE' && (
          <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400 font-semibold font-mono">
            <CheckCircle2 size={11} />
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
    // Prevent accidental click when dragging
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

// Droppable Quadrant Container
interface QuadrantContainerProps {
  id: TaskPriority;
  title: string;
  quadrantBadge?: string;
  subtitle: string;
  icon: React.ReactNode;
  tasks: Task[];
  headerBg: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  projectsMap: Map<string, { name: string; color: string }>;
  onTaskClick: (task: Task) => void;
  onAddTask: (priority: TaskPriority) => void;
  onOpenInProject: (projectId: string, taskId: string) => void;
}

const QuadrantContainer: React.FC<QuadrantContainerProps> = ({
  id,
  title,
  quadrantBadge,
  subtitle,
  icon,
  tasks,
  borderColor,
  badgeBg,
  badgeText,
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
      className={`glass-panel rounded-2xl flex flex-col p-4 transition-all duration-200 border min-h-[300px] h-full ${
        isOver
          ? 'ring-2 ring-blue-500/40 scale-[1.005] bg-blue-50/20 dark:bg-blue-950/20'
          : borderColor
      }`}
    >
      {/* Quadrant Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/50 dark:border-slate-800/40 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{icon}</span>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
            {title}
          </h3>
          {quadrantBadge && (
            <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold tracking-wide whitespace-nowrap shrink-0 ${badgeBg} ${badgeText}`}>
              {quadrantBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {tasks.length}
          </span>
          <button
            type="button"
            onClick={() => onAddTask(id)}
            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            title={`${t('add_task')} (${title})`}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <p className="text-2xs text-slate-400 dark:text-slate-500 italic mb-3 text-left">
        {subtitle}
      </p>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[460px] pr-0.5">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500 text-xs italic border border-dashed border-slate-200 dark:border-slate-800/70 rounded-xl my-auto">
            <span>{t('no_tasks_in_quadrant', 'No tasks in this quadrant')}</span>
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

      {/* Quick Add Button */}
      <button
        type="button"
        onClick={() => onAddTask(id)}
        className="mt-3 py-2 px-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/50 bg-slate-100/40 dark:bg-slate-900/30 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer select-none"
      >
        <Plus size={14} />
        <span>{t('add_task')}</span>
      </button>
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
      className={`glass-panel p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 mt-2 ${
        isOver
          ? 'ring-2 ring-blue-500 bg-blue-500/20 dark:bg-blue-950/50 border-blue-400 scale-[1.005]'
          : isDraggingActive
          ? 'ring-2 ring-dashed ring-blue-400/50 border-blue-400/40 bg-blue-500/5'
          : 'border-slate-200/60 dark:border-slate-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox size={16} className="text-slate-500" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {t('unprioritized_inbox', 'Unprioritized Tasks')} ({tasks.length})
          </h4>
          <span className="text-2xs text-slate-400 italic">
            {t('unprioritized_desc', 'Drag tasks into any quadrant to set priority')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
        >
          {t('hide', 'Hide')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="col-span-full py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic border border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl">
            {t('all_tasks_prioritized', 'All tasks are prioritized. Drag tasks here to unprioritize.')}
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

export const MatrixView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tasks, projects, updateTask, addTask } = useKanbanStore();

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showUnassignedDrawer, setShowUnassignedDrawer] = useState(true);

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
          : task.archived !== true && (statusFilter === 'ALL' || task.status === statusFilter);

      const matchesProject = projectFilter === 'ALL' || task.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [tasks, search, statusFilter, projectFilter]);

  // Group tasks into Eisenhower quadrants
  const quadrantTasks = React.useMemo(() => {
    const q1: Task[] = [];
    const q2: Task[] = [];
    const q3: Task[] = [];
    const q4: Task[] = [];
    const unassigned: Task[] = [];

    filteredTasks.forEach((task) => {
      // If priority is explicitly 'none', it is definitely unassigned/unprioritized
      if (task.priority === 'none') {
        unassigned.push(task);
        return;
      }

      // If priority is set to one of the 4 quadrants, respect it directly
      if (task.priority === 'urgent_important') {
        q1.push(task);
        return;
      }
      if (task.priority === 'not_urgent_important') {
        q2.push(task);
        return;
      }
      if (task.priority === 'urgent_not_important') {
        q3.push(task);
        return;
      }
      if (task.priority === 'not_urgent_not_important') {
        q4.push(task);
        return;
      }

      // Fallback only if priority was never set (e.g. legacy tasks with only boolean flags)
      if (task.isUrgent === true && task.isImportant === true) {
        q1.push(task);
      } else if (task.isUrgent === false && task.isImportant === true) {
        q2.push(task);
      } else if (task.isUrgent === true && task.isImportant === false) {
        q3.push(task);
      } else if (
        task.isUrgent === false &&
        task.isImportant === false &&
        task.isUrgent !== undefined &&
        task.isImportant !== undefined &&
        task.priority !== undefined
      ) {
        q4.push(task);
      } else {
        unassigned.push(task);
      }
    });

    return { q1, q2, q3, q4, unassigned };
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
    <div className="flex flex-col gap-6 h-full animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Layers size={22} />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50 md:text-4xl">
              {t('eisenhower_matrix', 'Eisenhower Matrix')}
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('eisenhower_desc', 'Prioritize tasks by urgency and importance to focus on high-impact work.')}
          </p>
        </div>

        {/* Quadrant Quick Summary Stats */}
        <div className="flex items-center gap-2 flex-wrap text-2xs font-semibold">
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            {t('quadrant_1_title', 'Urgent')}: {quadrantTasks.q1.length}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            {t('quadrant_2_title', 'Plan')}: {quadrantTasks.q2.length}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            {t('quadrant_3_title', 'Delegate')}: {quadrantTasks.q3.length}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
            {t('quadrant_4_title', 'Later')}: {quadrantTasks.q4.length}
          </span>
          <button
            type="button"
            onClick={() => setShowUnassignedDrawer(!showUnassignedDrawer)}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-bold ${
              showUnassignedDrawer
                ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 shadow-xs'
                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-300/60'
            }`}
          >
            {t('unprioritized_inbox', 'Inbox')}: {quadrantTasks.unassigned.length}
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-3.5 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border border-slate-200/50 dark:border-slate-800/40">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_placeholder', 'Search tasks...')}
            className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-xs placeholder:text-slate-400"
          />
        </div>

        {/* Project & Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="glass-input px-3 py-1.5 rounded-xl text-xs cursor-pointer font-medium"
            >
              <option value="ALL">{t('all_projects', 'All Projects')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input px-3 py-1.5 rounded-xl text-xs cursor-pointer font-medium"
          >
            <option value="ALL">{t('status', 'Status')}: {t('all', 'All')}</option>
            <option value="TODO">{t('todo')}</option>
            <option value="IN_PROGRESS">{t('in_progress')}</option>
            <option value="DONE">{t('done')}</option>
            <option value="ARCHIVED">{t('archived', 'Archived')}</option>
          </select>
        </div>
      </div>

      {/* DndContext Wrapping the Matrix */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Matrix Axes Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <div className="py-1 px-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <Clock size={14} />
            <span>{t('urgent', 'Urgent')}</span>
          </div>
          <div className="py-1 px-3 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700/40 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <Calendar size={14} />
            <span>{t('not_urgent', 'Not Urgent')}</span>
          </div>
        </div>

        {/* 2x2 Matrix Quadrants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {/* Quadrant: Urgent (Urgent & Important) */}
          <QuadrantContainer
            id="urgent_important"
            title={t('quadrant_1_title', 'Urgent')}
            subtitle={t('quadrant_1_desc', 'Urgent & Important: Crises, pressing deadlines, and critical problems')}
            icon={<Flame size={16} className="text-rose-500" />}
            tasks={quadrantTasks.q1}
            headerBg="bg-rose-500/10"
            borderColor="border-rose-400/30 dark:border-rose-500/30"
            badgeBg="bg-rose-500/20"
            badgeText="text-rose-700 dark:text-rose-300"
            projectsMap={projectsMap}
            onTaskClick={handleOpenTask}
            onAddTask={handleCreateTaskInQuadrant}
            onOpenInProject={handleOpenInProject}
          />

          {/* Quadrant: Plan (Not Urgent & Important) */}
          <QuadrantContainer
            id="not_urgent_important"
            title={t('quadrant_2_title', 'Plan')}
            subtitle={t('quadrant_2_desc', 'Important, Not Urgent: Planning, deep work, relationships, self-growth')}
            icon={<Star size={16} className="text-blue-500 fill-blue-500" />}
            tasks={quadrantTasks.q2}
            headerBg="bg-blue-500/10"
            borderColor="border-blue-400/30 dark:border-blue-500/30"
            badgeBg="bg-blue-500/20"
            badgeText="text-blue-700 dark:text-blue-300"
            projectsMap={projectsMap}
            onTaskClick={handleOpenTask}
            onAddTask={handleCreateTaskInQuadrant}
            onOpenInProject={handleOpenInProject}
          />

          {/* Quadrant: Delegate (Urgent & Not Important) */}
          <QuadrantContainer
            id="urgent_not_important"
            title={t('quadrant_3_title', 'Delegate')}
            subtitle={t('quadrant_3_desc', 'Urgent, Not Important: Interruptions, minor requests, administrative tasks')}
            icon={<Clock size={16} className="text-amber-500" />}
            tasks={quadrantTasks.q3}
            headerBg="bg-amber-500/10"
            borderColor="border-amber-400/30 dark:border-amber-500/30"
            badgeBg="bg-amber-500/20"
            badgeText="text-amber-700 dark:text-amber-300"
            projectsMap={projectsMap}
            onTaskClick={handleOpenTask}
            onAddTask={handleCreateTaskInQuadrant}
            onOpenInProject={handleOpenInProject}
          />

          {/* Quadrant: Later (Neither) */}
          <QuadrantContainer
            id="not_urgent_not_important"
            title={t('quadrant_4_title', 'Later')}
            subtitle={t('quadrant_4_desc', 'Neither: Time wasters, backlog items, non-essential activities')}
            icon={<Coffee size={16} className="text-slate-500" />}
            tasks={quadrantTasks.q4}
            headerBg="bg-slate-500/10"
            borderColor="border-slate-300/40 dark:border-slate-700/40"
            badgeBg="bg-slate-500/20"
            badgeText="text-slate-700 dark:text-slate-300"
            projectsMap={projectsMap}
            onTaskClick={handleOpenTask}
            onAddTask={handleCreateTaskInQuadrant}
            onOpenInProject={handleOpenInProject}
          />
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
            <div className="w-64 opacity-90 scale-105 rotate-1">
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
