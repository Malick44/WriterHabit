const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();
const mockRemovePreference = jest.fn();
const mockGetSession = jest.fn();
const mockMaybeSingle = jest.fn();
const mockUpdateEq = jest.fn();
const mockUpdate = jest.fn();
const mockSelectEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

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
  },
}));

import {
  buildAccessibilityLabel,
  defaultAccessibilitySettings,
  getMinimumTouchTarget,
  getTextScaleMultiplier,
} from "@/shared/utils/accessibility";

import { parseAccessibilitySettings, useAccessibilitySettingsStore } from "./accessibilitySettingsStore";

describe("accessibility settings foundation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAccessibilitySettingsStore.setState({
      error: null,
      hydrated: false,
      settings: defaultAccessibilitySettings,
    });
    mockGetPreference.mockResolvedValue(defaultAccessibilitySettings);
    mockSetPreference.mockResolvedValue(undefined);
    mockRemovePreference.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockSelectEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockSelectEq });
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });
  });

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

  it("hydrates signed-in accessibility settings from the student profile", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-student-1",
          },
        },
      },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({
      data: {
        accessibility_settings: {
          highContrast: true,
          reducedMotion: true,
          textSize: "large",
        },
      },
      error: null,
    });

    await useAccessibilitySettingsStore.getState().hydrateSettings();

    expect(useAccessibilitySettingsStore.getState().settings).toMatchObject({
      highContrast: true,
      reducedMotion: true,
      textSize: "large",
    });
    expect(mockSetPreference).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        highContrast: true,
        reducedMotion: true,
      }),
    );
  });

  it("persists signed-in accessibility settings to the student profile", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-student-1",
          },
        },
      },
      error: null,
    });

    await useAccessibilitySettingsStore.getState().updateSettings({
      simplifiedUi: true,
      textToSpeech: true,
    });

    expect(mockFrom).toHaveBeenCalledWith("student_profiles");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        accessibility_settings: expect.objectContaining({
          simplifiedUi: true,
          textToSpeech: true,
        }),
      }),
    );
    expect(mockUpdateEq).toHaveBeenCalledWith("user_id", "user-student-1");
  });
});
