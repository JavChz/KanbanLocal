import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { ColorPicker } from '../ui/ColorPicker';
import { Button } from '../ui/Button';
import { getRandomProjectColor } from '../../utils/projectUtils';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (data: {
    name: string;
    color: string;
    customId?: string;
    description?: string;
    deadline?: string;
  }) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [color, setColor] = useState(getRandomProjectColor);
  const [customId, setCustomId] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  const resetForm = () => {
    setName('');
    setColor(getRandomProjectColor());
    setCustomId('');
    setDescription('');
    setDeadline('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateProject({
      name: name.trim(),
      color,
      customId: customId.trim() || undefined,
      description: description.trim() || undefined,
      deadline: deadline.trim() || undefined,
    });
    resetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('add_project')}
      overflowVisible={true}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
        <div className="flex items-end gap-2.5">
          <div className="flex-1">
            <Input
              label={t('project_name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Personal Errands"
              required
              autoFocus
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

        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="primary">
            {t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
