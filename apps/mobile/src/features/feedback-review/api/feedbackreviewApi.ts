import type { GradeLevel, WritingSkill } from "@writewise/shared";

import { supabase } from "@/core/supabase/supabaseClient";
import { assignmentsApi, type AssignmentRecord } from "@/features/assignments";
import { createWritingDraft, draftPersistenceService } from "@/features/writing-workspace/services/draftPersistenceService";
import { getWritingMetrics } from "@/features/writing-workspace/services/writingMetricsService";

import { getFeedbackRevisionValidation } from "../services/feedbackReviewService";
import {
  MAX_FEEDBACK_REVIEW_EXCERPT_LENGTH,
  feedbackReviewResponseSchema,
  feedbackReviewScenarioSchema,
  feedbackRevisionCompletionSchema,
  type FeedbackReview,
  type FeedbackReviewConnectionStatus,
  type FeedbackReviewResponse,
  type FeedbackReviewScenario,
  type FeedbackRevisionCompletion,
  type FeedbackRevisionError,
  type FeedbackRubricLevel,
  type GrammarSuggestion,
} from "../types";

interface FeedbackReviewRequestInput {
  gradeLevel?: GradeLevel;
  studentId: string;
  submissionId: string;
}

interface SubmitRevisionInput extends FeedbackReviewRequestInput {
  originalExcerpt: string;
  revisedText: string;
}

export class FeedbackReviewApiError extends Error {
  code: FeedbackRevisionError | "review_failed";

  constructor(code: FeedbackRevisionError | "review_failed", message: string) {
    super(message);
    this.name = "FeedbackReviewApiError";
    this.code = code;
  }
}

function readScenario(): FeedbackReviewScenario {
  const parsed = feedbackReviewScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WRITEWISE_FEEDBACK_REVIEW_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getExcerpt(value: string, maxLength = MAX_FEEDBACK_REVIEW_EXCERPT_LENGTH): string {
  const normalized = compactWhitespace(value);

  if (!normalized) {
    return "No typed excerpt was available, so use the assignment prompt and rubric to guide the revision.";
  }

  return normalized.length <= maxLength ? normalized : normalized.slice(0, maxLength).trimEnd();
}

function getSeedText(assignment: AssignmentRecord): string {
  const preview = assignment.draft?.preview ?? "";

  return preview.endsWith("...") ? preview.slice(0, -3) : preview;
}

function getGradeLevel(input: FeedbackReviewRequestInput): GradeLevel {
  return input.gradeLevel ?? 7;
}

function getCandidateAssignmentIds(submissionId: string): string[] {
  const candidates = [submissionId];

  if (submissionId.startsWith("review-")) {
    candidates.push(submissionId.slice("review-".length));
  }

  if (submissionId.startsWith("submission-")) {
    candidates.push(submissionId.slice("submission-".length));
  }

  return candidates.filter(Boolean);
}

function findAssignment(submissionId: string, assignments: AssignmentRecord[]): AssignmentRecord | null {
  const candidateIds = getCandidateAssignmentIds(submissionId);

  // Only exact submission or assignment-id matches are trusted. Falling back
  // to "any feedback_ready assignment" can show another assignment's review.
  return (
    assignments.find((assignment) => assignment.currentSubmissionId === submissionId) ??
    assignments.find((assignment) => candidateIds.includes(assignment.id)) ??
    null
  );
}

function getRubricLevel(score: number): FeedbackRubricLevel {
  if (score >= 4) {
    return "strong";
  }

  if (score >= 3) {
    return "meeting";
  }

  if (score >= 2) {
    return "building";
  }

  return "starting";
}

function getPrimarySkill(assignment: AssignmentRecord): WritingSkill {
  return assignment.skillFocus[0] ?? "clarity";
}

function createSummary(input: {
  assignment: AssignmentRecord;
  gradeLevel: GradeLevel;
  primarySkill: WritingSkill;
}) {
  if (input.gradeLevel <= 5) {
    return {
      improvement: "Add one more clear detail so the reader can picture your idea.",
      nextRevisionTask: "Choose one sentence and add a describing word or detail in your own words.",
      strength: "You shared an idea that connects to the prompt.",
    };
  }

  if (input.gradeLevel <= 8) {
    return {
      improvement: `Strengthen one ${input.primarySkill.replace(/_/g, " ")} move with a clearer detail or explanation.`,
      nextRevisionTask: "Revise one sentence so it explains the reason more clearly.",
      strength: "Your draft has a focused response that can become a stronger paragraph.",
    };
  }

  return {
    improvement: `Deepen one ${input.primarySkill.replace(/_/g, " ")} choice so the reasoning is easier to follow.`,
    nextRevisionTask: "Revise one claim, evidence, or analysis sentence to explain why it matters.",
    strength: "Your draft gives the assignment a clear direction and leaves room for a focused revision.",
  };
}

function createRevisionTask(input: {
  assignment: AssignmentRecord;
  excerpt: string;
  gradeLevel: GradeLevel;
  primarySkill: WritingSkill;
}) {
  if (input.gradeLevel <= 5) {
    return {
      focusLabel: "Sentence detail",
      guidingQuestion: "What one word or detail helps the reader see your idea?",
      id: `revision-${input.assignment.id}`,
      instruction: "Pick one sentence from your draft and make it clearer with one new detail.",
      originalExcerpt: input.excerpt,
      targetSkill: input.primarySkill,
    };
  }

  if (input.gradeLevel <= 8) {
    return {
      focusLabel: "Paragraph clarity",
      guidingQuestion: "Which sentence needs more support for your reason?",
      id: `revision-${input.assignment.id}`,
      instruction: "Revise one sentence so it adds or explains a supporting detail.",
      originalExcerpt: input.excerpt,
      targetSkill: input.primarySkill,
    };
  }

  return {
    focusLabel: "Reasoning revision",
    guidingQuestion: "Where can one sentence better connect claim, evidence, and analysis?",
    id: `revision-${input.assignment.id}`,
    instruction: "Revise one sentence to clarify the reasoning behind your claim or evidence.",
    originalExcerpt: input.excerpt,
    targetSkill: input.primarySkill,
  };
}

function createRubricScores(assignment: AssignmentRecord, gradeLevel: GradeLevel) {
  return assignment.rubric.map((criterion, index) => {
    const score = index === 0 ? 3 : gradeLevel >= 9 && index === 1 ? 3 : 2;

    return {
      coachingNote:
        score >= 3
          ? `This part is on track. Reread it once and keep the idea in your own words.`
          : `Use the revision task to make this ${criterion.label.toLowerCase()} goal clearer.`,
      criterionId: criterion.id,
      description: criterion.description,
      label: criterion.label,
      level: getRubricLevel(score),
      maxScore: 4 as const,
      score,
    };
  });
}

function createGrammarSuggestions(input: {
  excerpt: string;
  gradeLevel: GradeLevel;
}): GrammarSuggestion[] {
  const sharedExcerpt = getExcerpt(input.excerpt, 220);

  if (input.gradeLevel <= 5) {
    return [
      {
        explanation: "Ending marks help the reader know where each idea stops.",
        id: "ending-mark-check",
        originalExcerpt: sharedExcerpt,
        studentAction: "Read one sentence out loud and check its ending mark.",
        title: "Check ending marks",
      },
    ];
  }

  if (input.gradeLevel <= 8) {
    return [
      {
        explanation: "A long sentence may need a period or a connecting word.",
        id: "sentence-boundary",
        originalExcerpt: sharedExcerpt,
        studentAction: "Find one long sentence and decide whether it should be split or connected more clearly.",
        title: "Sentence boundary",
      },
      {
        explanation: "Specific words make support easier to understand.",
        id: "specific-word",
        originalExcerpt: sharedExcerpt,
        studentAction: "Replace one vague word with a more exact word that still sounds like you.",
        title: "Specific word choice",
      },
    ];
  }

  return [
    {
      explanation: "Sentence control helps the reader follow claim, evidence, and analysis.",
      id: "sentence-control",
      originalExcerpt: sharedExcerpt,
      studentAction: "Check one sentence for a clear subject, action, and purpose.",
      title: "Sentence control",
    },
    {
      explanation: "Precise academic wording should clarify the idea, not decorate it.",
      id: "precise-wording",
      originalExcerpt: sharedExcerpt,
      studentAction: "Replace one imprecise word with a term that better matches your claim.",
      title: "Precise wording",
    },
  ];
}

async function createReview(input: {
  assignment: AssignmentRecord;
  connectionStatus: FeedbackReviewConnectionStatus;
  gradeLevel: GradeLevel;
  studentId: string;
  submissionId: string;
}): Promise<FeedbackReview> {
  const fallbackDraft = createWritingDraft({
    assignmentId: input.assignment.id,
    canvasAttachment: null,
    revisionNumber: input.assignment.draft?.revisionNumber ?? 0,
    seedText: getSeedText(input.assignment),
    studentId: input.studentId,
    timestamp: new Date("2026-06-09T09:00:00.000Z").toISOString(),
  });
  const draft = await draftPersistenceService.getDraft(fallbackDraft);
  const excerpt = getExcerpt(draft.text || fallbackDraft.text || input.assignment.prompt);
  const metrics = getWritingMetrics(draft.text || fallbackDraft.text);
  const primarySkill = getPrimarySkill(input.assignment);
  const summary = createSummary({
    assignment: input.assignment,
    gradeLevel: input.gradeLevel,
    primarySkill,
  });

  return {
    assignmentId: input.assignment.id,
    assignmentPrompt: compactWhitespace(input.assignment.prompt),
    assignmentTitle: compactWhitespace(input.assignment.title),
    assignmentType: input.assignment.assignmentType,
    connectionStatus: input.connectionStatus,
    createdAt: new Date("2026-06-09T09:00:00.000Z").toISOString(),
    gradeLevel: input.gradeLevel,
    grammarSuggestions: createGrammarSuggestions({ excerpt, gradeLevel: input.gradeLevel }),
    id: `feedback-${input.submissionId}`,
    progressEarned: {
      minutes: Math.min(12, Math.max(4, Math.ceil(metrics.wordCount / 28))),
      points: Math.min(40, 16 + Math.floor(metrics.wordCount / 12)),
      skill: primarySkill,
    },
    rubricScores: createRubricScores(input.assignment, input.gradeLevel),
    revisionTask: createRevisionTask({
      assignment: input.assignment,
      excerpt,
      gradeLevel: input.gradeLevel,
      primarySkill,
    }),
    status: "completed",
    studentId: input.studentId,
    submissionId: input.submissionId,
    submittedTextExcerpt: excerpt,
    summary,
  };
}

function createResponse(input: {
  connectionStatus: FeedbackReviewConnectionStatus;
  gradeLevel: GradeLevel;
  review: FeedbackReview | null;
  status: FeedbackReviewResponse["status"];
  studentId: string;
}): FeedbackReviewResponse {
  return feedbackReviewResponseSchema.parse({
    connectionStatus: input.connectionStatus,
    generatedAt: new Date("2026-06-09T09:00:00.000Z").toISOString(),
    gradeLevel: input.gradeLevel,
    review: input.review,
    status: input.status,
    studentId: input.studentId,
  });
}

export const feedbackReviewApi = {
  async getFeedbackReview(input: FeedbackReviewRequestInput): Promise<FeedbackReviewResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new FeedbackReviewApiError("review_failed", "Feedback review mock request failed");
    }

    const gradeLevel = getGradeLevel(input);

    if (scenario === "processing") {
      return createResponse({
        connectionStatus: "online",
        gradeLevel,
        review: null,
        status: "processing",
        studentId: input.studentId,
      });
    }

    if (scenario === "empty") {
      return createResponse({
        connectionStatus: "online",
        gradeLevel,
        review: null,
        status: "missing",
        studentId: input.studentId,
      });
    }

    const history = await assignmentsApi.getAssignments({
      gradeLevel,
      studentId: input.studentId,
    });
    const assignment = findAssignment(input.submissionId, history.assignments);
    const connectionStatus =
      scenario === "offline" || history.connectionStatus === "offline_cached" ? "offline_cached" : "online";

    if (!assignment) {
      return createResponse({
        connectionStatus,
        gradeLevel,
        review: null,
        status: "missing",
        studentId: input.studentId,
      });
    }

    const review = await createReview({
      assignment,
      connectionStatus,
      gradeLevel,
      studentId: input.studentId,
      submissionId: input.submissionId,
    });

    return createResponse({
      connectionStatus,
      gradeLevel,
      review,
      status: "completed",
      studentId: input.studentId,
    });
  },

  async submitRevision(input: SubmitRevisionInput): Promise<FeedbackRevisionCompletion> {
    const validation = getFeedbackRevisionValidation(input.revisedText, input.originalExcerpt);

    if (!validation.canSubmit) {
      throw new FeedbackReviewApiError(validation.error ?? "submit_failed", "Revision is not ready to submit");
    }

    const response = await this.getFeedbackReview(input);

    if (!response.review) {
      throw new FeedbackReviewApiError("submit_failed", "Feedback review is not available");
    }

    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;
    let revisionId = `revision-${input.submissionId}`;

    if (session) {
      // With a real session, completion is only reported once the backend
      // accepted the revision row. Failures throw so the student keeps the
      // revision text on screen and can retry.
      const { data: profile, error: profileErr } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (profileErr || !profile) {
        throw new FeedbackReviewApiError("submit_failed", "Student profile not found for revision submit");
      }

      const { data: revision, error: revisionErr } = await supabase
        .from("submission_revisions")
        .upsert(
          {
            idempotency_key: `revision-${input.submissionId}`,
            revised_excerpt: getExcerpt(input.revisedText, 4000),
            student_profile_id: profile.id,
            submission_id: input.submissionId,
          },
          { onConflict: "submission_id,idempotency_key" },
        )
        .select("id")
        .single();

      if (revisionErr || !revision) {
        throw new FeedbackReviewApiError("submit_failed", "Revision was not accepted by the backend");
      }

      revisionId = revision.id;

      const { error: statusErr } = await supabase
        .from("student_assignments")
        .update({ status: "completed" })
        .eq("current_submission_id", input.submissionId)
        .eq("student_profile_id", profile.id);

      if (statusErr) {
        throw new FeedbackReviewApiError("submit_failed", "Assignment completion was not recorded");
      }
    }

    return feedbackRevisionCompletionSchema.parse({
      completedAt: new Date().toISOString(),
      progressEarned: response.review.progressEarned,
      revisionId,
      revisionTextExcerpt: getExcerpt(input.revisedText, 420),
      status: "completed",
      submissionId: input.submissionId,
    });
  },
};
