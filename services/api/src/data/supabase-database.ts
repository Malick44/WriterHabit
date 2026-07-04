import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { ApiHttpError } from "../runtime/errors";
import type {
  ActivityDateRange,
  ApplyEntitlementProviderEventInput,
  ApplyEntitlementProviderEventResult,
  AssignmentRecord,
  BadgeRecord,
  CanvasDocumentRecord,
  ClassRecord,
  ClassRosterStudentRecord,
  CreateSubmissionInput,
  CreateSubmissionRevisionInput,
  Database,
  DraftRecord,
  EntitlementProviderEventRecord,
  EntitlementRecord,
  FeedbackRecord,
  FeedbackRubricScoreRecord,
  FeedbackWithDetails,
  GrammarSuggestionRecord,
  ListStudentAssignmentsOptions,
  ListSubmissionQueueOptions,
  ParentLinkedStudentRecord,
  PublishFeedbackInput,
  RecordAiCoachInteractionInput,
  RevisionTaskRecord,
  ReviewJobRecord,
  RubricCriterionRecord,
  SaveDraftInput,
  StudentActivityDayRecord,
  StudentAssignmentStatus,
  StudentAssignmentUpdate,
  StudentAssignmentWithAssignment,
  StudentBadgeRecord,
  StudentProfileRecord,
  StudentProgressTotalsRecord,
  StudentSkillProgressRecord,
  SubmissionQueueRecord,
  SubmissionRecord,
  SubmissionRevisionRecord,
  TeacherProfileRecord,
  TransitionReviewJobInput,
  UpsertCanvasDocumentInput,
  UpsertEntitlementInput,
  WeeklyReviewRecord,
} from "./types";
import {
  shouldIgnoreStaleProviderEvent,
  withStaleProviderEventMetadata,
} from "./entitlement-event-ordering";

export interface SupabaseDatabaseConfig {
  serviceRoleKey: string;
  supabaseUrl: string;
}

const uniqueViolationCode = "23505";

interface SupabaseErrorLike {
  code?: string;
  message: string;
}

function toDatabaseError(error: SupabaseErrorLike, operation: string): Error {
  if (error.code === uniqueViolationCode) {
    return new ApiHttpError({
      code: "conflict.duplicate_idempotency_key",
      details: { operation },
    });
  }

  if (error.message.includes("workflow_state_transition_invalid")) {
    return new ApiHttpError({
      code: "conflict.status_transition_invalid",
      details: { operation },
    });
  }

  if (error.message.includes("workflow_revision_task_invalid")) {
    return new ApiHttpError({
      code: "conflict.status_transition_invalid",
      details: { operation, reason: "revision_task_invalid" },
    });
  }

  if (error.message.includes("workflow_resource_missing")) {
    return new ApiHttpError({
      code: "resource.not_found",
      details: { operation },
    });
  }

  // Never include row contents here; the error handler logs this message.
  return new Error(`Supabase ${operation} failed: ${error.message}`);
}

const studentAssignmentSelect = [
  "id",
  "student_profile_id",
  "assignment_id",
  "class_id",
  "status",
  "due_at",
  "started_at",
  "submitted_at",
  "completed_at",
  "current_submission_id",
  "teacher_note_key",
  "teacher_note_fallback",
  "daily_selection_metadata",
  "created_at",
  "updated_at",
  "assignment:assignments(id, title_key, title_fallback, prompt_key, prompt_fallback, prompt_image_url, instructions, assignment_type, grade_level_min, grade_level_max, skill_focus, difficulty, estimated_minutes, rubric_id, class_id, status, due_at)",
].join(", ");

const draftSelect =
  "id, student_assignment_id, student_profile_id, text_content, text_preview, canvas_document_ids, autosave_version, word_count, sentence_count, paragraph_count, revision_number, created_at, updated_at";

const canvasDocumentSelect =
  "id, student_profile_id, assignment_id, student_assignment_id, template, title, sync_status, client_version, object_path, preview_image_path, recognition_status, attached_at, created_at, updated_at, canvas_document_contents(strokes, recognized_text, stroke_count)";

const submissionSelect =
  "id, student_assignment_id, student_profile_id, status, typed_text_excerpt, word_count, sentence_count, paragraph_count, revision_number, idempotency_key, submitted_at, created_at, updated_at, submission_canvas_documents(canvas_document_id)";

const revisionSelect =
  "id, submission_id, student_profile_id, revision_task_id, revised_excerpt, idempotency_key, created_at";

const reviewJobSelect =
  "id, submission_id, student_profile_id, status, idempotency_key, safety_flags, queued_at, started_at, completed_at, failed_at, failure_code, created_at";

const entitlementSelect =
  "id, owner_user_id, scope_type, scope_id, status, can_access_premium, current_plan_id, billing_period, provider, provider_customer_id, provider_subscription_id, provider_last_event_id, provider_last_event_timestamp_ms, provider_last_event_type, current_period_ends_at, trial_ends_at, management_url, created_at, updated_at";

const entitlementProviderEventSelect =
  "id, provider, provider_event_id, event_type, owner_user_id, received_at, processed_at, processing_status, metadata";

const feedbackSelect =
  "id, submission_id, student_profile_id, grade_level, submitted_text_excerpt, strength_key, strength_fallback, improvement_key, improvement_fallback, next_revision_task_key, next_revision_task_fallback, progress_minutes, progress_points, progress_skill, created_at, updated_at";

const revisionTaskSelect =
  "id, feedback_id, target_skill, instruction_key, instruction_fallback, guiding_question_key, guiding_question_fallback, original_excerpt, created_at, updated_at";

const grammarSuggestionSelect =
  "id, feedback_id, title_key, title_fallback, explanation_key, explanation_fallback, original_excerpt, student_action_key, student_action_fallback";

const feedbackRubricScoreSelect = [
  "id",
  "feedback_id",
  "rubric_criterion_id",
  "score",
  "max_score",
  "level",
  "coaching_note_key",
  "coaching_note_fallback",
  "rubric_criterion:rubric_criteria(id, label_key, label_fallback, description_key, description_fallback)",
].join(", ");

function mapAssignmentRow(row: Record<string, unknown>): AssignmentRecord {
  return {
    assignmentType: row.assignment_type as string,
    classId: (row.class_id as string | null) ?? null,
    difficulty: row.difficulty as AssignmentRecord["difficulty"],
    dueAt: (row.due_at as string | null) ?? null,
    estimatedMinutes: row.estimated_minutes as number,
    gradeLevelMax: row.grade_level_max as number,
    gradeLevelMin: row.grade_level_min as number,
    id: row.id as string,
    instructions: row.instructions,
    promptFallback: row.prompt_fallback as string,
    promptImageUrl: (row.prompt_image_url as string | null) ?? null,
    promptKey: row.prompt_key as string,
    rubricId: row.rubric_id as string,
    skillFocus: (row.skill_focus as string[] | null) ?? [],
    status: row.status as string,
    titleFallback: row.title_fallback as string,
    titleKey: row.title_key as string,
  };
}

function mapStudentAssignmentRow(row: Record<string, unknown>): StudentAssignmentWithAssignment {
  const assignment = row.assignment as Record<string, unknown> | Record<string, unknown>[] | null;
  const assignmentRow = Array.isArray(assignment) ? assignment[0] : assignment;

  if (!assignmentRow) {
    throw new Error("Supabase student_assignments row is missing its assignments join");
  }

  return {
    assignment: mapAssignmentRow(assignmentRow),
    assignmentId: row.assignment_id as string,
    classId: (row.class_id as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    currentSubmissionId: (row.current_submission_id as string | null) ?? null,
    dailySelectionMetadata: (row.daily_selection_metadata as Record<string, unknown> | null) ?? {},
    dueAt: (row.due_at as string | null) ?? null,
    id: row.id as string,
    startedAt: (row.started_at as string | null) ?? null,
    status: row.status as StudentAssignmentWithAssignment["status"],
    studentProfileId: row.student_profile_id as string,
    submittedAt: (row.submitted_at as string | null) ?? null,
    teacherNoteFallback: (row.teacher_note_fallback as string | null) ?? null,
    teacherNoteKey: (row.teacher_note_key as string | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

function mapDraftRow(row: Record<string, unknown>): DraftRecord {
  return {
    autosaveVersion: row.autosave_version as number,
    canvasDocumentIds: (row.canvas_document_ids as string[] | null) ?? [],
    createdAt: row.created_at as string,
    id: row.id as string,
    paragraphCount: row.paragraph_count as number,
    revisionNumber: row.revision_number as number,
    sentenceCount: row.sentence_count as number,
    studentAssignmentId: row.student_assignment_id as string,
    studentProfileId: row.student_profile_id as string,
    textContent: row.text_content as string,
    textPreview: row.text_preview as string,
    updatedAt: row.updated_at as string,
    wordCount: row.word_count as number,
  };
}

function mapCanvasDocumentRow(row: Record<string, unknown>): CanvasDocumentRecord {
  const contentRows = row.canvas_document_contents as
    | Array<{ recognized_text?: string | null; stroke_count?: number | null; strokes?: unknown[] | null }>
    | { recognized_text?: string | null; stroke_count?: number | null; strokes?: unknown[] | null }
    | null
    | undefined;
  const content = Array.isArray(contentRows) ? contentRows[0] : contentRows;
  const strokes = Array.isArray(content?.strokes) ? content.strokes : [];

  return {
    assignmentId: (row.assignment_id as string | null) ?? null,
    attachedAt: (row.attached_at as string | null) ?? null,
    clientVersion: row.client_version as number,
    createdAt: row.created_at as string,
    exportStatus: "not_requested",
    id: row.id as string,
    objectPath: (row.object_path as string | null) ?? null,
    previewImagePath: (row.preview_image_path as string | null) ?? null,
    recognizedText: (content?.recognized_text as string | null) ?? null,
    recognitionStatus: row.recognition_status as string,
    serverVersion: row.client_version as number,
    studentAssignmentId: (row.student_assignment_id as string | null) ?? null,
    studentProfileId: row.student_profile_id as string,
    strokeCount: content?.stroke_count ?? strokes.length,
    strokes,
    syncStatus: row.sync_status as CanvasDocumentRecord["syncStatus"],
    template: row.template as CanvasDocumentRecord["template"],
    title: row.title as string,
    updatedAt: row.updated_at as string,
  };
}

function mapSubmissionRow(row: Record<string, unknown>): SubmissionRecord {
  const canvasLinks = (row.submission_canvas_documents as Array<{ canvas_document_id: string }> | null) ?? [];

  return {
    canvasDocumentIds: canvasLinks.map((link) => link.canvas_document_id),
    createdAt: row.created_at as string,
    id: row.id as string,
    idempotencyKey: row.idempotency_key as string,
    paragraphCount: row.paragraph_count as number,
    revisionNumber: row.revision_number as number,
    sentenceCount: row.sentence_count as number,
    status: row.status as SubmissionRecord["status"],
    studentAssignmentId: row.student_assignment_id as string,
    studentProfileId: row.student_profile_id as string,
    submittedAt: row.submitted_at as string,
    typedTextExcerpt: row.typed_text_excerpt as string,
    wordCount: row.word_count as number,
  };
}

function mapRevisionRow(row: Record<string, unknown>): SubmissionRevisionRecord {
  return {
    createdAt: row.created_at as string,
    id: row.id as string,
    idempotencyKey: row.idempotency_key as string,
    revisedExcerpt: row.revised_excerpt as string,
    revisionTaskId: (row.revision_task_id as string | null) ?? null,
    studentProfileId: row.student_profile_id as string,
    submissionId: row.submission_id as string,
  };
}

function mapReviewJobRow(row: Record<string, unknown>): ReviewJobRecord {
  return {
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    failureCode: (row.failure_code as string | null) ?? null,
    failedAt: (row.failed_at as string | null) ?? null,
    id: row.id as string,
    idempotencyKey: row.idempotency_key as string,
    queuedAt: row.queued_at as string,
    safetyFlags: (row.safety_flags as string[] | null) ?? [],
    startedAt: (row.started_at as string | null) ?? null,
    status: row.status as ReviewJobRecord["status"],
    studentProfileId: row.student_profile_id as string,
    submissionId: row.submission_id as string,
  };
}

function mapEntitlementRow(row: Record<string, unknown>): EntitlementRecord {
  return {
    billingPeriod: (row.billing_period as EntitlementRecord["billingPeriod"]) ?? null,
    canAccessPremium: Boolean(row.can_access_premium),
    createdAt: row.created_at as string,
    currentPeriodEndsAt: (row.current_period_ends_at as string | null) ?? null,
    currentPlanId: (row.current_plan_id as EntitlementRecord["currentPlanId"]) ?? null,
    id: row.id as string,
    managementUrl: (row.management_url as string | null) ?? null,
    ownerUserId: row.owner_user_id as string,
    provider: (row.provider as EntitlementRecord["provider"]) ?? null,
    providerCustomerId: (row.provider_customer_id as string | null) ?? null,
    providerLastEventId: (row.provider_last_event_id as string | null) ?? null,
    providerLastEventTimestampMs: nullableNumber(row.provider_last_event_timestamp_ms),
    providerLastEventType: (row.provider_last_event_type as string | null) ?? null,
    providerSubscriptionId: (row.provider_subscription_id as string | null) ?? null,
    scopeId: (row.scope_id as string | null) ?? null,
    scopeType: row.scope_type as EntitlementRecord["scopeType"],
    status: row.status as EntitlementRecord["status"],
    trialEndsAt: (row.trial_ends_at as string | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

function nullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }

  return null;
}

function mapEntitlementProviderEventRow(row: Record<string, unknown>): EntitlementProviderEventRecord {
  return {
    eventType: row.event_type as string,
    id: row.id as string,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    ownerUserId: (row.owner_user_id as string | null) ?? null,
    processedAt: (row.processed_at as string | null) ?? null,
    processingStatus: row.processing_status as EntitlementProviderEventRecord["processingStatus"],
    provider: row.provider as EntitlementProviderEventRecord["provider"],
    providerEventId: row.provider_event_id as string,
    receivedAt: row.received_at as string,
  };
}

function mapFeedbackRow(row: Record<string, unknown>): FeedbackRecord {
  return {
    createdAt: row.created_at as string,
    gradeLevel: row.grade_level as number,
    id: row.id as string,
    improvementFallback: row.improvement_fallback as string,
    improvementKey: row.improvement_key as string,
    nextRevisionTaskFallback: row.next_revision_task_fallback as string,
    nextRevisionTaskKey: row.next_revision_task_key as string,
    progressMinutes: row.progress_minutes as number,
    progressPoints: row.progress_points as number,
    progressSkill: row.progress_skill as string,
    strengthFallback: row.strength_fallback as string,
    strengthKey: row.strength_key as string,
    studentProfileId: row.student_profile_id as string,
    submissionId: row.submission_id as string,
    submittedTextExcerpt: row.submitted_text_excerpt as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRevisionTaskRow(row: Record<string, unknown>): RevisionTaskRecord {
  return {
    createdAt: row.created_at as string,
    feedbackId: row.feedback_id as string,
    guidingQuestionFallback: row.guiding_question_fallback as string,
    guidingQuestionKey: row.guiding_question_key as string,
    id: row.id as string,
    instructionFallback: row.instruction_fallback as string,
    instructionKey: row.instruction_key as string,
    originalExcerpt: row.original_excerpt as string,
    targetSkill: row.target_skill as string,
    updatedAt: row.updated_at as string,
  };
}

function mapGrammarSuggestionRow(row: Record<string, unknown>): GrammarSuggestionRecord {
  return {
    explanationFallback: row.explanation_fallback as string,
    explanationKey: row.explanation_key as string,
    feedbackId: row.feedback_id as string,
    id: row.id as string,
    originalExcerpt: row.original_excerpt as string,
    studentActionFallback: row.student_action_fallback as string,
    studentActionKey: row.student_action_key as string,
    titleFallback: row.title_fallback as string,
    titleKey: row.title_key as string,
  };
}

function mapFeedbackRubricScoreRow(row: Record<string, unknown>): FeedbackRubricScoreRecord {
  const criterion = firstJoinRow(row.rubric_criterion);

  return {
    coachingNoteFallback: row.coaching_note_fallback as string,
    coachingNoteKey: row.coaching_note_key as string,
    criterionDescriptionFallback: (criterion?.description_fallback as string | undefined) ?? "",
    criterionDescriptionKey: (criterion?.description_key as string | undefined) ?? "",
    criterionId: row.rubric_criterion_id as string,
    criterionLabelFallback: (criterion?.label_fallback as string | undefined) ?? "",
    criterionLabelKey: (criterion?.label_key as string | undefined) ?? "",
    feedbackId: row.feedback_id as string,
    id: row.id as string,
    level: row.level as FeedbackRubricScoreRecord["level"],
    maxScore: 4,
    score: row.score as FeedbackRubricScoreRecord["score"],
  };
}

function mapStudentProfileRow(row: Record<string, unknown>): StudentProfileRecord {
  return {
    gradeLevel: row.grade_level as number,
    id: row.id as string,
    userId: row.user_id as string,
  };
}

/** Normalizes a supabase-js embedded join, which may come back as an array. */
function firstJoinRow(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return (value[0] as Record<string, unknown> | undefined) ?? null;
  }

  return (value as Record<string, unknown> | null) ?? null;
}

function joinedDisplayName(studentProfileJoin: unknown): string {
  const profileRow = firstJoinRow(studentProfileJoin);
  const userRow = firstJoinRow(profileRow?.user);
  return (userRow?.display_name as string | undefined) ?? "Student";
}

function mapTeacherProfileRow(row: Record<string, unknown>): TeacherProfileRecord {
  return {
    displayName: row.display_name as string,
    id: row.id as string,
    userId: row.user_id as string,
  };
}

function mapClassRow(row: Record<string, unknown>): ClassRecord {
  return {
    gradeLevel: row.grade_level as number,
    id: row.id as string,
    name: row.name as string,
    status: row.status as ClassRecord["status"],
    teacherProfileId: row.teacher_profile_id as string,
  };
}

function mapProgressTotalsRow(row: Record<string, unknown>): StudentProgressTotalsRecord {
  return {
    aiFeedbackApplied: row.ai_feedback_applied as number,
    assignmentsCompleted: row.assignments_completed as number,
    bestStreakDays: row.best_streak_days as number,
    currentStreakDays: row.current_streak_days as number,
    handwritingMinutes: row.handwriting_minutes as number,
    minutesThisWeek: row.minutes_this_week as number,
    practicedTodayOn: (row.practiced_today_on as string | null) ?? null,
    revisionsCompleted: row.revisions_completed as number,
    rubricImprovement: Number(row.rubric_improvement ?? 0),
    streakStatus: row.streak_status as StudentProgressTotalsRecord["streakStatus"],
    studentProfileId: row.student_profile_id as string,
    weeklyMinutesGoal: row.weekly_minutes_goal as number,
    wordsWritten: row.words_written as number,
  };
}

function mapSkillProgressRow(row: Record<string, unknown>): StudentSkillProgressRecord {
  return {
    currentScore: Number(row.current_score ?? 0),
    level: row.level as number,
    previousScore: Number(row.previous_score ?? 0),
    skill: row.skill as string,
    studentProfileId: row.student_profile_id as string,
    updatedAt: row.updated_at as string,
  };
}

function mapActivityDayRow(row: Record<string, unknown>): StudentActivityDayRecord {
  return {
    activityDate: row.activity_date as string,
    assignmentsCompleted: row.assignments_completed as number,
    feedbackApplied: row.feedback_applied as number,
    handwritingMinutes: row.handwriting_minutes as number,
    minutesPracticed: row.minutes_practiced as number,
    practicedSkills: (row.practiced_skills as string[] | null) ?? [],
    revisionsCompleted: row.revisions_completed as number,
    studentProfileId: row.student_profile_id as string,
    wordsWritten: row.words_written as number,
  };
}

function mapWeeklyReviewRow(row: Record<string, unknown>): WeeklyReviewRecord {
  return {
    celebrationFallback: row.celebration_fallback as string,
    celebrationKey: row.celebration_key as string,
    focusForNextWeekFallback: row.focus_for_next_week_fallback as string,
    focusForNextWeekKey: row.focus_for_next_week_key as string,
    id: row.id as string,
    studentProfileId: row.student_profile_id as string,
    weekEnd: row.week_end as string,
    weekStart: row.week_start as string,
  };
}

function mapBadgeRow(row: Record<string, unknown>): BadgeRecord {
  return {
    code: row.code as string,
    descriptionFallback: row.description_fallback as string,
    descriptionKey: row.description_key as string,
    iconName: row.icon_name as string,
    id: row.id as string,
    nameFallback: row.name_fallback as string,
    nameKey: row.name_key as string,
  };
}

function mapStudentBadgeRow(row: Record<string, unknown>): StudentBadgeRecord {
  return {
    badgeId: row.badge_id as string,
    progressPercent: Number(row.progress_percent ?? 0),
    status: row.status as StudentBadgeRecord["status"],
    studentProfileId: row.student_profile_id as string,
    unlockedAt: (row.unlocked_at as string | null) ?? null,
  };
}

function mapSubmissionQueueRow(row: Record<string, unknown>): SubmissionQueueRecord {
  const studentAssignmentRow = firstJoinRow(row.student_assignment);
  const assignmentRow = firstJoinRow(studentAssignmentRow?.assignment);
  const canvasLinks = (row.submission_canvas_documents as unknown[] | null) ?? [];

  return {
    assignmentId: (studentAssignmentRow?.assignment_id as string | undefined) ?? "",
    assignmentTitleFallback: (assignmentRow?.title_fallback as string | undefined) ?? "",
    assignmentTitleKey: (assignmentRow?.title_key as string | undefined) ?? "",
    classId: (studentAssignmentRow?.class_id as string | undefined) ?? "",
    hasCanvas: canvasLinks.length > 0,
    id: row.id as string,
    status: row.status as SubmissionQueueRecord["status"],
    studentAssignmentId: row.student_assignment_id as string,
    studentDisplayName: joinedDisplayName(row.student_profile),
    studentProfileId: row.student_profile_id as string,
    submittedAt: row.submitted_at as string,
    wordCount: row.word_count as number,
  };
}

/**
 * Supabase service-role implementation of the writing-loop Database.
 *
 * Multi-row writes (submission creation) run as sequential statements because
 * supabase-js does not expose transactions; the idempotency unique indexes on
 * submissions and review_jobs keep retries safe if a later statement fails.
 */
export class SupabaseDatabase implements Database {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async findEntitlementForUpsert(input: UpsertEntitlementInput): Promise<EntitlementRecord | null> {
    if (input.provider && input.providerSubscriptionId) {
      const { data, error } = await this.client
        .from("entitlements")
        .select(entitlementSelect)
        .eq("provider", input.provider)
        .eq("provider_subscription_id", input.providerSubscriptionId)
        .maybeSingle();

      if (error) {
        throw toDatabaseError(error, "entitlements.findByProviderSubscription");
      }

      return data ? mapEntitlementRow(data as Record<string, unknown>) : null;
    }

    let query = this.client
      .from("entitlements")
      .select(entitlementSelect)
      .eq("owner_user_id", input.ownerUserId)
      .eq("scope_type", input.scopeType)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (input.scopeId) {
      query = query.eq("scope_id", input.scopeId);
    } else {
      query = query.is("scope_id", null);
    }

    if (input.provider) {
      query = query.eq("provider", input.provider);
    } else {
      query = query.is("provider", null);
    }

    const { data, error } = await query;

    if (error) {
      throw toDatabaseError(error, "entitlements.findForUpsert");
    }

    const row = (data as Record<string, unknown>[] | null)?.[0];
    return row ? mapEntitlementRow(row) : null;
  }

  private async getEntitlementProviderEvent(
    provider: EntitlementProviderEventRecord["provider"],
    providerEventId: string,
  ): Promise<EntitlementProviderEventRecord | null> {
    const { data, error } = await this.client
      .from("entitlement_provider_events")
      .select(entitlementProviderEventSelect)
      .eq("provider", provider)
      .eq("provider_event_id", providerEventId)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "entitlement_provider_events.get");
    }

    return data ? mapEntitlementProviderEventRow(data as Record<string, unknown>) : null;
  }

  async applyEntitlementProviderEvent(
    input: ApplyEntitlementProviderEventInput,
  ): Promise<ApplyEntitlementProviderEventResult> {
    const insertResult = await this.client
      .from("entitlement_provider_events")
      .insert({
        event_type: input.eventType,
        metadata: input.metadata,
        owner_user_id: input.ownerUserId,
        processing_status: "received",
        provider: input.provider,
        provider_event_id: input.providerEventId,
      })
      .select(entitlementProviderEventSelect)
      .single();

    let event: EntitlementProviderEventRecord;
    let wasDuplicate = false;

    if (insertResult.error) {
      if (insertResult.error.code !== uniqueViolationCode) {
        throw toDatabaseError(insertResult.error, "entitlement_provider_events.insert");
      }

      const existingEvent = await this.getEntitlementProviderEvent(input.provider, input.providerEventId);

      if (!existingEvent) {
        throw toDatabaseError(
          { message: "duplicate entitlement provider event missing after conflict" },
          "entitlement_provider_events.getAfterConflict",
        );
      }

      event = existingEvent;
      wasDuplicate = true;

      if (event.processingStatus === "processed" || event.processingStatus === "ignored") {
        return {
          entitlement: input.ownerUserId ? await this.getLatestEntitlementForUser(input.ownerUserId) : null,
          event,
          wasDuplicate,
        };
      }
    } else {
      event = mapEntitlementProviderEventRow(insertResult.data as Record<string, unknown>);
    }

    let entitlement: EntitlementRecord | null = null;
    let metadata = input.metadata;
    let processingStatus = input.processingStatus ?? (input.entitlement ? "processed" : "ignored");

    if (input.entitlement) {
      const existingEntitlement = await this.findEntitlementForUpsert(input.entitlement);

      if (
        existingEntitlement &&
        shouldIgnoreStaleProviderEvent({
          existing: existingEntitlement,
          incoming: input.entitlement,
        })
      ) {
        entitlement = existingEntitlement;
        metadata = withStaleProviderEventMetadata({
          existing: existingEntitlement,
          incoming: input.entitlement,
          metadata,
        });
        processingStatus = "ignored";
      } else {
        entitlement = await this.upsertEntitlement(input.entitlement);
      }
    }

    const processedAt = new Date().toISOString();
    const { data, error } = await this.client
      .from("entitlement_provider_events")
      .update({
        event_type: input.eventType,
        metadata,
        owner_user_id: input.ownerUserId,
        processed_at: processedAt,
        processing_status: processingStatus,
      })
      .eq("provider", input.provider)
      .eq("provider_event_id", input.providerEventId)
      .select(entitlementProviderEventSelect)
      .single();

    if (error || !data) {
      throw toDatabaseError(error ?? { message: "missing provider event after update" }, "entitlement_provider_events.update");
    }

    event = mapEntitlementProviderEventRow(data as Record<string, unknown>);

    return {
      entitlement,
      event,
      wasDuplicate,
    };
  }

  async countClassActiveAssignments(classId: string): Promise<number> {
    const { count, error } = await this.client
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("status", "published");

    if (error) {
      throw toDatabaseError(error, "assignments.countActiveForClass");
    }

    return count ?? 0;
  }

  async countClassStudentAssignments(
    classId: string,
    statuses?: readonly StudentAssignmentStatus[],
  ): Promise<number> {
    let query = this.client
      .from("student_assignments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId);

    if (statuses && statuses.length > 0) {
      query = query.in("status", [...statuses]);
    }

    const { count, error } = await query;

    if (error) {
      throw toDatabaseError(error, "student_assignments.countForClass");
    }

    return count ?? 0;
  }

  async countStudentAssignments(
    studentProfileId: string,
    statuses?: readonly StudentAssignmentStatus[],
  ): Promise<number> {
    let query = this.client
      .from("student_assignments")
      .select("id", { count: "exact", head: true })
      .eq("student_profile_id", studentProfileId);

    if (statuses && statuses.length > 0) {
      query = query.in("status", [...statuses]);
    }

    const { count, error } = await query;

    if (error) {
      throw toDatabaseError(error, "student_assignments.countForStudent");
    }

    return count ?? 0;
  }

  async createSubmission(input: CreateSubmissionInput): Promise<SubmissionRecord> {
    const { data, error } = await this.client.rpc("writerhabit_submit_assignment_workflow", {
      p_canvas_document_ids: input.canvasDocumentIds,
      p_idempotency_key: input.idempotencyKey,
      p_paragraph_count: input.paragraphCount,
      p_sentence_count: input.sentenceCount,
      p_student_assignment_id: input.studentAssignmentId,
      p_student_profile_id: input.studentProfileId,
      p_typed_text: input.typedText,
      p_typed_text_excerpt: input.typedTextExcerpt,
      p_word_count: input.wordCount,
    });

    if (error || !data) {
      throw toDatabaseError(error ?? { message: "missing workflow submission row" }, "workflow.submit");
    }

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;

    if (!row) {
      throw toDatabaseError({ message: "missing workflow submission row" }, "workflow.submit");
    }

    return {
      ...mapSubmissionRow({ ...row, submission_canvas_documents: [] }),
      canvasDocumentIds: [...input.canvasDocumentIds],
    };
  }

  async createSubmissionRevision(input: CreateSubmissionRevisionInput): Promise<SubmissionRevisionRecord> {
    const { data, error } = await this.client.rpc("writerhabit_complete_revision_workflow", {
      p_idempotency_key: input.idempotencyKey,
      p_revised_excerpt: input.revisedExcerpt,
      p_revision_task_id: input.revisionTaskId,
      p_student_profile_id: input.studentProfileId,
      p_submission_id: input.submissionId,
    });

    if (error || !data) {
      throw toDatabaseError(error ?? { message: "missing workflow revision row" }, "workflow.revision");
    }

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;

    if (!row) {
      throw toDatabaseError({ message: "missing workflow revision row" }, "workflow.revision");
    }

    return mapRevisionRow(row);
  }

  async deleteDraft(studentAssignmentId: string): Promise<void> {
    const { error } = await this.client
      .from("writing_drafts")
      .delete()
      .eq("student_assignment_id", studentAssignmentId);

    if (error) {
      throw toDatabaseError(error, "writing_drafts.delete");
    }
  }

  async findStudentAssignmentForStudents(
    assignmentId: string,
    studentProfileIds: readonly string[],
  ): Promise<StudentAssignmentWithAssignment | null> {
    if (studentProfileIds.length === 0) {
      return null;
    }

    const { data, error } = await this.client
      .from("student_assignments")
      .select(studentAssignmentSelect)
      .eq("assignment_id", assignmentId)
      .in("student_profile_id", [...studentProfileIds])
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      throw toDatabaseError(error, "student_assignments.findForStudents");
    }

    const row = (data as unknown as Record<string, unknown>[] | null)?.[0];
    return row ? mapStudentAssignmentRow(row) : null;
  }

  async findSubmissionByIdempotencyKey(
    studentAssignmentId: string,
    idempotencyKey: string,
  ): Promise<SubmissionRecord | null> {
    const { data, error } = await this.client
      .from("submissions")
      .select(submissionSelect)
      .eq("student_assignment_id", studentAssignmentId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "submissions.findByIdempotencyKey");
    }

    return data ? mapSubmissionRow(data as Record<string, unknown>) : null;
  }

  async findSubmissionRevisionByIdempotencyKey(
    submissionId: string,
    idempotencyKey: string,
  ): Promise<SubmissionRevisionRecord | null> {
    const { data, error } = await this.client
      .from("submission_revisions")
      .select(revisionSelect)
      .eq("submission_id", submissionId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "submission_revisions.findByIdempotencyKey");
    }

    return data ? mapRevisionRow(data as Record<string, unknown>) : null;
  }

  async getCanvasDocumentById(canvasDocumentId: string): Promise<CanvasDocumentRecord | null> {
    const { data, error } = await this.client
      .from("canvas_documents")
      .select(canvasDocumentSelect)
      .eq("id", canvasDocumentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "canvas_documents.getById");
    }

    return data ? mapCanvasDocumentRow(data as Record<string, unknown>) : null;
  }

  async listCanvasDocumentsByIds(canvasDocumentIds: readonly string[]): Promise<CanvasDocumentRecord[]> {
    if (canvasDocumentIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from("canvas_documents")
      .select(canvasDocumentSelect)
      .in("id", [...new Set(canvasDocumentIds)])
      .is("deleted_at", null);

    if (error) {
      throw toDatabaseError(error, "canvas_documents.listByIds");
    }

    return (data ?? []).map((row) => mapCanvasDocumentRow(row as Record<string, unknown>));
  }

  async listCanvasDocumentsForStudent(studentProfileId: string, limit: number): Promise<CanvasDocumentRecord[]> {
    const { data, error } = await this.client
      .from("canvas_documents")
      .select(canvasDocumentSelect)
      .eq("student_profile_id", studentProfileId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw toDatabaseError(error, "canvas_documents.listForStudent");
    }

    return (data ?? []).map((row) => mapCanvasDocumentRow(row as Record<string, unknown>));
  }

  async upsertCanvasDocument(input: UpsertCanvasDocumentInput): Promise<CanvasDocumentRecord> {
    const { data: document, error: documentError } = await this.client
      .from("canvas_documents")
      .upsert(
        {
          assignment_id: input.assignmentId ?? null,
          attached_at: input.assignmentId ? new Date().toISOString() : null,
          client_version: input.clientVersion,
          id: input.id,
          object_path: input.objectPath ?? null,
          preview_image_path: input.previewImagePath ?? null,
          student_assignment_id: input.studentAssignmentId ?? null,
          student_profile_id: input.studentProfileId,
          sync_status: input.syncStatus ?? "saved",
          template: input.template,
          title: input.title,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select("id")
      .single();

    if (documentError || !document) {
      throw toDatabaseError(documentError ?? { message: "missing upserted canvas document row" }, "canvas_documents.upsert");
    }

    const { error: contentError } = await this.client.from("canvas_document_contents").upsert(
      {
        canvas_document_id: input.id,
        stroke_count: input.strokes.length,
        strokes: input.strokes,
        student_profile_id: input.studentProfileId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "canvas_document_id" },
    );

    if (contentError) {
      throw toDatabaseError(contentError, "canvas_document_contents.upsert");
    }

    const saved = await this.getCanvasDocumentById(input.id);

    if (!saved) {
      throw toDatabaseError({ message: "missing saved canvas document row" }, "canvas_documents.upsert");
    }

    return saved;
  }

  async getClassById(classId: string): Promise<ClassRecord | null> {
    const { data, error } = await this.client
      .from("classes")
      .select("id, teacher_profile_id, name, grade_level, status")
      .eq("id", classId)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "classes.getById");
    }

    return data ? mapClassRow(data as Record<string, unknown>) : null;
  }

  async getDraftByStudentAssignmentId(studentAssignmentId: string): Promise<DraftRecord | null> {
    const { data, error } = await this.client
      .from("writing_drafts")
      .select(draftSelect)
      .eq("student_assignment_id", studentAssignmentId)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "writing_drafts.getByStudentAssignmentId");
    }

    return data ? mapDraftRow(data as Record<string, unknown>) : null;
  }

  async getFeedbackBySubmissionId(submissionId: string): Promise<FeedbackWithDetails | null> {
    const feedbackResult = await this.client
      .from("feedback")
      .select(feedbackSelect)
      .eq("submission_id", submissionId)
      .maybeSingle();

    if (feedbackResult.error) {
      throw toDatabaseError(feedbackResult.error, "feedback.getBySubmissionId");
    }

    if (!feedbackResult.data) {
      return null;
    }

    const feedback = mapFeedbackRow(feedbackResult.data as Record<string, unknown>);
    const submission = await this.getSubmissionById(submissionId);

    if (!submission) {
      return null;
    }

    const studentAssignment = await this.getStudentAssignmentById(submission.studentAssignmentId);

    if (!studentAssignment) {
      return null;
    }

    const [revisionTaskResult, rubricScoresResult, grammarSuggestionsResult] = await Promise.all([
      this.client
        .from("revision_tasks")
        .select(revisionTaskSelect)
        .eq("feedback_id", feedback.id)
        .order("created_at", { ascending: true })
        .limit(1),
      this.client
        .from("feedback_rubric_scores")
        .select(feedbackRubricScoreSelect)
        .eq("feedback_id", feedback.id),
      this.client
        .from("grammar_suggestions")
        .select(grammarSuggestionSelect)
        .eq("feedback_id", feedback.id),
    ]);

    if (revisionTaskResult.error) {
      throw toDatabaseError(revisionTaskResult.error, "revision_tasks.listByFeedback");
    }
    if (rubricScoresResult.error) {
      throw toDatabaseError(rubricScoresResult.error, "feedback_rubric_scores.listByFeedback");
    }
    if (grammarSuggestionsResult.error) {
      throw toDatabaseError(grammarSuggestionsResult.error, "grammar_suggestions.listByFeedback");
    }

    const revisionTaskRow = (revisionTaskResult.data as Record<string, unknown>[] | null)?.[0];

    return {
      assignment: studentAssignment.assignment,
      feedback,
      grammarSuggestions: ((grammarSuggestionsResult.data as Record<string, unknown>[] | null) ?? []).map(
        (row) => mapGrammarSuggestionRow(row),
      ),
      revisionTask: revisionTaskRow ? mapRevisionTaskRow(revisionTaskRow) : null,
      rubricScores: ((rubricScoresResult.data as unknown as Record<string, unknown>[] | null) ?? []).map((row) =>
        mapFeedbackRubricScoreRow(row),
      ),
      studentAssignment,
      submission,
    };
  }

  async getLatestEntitlementForUser(ownerUserId: string): Promise<EntitlementRecord | null> {
    const { data, error } = await this.client
      .from("entitlements")
      .select(entitlementSelect)
      .eq("owner_user_id", ownerUserId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      throw toDatabaseError(error, "entitlements.getLatestForUser");
    }

    const row = (data as Record<string, unknown>[] | null)?.[0];
    return row ? mapEntitlementRow(row) : null;
  }

  async getLatestWeeklyReview(studentProfileId: string): Promise<WeeklyReviewRecord | null> {
    const { data, error } = await this.client
      .from("weekly_reviews")
      .select(
        "id, student_profile_id, week_start, week_end, celebration_key, celebration_fallback, focus_for_next_week_key, focus_for_next_week_fallback",
      )
      .eq("student_profile_id", studentProfileId)
      .order("week_start", { ascending: false })
      .limit(1);

    if (error) {
      throw toDatabaseError(error, "weekly_reviews.getLatest");
    }

    const row = (data as Record<string, unknown>[] | null)?.[0];
    return row ? mapWeeklyReviewRow(row) : null;
  }

  async getMaxSubmissionRevisionNumber(studentAssignmentId: string): Promise<number> {
    const { data, error } = await this.client
      .from("submissions")
      .select("revision_number")
      .eq("student_assignment_id", studentAssignmentId)
      .order("revision_number", { ascending: false })
      .limit(1);

    if (error) {
      throw toDatabaseError(error, "submissions.getMaxRevisionNumber");
    }

    const row = (data as Array<{ revision_number: number }> | null)?.[0];
    return row?.revision_number ?? 0;
  }

  async getReviewJobBySubmissionId(submissionId: string): Promise<ReviewJobRecord | null> {
    const { data, error } = await this.client
      .from("review_jobs")
      .select(reviewJobSelect)
      .eq("submission_id", submissionId)
      .order("queued_at", { ascending: false })
      .limit(1);

    if (error) {
      throw toDatabaseError(error, "review_jobs.getBySubmissionId");
    }

    const row = (data as Record<string, unknown>[] | null)?.[0];
    return row ? mapReviewJobRow(row) : null;
  }

  async getStudentAssignmentById(id: string): Promise<StudentAssignmentWithAssignment | null> {
    const { data, error } = await this.client
      .from("student_assignments")
      .select(studentAssignmentSelect)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "student_assignments.getById");
    }

    return data ? mapStudentAssignmentRow(data as unknown as Record<string, unknown>) : null;
  }

  async getStudentProfileById(id: string): Promise<StudentProfileRecord | null> {
    const { data, error } = await this.client
      .from("student_profiles")
      .select("id, user_id, grade_level")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "student_profiles.getById");
    }

    return data ? mapStudentProfileRow(data as Record<string, unknown>) : null;
  }

  async getStudentProfileByUserId(userId: string): Promise<StudentProfileRecord | null> {
    const { data, error } = await this.client
      .from("student_profiles")
      .select("id, user_id, grade_level")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "student_profiles.getByUserId");
    }

    return data ? mapStudentProfileRow(data as Record<string, unknown>) : null;
  }

  async getSubmissionById(id: string): Promise<SubmissionRecord | null> {
    const { data, error } = await this.client
      .from("submissions")
      .select(submissionSelect)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "submissions.getById");
    }

    return data ? mapSubmissionRow(data as Record<string, unknown>) : null;
  }

  async getSubmissionContent(submissionId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("submission_contents")
      .select("typed_text")
      .eq("submission_id", submissionId)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "submission_contents.get");
    }

    return (data as { typed_text: string } | null)?.typed_text ?? null;
  }

  async getTeacherProfileById(id: string): Promise<TeacherProfileRecord | null> {
    const { data, error } = await this.client
      .from("teacher_profiles")
      .select("id, user_id, display_name")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "teacher_profiles.getById");
    }

    return data ? mapTeacherProfileRow(data as Record<string, unknown>) : null;
  }

  async getTeacherProfileByUserId(userId: string): Promise<TeacherProfileRecord | null> {
    const { data, error } = await this.client
      .from("teacher_profiles")
      .select("id, user_id, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "teacher_profiles.getByUserId");
    }

    return data ? mapTeacherProfileRow(data as Record<string, unknown>) : null;
  }

  async hasActiveParentLink(parentUserId: string, studentProfileId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("parent_student_links")
      .select("id")
      .eq("parent_user_id", parentUserId)
      .eq("student_profile_id", studentProfileId)
      .eq("status", "active")
      .limit(1);

    if (error) {
      throw toDatabaseError(error, "parent_student_links.hasActive");
    }

    return ((data as unknown[] | null)?.length ?? 0) > 0;
  }

  async hasActiveTeacherLink(teacherUserId: string, studentProfileId: string): Promise<boolean> {
    const studentProfileIds = await this.listTeacherLinkedStudentProfileIds(teacherUserId);
    return studentProfileIds.includes(studentProfileId);
  }

  async listActiveBadges(limit: number): Promise<BadgeRecord[]> {
    const { data, error } = await this.client
      .from("badges")
      .select("id, code, name_key, name_fallback, description_key, description_fallback, icon_name")
      .eq("active", true)
      .order("code", { ascending: true })
      .limit(limit);

    if (error) {
      throw toDatabaseError(error, "badges.listActive");
    }

    return ((data as Record<string, unknown>[] | null) ?? []).map((row) => mapBadgeRow(row));
  }

  async listActivityDaysForStudents(
    studentProfileIds: readonly string[],
    range: ActivityDateRange,
  ): Promise<StudentActivityDayRecord[]> {
    if (studentProfileIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from("student_activity_days")
      .select(
        "student_profile_id, activity_date, practiced_skills, assignments_completed, minutes_practiced, words_written, revisions_completed, feedback_applied, handwriting_minutes",
      )
      .in("student_profile_id", [...studentProfileIds])
      .gte("activity_date", range.fromDate)
      .lte("activity_date", range.toDate)
      .order("activity_date", { ascending: true });

    if (error) {
      throw toDatabaseError(error, "student_activity_days.listForStudents");
    }

    return ((data as Record<string, unknown>[] | null) ?? []).map((row) => mapActivityDayRow(row));
  }

  async listClassStudents(classId: string, limit: number): Promise<ClassRosterStudentRecord[]> {
    const { data, error } = await this.client
      .from("class_students")
      .select(
        "student_profile_id, student_profile:student_profiles(id, grade_level, user:users(display_name))",
      )
      .eq("class_id", classId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw toDatabaseError(error, "class_students.listRoster");
    }

    return ((data as unknown as Record<string, unknown>[] | null) ?? []).map((row) => {
      const profileRow = firstJoinRow(row.student_profile);

      return {
        displayName: joinedDisplayName(row.student_profile),
        gradeLevel: (profileRow?.grade_level as number | undefined) ?? 0,
        studentProfileId: row.student_profile_id as string,
      };
    });
  }

  async listParentLinkedStudentProfileIds(parentUserId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("parent_student_links")
      .select("student_profile_id")
      .eq("parent_user_id", parentUserId)
      .eq("status", "active");

    if (error) {
      throw toDatabaseError(error, "parent_student_links.list");
    }

    return ((data as Array<{ student_profile_id: string }> | null) ?? []).map((row) => row.student_profile_id);
  }

  async listParentLinkedStudents(
    parentUserId: string,
    limit: number,
  ): Promise<ParentLinkedStudentRecord[]> {
    const { data, error } = await this.client
      .from("parent_student_links")
      .select(
        "student_profile_id, relationship_label, student_profile:student_profiles(id, grade_level, user:users(display_name))",
      )
      .eq("parent_user_id", parentUserId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw toDatabaseError(error, "parent_student_links.listStudents");
    }

    return ((data as unknown as Record<string, unknown>[] | null) ?? []).map((row) => {
      const profileRow = firstJoinRow(row.student_profile);

      return {
        displayName: joinedDisplayName(row.student_profile),
        gradeLevel: (profileRow?.grade_level as number | undefined) ?? 0,
        relationshipLabel: (row.relationship_label as string | undefined) ?? "family",
        studentProfileId: row.student_profile_id as string,
      };
    });
  }

  async listProgressTotalsForStudents(
    studentProfileIds: readonly string[],
  ): Promise<StudentProgressTotalsRecord[]> {
    if (studentProfileIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from("student_progress_totals")
      .select(
        "student_profile_id, assignments_completed, minutes_this_week, weekly_minutes_goal, words_written, revisions_completed, rubric_improvement, ai_feedback_applied, handwriting_minutes, current_streak_days, best_streak_days, practiced_today_on, streak_status",
      )
      .in("student_profile_id", [...studentProfileIds]);

    if (error) {
      throw toDatabaseError(error, "student_progress_totals.listForStudents");
    }

    return ((data as Record<string, unknown>[] | null) ?? []).map((row) => mapProgressTotalsRow(row));
  }

  async listRubricCriteria(rubricId: string): Promise<RubricCriterionRecord[]> {
    const { data, error } = await this.client
      .from("rubric_criteria")
      .select(
        "id, rubric_id, sort_order, skill, label_key, label_fallback, description_key, description_fallback, max_score",
      )
      .eq("rubric_id", rubricId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw toDatabaseError(error, "rubric_criteria.list");
    }

    return ((data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      descriptionFallback: row.description_fallback as string,
      descriptionKey: row.description_key as string,
      id: row.id as string,
      labelFallback: row.label_fallback as string,
      labelKey: row.label_key as string,
      maxScore: row.max_score as number,
      rubricId: row.rubric_id as string,
      skill: row.skill as string,
      sortOrder: row.sort_order as number,
    }));
  }

  async listSkillProgressForStudents(
    studentProfileIds: readonly string[],
  ): Promise<StudentSkillProgressRecord[]> {
    if (studentProfileIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from("student_skill_progress")
      .select("student_profile_id, skill, current_score, previous_score, level, updated_at")
      .in("student_profile_id", [...studentProfileIds])
      .order("skill", { ascending: true });

    if (error) {
      throw toDatabaseError(error, "student_skill_progress.listForStudents");
    }

    return ((data as Record<string, unknown>[] | null) ?? []).map((row) => mapSkillProgressRow(row));
  }

  async listStudentAssignments(
    studentProfileId: string,
    options: ListStudentAssignmentsOptions,
  ): Promise<StudentAssignmentWithAssignment[]> {
    let query = this.client
      .from("student_assignments")
      .select(studentAssignmentSelect)
      .eq("student_profile_id", studentProfileId);

    if (options.statuses && options.statuses.length > 0) {
      query = query.in("status", [...options.statuses]);
    }

    if (options.assignmentType) {
      query = query.eq("assignments.assignment_type", options.assignmentType);
    }

    const orderColumn = options.orderBy === "updatedAt" ? "updated_at" : "created_at";
    const { data, error } = await query.order(orderColumn, { ascending: false }).limit(options.limit);

    if (error) {
      throw toDatabaseError(error, "student_assignments.list");
    }

    const rows = (data as unknown as Record<string, unknown>[] | null) ?? [];
    return rows
      .map((row) => mapStudentAssignmentRow(row))
      .filter((record) => !options.assignmentType || record.assignment.assignmentType === options.assignmentType);
  }

  async listStudentBadges(studentProfileId: string): Promise<StudentBadgeRecord[]> {
    const { data, error } = await this.client
      .from("student_badges")
      .select("student_profile_id, badge_id, status, progress_percent, unlocked_at")
      .eq("student_profile_id", studentProfileId);

    if (error) {
      throw toDatabaseError(error, "student_badges.list");
    }

    return ((data as Record<string, unknown>[] | null) ?? []).map((row) => mapStudentBadgeRow(row));
  }

  async listSubmissionQueueForClasses(
    classIds: readonly string[],
    options: ListSubmissionQueueOptions,
  ): Promise<SubmissionQueueRecord[]> {
    if (classIds.length === 0) {
      return [];
    }

    let query = this.client
      .from("submissions")
      .select(
        [
          "id",
          "student_profile_id",
          "student_assignment_id",
          "status",
          "word_count",
          "submitted_at",
          "submission_canvas_documents(canvas_document_id)",
          "student_assignment:student_assignments!inner(class_id, assignment_id, assignment:assignments(title_key, title_fallback))",
          "student_profile:student_profiles(id, user:users(display_name))",
        ].join(", "),
      )
      .in("student_assignment.class_id", [...classIds]);

    if (options.statuses && options.statuses.length > 0) {
      query = query.in("status", [...options.statuses]);
    }

    const { data, error } = await query
      .order("submitted_at", { ascending: false })
      .limit(options.limit);

    if (error) {
      throw toDatabaseError(error, "submissions.listQueueForClasses");
    }

    return ((data as unknown as Record<string, unknown>[] | null) ?? []).map((row) =>
      mapSubmissionQueueRow(row),
    );
  }

  async listSubmissionRevisions(submissionId: string): Promise<SubmissionRevisionRecord[]> {
    const { data, error } = await this.client
      .from("submission_revisions")
      .select(revisionSelect)
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true });

    if (error) {
      throw toDatabaseError(error, "submission_revisions.list");
    }

    return ((data as Record<string, unknown>[] | null) ?? []).map((row) => mapRevisionRow(row));
  }

  async listTeacherClasses(teacherProfileId: string, limit: number): Promise<ClassRecord[]> {
    const { data, error } = await this.client
      .from("classes")
      .select("id, teacher_profile_id, name, grade_level, status")
      .eq("teacher_profile_id", teacherProfileId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw toDatabaseError(error, "classes.listByTeacher");
    }

    return ((data as Record<string, unknown>[] | null) ?? []).map((row) => mapClassRow(row));
  }

  async listTeacherLinkedStudentProfileIds(teacherUserId: string): Promise<string[]> {
    const teacherProfile = await this.getTeacherProfileByUserId(teacherUserId);

    if (!teacherProfile) {
      return [];
    }

    const classes = await this.client
      .from("classes")
      .select("id")
      .eq("teacher_profile_id", teacherProfile.id)
      .eq("status", "active");

    if (classes.error) {
      throw toDatabaseError(classes.error, "classes.listByTeacher");
    }

    const classIds = ((classes.data as Array<{ id: string }> | null) ?? []).map((row) => row.id);

    if (classIds.length === 0) {
      return [];
    }

    const enrollments = await this.client
      .from("class_students")
      .select("student_profile_id")
      .in("class_id", classIds)
      .eq("status", "active");

    if (enrollments.error) {
      throw toDatabaseError(enrollments.error, "class_students.list");
    }

    const studentProfileIds = ((enrollments.data as Array<{ student_profile_id: string }> | null) ?? []).map(
      (row) => row.student_profile_id,
    );

    return [...new Set(studentProfileIds)];
  }

  async publishFeedback(input: PublishFeedbackInput): Promise<FeedbackWithDetails> {
    const { error } = await this.client.rpc("writerhabit_publish_feedback_workflow", {
      p_feedback: input.feedback,
      p_grammar_suggestions: input.grammarSuggestions,
      p_idempotency_key: input.idempotencyKey,
      p_revision_task: input.revisionTask,
      p_rubric_scores: input.rubricScores,
      p_safety_flags: input.safetyFlags,
      p_student_profile_id: input.studentProfileId,
      p_submission_id: input.submissionId,
    });

    if (error) {
      throw toDatabaseError(error, "workflow.publishFeedback");
    }

    const feedback = await this.getFeedbackBySubmissionId(input.submissionId);

    if (!feedback) {
      throw toDatabaseError({ message: "workflow_resource_missing: feedback" }, "workflow.publishFeedback");
    }

    return feedback;
  }

  async recordAiCoachInteraction(input: RecordAiCoachInteractionInput): Promise<void> {
    const { error } = await this.client.from("ai_coach_interactions").insert({
      action: input.action,
      draft_excerpt: input.draftExcerpt ?? null,
      provider_request_id: input.providerRequestId ?? null,
      response_message_key: input.responseMessageKey ?? null,
      response_title_key: input.responseTitleKey ?? null,
      safety_flags: input.safetyFlags,
      selected_text_excerpt: input.selectedTextExcerpt ?? null,
      status: input.status,
      student_assignment_id: input.studentAssignmentId ?? null,
      student_profile_id: input.studentProfileId,
    });

    if (error) {
      throw toDatabaseError(error, "ai_coach_interactions.insert");
    }
  }

  async saveDraft(input: SaveDraftInput): Promise<DraftRecord> {
    const { data, error } = await this.client
      .from("writing_drafts")
      .upsert(
        {
          autosave_version: input.autosaveVersion,
          canvas_document_ids: input.canvasDocumentIds,
          client_updated_at: new Date().toISOString(),
          paragraph_count: input.paragraphCount,
          revision_number: input.revisionNumber,
          sentence_count: input.sentenceCount,
          student_assignment_id: input.studentAssignmentId,
          student_profile_id: input.studentProfileId,
          text_content: input.textContent,
          text_preview: input.textPreview,
          word_count: input.wordCount,
        },
        { onConflict: "student_assignment_id" },
      )
      .select(draftSelect)
      .single();

    if (error || !data) {
      throw toDatabaseError(error ?? { message: "missing upserted draft row" }, "writing_drafts.upsert");
    }

    return mapDraftRow(data as Record<string, unknown>);
  }

  async transitionReviewJob(input: TransitionReviewJobInput): Promise<ReviewJobRecord> {
    const { data, error } = await this.client.rpc("writerhabit_transition_review_job_workflow", {
      p_failure_code: input.failureCode ?? null,
      p_idempotency_key: input.idempotencyKey,
      p_safety_flags: input.safetyFlags ?? [],
      p_student_profile_id: input.studentProfileId,
      p_submission_id: input.submissionId,
      p_transition: input.transition,
    });

    if (error || !data) {
      throw toDatabaseError(error ?? { message: "missing workflow review job row" }, "workflow.reviewJob");
    }

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;

    if (!row) {
      throw toDatabaseError({ message: "missing workflow review job row" }, "workflow.reviewJob");
    }

    return mapReviewJobRow(row);
  }

  async updateStudentAssignment(id: string, update: StudentAssignmentUpdate): Promise<void> {
    const patch: Record<string, unknown> = {};

    if (update.status !== undefined) {
      patch.status = update.status;
    }
    if (update.startedAt !== undefined) {
      patch.started_at = update.startedAt;
    }
    if (update.submittedAt !== undefined) {
      patch.submitted_at = update.submittedAt;
    }
    if (update.completedAt !== undefined) {
      patch.completed_at = update.completedAt;
    }
    if (update.currentSubmissionId !== undefined) {
      patch.current_submission_id = update.currentSubmissionId;
    }

    if (Object.keys(patch).length === 0) {
      return;
    }

    const { error } = await this.client.from("student_assignments").update(patch).eq("id", id);

    if (error) {
      throw toDatabaseError(error, "student_assignments.update");
    }
  }

  async upsertEntitlement(input: UpsertEntitlementInput): Promise<EntitlementRecord> {
    const existing = await this.findEntitlementForUpsert(input);
    const values: Record<string, unknown> = {
      billing_period: input.billingPeriod,
      can_access_premium: input.canAccessPremium,
      current_period_ends_at: input.currentPeriodEndsAt,
      current_plan_id: input.currentPlanId,
      management_url: input.managementUrl,
      owner_user_id: input.ownerUserId,
      provider: input.provider,
      provider_customer_id: input.providerCustomerId,
      provider_subscription_id: input.providerSubscriptionId,
      scope_id: input.scopeId,
      scope_type: input.scopeType,
      status: input.status,
      trial_ends_at: input.trialEndsAt,
    };

    if (input.providerLastEventId !== undefined) {
      values.provider_last_event_id = input.providerLastEventId;
    }
    if (input.providerLastEventTimestampMs !== undefined) {
      values.provider_last_event_timestamp_ms = input.providerLastEventTimestampMs;
    }
    if (input.providerLastEventType !== undefined) {
      values.provider_last_event_type = input.providerLastEventType;
    }

    if (existing) {
      const { data, error } = await this.client
        .from("entitlements")
        .update(values)
        .eq("id", existing.id)
        .select(entitlementSelect)
        .single();

      if (error || !data) {
        throw toDatabaseError(error ?? { message: "missing entitlement after update" }, "entitlements.update");
      }

      return mapEntitlementRow(data as Record<string, unknown>);
    }

    const { data, error } = await this.client
      .from("entitlements")
      .insert(values)
      .select(entitlementSelect)
      .single();

    if (error || !data) {
      throw toDatabaseError(error ?? { message: "missing entitlement after insert" }, "entitlements.insert");
    }

    return mapEntitlementRow(data as Record<string, unknown>);
  }
}

export function createSupabaseDatabase(config: SupabaseDatabaseConfig): Database {
  const client = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return new SupabaseDatabase(client);
}
