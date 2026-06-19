export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  title: string;
  projectId: string;
  status: TaskStatus;
  description?: string;
  tags?: string[];
  links?: string[];
}

export interface ProjectBackground {
  type: 'theme' | 'solid' | 'image' | 'custom';
  value: string;
}

export interface Project {
  id: string;
  name: string;
  color: string; // Tailwind class identifier, e.g., 'blue-500'
  background?: ProjectBackground;
}

export interface KanbanState {
  tasks: Task[];
  projects: Project[];
  language: 'en' | 'fr' | 'ja' | 'es';
  lastOpenedProject: string | null;
  // Core Actions
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updatedFields: Partial<Omit<Task, 'id' | 'projectId'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  reorderTasks: (projectId: string, tasks: Task[]) => void;
  moveAndReorderTask: (activeId: string, overId: string, projectId: string) => void;
  
  // Project Actions
  addProject: (name: string, color: string) => string;
  updateProject: (id: string, name: string, color: string, background?: ProjectBackground) => void;
  deleteProject: (id: string) => void;
  
  // Settings / Globals
  setLanguage: (lang: 'en' | 'fr' | 'ja' | 'es') => void;
  setLastOpenedProject: (id: string | null) => void;
  importState: (stateJson: string) => boolean;
  exportState: () => string;
}
