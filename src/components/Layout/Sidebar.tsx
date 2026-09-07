import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../../store/useKanbanStore';
import type { Project } from '../../types/kanban';
import { Home, Globe, Settings, Kanban, Plus, Circle, ChevronLeft, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getColorStyles } from '../../utils/colors';
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
  isActive: boolean;
  onSelect: () => void;
}

const SortableSidebarProject: React.FC<SortableSidebarProjectProps> = ({
  project,
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
        onSelect();
      }}
      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
        isActive
          ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/55 dark:hover:bg-slate-800/40'
      } ${isDragging ? 'shadow-sm ring-1 ring-blue-500/30' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Circle size={8} className={`fill-current ${colorStyles.text} shrink-0`} />
        <span className="truncate flex-1">{project.name}</span>
      </div>
      <GripVertical
        size={13}
        className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-60 transition-opacity shrink-0 ml-1"
      />
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
  const { projects, reorderProjects } = useKanbanStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const match = location.pathname.match(/^\/project\/([^/]+)/);
  const activeProjectId = match ? match[1] : null;

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
    { to: '/', icon: <Home size={18} />, label: t('home'), end: true },
    { to: '/global', icon: <Globe size={18} />, label: t('global_view') },
  ];

  const handleCreateProjectClick = () => {
    onCloseSidebar();
    navigate('/?action=new-project');
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 w-64 glass-panel border-r border-slate-200/50 dark:border-slate-800/30 z-50 transform transition-all duration-300 md:sticky md:top-0 md:h-screen flex flex-col overflow-hidden ${
        isSidebarOpen
          ? 'translate-x-0 w-64'
          : isSidebarCollapsed
          ? '-translate-x-full md:w-0 md:opacity-0 md:pointer-events-none md:border-r-0'
          : '-translate-x-full md:translate-x-0 md:w-64 md:opacity-100'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Kanban size={22} className="text-blue-500" />
          <span className="font-bold text-slate-800 dark:text-slate-50 text-lg tracking-wide">
            {t('app_title')}
          </span>
        </div>
        <button
          onClick={onCollapseSidebar}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/55 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          aria-label="Collapse Sidebar"
          title="Collapse Sidebar"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Main Links */}
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/55 dark:hover:bg-slate-800/40'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Projects Submenu */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('projects')}
            </span>
            <button
              onClick={handleCreateProjectClick}
              className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
              title={t('add_project')}
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
              <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                {projects.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-2 italic">
                    {t('no_projects')}
                  </p>
                ) : (
                  projects.map((proj) => (
                    <SortableSidebarProject
                      key={proj.id}
                      project={proj}
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

            <DragOverlay>
              {activeSidebarProject ? (
                <div className="drag-overlay-pill flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm shadow-2xl ring-1 ring-blue-500/40 scale-105 select-none pointer-events-none w-52">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Circle
                      size={8}
                      className={`fill-current ${getColorStyles(activeSidebarProject.color).text} shrink-0`}
                    />
                    <span className="truncate flex-1 font-semibold">{activeSidebarProject.name}</span>
                  </div>
                  <GripVertical size={13} className="text-slate-400 shrink-0" />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/30">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 hover:bg-slate-200/55 dark:hover:bg-slate-800/40 text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-200 active:scale-97 cursor-pointer"
          title={t('settings')}
        >
          <Settings size={14} className="text-slate-500 dark:text-slate-400" />
          <span>{t('settings')}</span>
        </button>
      </div>
    </aside>
  );
};
