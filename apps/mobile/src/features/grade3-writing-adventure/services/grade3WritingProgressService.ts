import * as SQLite from "expo-sqlite";

import { supabase } from "@/core/supabase/supabaseClient";

import type {
  Grade3ChecklistState,
  Grade3WritingProgress,
  Grade3WritingProgressInput,
} from "../types";
import {
  defaultGrade3PlanningState,
  deserializeGrade3PlanningState,
  normalizeGrade3PlanningState,
  serializeGrade3PlanningState,
} from "./grade3PlanningState";

type ProgressRow = {
  day: number;
  draft: string | null;
  stronger_sentence: string | null;
  favorite_sentence: string | null;
  checklist_json: string | null;
  planning_json: string | null;
  completed: number | null;
  updated_at: string;
};

type RemoteProgressRow = {
  day: number;
  draft: string | null;
  stronger_sentence: string | null;
  favorite_sentence: string | null;
  checklist: unknown;
  planning: unknown;
  completed: boolean | null;
  client_updated_at: string | null;
  updated_at: string;
};

const DATABASE_NAME = "writerhabit_grade3_writing_adventure.db";

/** Safety cap for free-form writing fields (draft, sentences) before persisting. */
const MAX_TEXT_LENGTH = 6000;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
/** Serializes saveProgress calls so concurrent read-modify-write cycles cannot interleave. */
let saveQueue: Promise<unknown> = Promise.resolve();
const progressListeners = new Set<(progress: Grade3WritingProgress) => void>();

function normalizeChecklist(value: unknown): Grade3ChecklistState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, checked]) => [key, checked === true]),
  );
}

function parseChecklist(value: string | null): Grade3ChecklistState {
  if (!value) {
    return {};
  }

  try {
    return normalizeChecklist(JSON.parse(value) as unknown);
  } catch {
    return {};
  }
}

function normalizeText(value: string | undefined): string {
  return value?.slice(0, MAX_TEXT_LENGTH) ?? "";
}

function rowToProgress(row: ProgressRow): Grade3WritingProgress {
  return {
    checklist: parseChecklist(row.checklist_json),
    completed: row.completed === 1,
    day: row.day,
    draft: row.draft ?? "",
    favoriteSentence: row.favorite_sentence ?? "",
    planning: deserializeGrade3PlanningState(row.planning_json),
    strongerSentence: row.stronger_sentence ?? "",
    updatedAt: row.updated_at,
  };
}

function remoteRowToProgress(row: RemoteProgressRow): Grade3WritingProgress {
  return {
    checklist: normalizeChecklist(row.checklist),
    completed: row.completed === true,
    day: row.day,
    draft: row.draft ?? "",
    favoriteSentence: row.favorite_sentence ?? "",
    // Supabase JSONB usually arrives as an object, but tolerate double-encoded strings.
    planning:
      typeof row.planning === "string"
        ? deserializeGrade3PlanningState(row.planning)
        : normalizeGrade3PlanningState(row.planning),
    strongerSentence: row.stronger_sentence ?? "",
    updatedAt: row.client_updated_at ?? row.updated_at,
  };
}

async function getSignedInStudentProfileId(): Promise<string | null> {
  const { data: authData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const session = authData?.session;

  if (!session) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return typeof profile?.id === "string" ? profile.id : null;
}

async function ensurePlanningColumn(database: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await database.getAllAsync<{ name: string }>("PRAGMA table_info(grade3_writing_progress)");
  const hasPlanningColumn = columns.some((column) => column.name === "planning_json");

  if (!hasPlanningColumn) {
    await database.execAsync("ALTER TABLE grade3_writing_progress ADD COLUMN planning_json TEXT;");
  }
}

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME).then(async (database) => {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS grade3_writing_progress (
        day INTEGER PRIMARY KEY NOT NULL,
        draft TEXT,
        stronger_sentence TEXT,
        favorite_sentence TEXT,
        checklist_json TEXT,
        planning_json TEXT,
        completed INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);
    await ensurePlanningColumn(database);

    return database;
  });

  return databasePromise;
}

async function getAllLocalProgress(): Promise<Grade3WritingProgress[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ProgressRow>(
    "SELECT * FROM grade3_writing_progress ORDER BY day ASC",
  );

  return rows.map(rowToProgress);
}

async function getLocalProgress(day: number): Promise<Grade3WritingProgress | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ProgressRow>(
    "SELECT * FROM grade3_writing_progress WHERE day = ?",
    day,
  );

  return row ? rowToProgress(row) : null;
}

async function saveLocalProgress(progress: Grade3WritingProgress): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `INSERT INTO grade3_writing_progress (
      day,
      draft,
      stronger_sentence,
      favorite_sentence,
      checklist_json,
      planning_json,
      completed,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(day) DO UPDATE SET
      draft = excluded.draft,
      stronger_sentence = excluded.stronger_sentence,
      favorite_sentence = excluded.favorite_sentence,
      checklist_json = excluded.checklist_json,
      planning_json = excluded.planning_json,
      completed = excluded.completed,
      updated_at = excluded.updated_at`,
    progress.day,
    progress.draft,
    progress.strongerSentence,
    progress.favoriteSentence,
    JSON.stringify(progress.checklist),
    serializeGrade3PlanningState(progress.planning),
    progress.completed ? 1 : 0,
    progress.updatedAt,
  );
}

export const grade3WritingProgressService = {
  subscribe(listener: (progress: Grade3WritingProgress) => void): () => void {
    progressListeners.add(listener);

    return () => {
      progressListeners.delete(listener);
    };
  },

  async getAllProgress(): Promise<Grade3WritingProgress[]> {
    try {
      const studentProfileId = await getSignedInStudentProfileId();

      if (!studentProfileId) {
        return getAllLocalProgress();
      }

      const { data, error } = await supabase
        .from("grade3_writing_progress")
        .select("day,draft,stronger_sentence,favorite_sentence,checklist,planning,completed,client_updated_at,updated_at")
        .eq("student_profile_id", studentProfileId)
        .order("day", { ascending: true });

      if (error) {
        throw error;
      }

      return ((data ?? []) as RemoteProgressRow[]).map(remoteRowToProgress);
    } catch (error) {
      console.error("Failed to load Grade 3 progress from Supabase, using local SQLite fallback:", error);
      return getAllLocalProgress();
    }
  },

  async getProgress(day: number): Promise<Grade3WritingProgress | null> {
    try {
      const studentProfileId = await getSignedInStudentProfileId();

      if (!studentProfileId) {
        return getLocalProgress(day);
      }

      const { data, error } = await supabase
        .from("grade3_writing_progress")
        .select("day,draft,stronger_sentence,favorite_sentence,checklist,planning,completed,client_updated_at,updated_at")
        .eq("student_profile_id", studentProfileId)
        .eq("day", day)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? remoteRowToProgress(data as RemoteProgressRow) : null;
    } catch (error) {
      console.error("Failed to load Grade 3 progress from Supabase, using local SQLite fallback:", error);
      return getLocalProgress(day);
    }
  },

  async saveProgress(input: Grade3WritingProgressInput): Promise<Grade3WritingProgress> {
    // Queue saves so overlapping calls cannot interleave their read-modify-write cycles.
    const queued = saveQueue.then(() => performSaveProgress(input));
    saveQueue = queued.catch(() => undefined);

    return queued;
  },
};

async function performSaveProgress(input: Grade3WritingProgressInput): Promise<Grade3WritingProgress> {
  const existing = await grade3WritingProgressService.getProgress(input.day);
  const updatedAt = new Date().toISOString();
  const next: Grade3WritingProgress = {
    checklist: input.checklist ?? existing?.checklist ?? {},
    completed: input.completed ?? existing?.completed ?? false,
    day: input.day,
    draft: normalizeText(input.draft ?? existing?.draft),
    favoriteSentence: normalizeText(input.favoriteSentence ?? existing?.favoriteSentence),
    planning: input.planning ?? existing?.planning ?? defaultGrade3PlanningState,
    strongerSentence: normalizeText(input.strongerSentence ?? existing?.strongerSentence),
    updatedAt,
  };

  try {
    const studentProfileId = await getSignedInStudentProfileId();

    if (!studentProfileId) {
      await saveLocalProgress(next);
    } else {
      const { error } = await supabase.from("grade3_writing_progress").upsert(
        {
          student_profile_id: studentProfileId,
          day: next.day,
          draft: next.draft,
          stronger_sentence: next.strongerSentence,
          favorite_sentence: next.favoriteSentence,
          checklist: next.checklist,
          planning: next.planning,
          completed: next.completed,
          client_updated_at: next.updatedAt,
        },
        { onConflict: "student_profile_id,day" },
      );

      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error("Failed to save Grade 3 progress to Supabase, saving local SQLite fallback:", error);
    await saveLocalProgress(next);
  }

  for (const listener of progressListeners) {
    try {
      listener(next);
    } catch (error) {
      // One broken listener must not stop the others from receiving updates.
      console.error("Grade 3 progress listener threw:", error);
    }
  }

  return next;
}
