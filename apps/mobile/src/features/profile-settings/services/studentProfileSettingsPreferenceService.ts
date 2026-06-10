import type { GradeLevel, WritingGoal } from "@writewise/shared";
import { z } from "zod";

import { preferencesStorage } from "@/services/storage/preferencesStorage";

const STUDENT_PROFILE_SETTINGS_KEY_PREFIX = "profile-settings.student-profile";

export const profileLanguageOptions = ["en", "es", "fr"] as const;
export type ProfileLanguage = (typeof profileLanguageOptions)[number];

export const profileDailyPracticeOptions = [5, 10, 15, 20, 30] as const;
export type ProfileDailyPracticeMinutes = (typeof profileDailyPracticeOptions)[number];

const writingGoalOptions = [
  "improve_spelling",
  "write_better_sentences",
  "write_paragraphs",
  "write_essays",
  "creative_writing",
  "test_prep",
  "improve_grammar",
  "school_assignments",
  "improve_handwriting",
] as const satisfies readonly WritingGoal[];

export interface StudentProfileSettingsPreferences {
  dailyPracticeMinutes: ProfileDailyPracticeMinutes;
  displayName: string;
  gradeLevel: GradeLevel;
  language: ProfileLanguage;
  learningFocusNote: string;
  writingGoals: WritingGoal[];
}

export type StudentProfileSettingsPreferencesPatch = Partial<StudentProfileSettingsPreferences>;

export function isGradeLevel(value: number): value is GradeLevel {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

export function getDefaultStudentProfileSettingsPreferences(input?: {
  displayName?: string;
  gradeLevel?: GradeLevel;
}): StudentProfileSettingsPreferences {
  return {
    dailyPracticeMinutes: 10,
    displayName: input?.displayName ?? "",
    gradeLevel: input?.gradeLevel ?? 5,
    language: "en",
    learningFocusNote: "",
    writingGoals: ["improve_grammar", "write_paragraphs"],
  };
}

function getProfileSettingsKey(studentId: string): string {
  return `${STUDENT_PROFILE_SETTINGS_KEY_PREFIX}.${studentId}`;
}

function isWritingGoal(value: unknown): value is WritingGoal {
  return typeof value === "string" && writingGoalOptions.includes(value as WritingGoal);
}

function uniqueGoals(goals: unknown[]): WritingGoal[] {
  const seenGoals = new Set<WritingGoal>();
  const nextGoals: WritingGoal[] = [];

  goals.forEach((goal) => {
    if (!isWritingGoal(goal) || seenGoals.has(goal)) {
      return;
    }

    seenGoals.add(goal);
    nextGoals.push(goal);
  });

  return nextGoals;
}

function createPreferencesSchema(defaults: StudentProfileSettingsPreferences) {
  return z.object({
    dailyPracticeMinutes: z
      .custom<ProfileDailyPracticeMinutes>((value) =>
        profileDailyPracticeOptions.includes(value as ProfileDailyPracticeMinutes),
      )
      .catch(defaults.dailyPracticeMinutes),
    displayName: z.string().catch(defaults.displayName),
    gradeLevel: z
      .custom<GradeLevel>((value) => typeof value === "number" && isGradeLevel(value))
      .catch(defaults.gradeLevel),
    language: z.enum(profileLanguageOptions).catch(defaults.language),
    learningFocusNote: z.string().catch(defaults.learningFocusNote),
    writingGoals: z
      .array(z.unknown())
      .catch(defaults.writingGoals)
      .transform((goals) => uniqueGoals(goals)),
  });
}

export function parseStudentProfileSettingsPreferences(
  value: unknown,
  defaults = getDefaultStudentProfileSettingsPreferences(),
): StudentProfileSettingsPreferences {
  const parsed = createPreferencesSchema(defaults).safeParse(value);

  if (!parsed.success) {
    return defaults;
  }

  return {
    dailyPracticeMinutes: parsed.data.dailyPracticeMinutes,
    displayName: parsed.data.displayName,
    gradeLevel: parsed.data.gradeLevel,
    language: parsed.data.language,
    learningFocusNote: parsed.data.learningFocusNote,
    writingGoals: parsed.data.writingGoals.length > 0 ? parsed.data.writingGoals : defaults.writingGoals,
  };
}

export function mergeStudentProfileSettingsPreferences(
  current: StudentProfileSettingsPreferences,
  patch: StudentProfileSettingsPreferencesPatch,
  defaults = getDefaultStudentProfileSettingsPreferences(),
): StudentProfileSettingsPreferences {
  return parseStudentProfileSettingsPreferences(
    {
      ...current,
      ...patch,
    },
    defaults,
  );
}

export const studentProfileSettingsPreferenceService = {
  async getPreferences(
    studentId: string,
    defaults = getDefaultStudentProfileSettingsPreferences(),
  ): Promise<StudentProfileSettingsPreferences> {
    const storedPreferences = await preferencesStorage.getPreference<unknown>(
      getProfileSettingsKey(studentId),
      defaults,
    );

    return parseStudentProfileSettingsPreferences(storedPreferences, defaults);
  },

  async updatePreferences(
    studentId: string,
    patch: StudentProfileSettingsPreferencesPatch,
    defaults = getDefaultStudentProfileSettingsPreferences(),
  ): Promise<StudentProfileSettingsPreferences> {
    const currentPreferences = await this.getPreferences(studentId, defaults);
    const nextPreferences = mergeStudentProfileSettingsPreferences(currentPreferences, patch, defaults);

    await preferencesStorage.setPreference(getProfileSettingsKey(studentId), nextPreferences);

    return nextPreferences;
  },

  async resetPreferences(
    studentId: string,
    defaults = getDefaultStudentProfileSettingsPreferences(),
  ): Promise<StudentProfileSettingsPreferences> {
    await preferencesStorage.removePreference(getProfileSettingsKey(studentId));

    return defaults;
  },
};
