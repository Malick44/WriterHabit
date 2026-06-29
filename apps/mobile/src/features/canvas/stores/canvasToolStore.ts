import { create } from "zustand";

import {
  CANVAS_HEIGHT_LEVELS,
  MAX_PEN_WIDTH,
  MIN_PEN_WIDTH,
  type CanvasBannerPosition,
  type CanvasHeightLevel,
  type CanvasTool,
} from "../types";

function clampWidth(width: number): number {
  return Math.min(MAX_PEN_WIDTH, Math.max(MIN_PEN_WIDTH, Math.round(width)));
}

function stepHeightLevel(current: CanvasHeightLevel): CanvasHeightLevel {
  const index = CANVAS_HEIGHT_LEVELS.indexOf(current);
  const nextIndex = Math.min(CANVAS_HEIGHT_LEVELS.length - 1, Math.max(0, index + 1));
  return CANVAS_HEIGHT_LEVELS[nextIndex];
}

interface CanvasToolState {
  /** Active drawing tool (pen / eraser / highlighter). */
  selectedTool: CanvasTool;
  /** Current pen color. */
  color: string;
  /** Current pen width in points. */
  width: number;
  /** Whether ruled guide lines are visible on the surface. */
  showLines: boolean;
  /** Current fixed-height page-count preset. */
  heightLevel: CanvasHeightLevel;
  /** Where the floating tool banner is anchored. */
  bannerPosition: CanvasBannerPosition;
  /** Whether the tool banner is collapsed to an edge handle. */
  bannerHidden: boolean;
  setTool: (tool: CanvasTool) => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
  toggleLines: () => void;
  setHeightLevel: (level: CanvasHeightLevel) => void;
  increaseHeight: () => void;
  setBannerPosition: (position: CanvasBannerPosition) => void;
  setBannerHidden: (hidden: boolean) => void;
  toggleBanner: () => void;
}

export const useCanvasToolStore = create<CanvasToolState>((set) => ({
  selectedTool: "pen",
  color: "#0F172A",
  width: 5,
  showLines: false,
  heightLevel: "short",
  bannerPosition: "bottom",
  bannerHidden: false,
  setTool: (selectedTool) => set({ selectedTool }),
  setColor: (color) => set({ color }),
  setWidth: (width) => set({ width: clampWidth(width) }),
  toggleLines: () => set((state) => ({ showLines: !state.showLines })),
  setHeightLevel: (heightLevel) => set({ heightLevel }),
  increaseHeight: () => set((state) => ({ heightLevel: stepHeightLevel(state.heightLevel) })),
  setBannerPosition: (bannerPosition) => set({ bannerPosition }),
  setBannerHidden: (bannerHidden) => set({ bannerHidden }),
  toggleBanner: () => set((state) => ({ bannerHidden: !state.bannerHidden })),
}));
