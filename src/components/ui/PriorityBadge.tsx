import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Star, Clock, Coffee } from 'lucide-react';
import type { TaskPriority } from '../../types/kanban';
import { PRIORITY_CONFIG } from '../../utils/priority';

interface PriorityBadgeProps {
  priority?: TaskPriority;
  compact?: boolean;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority = 'none',
  compact = false,
  className = '',
}) => {
  const { t } = useTranslation();

  if (!priority || priority === 'none') return null;

  const config = PRIORITY_CONFIG[priority];
  if (!config) return null;

  const renderIcon = (size: number) => {
    switch (config.iconName) {
      case 'flame':
        return <Flame size={size} className="shrink-0" />;
      case 'star':
        return <Star size={size} className="shrink-0 fill-current" />;
      case 'clock':
        return <Clock size={size} className="shrink-0" />;
      case 'coffee':
        return <Coffee size={size} className="shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold border ${config.badgeBg} ${config.badgeText} ${config.borderClass} select-none ${className}`}
      title={`${t(config.titleKey, config.key)}: ${t(config.descKey, '')}`}
    >
      {renderIcon(11)}
      <span className="truncate max-w-[85px]">
        {compact ? t(config.shortKey, t(config.titleKey, config.key)) : t(config.titleKey, config.key)}
      </span>
    </span>
  );
};
