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
});
