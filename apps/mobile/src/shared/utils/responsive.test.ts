import { layout } from "@/design/tokens";

import {
  getResponsiveColumnCount,
  getScreenMaxWidth,
  isDesktopWidth,
  isTabletWidth,
} from "./responsive";

describe("responsive utilities", () => {
  it("classifies tablet and desktop widths from design tokens", () => {
    expect(isTabletWidth(layout.breakpoints.tablet - 1)).toBe(false);
    expect(isTabletWidth(layout.breakpoints.tablet)).toBe(true);
    expect(isDesktopWidth(layout.breakpoints.desktop - 1)).toBe(false);
    expect(isDesktopWidth(layout.breakpoints.desktop)).toBe(true);
  });

  it("returns tablet-first screen widths while preserving readable and full modes", () => {
    expect(getScreenMaxWidth(390)).toBe(layout.maxContentWidth);
    expect(getScreenMaxWidth(834)).toBe(layout.maxTabletContentWidth);
    expect(getScreenMaxWidth(834, "readable")).toBe(layout.maxReadableWidth);
    expect(getScreenMaxWidth(834, "full")).toBeUndefined();
  });

  it("uses one column on phones and responsive columns on tablets", () => {
    expect(getResponsiveColumnCount(430, { maxColumns: 3, minColumnWidth: 360 })).toBe(1);
    expect(getResponsiveColumnCount(834, { maxColumns: 3, minColumnWidth: 360 })).toBe(2);
    expect(getResponsiveColumnCount(1280, { maxColumns: 3, minColumnWidth: 360 })).toBe(3);
  });
});
