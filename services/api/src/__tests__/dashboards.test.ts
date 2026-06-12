import type { FastifyInstance, InjectOptions } from "fastify";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MemoryDatabase } from "../data";
import type { AssignmentRecord, EntitlementRecord, StudentAssignmentRecord } from "../data/types";
import { currentWeekRange } from "../routes/dashboards-shared";
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
    instructions: [],
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

const week = currentWeekRange();
const today = new Date().toISOString().slice(0, 10);

function createSeededDatabase(): MemoryDatabase {
  return new MemoryDatabase({
    activityDays: [
      {
        activityDate: today,
        assignmentsCompleted: 1,
        feedbackApplied: 1,
        handwritingMinutes: 5,
        minutesPracticed: 15,
        practicedSkills: ["grammar"],
        revisionsCompleted: 1,
        studentProfileId: "sp-1",
        wordsWritten: 120,
      },
    ],
    assignments: [
      makeAssignment({ classId: "class-1", id: "assignment-1" }),
      makeAssignment({ classId: "class-1", id: "assignment-2" }),
    ],
    badges: [
      {
        code: "first_draft",
        descriptionFallback: "Finish your first draft.",
        descriptionKey: "badges.firstDraft.description",
        iconName: "pencil",
        id: "badge-1",
        nameFallback: "First Draft",
        nameKey: "badges.firstDraft.name",
      },
      {
        code: "week_streak",
        descriptionFallback: "Write every day for a week.",
        descriptionKey: "badges.weekStreak.description",
        iconName: "flame",
        id: "badge-2",
        nameFallback: "Week Streak",
        nameKey: "badges.weekStreak.name",
      },
    ],
    classStudents: [
      { classId: "class-1", status: "active", studentProfileId: "sp-1" },
      { classId: "class-2", status: "active", studentProfileId: "sp-2" },
    ],
    classes: [
      { gradeLevel: 4, id: "class-1", name: "Period 1 Writing", status: "active", teacherProfileId: "tp-1" },
      { gradeLevel: 5, id: "class-2", name: "Period 2 Writing", status: "active", teacherProfileId: "tp-2" },
    ],
    entitlements: [
      makeEntitlement("user-student-1"),
      makeEntitlement("user-parent-1"),
      makeEntitlement("user-teacher-1"),
    ],
    parentLinks: [
      {
        parentUserId: "user-parent-1",
        relationshipLabel: "mom",
        status: "active",
        studentProfileId: "sp-1",
      },
      { parentUserId: "user-parent-2", status: "active", studentProfileId: "sp-2" },
    ],
    progressTotals: [
      {
        aiFeedbackApplied: 4,
        assignmentsCompleted: 3,
        bestStreakDays: 5,
        currentStreakDays: 3,
        handwritingMinutes: 10,
        minutesThisWeek: 25,
        practicedTodayOn: today,
        revisionsCompleted: 2,
        rubricImprovement: 0.5,
        streakStatus: "continued",
        studentProfileId: "sp-1",
        weeklyMinutesGoal: 50,
        wordsWritten: 500,
      },
    ],
    skillProgress: [
      {
        currentScore: 3,
        level: 2,
        previousScore: 2,
        skill: "grammar",
        studentProfileId: "sp-1",
        updatedAt: "2026-06-10T08:00:00.000Z",
      },
      {
        currentScore: 2,
        level: 1,
        previousScore: 2,
        skill: "organization",
        studentProfileId: "sp-1",
        updatedAt: "2026-06-10T08:00:00.000Z",
      },
    ],
    studentAssignments: [
      makeStudentAssignment({
        assignmentId: "assignment-1",
        classId: "class-1",
        currentSubmissionId: "sub-1",
        id: "sa-1",
        status: "submitted",
        studentProfileId: "sp-1",
        submittedAt: "2026-06-10T10:00:00.000Z",
      }),
      makeStudentAssignment({
        assignmentId: "assignment-2",
        classId: "class-1",
        completedAt: "2026-06-09T10:00:00.000Z",
        id: "sa-2",
        status: "completed",
        studentProfileId: "sp-1",
      }),
    ],
    studentBadges: [
      {
        badgeId: "badge-1",
        progressPercent: 100,
        status: "unlocked",
        studentProfileId: "sp-1",
        unlockedAt: "2026-06-08T10:00:00.000Z",
      },
    ],
    studentProfiles: [
      { gradeLevel: 4, id: "sp-1", userId: "user-student-1" },
      { gradeLevel: 5, id: "sp-2", userId: "user-student-2" },
    ],
    submissions: [
      {
        canvasDocumentIds: [],
        createdAt: "2026-06-10T10:00:00.000Z",
        id: "sub-1",
        idempotencyKey: "seed-key-1",
        paragraphCount: 1,
        revisionNumber: 1,
        sentenceCount: 2,
        status: "submitted",
        studentAssignmentId: "sa-1",
        studentProfileId: "sp-1",
        submittedAt: "2026-06-10T10:00:00.000Z",
        typedTextExcerpt: "My paragraph is student-written text.",
        wordCount: 42,
      },
    ],
    teacherProfiles: [
      { displayName: "Ms. Rivera", id: "tp-1", userId: "user-teacher-1" },
      { displayName: "Mr. Chen", id: "tp-2", userId: "user-teacher-2" },
    ],
    users: [
      { displayName: "Avery Student", id: "user-student-1" },
      { displayName: "Blake Student", id: "user-student-2" },
    ],
    weeklyReviews: [
      {
        celebrationFallback: "You wrote three days in a row!",
        celebrationKey: "weeklyReviews.test.celebration",
        focusForNextWeekFallback: "Try longer paragraphs.",
        focusForNextWeekKey: "weeklyReviews.test.focus",
        id: "wr-1",
        studentProfileId: "sp-1",
        weekEnd: week.toDate,
        weekStart: week.fromDate,
      },
    ],
  });
}

describe("WriterHabit dashboards API", () => {
  let app: FastifyInstance;
  let database: MemoryDatabase;
  let studentToken: string;
  let otherStudentToken: string;
  let parentToken: string;
  let otherParentToken: string;
  let teacherToken: string;
  let otherTeacherToken: string;

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
    otherParentToken = await signTestToken({ appMetadataRole: "parent", subject: "user-parent-2" });
    teacherToken = await signTestToken({ appMetadataRole: "teacher", subject: "user-teacher-1" });
    otherTeacherToken = await signTestToken({ appMetadataRole: "teacher", subject: "user-teacher-2" });
  });

  afterEach(async () => {
    await app.close();
  });

  function inject(token: string | null, options: InjectOptions) {
    return app.inject({
      ...options,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  }

  describe("authentication", () => {
    it.each([
      "/api/v1/students/sp-1/progress",
      "/api/v1/parents/user-parent-1/dashboard",
      "/api/v1/teachers/tp-1/dashboard",
      "/api/v1/classes/class-1/progress",
    ])("rejects unauthenticated requests to %s with 401", async (url) => {
      const response = await inject(null, { method: "GET", url });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("auth.missing_token");
    });
  });

  describe("student progress", () => {
    it("returns the progress dashboard to the owning student", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/progress",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        connectionStatus: "online",
        emptyState: null,
        gradeBand: "elementary",
        gradeLevel: 4,
        streak: { bestDays: 5, currentDays: 3, practicedToday: true, status: "continued" },
        studentId: "sp-1",
        totals: {
          aiFeedbackApplied: 4,
          assignmentsCompleted: 3,
          handwritingMinutes: 10,
          minutesThisWeek: 25,
          revisionsCompleted: 2,
          rubricImprovement: 0.5,
          weeklyMinutesGoal: 50,
          wordsWritten: 500,
        },
        weeklyReview: {
          celebration: {
            fallback: "You wrote three days in a row!",
            key: "weeklyReviews.test.celebration",
          },
          weekEnd: week.toDate,
          weekStart: week.fromDate,
        },
      });
      expect(body.skills).toHaveLength(2);
      expect(body.skills[0]).toMatchObject({
        currentScore: 3,
        label: { fallback: "Grammar", key: "skills.grammar.label" },
        level: 2,
        previousScore: 2,
        skill: "grammar",
      });
      expect(body.badges).toEqual([
        expect.objectContaining({ badgeId: "badge-1", progressPercent: 100, status: "unlocked" }),
        expect.objectContaining({ badgeId: "badge-2", progressPercent: 0, status: "locked", unlockedAt: null }),
      ]);
    });

    it("allows a linked parent and an enrolled-class teacher to read progress", async () => {
      const parentResponse = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/progress",
      });
      expect(parentResponse.statusCode).toBe(200);

      const teacherResponse = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/progress",
      });
      expect(teacherResponse.statusCode).toBe(200);
    });

    it("redacts extended progress history from the dashboard when Plus is not active", async () => {
      database.entitlements.splice(0, database.entitlements.length);

      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/progress",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        studentId: "sp-1",
        weeklyReview: null,
      });
    });

    it("rejects a student reading another student's progress with 403", async () => {
      const response = await inject(otherStudentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/progress",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.student_scope_denied");
    });

    it("rejects an unlinked parent and an un-enrolled teacher reading progress", async () => {
      const parentResponse = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/students/sp-2/progress",
      });
      expect(parentResponse.statusCode).toBe(403);
      expect(parentResponse.json().error.code).toBe("authorization.parent_link_required");

      const teacherResponse = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/students/sp-2/progress",
      });
      expect(teacherResponse.statusCode).toBe(403);
      expect(teacherResponse.json().error.code).toBe("authorization.teacher_class_scope_denied");
    });

    it("returns an empty-state dashboard for a student with no progress rows", async () => {
      const response = await inject(otherStudentToken, {
        method: "GET",
        url: "/api/v1/students/sp-2/progress",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.emptyState).not.toBeNull();
      expect(body.totals.wordsWritten).toBe(0);
      expect(body.streak).toMatchObject({ currentDays: 0, practicedToday: false, status: "not_started" });
      expect(body.weeklyReview).toBeNull();
    });

    it("returns skill detail with weekly practice history computed from activity days", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/progress/skills/grammar",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        currentScore: 3,
        recentActivity: [{ date: today, minutesPracticed: 15, wordsWritten: 120 }],
        skill: "grammar",
        studentId: "sp-1",
      });
    });

    it("requires Plus for extended skill history and weekly reviews", async () => {
      database.entitlements.splice(0, database.entitlements.length);

      const skill = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/progress/skills/grammar",
      });
      expect(skill.statusCode).toBe(402);
      expect(skill.json().error.code).toBe("subscription.entitlement_required");

      const weeklyReview = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/weekly-review",
      });
      expect(weeklyReview.statusCode).toBe(402);
      expect(weeklyReview.json().error.code).toBe("subscription.entitlement_required");
    });

    it("rejects unknown skill names with 400 and missing skill rows with 404", async () => {
      const invalid = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/progress/skills/not-a-skill",
      });
      expect(invalid.statusCode).toBe(400);
      expect(invalid.json().error.code).toBe("validation.invalid_field");

      const missing = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/progress/skills/spelling",
      });
      expect(missing.statusCode).toBe(404);
      expect(missing.json().error.code).toBe("resource.not_found");
    });

    it("lists the badge grid as a bounded page", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/badges",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBeNull();
      expect(body.items).toHaveLength(2);
      expect(body.items[0]).toMatchObject({
        badgeId: "badge-1",
        name: { fallback: "First Draft", key: "badges.firstDraft.name" },
        status: "unlocked",
      });
    });

    it("returns the latest weekly review with totals computed from activity days", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/students/sp-1/weekly-review",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        focusForNextWeek: { fallback: "Try longer paragraphs.", key: "weeklyReviews.test.focus" },
        studentId: "sp-1",
        totals: {
          assignmentsCompleted: 1,
          minutesPracticed: 15,
          revisionsCompleted: 1,
          wordsWritten: 120,
        },
        weekEnd: week.toDate,
        weekStart: week.fromDate,
      });
    });

    it("returns 404 when no weekly review exists yet", async () => {
      database.entitlements.push(makeEntitlement("user-student-2"));

      const response = await inject(otherStudentToken, {
        method: "GET",
        url: "/api/v1/students/sp-2/weekly-review",
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe("resource.not_found");
    });
  });

  describe("parent dashboards", () => {
    it("returns the parent dashboard with weekly progress per linked student", async () => {
      const response = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/parents/user-parent-1/dashboard",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        connectionStatus: "online",
        emptyState: null,
        parentId: "user-parent-1",
      });
      expect(body.students).toHaveLength(1);
      expect(body.students[0]).toMatchObject({
        displayName: "Avery Student",
        gradeLevel: 4,
        id: "sp-1",
        relationshipLabel: { fallback: "mom", key: "parents.relationship.mom" },
        weeklyProgress: {
          areaToPractice: "organization",
          assignedAssignments: 2,
          completedAssignments: 1,
          minutesCompleted: 15,
          minutesGoal: 50,
          sessionsCompleted: 1,
          skillImprovementPercent: 25,
          streakDays: 3,
        },
      });
    });

    it("lists linked students as a bounded page", async () => {
      const response = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/parents/user-parent-1/students",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBeNull();
      expect(body.items).toEqual([
        expect.objectContaining({
          displayName: "Avery Student",
          gradeBand: "elementary",
          gradeLevel: 4,
          id: "sp-1",
        }),
      ]);
    });

    it("returns the per-student report for an actively linked student", async () => {
      const response = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/parents/user-parent-1/students/sp-1/report",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        gradeBand: "elementary",
        studentId: "sp-1",
        totals: { minutesThisWeek: 25, wordsWritten: 500 },
        weeklyProgress: { minutesCompleted: 15, streakDays: 3 },
      });
      expect(body.skills).toHaveLength(2);
      expect(body.weeklyReview).not.toBeNull();
    });

    it.each([
      { entitlement: null, label: "free" },
      {
        entitlement: makeEntitlement("user-parent-1", {
          canAccessPremium: false,
          currentPeriodEndsAt: "2026-05-11T08:00:00.000Z",
          status: "expired",
        }),
        label: "expired",
      },
      {
        entitlement: makeEntitlement("user-parent-1", {
          canAccessPremium: false,
          currentPeriodEndsAt: "2026-05-11T08:00:00.000Z",
          status: "refunded",
        }),
        label: "refunded",
      },
    ])("requires active Plus for family reports when the parent entitlement is $label", async ({ entitlement }) => {
      database.entitlements.splice(
        0,
        database.entitlements.length,
        makeEntitlement("user-student-1"),
        makeEntitlement("user-teacher-1"),
        ...(entitlement ? [entitlement] : []),
      );

      const response = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/parents/user-parent-1/students/sp-1/report",
      });

      expect(response.statusCode).toBe(402);
      expect(response.json().error).toMatchObject({
        code: "subscription.entitlement_required",
      });
    });

    it("rejects a parent reading an unlinked student's report with 403", async () => {
      const response = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/parents/user-parent-1/students/sp-2/report",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.parent_link_required");
    });

    it("rejects a parent using another parent's id with 403", async () => {
      const response = await inject(otherParentToken, {
        method: "GET",
        url: "/api/v1/parents/user-parent-1/students",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.role_denied");
    });

    it("rejects non-parent roles on parent routes with 403", async () => {
      const response = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/parents/user-student-1/dashboard",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.role_denied");
    });
  });

  describe("teacher dashboards", () => {
    it("returns the teacher dashboard with class summaries and the review queue", async () => {
      const response = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/teachers/tp-1/dashboard",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        connectionStatus: "online",
        emptyState: null,
        teacherId: "tp-1",
      });
      expect(body.classes).toEqual([
        {
          activeAssignmentCount: 2,
          averageCompletionPercent: 50,
          averageSkillScore: 2.5,
          gradeLevel: 4,
          id: "class-1",
          name: "Period 1 Writing",
          studentCount: 1,
          submissionsNeedingReview: 1,
          weeklyWritingMinutes: 15,
        },
      ]);
      expect(body.submissionsNeedingReview).toEqual([
        {
          assignmentId: "assignment-1",
          assignmentTitle: { fallback: "Build a clear paragraph", key: "assignments.test.title" },
          classId: "class-1",
          hasCanvas: false,
          id: "sub-1",
          status: "submitted",
          studentDisplayName: "Avery Student",
          studentId: "sp-1",
          submittedAt: "2026-06-10T10:00:00.000Z",
          wordCount: 42,
        },
      ]);
    });

    it("lists classes through the auth-user-id alias for teacherId", async () => {
      const response = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/teachers/user-teacher-1/classes",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBeNull();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].id).toBe("class-1");
    });

    it("returns per-student class progress for an owned class", async () => {
      const response = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/classes/class-1/progress",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        classId: "class-1",
        gradeLevel: 4,
        name: "Period 1 Writing",
      });
      expect(body.students).toEqual([
        {
          assignmentsCompleted: 3,
          averageSkillScore: 2.5,
          currentStreakDays: 3,
          displayName: "Avery Student",
          gradeLevel: 4,
          studentId: "sp-1",
          weeklyWritingMinutes: 15,
        },
      ]);
    });

    it("requires active Plus for teacher class insights", async () => {
      database.entitlements.splice(
        0,
        database.entitlements.length,
        makeEntitlement("user-student-1"),
        makeEntitlement("user-parent-1"),
        makeEntitlement("user-teacher-1", {
          canAccessPremium: false,
          currentPeriodEndsAt: "2026-05-11T08:00:00.000Z",
          status: "refunded",
        }),
      );

      const response = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/classes/class-1/progress",
      });

      expect(response.statusCode).toBe(402);
      expect(response.json().error.code).toBe("subscription.entitlement_required");
    });

    it("hides un-owned and unknown classes behind 404", async () => {
      const unowned = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/classes/class-2/progress",
      });
      expect(unowned.statusCode).toBe(404);
      expect(unowned.json().error.code).toBe("resource.not_found");

      const unknown = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/classes/class-unknown/progress",
      });
      expect(unknown.statusCode).toBe(404);
    });

    it("rejects a teacher using another teacher's id with 403", async () => {
      const response = await inject(otherTeacherToken, {
        method: "GET",
        url: "/api/v1/teachers/tp-1/dashboard",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("authorization.teacher_class_scope_denied");
    });

    it("rejects non-teacher roles on teacher and class routes with 403", async () => {
      const teacherRoute = await inject(parentToken, {
        method: "GET",
        url: "/api/v1/teachers/tp-1/dashboard",
      });
      expect(teacherRoute.statusCode).toBe(403);
      expect(teacherRoute.json().error.code).toBe("authorization.role_denied");

      const classRoute = await inject(studentToken, {
        method: "GET",
        url: "/api/v1/classes/class-1/progress",
      });
      expect(classRoute.statusCode).toBe(403);
      expect(classRoute.json().error.code).toBe("authorization.role_denied");
    });

    it("returns the class-scoped submissions queue and an empty queue for the other teacher", async () => {
      const response = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/teachers/tp-1/submissions",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBeNull();
      expect(body.items).toHaveLength(1);
      expect(body.items[0]).toMatchObject({ id: "sub-1", studentId: "sp-1" });

      const otherResponse = await inject(otherTeacherToken, {
        method: "GET",
        url: "/api/v1/teachers/tp-2/submissions",
      });
      expect(otherResponse.statusCode).toBe(200);
      expect(otherResponse.json().items).toHaveLength(0);
    });

    it("returns submission detail only inside the teacher's class scope", async () => {
      const owned = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/teachers/tp-1/submissions/sub-1",
      });
      expect(owned.statusCode).toBe(200);
      expect(owned.json()).toMatchObject({
        id: "sub-1",
        studentId: "sp-1",
        typedTextExcerpt: "My paragraph is student-written text.",
      });

      const crossTenant = await inject(otherTeacherToken, {
        method: "GET",
        url: "/api/v1/teachers/tp-2/submissions/sub-1",
      });
      expect(crossTenant.statusCode).toBe(403);
      expect(crossTenant.json().error.code).toBe("authorization.teacher_class_scope_denied");

      const unknown = await inject(teacherToken, {
        method: "GET",
        url: "/api/v1/teachers/tp-1/submissions/sub-unknown",
      });
      expect(unknown.statusCode).toBe(404);
      expect(unknown.json().error.code).toBe("resource.not_found");
    });
  });

  describe("database unconfigured", () => {
    it("keeps the dashboard endpoints fail-closed with 501 feature.disabled", async () => {
      const failClosedApp = await buildServer({
        config: createTestConfig(),
        logger: false,
      });
      await failClosedApp.ready();

      try {
        const urls = [
          "/api/v1/students/sp-1/progress",
          "/api/v1/students/sp-1/badges",
          "/api/v1/parents/user-parent-1/dashboard",
          "/api/v1/teachers/tp-1/dashboard",
          "/api/v1/classes/class-1/progress",
        ];

        for (const url of urls) {
          const response = await failClosedApp.inject({
            headers: { authorization: `Bearer ${studentToken}` },
            method: "GET",
            url,
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
