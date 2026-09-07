import React, { useState, useEffect, useRef } from 'react';
import type { Task } from '../../types/kanban';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Select } from '../ui/Select';
import { useKanbanStore } from '../../store/useKanbanStore';
import { Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TaskTagsEditor } from './TaskTagsEditor';
import { TaskLinksEditor } from './TaskLinksEditor';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  clickedTaskRect?: { top: number; left: number; width: number; height: number } | null;
}

interface TaskModalContentProps {
  task: Task;
  onClose: () => void;
  clickedTaskRect?: { top: number; left: number; width: number; height: number } | null;
}

const TaskModalContent: React.FC<TaskModalContentProps> = ({
  task,
  onClose,
  clickedTaskRect,
}) => {
  const { t } = useTranslation();
  const { updateTask, deleteTask, projects } = useKanbanStore();

  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [projectId, setProjectId] = useState(task.projectId || '');
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [links, setLinks] = useState<string[]>(task.links || []);
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [modalStyle, setModalStyle] = useState<React.CSSProperties | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clickedTaskRect && contentRef.current) {
      const estimatedHeight = contentRef.current.offsetHeight + 80;
      const estimatedWidth = Math.max(340, clickedTaskRect.width);

      let top = clickedTaskRect.top;
      let left = clickedTaskRect.left;

      if (left + estimatedWidth > window.innerWidth) {
        left = window.innerWidth - estimatedWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }

      if (top + estimatedHeight > window.innerHeight) {
        top = window.innerHeight - estimatedHeight - 16;
      }
      if (top < 16) {
        top = 16;
      }

      setModalStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${estimatedWidth}px`,
        maxWidth: 'none',
        margin: 0,
      });
    } else {
      setModalStyle(undefined);
    }
  }, [clickedTaskRect, tags, links]);

  const handleSave = () => {
    if (!title.trim()) return;
    updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      tags,
      links,
      deadline: deadline.trim() || undefined,
      projectId,
    });
    onClose();
  };

  const handleConfirmDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const handleArchive = () => {
    updateTask(task.id, { archived: !task.archived });
    onClose();
  };

  const headerActions = (
    <div className="flex items-center gap-1 mr-1">
      <button
        type="button"
        onClick={handleArchive}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
          task.archived
            ? 'text-green-600 hover:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20'
            : 'text-slate-400 hover:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
        }`}
        title={task.archived ? t('unarchive') : t('archive')}
      >
        {task.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
      </button>
      <button
        type="button"
        onClick={() => setIsDeleteConfirmOpen(true)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex items-center justify-center"
        title={t('delete')}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const project = projects.find((p) => p.id === projectId);
  const projectColorVar = project ? `var(--color-${project.color})` : undefined;

  const combinedStyle: React.CSSProperties = {
    ...modalStyle,
    ...(projectColorVar ? { '--project-color': projectColorVar } : {}),
  } as React.CSSProperties;

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={t('task_details')}
        style={combinedStyle}
        headerActions={headerActions}
      >
        <div ref={contentRef} className="flex flex-col gap-5 text-left">
          {/* Task Title */}
          <Input
            label={t('task_title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('task_title')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            autoFocus
            required
          />

          {/* Task Description */}
          <Textarea
            label={t('task_description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('task_description')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSave();
              }
            }}
            rows={4}
          />

          {/* Project Selection */}
          <Select
            label={t('project')}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={projects.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
          />

          {/* Task Deadline */}
          <Input
            label={t('deadline') || 'Deadline'}
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          {/* Tags Section */}
          <TaskTagsEditor tags={tags} onChangeTags={setTags} />

          {/* Links Section */}
          <TaskLinksEditor links={links} onChangeLinks={setLinks} />

          {/* Modal Action Footer */}
          <div className="flex justify-end gap-2 mt-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="button" variant="primary" onClick={handleSave}>
              {t('save')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('delete')}
        message={t('confirm_delete_task')}
        confirmText={t('delete')}
      />
    </>
  );
};

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  clickedTaskRect,
}) => {
  if (!isOpen || !task) return null;

  return (
    <TaskModalContent
      key={task.id}
      task={task}
      onClose={onClose}
      clickedTaskRect={clickedTaskRect}
    />
  );
};
