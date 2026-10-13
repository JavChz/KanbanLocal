import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useKanbanStore } from '../store/useKanbanStore';
import type { Task, TaskStatus, ProjectBackground } from '../types/kanban';
import { Column } from '../components/Board/Column';
import { TaskModal } from '../components/Board/TaskModal';
import { BoardHeader } from '../components/Board/BoardHeader';
import { EditProjectModal } from '../components/Board/EditProjectModal';
import { ProjectArchiveModal } from '../components/Board/ProjectArchiveModal';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { useDragStore } from '../store/useDragStore';
import { toast } from '../store/useToastStore';

export const BoardView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const {
    tasks,
    projects,
    setLastOpenedProject,
    addTask,
    moveTask,
    moveAndReorderTask,
    updateProject,
    deleteProject,
    updateTask,
    prioritizeTasks,
  } = useKanbanStore();

  const project = projects.find((p) => p.id === id);

  // Modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Filter tasks for this project
  const projectTasks = tasks.filter((t) => t.projectId === id && !t.archived);

  // Update lastOpenedProject on mount/id change
  useEffect(() => {
    if (id && project) {
      setLastOpenedProject(id);
    } else if (id && !project) {
      // If project doesn't exist, reset last opened and redirect to home
      setLastOpenedProject(null);
      navigate('/', { replace: true });
    }
  }, [id, project, setLastOpenedProject, navigate]);

  // Pre-open task modal if `task` query parameter is present
  useEffect(() => {
    const taskIdParam = searchParams.get('task');
    if (taskIdParam && projectTasks.length > 0) {
      const taskToOpen = projectTasks.find((t) => t.id === taskIdParam);
      if (taskToOpen) {
        setTimeout(() => {
          setSelectedTask(taskToOpen);
          setIsTaskModalOpen(true);
        }, 0);
      }
    }
  }, [searchParams, projectTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px drag threshold allows normal clicks to pass through
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Track pointer while dragging to detect hover over sidebar projects
  useEffect(() => {
    if (!activeId) return;

    const handlePointerMove = (e: PointerEvent) => {
      const element = document.elementFromPoint(e.clientX, e.clientY);
      const projectEl = element?.closest('[data-project-drop-id]');
      const targetProjectId = projectEl?.getAttribute('data-project-drop-id') || null;

      // Only mark as drop target if it's a different project than current board
      const validDropTargetId = targetProjectId && targetProjectId !== id ? targetProjectId : null;

      if (validDropTargetId !== useDragStore.getState().hoveredProjectId) {
        useDragStore.getState().setHoveredProject(validDropTargetId);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [activeId, id]);

  // If project doesn't exist, return early (all hooks have been called)
  if (!project || !id) return null;

  // Group tasks by status
  const tasksByStatus = {
    TODO: projectTasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: projectTasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: projectTasks.filter((t) => t.status === 'DONE'),
  };

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    setActiveId(taskId);
    if (id) {
      useDragStore.getState().setDraggedTask(taskId, id);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const isOverColumn = overId === 'TODO' || overId === 'IN_PROGRESS' || overId === 'DONE';

    if (isOverColumn) {
      const overStatus = overId as TaskStatus;
      if (activeTask.status !== overStatus) {
        moveTask(activeId, overStatus);
      }
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        moveAndReorderTask(activeId, overId, id);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    let targetProjectId = useDragStore.getState().hoveredProjectId;

    // Fallback: calculate drop coordinates from activatorEvent + delta if pointermove didn't catch final coordinate
    if (!targetProjectId && event.activatorEvent && 'clientX' in event.activatorEvent) {
      const pe = event.activatorEvent as PointerEvent;
      const dropX = pe.clientX + event.delta.x;
      const dropY = pe.clientY + event.delta.y;
      const element = document.elementFromPoint(dropX, dropY);
      const projectEl = element?.closest('[data-project-drop-id]');
      const candidateId = projectEl?.getAttribute('data-project-drop-id') || null;
      if (candidateId && candidateId !== id) {
        targetProjectId = candidateId;
      }
    }

    const currentTaskId = activeId;

    if (currentTaskId && targetProjectId && targetProjectId !== id) {
      const targetProject = projects.find((p) => p.id === targetProjectId);
      const taskToMove = tasks.find((t) => t.id === currentTaskId);

      if (targetProject && taskToMove) {
        updateTask(currentTaskId, { projectId: targetProjectId });
        toast.success(
          t('task_moved_to_project', { task: taskToMove.title, project: targetProject.name }),
          {
            action: {
              label: t('view', 'View'),
              onClick: () => navigate(`/project/${targetProjectId}`),
            },
          }
        );
      }
    }

    setActiveId(null);
    useDragStore.getState().clearDrag();
  };

  const handleAddNewTask = (title: string, status: TaskStatus, position?: 'top' | 'bottom') => {
    addTask({
      title,
      status,
      projectId: id,
      description: '',
      tags: [],
      links: [],
    }, position);
  };

  const handleArchiveAllDone = () => {
    const doneTasks = tasks.filter((t) => t.projectId === id && t.status === 'DONE' && !t.archived);
    doneTasks.forEach((t) => {
      updateTask(t.id, { archived: true });
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveProject = (data: {
    name: string;
    color: string;
    background: ProjectBackground;
    customId?: string;
    description?: string;
    deadline?: string;
  }) => {
    updateProject(
      id,
      data.name,
      data.color,
      data.background,
      data.customId,
      data.description,
      data.deadline
    );
  };

  const handleDeleteProject = (transferToProjectId?: string) => {
    deleteProject(id, transferToProjectId);
    navigate('/');
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    if (searchParams.has('task')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('task');
      setSearchParams(newParams, { replace: true });
    }
  };

  const handlePrioritizeBoard = () => {
    if (!id) return;
    prioritizeTasks(id);
  };

  const handlePrioritizeColumn = (status: TaskStatus) => {
    if (!id) return;
    prioritizeTasks(id, status);
  };

  return (
    <div
      className="flex flex-col gap-6 h-full animate-fade-in"
      style={{ '--project-color': `var(--color-${project.color})` } as React.CSSProperties}
    >
      {/* Board Header Banner */}
      <BoardHeader
        project={project}
        onOpenArchive={() => setIsArchiveOpen(true)}
        onOpenEdit={() => setIsEditProjectOpen(true)}
        onPrioritize={handlePrioritizeBoard}
      />

      {/* Board Drag and Drop Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex flex-col md:flex-row gap-6 w-full items-stretch md:items-start overflow-x-auto pb-4">
          <Column
            status="TODO"
            title={t('todo')}
            tasks={tasksByStatus.TODO}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddNewTask}
            onPrioritize={() => handlePrioritizeColumn('TODO')}
          />
          <Column
            status="IN_PROGRESS"
            title={t('in_progress')}
            tasks={tasksByStatus.IN_PROGRESS}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddNewTask}
            onPrioritize={() => handlePrioritizeColumn('IN_PROGRESS')}
          />
          <Column
            status="DONE"
            title={t('done')}
            tasks={tasksByStatus.DONE}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddNewTask}
            onArchiveAllDone={handleArchiveAllDone}
            onPrioritize={() => handlePrioritizeColumn('DONE')}
          />
        </div>

        {createPortal(
          <DragOverlay>
            {activeId ? (
              <div className="glass-card p-4.5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 shadow-xl border-blue-500/50 scale-[1.03] rotate-[1.5deg] cursor-grabbing select-none opacity-90 pointer-events-none">
                {tasks.find((t) => t.id === activeId)?.title}
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
        onClose={handleCloseTaskModal}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        project={project}
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
      />

      {/* Project Archive Modal */}
      <ProjectArchiveModal
        projectId={id}
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onSelectTask={(task) => {
          setSelectedTask(task);
          setIsTaskModalOpen(true);
        }}
      />
    </div>
  );
};
