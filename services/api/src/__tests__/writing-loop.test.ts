import type { FastifyInstance, InjectOptions } from "fastify";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MemoryDatabase } from "../data";
import type { AssignmentRecord, EntitlementRecord, StudentAssignmentRecord } from "../data/types";
import type { ApiConfig } from "../runtime/config";
import { buildServer } from "../server";

const testJwtSecret = "writerhabit-test-jwt-secret-at-least-32-chars";
const testIssuer = "https://writerhabit.supabase.test/auth/v1";
const testAudience = "authenticated";

function createTestConfig(): ApiConfig {
  return {
    apiBasePath: "/api/v1",
    auth: {
      audience: testAudience,
      issuer: testIssuer,
      jwtSecret: testJwtSecret,
      mode: "hs256",
    },
    cors: {
      allowLocalhostInDevelopment: true,
      allowedOrigins: [],
    },
    database: {
      mode: "unconfigured",
    },
    environment: "test",
    host: "127.0.0.1",
    logLevel: "silent",
    payments: {
      provider: "revenuecat",
      revenueCat: {
        entitlementId: "plus",
      },
    },
    port: 3000,
  };
}

async function signTestToken(input: {
  appMetadataRole?: "student" | "parent" | "teacher" | "admin";
  subject: string;
}): Promise<string> {
  return new SignJWT({
    app_metadata: input.appMetadataRole ? { role: input.appMetadataRole } : {},
    email: `${input.subject}@example.com`,
    user_metadata: {
      display_name: "Test User",
      onboarding_complete: true,
    },
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setAudience(testAudience)
    .setExpirationTime("15m")
    .setIssuer(testIssuer)
    .setIssuedAt()
    .setSubject(input.subject)
    .sign(new TextEncoder().encode(testJwtSecret));
}

function makeAssignment(overrides: Partial<AssignmentRecord> & { id: string }): AssignmentRecord {
  return {
    assignmentType: "paragraph_writing",
    classId: null,
    difficulty: "moderate",
    dueAt: null,
    estimatedMinutes: 15,
    gradeLevelMax: 5,
    gradeLevelMin: 3,
    instructions: [
      { fallback: "Write one clear paragraph.", key: "assignments.test.instruction1" },
    ],
    promptFallback: "Write about a small choice that made your day better.",
    promptKey: "assignments.test.prompt",
    rubricId: "rubric-1",
    skillFocus: ["organization", "clarity"],
    status: "published",
    titleFallback: "Build a clear paragraph",
    titleKey: "assignments.test.title",
    ...overrides,
  };
}

function makeStudentAssignment(
  overrides: Partial<StudentAssignmentRecord> & {
    assignmentId: string;
    id: string;
    studentProfileId: string;
  },
): StudentAssignmentRecord {
  return {
    classId: null,
    completedAt: null,
    createdAt: "2026-06-10T08:00:00.000Z",
    currentSubmissionId: null,
    dailySelectionMetadata: {},
    dueAt: null,
    startedAt: null,
    status: "not_started",
    submittedAt: null,
    teacherNoteFallback: null,
    teacherNoteKey: null,
    updatedAt: "2026-06-10T08:00:00.000Z",
    ...overrides,
  };
}

function makeEntitlement(ownerUserId: string, overrides: Partial<EntitlementRecord> = {}): EntitlementRecord {
  return {
    billingPeriod: "year",
    canAccessPremium: true,
    createdAt: "2026-06-11T08:00:00.000Z",
    currentPeriodEndsAt: "2026-07-11T08:00:00.000Z",
    currentPlanId: "WriterHabit_plus_yearly",
    id: `entitlement-${ownerUserId}-${overrides.status ?? "active"}`,
    managementUrl: null,
    ownerUserId,
    provider: "revenuecat",
    providerCustomerId: ownerUserId,
    providerLastEventId: null,
    providerLastEventTimestampMs: null,
    providerLastEventType: null,
    providerSubscriptionId: `${ownerUserId}:WriterHabit_plus_yearly`,
    scopeId: null,
    scopeType: "personal",
    status: "active",
    trialEndsAt: null,
    updatedAt: "2026-06-11T08:00:00.000Z",
    ...overrides,
  };
}

function createSeededDatabase(): MemoryDatabase {
  return new MemoryDatabase({
    assignments: [makeAssignment({ id: "assignment-1" }), makeAssignment({ id: "assignment-2" })],
    parentLinks: [
      { parentUserId: "user-parent-1", status: "active", studentProfileId: "sp-1" },
      { parentUserId: "user-parent-2", status: "pending", studentProfileId: "sp-2" },
    ],
    rubricCriteria: [
      {
        descriptionFallback: "Ideas are organized in a clear order.",
        descriptionKey: "rubrics.test.organization.description",
        id: "criterion-1",
        labelFallback: "Organization",
        labelKey: "rubrics.test.organization.label",
        maxScore: 4,
        rubricId: "rubric-1",
        skill: "organization",
        sortOrder: 1,
      },
    ],
    studentAssignments: [
      makeStudentAssignment({
        assignmentId: "assignment-1",
        createdAt: "2026-06-09T08:00:00.000Z",
        id: "sa-1",
        studentProfileId: "sp-1",
        updatedAt: "2026-06-09T08:00:00.000Z",
      }),
      makeStudentAssignment({
        assignmentId: "assignment-2",
        createdAt: "2026-06-10T08:00:00.000Z",
        id: "sa-2",
        status: "in_progress",
        studentProfileId: "sp-1",
        updatedAt: "2026-06-10T09:00:00.000Z",
      }),
      makeStudentAssignment({
        assignmentId: "assignment-1",
        id: "sa-3",
        studentProfileId: "sp-2",
      }),
    ],
    studentProfiles: [
      { gradeLevel: 4, id: "sp-1", userId: "user-student-1" },
      { gradeLevel: 5, id: "sp-2", userId: "user-student-2" },
    ],
    teacherLinks: [{ studentProfileId: "sp-1", teacherUserId: "user-teacher-1" }],
  });
}

describe("WriterHabit writing loop API", () => {
  let app: FastifyInstance;
  let database: MemoryDatabase;
  let studentToken: string;
  let otherStudentToken: string;
  let parentToken: string;
  let teacherToken: string;

  beforeEach(async () => {
    database = createSeededDatabase();
    app = await buildServer({
      config: createTestConfig(),
      database,
      logger: false,
    });
    await app.ready();

    studentToken = await signTestToken({ appMetadataRole: "student", subject: "user-student-1" });
    otherStudentToken = await signTestToken({ appMetadataRole: "student", subject: "user-student-2" });
    parentToken = await signTestToken({ appMetadataRole: "parent", subject: "user-parent-1" });
    teacherToken = await signTestToken({ appMetadataRole: "teacher", subject: "user-teacher-1" });
  });

  afterEach(async () => {
    await app.close();
  });

  function inject(token: string | null, options: InjectOptions) {
    return app.inject({
      ...options,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(options.payload !== undefined ? { "content-type": "application/json" } : {}),
        ...options.headers,
      },
    });
  }

  async function submitHappyPath(
    input: { idempotencyKey?: string; studentAssignmentId?: string; typedText?: string } = {},
  ) {
    return inject(studentToken, {
      method: "POST",
      payload: {
        canvasDocumentIds: [],
        clientDraftVersion: 1,
        idempotencyKey: input.idempotencyKey ?? "key-1",
        typedText: input.typedText ?? "My paragraph is student-written text. It has two sentences.",
      },
      url: `/api/v1/student-assignments/${input.studentAssignmentId ?? "sa-2"}/submissions`,
    });
  }

  describe("authentication and authorization", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const response = await inject(null, {
        method: "GET",
        url: "/api/v1/students/sp-1/assignments",
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("auth.missing_token");
    });

    it("rejects cross-student access with 403 student scope denied", async () => {
      const response = await inject(otherStudentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/assignments",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.student_scope_denied");
    });

    it("rejects a parent reading an unlinked student with 403 parent link required", async () => {
      const response = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/students/sp-2/assignments",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.parent_link_required");
    });

    it("rejects a teacher reading an unenrolled student with 403 teacher scope denied", async () => {
      const response = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/students/sp-2/assignments",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.teacher_class_scope_denied");
    });

    it("does not let user_metadata roles bypass the parent link check", async () => {
      const fakeParentToken = await signTestToken({ subject: "user-student-2" });
      const response = await inject(fakeParentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/assignments",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.student_scope_denied");
    });

    it("rejects parents from student-owned draft endpoints", async () => {
      const response = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/student-assignments/sa-1/draft",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.role_denied");
    });

    it("rejects another student writing to a draft they do not own", async () => {
      const response = await inject(otherStudentToken, {
        method: "PUT",
        payload: { autosaveVersion: 1, canvasDocumentIds: [], text: "Hello" },
        url: "/api/v1/student-assignments/sa-1/draft",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.student_scope_denied");
    });
  });

  describe("assignment listing and detail", () => {
    it("lists the student's assignments newest first", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/assignments",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBeNull();
      expect(body.items).toHaveLength(2);
      expect(body.items[0]).toMatchObject({
        assignmentId: "assignment-2",
        assignmentType: "paragraph_writing",
        currentSubmissionId: null,
        difficulty: "moderate",
        status: "in_progress",
        studentAssignmentId: "sa-2",
        title: { fallback: "Build a clear paragraph", key: "assignments.test.title" },
      });
      expect(body.items[1].studentAssignmentId).toBe("sa-1");
    });

    it("supports filtering the list by status", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/assignments?status=in_progress",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().items.map((item: { studentAssignmentId: string }) => item.studentAssignmentId)).toEqual([
        "sa-2",
      ]);
    });

    it("allows the student to use their own auth user id as the studentId alias", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/user-student-1/assignments",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().items).toHaveLength(2);
    });

    it("allows a linked parent to read the student's assignment list", async () => {
      const response = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/assignments",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().items).toHaveLength(2);
    });

    it("returns the most recent active student assignment as the daily pick", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/daily-assignment",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        assignmentId: "assignment-2",
        selection: {
          reasonCodes: ["most_recent_active_assignment"],
          targetDifficulty: "moderate",
        },
        status: "in_progress",
        studentAssignmentId: "sa-2",
      });
    });

    it("returns assignment detail with rubric, instructions, and teacher note placeholders", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/assignments/assignment-2",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        assignmentId: "assignment-2",
        draft: null,
        instructions: [
          { fallback: "Write one clear paragraph.", key: "assignments.test.instruction1" },
        ],
        rubric: [
          {
            id: "criterion-1",
            label: { fallback: "Organization", key: "rubrics.test.organization.label" },
            maxScore: 4,
            skill: "organization",
          },
        ],
        studentAssignmentId: "sa-2",
        teacherNote: null,
      });
    });

    it("hides assignments outside the caller's student scope behind 404", async () => {
      const response = await inject(otherStudentToken, {
        method: "GET",
        url: "/api/v1/assignments/assignment-2",
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe("resource.not_found");
    });
  });

  describe("draft persistence", () => {
    it("saves, reads, and deletes a typed draft and starts the assignment", async () => {
      const putResponse = await inject(studentToken, {
        method: "PUT",
        payload: {
          autosaveVersion: 1,
          canvasDocumentIds: [],
          text: "Hello world. This is my draft.\n\nSecond paragraph here.",
        },
        url: "/api/v1/student-assignments/sa-1/draft",
      });

      expect(putResponse.statusCode).toBe(200);
      expect(putResponse.json()).toMatchObject({
        autosaveVersion: 1,
        canvasPageCount: 0,
        preview: "Hello world. This is my draft.\n\nSecond paragraph here.",
        revisionNumber: 1,
        studentAssignmentId: "sa-1",
        text: "Hello world. This is my draft.\n\nSecond paragraph here.",
        wordCount: 9,
      });

      const studentAssignment = database.studentAssignments.find((record) => record.id === "sa-1");
      expect(studentAssignment?.status).toBe("in_progress");
      expect(studentAssignment?.startedAt).not.toBeNull();

      const getResponse = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/student-assignments/sa-1/draft",
      });

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.json().text).toBe("Hello world. This is my draft.\n\nSecond paragraph here.");

      const deleteResponse = await inject(studentToken, {
        method: "DELETE",
        url: "/api/v1/student-assignments/sa-1/draft",
      });

      expect(deleteResponse.statusCode).toBe(204);

      const afterDelete = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/student-assignments/sa-1/draft",
      });

      expect(afterDelete.statusCode).toBe(404);
      expect(afterDelete.json().error.code).toBe("resource.not_found");
    });

    it("rejects stale autosave versions with 409 version mismatch", async () => {
      const first = await inject(studentToken, {
        method: "PUT",
        payload: { autosaveVersion: 3, canvasDocumentIds: [], text: "Version three." },
        url: "/api/v1/student-assignments/sa-1/draft",
      });
      expect(first.statusCode).toBe(200);

      const stale = await inject(studentToken, {
        method: "PUT",
        payload: { autosaveVersion: 2, canvasDocumentIds: [], text: "Old version." },
        url: "/api/v1/student-assignments/sa-1/draft",
      });

      expect(stale.statusCode).toBe(409);
      expect(stale.json().error.code).toBe("conflict.version_mismatch");
      expect(stale.json().error.retryable).toBe(true);
    });

    it("rejects unknown draft body keys", async () => {
      const response = await inject(studentToken, {
        method: "PUT",
        payload: { autosaveVersion: 1, canvasDocumentIds: [], surprise: true, text: "Hi." },
        url: "/api/v1/student-assignments/sa-1/draft",
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("validation.invalid_field");
    });

    it("returns 404 for a draft on an unknown student assignment", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/student-assignments/sa-unknown/draft",
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe("resource.not_found");
    });
  });

  describe("submission state transition", () => {
    it("creates a submission, queues a review job, and advances the student assignment", async () => {
      const response = await submitHappyPath();

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body).toMatchObject({
        feedbackId: null,
        revisionNumber: 1,
        status: "submitted",
        studentAssignmentId: "sa-2",
        studentId: "sp-1",
        wordCount: 9,
      });
      expect(body.typedTextExcerpt).toContain("My paragraph is student-written text.");

      const studentAssignment = database.studentAssignments.find((record) => record.id === "sa-2");
      expect(studentAssignment?.status).toBe("submitted");
      expect(studentAssignment?.currentSubmissionId).toBe(body.id);
      expect(studentAssignment?.submittedAt).not.toBeNull();

      expect(database.reviewJobs).toHaveLength(1);
      expect(database.reviewJobs[0]).toMatchObject({
        status: "queued",
        studentProfileId: "sp-1",
        submissionId: body.id,
      });
      expect(database.submissionContents.get(body.id)).toBe(
        "My paragraph is student-written text. It has two sentences.",
      );
    });

    it("returns the existing submission for an idempotent retry", async () => {
      const first = await submitHappyPath();
      expect(first.statusCode).toBe(201);

      const retry = await submitHappyPath();
      expect(retry.statusCode).toBe(200);
      expect(retry.json().id).toBe(first.json().id);
      expect(database.submissions).toHaveLength(1);
      expect(database.reviewJobs).toHaveLength(1);
    });

    it("rejects reusing an idempotency key with different contents", async () => {
      const first = await submitHappyPath();
      expect(first.statusCode).toBe(201);

      const conflicting = await inject(studentToken, {
        method: "POST",
        payload: {
          canvasDocumentIds: [],
          clientDraftVersion: 2,
          idempotencyKey: "key-1",
          typedText: "Completely different text now.",
        },
        url: "/api/v1/student-assignments/sa-2/submissions",
      });

      expect(conflicting.statusCode).toBe(409);
      expect(conflicting.json().error.code).toBe("conflict.duplicate_idempotency_key");
    });

    it("rejects submitting from a non-submittable status with 409", async () => {
      const first = await submitHappyPath();
      expect(first.statusCode).toBe(201);

      const again = await submitHappyPath({ idempotencyKey: "key-2" });

      expect(again.statusCode).toBe(409);
      expect(again.json().error.code).toBe("conflict.status_transition_invalid");
      expect(again.json().error.details.currentStatus).toBe("submitted");
    });

    it("rejects direct submit from not_started until the assignment is started", async () => {
      const response = await submitHappyPath({ idempotencyKey: "key-not-started", studentAssignmentId: "sa-1" });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe("conflict.status_transition_invalid");
      expect(response.json().error.details.currentStatus).toBe("not_started");
      expect(database.submissions).toHaveLength(0);
    });

    it("returns 404 for a missing student assignment on submit", async () => {
      const response = await submitHappyPath({
        idempotencyKey: "key-missing-assignment",
        studentAssignmentId: "sa-missing",
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe("resource.not_found");
    });

    it("rejects another student submitting work they do not own", async () => {
      const response = await inject(otherStudentToken, {
        method: "POST",
        payload: {
          canvasDocumentIds: [],
          clientDraftVersion: 1,
          idempotencyKey: "key-wrong-owner",
          typedText: "This should not submit for another student.",
        },
        url: "/api/v1/student-assignments/sa-2/submissions",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.student_scope_denied");
      expect(database.submissions).toHaveLength(0);
    });

    it("rejects empty student writing with 422", async () => {
      const response = await inject(studentToken, {
        method: "POST",
        payload: {
          canvasDocumentIds: [],
          clientDraftVersion: 1,
          idempotencyKey: "key-empty",
          typedText: "   \n  ",
        },
        url: "/api/v1/student-assignments/sa-2/submissions",
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error.code).toBe("validation.empty_submission");
      expect(database.submissions).toHaveLength(0);
    });
  });

  describe("submission detail and revisions", () => {
    async function createSubmission(input: { idempotencyKey?: string; typedText?: string } = {}): Promise<string> {
      const response = await submitHappyPath(input);
      expect(response.statusCode).toBe(201);
      return response.json().id as string;
    }

    async function publishFeedback(submissionId: string): Promise<string> {
      const response = await inject(studentToken, {
        method: "POST",
        payload: { idempotencyKey: `review-${submissionId}` },
        url: `/api/v1/ai/review/submissions/${submissionId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        feedbackId: expect.any(String),
        status: "completed",
      });

      const feedback = await inject(studentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}/feedback`,
      });
      expect(feedback.statusCode).toBe(200);
      expect(feedback.json()).toMatchObject({
        review: {
          status: "completed",
          submissionId,
        },
        status: "completed",
      });

      return feedback.json().review.revisionTask.id as string;
    }

    it("returns submission detail to the owning student and linked parent", async () => {
      const submissionId = await createSubmission();

      const ownResponse = await inject(studentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}`,
      });
      expect(ownResponse.statusCode).toBe(200);
      expect(ownResponse.json()).toMatchObject({ id: submissionId, studentId: "sp-1" });

      const parentResponse = await inject(parentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}`,
      });
      expect(parentResponse.statusCode).toBe(200);

      const crossResponse = await inject(otherStudentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}`,
      });
      expect(crossResponse.statusCode).toBe(403);
      expect(crossResponse.json().error.code).toBe("authorization.student_scope_denied");
    });

    it("creates and lists revisions with idempotent conflict handling", async () => {
      const submissionId = await createSubmission();
      const revisionTaskId = await publishFeedback(submissionId);

      const create = await inject(studentToken, {
        method: "POST",
        payload: {
          idempotencyKey: "rev-1",
          revisedExcerpt: "A clearer second sentence.",
          revisionTaskId,
        },
        url: `/api/v1/submissions/${submissionId}/revisions`,
      });

      expect(create.statusCode).toBe(201);
      expect(create.json()).toMatchObject({
        revisedExcerpt: "A clearer second sentence.",
        revisionTaskId,
        studentId: "sp-1",
        submissionId,
      });

      const retry = await inject(studentToken, {
        method: "POST",
        payload: {
          idempotencyKey: "rev-1",
          revisedExcerpt: "A clearer second sentence.",
          revisionTaskId,
        },
        url: `/api/v1/submissions/${submissionId}/revisions`,
      });
      expect(retry.statusCode).toBe(200);
      expect(retry.json().id).toBe(create.json().id);

      const conflicting = await inject(studentToken, {
        method: "POST",
        payload: {
          idempotencyKey: "rev-1",
          revisedExcerpt: "Different text for the same key.",
          revisionTaskId,
        },
        url: `/api/v1/submissions/${submissionId}/revisions`,
      });
      expect(conflicting.statusCode).toBe(409);
      expect(conflicting.json().error.code).toBe("conflict.duplicate_idempotency_key");

      const list = await inject(studentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}/revisions`,
      });
      expect(list.statusCode).toBe(200);
      expect(list.json().items).toHaveLength(1);

      const parentList = await inject(parentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}/revisions`,
      });
      expect(parentList.statusCode).toBe(200);

      const parentCreate = await inject(parentToken, {
        method: "POST",
        payload: {
          idempotencyKey: "rev-parent",
          revisedExcerpt: "Parents cannot write revisions.",
          revisionTaskId,
        },
        url: `/api/v1/submissions/${submissionId}/revisions`,
      });
      expect(parentCreate.statusCode).toBe(403);
      expect(parentCreate.json().error.code).toBe("authorization.role_denied");

      const studentAssignment = database.studentAssignments.find((record) => record.id === "sa-2");
      expect(studentAssignment?.status).toBe("completed");
      expect(database.progressTotals.find((record) => record.studentProfileId === "sp-1")).toMatchObject({
        aiFeedbackApplied: 1,
        assignmentsCompleted: 1,
        revisionsCompleted: 1,
      });
    });

    it("redacts rubric detail until the caller has a verified Plus entitlement", async () => {
      const submissionId = await createSubmission({
        idempotencyKey: "key-rubric-redaction",
      });
      await publishFeedback(submissionId);

      const freeFeedback = await inject(studentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}/feedback`,
      });
      expect(freeFeedback.statusCode).toBe(200);
      expect(freeFeedback.json().review.rubricScores).toEqual([]);

      database.entitlements.push(makeEntitlement("user-student-1"));

      const plusFeedback = await inject(studentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}/feedback`,
      });
      expect(plusFeedback.statusCode).toBe(200);
      expect(plusFeedback.json().review.rubricScores).toEqual([
        expect.objectContaining({
          criterionId: "criterion-1",
          maxScore: 4,
        }),
      ]);
    });

    it("returns processing before feedback is published and rejects early revisions", async () => {
      const submissionId = await createSubmission();

      const feedback = await inject(studentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}/feedback`,
      });
      expect(feedback.statusCode).toBe(200);
      expect(feedback.json()).toMatchObject({
        review: null,
        reviewJobStatus: "queued",
        status: "processing",
      });

      const earlyRevision = await inject(studentToken, {
        method: "POST",
        payload: {
          idempotencyKey: "early-rev",
          revisedExcerpt: "A revision before feedback should fail.",
          revisionTaskId: "missing-task",
        },
        url: `/api/v1/submissions/${submissionId}/revisions`,
      });

      expect(earlyRevision.statusCode).toBe(409);
      expect(earlyRevision.json().error.code).toBe("conflict.status_transition_invalid");
    });

    it("persists failed review-job status when usage limits reject the request", async () => {
      const assignment = database.assignments.find((record) => record.id === "assignment-2");
      expect(assignment).toBeDefined();
      assignment!.promptFallback = `Review this assignment context. ${"context ".repeat(2_000)}`;

      const submissionId = await createSubmission({
        idempotencyKey: "key-long-review",
        typedText: "Student work. ".repeat(2_800),
      });

      const response = await inject(studentToken, {
        method: "POST",
        payload: { idempotencyKey: "review-too-large" },
        url: `/api/v1/ai/review/submissions/${submissionId}`,
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error.code).toBe("validation.text_too_long");
      expect(database.reviewJobs).toHaveLength(1);
      expect(database.reviewJobs[0]).toMatchObject({
        failureCode: "validation.text_too_long",
        safetyFlags: [],
        status: "failed",
        submissionId,
      });
      expect(database.reviewJobs[0].startedAt).toEqual(expect.any(String));
      expect(database.reviewJobs[0].failedAt).toEqual(expect.any(String));

      const status = await inject(studentToken, {
        method: "GET",
        url: `/api/v1/ai/review/submissions/${submissionId}/status`,
      });
      expect(status.statusCode).toBe(200);
      expect(status.json()).toMatchObject({
        status: "failed",
        submissionId,
      });

      const feedback = await inject(studentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}/feedback`,
      });
      expect(feedback.statusCode).toBe(200);
      expect(feedback.json()).toMatchObject({
        review: null,
        reviewJobStatus: "failed",
        status: "failed",
        submissionId,
      });
    });

    it("persists safety-blocked review-job status and flags", async () => {
      const submissionId = await createSubmission({
        idempotencyKey: "key-safety-review",
        typedText: "This school response mentions explicit sexual content and needs a safer topic.",
      });

      const response = await inject(studentToken, {
        method: "POST",
        payload: { idempotencyKey: "review-safety-blocked" },
        url: `/api/v1/ai/review/submissions/${submissionId}`,
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error.code).toBe("ai_safety.age_inappropriate");
      expect(database.reviewJobs).toHaveLength(1);
      expect(database.reviewJobs[0]).toMatchObject({
        failureCode: "ai_safety.age_inappropriate",
        safetyFlags: ["age_inappropriate"],
        status: "safety_blocked",
        submissionId,
      });
      expect(database.reviewJobs[0].startedAt).toEqual(expect.any(String));
      expect(database.reviewJobs[0].failedAt).toEqual(expect.any(String));

      const status = await inject(studentToken, {
        method: "GET",
        url: `/api/v1/ai/review/submissions/${submissionId}/status`,
      });
      expect(status.statusCode).toBe(200);
      expect(status.json()).toMatchObject({
        status: "safety_blocked",
        submissionId,
      });

      const feedback = await inject(studentToken, {
        method: "GET",
        url: `/api/v1/submissions/${submissionId}/feedback`,
      });
      expect(feedback.statusCode).toBe(200);
      expect(feedback.json()).toMatchObject({
        review: null,
        reviewJobStatus: "safety_blocked",
        status: "safety_blocked",
        submissionId,
      });
    });

    it("does not let another student request review for an owned submission", async () => {
      const submissionId = await createSubmission();
      const response = await inject(otherStudentToken, {
        method: "POST",
        payload: { idempotencyKey: "review-wrong-owner" },
        url: `/api/v1/ai/review/submissions/${submissionId}`,
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.student_scope_denied");
    });
  });

  describe("database unconfigured", () => {
    it("keeps the writing loop fail-closed with 501 feature.disabled", async () => {
      const failClosedApp = await buildServer({
        config: createTestConfig(),
        logger: false,
      });
      await failClosedApp.ready();

      try {
        const endpoints: Array<{ method: "GET" | "PUT" | "POST"; url: string }> = [
          { method: "GET", url: "/api/v1/students/sp-1/assignments" },
          { method: "GET", url: "/api/v1/students/sp-1/daily-assignment" },
          { method: "GET", url: "/api/v1/student-assignments/sa-1/draft" },
          { method: "POST", url: "/api/v1/student-assignments/sa-1/submissions" },
        ];

        for (const endpoint of endpoints) {
          const response = await failClosedApp.inject({
            headers: { authorization: `Bearer ${studentToken}` },
            method: endpoint.method,
            url: endpoint.url,
          });

          expect(response.statusCode).toBe(501);
          expect(response.json().error.code).toBe("feature.disabled");
        }
      } finally {
        await failClosedApp.close();
      }
    });
  });
});
