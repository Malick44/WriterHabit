import {
  buildAccessibilityLabel,
  defaultAccessibilitySettings,
  getMinimumTouchTarget,
  getTextScaleMultiplier,
} from "@/shared/utils/accessibility";

import { parseAccessibilitySettings } from "./accessibilitySettingsStore";

describe("accessibility settings foundation", () => {
  it("validates stored accessibility settings with defaults", () => {
    expect(parseAccessibilitySettings({ textSize: "extraLarge", highContrast: true })).toEqual({
      ...defaultAccessibilitySettings,
      textSize: "extraLarge",
      highContrast: true,
    });
  });

  it("scales shared text and touch targets", () => {
    expect(getTextScaleMultiplier("extraLarge")).toBeGreaterThan(getTextScaleMultiplier("default"));
    expect(getMinimumTouchTarget({ ...defaultAccessibilitySettings, textSize: "extraLarge" })).toBeGreaterThan(44);
  });

  it("builds screen-reader labels from meaningful parts", () => {
    expect(buildAccessibilityLabel(["Assignment", null, "10 minutes"])).toBe("Assignment, 10 minutes");
  });
});
