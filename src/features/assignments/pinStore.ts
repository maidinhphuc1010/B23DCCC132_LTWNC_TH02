import { create } from 'zustand';

export interface PinState {
  pinnedIds: string[];
  togglePin: (id: string) => void;
  isPinned: (id: string) => boolean;
}

export const usePinStore = create<PinState>((set, get) => ({
  pinnedIds: [],
  togglePin: (id) => set((state) => ({
    pinnedIds: state.pinnedIds.includes(id)
      ? state.pinnedIds.filter((pinnedId) => pinnedId !== id)
      : [...state.pinnedIds, id],
  })),
  isPinned: (id) => get().pinnedIds.includes(id),
}));
