import React from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Edit } from 'lucide-react';
import { Button } from '../ui/Button';
import { getColorStyles } from '../../utils/colors';
import type { Project } from '../../types/kanban';

interface BoardHeaderProps {
  project: Project;
  onOpenArchive: () => void;
  onOpenEdit: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  project,
  onOpenArchive,
  onOpenEdit,
}) => {
  const { t } = useTranslation();
  const colorStyles = getColorStyles(project.color);
  const hasBgImage = project.background && (project.background.type === 'image' || project.background.type === 'custom');

  return (
    <div
      className={`p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 ${
        hasBgImage ? 'board-header-glass' : 'glass-panel'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3.5 h-3.5 rounded-full ${colorStyles.bg}`} />
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {project.name}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenArchive}
          className="flex items-center gap-1.5"
        >
          <Archive size={14} />
          {t('see_archive')}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenEdit}
          className="flex items-center gap-1.5"
        >
          <Edit size={14} />
          {t('edit_project')}
        </Button>
      </div>
    </div>
  );
};
