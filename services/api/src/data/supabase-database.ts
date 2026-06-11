import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { ApiHttpError } from "../runtime/errors";
import type {
  ActivityDateRange,
  AssignmentRecord,
  BadgeRecord,
  ClassRecord,
  ClassRosterStudentRecord,
  CreateSubmissionInput,
  CreateSubmissionRevisionInput,
  Database,
  DraftRecord,
  ListStudentAssignmentsOptions,
  ListSubmissionQueueOptions,
  ParentLinkedStudentRecord,
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
  WeeklyReviewRecord,
} from "./types";

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
  "assignment:assignments(id, title_key, title_fallback, prompt_key, prompt_fallback, instructions, assignment_type, grade_level_min, grade_level_max, skill_focus, difficulty, estimated_minutes, rubric_id, class_id, status, due_at)",
].join(", ");

const draftSelect =
  "id, student_assignment_id, student_profile_id, text_content, text_preview, canvas_document_ids, autosave_version, word_count, sentence_count, paragraph_count, revision_number, created_at, updated_at";

const submissionSelect =
  "id, student_assignment_id, student_profile_id, status, typed_text_excerpt, word_count, sentence_count, paragraph_count, revision_number, idempotency_key, submitted_at, created_at, updated_at, submission_canvas_documents(canvas_document_id)";

const revisionSelect =
  "id, submission_id, student_profile_id, revision_task_id, revised_excerpt, idempotency_key, created_at";

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
    const submittedAt = new Date().toISOString();
    const { data, error } = await this.client
      .from("submissions")
      .insert({
        idempotency_key: input.idempotencyKey,
        paragraph_count: input.paragraphCount,
        revision_number: input.revisionNumber,
        sentence_count: input.sentenceCount,
        status: "submitted",
        student_assignment_id: input.studentAssignmentId,
        student_profile_id: input.studentProfileId,
        submitted_at: submittedAt,
        typed_text_excerpt: input.typedTextExcerpt,
        word_count: input.wordCount,
      })
      .select(
        "id, student_assignment_id, student_profile_id, status, typed_text_excerpt, word_count, sentence_count, paragraph_count, revision_number, idempotency_key, submitted_at, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      throw toDatabaseError(error ?? { message: "missing inserted submission row" }, "submissions.insert");
    }

    const submissionRow = data as Record<string, unknown>;
    const submissionId = submissionRow.id as string;

    const contents = await this.client.from("submission_contents").insert({
      student_profile_id: input.studentProfileId,
      submission_id: submissionId,
      typed_text: input.typedText,
    });

    if (contents.error) {
      throw toDatabaseError(contents.error, "submission_contents.insert");
    }

    if (input.canvasDocumentIds.length > 0) {
      const links = await this.client.from("submission_canvas_documents").insert(
        input.canvasDocumentIds.map((canvasDocumentId) => ({
          canvas_document_id: canvasDocumentId,
          submission_id: submissionId,
        })),
      );

      if (links.error) {
        throw toDatabaseError(links.error, "submission_canvas_documents.insert");
      }
    }

    const reviewJob = await this.client.from("review_jobs").insert({
      idempotency_key: input.idempotencyKey,
      status: "queued",
      student_profile_id: input.studentProfileId,
      submission_id: submissionId,
    });

    if (reviewJob.error) {
      throw toDatabaseError(reviewJob.error, "review_jobs.insert");
    }

    const studentAssignment = await this.client
      .from("student_assignments")
      .update({
        current_submission_id: submissionId,
        status: "submitted",
        submitted_at: submittedAt,
      })
      .eq("id", input.studentAssignmentId);

    if (studentAssignment.error) {
      throw toDatabaseError(studentAssignment.error, "student_assignments.update");
    }

    return {
      ...mapSubmissionRow({ ...submissionRow, submission_canvas_documents: [] }),
      canvasDocumentIds: [...input.canvasDocumentIds],
    };
  }

  async createSubmissionRevision(input: CreateSubmissionRevisionInput): Promise<SubmissionRevisionRecord> {
    const { data, error } = await this.client
      .from("submission_revisions")
      .insert({
        idempotency_key: input.idempotencyKey,
        revised_excerpt: input.revisedExcerpt,
        revision_task_id: input.revisionTaskId,
        student_profile_id: input.studentProfileId,
        submission_id: input.submissionId,
      })
      .select(revisionSelect)
      .single();

    if (error || !data) {
      throw toDatabaseError(error ?? { message: "missing inserted revision row" }, "submission_revisions.insert");
    }

    return mapRevisionRow(data as Record<string, unknown>);
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
