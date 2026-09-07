import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../store/useKanbanStore';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getColorStyles } from '../utils/colors';
import { getProjectStatus, getRelativeTimeString } from '../utils/projectUtils';
import { HomeStats } from '../components/Home/HomeStats';
import { ProjectCardContent, SortableProjectCard } from '../components/Home/ProjectCard';
import { CreateProjectModal } from '../components/Home/CreateProjectModal';
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
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProjectId(null);
    if (over && active.id !== over.id) {
      reorderProjects(active.id as string, over.id as string);
    }
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
      <HomeStats tasks={tasks} />

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
            {/* Render Active Projects with SortableContext */}
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

            {/* Create Project Card (placed at the end) */}
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
          </div>

          <DragOverlay>
            {activeProject ? (
              <div
                className={`drag-overlay-card h-48 w-80 p-5 rounded-2xl flex flex-col justify-between text-left border-l-4 ${
                  getColorStyles(activeProject.color).border
                } shadow-2xl scale-105 rotate-1 pointer-events-none relative overflow-hidden select-none`}
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
          </DragOverlay>
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
