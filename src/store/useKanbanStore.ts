import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KanbanState, Task, Project, TaskStatus } from '../types/kanban';

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      language: 'en',
      lastOpenedProject: null,

      // Core Actions
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        };
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
      },

      updateTask: (id, updatedFields) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      moveTask: (id, newStatus) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
        }));
      },

      reorderTasks: (projectId, reorderedTasks) => {
        set((state) => {
          // Filter out other projects' tasks first
          const otherTasks = state.tasks.filter((t) => t.projectId !== projectId);
          return {
            tasks: [...otherTasks, ...reorderedTasks],
          };
        });
      },

      moveAndReorderTask: (activeId, overId, projectId) => {
        set((state) => {
          const activeTask = state.tasks.find((t) => t.id === activeId);
          if (!activeTask) return {};

          const isOverColumn = overId === 'TODO' || overId === 'IN_PROGRESS' || overId === 'DONE';
          let updatedTasks = [...state.tasks];

          if (isOverColumn) {
            const newStatus = overId as TaskStatus;
            updatedTasks = state.tasks.map((t) =>
              t.id === activeId ? { ...t, status: newStatus } : t
            );
          } else {
            const overTask = state.tasks.find((t) => t.id === overId);
            if (overTask) {
              const overStatus = overTask.status;

              // Update the task status first
              const modifiedTasks = state.tasks.map((t) =>
                t.id === activeId ? { ...t, status: overStatus } : t
              );

              // Reorder project tasks relative to target card
              const projectTasks = modifiedTasks.filter((t) => t.projectId === projectId);
              const activeIndex = projectTasks.findIndex((t) => t.id === activeId);
              const overIndex = projectTasks.findIndex((t) => t.id === overId);

              if (activeIndex !== -1 && overIndex !== -1) {
                const newOrdered = [...projectTasks];
                const [removed] = newOrdered.splice(activeIndex, 1);
                newOrdered.splice(overIndex, 0, removed);

                const otherTasks = modifiedTasks.filter((t) => t.projectId !== projectId);
                updatedTasks = [...otherTasks, ...newOrdered];
              } else {
                updatedTasks = modifiedTasks;
              }
            }
          }

          return { tasks: updatedTasks };
        });
      },

      // Project Actions
      addProject: (name, color) => {
        const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
        const newProject: Project = { id, name, color };
        set((state) => ({
          projects: [...state.projects, newProject],
          lastOpenedProject: id,
        }));
        return id;
      },

      updateProject: (id, name, color, background) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, name, color, background } : p)),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
          lastOpenedProject: state.lastOpenedProject === id ? null : state.lastOpenedProject,
        }));
      },

      // Settings / Globals
      setLanguage: (lang) => {
        set({ language: lang });
      },

      setLastOpenedProject: (id) => {
        set({ lastOpenedProject: id });
      },

      // Serialization
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
    }),
    {
      name: 'personal-kanban-storage',
    }
  )
);
