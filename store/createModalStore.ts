import { create } from 'zustand';

export type CreateTab = 'task' | 'doc' | 'reminder';

interface CreateModalState {
  open: boolean;
  tab: CreateTab;
  openModal: (tab?: CreateTab) => void;
  setTab: (tab: CreateTab) => void;
  close: () => void;
}

export const useCreateModal = create<CreateModalState>((set) => ({
  open: false,
  tab: 'task',
  openModal: (tab = 'task') => set({ open: true, tab }),
  setTab: (tab) => set({ tab }),
  close: () => set({ open: false }),
}));
