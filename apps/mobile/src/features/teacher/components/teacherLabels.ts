import type { WritingSkill } from "@writewise/shared";

import type { TranslationKey } from "@/i18n";

export const teacherSkillLabelKeys: Record<WritingSkill, TranslationKey> = {
  argument_strength: "assignments.skills.argument_strength",
  clarity: "assignments.skills.clarity",
  creativity: "assignments.skills.creativity",
  evidence_usage: "assignments.skills.evidence_usage",
  grammar: "assignments.skills.grammar",
  handwriting: "assignments.skills.handwriting",
  organization: "assignments.skills.organization",
  punctuation: "assignments.skills.punctuation",
  reading_response: "assignments.skills.reading_response",
  revision_quality: "assignments.skills.revision_quality",
  sentence_structure: "assignments.skills.sentence_structure",
  spelling: "assignments.skills.spelling",
  vocabulary: "assignments.skills.vocabulary",
};

export const teacherSubmissionStatusLabelKeys = {
  awaiting_review: "teacher.submissions.status.awaitingReview",
  completed: "teacher.submissions.status.completed",
  reviewed: "teacher.submissions.status.reviewed",
  revision_requested: "teacher.submissions.status.revisionRequested",
} as const satisfies Record<string, TranslationKey>;
