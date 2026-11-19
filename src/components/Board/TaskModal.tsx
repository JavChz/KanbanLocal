import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, TaskPriority } from '../../types/kanban';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Select } from '../ui/Select';
import { useKanbanStore } from '../../store/useKanbanStore';
import { toast } from '../../store/useToastStore';
import {
  Trash2,
  Archive,
  ArchiveRestore,
  Maximize2,
  Minimize2,
  BookOpen,
  Check,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveProjectColorVar } from '../../utils/colors';
import { TaskTagsEditor } from './TaskTagsEditor';
import { TaskLinksEditor } from './TaskLinksEditor';
import { TaskDescriptionEditor } from './TaskDescriptionEditor';
import { TaskPrioritySelector } from './TaskPrioritySelector';

const TEXT_AUTOSAVE_DEBOUNCE_MS = 400;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'invalid_title';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TaskModalContentProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const TaskModalContent: React.FC<TaskModalContentProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { updateTask, deleteTask, projects } = useKanbanStore();

  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [projectId, setProjectId] = useState(task.projectId || '');
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [links, setLinks] = useState<string[]>(task.links || []);
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority || 'none');
  const [isUrgent, setIsUrgent] = useState<boolean>(
    task.isUrgent ?? (task.priority === 'urgent_important' || task.priority === 'urgent_not_important')
  );
  const [isImportant, setIsImportant] = useState<boolean>(
    task.isImportant ?? (task.priority === 'urgent_important' || task.priority === 'not_urgent_important')
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const taskIdRef = useRef(task.id);
  const updateTaskRef = useRef(updateTask);
  const debounceTimerRef = useRef<number | null>(null);
  const isDeletedRef = useRef(false);
  const hasSavedRef = useRef(false);
  const latestTextRef = useRef({
    title: task.title || '',
    description: task.description || '',
  });
  const lastSavedTextRef = useRef({
    title: (task.title || '').trim(),
    description: (task.description || '').trim(),
  });
  const lastSavedDeadlineRef = useRef<string | undefined>(
    (task.deadline || '').trim() || undefined
  );

  useEffect(() => {
    taskIdRef.current = task.id;
    updateTaskRef.current = updateTask;
  }, [task.id, updateTask]);

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kanban_task_modal_expanded') === 'true';
    } catch {
      return false;
    }
  });

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kanban_task_modal_expanded', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Keyboard shortcut to toggle expand/collapse (Alt + F)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key.toLowerCase() === 'f' || e.key === 'Enter')) {
        e.preventDefault();
        toggleExpanded();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const flushPendingTextSaves = useCallback((updateUiStatus = true) => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (isDeletedRef.current) return;

    const trimmedTitle = latestTextRef.current.title.trim();
    const trimmedDescription = latestTextRef.current.description.trim();

    const patch: Partial<Omit<Task, 'id'>> = {};
    if (trimmedTitle && trimmedTitle !== lastSavedTextRef.current.title) {
      patch.title = trimmedTitle;
    }
    if (trimmedDescription !== lastSavedTextRef.current.description) {
      patch.description = trimmedDescription;
    }

    if (Object.keys(patch).length > 0) {
      updateTaskRef.current(taskIdRef.current, patch);
      if (patch.title !== undefined) {
        lastSavedTextRef.current.title = patch.title;
      }
      if (patch.description !== undefined) {
        lastSavedTextRef.current.description = patch.description;
      }
      hasSavedRef.current = true;
      if (updateUiStatus) {
        setSaveStatus(trimmedTitle ? 'saved' : 'invalid_title');
      }
    } else if (updateUiStatus) {
      if (!trimmedTitle) {
        setSaveStatus('invalid_title');
      } else {
        setSaveStatus(hasSavedRef.current ? 'saved' : 'idle');
      }
    }
  }, []);

  const scheduleTextSave = useCallback(() => {
    if (isDeletedRef.current) return;

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const trimmedTitle = latestTextRef.current.title.trim();
    const trimmedDescription = latestTextRef.current.description.trim();
    const hasTitleChange = Boolean(trimmedTitle) && trimmedTitle !== lastSavedTextRef.current.title;
    const hasDescriptionChange = trimmedDescription !== lastSavedTextRef.current.description;

    if (!trimmedTitle) {
      setSaveStatus('invalid_title');
      if (hasDescriptionChange) {
        debounceTimerRef.current = window.setTimeout(
          () => flushPendingTextSaves(true),
          TEXT_AUTOSAVE_DEBOUNCE_MS
        );
      }
      return;
    }

    if (!hasTitleChange && !hasDescriptionChange) {
      setSaveStatus(hasSavedRef.current ? 'saved' : 'idle');
      return;
    }

    setSaveStatus('saving');
    debounceTimerRef.current = window.setTimeout(
      () => flushPendingTextSaves(true),
      TEXT_AUTOSAVE_DEBOUNCE_MS
    );
  }, [flushPendingTextSaves]);

  const markImmediateSaved = useCallback(() => {
    hasSavedRef.current = true;
    if (!latestTextRef.current.title.trim()) {
      setSaveStatus('invalid_title');
    } else if (debounceTimerRef.current === null) {
      setSaveStatus('saved');
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleUnload = () => flushPendingTextSaves(false);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [isOpen, flushPendingTextSaves]);

  useEffect(() => {
    return () => flushPendingTextSaves(false);
  }, [flushPendingTextSaves]);

  const handleClose = () => {
    flushPendingTextSaves(false);
    onClose();
  };

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    latestTextRef.current.title = nextTitle;
    scheduleTextSave();
  };

  const handleDescriptionChange = (nextDescription: string, immediate = false) => {
    setDescription(nextDescription);
    latestTextRef.current.description = nextDescription;
    if (immediate) {
      flushPendingTextSaves(true);
    } else {
      scheduleTextSave();
    }
  };

  const handleProjectChange = (nextProjectId: string) => {
    if (nextProjectId === projectId) return;
    setProjectId(nextProjectId);
    updateTask(task.id, { projectId: nextProjectId });
    markImmediateSaved();
  };

  const handleDeadlineChange = (nextDeadline: string) => {
    setDeadline(nextDeadline);
    const normalized = nextDeadline.trim() || undefined;
    if (normalized !== lastSavedDeadlineRef.current) {
      updateTask(task.id, { deadline: normalized });
      lastSavedDeadlineRef.current = normalized;
      markImmediateSaved();
    }
  };

  const handlePriorityChange = (
    nextPriority: TaskPriority,
    nextUrgent: boolean,
    nextImportant: boolean
  ) => {
    setPriority(nextPriority);
    setIsUrgent(nextUrgent);
    setIsImportant(nextImportant);
    updateTask(task.id, {
      priority: nextPriority,
      isUrgent: nextUrgent,
      isImportant: nextImportant,
    });
    markImmediateSaved();
  };

  const handleTagsChange = (nextTags: string[]) => {
    setTags(nextTags);
    updateTask(task.id, { tags: nextTags });
    markImmediateSaved();
  };

  const handleLinksChange = (nextLinks: string[]) => {
    setLinks(nextLinks);
    updateTask(task.id, { links: nextLinks });
    markImmediateSaved();
  };

  const handleConfirmDelete = () => {
    isDeletedRef.current = true;
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    deleteTask(task.id);
    onClose();
  };

  const handleArchive = () => {
    flushPendingTextSaves(false);
    const previousArchived = Boolean(task.archived);
    const nextArchived = !previousArchived;
    updateTask(task.id, { archived: nextArchived });
    onClose();

    if (nextArchived) {
      toast.info(t('archived_count', { count: 1 }), {
        duration: 5000,
        action: {
          label: t('unarchive', 'Restore'),
          onClick: () => updateTask(task.id, { archived: previousArchived }),
        },
      });
    }
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
  const projectColorVar = resolveProjectColorVar(project?.color);
  const combinedStyle: React.CSSProperties = {
    ...(projectColorVar ? { '--project-color': projectColorVar } : {}),
  } as React.CSSProperties;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('task_details')}
        style={combinedStyle}
        size={isExpanded ? '2xl' : 'lg'}
        className={isExpanded ? 'h-[88vh]' : ''}
        contentClassName={isExpanded ? 'flex-1 min-h-0 flex flex-col' : 'flex-1 min-h-0 overflow-y-auto pr-1'}
        headerActions={headerActions}
      >
        {/* Single unified JSX tree preserves editor mode, scroll, and undo history on expand/collapse */}
        <div
          className={
            isExpanded
              ? 'flex-1 min-h-0 flex flex-col md:flex-row gap-6 text-left'
              : 'flex flex-col gap-5 text-left'
          }
        >
          {/* Primary Writing Area */}
          <div
            className={
              isExpanded
                ? 'flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto pr-1'
                : 'contents'
            }
          >
            <Input
              label={t('task_title')}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => flushPendingTextSaves(true)}
              placeholder={t('task_title')}
              error={!title.trim() ? t('title_required', 'Title is required') : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (title.trim()) {
                    handleClose();
                  }
                }
              }}
              autoFocus={!isExpanded}
              required
            />

            <TaskDescriptionEditor
              value={description}
              onChange={handleDescriptionChange}
              onBlur={() => flushPendingTextSaves(true)}
              isExpanded={isExpanded}
              onToggleExpand={toggleExpanded}
              onClose={handleClose}
              placeholder={t('task_description')}
            />
          </div>

          {/* Metadata & Actions Column */}
          <div
            className={
              isExpanded
                ? 'w-full md:w-80 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-200/70 dark:border-white/8 pt-4 md:pt-0 md:pl-5 shrink-0 overflow-y-auto'
                : 'contents'
            }
          >
            <Select
              label={t('project')}
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              options={projects.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />

            <Input
              label={t('deadline') || 'Deadline'}
              type="date"
              value={deadline}
              onChange={(e) => handleDeadlineChange(e.target.value)}
            />

            <TaskPrioritySelector
              priority={priority}
              isUrgent={isUrgent}
              isImportant={isImportant}
              onChange={handlePriorityChange}
            />

            <TaskTagsEditor tags={tags} onChangeTags={handleTagsChange} />

            <TaskLinksEditor links={links} onChangeLinks={handleLinksChange} />

            {isExpanded && (
              <div className="rounded-xl p-3 bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/8 text-2xs text-slate-500 dark:text-slate-400">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BookOpen size={12} className="text-[var(--project-color,#3b82f6)]" />
                  <span>{t('markdown_cheatsheet', 'Markdown Formatting')}</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] leading-relaxed">
                  <div>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">- [ ]</span> Checklist item
                  </div>
                  <div>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">**bold**</span> or{' '}
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">*italic*</span>
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
            )}

            <div
              className={
                isExpanded
                  ? 'flex items-center justify-between gap-3 mt-auto pt-3 border-t border-slate-200/70 dark:border-white/8'
                  : 'sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-3 pb-1 border-t border-slate-200/70 dark:border-white/8 flex items-center justify-between gap-3 shrink-0 z-10 mt-2'
              }
            >
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 text-xs font-medium min-h-[20px]"
              >
                {saveStatus === 'saving' && (
                  <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <LoaderCircle size={13} className="motion-safe:animate-spin shrink-0" />
                    <span>{t('saving', 'Saving...')}</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Check size={13} className="shrink-0" />
                    <span>{t('saved', 'Saved')}</span>
                  </span>
                )}
                {saveStatus === 'invalid_title' && (
                  <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{t('title_required', 'Title is required')}</span>
                  </span>
                )}
                {saveStatus === 'idle' && (
                  <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400/70 shrink-0" aria-hidden="true" />
                    <span>{t('auto_save', 'Auto-save')}</span>
                  </span>
                )}
              </div>

              <Button type="button" variant="secondary" onClick={handleClose}>
                {t('close', 'Close')}
              </Button>
            </div>
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
}) => {
  const [cachedTask, setCachedTask] = useState<Task | null>(task);
  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [sessionKey, setSessionKey] = useState(0);

  if (task && task !== cachedTask) {
    setCachedTask(task);
  }

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setSessionKey((k) => k + 1);
    }
  }

  if (!cachedTask) return null;

  return (
    <TaskModalContent
      key={`${cachedTask.id}-${sessionKey}`}
      task={cachedTask}
      isOpen={isOpen && Boolean(task)}
      onClose={onClose}
    />
  );
};
