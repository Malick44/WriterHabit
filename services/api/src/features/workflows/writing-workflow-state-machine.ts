import { ApiHttpError } from "../../runtime/errors";
import type { StudentAssignmentStatus, SubmissionStatus } from "../../data/types";

export type AssignmentWorkflowTransition =
  | "start_draft"
  | "submit_work"
  | "publish_feedback"
  | "start_revision"
  | "complete_revision";

export type ReviewJobWorkflowTransition =
  | "queue_review"
  | "start_review"
  | "complete_review"
  | "fail_review"
  | "safety_block_review";

export type ReviewJobWorkflowStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "safety_blocked";

const assignmentTransitions: Record<AssignmentWorkflowTransition, readonly StudentAssignmentStatus[]> = {
  complete_revision: ["feedback_ready", "revision_in_progress"],
  publish_feedback: ["submitted", "reviewing"],
  start_draft: ["not_started", "in_progress", "feedback_ready", "revision_in_progress"],
  start_revision: ["feedback_ready", "revision_in_progress"],
  submit_work: ["in_progress", "revision_in_progress"],
};

const submissionTransitions: Partial<Record<AssignmentWorkflowTransition, readonly SubmissionStatus[]>> = {
  complete_revision: ["feedback_ready", "revision_in_progress"],
  publish_feedback: ["submitted", "reviewing"],
};

const reviewJobTransitions: Record<ReviewJobWorkflowTransition, readonly ReviewJobWorkflowStatus[]> = {
  complete_review: ["queued", "processing"],
  fail_review: ["queued", "processing"],
  queue_review: ["queued"],
  safety_block_review: ["queued", "processing"],
  start_review: ["queued", "processing"],
};

function createTransitionError(input: {
  allowedStatuses: readonly string[];
  currentStatus: string;
  requestedTransition: string;
  resource: "student_assignment" | "submission" | "review_job";
}): ApiHttpError {
  return new ApiHttpError({
    code: "conflict.status_transition_invalid",
    details: {
      allowedStatuses: [...input.allowedStatuses],
      currentStatus: input.currentStatus,
      requestedTransition: input.requestedTransition,
      resource: input.resource,
    },
  });
}

export function assertAssignmentTransition(
  currentStatus: StudentAssignmentStatus,
  requestedTransition: AssignmentWorkflowTransition,
): void {
  const allowedStatuses = assignmentTransitions[requestedTransition];

  if (!allowedStatuses.includes(currentStatus)) {
    throw createTransitionError({
      allowedStatuses,
      currentStatus,
      requestedTransition,
      resource: "student_assignment",
    });
  }
}

export function assertSubmissionTransition(
  currentStatus: SubmissionStatus,
  requestedTransition: Extract<AssignmentWorkflowTransition, "publish_feedback" | "complete_revision">,
): void {
  const allowedStatuses = submissionTransitions[requestedTransition] ?? [];

  if (!allowedStatuses.includes(currentStatus)) {
    throw createTransitionError({
      allowedStatuses,
      currentStatus,
      requestedTransition,
      resource: "submission",
    });
  }
}

export function assertReviewJobTransition(
  currentStatus: ReviewJobWorkflowStatus,
  requestedTransition: ReviewJobWorkflowTransition,
): void {
  const allowedStatuses = reviewJobTransitions[requestedTransition];

  if (!allowedStatuses.includes(currentStatus)) {
    throw createTransitionError({
      allowedStatuses,
      currentStatus,
      requestedTransition,
      resource: "review_job",
    });
  }
}

export function getNextAssignmentStatusOnStart(
  currentStatus: StudentAssignmentStatus,
): StudentAssignmentStatus {
  assertAssignmentTransition(currentStatus, "start_draft");

  if (currentStatus === "not_started") {
    return "in_progress";
  }

  if (currentStatus === "feedback_ready") {
    return "revision_in_progress";
  }

  return currentStatus;
}

