import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KanbanState } from '../types/kanban';
import { createKanbanSlice } from './kanbanSlice';
import { createSettingsSlice } from './settingsSlice';

export const useKanbanStore = create<KanbanState>()(
  persist(
    (...a) => ({
      ...createKanbanSlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: 'kanban-local-storage',
    }
  )
);

