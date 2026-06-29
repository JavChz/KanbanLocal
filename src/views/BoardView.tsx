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
import { ConfirmModal } from '../components/ui/ConfirmModal';
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
import { Edit, Trash2, Check } from 'lucide-react';
import { getColorStyles } from '../utils/colors';
import { BACKGROUND_IMAGES } from '../components/Layout/Layout';

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
  const [clickedTaskRect, setClickedTaskRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Project Edit fields
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('blue-500');
  const [editBgType, setEditBgType] = useState<'theme' | 'solid' | 'image' | 'custom'>('theme');
  const [editBgValue, setEditBgValue] = useState('');

  // Update lastOpenedProject on mount/id change
  useEffect(() => {
    if (id && project) {
      setLastOpenedProject(id);
      setEditName(project.name);
      setEditColor(project.color);
      setEditBgType(project.background?.type || 'theme');
      setEditBgValue(project.background?.value || '');
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

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setClickedTaskRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveProjectDetails = () => {
    if (!editName.trim()) return;
    updateProject(id, editName.trim(), editColor, { type: editBgType, value: editBgValue });
    setIsEditProjectOpen(false);
  };

  const handleDeleteProjectDetails = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteProject = () => {
    deleteProject(id);
    navigate('/');
  };

  const colorStyles = getColorStyles(project.color);
  const hasBgImage = project.background && (project.background.type === 'image' || project.background.type === 'custom');

  return (
    <div
      className="flex flex-col gap-6 h-full animate-fade-in"
      style={{ '--project-color': `var(--color-${project.color})` } as React.CSSProperties}
    >
      
      {/* Board Header Banner */}
      <div className={`p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 ${
        hasBgImage
          ? 'board-header-glass'
          : `border ${colorStyles.border} ${colorStyles.bgLight}`
      }`}>
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
        clickedTaskRect={clickedTaskRect}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
          setClickedTaskRect(null);
        }}
      />

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        title={t('edit_project')}
        overflowVisible={true}
      >
        <div className="flex flex-col gap-5 text-left">
          <div className="flex items-end gap-2.5">
            <div className="flex-1">
              <Input
                label={t('project_name')}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t('project_name')}
                required
              />
            </div>
            <ColorPicker
              value={editColor}
              onChange={setEditColor}
            />
          </div>

          {/* Background Selection Section */}
          <div className="flex flex-col gap-3.5 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
              {t('project_background') || 'Project Background'}
            </label>
            
            {/* Segmented control for Type */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40">
              {(['theme', 'solid', 'image', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setEditBgType(type);
                    if (type === 'theme') {
                      setEditBgValue('');
                    } else if (type === 'solid' && !editBgValue.startsWith('#')) {
                      setEditBgValue('#3b82f6');
                    } else if (type === 'image' && !['cat', 'cocodrile', 'fields', 'moon', 'sunset', 'sunshines'].includes(editBgValue)) {
                      setEditBgValue('sunset');
                    } else if (type === 'custom' && editBgValue.startsWith('#')) {
                      setEditBgValue('');
                    }
                  }}
                  className={`py-1.5 px-1 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    editBgType === type
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250'
                  }`}
                >
                  {type === 'theme' && (t('theme') || 'Theme')}
                  {type === 'solid' && (t('solid') || 'Solid')}
                  {type === 'image' && (t('image') || 'Image')}
                  {type === 'custom' && (t('custom') || 'URL')}
                </button>
              ))}
            </div>

            {/* Sub-inputs based on Type */}
            {editBgType === 'theme' && (
              <p className="text-2xs text-slate-500 dark:text-slate-450 italic">
                {t('reset_bg_desc')}
              </p>
            )}

            {editBgType === 'solid' && (
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-xs hover:scale-105 active:scale-95 transition-all">
                  <input
                    type="color"
                    value={editBgValue.startsWith('#') ? editBgValue : '#3b82f6'}
                    onChange={(e) => setEditBgValue(e.target.value)}
                    className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={editBgValue}
                    onChange={(e) => setEditBgValue(e.target.value)}
                    placeholder="#3b82f6"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {editBgType === 'image' && (
              <div className="flex flex-col gap-2.5 animate-fade-in">
                <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto p-0.5">
                  {Object.entries(BACKGROUND_IMAGES).map(([name, url]) => {
                    const isSelected = editBgValue === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setEditBgValue(name)}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-205 active:scale-95 shadow-xs group ${
                          isSelected
                            ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                        }`}
                        title={name}
                      >
                        <img
                          src={url}
                          alt={name}
                          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:opacity-90"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/60 py-0.5 text-center">
                          <span className="text-4xs font-bold text-white uppercase tracking-wider truncate block px-0.5">
                            {name}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-xs">
                            <Check size={8} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Unsplash Profile link */}
                <p className="text-2xs text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap mt-0.5">
                  <span>{t('unsplash_profile_hint')}</span>
                  <a
                    href="https://unsplash.com/@javchz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 dark:text-blue-450 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>@javchz</span>
                  </a>
                </p>
              </div>
            )}

            {editBgType === 'custom' && (
              <div className="flex flex-col gap-2 animate-fade-in">
                <Input
                  label={t('custom_img_url')}
                  value={editBgValue}
                  onChange={(e) => setEditBgValue(e.target.value)}
                  placeholder={t('custom_img_placeholder')}
                  required
                />
                {editBgValue && (
                  <div className="mt-1 rounded-xl border border-slate-200/50 dark:border-slate-800/30 p-1.5 bg-slate-100/50 dark:bg-slate-900/30 flex items-center justify-center max-h-[120px] overflow-hidden">
                    <img
                      src={editBgValue}
                      alt={t('url_preview')}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="max-h-[100px] rounded-lg object-contain"
                    />
                  </div>
                )}
                {/* Unsplash Profile credit */}
                <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                  <span>{t('unsplash_profile_credit')}</span>
                  <a
                    href="https://unsplash.com/@javchz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 dark:text-blue-450 hover:underline"
                  >
                    Unsplash (@javchz)
                  </a>
                </p>
              </div>
            )}
          </div>

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

      {/* Delete Project Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteProject}
        title={t('delete_project')}
        message={t('confirm_delete_project')}
        confirmText={t('delete')}
      />

    </div>
  );
};
