import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../../store/useKanbanStore';
import type { Project } from '../../types/kanban';
import { Home, Globe, Settings, Plus, Circle, ChevronLeft, GripVertical, Layers, ArrowRight } from 'lucide-react';
import { AppLogo } from '../ui/AppLogo';
import { useTranslation } from 'react-i18next';
import { getColorStyles, resolveProjectColorVar } from '../../utils/colors';
import { useDragStore } from '../../store/useDragStore';
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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableSidebarProjectProps {
  project: Project;
  taskCount: number;
  isActive: boolean;
  onSelect: () => void;
}

const SortableSidebarProject: React.FC<SortableSidebarProjectProps> = ({
  project,
  taskCount,
  isActive,
  onSelect,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const { t } = useTranslation();
  const isHovered = useDragStore((s) => s.hoveredProjectId === project.id);
  const isTaskDragging = useDragStore((s) => !!s.draggedTaskId);
  const sourceProjectId = useDragStore((s) => s.draggedTaskSourceProjectId);
  const isDropTarget = isTaskDragging && sourceProjectId !== project.id;

  const colorStyles = getColorStyles(project.color);

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
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
      data-project-drop-id={project.id}
      onPointerEnter={() => {
        if (isDropTarget) {
          useDragStore.getState().setHoveredProject(project.id);
        }
      }}
      onPointerLeave={() => {
        if (isDropTarget && useDragStore.getState().hoveredProjectId === project.id) {
          useDragStore.getState().setHoveredProject(null);
        }
      }}
      onPointerUp={() => {
        if (isDropTarget) {
          useDragStore.getState().setHoveredProject(project.id);
        }
      }}
      onClick={(e) => {
        if (transform && (Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3)) {
          e.preventDefault();
          return;
        }
        onSelect();
      }}
      className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition-colors duration-150 cursor-grab active:cursor-grabbing select-none ${
        isHovered
          ? 'ring-1 ring-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold shadow-xs'
          : isDropTarget
          ? 'border border-dashed border-slate-400/50 dark:border-slate-600/60 bg-slate-500/[0.04] hover:bg-blue-500/10 text-slate-700 dark:text-slate-300'
          : isActive
          ? 'bg-slate-900/[0.07] dark:bg-white/[0.09] text-slate-950 dark:text-white font-medium shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.04]'
      } ${isDragging ? 'shadow-sm ring-1 ring-blue-500/30' : ''}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Circle size={8} className={`fill-current ${colorStyles.text} shrink-0`} />
        <span className="truncate flex-1">{project.name}</span>
      </div>
      {isHovered ? (
        <span className="flex items-center gap-1 text-2xs font-semibold text-blue-600 dark:text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded-md shrink-0 ml-1">
          <ArrowRight size={10} />
          {t('drop_to_move', 'Move')}
        </span>
      ) : (
        <div className="relative flex items-center justify-end w-6 shrink-0 ml-1">
          <span className="text-2xs font-mono tabular-nums text-slate-400 dark:text-slate-500 group-hover:opacity-0 transition-opacity duration-150">
            {taskCount}
          </span>
          <GripVertical
            size={13}
            className="absolute right-0 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-75 transition-opacity duration-150"
          />
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  onCloseSidebar: () => void;
  onCollapseSidebar: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  isSidebarCollapsed,
  onCloseSidebar,
  onCollapseSidebar,
  onOpenSettings,
}) => {
  const { projects, tasks, reorderProjects } = useKanbanStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const match = location.pathname.match(/^\/project\/([^/]+)/);
  const activeProjectId = match ? match[1] : null;
  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId)
    : null;

  const projectAccentColor = resolveProjectColorVar(activeProject?.color);

  const taskCountsByProject = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      if (!task.archived) {
        counts.set(task.projectId, (counts.get(task.projectId) ?? 0) + 1);
      }
    }
    return counts;
  }, [tasks]);

  const [activeSidebarId, setActiveSidebarId] = useState<string | null>(null);
  const activeSidebarProject = activeSidebarId
    ? projects.find((p) => p.id === activeSidebarId)
    : null;

  const sidebarSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSidebarDragStart = (event: DragStartEvent) => {
    setActiveSidebarId(event.active.id as string);
  };

  const handleSidebarDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSidebarId(null);
    if (over && active.id !== over.id) {
      reorderProjects(active.id as string, over.id as string);
    }
  };

  const navItems = [
    { to: '/', icon: <Home size={16} />, label: t('home'), end: true },
    { to: '/global', icon: <Globe size={16} />, label: t('global_view') },
    { to: '/matrix', icon: <Layers size={16} />, label: t('eisenhower_matrix', 'Eisenhower Matrix') },
  ];

  const handleCreateProjectClick = () => {
    onCloseSidebar();
    navigate('/?action=new-project');
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 w-64 glass-panel border-r border-slate-200/70 dark:border-white/8 z-[var(--z-drawer)] transform transition-[width,transform,opacity] duration-200 ease-[var(--ease-out-expo)] md:sticky md:top-0 md:h-screen flex flex-col overflow-hidden ${
        isSidebarOpen
          ? 'translate-x-0 w-64'
          : isSidebarCollapsed
          ? '-translate-x-full md:w-0 md:opacity-0 md:pointer-events-none md:border-r-0'
          : '-translate-x-full md:translate-x-0 md:w-64 md:opacity-100'
      }`}
    >
      {/* Fixed-width inner wrapper prevents text wrapping/squishing during collapse */}
      <div className="w-64 min-w-[16rem] h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-slate-200/70 dark:border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppLogo
              size={22}
              accentColor={projectAccentColor}
              className="shadow-xs flex-shrink-0 transition-all duration-200"
              style={
                projectAccentColor
                  ? {
                      boxShadow: `0 2px 8px color-mix(in srgb, ${projectAccentColor} 28%, transparent)`,
                    }
                  : undefined
              }
            />
            <span className="font-semibold text-slate-900 dark:text-slate-50 text-[15px] tracking-tight">
              {t('app_title')}
            </span>
          </div>
          <button
            type="button"
            onClick={onCollapseSidebar}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            aria-label="Collapse Sidebar"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={17} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
          {/* Main Links */}
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors duration-150 ${
                    isActive
                      ? 'bg-slate-900/[0.07] dark:bg-white/[0.09] text-slate-950 dark:text-white font-semibold shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Projects Submenu */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('projects')}
              </span>
              <button
                type="button"
                onClick={handleCreateProjectClick}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                title={t('add_project')}
                aria-label={t('add_project')}
              >
                <Plus size={14} />
              </button>
            </div>

            <DndContext
              sensors={sidebarSensors}
              collisionDetection={closestCenter}
              onDragStart={handleSidebarDragStart}
              onDragEnd={handleSidebarDragEnd}
            >
              <SortableContext
                items={projects.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0.5">
                  {projects.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 italic">
                      {t('no_projects')}
                    </p>
                  ) : (
                    projects.map((proj) => (
                      <SortableSidebarProject
                        key={proj.id}
                        project={proj}
                        taskCount={taskCountsByProject.get(proj.id) ?? 0}
                        isActive={activeProjectId === proj.id}
                        onSelect={() => {
                          onCloseSidebar();
                          navigate(`/project/${proj.id}`);
                        }}
                      />
                    ))
                  )}
                </div>
              </SortableContext>

              <DragOverlay
                dropAnimation={{
                  duration: 180,
                  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {activeSidebarProject ? (
                  <div className="drag-overlay-pill flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-[13px] shadow-xl ring-1 ring-blue-500/35 select-none pointer-events-none w-56">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Circle
                        size={8}
                        className={`fill-current ${getColorStyles(activeSidebarProject.color).text} shrink-0`}
                      />
                      <span className="truncate flex-1 font-medium">{activeSidebarProject.name}</span>
                    </div>
                    <GripVertical size={13} className="text-slate-400 shrink-0" />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200/70 dark:border-white/8">
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05] text-xs font-medium transition-colors duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            title={t('settings')}
          >
            <Settings size={15} className="text-slate-500 dark:text-slate-400 shrink-0" />
            <span>{t('settings')}</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-mono text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-white/5 border border-slate-300/50 dark:border-white/10">
              Ctrl+Alt+S
            </kbd>
          </button>
        </div>
      </div>
    </aside>
  );
};
