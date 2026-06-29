import { randomUUID } from "node:crypto";

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
  RevisionTaskRecord,
  ReviewJobRecord,
  RubricCriterionRecord,
  SaveDraftInput,
  StudentActivityDayRecord,
  StudentAssignmentRecord,
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
import { ApiHttpError, createResourceNotFoundError } from "../runtime/errors";
import { assertReviewJobTransition } from "../features/workflows/writing-workflow-state-machine";
import {
  shouldIgnoreStaleProviderEvent,
  withStaleProviderEventMetadata,
} from "./entitlement-event-ordering";

export interface MemoryParentLink {
  parentUserId: string;
  relationshipLabel?: string;
  status: "pending" | "active" | "revoked";
  studentProfileId: string;
}

export interface MemoryTeacherLink {
  studentProfileId: string;
  teacherUserId: string;
}

export interface MemoryClassStudent {
  classId: string;
  status: "active" | "removed";
  studentProfileId: string;
}

export interface MemoryUser {
  displayName: string;
  id: string;
}

export interface MemoryDatabaseSeed {
  activityDays?: StudentActivityDayRecord[];
  assignments?: AssignmentRecord[];
  badges?: BadgeRecord[];
  canvasDocuments?: CanvasDocumentRecord[];
  classStudents?: MemoryClassStudent[];
  classes?: ClassRecord[];
  drafts?: DraftRecord[];
  entitlementProviderEvents?: EntitlementProviderEventRecord[];
  entitlements?: EntitlementRecord[];
  feedback?: FeedbackRecord[];
  feedbackRubricScores?: FeedbackRubricScoreRecord[];
  grammarSuggestions?: GrammarSuggestionRecord[];
  parentLinks?: MemoryParentLink[];
  progressTotals?: StudentProgressTotalsRecord[];
  rubricCriteria?: RubricCriterionRecord[];
  revisionTasks?: RevisionTaskRecord[];
  skillProgress?: StudentSkillProgressRecord[];
  studentAssignments?: StudentAssignmentRecord[];
  studentBadges?: StudentBadgeRecord[];
  studentProfiles?: StudentProfileRecord[];
  submissions?: SubmissionRecord[];
  teacherLinks?: MemoryTeacherLink[];
  teacherProfiles?: TeacherProfileRecord[];
  users?: MemoryUser[];
  weeklyReviews?: WeeklyReviewRecord[];
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * In-memory Database fake for Vitest integration tests.
 *
 * Mirrors the uniqueness and join behavior the Supabase implementation relies
 * on (draft per student assignment, idempotency keys per submission) without
 * any network access. Collections are public so tests can assert side effects
 * such as review job creation and student assignment transitions.
 */
export class MemoryDatabase implements Database {
  readonly activityDays: StudentActivityDayRecord[];
  readonly assignments: AssignmentRecord[];
  readonly badges: BadgeRecord[];
  readonly canvasDocuments: CanvasDocumentRecord[];
  readonly classStudents: MemoryClassStudent[];
  readonly classes: ClassRecord[];
  readonly drafts: DraftRecord[];
  readonly entitlementProviderEvents: EntitlementProviderEventRecord[];
  readonly entitlements: EntitlementRecord[];
  readonly feedback: FeedbackRecord[];
  readonly feedbackRubricScores: FeedbackRubricScoreRecord[];
  readonly grammarSuggestions: GrammarSuggestionRecord[];
  readonly parentLinks: MemoryParentLink[];
  readonly progressTotals: StudentProgressTotalsRecord[];
  readonly reviewJobs: ReviewJobRecord[] = [];
  readonly revisionTasks: RevisionTaskRecord[];
  readonly rubricCriteria: RubricCriterionRecord[];
  readonly skillProgress: StudentSkillProgressRecord[];
  readonly studentAssignments: StudentAssignmentRecord[];
  readonly studentBadges: StudentBadgeRecord[];
  readonly studentProfiles: StudentProfileRecord[];
  readonly submissionContents = new Map<string, string>();
  readonly submissionRevisions: SubmissionRevisionRecord[] = [];
  readonly submissions: SubmissionRecord[];
  readonly teacherLinks: MemoryTeacherLink[];
  readonly teacherProfiles: TeacherProfileRecord[];
  readonly users: MemoryUser[];
  readonly weeklyReviews: WeeklyReviewRecord[];

  constructor(seed: MemoryDatabaseSeed = {}) {
    this.activityDays = [...(seed.activityDays ?? [])];
    this.assignments = [...(seed.assignments ?? [])];
    this.badges = [...(seed.badges ?? [])];
    this.canvasDocuments = seed.canvasDocuments?.map((record) => this.copyCanvasDocument(record)) ?? [];
    this.classStudents = [...(seed.classStudents ?? [])];
    this.classes = [...(seed.classes ?? [])];
    this.drafts = [...(seed.drafts ?? [])];
    this.entitlementProviderEvents = [...(seed.entitlementProviderEvents ?? [])];
    this.entitlements = [...(seed.entitlements ?? [])];
    this.feedback = [...(seed.feedback ?? [])];
    this.feedbackRubricScores = [...(seed.feedbackRubricScores ?? [])];
    this.grammarSuggestions = [...(seed.grammarSuggestions ?? [])];
    this.parentLinks = [...(seed.parentLinks ?? [])];
    this.progressTotals = [...(seed.progressTotals ?? [])];
    this.rubricCriteria = [...(seed.rubricCriteria ?? [])];
    this.revisionTasks = [...(seed.revisionTasks ?? [])];
    this.skillProgress = [...(seed.skillProgress ?? [])];
    this.studentAssignments = [...(seed.studentAssignments ?? [])];
    this.studentBadges = [...(seed.studentBadges ?? [])];
    this.studentProfiles = [...(seed.studentProfiles ?? [])];
    this.submissions = [...(seed.submissions ?? [])];
    this.teacherLinks = [...(seed.teacherLinks ?? [])];
    this.teacherProfiles = [...(seed.teacherProfiles ?? [])];
    this.users = [...(seed.users ?? [])];
    this.weeklyReviews = [...(seed.weeklyReviews ?? [])];
  }

  private displayNameForStudentProfile(studentProfileId: string): string {
    const profile = this.studentProfiles.find((record) => record.id === studentProfileId);
    const user = profile ? this.users.find((record) => record.id === profile.userId) : undefined;
    return user?.displayName ?? "Student";
  }

  private copyCanvasDocument(record: CanvasDocumentRecord): CanvasDocumentRecord {
    return {
      ...record,
      strokes: record.strokes.map((stroke) =>
        typeof stroke === "object" && stroke !== null ? JSON.parse(JSON.stringify(stroke)) : stroke,
      ),
    };
  }

  private activeClassIdsOwnedByTeacherUser(teacherUserId: string): string[] {
    const teacherProfile = this.teacherProfiles.find((record) => record.userId === teacherUserId);

    if (!teacherProfile) {
      return [];
    }

    return this.classes
      .filter((record) => record.teacherProfileId === teacherProfile.id && record.status === "active")
      .map((record) => record.id);
  }

  private withAssignment(record: StudentAssignmentRecord): StudentAssignmentWithAssignment {
    const assignment = this.assignments.find((candidate) => candidate.id === record.assignmentId);

    if (!assignment) {
      throw new Error(`MemoryDatabase seed is missing assignment ${record.assignmentId}`);
    }

    return { ...record, assignment: { ...assignment } };
  }

  private withFeedbackDetails(feedback: FeedbackRecord): FeedbackWithDetails | null {
    const submission = this.submissions.find((candidate) => candidate.id === feedback.submissionId);

    if (!submission) {
      return null;
    }

    const studentAssignment = this.studentAssignments.find(
      (candidate) => candidate.id === submission.studentAssignmentId,
    );

    if (!studentAssignment) {
      return null;
    }

    const assignment = this.assignments.find((candidate) => candidate.id === studentAssignment.assignmentId);

    if (!assignment) {
      return null;
    }

    return {
      assignment: { ...assignment, skillFocus: [...assignment.skillFocus] },
      feedback: { ...feedback },
      grammarSuggestions: this.grammarSuggestions
        .filter((record) => record.feedbackId === feedback.id)
        .map((record) => ({ ...record })),
      revisionTask: this.revisionTasks.find((record) => record.feedbackId === feedback.id)
        ? { ...this.revisionTasks.find((record) => record.feedbackId === feedback.id)! }
        : null,
      rubricScores: this.feedbackRubricScores
        .filter((record) => record.feedbackId === feedback.id)
        .map((record) => ({ ...record })),
      studentAssignment: { ...studentAssignment, dailySelectionMetadata: { ...studentAssignment.dailySelectionMetadata } },
      submission: { ...submission, canvasDocumentIds: [...submission.canvasDocumentIds] },
    };
  }

  private copyEntitlement(record: EntitlementRecord): EntitlementRecord {
    return { ...record };
  }

  private copyEntitlementProviderEvent(record: EntitlementProviderEventRecord): EntitlementProviderEventRecord {
    return { ...record, metadata: { ...record.metadata } };
  }

  private createFreeEntitlement(input: UpsertEntitlementInput): EntitlementRecord {
    const timestamp = nowIso();

    return {
      billingPeriod: input.billingPeriod,
      canAccessPremium: input.canAccessPremium,
      createdAt: timestamp,
      currentPeriodEndsAt: input.currentPeriodEndsAt,
      currentPlanId: input.currentPlanId,
      id: randomUUID(),
      managementUrl: input.managementUrl,
      ownerUserId: input.ownerUserId,
      provider: input.provider,
      providerCustomerId: input.providerCustomerId,
      providerLastEventId: input.providerLastEventId ?? null,
      providerLastEventTimestampMs: input.providerLastEventTimestampMs ?? null,
      providerLastEventType: input.providerLastEventType ?? null,
      providerSubscriptionId: input.providerSubscriptionId,
      scopeId: input.scopeId,
      scopeType: input.scopeType,
      status: input.status,
      trialEndsAt: input.trialEndsAt,
      updatedAt: timestamp,
    };
  }

  private findMatchingEntitlement(input: UpsertEntitlementInput): EntitlementRecord | undefined {
    if (input.provider && input.providerSubscriptionId) {
      return this.entitlements.find(
        (record) =>
          record.provider === input.provider &&
          record.providerSubscriptionId === input.providerSubscriptionId,
      );
    }

    return this.entitlements.find(
      (record) =>
        record.ownerUserId === input.ownerUserId &&
        record.scopeType === input.scopeType &&
        record.scopeId === input.scopeId &&
        record.provider === input.provider,
    );
  }

  async applyEntitlementProviderEvent(
    input: ApplyEntitlementProviderEventInput,
  ): Promise<ApplyEntitlementProviderEventResult> {
    const existing = this.entitlementProviderEvents.find(
      (record) =>
        record.provider === input.provider &&
        record.providerEventId === input.providerEventId,
    );
    let event = existing;
    let wasDuplicate = Boolean(existing);

    if (!event) {
      event = {
        eventType: input.eventType,
        id: randomUUID(),
        metadata: { ...input.metadata },
        ownerUserId: input.ownerUserId,
        processedAt: null,
        processingStatus: "received",
        provider: input.provider,
        providerEventId: input.providerEventId,
        receivedAt: nowIso(),
      };
      this.entitlementProviderEvents.push(event);
    }

    if (wasDuplicate && (event.processingStatus === "processed" || event.processingStatus === "ignored")) {
      return {
        entitlement: input.ownerUserId ? await this.getLatestEntitlementForUser(input.ownerUserId) : null,
        event: this.copyEntitlementProviderEvent(event),
        wasDuplicate,
      };
    }

    let entitlement: EntitlementRecord | null = null;
    let metadata = { ...input.metadata };
    let processingStatus = input.processingStatus ?? (input.entitlement ? "processed" : "ignored");

    if (input.entitlement) {
      const existingEntitlement = this.findMatchingEntitlement(input.entitlement);

      if (
        existingEntitlement &&
        shouldIgnoreStaleProviderEvent({
          existing: this.copyEntitlement(existingEntitlement),
          incoming: input.entitlement,
        })
      ) {
        entitlement = this.copyEntitlement(existingEntitlement);
        metadata = withStaleProviderEventMetadata({
          existing: entitlement,
          incoming: input.entitlement,
          metadata,
        });
        processingStatus = "ignored";
      } else {
        entitlement = await this.upsertEntitlement(input.entitlement);
      }
    }

    event.eventType = input.eventType;
    event.metadata = metadata;
    event.ownerUserId = input.ownerUserId;
    event.processedAt = nowIso();
    event.processingStatus = processingStatus;

    return {
      entitlement,
      event: this.copyEntitlementProviderEvent(event),
      wasDuplicate,
    };
  }

  async countClassActiveAssignments(classId: string): Promise<number> {
    return this.assignments.filter(
      (record) => record.classId === classId && record.status === "published",
    ).length;
  }

  async countClassStudentAssignments(
    classId: string,
    statuses?: readonly StudentAssignmentStatus[],
  ): Promise<number> {
    return this.studentAssignments.filter(
      (record) => record.classId === classId && (!statuses || statuses.includes(record.status)),
    ).length;
  }

  async countStudentAssignments(
    studentProfileId: string,
    statuses?: readonly StudentAssignmentStatus[],
  ): Promise<number> {
    return this.studentAssignments.filter(
      (record) =>
        record.studentProfileId === studentProfileId && (!statuses || statuses.includes(record.status)),
    ).length;
  }

  async createSubmission(input: CreateSubmissionInput): Promise<SubmissionRecord> {
    const timestamp = nowIso();
    const submission: SubmissionRecord = {
      canvasDocumentIds: [...input.canvasDocumentIds],
      createdAt: timestamp,
      id: randomUUID(),
      idempotencyKey: input.idempotencyKey,
      paragraphCount: input.paragraphCount,
      revisionNumber: input.revisionNumber,
      sentenceCount: input.sentenceCount,
      status: "submitted",
      studentAssignmentId: input.studentAssignmentId,
      studentProfileId: input.studentProfileId,
      submittedAt: timestamp,
      typedTextExcerpt: input.typedTextExcerpt,
      wordCount: input.wordCount,
    };

    this.submissions.push(submission);
    this.submissionContents.set(submission.id, input.typedText);
    this.reviewJobs.push({
      createdAt: timestamp,
      id: randomUUID(),
      idempotencyKey: input.idempotencyKey,
      queuedAt: timestamp,
      safetyFlags: [],
      status: "queued",
      studentProfileId: input.studentProfileId,
      submissionId: submission.id,
    });

    const studentAssignment = this.studentAssignments.find(
      (candidate) => candidate.id === input.studentAssignmentId,
    );

    if (studentAssignment) {
      studentAssignment.currentSubmissionId = submission.id;
      studentAssignment.status = "submitted";
      studentAssignment.submittedAt = timestamp;
      studentAssignment.updatedAt = timestamp;
    }

    return { ...submission };
  }

  async createSubmissionRevision(input: CreateSubmissionRevisionInput): Promise<SubmissionRevisionRecord> {
    const existing = this.submissionRevisions.find(
      (record) => record.submissionId === input.submissionId && record.idempotencyKey === input.idempotencyKey,
    );

    if (existing) {
      return { ...existing };
    }

    const submission = this.submissions.find((candidate) => candidate.id === input.submissionId);
    const revision: SubmissionRevisionRecord = {
      createdAt: nowIso(),
      id: randomUUID(),
      idempotencyKey: input.idempotencyKey,
      revisedExcerpt: input.revisedExcerpt,
      revisionTaskId: input.revisionTaskId,
      studentProfileId: input.studentProfileId,
      submissionId: input.submissionId,
    };

    this.submissionRevisions.push(revision);

    if (submission) {
      submission.status = "completed";
      const studentAssignment = this.studentAssignments.find(
        (candidate) => candidate.id === submission.studentAssignmentId,
      );
      const feedback = this.feedback.find((candidate) => candidate.submissionId === submission.id);
      const timestamp = nowIso();

      if (studentAssignment) {
        studentAssignment.status = "completed";
        studentAssignment.completedAt = timestamp;
        studentAssignment.updatedAt = timestamp;
      }

      const progress = this.progressTotals.find(
        (record) => record.studentProfileId === input.studentProfileId,
      );

      if (progress) {
        progress.aiFeedbackApplied += 1;
        progress.assignmentsCompleted += 1;
        progress.minutesThisWeek += feedback?.progressMinutes ?? 0;
        progress.revisionsCompleted += 1;
        progress.wordsWritten += submission.wordCount;
        progress.practicedTodayOn = timestamp.slice(0, 10);
        progress.streakStatus = "continued";
      } else {
        this.progressTotals.push({
          aiFeedbackApplied: 1,
          assignmentsCompleted: 1,
          bestStreakDays: 0,
          currentStreakDays: 0,
          handwritingMinutes: 0,
          minutesThisWeek: feedback?.progressMinutes ?? 0,
          practicedTodayOn: timestamp.slice(0, 10),
          revisionsCompleted: 1,
          rubricImprovement: 0,
          streakStatus: "continued",
          studentProfileId: input.studentProfileId,
          weeklyMinutesGoal: 0,
          wordsWritten: submission.wordCount,
        });
      }

      const today = timestamp.slice(0, 10);
      const activity = this.activityDays.find(
        (record) => record.studentProfileId === input.studentProfileId && record.activityDate === today,
      );

      if (activity) {
        activity.assignmentsCompleted += 1;
        activity.feedbackApplied += 1;
        activity.minutesPracticed += feedback?.progressMinutes ?? 0;
        activity.revisionsCompleted += 1;
        activity.wordsWritten += submission.wordCount;
        activity.practicedSkills = [
          ...new Set([...activity.practicedSkills, feedback?.progressSkill ?? "revision_quality"]),
        ];
      } else {
        this.activityDays.push({
          activityDate: today,
          assignmentsCompleted: 1,
          feedbackApplied: 1,
          handwritingMinutes: 0,
          minutesPracticed: feedback?.progressMinutes ?? 0,
          practicedSkills: [feedback?.progressSkill ?? "revision_quality"],
          revisionsCompleted: 1,
          studentProfileId: input.studentProfileId,
          wordsWritten: submission.wordCount,
        });
      }
    }

    return { ...revision };
  }

  async deleteDraft(studentAssignmentId: string): Promise<void> {
    const index = this.drafts.findIndex((draft) => draft.studentAssignmentId === studentAssignmentId);

    if (index >= 0) {
      this.drafts.splice(index, 1);
    }
  }

  async findStudentAssignmentForStudents(
    assignmentId: string,
    studentProfileIds: readonly string[],
  ): Promise<StudentAssignmentWithAssignment | null> {
    const matches = this.studentAssignments
      .filter(
        (record) => record.assignmentId === assignmentId && studentProfileIds.includes(record.studentProfileId),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return matches[0] ? this.withAssignment(matches[0]) : null;
  }

  async findSubmissionByIdempotencyKey(
    studentAssignmentId: string,
    idempotencyKey: string,
  ): Promise<SubmissionRecord | null> {
    const submission = this.submissions.find(
      (record) => record.studentAssignmentId === studentAssignmentId && record.idempotencyKey === idempotencyKey,
    );

    return submission ? { ...submission } : null;
  }

  async findSubmissionRevisionByIdempotencyKey(
    submissionId: string,
    idempotencyKey: string,
  ): Promise<SubmissionRevisionRecord | null> {
    const revision = this.submissionRevisions.find(
      (record) => record.submissionId === submissionId && record.idempotencyKey === idempotencyKey,
    );

    return revision ? { ...revision } : null;
  }

  async getCanvasDocumentById(canvasDocumentId: string): Promise<CanvasDocumentRecord | null> {
    const record = this.canvasDocuments.find((candidate) => candidate.id === canvasDocumentId);
    return record ? this.copyCanvasDocument(record) : null;
  }

  async listCanvasDocumentsByIds(canvasDocumentIds: readonly string[]): Promise<CanvasDocumentRecord[]> {
    const idSet = new Set(canvasDocumentIds);
    return this.canvasDocuments
      .filter((candidate) => idSet.has(candidate.id))
      .map((record) => this.copyCanvasDocument(record));
  }

  async listCanvasDocumentsForStudent(studentProfileId: string, limit: number): Promise<CanvasDocumentRecord[]> {
    return this.canvasDocuments
      .filter((record) => record.studentProfileId === studentProfileId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, limit)
      .map((record) => this.copyCanvasDocument(record));
  }

  async upsertCanvasDocument(input: UpsertCanvasDocumentInput): Promise<CanvasDocumentRecord> {
    const timestamp = nowIso();
    const existing = this.canvasDocuments.find((record) => record.id === input.id);

    if (existing) {
      existing.assignmentId = input.assignmentId ?? null;
      existing.clientVersion = input.clientVersion;
      existing.objectPath = input.objectPath ?? null;
      existing.previewImagePath = input.previewImagePath ?? null;
      existing.serverVersion = Math.max(existing.serverVersion, input.clientVersion);
      existing.studentAssignmentId = input.studentAssignmentId ?? null;
      existing.studentProfileId = input.studentProfileId;
      existing.strokeCount = input.strokes.length;
      existing.strokes = input.strokes.map((stroke) =>
        typeof stroke === "object" && stroke !== null ? JSON.parse(JSON.stringify(stroke)) : stroke,
      );
      existing.syncStatus = input.syncStatus ?? "saved";
      existing.template = input.template;
      existing.title = input.title;
      existing.updatedAt = timestamp;
      return this.copyCanvasDocument(existing);
    }

    const record: CanvasDocumentRecord = {
      assignmentId: input.assignmentId ?? null,
      attachedAt: input.assignmentId ? timestamp : null,
      clientVersion: input.clientVersion,
      createdAt: timestamp,
      exportStatus: "not_requested",
      id: input.id,
      objectPath: input.objectPath ?? null,
      previewImagePath: input.previewImagePath ?? null,
      recognizedText: null,
      recognitionStatus: "not_requested",
      serverVersion: input.clientVersion,
      studentAssignmentId: input.studentAssignmentId ?? null,
      studentProfileId: input.studentProfileId,
      strokeCount: input.strokes.length,
      strokes: input.strokes.map((stroke) =>
        typeof stroke === "object" && stroke !== null ? JSON.parse(JSON.stringify(stroke)) : stroke,
      ),
      syncStatus: input.syncStatus ?? "saved",
      template: input.template,
      title: input.title,
      updatedAt: timestamp,
    };

    this.canvasDocuments.push(record);
    return this.copyCanvasDocument(record);
  }

  async getClassById(classId: string): Promise<ClassRecord | null> {
    const record = this.classes.find((candidate) => candidate.id === classId);
    return record ? { ...record } : null;
  }

  async getDraftByStudentAssignmentId(studentAssignmentId: string): Promise<DraftRecord | null> {
    const draft = this.drafts.find((record) => record.studentAssignmentId === studentAssignmentId);
    return draft ? { ...draft, canvasDocumentIds: [...draft.canvasDocumentIds] } : null;
  }

  async getFeedbackBySubmissionId(submissionId: string): Promise<FeedbackWithDetails | null> {
    const feedback = this.feedback.find((record) => record.submissionId === submissionId);
    return feedback ? this.withFeedbackDetails(feedback) : null;
  }

  async getLatestEntitlementForUser(ownerUserId: string): Promise<EntitlementRecord | null> {
    const [record] = this.entitlements
      .filter((candidate) => candidate.ownerUserId === ownerUserId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    return record ? this.copyEntitlement(record) : null;
  }

  async getLatestWeeklyReview(studentProfileId: string): Promise<WeeklyReviewRecord | null> {
    const [latest] = this.weeklyReviews
      .filter((record) => record.studentProfileId === studentProfileId)
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

    return latest ? { ...latest } : null;
  }

  async getMaxSubmissionRevisionNumber(studentAssignmentId: string): Promise<number> {
    return this.submissions
      .filter((record) => record.studentAssignmentId === studentAssignmentId)
      .reduce((max, record) => Math.max(max, record.revisionNumber), 0);
  }

  async getReviewJobBySubmissionId(submissionId: string): Promise<ReviewJobRecord | null> {
    const [job] = this.reviewJobs
      .filter((record) => record.submissionId === submissionId)
      .sort((a, b) => (b.queuedAt ?? "").localeCompare(a.queuedAt ?? ""));

    return job ? { ...job, safetyFlags: [...(job.safetyFlags ?? [])] } : null;
  }

  async getStudentAssignmentById(id: string): Promise<StudentAssignmentWithAssignment | null> {
    const record = this.studentAssignments.find((candidate) => candidate.id === id);
    return record ? this.withAssignment(record) : null;
  }

  async getStudentProfileById(id: string): Promise<StudentProfileRecord | null> {
    const profile = this.studentProfiles.find((record) => record.id === id);
    return profile ? { ...profile } : null;
  }

  async getStudentProfileByUserId(userId: string): Promise<StudentProfileRecord | null> {
    const profile = this.studentProfiles.find((record) => record.userId === userId);
    return profile ? { ...profile } : null;
  }

  async getSubmissionById(id: string): Promise<SubmissionRecord | null> {
    const submission = this.submissions.find((record) => record.id === id);
    return submission ? { ...submission, canvasDocumentIds: [...submission.canvasDocumentIds] } : null;
  }

  async getSubmissionContent(submissionId: string): Promise<string | null> {
    return this.submissionContents.get(submissionId) ?? null;
  }

  async getTeacherProfileById(id: string): Promise<TeacherProfileRecord | null> {
    const profile = this.teacherProfiles.find((record) => record.id === id);
    return profile ? { ...profile } : null;
  }

  async getTeacherProfileByUserId(userId: string): Promise<TeacherProfileRecord | null> {
    const profile = this.teacherProfiles.find((record) => record.userId === userId);
    return profile ? { ...profile } : null;
  }

  async hasActiveParentLink(parentUserId: string, studentProfileId: string): Promise<boolean> {
    return this.parentLinks.some(
      (link) =>
        link.parentUserId === parentUserId &&
        link.studentProfileId === studentProfileId &&
        link.status === "active",
    );
  }

  async hasActiveTeacherLink(teacherUserId: string, studentProfileId: string): Promise<boolean> {
    const linked = await this.listTeacherLinkedStudentProfileIds(teacherUserId);
    return linked.includes(studentProfileId);
  }

  async listActiveBadges(limit: number): Promise<BadgeRecord[]> {
    return this.badges
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code))
      .slice(0, limit)
      .map((record) => ({ ...record }));
  }

  async listActivityDaysForStudents(
    studentProfileIds: readonly string[],
    range: ActivityDateRange,
  ): Promise<StudentActivityDayRecord[]> {
    return this.activityDays
      .filter(
        (record) =>
          studentProfileIds.includes(record.studentProfileId) &&
          record.activityDate >= range.fromDate &&
          record.activityDate <= range.toDate,
      )
      .sort((a, b) => a.activityDate.localeCompare(b.activityDate))
      .map((record) => ({ ...record, practicedSkills: [...record.practicedSkills] }));
  }

  async listClassStudents(classId: string, limit: number): Promise<ClassRosterStudentRecord[]> {
    return this.classStudents
      .filter((record) => record.classId === classId && record.status === "active")
      .slice(0, limit)
      .map((record) => {
        const profile = this.studentProfiles.find(
          (candidate) => candidate.id === record.studentProfileId,
        );

        return {
          displayName: this.displayNameForStudentProfile(record.studentProfileId),
          gradeLevel: profile?.gradeLevel ?? 0,
          studentProfileId: record.studentProfileId,
        };
      });
  }

  async listParentLinkedStudentProfileIds(parentUserId: string): Promise<string[]> {
    return this.parentLinks
      .filter((link) => link.parentUserId === parentUserId && link.status === "active")
      .map((link) => link.studentProfileId);
  }

  async listParentLinkedStudents(
    parentUserId: string,
    limit: number,
  ): Promise<ParentLinkedStudentRecord[]> {
    return this.parentLinks
      .filter((link) => link.parentUserId === parentUserId && link.status === "active")
      .slice(0, limit)
      .map((link) => {
        const profile = this.studentProfiles.find(
          (candidate) => candidate.id === link.studentProfileId,
        );

        return {
          displayName: this.displayNameForStudentProfile(link.studentProfileId),
          gradeLevel: profile?.gradeLevel ?? 0,
          relationshipLabel: link.relationshipLabel ?? "family",
          studentProfileId: link.studentProfileId,
        };
      });
  }

  async listProgressTotalsForStudents(
    studentProfileIds: readonly string[],
  ): Promise<StudentProgressTotalsRecord[]> {
    return this.progressTotals
      .filter((record) => studentProfileIds.includes(record.studentProfileId))
      .map((record) => ({ ...record }));
  }

  async listRubricCriteria(rubricId: string): Promise<RubricCriterionRecord[]> {
    return this.rubricCriteria
      .filter((criterion) => criterion.rubricId === rubricId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((criterion) => ({ ...criterion }));
  }

  async listSkillProgressForStudents(
    studentProfileIds: readonly string[],
  ): Promise<StudentSkillProgressRecord[]> {
    return this.skillProgress
      .filter((record) => studentProfileIds.includes(record.studentProfileId))
      .sort((a, b) => a.skill.localeCompare(b.skill))
      .map((record) => ({ ...record }));
  }

  async listStudentAssignments(
    studentProfileId: string,
    options: ListStudentAssignmentsOptions,
  ): Promise<StudentAssignmentWithAssignment[]> {
    const orderKey = options.orderBy === "updatedAt" ? "updatedAt" : "createdAt";

    return this.studentAssignments
      .filter((record) => record.studentProfileId === studentProfileId)
      .filter((record) => !options.statuses || options.statuses.includes(record.status))
      .map((record) => this.withAssignment(record))
      .filter((record) => !options.assignmentType || record.assignment.assignmentType === options.assignmentType)
      .sort((a, b) => b[orderKey].localeCompare(a[orderKey]))
      .slice(0, options.limit);
  }

  async listStudentBadges(studentProfileId: string): Promise<StudentBadgeRecord[]> {
    return this.studentBadges
      .filter((record) => record.studentProfileId === studentProfileId)
      .map((record) => ({ ...record }));
  }

  async listSubmissionQueueForClasses(
    classIds: readonly string[],
    options: ListSubmissionQueueOptions,
  ): Promise<SubmissionQueueRecord[]> {
    return this.submissions
      .filter((submission) => !options.statuses || options.statuses.includes(submission.status))
      .flatMap((submission) => {
        const studentAssignment = this.studentAssignments.find(
          (candidate) => candidate.id === submission.studentAssignmentId,
        );

        if (!studentAssignment?.classId || !classIds.includes(studentAssignment.classId)) {
          return [];
        }

        const assignment = this.assignments.find(
          (candidate) => candidate.id === studentAssignment.assignmentId,
        );

        const queueRecord: SubmissionQueueRecord = {
          assignmentId: studentAssignment.assignmentId,
          assignmentTitleFallback: assignment?.titleFallback ?? "",
          assignmentTitleKey: assignment?.titleKey ?? "",
          classId: studentAssignment.classId,
          hasCanvas: submission.canvasDocumentIds.length > 0,
          id: submission.id,
          status: submission.status,
          studentAssignmentId: submission.studentAssignmentId,
          studentDisplayName: this.displayNameForStudentProfile(submission.studentProfileId),
          studentProfileId: submission.studentProfileId,
          submittedAt: submission.submittedAt,
          wordCount: submission.wordCount,
        };

        return [queueRecord];
      })
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, options.limit);
  }

  async listSubmissionRevisions(submissionId: string): Promise<SubmissionRevisionRecord[]> {
    return this.submissionRevisions
      .filter((record) => record.submissionId === submissionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((record) => ({ ...record }));
  }

  async listTeacherClasses(teacherProfileId: string, limit: number): Promise<ClassRecord[]> {
    return this.classes
      .filter((record) => record.teacherProfileId === teacherProfileId && record.status === "active")
      .slice(0, limit)
      .map((record) => ({ ...record }));
  }

  async listTeacherLinkedStudentProfileIds(teacherUserId: string): Promise<string[]> {
    // Mirrors the Supabase derivation (active classes -> active enrollments)
    // and keeps supporting the simpler direct teacherLinks seed used by
    // earlier fixtures.
    const classIds = this.activeClassIdsOwnedByTeacherUser(teacherUserId);
    const enrolled = this.classStudents
      .filter((record) => classIds.includes(record.classId) && record.status === "active")
      .map((record) => record.studentProfileId);
    const direct = this.teacherLinks
      .filter((link) => link.teacherUserId === teacherUserId)
      .map((link) => link.studentProfileId);

    return [...new Set([...enrolled, ...direct])];
  }

  async publishFeedback(input: PublishFeedbackInput): Promise<FeedbackWithDetails> {
    const existing = await this.getFeedbackBySubmissionId(input.submissionId);

    if (existing) {
      return existing;
    }

    const submission = this.submissions.find((candidate) => candidate.id === input.submissionId);

    if (!submission) {
      throw new Error(`MemoryDatabase seed is missing submission ${input.submissionId}`);
    }

    const studentAssignment = this.studentAssignments.find(
      (candidate) => candidate.id === submission.studentAssignmentId,
    );

    if (!studentAssignment) {
      throw new Error(`MemoryDatabase seed is missing student assignment ${submission.studentAssignmentId}`);
    }

    const timestamp = nowIso();
    const feedback: FeedbackRecord = {
      createdAt: timestamp,
      gradeLevel: input.feedback.gradeLevel,
      id: randomUUID(),
      improvementFallback: input.feedback.improvementFallback,
      improvementKey: input.feedback.improvementKey,
      nextRevisionTaskFallback: input.feedback.nextRevisionTaskFallback,
      nextRevisionTaskKey: input.feedback.nextRevisionTaskKey,
      progressMinutes: input.feedback.progressMinutes,
      progressPoints: input.feedback.progressPoints,
      progressSkill: input.feedback.progressSkill,
      strengthFallback: input.feedback.strengthFallback,
      strengthKey: input.feedback.strengthKey,
      studentProfileId: input.studentProfileId,
      submissionId: input.submissionId,
      submittedTextExcerpt: input.feedback.submittedTextExcerpt,
      updatedAt: timestamp,
    };
    const revisionTask: RevisionTaskRecord = {
      createdAt: timestamp,
      feedbackId: feedback.id,
      guidingQuestionFallback: input.revisionTask.guidingQuestionFallback,
      guidingQuestionKey: input.revisionTask.guidingQuestionKey,
      id: randomUUID(),
      instructionFallback: input.revisionTask.instructionFallback,
      instructionKey: input.revisionTask.instructionKey,
      originalExcerpt: input.revisionTask.originalExcerpt,
      targetSkill: input.revisionTask.targetSkill,
      updatedAt: timestamp,
    };

    this.feedback.push(feedback);
    this.revisionTasks.push(revisionTask);
    this.feedbackRubricScores.push(
      ...input.rubricScores.map((score) => {
        const criterion = this.rubricCriteria.find((record) => record.id === score.criterionId);

        return {
          coachingNoteFallback: score.coachingNoteFallback,
          coachingNoteKey: score.coachingNoteKey,
          criterionDescriptionFallback: criterion?.descriptionFallback ?? "Criterion detail",
          criterionDescriptionKey: criterion?.descriptionKey ?? "rubrics.unknown.description",
          criterionId: score.criterionId,
          criterionLabelFallback: criterion?.labelFallback ?? "Criterion",
          criterionLabelKey: criterion?.labelKey ?? "rubrics.unknown.label",
          feedbackId: feedback.id,
          id: randomUUID(),
          level: score.level,
          maxScore: 4 as const,
          score: score.score,
        };
      }),
    );
    this.grammarSuggestions.push(
      ...input.grammarSuggestions.map((suggestion) => ({
        explanationFallback: suggestion.explanationFallback,
        explanationKey: suggestion.explanationKey,
        feedbackId: feedback.id,
        id: randomUUID(),
        originalExcerpt: suggestion.originalExcerpt,
        studentActionFallback: suggestion.studentActionFallback,
        studentActionKey: suggestion.studentActionKey,
        titleFallback: suggestion.titleFallback,
        titleKey: suggestion.titleKey,
      })),
    );

    submission.status = "feedback_ready";
    studentAssignment.status = "feedback_ready";
    studentAssignment.updatedAt = timestamp;

    const reviewJob = this.reviewJobs.find((record) => record.submissionId === input.submissionId);
    if (reviewJob) {
      reviewJob.completedAt = timestamp;
      reviewJob.safetyFlags = [...input.safetyFlags];
      reviewJob.status = "completed";
      reviewJob.startedAt = reviewJob.startedAt ?? timestamp;
    }

    const details = this.withFeedbackDetails(feedback);

    if (!details) {
      throw new Error(`MemoryDatabase could not compose feedback ${feedback.id}`);
    }

    return details;
  }

  async saveDraft(input: SaveDraftInput): Promise<DraftRecord> {
    const timestamp = nowIso();
    const existing = this.drafts.find((draft) => draft.studentAssignmentId === input.studentAssignmentId);

    if (existing) {
      existing.autosaveVersion = input.autosaveVersion;
      existing.canvasDocumentIds = [...input.canvasDocumentIds];
      existing.paragraphCount = input.paragraphCount;
      existing.revisionNumber = input.revisionNumber;
      existing.sentenceCount = input.sentenceCount;
      existing.textContent = input.textContent;
      existing.textPreview = input.textPreview;
      existing.updatedAt = timestamp;
      existing.wordCount = input.wordCount;
      return { ...existing, canvasDocumentIds: [...existing.canvasDocumentIds] };
    }

    const draft: DraftRecord = {
      autosaveVersion: input.autosaveVersion,
      canvasDocumentIds: [...input.canvasDocumentIds],
      createdAt: timestamp,
      id: randomUUID(),
      paragraphCount: input.paragraphCount,
      revisionNumber: input.revisionNumber,
      sentenceCount: input.sentenceCount,
      studentAssignmentId: input.studentAssignmentId,
      studentProfileId: input.studentProfileId,
      textContent: input.textContent,
      textPreview: input.textPreview,
      updatedAt: timestamp,
      wordCount: input.wordCount,
    };

    this.drafts.push(draft);
    return { ...draft, canvasDocumentIds: [...draft.canvasDocumentIds] };
  }

  async transitionReviewJob(input: TransitionReviewJobInput): Promise<ReviewJobRecord> {
    const submission = this.submissions.find((candidate) => candidate.id === input.submissionId);

    if (!submission || submission.studentProfileId !== input.studentProfileId) {
      throw createResourceNotFoundError({ submissionId: input.submissionId });
    }

    const timestamp = nowIso();
    const activeStatuses = new Set<ReviewJobRecord["status"]>(["queued", "processing"]);
    let reviewJob = this.reviewJobs
      .filter((record) => record.submissionId === input.submissionId && activeStatuses.has(record.status))
      .sort((a, b) => (b.queuedAt ?? "").localeCompare(a.queuedAt ?? ""))[0];

    if (!reviewJob && input.transition === "start_review") {
      const existingByKey = this.reviewJobs.find(
        (record) => record.submissionId === input.submissionId && record.idempotencyKey === input.idempotencyKey,
      );

      if (existingByKey) {
        reviewJob = existingByKey;
      } else {
        reviewJob = {
          createdAt: timestamp,
          failureCode: null,
          failedAt: null,
          id: randomUUID(),
          idempotencyKey: input.idempotencyKey,
          queuedAt: timestamp,
          safetyFlags: [],
          startedAt: null,
          status: "queued",
          studentProfileId: input.studentProfileId,
          submissionId: input.submissionId,
        };
        this.reviewJobs.push(reviewJob);
      }
    }

    if (!reviewJob) {
      throw createResourceNotFoundError({ submissionId: input.submissionId, transition: input.transition });
    }

    assertReviewJobTransition(reviewJob.status, input.transition);

    if (input.transition === "start_review") {
      reviewJob.completedAt = null;
      reviewJob.failedAt = null;
      reviewJob.failureCode = null;
      reviewJob.safetyFlags = [];
      reviewJob.startedAt = reviewJob.startedAt ?? timestamp;
      reviewJob.status = "processing";
    } else if (input.transition === "fail_review") {
      reviewJob.failedAt = timestamp;
      reviewJob.failureCode = input.failureCode ?? "ai.review_failed";
      reviewJob.safetyFlags = [...(input.safetyFlags ?? [])];
      reviewJob.startedAt = reviewJob.startedAt ?? timestamp;
      reviewJob.status = "failed";
    } else if (input.transition === "safety_block_review") {
      reviewJob.failedAt = timestamp;
      reviewJob.failureCode = input.failureCode ?? "ai_safety.blocked";
      reviewJob.safetyFlags = [...(input.safetyFlags ?? [])];
      reviewJob.startedAt = reviewJob.startedAt ?? timestamp;
      reviewJob.status = "safety_blocked";
    } else {
      throw new ApiHttpError({
        code: "conflict.status_transition_invalid",
        details: { requestedTransition: input.transition, resource: "review_job" },
      });
    }

    return { ...reviewJob, safetyFlags: [...(reviewJob.safetyFlags ?? [])] };
  }

  async updateStudentAssignment(id: string, update: StudentAssignmentUpdate): Promise<void> {
    const record = this.studentAssignments.find((candidate) => candidate.id === id);

    if (!record) {
      return;
    }

    if (update.status !== undefined) {
      record.status = update.status;
    }
    if (update.startedAt !== undefined) {
      record.startedAt = update.startedAt;
    }
    if (update.submittedAt !== undefined) {
      record.submittedAt = update.submittedAt;
    }
    if (update.completedAt !== undefined) {
      record.completedAt = update.completedAt;
    }
    if (update.currentSubmissionId !== undefined) {
      record.currentSubmissionId = update.currentSubmissionId;
    }

    record.updatedAt = nowIso();
  }

  async upsertEntitlement(input: UpsertEntitlementInput): Promise<EntitlementRecord> {
    const existing = this.findMatchingEntitlement(input);
    const timestamp = nowIso();

    if (!existing) {
      const entitlement = this.createFreeEntitlement(input);
      this.entitlements.push(entitlement);
      return this.copyEntitlement(entitlement);
    }

    existing.billingPeriod = input.billingPeriod;
    existing.canAccessPremium = input.canAccessPremium;
    existing.currentPeriodEndsAt = input.currentPeriodEndsAt;
    existing.currentPlanId = input.currentPlanId;
    existing.managementUrl = input.managementUrl;
    existing.ownerUserId = input.ownerUserId;
    existing.provider = input.provider;
    existing.providerCustomerId = input.providerCustomerId;
    if (input.providerLastEventId !== undefined) {
      existing.providerLastEventId = input.providerLastEventId;
    }
    if (input.providerLastEventTimestampMs !== undefined) {
      existing.providerLastEventTimestampMs = input.providerLastEventTimestampMs;
    }
    if (input.providerLastEventType !== undefined) {
      existing.providerLastEventType = input.providerLastEventType;
    }
    existing.providerSubscriptionId = input.providerSubscriptionId;
    existing.scopeId = input.scopeId;
    existing.scopeType = input.scopeType;
    existing.status = input.status;
    existing.trialEndsAt = input.trialEndsAt;
    existing.updatedAt = timestamp;

    return this.copyEntitlement(existing);
  }
}
