const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();
const mockRemovePreference = jest.fn();
const mockGetSession = jest.fn();
const mockUpdateUser = jest.fn();
const mockRpcMaybeSingle = jest.fn();
const mockRpc = jest.fn();

jest.mock("@/services/storage/preferencesStorage", () => ({
  preferencesStorage: {
    getPreference: (...args: unknown[]) => mockGetPreference(...args),
    removePreference: (...args: unknown[]) => mockRemovePreference(...args),
    setPreference: (...args: unknown[]) => mockSetPreference(...args),
  },
}));

jest.mock("@/core/supabase/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import {
  getDefaultStudentProfileSettingsPreferences,
  mergeStudentProfileSettingsPreferences,
  parseStudentProfileSettingsPreferences,
  studentProfileSettingsPreferenceService,
} from "./studentProfileSettingsPreferenceService";

describe("studentProfileSettingsPreferenceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPreference.mockResolvedValue(getDefaultStudentProfileSettingsPreferences());
    mockSetPreference.mockResolvedValue(undefined);
    mockRemovePreference.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockUpdateUser.mockResolvedValue({ data: { user: null }, error: null });
    mockRpc.mockReturnValue({ maybeSingle: mockRpcMaybeSingle });
    mockRpcMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

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

  it("keeps goals and daily practice in student profile RPC data instead of auth metadata", async () => {
    const remoteRow = {
      daily_goal_minutes: 20,
      display_name: "Avery",
      grade_level: 6,
      language: "en",
      learning_focus_note: "",
      writing_goals: ["write_essays"],
    };

    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "user-student-1" } } }, error: null });
    mockRpcMaybeSingle.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({
      data: remoteRow,
      error: null,
    });

    await studentProfileSettingsPreferenceService.updatePreferences("sp-1", {
      dailyPracticeMinutes: 20,
      displayName: "Avery",
      gradeLevel: 6,
      writingGoals: ["write_essays"],
    });

    expect(mockRpc).toHaveBeenLastCalledWith(
      "upsert_own_student_profile_settings",
      expect.objectContaining({
        p_daily_goal_minutes: 20,
        p_display_name: "Avery",
        p_grade_level: 6,
        p_writing_goals: ["write_essays"],
      }),
    );
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: {
        display_name: "Avery",
        grade_level: 6,
      },
    });
  });
});
