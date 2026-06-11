import { randomUUID } from "node:crypto";

import type {
  AssignmentRecord,
  CreateSubmissionInput,
  CreateSubmissionRevisionInput,
  Database,
  DraftRecord,
  ListStudentAssignmentsOptions,
  ReviewJobRecord,
  RubricCriterionRecord,
  SaveDraftInput,
  StudentAssignmentRecord,
  StudentAssignmentUpdate,
  StudentAssignmentWithAssignment,
  StudentProfileRecord,
  SubmissionRecord,
  SubmissionRevisionRecord,
} from "./types";

export interface MemoryParentLink {
  parentUserId: string;
  status: "pending" | "active" | "revoked";
  studentProfileId: string;
}

export interface MemoryTeacherLink {
  studentProfileId: string;
  teacherUserId: string;
}

export interface MemoryDatabaseSeed {
  assignments?: AssignmentRecord[];
  drafts?: DraftRecord[];
  parentLinks?: MemoryParentLink[];
  rubricCriteria?: RubricCriterionRecord[];
  studentAssignments?: StudentAssignmentRecord[];
  studentProfiles?: StudentProfileRecord[];
  teacherLinks?: MemoryTeacherLink[];
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
  readonly assignments: AssignmentRecord[];
  readonly drafts: DraftRecord[];
  readonly parentLinks: MemoryParentLink[];
  readonly reviewJobs: ReviewJobRecord[] = [];
  readonly rubricCriteria: RubricCriterionRecord[];
  readonly studentAssignments: StudentAssignmentRecord[];
  readonly studentProfiles: StudentProfileRecord[];
  readonly submissionContents = new Map<string, string>();
  readonly submissionRevisions: SubmissionRevisionRecord[] = [];
  readonly submissions: SubmissionRecord[] = [];
  readonly teacherLinks: MemoryTeacherLink[];

  constructor(seed: MemoryDatabaseSeed = {}) {
    this.assignments = [...(seed.assignments ?? [])];
    this.drafts = [...(seed.drafts ?? [])];
    this.parentLinks = [...(seed.parentLinks ?? [])];
    this.rubricCriteria = [...(seed.rubricCriteria ?? [])];
    this.studentAssignments = [...(seed.studentAssignments ?? [])];
    this.studentProfiles = [...(seed.studentProfiles ?? [])];
    this.teacherLinks = [...(seed.teacherLinks ?? [])];
  }

  private withAssignment(record: StudentAssignmentRecord): StudentAssignmentWithAssignment {
    const assignment = this.assignments.find((candidate) => candidate.id === record.assignmentId);

    if (!assignment) {
      throw new Error(`MemoryDatabase seed is missing assignment ${record.assignmentId}`);
    }

    return { ...record, assignment: { ...assignment } };
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

  async getDraftByStudentAssignmentId(studentAssignmentId: string): Promise<DraftRecord | null> {
    const draft = this.drafts.find((record) => record.studentAssignmentId === studentAssignmentId);
    return draft ? { ...draft, canvasDocumentIds: [...draft.canvasDocumentIds] } : null;
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

  async hasActiveParentLink(parentUserId: string, studentProfileId: string): Promise<boolean> {
    return this.parentLinks.some(
      (link) =>
        link.parentUserId === parentUserId &&
        link.studentProfileId === studentProfileId &&
        link.status === "active",
    );
  }

  async hasActiveTeacherLink(teacherUserId: string, studentProfileId: string): Promise<boolean> {
    return this.teacherLinks.some(
      (link) => link.teacherUserId === teacherUserId && link.studentProfileId === studentProfileId,
    );
  }

  async listParentLinkedStudentProfileIds(parentUserId: string): Promise<string[]> {
    return this.parentLinks
      .filter((link) => link.parentUserId === parentUserId && link.status === "active")
      .map((link) => link.studentProfileId);
  }

  async listRubricCriteria(rubricId: string): Promise<RubricCriterionRecord[]> {
    return this.rubricCriteria
      .filter((criterion) => criterion.rubricId === rubricId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((criterion) => ({ ...criterion }));
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

  async listSubmissionRevisions(submissionId: string): Promise<SubmissionRevisionRecord[]> {
    return this.submissionRevisions
      .filter((record) => record.submissionId === submissionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((record) => ({ ...record }));
  }

  async listTeacherLinkedStudentProfileIds(teacherUserId: string): Promise<string[]> {
    return [
      ...new Set(
        this.teacherLinks
          .filter((link) => link.teacherUserId === teacherUserId)
          .map((link) => link.studentProfileId),
      ),
    ];
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
