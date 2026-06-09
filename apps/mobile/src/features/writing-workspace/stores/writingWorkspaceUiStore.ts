import { create } from "zustand";

export type WritingWorkspacePanel = "coach" | null;

interface WritingWorkspaceUiState {
  activePanel: WritingWorkspacePanel;
  closePanel: () => void;
  openPanel: (panel: Exclude<WritingWorkspacePanel, null>) => void;
}

export const useWritingWorkspaceUiStore = create<WritingWorkspaceUiState>()((set) => ({
  activePanel: null,
  closePanel: () => set({ activePanel: null }),
  openPanel: (panel) => set({ activePanel: panel }),
}));
