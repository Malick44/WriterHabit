import { create } from "zustand";

import type { CanvasTool } from "../types";

interface CanvasToolState {
  color: string;
  selectedTool: CanvasTool;
  width: number;
  setColor: (color: string) => void;
  setTool: (tool: CanvasTool) => void;
  setWidth: (width: number) => void;
}

export const useCanvasToolStore = create<CanvasToolState>((set) => ({
  color: "#0F172A",
  selectedTool: "pen",
  setColor: (color) => set({ color }),
  setTool: (selectedTool) => set({ selectedTool }),
  setWidth: (width) => set({ width }),
  width: 4,
}));
