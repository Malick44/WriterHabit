import type { FastifyInstance } from "fastify";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MemoryDatabase } from "../data";
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

describe("Grade 3 day completion workflow", () => {
  let app: FastifyInstance;
  let database: MemoryDatabase;
  let studentToken: string;
  let parentToken: string;
  let otherStudentToken: string;

  beforeEach(async () => {
    database = new MemoryDatabase({
      grade3Progress: [
        {
          completed: false,
          completedAt: null,
          day: 1,
          draft: "Maya returned the rocket before recess ended.",
          id: "g3-1",
          studentProfileId: "sp-1",
          updatedAt: "2026-06-10T08:00:00.000Z",
        },
        {
          completed: false,
          completedAt: null,
          day: 2,
          draft: "   ",
          id: "g3-2",
          studentProfileId: "sp-1",
          updatedAt: "2026-06-10T08:00:00.000Z",
        },
      ],
      parentLinks: [
        { parentUserId: "user-parent-1", status: "active", studentProfileId: "sp-1" },
      ],
      studentProfiles: [
        { gradeLevel: 3, id: "sp-1", userId: "user-student-1" },
        { gradeLevel: 3, id: "sp-2", userId: "user-student-2" },
      ],
      users: [{ displayName: "Maya", id: "user-student-1" }],
    });

    app = await buildServer({
      config: createTestConfig(),
      database,
      logger: false,
    });
    await app.ready();

    studentToken = await signTestToken({ appMetadataRole: "student", subject: "user-student-1" });
    otherStudentToken = await signTestToken({ appMetadataRole: "student", subject: "user-student-2" });
    parentToken = await signTestToken({ appMetadataRole: "parent", subject: "user-parent-1" });
  });

  afterEach(async () => {
    await app.close();
  });

  function completeDay(day: number, token: string, body: Record<string, unknown> = { estimatedMinutes: 15 }) {
    return app.inject({
      body,
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      url: `/api/v1/students/sp-1/grade3-days/${day}/complete`,
    });
  }

  it("completes a day and updates the reviewable streak totals", async () => {
    const response = await completeDay(1, studentToken);

    expect(response.statusCode).toBe(201);
    const payload = response.json() as Record<string, unknown>;
    expect(payload.completed).toBe(true);
    expect(payload.alreadyCompleted).toBe(false);
    expect(payload.completedAt).toBeTruthy();

    const totals = database.progressTotals.find((row) => row.studentProfileId === "sp-1");
    expect(totals?.currentStreakDays).toBe(1);
    expect(totals?.bestStreakDays).toBe(1);
    expect(totals?.minutesThisWeek).toBe(15);
    expect(totals?.streakStatus).toBe("continued");
    expect(totals?.practicedTodayOn).toBe(new Date().toISOString().slice(0, 10));

    const activity = database.activityDays.find((row) => row.studentProfileId === "sp-1");
    expect(activity?.minutesPracticed).toBe(15);
  });

  it("is idempotent: a replay acknowledges without double-counting", async () => {
    await completeDay(1, studentToken);
    const replay = await completeDay(1, studentToken);

    expect(replay.statusCode).toBe(200);
    expect((replay.json() as Record<string, unknown>).alreadyCompleted).toBe(true);

    const totals = database.progressTotals.find((row) => row.studentProfileId === "sp-1");
    expect(totals?.minutesThisWeek).toBe(15);
    expect(totals?.currentStreakDays).toBe(1);
  });

  it("rejects completion with an empty draft", async () => {
    const response = await completeDay(2, studentToken);

    expect(response.statusCode).toBe(422);
  });

  it("returns 404 for a day that was never started", async () => {
    const response = await completeDay(9, studentToken);

    expect(response.statusCode).toBe(404);
  });

  it("denies parents and other students", async () => {
    const parentResponse = await completeDay(1, parentToken);
    const otherStudentResponse = await completeDay(1, otherStudentToken);

    expect(parentResponse.statusCode).toBe(403);
    expect(otherStudentResponse.statusCode).toBe(403);
  });
});
