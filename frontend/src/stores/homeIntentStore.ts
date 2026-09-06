import { create } from "zustand";

type HomeIntentState = {
  pendingFile: File | null;
  pendingJoinCode: string | null;
  createResumeRequested: boolean;
  setPendingFile: (file: File) => void;
  setPendingJoinCode: (code: string) => void;
  requestCreateResume: () => void;
  takeCreateResume: () => boolean;
  takePendingFile: () => File | null;
  takePendingJoinCode: () => string | null;
  clear: () => void;
};

export const useHomeIntentStore = create<HomeIntentState>((set, get) => ({
  pendingFile: null,
  pendingJoinCode: null,
  createResumeRequested: false,
  setPendingFile: (file) => set({ pendingFile: file }),
  setPendingJoinCode: (code) => set({ pendingJoinCode: code }),
  requestCreateResume: () => set({ createResumeRequested: true }),
  takeCreateResume: () => {
    const v = get().createResumeRequested;
    set({ createResumeRequested: false });
    return v;
  },
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

/** Survives React StrictMode remount after takePendingFile clears the store. */
let fileHandoffCache: File | null | undefined;

export function consumePendingFileForCreate(): File | null {
  if (fileHandoffCache !== undefined) return fileHandoffCache;
  fileHandoffCache = useHomeIntentStore.getState().takePendingFile();
  return fileHandoffCache;
}

export function clearFileHandoffCache(): void {
  fileHandoffCache = undefined;
}
