import { create } from 'zustand';

interface DragState {
  draggedTaskId: string | null;
  draggedTaskSourceProjectId: string | null;
  hoveredProjectId: string | null;
  setDraggedTask: (taskId: string | null, sourceProjectId: string | null) => void;
  setHoveredProject: (projectId: string | null) => void;
  clearDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  draggedTaskId: null,
  draggedTaskSourceProjectId: null,
  hoveredProjectId: null,
  setDraggedTask: (taskId, sourceProjectId) =>
    set({ draggedTaskId: taskId, draggedTaskSourceProjectId: sourceProjectId }),
  setHoveredProject: (projectId) =>
    set({ hoveredProjectId: projectId }),
  clearDrag: () =>
    set({ draggedTaskId: null, draggedTaskSourceProjectId: null, hoveredProjectId: null }),
}));
