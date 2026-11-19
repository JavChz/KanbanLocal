import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useKanbanStore } from '../store/useKanbanStore';
import type { Task, TaskStatus, ProjectBackground } from '../types/kanban';
import { Column } from '../components/Board/Column';
import { TaskCardVisual } from '../components/Board/TaskCard';
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
import { resolveProjectColorVar } from '../utils/colors';

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
    moveAndReorderTask,
    updateProject,
    deleteProject,
    updateTask,
    prioritizeTasks,
  } = useKanbanStore();

  const project = projects.find((p) => p.id === id);

  // Modal states
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCardWidth, setActiveCardWidth] = useState<number | undefined>(undefined);

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === id && !t.archived),
    [tasks, id]
  );

  // Derive task modal selection cleanly from either explicit click or ?task= param
  const taskIdParam = searchParams.get('task');
  const hasMatchingParamTask = Boolean(
    taskIdParam && projectTasks.some((t) => t.id === taskIdParam)
  );
  const effectiveTaskId = isTaskModalOpen ? selectedTaskId : hasMatchingParamTask ? taskIdParam : null;
  const effectiveTaskModalOpen = isTaskModalOpen || hasMatchingParamTask;
  const selectedTask = effectiveTaskId ? tasks.find((t) => t.id === effectiveTaskId) ?? null : null;

  // Update lastOpenedProject on mount/id change
  useEffect(() => {
    if (id && project) {
      setLastOpenedProject(id);
    } else if (id && !project) {
      setLastOpenedProject(null);
      navigate('/', { replace: true });
    }
  }, [id, project, setLastOpenedProject, navigate]);

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

  const lastCoordRef = React.useRef<{ x: number; y: number } | null>(null);

  // Track pointer while dragging to detect hover over sidebar projects
  useEffect(() => {
    if (!activeId) return;

    const getProjectIdAtPoint = (x: number, y: number): string | null => {
      if (typeof document.elementsFromPoint !== 'function') {
        const el = document.elementFromPoint(x, y);
        return (
          el?.getAttribute('data-project-drop-id') ||
          el?.closest('[data-project-drop-id]')?.getAttribute('data-project-drop-id') ||
          null
        );
      }
      const elements = document.elementsFromPoint(x, y);
      for (const el of elements) {
        const projId =
          el.getAttribute('data-project-drop-id') ||
          el.closest('[data-project-drop-id]')?.getAttribute('data-project-drop-id');
        if (projId) return projId;
      }
      return null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      lastCoordRef.current = { x: e.clientX, y: e.clientY };
      const targetProjectId = getProjectIdAtPoint(e.clientX, e.clientY);
      const validDropTargetId = targetProjectId && targetProjectId !== id ? targetProjectId : null;

      if (validDropTargetId !== useDragStore.getState().hoveredProjectId) {
        useDragStore.getState().setHoveredProject(validDropTargetId);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      lastCoordRef.current = { x: e.clientX, y: e.clientY };
      const targetProjectId = getProjectIdAtPoint(e.clientX, e.clientY);
      const validDropTargetId = targetProjectId && targetProjectId !== id ? targetProjectId : null;
      if (validDropTargetId) {
        useDragStore.getState().setHoveredProject(validDropTargetId);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { capture: true, passive: true });
    window.addEventListener('pointerup', handlePointerUp, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
    };
  }, [activeId, id]);

  if (!project || !id) return null;

  const tasksByStatus = {
    TODO: projectTasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: projectTasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: projectTasks.filter((t) => t.status === 'DONE'),
  };

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    setActiveId(taskId);
    setActiveCardWidth(event.active.rect.current.initial?.width);
    useDragStore.getState().setDraggedTask(taskId, id);
  };

  // Only perform cross-column transitions in onDragOver to avoid same-column jitter on taller cards
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;
    if (activeTaskId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    const isOverColumn = overId === 'TODO' || overId === 'IN_PROGRESS' || overId === 'DONE';
    const targetStatus: TaskStatus | undefined = isOverColumn
      ? (overId as TaskStatus)
      : tasks.find((t) => t.id === overId)?.status;

    if (targetStatus && activeTask.status !== targetStatus) {
      moveAndReorderTask(activeTaskId, overId, id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const getProjectIdAtPoint = (x: number, y: number): string | null => {
      if (typeof document.elementsFromPoint !== 'function') {
        const el = document.elementFromPoint(x, y);
        return (
          el?.getAttribute('data-project-drop-id') ||
          el?.closest('[data-project-drop-id]')?.getAttribute('data-project-drop-id') ||
          null
        );
      }
      const elements = document.elementsFromPoint(x, y);
      for (const el of elements) {
        const projId =
          el.getAttribute('data-project-drop-id') ||
          el.closest('[data-project-drop-id]')?.getAttribute('data-project-drop-id');
        if (projId) return projId;
      }
      return null;
    };

    let targetProjectId = useDragStore.getState().hoveredProjectId;

    if (!targetProjectId && lastCoordRef.current) {
      const candidateId = getProjectIdAtPoint(lastCoordRef.current.x, lastCoordRef.current.y);
      if (candidateId && candidateId !== id) {
        targetProjectId = candidateId;
      }
    }

    if (!targetProjectId && event.activatorEvent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawEvent = (event.activatorEvent as any).nativeEvent || event.activatorEvent;
      if (typeof rawEvent.clientX === 'number') {
        const dropX = rawEvent.clientX + (event.delta?.x || 0);
        const dropY = rawEvent.clientY + (event.delta?.y || 0);
        const candidateId = getProjectIdAtPoint(dropX, dropY);
        if (candidateId && candidateId !== id) {
          targetProjectId = candidateId;
        }
      }
    }

    const currentTaskId = activeId || useDragStore.getState().draggedTaskId;

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
    } else if (event.over && event.active.id !== event.over.id) {
      moveAndReorderTask(event.active.id as string, event.over.id as string, id);
    }

    setActiveId(null);
    setActiveCardWidth(undefined);
    lastCoordRef.current = null;
    useDragStore.getState().clearDrag();
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveCardWidth(undefined);
    lastCoordRef.current = null;
    useDragStore.getState().clearDrag();
  };

  const handleAddNewTask = (title: string, status: TaskStatus, position?: 'top' | 'bottom') => {
    addTask(
      {
        title,
        status,
        projectId: id,
        description: '',
        tags: [],
        links: [],
      },
      position
    );
  };

  const handleArchiveAllDone = () => {
    const doneTasks = tasks.filter((t) => t.projectId === id && t.status === 'DONE' && !t.archived);
    if (doneTasks.length === 0) return;

    const archivedIds = doneTasks.map((t) => t.id);
    archivedIds.forEach((taskId) => {
      updateTask(taskId, { archived: true });
    });

    toast.info(t('archived_count', { count: archivedIds.length }), {
      duration: 5000,
      action: {
        label: t('unarchive', 'Restore'),
        onClick: () => {
          archivedIds.forEach((taskId) => {
            updateTask(taskId, { archived: false });
          });
        },
      },
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
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
    setSelectedTaskId(null);
    if (searchParams.has('task')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('task');
      setSearchParams(newParams, { replace: true });
    }
  };

  const handlePrioritizeBoard = () => {
    prioritizeTasks(id);
  };

  const handlePrioritizeColumn = (status: TaskStatus) => {
    prioritizeTasks(id, status);
  };

  const activeOverlayTask = activeId ? tasks.find((t) => t.id === activeId) : null;
  const projectColorVar = resolveProjectColorVar(project.color);

  return (
    <div
      className="flex flex-col gap-5 h-full animate-fade-in"
      style={projectColorVar ? ({ '--project-color': projectColorVar } as React.CSSProperties) : undefined}
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
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 flex flex-col md:flex-row gap-5 w-full items-stretch md:items-start overflow-x-auto pb-4">
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
          <DragOverlay
            zIndex={80}
            dropAnimation={{
              duration: 180,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="pointer-events-none"
            style={{ pointerEvents: 'none' }}
          >
            {activeOverlayTask ? (
              <div
                style={{
                  ...(activeCardWidth ? { width: `${activeCardWidth}px` } : {}),
                  ...(projectColorVar ? { '--project-color': projectColorVar } : {}),
                } as React.CSSProperties}
              >
                <TaskCardVisual task={activeOverlayTask} isOverlay />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* Task Details Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={effectiveTaskModalOpen}
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
          setSelectedTaskId(task.id);
          setIsTaskModalOpen(true);
        }}
      />
    </div>
  );
};
