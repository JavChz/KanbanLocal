import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKanbanStore } from '../../../store/useKanbanStore';
import { getColorStyles } from '../../../utils/colors';
import { Button } from '../../ui/Button';
import { Circle, Download } from 'lucide-react';
import type { FeedbackState } from './SettingsFeedbackBanner';

interface ExportTabProps {
  onFeedback: (feedback: FeedbackState) => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({ onFeedback }) => {
  const { tasks, projects, language, lastOpenedProject } = useKanbanStore();
  const { t } = useTranslation();
  const [selectedExportBoardIds, setSelectedExportBoardIds] = useState<string[]>(() =>
    projects.map((p) => p.id)
  );

  const handleExportFiltered = () => {
    try {
      const selectedProjects = projects.filter((p) => selectedExportBoardIds.includes(p.id));
      const selectedTasks = tasks.filter((t) => selectedExportBoardIds.includes(t.projectId));
      const stateToExport = {
        projects: selectedProjects,
        tasks: selectedTasks,
        language,
        lastOpenedProject: selectedProjects.some((p) => p.id === lastOpenedProject)
          ? lastOpenedProject
          : null,
      };
      const stateString = JSON.stringify(stateToExport, null, 2);

      const blob = new Blob([stateString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kanbanlocal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onFeedback({ type: 'success', message: 'Backup exported successfully.' });
    } catch {
      onFeedback({ type: 'error', message: 'Failed to export backup.' });
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-left">
      <div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {t('export_data')}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {t('export_desc')}
        </p>
      </div>

      {/* Selective Boards Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t('select_boards')}
          </span>
          <div className="flex gap-2 text-2xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedExportBoardIds(projects.map((p) => p.id))}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {t('select_all')}
            </button>
            <span className="text-slate-300 dark:text-slate-850">|</span>
            <button
              type="button"
              onClick={() => setSelectedExportBoardIds([])}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {t('unselect_all')}
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
            {t('no_boards_export')}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[180px] overflow-y-auto pr-1">
            {projects.map((proj) => {
              const isSelected = selectedExportBoardIds.includes(proj.id);
              const colorStyles = getColorStyles(proj.color);
              return (
                <label
                  key={proj.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500/40 text-slate-850 dark:text-slate-100'
                      : 'border-slate-200/50 dark:border-slate-800/30 hover:bg-slate-200/25 dark:hover:bg-slate-900/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Circle size={8} className={`fill-current ${colorStyles.text}`} />
                    <span className="text-xs font-semibold truncate">{proj.name}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      if (isSelected) {
                        setSelectedExportBoardIds(selectedExportBoardIds.filter((id) => id !== proj.id));
                      } else {
                        setSelectedExportBoardIds([...selectedExportBoardIds, proj.id]);
                      }
                    }}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          onClick={handleExportFiltered}
          disabled={selectedExportBoardIds.length === 0}
          className="flex items-center gap-2"
        >
          <Download size={14} />
          {t('export_data')}
        </Button>
      </div>
    </div>
  );
};
