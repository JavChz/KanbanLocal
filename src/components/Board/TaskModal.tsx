import React, { useState, useEffect, useRef } from 'react';
import type { Task } from '../../types/kanban';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Select } from '../ui/Select';
import { useKanbanStore } from '../../store/useKanbanStore';
import { Trash2, Archive, ArchiveRestore, Maximize2, Minimize2, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TaskTagsEditor } from './TaskTagsEditor';
import { TaskLinksEditor } from './TaskLinksEditor';
import { TaskDescriptionEditor } from './TaskDescriptionEditor';

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

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kanban_task_modal_expanded') === 'true';
    } catch (_e) {
      void _e;
      return false;
    }
  });

  const [modalStyle, setModalStyle] = useState<React.CSSProperties | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kanban_task_modal_expanded', String(next));
      } catch (_e) {
        void _e;
      }
      return next;
    });
  };

  // Keyboard shortcut to toggle expand/collapse (Alt + F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key.toLowerCase() === 'f' || e.key === 'Enter')) {
        e.preventDefault();
        toggleExpanded();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        onClick={toggleExpanded}
        className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--project-color,#3b82f6)] hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex items-center justify-center"
        title={isExpanded ? `${t('collapse_view', 'Collapse view')} (Alt+F)` : `${t('expand_view', 'Expand view')} (Alt+F)`}
      >
        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
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
    ...(!isExpanded ? modalStyle : undefined),
    ...(projectColorVar ? { '--project-color': projectColorVar } : {}),
  } as React.CSSProperties;

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={t('task_details')}
        style={combinedStyle}
        size={isExpanded ? '2xl' : 'md'}
        className={isExpanded ? 'h-[88vh] max-h-[88vh] flex flex-col' : ''}
        contentClassName={isExpanded ? 'flex-1 min-h-0 flex flex-col' : ''}
        headerActions={headerActions}
      >
        {isExpanded ? (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 text-left">
            {/* Primary Writing Area: Title & Complex Description */}
            <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto pr-1">
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
                required
              />

              <TaskDescriptionEditor
                value={description}
                onChange={setDescription}
                isExpanded={true}
                onToggleExpand={toggleExpanded}
                onSave={handleSave}
                placeholder={t('task_description')}
              />
            </div>

            {/* Sidebar Metadata & Quick Markdown Reference */}
            <div className="w-full md:w-80 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-200/70 dark:border-slate-800/70 pt-4 md:pt-0 md:pl-5 shrink-0 overflow-y-auto">
              <Select
                label={t('project')}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />

              <Input
                label={t('deadline') || 'Deadline'}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />

              <TaskTagsEditor tags={tags} onChangeTags={setTags} />

              <TaskLinksEditor links={links} onChangeLinks={setLinks} />

              {/* Markdown Guide Box */}
              <div className="rounded-xl p-3 bg-slate-100/60 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/70 text-2xs text-slate-500 dark:text-slate-400">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BookOpen size={12} className="text-[var(--project-color,#3b82f6)]" />
                  <span>{t('markdown_cheatsheet', 'Markdown Formatting')}</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] leading-relaxed">
                  <div>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">- [ ]</span> Checklist item
                  </div>
                  <div>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">**bold**</span> or <span className="text-slate-700 dark:text-slate-200 font-semibold">*italic*</span>
                  </div>
                  <div>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">###</span> Section heading
                  </div>
                  <div>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">`code`</span> or ```block```
                  </div>
                  <div>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">&gt;</span> Blockquote
                  </div>
                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="flex justify-end gap-2 mt-auto pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                <Button type="button" variant="secondary" onClick={onClose}>
                  {t('cancel')}
                </Button>
                <Button type="button" variant="primary" onClick={handleSave}>
                  {t('save')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
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
            <TaskDescriptionEditor
              value={description}
              onChange={setDescription}
              isExpanded={false}
              onToggleExpand={toggleExpanded}
              onSave={handleSave}
              placeholder={t('task_description')}
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
        )}
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
