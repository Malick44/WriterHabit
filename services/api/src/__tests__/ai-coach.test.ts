import type { FastifyInstance, InjectOptions } from "fastify";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MemoryDatabase } from "../data";
import type { AssignmentRecord, RubricCriterionRecord, StudentAssignmentRecord } from "../data/types";
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
    startedAt: "2026-06-10T08:00:00.000Z",
    status: "in_progress",
    submittedAt: null,
    teacherNoteFallback: null,
    teacherNoteKey: null,
    updatedAt: "2026-06-10T08:00:00.000Z",
    ...overrides,
  };
}

function makeRubricCriterion(overrides: Partial<RubricCriterionRecord> & { id: string }): RubricCriterionRecord {
  return {
    descriptionFallback: "The paragraph has a clear beginning, middle, and ending.",
    descriptionKey: "rubric.test.organization.description",
    labelFallback: "Organization",
    labelKey: "rubric.test.organization.label",
    maxScore: 4,
    rubricId: "rubric-1",
    skill: "organization",
    sortOrder: 1,
    ...overrides,
  };
}

function createSeededDatabase(): MemoryDatabase {
  return new MemoryDatabase({
    assignments: [makeAssignment({ id: "assignment-1" })],
    rubricCriteria: [makeRubricCriterion({ id: "criterion-1" })],
    studentAssignments: [
      makeStudentAssignment({
        assignmentId: "assignment-1",
        id: "student-assignment-1",
        studentProfileId: "sp-1",
      }),
    ],
    studentProfiles: [{ gradeLevel: 4, id: "sp-1", userId: "user-student-1" }],
    users: [{ displayName: "Avery Student", id: "user-student-1" }],
  });
}

describe("WriterHabit AI coach API", () => {
  let app: FastifyInstance;
  let database: MemoryDatabase;
  let studentToken: string;

  beforeEach(async () => {
    database = createSeededDatabase();
    app = await buildServer({
      config: createTestConfig(),
      database,
      logger: false,
    });
    await app.ready();

    studentToken = await signTestToken({ appMetadataRole: "student", subject: "user-student-1" });
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

  it("returns coaching and records a signed-in student interaction", async () => {
    const response = await inject(studentToken, {
      method: "POST",
      payload: {
        assignmentId: "assignment-1",
        draftExcerpt: "I chose to help my neighbor carry groceries because it made the afternoon feel kinder.",
        gradeLevel: 4,
        rubricCriteria: [
          {
            description: "The paragraph has a clear beginning, middle, and ending.",
            id: "criterion-1",
            label: "Organization",
          },
        ],
        studentId: "sp-1",
        studentRequest: "Can you give me a hint?",
        writingLevel: "building",
      },
      url: "/api/v1/ai/coach/hint",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      action: "hint",
      learningMode: true,
      state: "success",
    });
    expect(database.aiCoachInteractions).toHaveLength(1);
    expect(database.aiCoachInteractions[0]).toMatchObject({
      action: "hint",
      draftExcerpt: "I chose to help my neighbor carry groceries because it made the afternoon feel kinder.",
      responseMessageKey: "aiCoach.mock.elementary.hint.message",
      responseTitleKey: "aiCoach.mock.elementary.hint.title",
      status: "completed",
      studentAssignmentId: "student-assignment-1",
      studentProfileId: "sp-1",
    });
  });
});
