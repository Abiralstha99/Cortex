import { create } from "zustand";

type HomeIntentState = {
  pendingFile: File | null;
  pendingJoinCode: string | null;
  setPendingFile: (file: File) => void;
  setPendingJoinCode: (code: string) => void;
  takePendingFile: () => File | null;
  takePendingJoinCode: () => string | null;
  clear: () => void;
};

export const useHomeIntentStore = create<HomeIntentState>((set, get) => ({
  pendingFile: null,
  pendingJoinCode: null,
  setPendingFile: (file) => set({ pendingFile: file }),
  setPendingJoinCode: (code) => set({ pendingJoinCode: code }),
  takePendingFile: () => {
    const file = get().pendingFile;
    set({ pendingFile: null });
    return file;
  },
  takePendingJoinCode: () => {
    const code = get().pendingJoinCode;
    set({ pendingJoinCode: null });
    return code;
  },
  clear: () => set({ pendingFile: null, pendingJoinCode: null }),
}));
