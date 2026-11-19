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
  const hasBgImage =
    project.background && (project.background.type === 'image' || project.background.type === 'custom');
  const archivedCount = useKanbanStore((state) =>
    state.tasks.filter((t) => t.projectId === project.id && t.archived).length
  );

  return (
    <div
      className={`px-5 py-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 transition-colors duration-200 ${
        hasBgImage ? 'board-header-glass' : 'glass-panel'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorStyles.bg}`} />
        <div className="flex flex-col min-w-0 text-left">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 truncate">
              {project.name}
            </h2>
            {project.customId && project.customId.trim() && (
              <span className="px-1.5 py-0.5 rounded text-3xs font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-white/8 shrink-0">
                {project.customId}
              </span>
            )}
          </div>
          {project.description && project.description.trim() && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {project.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {onPrioritize && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onPrioritize}
            title={t('prioritize_toast', 'Tasks sorted by priority: Urgent at top, Later at bottom.')}
            className="flex items-center gap-1.5 group"
          >
            <ArrowDownWideNarrow
              size={14}
              className="text-slate-500 dark:text-slate-400 group-hover:text-[var(--project-color,var(--color-blue-500))] transition-colors"
            />
            <span>{t('prioritizer', 'Sort by Priority')}</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenArchive}
          className="flex items-center gap-1.5"
        >
          <Archive size={14} className="text-slate-500 dark:text-slate-400" />
          <span>{t('see_archive')}</span>
          {archivedCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-3xs font-mono font-semibold tabular-nums bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
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
          <Edit size={14} className="text-slate-500 dark:text-slate-400" />
          <span>{t('edit_project')}</span>
        </Button>
      </div>
    </div>
  );
};
