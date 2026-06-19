import type { StateCreator } from 'zustand';
import type { KanbanState, Task, Project, TaskStatus } from '../types/kanban';

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
          validatedTasks.push({
            id: t.id,
            title: t.title,
            projectId: t.projectId,
            status: t.status as TaskStatus,
            description: typeof t.description === 'string' ? t.description : undefined,
            tags: Array.isArray(t.tags) && t.tags.every((tag: unknown) => typeof tag === 'string') ? t.tags : [],
            links: Array.isArray(t.links) && t.links.every((l: unknown) => typeof l === 'string') ? t.links : [],
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
