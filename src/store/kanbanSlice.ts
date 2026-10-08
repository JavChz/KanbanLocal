import type { StateCreator } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import type { KanbanState, Task, Project, TaskStatus, ProjectBackground } from '../types/kanban';
import { prioritizeTasksByEisenhower } from '../utils/priority';

export interface KanbanSlice {
  tasks: Task[];
  projects: Project[];
  addTask: (task: Omit<Task, 'id'>, position?: 'top' | 'bottom') => void;
  updateTask: (id: string, updatedFields: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  reorderTasks: (projectId: string, tasks: Task[]) => void;
  moveAndReorderTask: (activeId: string, overId: string, projectId: string) => void;
  moveAllTasks: (sourceProjectId: string, targetProjectId: string) => void;
  prioritizeTasks: (projectId: string, columnStatus?: TaskStatus) => void;
  addProject: (name: string, color: string, customId?: string, description?: string, deadline?: string) => string;
  updateProject: (
    id: string,
    name: string,
    color: string,
    background?: ProjectBackground,
    customId?: string,
    description?: string,
    deadline?: string
  ) => void;
  deleteProject: (id: string, transferTasksToProjectId?: string) => void;
  reorderProjects: (activeId: string, overId: string) => void;
}

export const createKanbanSlice: StateCreator<
  KanbanState,
  [],
  [],
  KanbanSlice
> = (set) => ({
  tasks: [],
  projects: [],

  addTask: (taskData, position = 'bottom') => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
    };
    set((state) => {
      const updatedProjects = state.projects.map((p) =>
        p.id === taskData.projectId ? { ...p, updatedAt: Date.now() } : p
      );

      if (position === 'top') {
        const firstMatchingIndex = state.tasks.findIndex(
          (t) => t.projectId === taskData.projectId && t.status === taskData.status
        );
        if (firstMatchingIndex !== -1) {
          const newTasks = [...state.tasks];
          newTasks.splice(firstMatchingIndex, 0, newTask);
          return { tasks: newTasks, projects: updatedProjects };
        } else {
          return { tasks: [newTask, ...state.tasks], projects: updatedProjects };
        }
      } else {
        return { tasks: [...state.tasks, newTask], projects: updatedProjects };
      }
    });
  },

  updateTask: (id, updatedFields) => {
    set((state) => {
      const task = state.tasks.find((t) => t.id === id);
      const oldProjectId = task?.projectId;
      const newProjectId = updatedFields.projectId;

      const updatedProjects = state.projects.map((p) => {
        if (p.id === oldProjectId || (newProjectId && p.id === newProjectId)) {
          return { ...p, updatedAt: Date.now() };
        }
        return p;
      });

      return {
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)),
        projects: updatedProjects,
      };
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const task = state.tasks.find((t) => t.id === id);
      const projectId = task?.projectId;
      const updatedProjects = projectId
        ? state.projects.map((p) => (p.id === projectId ? { ...p, updatedAt: Date.now() } : p))
        : state.projects;

      return {
        tasks: state.tasks.filter((t) => t.id !== id),
        projects: updatedProjects,
      };
    });
  },

  moveTask: (id, newStatus) => {
    set((state) => {
      const task = state.tasks.find((t) => t.id === id);
      const projectId = task?.projectId;
      const updatedProjects = projectId
        ? state.projects.map((p) => (p.id === projectId ? { ...p, updatedAt: Date.now() } : p))
        : state.projects;

      return {
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
        projects: updatedProjects,
      };
    });
  },

  reorderTasks: (projectId, reorderedTasks) => {
    set((state) => {
      const otherTasks = state.tasks.filter((t) => t.projectId !== projectId);
      const updatedProjects = state.projects.map((p) =>
        p.id === projectId ? { ...p, updatedAt: Date.now() } : p
      );
      return {
        tasks: [...otherTasks, ...reorderedTasks],
        projects: updatedProjects,
      };
    });
  },

  moveAndReorderTask: (activeId, overId, projectId) => {
    set((state) => {
      const activeTask = state.tasks.find((t) => t.id === activeId);
      if (!activeTask) return {};

      const isOverColumn = overId === 'TODO' || overId === 'IN_PROGRESS' || overId === 'DONE';
      let updatedTasks = [...state.tasks];
      const updatedProjects = state.projects.map((p) =>
        p.id === projectId ? { ...p, updatedAt: Date.now() } : p
      );

      if (isOverColumn) {
        const newStatus = overId as TaskStatus;
        updatedTasks = state.tasks.map((t) =>
          t.id === activeId ? { ...t, status: newStatus } : t
        );
      } else {
        const overTask = state.tasks.find((t) => t.id === overId);
        if (overTask) {
          const overStatus = overTask.status;
          const modifiedTasks = state.tasks.map((t) =>
            t.id === activeId ? { ...t, status: overStatus } : t
          );

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

      return { tasks: updatedTasks, projects: updatedProjects };
    });
  },

  addProject: (name, color, customId, description, deadline) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
    const newProject: Project = {
      id,
      name,
      color,
      customId,
      description,
      deadline,
      updatedAt: Date.now(),
    };
    set((state) => ({
      projects: [...state.projects, newProject],
      lastOpenedProject: id,
    }));
    return id;
  },

  updateProject: (id, name, color, background, customId, description, deadline) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              name,
              color,
              background,
              customId,
              description,
              deadline,
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
  },

  moveAllTasks: (sourceProjectId: string, targetProjectId: string) => {
    set((state) => {
      const now = Date.now();
      return {
        tasks: state.tasks.map((t) =>
          t.projectId === sourceProjectId ? { ...t, projectId: targetProjectId } : t
        ),
        projects: state.projects.map((p) =>
          p.id === sourceProjectId || p.id === targetProjectId
            ? { ...p, updatedAt: now }
            : p
        ),
      };
    });
  },

  prioritizeTasks: (projectId: string, columnStatus?: TaskStatus) => {
    set((state) => {
      const otherTasks = state.tasks.filter((t) => t.projectId !== projectId);
      const projectTasks = state.tasks.filter((t) => t.projectId === projectId);

      let prioritizedProjectTasks: Task[];
      if (columnStatus) {
        // Prioritize only the specified column
        const columnTasks = projectTasks.filter((t) => t.status === columnStatus);
        const nonColumnTasks = projectTasks.filter((t) => t.status !== columnStatus);
        const prioritizedCol = prioritizeTasksByEisenhower(columnTasks);
        prioritizedProjectTasks = [...nonColumnTasks, ...prioritizedCol];
      } else {
        // Prioritize each column (TODO, IN_PROGRESS, DONE) individually
        const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
        const otherStatusTasks = projectTasks.filter(
          (t) => !statuses.includes(t.status as TaskStatus)
        );
        const prioritizedColumns = statuses.flatMap((status) => {
          const colTasks = projectTasks.filter((t) => t.status === status);
          return prioritizeTasksByEisenhower(colTasks);
        });
        prioritizedProjectTasks = [...otherStatusTasks, ...prioritizedColumns];
      }

      const updatedProjects = state.projects.map((p) =>
        p.id === projectId ? { ...p, updatedAt: Date.now() } : p
      );

      return {
        tasks: [...otherTasks, ...prioritizedProjectTasks],
        projects: updatedProjects,
      };
    });
  },

  deleteProject: (id: string, transferTasksToProjectId?: string) => {
    set((state) => {
      const now = Date.now();
      const updatedTasks = transferTasksToProjectId
        ? state.tasks.map((t) =>
            t.projectId === id ? { ...t, projectId: transferTasksToProjectId } : t
          )
        : state.tasks.filter((t) => t.projectId !== id);

      const updatedProjects = state.projects
        .filter((p) => p.id !== id)
        .map((p) =>
          transferTasksToProjectId && p.id === transferTasksToProjectId
            ? { ...p, updatedAt: now }
            : p
        );

      return {
        projects: updatedProjects,
        tasks: updatedTasks,
        lastOpenedProject: state.lastOpenedProject === id ? null : state.lastOpenedProject,
      };
    });
  },

  reorderProjects: (activeId, overId) => {
    set((state) => {
      const oldIndex = state.projects.findIndex((p) => p.id === activeId);
      const newIndex = state.projects.findIndex((p) => p.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return {};
      return { projects: arrayMove(state.projects, oldIndex, newIndex) };
    });
  },
});
