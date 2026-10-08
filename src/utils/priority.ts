import type { TaskPriority } from '../types/kanban';

export interface PriorityMeta {
  key: TaskPriority;
  shortKey: string;
  titleKey: string;
  descKey: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  accentColor: string;
  iconName: 'flame' | 'star' | 'clock' | 'coffee' | 'minus';
  isUrgent: boolean;
  isImportant: boolean;
}

export function getPriorityFromFlags(isUrgent?: boolean, isImportant?: boolean): TaskPriority {
  if (isUrgent && isImportant) return 'urgent_important';
  if (!isUrgent && isImportant) return 'not_urgent_important';
  if (isUrgent && !isImportant) return 'urgent_not_important';
  if (isUrgent === false && isImportant === false) return 'not_urgent_not_important';
  return 'none';
}

export function getFlagsFromPriority(priority?: TaskPriority): { isUrgent: boolean; isImportant: boolean } {
  switch (priority) {
    case 'urgent_important':
      return { isUrgent: true, isImportant: true };
    case 'not_urgent_important':
      return { isUrgent: false, isImportant: true };
    case 'urgent_not_important':
      return { isUrgent: true, isImportant: false };
    case 'not_urgent_not_important':
      return { isUrgent: false, isImportant: false };
    default:
      return { isUrgent: false, isImportant: false };
  }
}

export const PRIORITY_CONFIG: Record<TaskPriority, PriorityMeta> = {
  urgent_important: {
    key: 'urgent_important',
    shortKey: 'action_do',
    titleKey: 'quadrant_1_title',
    descKey: 'quadrant_1_desc',
    badgeBg: 'bg-rose-500/15 dark:bg-rose-500/25',
    badgeText: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-400/40 dark:border-rose-500/30',
    accentColor: '#f43f5e',
    iconName: 'flame',
    isUrgent: true,
    isImportant: true,
  },
  not_urgent_important: {
    key: 'not_urgent_important',
    shortKey: 'action_schedule',
    titleKey: 'quadrant_2_title',
    descKey: 'quadrant_2_desc',
    badgeBg: 'bg-blue-500/15 dark:bg-blue-500/25',
    badgeText: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-400/40 dark:border-blue-500/30',
    accentColor: '#3b82f6',
    iconName: 'star',
    isUrgent: false,
    isImportant: true,
  },
  urgent_not_important: {
    key: 'urgent_not_important',
    shortKey: 'action_delegate',
    titleKey: 'quadrant_3_title',
    descKey: 'quadrant_3_desc',
    badgeBg: 'bg-amber-500/15 dark:bg-amber-500/25',
    badgeText: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-400/40 dark:border-amber-500/30',
    accentColor: '#f59e0b',
    iconName: 'clock',
    isUrgent: true,
    isImportant: false,
  },
  not_urgent_not_important: {
    key: 'not_urgent_not_important',
    shortKey: 'action_later',
    titleKey: 'quadrant_4_title',
    descKey: 'quadrant_4_desc',
    badgeBg: 'bg-slate-500/15 dark:bg-slate-500/25',
    badgeText: 'text-slate-700 dark:text-slate-300',
    borderClass: 'border-slate-300 dark:border-slate-700/50',
    accentColor: '#64748b',
    iconName: 'coffee',
    isUrgent: false,
    isImportant: false,
  },
  none: {
    key: 'none',
    shortKey: 'none',
    titleKey: 'none',
    descKey: 'none',
    badgeBg: 'bg-slate-200/50 dark:bg-slate-800/50',
    badgeText: 'text-slate-500 dark:text-slate-400',
    borderClass: 'border-slate-200 dark:border-slate-800',
    accentColor: '#94a3b8',
    iconName: 'minus',
    isUrgent: false,
    isImportant: false,
  },
};

/**
 * Eisenhower rank for prioritizing:
 * 1: Urgent & Important (Urgent / Crises / Do immediately)
 * 2: Not Urgent & Important (Plan / Deep work / Schedule)
 * 3: Urgent & Not Important (Delegate / Interruptions)
 * 4: Neither Urgent nor Important (Later / Backlog)
 * null: No priority (retains exact position)
 */
export function getEisenhowerRank(priority?: TaskPriority): number | null {
  switch (priority) {
    case 'urgent_important':
      return 1;
    case 'not_urgent_important':
      return 2;
    case 'urgent_not_important':
      return 3;
    case 'not_urgent_not_important':
      return 4;
    default:
      return null;
  }
}

/**
 * Prioritizes a list of tasks based on Eisenhower matrix while strictly preserving:
 * 1. The exact positions/indices of tasks without priority.
 * 2. The relative existing order among tasks within the same priority quadrant (stable sort).
 */
export function prioritizeTasksByEisenhower<T extends { priority?: TaskPriority }>(tasks: T[]): T[] {
  const result = [...tasks];
  const prioritizedSlots: number[] = [];
  const prioritizedItems: T[] = [];

  tasks.forEach((task, index) => {
    const rank = getEisenhowerRank(task.priority);
    if (rank !== null) {
      prioritizedSlots.push(index);
      prioritizedItems.push(task);
    }
  });

  if (prioritizedItems.length <= 1) {
    return result;
  }

  // Stable sort prioritized items by Eisenhower rank
  prioritizedItems.sort((a, b) => {
    const rankA = getEisenhowerRank(a.priority)!;
    const rankB = getEisenhowerRank(b.priority)!;
    return rankA - rankB;
  });

  // Re-insert into original prioritized slot positions
  prioritizedSlots.forEach((slotIndex, i) => {
    result[slotIndex] = prioritizedItems[i];
  });

  return result;
}
