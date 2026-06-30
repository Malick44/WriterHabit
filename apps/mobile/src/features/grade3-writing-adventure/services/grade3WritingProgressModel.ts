import { grade3WritingProgram } from "../content/grade3WritingProgram.content";
import type { Grade3ProgressSummary, Grade3WritingProgress } from "../types";

export function getProgressMap(progress: Grade3WritingProgress[]): Map<number, Grade3WritingProgress> {
  return new Map(progress.map((item) => [item.day, item]));
}

export function isGrade3DayUnlocked(day: number, progress: Grade3WritingProgress[]): boolean {
  if (day === 1) {
    return true;
  }

  return getProgressMap(progress).get(day - 1)?.completed === true;
}

export function getGrade3Summary(progress: Grade3WritingProgress[]): Grade3ProgressSummary {
  const progressMap = getProgressMap(progress);
  const completedDays = progress.filter((item) => item.completed).length;
  const draftDays = progress.filter(
    (item) =>
      item.draft.trim().length > 0 ||
      item.strongerSentence.trim().length > 0 ||
      item.favoriteSentence.trim().length > 0,
  ).length;
  const unlockedDays = grade3WritingProgram.filter((day) => {
    if (day.day === 1) {
      return true;
    }

    return progressMap.get(day.day - 1)?.completed === true;
  }).length;
  let currentStreakDays = 0;

  for (const day of grade3WritingProgram) {
    if (progressMap.get(day.day)?.completed === true) {
      currentStreakDays += 1;
      continue;
    }

    break;
  }

  return {
    completedDays,
    currentStreakDays,
    draftDays,
    totalDays: grade3WritingProgram.length,
    unlockedDays,
  };
}
