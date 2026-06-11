import {
  getDefaultStudentProfileSettingsPreferences,
  mergeStudentProfileSettingsPreferences,
  parseStudentProfileSettingsPreferences,
} from "./studentProfileSettingsPreferenceService";

describe("studentProfileSettingsPreferenceService", () => {
  it("parses stored profile settings with safe defaults", () => {
    const defaults = getDefaultStudentProfileSettingsPreferences({
      displayName: "Alex",
      gradeLevel: 6,
    });
    const preferences = parseStudentProfileSettingsPreferences(
      {
        dailyPracticeMinutes: 99,
        displayName: "Jordan",
        gradeLevel: 13,
        language: "en",
        learningFocusNote: "stronger endings",
        writingGoals: ["write_paragraphs", "not_a_goal", "write_paragraphs"],
      },
      defaults,
    );

    expect(preferences).toEqual({
      ...defaults,
      displayName: "Jordan",
      language: "en",
      learningFocusNote: "stronger endings",
      writingGoals: ["write_paragraphs"],
    });
  });

  it("coerces legacy unsupported locales to a supported language", () => {
    const defaults = getDefaultStudentProfileSettingsPreferences();
    const preferences = parseStudentProfileSettingsPreferences(
      {
        ...defaults,
        language: "es",
      },
      defaults,
    );

    expect(preferences.language).toBe("en");
  });

  it("merges profile patches without dropping existing choices", () => {
    const defaults = getDefaultStudentProfileSettingsPreferences();
    const preferences = mergeStudentProfileSettingsPreferences(
      defaults,
      {
        dailyPracticeMinutes: 20,
      },
      defaults,
    );

    expect(preferences).toEqual({
      ...defaults,
      dailyPracticeMinutes: 20,
    });
  });
});
