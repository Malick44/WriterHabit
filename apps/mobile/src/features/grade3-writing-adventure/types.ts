import type { Grade3WritingDay } from "./content/grade3WritingProgram.content";

export type { Grade3WritingDay };

export type Grade3ChecklistState = Record<string, boolean>;

export type Grade3PlanningState = {
  talkIdea: string;
  beginning: string;
  middle: string;
  end: string;
};

export type Grade3WritingProgress = {
  day: number;
  draft: string;
  strongerSentence: string;
  favoriteSentence: string;
  checklist: Grade3ChecklistState;
  planning: Grade3PlanningState;
  completed: boolean;
  updatedAt: string;
};

export type Grade3WritingProgressInput = {
  day: number;
  draft?: string;
  strongerSentence?: string;
  favoriteSentence?: string;
  checklist?: Grade3ChecklistState;
  planning?: Grade3PlanningState;
  completed?: boolean;
  /** Practice minutes credited to the streak when completing (server-clamped). */
  estimatedMinutes?: number;
};

export type Grade3ProgressSummary = {
  completedDays: number;
  currentStreakDays: number;
  totalDays: number;
  unlockedDays: number;
  draftDays: number;
};
