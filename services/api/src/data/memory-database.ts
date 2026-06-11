import { randomUUID } from "node:crypto";

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
  WeeklyReviewRecord,
} from "./types";

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
  classStudents?: MemoryClassStudent[];
  classes?: ClassRecord[];
  drafts?: DraftRecord[];
  parentLinks?: MemoryParentLink[];
  progressTotals?: StudentProgressTotalsRecord[];
  rubricCriteria?: RubricCriterionRecord[];
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
  readonly classStudents: MemoryClassStudent[];
  readonly classes: ClassRecord[];
  readonly drafts: DraftRecord[];
  readonly parentLinks: MemoryParentLink[];
  readonly progressTotals: StudentProgressTotalsRecord[];
  readonly reviewJobs: ReviewJobRecord[] = [];
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
    this.classStudents = [...(seed.classStudents ?? [])];
    this.classes = [...(seed.classes ?? [])];
    this.drafts = [...(seed.drafts ?? [])];
    this.parentLinks = [...(seed.parentLinks ?? [])];
    this.progressTotals = [...(seed.progressTotals ?? [])];
    this.rubricCriteria = [...(seed.rubricCriteria ?? [])];
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
      id: randomUUID(),
      idempotencyKey: input.idempotencyKey,
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

  async getClassById(classId: string): Promise<ClassRecord | null> {
    const record = this.classes.find((candidate) => candidate.id === classId);
    return record ? { ...record } : null;
  }

  async getDraftByStudentAssignmentId(studentAssignmentId: string): Promise<DraftRecord | null> {
    const draft = this.drafts.find((record) => record.studentAssignmentId === studentAssignmentId);
    return draft ? { ...draft, canvasDocumentIds: [...draft.canvasDocumentIds] } : null;
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
}
