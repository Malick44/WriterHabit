import type { WritingSkill } from "@writewise/shared";

interface ProgressInput {
  skill: WritingSkill;
  previousScore: number;
  rubricDelta: number;
  revisionCompleted: boolean;
}

export function calculateSkillProgress(input: ProgressInput) {
  const revisionBonus = input.revisionCompleted ? 3 : 0;
  const nextScore = Math.min(100, Math.max(0, input.previousScore + input.rubricDelta + revisionBonus));

  return {
    skill: input.skill,
    previousScore: input.previousScore,
    currentScore: nextScore,
    improved: nextScore > input.previousScore,
  };
}
