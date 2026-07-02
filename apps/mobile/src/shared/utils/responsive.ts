import { layout } from "@/design/tokens";

export type ScreenWidthMode = "readable" | "wide" | "full";

export function isTabletWidth(width: number): boolean {
  return width >= layout.breakpoints.tablet;
}

export function isDesktopWidth(width: number): boolean {
  return width >= layout.breakpoints.desktop;
}

export function getScreenMaxWidth(width: number, mode: ScreenWidthMode = "wide"): number | undefined {
  if (mode === "full") {
    return undefined;
  }

  if (mode === "readable") {
    return layout.maxReadableWidth;
  }

  return isTabletWidth(width) ? layout.maxTabletContentWidth : layout.maxContentWidth;
}

export function getResponsiveColumnCount(
  width: number,
  options: {
    maxColumns?: number;
    minColumnWidth?: number;
  } = {},
): number {
  const maxColumns = options.maxColumns ?? 2;
  const minColumnWidth = options.minColumnWidth ?? 360;

  if (!isTabletWidth(width)) {
    return 1;
  }

  return Math.max(1, Math.min(maxColumns, Math.floor(width / minColumnWidth)));
}
