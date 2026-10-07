import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { ColorPicker } from '../ui/ColorPicker';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ProjectBackgroundSelector } from './ProjectBackgroundSelector';
import { Trash2, ArrowRightLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Project, ProjectBackground } from '../../types/kanban';
import { useKanbanStore } from '../../store/useKanbanStore';

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    color: string;
    background: ProjectBackground;
    customId?: string;
    description?: string;
    deadline?: string;
  }) => void;
  onDelete: (transferToProjectId?: string) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { projects, tasks, moveAllTasks } = useKanbanStore();

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const otherProjects = projects.filter((p) => p.id !== project.id);

  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color);
  const [bgType, setBgType] = useState<ProjectBackground['type']>(project.background?.type || 'theme');
  const [bgValue, setBgValue] = useState(project.background?.value || '');
  const [customId, setCustomId] = useState(project.customId || '');
  const [description, setDescription] = useState(project.description || '');
  const [deadline, setDeadline] = useState(project.deadline || '');

  // Transfer tasks in edit modal state
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [moveSuccessMessage, setMoveSuccessMessage] = useState<string>('');
  const [isMoveConfirmOpen, setIsMoveConfirmOpen] = useState(false);

  // Delete project confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTaskAction, setDeleteTaskAction] = useState<'move' | 'delete'>('move');
  const [deleteTransferTargetId, setDeleteTransferTargetId] = useState<string>('');

  // Sync state when project changes or modal opens
  const [prevProject, setPrevProject] = useState(project);
  if (project !== prevProject) {
    setPrevProject(project);
    setName(project.name);
    setColor(project.color);
    setBgType(project.background?.type || 'theme');
    setBgValue(project.background?.value || '');
    setCustomId(project.customId || '');
    setDescription(project.description || '');
    setDeadline(project.deadline || '');
    setTransferTargetId('');
    setMoveSuccessMessage('');
  }

  const effectiveDeleteTargetId = deleteTransferTargetId || (otherProjects[0]?.id ?? '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      color,
      background: { type: bgType, value: bgValue },
      customId: customId.trim() || undefined,
      description: description.trim() || undefined,
      deadline: deadline.trim() || undefined,
    });
    onClose();
  };

  const handleConfirmMoveAllTasks = () => {
    if (!transferTargetId) return;
    const targetProj = otherProjects.find((p) => p.id === transferTargetId);
    const count = projectTasks.length;
    moveAllTasks(project.id, transferTargetId);
    setIsMoveConfirmOpen(false);
    setMoveSuccessMessage(
      t('tasks_moved_success', {
        count,
        target: targetProj?.name || '',
      })
    );
    setTransferTargetId('');
    setTimeout(() => setMoveSuccessMessage(''), 4000);
  };

  const handleConfirmDeleteProject = () => {
    setIsDeleteConfirmOpen(false);
    const targetId =
      projectTasks.length > 0 && otherProjects.length > 0 && deleteTaskAction === 'move'
        ? effectiveDeleteTargetId
        : undefined;
    onDelete(targetId);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('edit_project')}
      >
        <div className="flex flex-col gap-5 text-left">
          <div className="flex items-end gap-2.5">
            <div className="flex-1">
              <Input
                label={t('project_name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('project_name')}
                required
              />
            </div>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('board_id') || 'Board ID / Code'}
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder={t('board_id_placeholder') || 'e.g., WRK-001-ALPHA'}
            />
            <Input
              label={t('deadline') || 'Deadline'}
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <Input
            label={t('description_label') || 'Description / Subtitle'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('description_placeholder') || 'e.g., Current Focus'}
          />

          {/* Background Selection Section */}
          <ProjectBackgroundSelector
            bgType={bgType}
            bgValue={bgValue}
            onChangeType={setBgType}
            onChangeValue={setBgValue}
          />

          {/* Transfer / Move All Tasks Section */}
          <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={14} className="text-blue-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('move_all_tasks', 'Move All Tasks')}
                </span>
              </div>
              <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {moveSuccessMessage && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>{moveSuccessMessage}</span>
              </div>
            )}

            {projectTasks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('no_tasks_to_move', 'This board has no tasks to move.')}
              </p>
            ) : otherProjects.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('no_other_boards', 'No other boards available.')}
              </p>
            ) : (
              <div className="flex items-center gap-2 pt-0.5">
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="flex-1 h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="">{t('select_target_board', 'Select target board...')}</option>
                  {otherProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!transferTargetId}
                  onClick={() => setIsMoveConfirmOpen(true)}
                  className="text-xs h-8 shrink-0 flex items-center gap-1.5"
                >
                  <ArrowRightLeft size={12} />
                  <span>{t('transfer_tasks', 'Transfer Tasks')}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setDeleteTaskAction('move');
                if (otherProjects.length > 0) {
                  setDeleteTransferTargetId(otherProjects[0].id);
                }
                setIsDeleteConfirmOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              {t('delete')}
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button type="button" variant="primary" onClick={handleSave}>
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Move All Tasks Modal */}
      <ConfirmModal
        isOpen={isMoveConfirmOpen}
        onClose={() => setIsMoveConfirmOpen(false)}
        onConfirm={handleConfirmMoveAllTasks}
        title={t('move_all_tasks', 'Move All Tasks')}
        message={t('confirm_move_all_tasks', {
          count: projectTasks.length,
          target: otherProjects.find((p) => p.id === transferTargetId)?.name || '',
        })}
        confirmText={t('move_all_tasks', 'Move All Tasks')}
        variant="warning"
      />

      {/* Delete Project Confirmation Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title={t('delete_project')}
      >
        <div className="flex flex-col gap-4 text-left">
          {/* Header Warning */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {t('delete_project')}
              </span>
              <p className="text-slate-600 dark:text-slate-300">
                {t('confirm_delete_project')}
              </p>
            </div>
          </div>

          {projectTasks.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('no_tasks_to_move', 'This board has no tasks.')}
            </p>
          ) : otherProjects.length === 0 ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              <p className="font-semibold">{t('board_has_tasks_warning', { count: projectTasks.length })}</p>
              <p className="mt-1">
                {t('no_other_boards', 'No other boards available.')} {t('confirm_delete_project')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('board_has_tasks_warning', { count: projectTasks.length })}
              </span>

              {/* Action Selection */}
              <div className="flex flex-col gap-2">
                {/* Option 1: Move tasks to another board */}
                <label
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    deleteTaskAction === 'move'
                      ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
                      : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="deleteTaskAction"
                      checked={deleteTaskAction === 'move'}
                      onChange={() => setDeleteTaskAction('move')}
                      className="text-blue-600"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {t('delete_board_option_move', { count: projectTasks.length })}
                    </span>
                  </div>

                  {deleteTaskAction === 'move' && (
                    <div className="pl-6 pt-1">
                      <select
                        value={effectiveDeleteTargetId}
                        onChange={(e) => setDeleteTransferTargetId(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                      >
                        {otherProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </label>

                {/* Option 2: Delete tasks */}
                <label
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                    deleteTaskAction === 'delete'
                      ? 'bg-red-500/10 border-red-500/40 ring-1 ring-red-500/30'
                      : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteTaskAction"
                    checked={deleteTaskAction === 'delete'}
                    onChange={() => setDeleteTaskAction('delete')}
                    className="text-red-600"
                  />
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                    {t('delete_board_option_delete', { count: projectTasks.length })}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDeleteProject}
            >
              {projectTasks.length > 0 && otherProjects.length > 0 && deleteTaskAction === 'move'
                ? t('delete_and_move', 'Delete Board & Move Tasks')
                : t('delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
