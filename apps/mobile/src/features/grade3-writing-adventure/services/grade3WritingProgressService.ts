import * as SQLite from "expo-sqlite";

import type {
  Grade3ChecklistState,
  Grade3WritingProgress,
  Grade3WritingProgressInput,
} from "../types";

type ProgressRow = {
  day: number;
  draft: string | null;
  stronger_sentence: string | null;
  favorite_sentence: string | null;
  checklist_json: string | null;
  completed: number | null;
  updated_at: string;
};

const DATABASE_NAME = "writerhabit_grade3_writing_adventure.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
const progressListeners = new Set<(progress: Grade3WritingProgress) => void>();

function parseChecklist(value: string | null): Grade3ChecklistState {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, checked]) => [key, checked === true]),
    );
  } catch {
    return {};
  }
}

function normalizeText(value: string | undefined): string {
  return value?.slice(0, 6000) ?? "";
}

function rowToProgress(row: ProgressRow): Grade3WritingProgress {
  return {
    checklist: parseChecklist(row.checklist_json),
    completed: row.completed === 1,
    day: row.day,
    draft: row.draft ?? "",
    favoriteSentence: row.favorite_sentence ?? "",
    strongerSentence: row.stronger_sentence ?? "",
    updatedAt: row.updated_at,
  };
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
        completed INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);

    return database;
  });

  return databasePromise;
}

export const grade3WritingProgressService = {
  subscribe(listener: (progress: Grade3WritingProgress) => void): () => void {
    progressListeners.add(listener);

    return () => {
      progressListeners.delete(listener);
    };
  },

  async getAllProgress(): Promise<Grade3WritingProgress[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<ProgressRow>(
      "SELECT * FROM grade3_writing_progress ORDER BY day ASC",
    );

    return rows.map(rowToProgress);
  },

  async getProgress(day: number): Promise<Grade3WritingProgress | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<ProgressRow>(
      "SELECT * FROM grade3_writing_progress WHERE day = ?",
      day,
    );

    return row ? rowToProgress(row) : null;
  },

  async saveProgress(input: Grade3WritingProgressInput): Promise<Grade3WritingProgress> {
    const existing = await this.getProgress(input.day);
    const updatedAt = new Date().toISOString();
    const next: Grade3WritingProgress = {
      checklist: input.checklist ?? existing?.checklist ?? {},
      completed: input.completed ?? existing?.completed ?? false,
      day: input.day,
      draft: normalizeText(input.draft ?? existing?.draft),
      favoriteSentence: normalizeText(input.favoriteSentence ?? existing?.favoriteSentence),
      strongerSentence: normalizeText(input.strongerSentence ?? existing?.strongerSentence),
      updatedAt,
    };
    const database = await getDatabase();

    await database.runAsync(
      `INSERT INTO grade3_writing_progress (
        day,
        draft,
        stronger_sentence,
        favorite_sentence,
        checklist_json,
        completed,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(day) DO UPDATE SET
        draft = excluded.draft,
        stronger_sentence = excluded.stronger_sentence,
        favorite_sentence = excluded.favorite_sentence,
        checklist_json = excluded.checklist_json,
        completed = excluded.completed,
        updated_at = excluded.updated_at`,
      next.day,
      next.draft,
      next.strongerSentence,
      next.favoriteSentence,
      JSON.stringify(next.checklist),
      next.completed ? 1 : 0,
      next.updatedAt,
    );

    progressListeners.forEach((listener) => listener(next));

    return next;
  },
};
