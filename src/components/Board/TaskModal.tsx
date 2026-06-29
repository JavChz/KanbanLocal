import React, { useState, useEffect, useRef } from 'react';
import type { Task } from '../../types/kanban';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Select } from '../ui/Select';
import { useKanbanStore } from '../../store/useKanbanStore';
import { Trash2, Plus, X, Link2, Tag, ExternalLink, Archive, ArchiveRestore } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  clickedTaskRect?: { top: number; left: number; width: number; height: number } | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose, clickedTaskRect }) => {
  const { t } = useTranslation();
  const { updateTask, deleteTask, projects } = useKanbanStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');

  const [newTag, setNewTag] = useState('');
  const [newLink, setNewLink] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [modalStyle, setModalStyle] = useState<React.CSSProperties | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);

  // Populate state when task is loaded
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setTags(task.tags || []);
      setLinks(task.links || []);
      setDeadline(task.deadline || '');
      setProjectId(task.projectId || '');
    }
  }, [task, isOpen]);

  useEffect(() => {
    if (isOpen && clickedTaskRect && contentRef.current) {
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
  }, [isOpen, clickedTaskRect, task, tags, links]);

  if (!task) return null;

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

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const handleArchive = () => {
    updateTask(task.id, { archived: !task.archived });
    onClose();
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = newTag.trim();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLink = newLink.trim();
    if (cleanLink && !links.includes(cleanLink)) {
      // Basic protocol check
      let formattedLink = cleanLink;
      if (!/^https?:\/\//i.test(cleanLink)) {
        formattedLink = `https://${cleanLink}`;
      }
      setLinks([...links, formattedLink]);
      setNewLink('');
    }
  };

  const handleRemoveLink = (indexToRemove: number) => {
    setLinks(links.filter((_, idx) => idx !== indexToRemove));
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
        onClick={handleDelete}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex items-center justify-center"
        title={t('delete')}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('task_details')}
        style={modalStyle}
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
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag size={13} />
            {t('tags')}
          </label>
          <div className="flex flex-wrap gap-1.5 mb-1 max-h-24 overflow-y-auto">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  className="hover:text-red-500 rounded-full cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder={t('add_tag')}
              className="glass-input flex-1 px-3 py-1.5 rounded-lg text-xs"
            />
            <Button type="submit" variant="secondary" size="sm">
              <Plus size={14} />
            </Button>
          </form>
        </div>

        {/* Links Section */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Link2 size={13} />
            {t('links')}
          </label>
          <div className="space-y-1.5 max-h-24 overflow-y-auto mb-1">
            {links.map((link, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30"
              >
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 truncate pr-2"
                >
                  <ExternalLink size={11} className="flex-shrink-0" />
                  <span className="truncate">{link}</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(idx)}
                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddLink} className="flex gap-2">
            <input
              type="text"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="example.com"
              className="glass-input flex-1 px-3 py-1.5 rounded-lg text-xs"
            />
            <Button type="submit" variant="secondary" size="sm">
              <Plus size={14} />
            </Button>
          </form>
        </div>

        {/* Modal Action Footer */}
        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
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
