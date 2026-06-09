import type { WritingGoal } from "@writewise/shared";

import type { TranslationKey } from "@/i18n";

import type { DailyPracticeMinutes, WritingConfidenceLevel } from "./types";

export const writingGoalCopyKeys: Record<WritingGoal, { label: TranslationKey; description: TranslationKey }> = {
  creative_writing: {
    description: "onboarding.writingGoals.options.creativeWriting.description",
    label: "onboarding.writingGoals.options.creativeWriting.label",
  },
  improve_grammar: {
    description: "onboarding.writingGoals.options.improveGrammar.description",
    label: "onboarding.writingGoals.options.improveGrammar.label",
  },
  improve_handwriting: {
    description: "onboarding.writingGoals.options.improveHandwriting.description",
    label: "onboarding.writingGoals.options.improveHandwriting.label",
  },
  improve_spelling: {
    description: "onboarding.writingGoals.options.improveSpelling.description",
    label: "onboarding.writingGoals.options.improveSpelling.label",
  },
  school_assignments: {
    description: "onboarding.writingGoals.options.schoolAssignments.description",
    label: "onboarding.writingGoals.options.schoolAssignments.label",
  },
  test_prep: {
    description: "onboarding.writingGoals.options.testPrep.description",
    label: "onboarding.writingGoals.options.testPrep.label",
  },
  write_better_sentences: {
    description: "onboarding.writingGoals.options.writeBetterSentences.description",
    label: "onboarding.writingGoals.options.writeBetterSentences.label",
  },
  write_essays: {
    description: "onboarding.writingGoals.options.writeEssays.description",
    label: "onboarding.writingGoals.options.writeEssays.label",
  },
  write_paragraphs: {
    description: "onboarding.writingGoals.options.writeParagraphs.description",
    label: "onboarding.writingGoals.options.writeParagraphs.label",
  },
};

export const confidenceCopyKeys: Record<
  WritingConfidenceLevel,
  { label: TranslationKey; description: TranslationKey }
> = {
  building: {
    description: "onboarding.confidence.options.building.description",
    label: "onboarding.confidence.options.building.label",
  },
  confident: {
    description: "onboarding.confidence.options.confident.description",
    label: "onboarding.confidence.options.confident.label",
  },
  getting_started: {
    description: "onboarding.confidence.options.gettingStarted.description",
    label: "onboarding.confidence.options.gettingStarted.label",
  },
  steady: {
    description: "onboarding.confidence.options.steady.description",
    label: "onboarding.confidence.options.steady.label",
  },
};

export const dailyPracticeCopyKeys: Record<
  DailyPracticeMinutes,
  { label: TranslationKey; description: TranslationKey }
> = {
  10: {
    description: "onboarding.dailyPracticeGoal.options.ten.description",
    label: "onboarding.dailyPracticeGoal.options.ten.label",
  },
  15: {
    description: "onboarding.dailyPracticeGoal.options.fifteen.description",
    label: "onboarding.dailyPracticeGoal.options.fifteen.label",
  },
  20: {
    description: "onboarding.dailyPracticeGoal.options.twenty.description",
    label: "onboarding.dailyPracticeGoal.options.twenty.label",
  },
  30: {
    description: "onboarding.dailyPracticeGoal.options.thirty.description",
    label: "onboarding.dailyPracticeGoal.options.thirty.label",
  },
};

export const assignmentFocusCopyKeys = {
  essay_practice: "onboarding.planSummary.assignmentFocus.essayPractice",
  paragraph_practice: "onboarding.planSummary.assignmentFocus.paragraphPractice",
  sentence_practice: "onboarding.planSummary.assignmentFocus.sentencePractice",
} as const satisfies Record<string, TranslationKey>;
