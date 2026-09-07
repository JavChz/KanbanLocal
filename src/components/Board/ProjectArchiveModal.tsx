import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import { useKanbanStore } from '../../store/useKanbanStore';
import type { Task } from '../../types/kanban';

interface ProjectArchiveModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
}

export const ProjectArchiveModal: React.FC<ProjectArchiveModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onSelectTask,
}) => {
  const { t } = useTranslation();
  const { tasks, updateTask, deleteTask } = useKanbanStore();
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const archivedTasks = tasks.filter((t) => t.projectId === projectId && t.archived);

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('archive_title')}
      >
        <div className="flex flex-col gap-4 text-left max-h-[450px] overflow-y-auto pr-1">
          {archivedTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 italic">
              {t('no_archived_tasks')}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-850/40 transition-colors"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onSelectTask(task)}
                  >
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block truncate hover:text-blue-650 dark:hover:text-blue-400">
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-xs text-slate-550 dark:text-slate-400 block truncate mt-0.5">
                        {task.description}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => updateTask(task.id, { archived: false })}
                      className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400"
                      title={t('unarchive')}
                    >
                      <ArchiveRestore size={12} />
                      <span className="hidden sm:inline text-2xs">{t('unarchive')}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setTaskToDelete(task.id);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="flex items-center gap-1"
                      title={t('delete')}
                    >
                      <Trash2 size={12} />
                      <span className="hidden sm:inline text-2xs">{t('delete')}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Task Confirmation Modal from Archive */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('delete')}
        message={t('confirm_delete_task')}
        confirmText={t('delete')}
      />
    </>
  );
};
