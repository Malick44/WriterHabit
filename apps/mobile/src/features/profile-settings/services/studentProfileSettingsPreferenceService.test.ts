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
        language: "es",
        learningFocusNote: "stronger endings",
        writingGoals: ["write_paragraphs", "not_a_goal", "write_paragraphs"],
      },
      defaults,
    );

    expect(preferences).toEqual({
      ...defaults,
      displayName: "Jordan",
      language: "es",
      learningFocusNote: "stronger endings",
      writingGoals: ["write_paragraphs"],
    });
  });

  it("merges profile patches without dropping existing choices", () => {
    const defaults = getDefaultStudentProfileSettingsPreferences();
    const preferences = mergeStudentProfileSettingsPreferences(
      defaults,
      {
        dailyPracticeMinutes: 20,
        language: "fr",
      },
      defaults,
    );

    expect(preferences).toEqual({
      ...defaults,
      dailyPracticeMinutes: 20,
      language: "fr",
    });
  });
});
