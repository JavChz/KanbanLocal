import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Star, Clock, Coffee, Zap, Award } from 'lucide-react';
import type { TaskPriority } from '../../types/kanban';
import { PRIORITY_CONFIG, getPriorityFromFlags, getFlagsFromPriority } from '../../utils/priority';

interface TaskPrioritySelectorProps {
  priority?: TaskPriority;
  isUrgent?: boolean;
  isImportant?: boolean;
  onChange: (priority: TaskPriority, isUrgent: boolean, isImportant: boolean) => void;
}

export const TaskPrioritySelector: React.FC<TaskPrioritySelectorProps> = ({
  priority = 'none',
  isUrgent = false,
  isImportant = false,
  onChange,
}) => {
  const { t } = useTranslation();

  // Handle direct Urgent toggle
  const handleToggleUrgent = () => {
    const nextUrgent = !isUrgent;
    const nextPriority = getPriorityFromFlags(nextUrgent, isImportant);
    onChange(nextPriority, nextUrgent, isImportant);
  };

  // Handle direct Important toggle
  const handleToggleImportant = () => {
    const nextImportant = !isImportant;
    const nextPriority = getPriorityFromFlags(isUrgent, nextImportant);
    onChange(nextPriority, isUrgent, nextImportant);
  };

  // Handle quadrant select
  const handleSelectQuadrant = (p: TaskPriority) => {
    if (priority === p) {
      // Toggle off to none
      onChange('none', false, false);
    } else {
      const flags = getFlagsFromPriority(p);
      onChange(p, flags.isUrgent, flags.isImportant);
    }
  };

  const quadrants: Array<{
    key: TaskPriority;
    label: string;
    icon: React.ReactNode;
    colorClasses: string;
    activeClasses: string;
  }> = [
    {
      key: 'urgent_important',
      label: t('quadrant_1_title', 'Urgent'),
      icon: <Flame size={13} />,
      colorClasses: 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10',
      activeClasses: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50 shadow-xs font-bold',
    },
    {
      key: 'not_urgent_important',
      label: t('quadrant_2_title', 'Plan'),
      icon: <Star size={13} className="fill-current" />,
      colorClasses: 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/10',
      activeClasses: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50 shadow-xs font-bold',
    },
    {
      key: 'urgent_not_important',
      label: t('quadrant_3_title', 'Delegate'),
      icon: <Clock size={13} />,
      colorClasses: 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10',
      activeClasses: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50 shadow-xs font-bold',
    },
    {
      key: 'not_urgent_not_important',
      label: t('quadrant_4_title', 'Later'),
      icon: <Coffee size={13} />,
      colorClasses: 'text-slate-600 dark:text-slate-400 hover:bg-slate-500/10',
      activeClasses: 'bg-slate-500/20 text-slate-800 dark:text-slate-200 border-slate-500/50 shadow-xs font-bold',
    },
  ];

  return (
    <div className="flex flex-col gap-2 text-left">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {t('priority', 'Priority')} / {t('eisenhower_matrix', 'Eisenhower')}
        </label>
        {priority !== 'none' && (
          <button
            type="button"
            onClick={() => onChange('none', false, false)}
            className="text-2xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            {t('clear', 'Clear')}
          </button>
        )}
      </div>

      {/* Dimension Toggles (Urgent / Important) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleToggleUrgent}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            isUrgent
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold'
              : 'border-slate-200/80 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50'
          }`}
        >
          <Zap size={13} className={isUrgent ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
          <span>{t('urgent', 'Urgent')}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleImportant}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            isImportant
              ? 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold'
              : 'border-slate-200/80 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50'
          }`}
        >
          <Award size={13} className={isImportant ? 'text-blue-500' : 'text-slate-400'} />
          <span>{t('important', 'Important')}</span>
        </button>
      </div>

      {/* 4 Quadrants Quick Selector */}
      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        {quadrants.map((q) => {
          const isSelected = priority === q.key;
          return (
            <button
              key={q.key}
              type="button"
              onClick={() => handleSelectQuadrant(q.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-2xs transition-all cursor-pointer select-none ${
                isSelected
                  ? q.activeClasses
                  : `border-slate-200/70 dark:border-slate-800/80 ${q.colorClasses} bg-white/40 dark:bg-slate-900/30`
              }`}
            >
              <span className="shrink-0">{q.icon}</span>
              <span className="truncate">{q.label}</span>
            </button>
          );
        })}
      </div>

      {/* Description of current quadrant */}
      {priority !== 'none' && PRIORITY_CONFIG[priority] && (
        <p className="text-2xs text-slate-400 dark:text-slate-500 italic mt-0.5">
          {t(PRIORITY_CONFIG[priority].descKey, '')}
        </p>
      )}
    </div>
  );
};
