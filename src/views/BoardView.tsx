import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useKanbanStore } from '../store/useKanbanStore';
import type { Task, TaskStatus } from '../types/kanban';
import { Column } from '../components/Board/Column';
import { TaskModal } from '../components/Board/TaskModal';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ColorPicker } from '../components/ui/ColorPicker';
import { Button } from '../components/ui/Button';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { getColorStyles } from '../utils/colors';

export const BoardView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  } = useKanbanStore();

  const project = projects.find((p) => p.id === id);

  // Modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Project Edit fields
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('blue-500');

  // Update lastOpenedProject on mount/id change
  useEffect(() => {
    if (id && project) {
      setLastOpenedProject(id);
      setEditName(project.name);
      setEditColor(project.color);
    } else if (id && !project) {
      // If project doesn't exist, reset last opened and redirect to home
      setLastOpenedProject(null);
      navigate('/', { replace: true });
    }
  }, [id, project, setLastOpenedProject, navigate]);

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

  if (!project || !id) return null;

  // Filter tasks for this project
  const projectTasks = tasks.filter((t) => t.projectId === id);

  // Group tasks by status
  const tasksByStatus = {
    TODO: projectTasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: projectTasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: projectTasks.filter((t) => t.status === 'DONE'),
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
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

  const handleDragEnd = () => {
    setActiveId(null);
  };

  const handleAddNewTask = (title: string, status: TaskStatus) => {
    addTask({
      title,
      status,
      projectId: id,
      description: '',
      tags: [],
      links: [],
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveProjectDetails = () => {
    if (!editName.trim()) return;
    updateProject(id, editName.trim(), editColor);
    setIsEditProjectOpen(false);
  };

  const handleDeleteProjectDetails = () => {
    if (window.confirm(t('confirm_delete_project'))) {
      deleteProject(id);
      navigate('/');
    }
  };

  const colorStyles = getColorStyles(project.color);

  return (
    <div className="flex flex-col gap-6 h-full animate-fade-in">
      
      {/* Board Header Banner */}
      <div className={`p-6 rounded-2xl border ${colorStyles.border} ${colorStyles.bgLight} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full ${colorStyles.bg}`} />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {project.name}
          </h2>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsEditProjectOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Edit size={14} />
          {t('edit_project')}
        </Button>
      </div>

      {/* Board Drag and Drop Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex flex-col md:flex-row gap-6 items-start overflow-x-auto pb-4">
          <Column
            status="TODO"
            title={t('todo')}
            tasks={tasksByStatus.TODO}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddNewTask}
          />
          <Column
            status="IN_PROGRESS"
            title={t('in_progress')}
            tasks={tasksByStatus.IN_PROGRESS}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddNewTask}
          />
          <Column
            status="DONE"
            title={t('done')}
            tasks={tasksByStatus.DONE}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddNewTask}
          />
        </div>
        {createPortal(
          <DragOverlay>
            {activeId ? (
              <div className="glass-card p-4.5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 shadow-xl border-blue-500/50 scale-[1.03] rotate-[1.5deg] cursor-grabbing select-none opacity-90">
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
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
      />

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        title={t('edit_project')}
      >
        <div className="flex flex-col gap-5 text-left">
          <Input
            label={t('project_name')}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={t('project_name')}
            required
          />

          <ColorPicker
            label={t('project_color')}
            value={editColor}
            onChange={setEditColor}
          />

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteProjectDetails}
              className="flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              {t('delete')}
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditProjectOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveProjectDetails}
              >
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};
