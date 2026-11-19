import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../store/useKanbanStore';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getProjectStatus, getRelativeTimeString } from '../utils/projectUtils';
import { HomeStats } from '../components/Home/HomeStats';
import { ProjectCardContent, SortableProjectCard } from '../components/Home/ProjectCard';
import { CreateProjectModal } from '../components/Home/CreateProjectModal';
import { Button } from '../components/ui/Button';
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
} from '@dnd-kit/sortable';

export const HomeView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, tasks, addProject, reorderProjects } = useKanbanStore();

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeCardWidth, setActiveCardWidth] = useState<number | undefined>(undefined);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentTime] = useState(() => Date.now());

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
    setActiveCardWidth(event.active.rect.current.initial?.width);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProjectId(null);
    setActiveCardWidth(undefined);
    if (over && active.id !== over.id) {
      reorderProjects(active.id as string, over.id as string);
    }
  };

  const handleDragCancel = () => {
    setActiveProjectId(null);
    setActiveCardWidth(undefined);
  };

  // Trigger project creation modal if action=new-project query parameter is found
  useEffect(() => {
    if (location.search.includes('action=new-project')) {
      setTimeout(() => setIsCreateOpen(true), 0);
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);

  const handleCreateProject = (data: {
    name: string;
    color: string;
    customId?: string;
    description?: string;
    deadline?: string;
  }) => {
    const newId = addProject(
      data.name,
      data.color,
      data.customId,
      data.description,
      data.deadline
    );
    setIsCreateOpen(false);
    navigate(`/project/${newId}`);
  };

  return (
    <div className="flex flex-col gap-6 h-full animate-fade-in">
      {/* Compact Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {t('home')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {t('home_desc')}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 self-start sm:self-center shrink-0"
        >
          <Plus size={15} />
          <span>{t('add_project')}</span>
        </Button>
      </div>

      {/* Compact Workspace Metrics Strip */}
      <HomeStats tasks={tasks} />

      {/* Projects Section */}
      <div className="flex flex-col gap-3.5 text-left">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('your_boards')}
        </h3>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <SortableContext items={projects.map((p) => p.id)} strategy={rectSortingStrategy}>
              {projects.map((proj) => (
                <SortableProjectCard
                  key={proj.id}
                  project={proj}
                  tasks={tasks}
                  status={getProjectStatus(proj, tasks, currentTime)}
                  relativeTime={getRelativeTimeString(proj.updatedAt, currentTime, t)}
                  onOpen={() => navigate(`/project/${proj.id}`)}
                />
              ))}
            </SortableContext>

            {/* Create Project Card */}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="min-h-[168px] border border-dashed border-slate-300 dark:border-white/12 hover:border-blue-500/70 dark:hover:border-blue-400/70 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors duration-150 hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.03] group active:scale-[0.99]"
            >
              <div className="p-2.5 rounded-full bg-slate-200/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                <Plus size={18} />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t('add_project')}
              </span>
            </button>
          </div>

          {createPortal(
            <DragOverlay
              zIndex={80}
              dropAnimation={{
                duration: 180,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {activeProject ? (
                <div
                  style={activeCardWidth ? { width: `${activeCardWidth}px` } : { width: '320px' }}
                  className="drag-overlay-card min-h-[168px] p-4.5 rounded-xl flex flex-col justify-between text-left shadow-2xl ring-1 ring-blue-500/35 rotate-[1deg] pointer-events-none relative overflow-hidden select-none"
                >
                  <ProjectCardContent
                    project={activeProject}
                    tasks={tasks}
                    status={getProjectStatus(activeProject, tasks, currentTime)}
                    relativeTime={getRelativeTimeString(activeProject.updatedAt, currentTime, t)}
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
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};
