import type { StateCreator } from 'zustand';
import type { KanbanState, Task, Project, TaskStatus, TaskPriority } from '../types/kanban';
import { getPriorityFromFlags, getFlagsFromPriority } from '../utils/priority';

export interface SettingsSlice {
  language: 'en' | 'fr' | 'ja' | 'es';
  lastOpenedProject: string | null;
  setLanguage: (lang: 'en' | 'fr' | 'ja' | 'es') => void;
  setLastOpenedProject: (id: string | null) => void;
  exportState: () => string;
  importState: (stateJson: string) => boolean;
}

export const createSettingsSlice: StateCreator<
  KanbanState,
  [],
  [],
  SettingsSlice
> = (set, get) => ({
  language: 'en',
  lastOpenedProject: null,

  setLanguage: (lang) => {
    set({ language: lang });
  },

  setLastOpenedProject: (id) => {
    set({ lastOpenedProject: id });
  },

  exportState: () => {
    const { tasks, projects, language, lastOpenedProject } = get();
    return JSON.stringify({ tasks, projects, language, lastOpenedProject }, null, 2);
  },

  importState: (stateJson) => {
    try {
      const parsed = JSON.parse(stateJson);
      if (!parsed || typeof parsed !== 'object') {
        return false;
      }

      // Validate tasks array
      if (parsed.tasks && !Array.isArray(parsed.tasks)) return false;
      const validatedTasks: Task[] = [];
      if (parsed.tasks) {
        for (const t of parsed.tasks) {
          if (
            typeof t.id !== 'string' ||
            typeof t.title !== 'string' ||
            typeof t.projectId !== 'string' ||
            (t.status !== 'TODO' && t.status !== 'IN_PROGRESS' && t.status !== 'DONE')
          ) {
            return false;
          }
          let priority: TaskPriority | undefined = undefined;
          if (
            t.priority === 'urgent_important' ||
            t.priority === 'not_urgent_important' ||
            t.priority === 'urgent_not_important' ||
            t.priority === 'not_urgent_not_important' ||
            t.priority === 'none'
          ) {
            priority = t.priority;
          }

          let isUrgent = typeof t.isUrgent === 'boolean' ? t.isUrgent : undefined;
          let isImportant = typeof t.isImportant === 'boolean' ? t.isImportant : undefined;

          // Bidirectional sync: if priority is set but flags aren't, or vice-versa
          if (priority && (isUrgent === undefined || isImportant === undefined)) {
            const flags = getFlagsFromPriority(priority);
            isUrgent = isUrgent ?? flags.isUrgent;
            isImportant = isImportant ?? flags.isImportant;
          } else if (!priority && (isUrgent !== undefined || isImportant !== undefined)) {
            priority = getPriorityFromFlags(isUrgent, isImportant);
          }

          validatedTasks.push({
            id: t.id,
            title: t.title,
            projectId: t.projectId,
            status: t.status as TaskStatus,
            description: typeof t.description === 'string' ? t.description : undefined,
            tags: Array.isArray(t.tags) && t.tags.every((tag: unknown) => typeof tag === 'string') ? t.tags : [],
            links: Array.isArray(t.links) && t.links.every((l: unknown) => typeof l === 'string') ? t.links : [],
            deadline: typeof t.deadline === 'string' ? t.deadline : undefined,
            archived: typeof t.archived === 'boolean' ? t.archived : undefined,
            priority,
            isUrgent,
            isImportant,
          });
        }
      }

      // Validate projects array
      if (parsed.projects && !Array.isArray(parsed.projects)) return false;
      const validatedProjects: Project[] = [];
      if (parsed.projects) {
        for (const p of parsed.projects) {
          if (typeof p.id !== 'string' || typeof p.name !== 'string' || typeof p.color !== 'string') {
            return false;
          }
          const background = p.background && typeof p.background === 'object' &&
            (p.background.type === 'theme' || p.background.type === 'solid' || p.background.type === 'image' || p.background.type === 'custom') &&
            typeof p.background.value === 'string'
              ? { type: p.background.type as 'theme' | 'solid' | 'image' | 'custom', value: p.background.value }
              : undefined;
          validatedProjects.push({
            id: p.id,
            name: p.name,
            color: p.color,
            background,
            customId: typeof p.customId === 'string' ? p.customId : undefined,
            description: typeof p.description === 'string' ? p.description : undefined,
            deadline: typeof p.deadline === 'string' ? p.deadline : undefined,
            updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : undefined,
          });
        }
      }

      // Validate language
      let validatedLang: 'en' | 'fr' | 'ja' | 'es' = 'en';
      if (parsed.language === 'en' || parsed.language === 'fr' || parsed.language === 'ja' || parsed.language === 'es') {
        validatedLang = parsed.language;
      }

      // Validate lastOpenedProject
      const validatedLastOpened = typeof parsed.lastOpenedProject === 'string' ? parsed.lastOpenedProject : null;

      set({
        tasks: validatedTasks,
        projects: validatedProjects,
        language: validatedLang,
        lastOpenedProject: validatedLastOpened,
      });

      return true;
    } catch {
      return false;
    }
  },
});
