import type { GradeLevel, WritingGoal } from "@WriterHabit/shared";
import { z } from "zod";

import { supabase } from "@/core/supabase/supabaseClient";
import { preferencesStorage } from "@/services/storage/preferencesStorage";

const STUDENT_PROFILE_SETTINGS_KEY_PREFIX = "profile-settings.student-profile";

// Only locales with a real dictionary are selectable. Legacy stored values
// from when es/fr were offered coerce back to a supported locale on parse.
export const profileLanguageOptions = ["en"] as const;
export type ProfileLanguage = (typeof profileLanguageOptions)[number];

const legacyProfileLanguageOptions = ["en", "es", "fr"] as const;

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

const studentProfileSettingsRowSchema = z.object({
  daily_goal_minutes: z.number(),
  display_name: z.string(),
  grade_level: z.number(),
  language: z.enum(legacyProfileLanguageOptions).catch("en"),
  learning_focus_note: z.string().nullable().catch(""),
  writing_goals: z.array(z.unknown()).catch([]),
});

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

function mapRemoteProfileSettings(
  value: unknown,
  defaults: StudentProfileSettingsPreferences,
): StudentProfileSettingsPreferences | null {
  const parsed = studentProfileSettingsRowSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  return parseStudentProfileSettingsPreferences(
    {
      dailyPracticeMinutes: parsed.data.daily_goal_minutes,
      displayName: parsed.data.display_name,
      gradeLevel: parsed.data.grade_level,
      language: parsed.data.language,
      learningFocusNote: parsed.data.learning_focus_note ?? "",
      writingGoals: parsed.data.writing_goals,
    },
    defaults,
  );
}

async function getRemoteProfileSettings(
  defaults: StudentProfileSettingsPreferences,
): Promise<StudentProfileSettingsPreferences | null> {
  const { data: authData } = await supabase.auth.getSession();

  if (!authData.session) {
    return null;
  }

  const { data, error } = await supabase
    .rpc("get_own_student_profile_settings")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRemoteProfileSettings(data, defaults);
}

async function updateRemoteProfileSettings(
  preferences: StudentProfileSettingsPreferences,
  defaults: StudentProfileSettingsPreferences,
): Promise<StudentProfileSettingsPreferences | null> {
  const { data: authData } = await supabase.auth.getSession();

  if (!authData.session) {
    return null;
  }

  const { data, error } = await supabase
    .rpc("upsert_own_student_profile_settings", {
      p_daily_goal_minutes: preferences.dailyPracticeMinutes,
      p_display_name: preferences.displayName,
      p_grade_level: preferences.gradeLevel,
      p_language: preferences.language,
      p_learning_focus_note: preferences.learningFocusNote,
      p_writing_goals: preferences.writingGoals,
    })
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  await supabase.auth.updateUser({
    data: {
      display_name: preferences.displayName,
      grade_level: preferences.gradeLevel,
      language: preferences.language,
      writing_goals: preferences.writingGoals,
      daily_practice_minutes: preferences.dailyPracticeMinutes,
    },
  });

  return mapRemoteProfileSettings(data, defaults);
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

    const localPreferences = parseStudentProfileSettingsPreferences(storedPreferences, defaults);
    const remotePreferences = await getRemoteProfileSettings(defaults);

    if (remotePreferences) {
      await preferencesStorage.setPreference(getProfileSettingsKey(studentId), remotePreferences);
      return remotePreferences;
    }

    return localPreferences;
  },

  async updatePreferences(
    studentId: string,
    patch: StudentProfileSettingsPreferencesPatch,
    defaults = getDefaultStudentProfileSettingsPreferences(),
  ): Promise<StudentProfileSettingsPreferences> {
    const currentPreferences = await this.getPreferences(studentId, defaults);
    const nextPreferences = mergeStudentProfileSettingsPreferences(currentPreferences, patch, defaults);

    await preferencesStorage.setPreference(getProfileSettingsKey(studentId), nextPreferences);

    const remotePreferences = await updateRemoteProfileSettings(nextPreferences, defaults);

    if (remotePreferences) {
      await preferencesStorage.setPreference(getProfileSettingsKey(studentId), remotePreferences);
      return remotePreferences;
    }

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
