import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { ColorPicker } from '../ui/ColorPicker';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ProjectBackgroundSelector } from './ProjectBackgroundSelector';
import { Trash2 } from 'lucide-react';
import type { Project, ProjectBackground } from '../../types/kanban';

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
  onDelete: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const { t } = useTranslation();

  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color);
  const [bgType, setBgType] = useState<ProjectBackground['type']>(project.background?.type || 'theme');
  const [bgValue, setBgValue] = useState(project.background?.value || '');
  const [customId, setCustomId] = useState(project.customId || '');
  const [description, setDescription] = useState(project.description || '');
  const [deadline, setDeadline] = useState(project.deadline || '');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
  }

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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('edit_project')}
        overflowVisible={true}
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

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsDeleteConfirmOpen(true)}
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

      {/* Delete Project Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete();
        }}
        title={t('delete_project')}
        message={t('confirm_delete_project')}
        confirmText={t('delete')}
      />
    </>
  );
};
