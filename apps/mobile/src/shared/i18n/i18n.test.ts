import { translate } from "./index";

describe("shared i18n", () => {
  it("resolves nested English keys", () => {
    expect(translate("en", "navigation.tabs.student.home")).toBe("Home");
  });

  it("interpolates named parameters", () => {
    expect(translate("en", "navigation.onboarding.description", { role: "student" })).toBe(
      "The current account role is student.",
    );
  });

  it("formats ICU placeholders and plural messages", () => {
    expect(translate("en", "modal.examples.selectionCount", { count: 1 })).toBe("1 selected item");
    expect(translate("en", "modal.examples.selectionCount", { count: 3 })).toBe("3 selected items");
  });

  it("formats plural messages when Intl.PluralRules is unavailable", () => {
    const originalPluralRules = Intl.PluralRules;

    Object.defineProperty(Intl, "PluralRules", {
      configurable: true,
      value: undefined,
    });

    try {
      expect(translate("en", "canvas.handwriting.height.pageCount", { count: 1 })).toBe("1 page");
      expect(translate("en", "canvas.handwriting.height.pageCount", { count: 2 })).toBe("2 pages");
    } finally {
      Object.defineProperty(Intl, "PluralRules", {
        configurable: true,
        value: originalPluralRules,
      });
    }
  });
});
