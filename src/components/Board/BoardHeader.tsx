import React from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Edit, ArrowDownWideNarrow } from 'lucide-react';
import { Button } from '../ui/Button';
import { getColorStyles } from '../../utils/colors';
import { useKanbanStore } from '../../store/useKanbanStore';
import type { Project } from '../../types/kanban';

interface BoardHeaderProps {
  project: Project;
  onOpenArchive: () => void;
  onOpenEdit: () => void;
  onPrioritize?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  project,
  onOpenArchive,
  onOpenEdit,
  onPrioritize,
}) => {
  const { t } = useTranslation();
  const colorStyles = getColorStyles(project.color);
  const hasBgImage = project.background && (project.background.type === 'image' || project.background.type === 'custom');
  const archivedCount = useKanbanStore((state) =>
    state.tasks.filter((t) => t.projectId === project.id && t.archived).length
  );

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

      <div className="flex items-center gap-2 flex-wrap">
        {onPrioritize && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onPrioritize}
            title={t('prioritize_toast', 'Tasks sorted by priority: Urgent at top, Later at bottom.')}
            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 group cursor-pointer"
          >
            <ArrowDownWideNarrow size={14} className="text-blue-500 dark:text-blue-400 group-hover:-translate-y-0.5 transition-transform" />
            <span>{t('prioritizer', 'Sort by Priority')}</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenArchive}
          className="flex items-center gap-1.5"
        >
          <Archive size={14} />
          <span>{t('see_archive')}</span>
          {archivedCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-3xs font-bold bg-slate-200/90 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
              {archivedCount}
            </span>
          )}
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
