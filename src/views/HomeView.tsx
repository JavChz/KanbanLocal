import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../store/useKanbanStore';
import type { Project, Task } from '../types/kanban';
import { Plus, CheckCircle, Clock, Circle, ListTodo, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getColorStyles } from '../utils/colors';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ColorPicker } from '../components/ui/ColorPicker';
import { Button } from '../components/ui/Button';
import { BACKGROUND_IMAGES } from '../utils/backgrounds';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectCardContentProps {
  project: Project;
  tasks: Task[];
  status: 'ACTIVE' | 'LATE' | 'ON_TRACK';
  relativeTime: string;
  isOverlay?: boolean;
}

const ProjectCardContent: React.FC<ProjectCardContentProps> = ({
  project,
  tasks,
  status,
  relativeTime,
}) => {
  const { t } = useTranslation();
  const colorStyles = getColorStyles(project.color);
  const projTasks = tasks.filter((t) => t.projectId === project.id && !t.archived);
  const doneCount = projTasks.filter((t) => t.status === 'DONE').length;
  const projCompletionRate = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;
  const bgConfig = project.background;
  const isBgImage = bgConfig && (bgConfig.type === 'image' || bgConfig.type === 'custom');
  const imgUrl = bgConfig?.type === 'image'
    ? BACKGROUND_IMAGES[bgConfig.value]
    : bgConfig?.type === 'custom'
    ? bgConfig.value
    : null;

  let statusBadgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
  let statusText = t('active_status');
  let progressBarColor = colorStyles.bg;

  if (status === 'LATE') {
    statusBadgeClass = 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
    statusText = t('late');
    progressBarColor = 'bg-red-500 dark:bg-red-500';
  } else if (status === 'ON_TRACK') {
    statusBadgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
    statusText = t('on_track');
    progressBarColor = 'bg-emerald-500 dark:bg-emerald-400';
  }

  return (
    <>
      {isBgImage && imgUrl && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${imgUrl})`,
              opacity: 0.35,
            }}
          />
          <div className="absolute inset-0 bg-white/55 dark:bg-slate-900/70 backdrop-blur-[1px]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between h-full w-full">
        <div>
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Circle size={8} className={`fill-current ${colorStyles.text} shrink-0`} />
              <div className="min-w-0">
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 truncate pr-1" title={project.name}>
                  {project.name}
                </h4>
                {project.customId && project.customId.trim() && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider font-mono truncate leading-none mt-0.5">
                    ID: {project.customId}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${statusBadgeClass}`}>
                {statusText}
              </span>
              <span
                className="text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity p-0.5"
                title={t('drag_to_reorder')}
              >
                <GripVertical size={14} />
              </span>
            </div>
          </div>

          {project.description ? (
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-355 mt-2 line-clamp-1">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-2 italic">
              {t('none')}
            </p>
          )}

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5">
            <span>{projTasks.length} {t('tasks') || 'Tasks'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>{projCompletionRate}% {t('progress')}</span>
            <span>{doneCount} / {projTasks.length} Done</span>
          </div>

          <div className="w-full h-1.5 bg-slate-200/50 dark:bg-slate-850 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
              style={{ width: `${projCompletionRate}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-medium text-slate-500 dark:text-slate-405 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock size={11} className="shrink-0" />
              {relativeTime}
            </span>
            {project.deadline && (
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 px-1.5 py-0.5 rounded text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                {project.deadline}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

interface SortableProjectCardProps {
  project: Project;
  tasks: Task[];
  status: 'ACTIVE' | 'LATE' | 'ON_TRACK';
  relativeTime: string;
  onOpen: () => void;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({
  project,
  tasks,
  status,
  relativeTime,
  onOpen,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const colorStyles = getColorStyles(project.color);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (transform && (Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3)) {
          e.preventDefault();
          return;
        }
        onOpen();
      }}
      className={`h-48 glass-card p-5 rounded-2xl cursor-grab active:cursor-grabbing flex flex-col justify-between text-left border-l-4 ${
        colorStyles.border
      } hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group select-none ${
        isDragging ? 'shadow-md ring-1 ring-blue-500/30' : ''
      }`}
    >
      <ProjectCardContent
        project={project}
        tasks={tasks}
        status={status}
        relativeTime={relativeTime}
      />
    </div>
  );
};

const getRandomProjectColor = () => {
  const hues = ['slate', 'red', 'orange', 'amber', 'emerald', 'blue', 'indigo', 'violet'];
  const shades = ['400', '500', '600', '700', '800'];
  const randomHue = hues[Math.floor(Math.random() * hues.length)];
  const randomShade = shades[Math.floor(Math.random() * shades.length)];
  return `${randomHue}-${randomShade}`;
};

export const HomeView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects, tasks, addProject, reorderProjects } = useKanbanStore();

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const activeProject = activeProjectId ? projects.find((p) => p.id === activeProjectId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveProjectId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProjectId(null);
    if (over && active.id !== over.id) {
      reorderProjects(active.id as string, over.id as string);
    }
  };

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(getRandomProjectColor);
  const [newProjectCustomId, setNewProjectCustomId] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');

  const [currentTime] = useState(() => Date.now());
  const location = useLocation();

  // Trigger project creation modal if action=new-project query parameter is found
  React.useEffect(() => {
    if (location.search.includes('action=new-project')) {
      setTimeout(() => setIsCreateOpen(true), 0);
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const newId = addProject(
      newProjectName.trim(),
      newProjectColor,
      newProjectCustomId.trim() || undefined,
      newProjectDescription.trim() || undefined,
      newProjectDeadline.trim() || undefined
    );
    setNewProjectName('');
    setNewProjectColor(getRandomProjectColor());
    setNewProjectCustomId('');
    setNewProjectDescription('');
    setNewProjectDeadline('');
    setIsCreateOpen(false);
    navigate(`/project/${newId}`);
  };

  // Business Logic for Board Statuses
  const getProjectStatus = (proj: typeof projects[0]) => {
    if (!proj.deadline) {
      return 'ACTIVE';
    }
    const projTasks = tasks.filter((t) => t.projectId === proj.id && !t.archived);
    const hasUnfinishedTasks = projTasks.some((t) => t.status !== 'DONE') || projTasks.length === 0;

    const deadlineDate = new Date(proj.deadline + 'T23:59:59');
    const now = new Date(currentTime);

    if (now > deadlineDate && hasUnfinishedTasks) {
      return 'LATE';
    }
    return 'ON_TRACK';
  };

  // Relative time string helper
  const getRelativeTimeString = (timestamp?: number) => {
    if (!timestamp) return t('none');
    const diff = currentTime - timestamp;
    if (diff < 60000) {
      return t('just_now');
    }
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) {
      return t('minutes_ago', { count: minutes });
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return t('hours_ago', { count: hours });
    }
    const days = Math.floor(hours / 24);
    return t('days_ago', { count: days });
  };

  // Stats Calculations
  const activeTasks = tasks.filter((t) => !t.archived);
  const totalTasks = activeTasks.length;
  const backlogTasks = activeTasks.filter((t) => t.status === 'TODO').length;
  const inProgressTasks = activeTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedTasks = activeTasks.filter((t) => t.status === 'DONE').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 h-full animate-fade-in">
      
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col gap-2 text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50 md:text-4xl">
          {t('home')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          {t('home_desc')}
        </p>
      </div>

      {/* Premium Statistics Banner */}
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

      {/* Projects Section */}
      <div className="flex flex-col gap-4 text-left">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
          {t('your_boards')}
        </h3>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Project Card */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-48 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-slate-200/20 dark:hover:bg-slate-900/10 group active:scale-98"
            >
              <div className="p-3 rounded-full bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                <Plus size={22} />
              </div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                {t('add_project')}
              </span>
            </button>

            {/* Render Active Projects with SortableContext */}
            <SortableContext items={projects.map((p) => p.id)} strategy={rectSortingStrategy}>
              {projects.map((proj) => (
                <SortableProjectCard
                  key={proj.id}
                  project={proj}
                  tasks={tasks}
                  status={getProjectStatus(proj)}
                  relativeTime={getRelativeTimeString(proj.updatedAt)}
                  onOpen={() => navigate(`/project/${proj.id}`)}
                />
              ))}
            </SortableContext>
          </div>

          {createPortal(
            <DragOverlay>
              {activeProject ? (
                <div
                  className={`h-48 w-80 glass-card p-5 rounded-2xl flex flex-col justify-between text-left border-l-4 ${
                    getColorStyles(activeProject.color).border
                  } shadow-2xl scale-105 rotate-1 pointer-events-none relative overflow-hidden select-none`}
                >
                  <ProjectCardContent
                    project={activeProject}
                    tasks={tasks}
                    status={getProjectStatus(activeProject)}
                    relativeTime={getRelativeTimeString(activeProject.updatedAt)}
                    isOverlay
                  />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </div>

      {/* Create Project Dialog */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t('add_project')}
        overflowVisible={true}
      >
        <form onSubmit={handleCreateProject} className="flex flex-col gap-5 text-left">
          <div className="flex items-end gap-2.5">
            <div className="flex-1">
              <Input
                label={t('project_name')}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Personal Errands"
                required
                autoFocus
              />
            </div>
            <ColorPicker
              value={newProjectColor}
              onChange={setNewProjectColor}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('board_id') || 'Board ID / Code'}
              value={newProjectCustomId}
              onChange={(e) => setNewProjectCustomId(e.target.value)}
              placeholder={t('board_id_placeholder') || 'e.g., WRK-001-ALPHA'}
            />
            <Input
              label={t('deadline') || 'Deadline'}
              type="date"
              value={newProjectDeadline}
              onChange={(e) => setNewProjectDeadline(e.target.value)}
            />
          </div>

          <Input
            label={t('description_label') || 'Description / Subtitle'}
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            placeholder={t('description_placeholder') || 'e.g., Current Focus'}
          />

          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('create')}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
