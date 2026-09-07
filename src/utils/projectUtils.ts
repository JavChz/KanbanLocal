import type { Project, Task } from '../types/kanban';

export type ProjectStatus = 'ACTIVE' | 'LATE' | 'ON_TRACK';

export const getRandomProjectColor = (): string => {
  const hues = ['slate', 'red', 'orange', 'amber', 'emerald', 'blue', 'indigo', 'violet'];
  const shades = ['400', '500', '600', '700', '800'];
  const randomHue = hues[Math.floor(Math.random() * hues.length)];
  const randomShade = shades[Math.floor(Math.random() * shades.length)];
  return `${randomHue}-${randomShade}`;
};

export const getProjectStatus = (
  project: Project,
  tasks: Task[],
  currentTime = Date.now()
): ProjectStatus => {
  if (!project.deadline) {
    return 'ACTIVE';
  }
  const projTasks = tasks.filter((t) => t.projectId === project.id && !t.archived);
  const hasUnfinishedTasks = projTasks.some((t) => t.status !== 'DONE') || projTasks.length === 0;

  const deadlineDate = new Date(project.deadline + 'T23:59:59');
  const now = new Date(currentTime);

  if (now > deadlineDate && hasUnfinishedTasks) {
    return 'LATE';
  }
  return 'ON_TRACK';
};

export const getRelativeTimeString = (
  timestamp: number | undefined,
  currentTime: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  if (!timestamp) return t('none');
  const diff = currentTime - timestamp;
  if (diff < 60000) {
    return t('just_now');
  }
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) {
    return t('minutes_ago', { count: minutes });
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t('hours_ago', { count: hours });
  }
  const days = Math.floor(hours / 24);
  return t('days_ago', { count: days });
};
