import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { Database, FeedbackWithDetails, PublishFeedbackInput, SubmissionRecord } from "../data/types";
import {
  AiReviewService,
} from "../features/ai/review/ai-review.service";
import { canAccessPremiumFeature } from "../features/subscriptions/entitlement-authorization";
import {
  createLocalizedCopy,
  isGradeLevel,
  isWritingSkill,
  type AssignmentType,
  type FeedbackResponse,
  type GradeLevel,
  type ReviewSubmissionRequest,
  type WritingSkill,
} from "../features/ai/contracts";
import {
  authorizeOwnedSubmission,
  authorizeSubmissionRead,
  requirePrincipal,
} from "../runtime/authorization";
import { ApiHttpError, createResourceNotFoundError } from "../runtime/errors";
import { validateRequestBody, validateRequestParams } from "../runtime/validation";
import { assertAssignmentTransition, assertSubmissionTransition } from "../features/workflows/writing-workflow-state-machine";

const submissionParamsSchema = z.object({
  submissionId: z.string().min(1).max(128),
});

const requestReviewBodySchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(128),
});

function getSkillFocus(values: string[]): WritingSkill[] {
  const skills = values.filter((value): value is WritingSkill => isWritingSkill(value));
  return skills.length > 0 ? skills : ["clarity"];
}

function toGradeLevel(value: number): GradeLevel {
  return isGradeLevel(value) ? value : 7;
}

function createServiceError(error: NonNullable<Awaited<ReturnType<AiReviewService["requestReview"]>>["error"]>): ApiHttpError {
  const statusCode = error.code.startsWith("rate_limit.")
    ? 429
    : error.code.startsWith("validation.") || error.code.startsWith("ai_safety.")
      ? 422
      : 503;

  return new ApiHttpError({
    code: error.code,
    fallbackMessage: error.message.fallback,
    messageKey: error.message.key,
    retryable: error.retryable,
    statusCode,
  });
}

function createUnexpectedReviewError(): ApiHttpError {
  return new ApiHttpError({
    code: "ai.review_failed",
    fallbackMessage: "Review could not be completed right now.",
    messageKey: "errors.ai.reviewFailed",
    retryable: true,
    statusCode: 503,
  });
}

function toPublishFeedbackInput(input: {
  feedback: FeedbackResponse;
  gradeLevel: GradeLevel;
  idempotencyKey: string;
  safetyFlags: string[];
  studentProfileId: string;
  submissionId: string;
}): PublishFeedbackInput {
  return {
    feedback: {
      gradeLevel: input.gradeLevel,
      improvementFallback: input.feedback.summary.improvement.fallback,
      improvementKey: input.feedback.summary.improvement.key,
      nextRevisionTaskFallback: input.feedback.summary.nextRevisionTask.fallback,
      nextRevisionTaskKey: input.feedback.summary.nextRevisionTask.key,
      progressMinutes: input.feedback.progressEarned.minutes,
      progressPoints: input.feedback.progressEarned.points,
      progressSkill: input.feedback.progressEarned.skill,
      strengthFallback: input.feedback.summary.strength.fallback,
      strengthKey: input.feedback.summary.strength.key,
      submittedTextExcerpt: input.feedback.submittedTextExcerpt,
    },
    grammarSuggestions: input.feedback.grammarSuggestions.map((suggestion) => ({
      explanationFallback: suggestion.explanation.fallback,
      explanationKey: suggestion.explanation.key,
      idempotencyId: suggestion.id,
      originalExcerpt: suggestion.originalExcerpt,
      studentActionFallback: suggestion.studentAction.fallback,
      studentActionKey: suggestion.studentAction.key,
      titleFallback: suggestion.title.fallback,
      titleKey: suggestion.title.key,
    })),
    idempotencyKey: input.idempotencyKey,
    revisionTask: {
      guidingQuestionFallback: input.feedback.revisionTask.guidingQuestion.fallback,
      guidingQuestionKey: input.feedback.revisionTask.guidingQuestion.key,
      idempotencyId: input.feedback.revisionTask.id,
      instructionFallback: input.feedback.revisionTask.instruction.fallback,
      instructionKey: input.feedback.revisionTask.instruction.key,
      originalExcerpt: input.feedback.revisionTask.originalExcerpt,
      targetSkill: input.feedback.revisionTask.targetSkill,
    },
    rubricScores: input.feedback.rubricScores.map((score) => ({
      coachingNoteFallback: score.coachingNote.fallback,
      coachingNoteKey: score.coachingNote.key,
      criterionId: score.criterionId,
      level: score.level,
      maxScore: 4,
      score: score.score,
    })),
    safetyFlags: input.safetyFlags,
    studentProfileId: input.studentProfileId,
    submissionId: input.submissionId,
  };
}

function createFeedbackReview(
  details: FeedbackWithDetails,
  options: { includeRubricScores: boolean } = { includeRubricScores: true },
) {
  const feedback = details.feedback;
  const revisionTask = details.revisionTask;

  if (!revisionTask) {
    throw createResourceNotFoundError({ feedbackId: feedback.id, reason: "revision_task_missing" });
  }

  return {
    assignmentId: details.assignment.id,
    assignmentPrompt: details.assignment.promptFallback,
    assignmentTitle: details.assignment.titleFallback,
    assignmentType: details.assignment.assignmentType,
    connectionStatus: "online",
    createdAt: feedback.createdAt,
    gradeLevel: feedback.gradeLevel,
    grammarSuggestions: details.grammarSuggestions.map((suggestion) => ({
      explanation: suggestion.explanationFallback,
      id: suggestion.id,
      originalExcerpt: suggestion.originalExcerpt,
      studentAction: suggestion.studentActionFallback,
      title: suggestion.titleFallback,
    })),
    id: feedback.id,
    progressEarned: {
      minutes: feedback.progressMinutes,
      points: feedback.progressPoints,
      skill: feedback.progressSkill,
    },
    revisionTask: {
      focusLabel: revisionTask.targetSkill.replace(/_/g, " "),
      guidingQuestion: revisionTask.guidingQuestionFallback,
      id: revisionTask.id,
      instruction: revisionTask.instructionFallback,
      originalExcerpt: revisionTask.originalExcerpt,
      targetSkill: revisionTask.targetSkill,
    },
    rubricScores: options.includeRubricScores
      ? details.rubricScores.map((score) => ({
          coachingNote: score.coachingNoteFallback,
          criterionId: score.criterionId,
          description: score.criterionDescriptionFallback,
          label: score.criterionLabelFallback,
          level: score.level,
          maxScore: 4,
          score: score.score,
        }))
      : [],
    status: "completed",
    studentId: feedback.studentProfileId,
    submissionId: feedback.submissionId,
    submittedTextExcerpt: feedback.submittedTextExcerpt,
    summary: {
      improvement: feedback.improvementFallback,
      nextRevisionTask: feedback.nextRevisionTaskFallback,
      strength: feedback.strengthFallback,
    },
  };
}

function createFeedbackResponse(
  details: FeedbackWithDetails,
  options: { includeRubricScores: boolean } = { includeRubricScores: true },
) {
  return {
    generatedAt: new Date().toISOString(),
    review: createFeedbackReview(details, options),
    reviewJobStatus: "completed",
    status: "completed",
    submissionId: details.submission.id,
  };
}

async function buildReviewRequest(input: {
  database: Database;
  idempotencyKey: string;
  submission: SubmissionRecord;
}): Promise<ReviewSubmissionRequest> {
  const [studentAssignment, profile, typedText] = await Promise.all([
    input.database.getStudentAssignmentById(input.submission.studentAssignmentId),
    input.database.getStudentProfileById(input.submission.studentProfileId),
    input.database.getSubmissionContent(input.submission.id),
  ]);

  if (!studentAssignment || !profile || typedText === null) {
    throw createResourceNotFoundError({ submissionId: input.submission.id });
  }

  const rubricCriteria = await input.database.listRubricCriteria(studentAssignment.assignment.rubricId);

  return {
    assignmentId: studentAssignment.assignment.id,
    assignmentPrompt: createLocalizedCopy(
      studentAssignment.assignment.promptKey,
      studentAssignment.assignment.promptFallback,
    ),
    assignmentTitle: createLocalizedCopy(
      studentAssignment.assignment.titleKey,
      studentAssignment.assignment.titleFallback,
    ),
    assignmentType: studentAssignment.assignment.assignmentType as AssignmentType,
    gradeLevel: toGradeLevel(profile.gradeLevel),
    idempotencyKey: input.idempotencyKey,
    locale: "en",
    rubricCriteria: rubricCriteria.map((criterion) => ({
      description: createLocalizedCopy(criterion.descriptionKey, criterion.descriptionFallback),
      id: criterion.id,
      label: createLocalizedCopy(criterion.labelKey, criterion.labelFallback),
      maxScore: 4,
      skill: isWritingSkill(criterion.skill) ? criterion.skill : undefined,
    })),
    rubricId: studentAssignment.assignment.rubricId,
    skillFocus: getSkillFocus(studentAssignment.assignment.skillFocus),
    studentId: input.submission.studentProfileId,
    submissionId: input.submission.id,
    typedText,
  };
}

export async function registerAiReviewRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  database: Database,
): Promise<void> {
  const aiReviewService = new AiReviewService();

  app.post("/ai/review/submissions/:submissionId", { preHandler: authenticate }, async (request, reply) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, submissionParamsSchema);
    const body = validateRequestBody(request, requestReviewBodySchema);
    const submission = await authorizeOwnedSubmission(database, principal, params.submissionId);
    const existingFeedback = await database.getFeedbackBySubmissionId(submission.id);

    if (existingFeedback) {
      return reply.code(200).send({
        feedbackId: existingFeedback.feedback.id,
        providerRequestId: null,
        queuedAt: existingFeedback.feedback.createdAt,
        reviewJobId: (await database.getReviewJobBySubmissionId(submission.id))?.id ?? null,
        safetyFlags: [],
        status: "completed",
      });
    }

    const studentAssignment = await database.getStudentAssignmentById(submission.studentAssignmentId);

    if (!studentAssignment) {
      throw createResourceNotFoundError({ studentAssignmentId: submission.studentAssignmentId });
    }

    assertAssignmentTransition(studentAssignment.status, "publish_feedback");
    assertSubmissionTransition(submission.status, "publish_feedback");

    const reviewRequest = await buildReviewRequest({
      database,
      idempotencyKey: body.idempotencyKey,
      submission,
    });
    await database.transitionReviewJob({
      idempotencyKey: body.idempotencyKey,
      safetyFlags: [],
      studentProfileId: submission.studentProfileId,
      submissionId: submission.id,
      transition: "start_review",
    });

    const result = await aiReviewService.requestReview(reviewRequest).catch(async () => {
      await database.transitionReviewJob({
        failureCode: "ai.review_failed",
        idempotencyKey: body.idempotencyKey,
        safetyFlags: [],
        studentProfileId: submission.studentProfileId,
        submissionId: submission.id,
        transition: "fail_review",
      });
      throw createUnexpectedReviewError();
    });

    if (result.error || !result.feedback) {
      await database.transitionReviewJob({
        failureCode: result.error?.code ?? "ai.review_failed",
        idempotencyKey: body.idempotencyKey,
        safetyFlags: result.response.safetyFlags,
        studentProfileId: submission.studentProfileId,
        submissionId: submission.id,
        transition: result.response.status === "safety_blocked" ? "safety_block_review" : "fail_review",
      });

      throw createServiceError(result.error ?? {
        code: "ai.review_failed",
        message: createLocalizedCopy("errors.ai.reviewFailed", "Review could not be completed right now."),
        retryable: true,
      });
    }

    const published = await database.publishFeedback(
      toPublishFeedbackInput({
        feedback: result.feedback,
        gradeLevel: reviewRequest.gradeLevel,
        idempotencyKey: body.idempotencyKey,
        safetyFlags: result.response.safetyFlags,
        studentProfileId: submission.studentProfileId,
        submissionId: submission.id,
      }),
    );

    return reply.code(200).send({
      ...result.response,
      feedbackId: published.feedback.id,
      reviewJobId: (await database.getReviewJobBySubmissionId(submission.id))?.id ?? result.response.reviewJobId,
      status: "completed",
    });
  });

  app.get("/ai/review/submissions/:submissionId/status", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, submissionParamsSchema);
    const submission = await authorizeSubmissionRead(database, principal, params.submissionId);
    const [feedback, reviewJob] = await Promise.all([
      database.getFeedbackBySubmissionId(submission.id),
      database.getReviewJobBySubmissionId(submission.id),
    ]);

    return {
      feedbackId: feedback?.feedback.id ?? null,
      reviewJobId: reviewJob?.id ?? null,
      status: feedback ? "completed" : reviewJob?.status ?? "queued",
      submissionId: submission.id,
    };
  });

  app.get("/submissions/:submissionId/feedback", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, submissionParamsSchema);
    const submission = await authorizeSubmissionRead(database, principal, params.submissionId);
    const [feedback, reviewJob] = await Promise.all([
      database.getFeedbackBySubmissionId(submission.id),
      database.getReviewJobBySubmissionId(submission.id),
    ]);

    if (!feedback) {
      return {
        generatedAt: new Date().toISOString(),
        review: null,
        reviewJobStatus: reviewJob?.status ?? "queued",
        status: reviewJob?.status === "failed" || reviewJob?.status === "safety_blocked" ? reviewJob.status : "processing",
        submissionId: submission.id,
      };
    }

    const includeRubricScores = await canAccessPremiumFeature(database, principal, "rubric_detail");

    return createFeedbackResponse(feedback, { includeRubricScores });
  });
}
