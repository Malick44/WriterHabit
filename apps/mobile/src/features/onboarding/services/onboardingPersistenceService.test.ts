const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();
const mockRemovePreference = jest.fn();
const mockGetSession = jest.fn();
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockFrom = jest.fn();
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
    },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import { onboardingPersistenceService } from "./onboardingPersistenceService";

describe("onboardingPersistenceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPreference.mockResolvedValue(null);
    mockSetPreference.mockResolvedValue(undefined);
    mockRemovePreference.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockEq.mockResolvedValue({ error: null });
    mockSelect.mockReturnValue({ eq: () => ({ maybeSingle: mockMaybeSingle }) });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });
    mockRpc.mockResolvedValue({ error: null });
  });

  it("loads signed-in partial onboarding progress from the user row before local recovery", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-student-1" } } },
      error: null,
    });
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: {
          onboarding_progress: {
            role: "student",
            updatedAt: "2026-06-11T12:00:00.000Z",
            writingGoals: [],
          },
        },
        error: null,
      });

    const progress = await onboardingPersistenceService.loadProgress("user-student-1");

    expect(progress).toMatchObject({ role: "student", writingGoals: [] });
    expect(mockFrom).toHaveBeenCalledWith("student_profiles");
    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockGetPreference).not.toHaveBeenCalled();
  });

  it("saves signed-in role-only progress to the user row", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-student-1" } } },
      error: null,
    });

    await onboardingPersistenceService.saveProgress("user-student-1", {
      role: "student",
      writingGoals: [],
    });

    expect(mockSetPreference).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ role: "student" }),
    );
    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_progress: expect.objectContaining({
          role: "student",
          writingGoals: [],
        }),
      }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "user-student-1");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("also updates the student profile after grade selection", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-student-1" } } },
      error: null,
    });

    await onboardingPersistenceService.saveProgress("user-student-1", {
      gradeLevel: 7,
      role: "student",
      writingGoals: ["write_paragraphs"],
    });

    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockRpc).toHaveBeenCalledWith("ensure_own_student_profile", {
      p_grade_level: 7,
    });
    expect(mockFrom).toHaveBeenCalledWith("student_profiles");
    expect(mockUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        grade_level: 7,
        writing_goals: ["write_paragraphs"],
      }),
    );
    expect(mockEq).toHaveBeenLastCalledWith("user_id", "user-student-1");
  });

  it("clears signed-in transient onboarding progress from the user row", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-student-1" } } },
      error: null,
    });

    await onboardingPersistenceService.clearProgress("user-student-1");

    expect(mockRemovePreference).toHaveBeenCalledWith(expect.any(String));
    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_progress: {
          writingGoals: [],
        },
      }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "user-student-1");
  });
});
