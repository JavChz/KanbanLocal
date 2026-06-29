import type { StateCreator } from 'zustand';
import type { KanbanState, Task, Project, TaskStatus, ProjectBackground } from '../types/kanban';

export interface KanbanSlice {
  tasks: Task[];
  projects: Project[];
  addTask: (task: Omit<Task, 'id'>, position?: 'top' | 'bottom') => void;
  updateTask: (id: string, updatedFields: Partial<Omit<Task, 'id' | 'projectId'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  reorderTasks: (projectId: string, tasks: Task[]) => void;
  moveAndReorderTask: (activeId: string, overId: string, projectId: string) => void;
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
  deleteProject: (id: string) => void;
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
      const projectId = task?.projectId;
      const updatedProjects = projectId
        ? state.projects.map((p) => (p.id === projectId ? { ...p, updatedAt: Date.now() } : p))
        : state.projects;

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

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id),
      lastOpenedProject: state.lastOpenedProject === id ? null : state.lastOpenedProject,
    }));
  },
});
