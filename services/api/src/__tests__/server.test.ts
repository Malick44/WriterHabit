import type { FastifyInstance } from "fastify";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildServer } from "../server";
import type { ApiConfig } from "../runtime/config";

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
  email?: string;
  expiresIn?: string;
  subject?: string;
  userMetadataRole?: "student" | "parent" | "teacher" | "admin";
} = {}): Promise<string> {
  return new SignJWT({
    app_metadata: input.appMetadataRole ? { role: input.appMetadataRole } : {},
    email: input.email ?? "student@example.com",
    user_metadata: {
      display_name: "Mira Rivera",
      grade_level: 4,
      onboarding_complete: true,
      role: input.userMetadataRole ?? "student",
    },
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setAudience(testAudience)
    .setExpirationTime(input.expiresIn ?? "15m")
    .setIssuer(testIssuer)
    .setIssuedAt()
    .setSubject(input.subject ?? "user-student-1")
    .sign(new TextEncoder().encode(testJwtSecret));
}

describe("WriterHabit API runtime", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildServer({
      config: createTestConfig(),
      logger: false,
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("serves health without authentication and propagates x-request-id", async () => {
    const response = await app.inject({
      headers: {
        "x-request-id": "req_health_test",
      },
      method: "GET",
      url: "/api/v1/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe("req_health_test");
    expect(response.json()).toMatchObject({
      authConfigured: true,
      requestId: "req_health_test",
      service: "writerhabit-api",
      status: "ok",
    });
  });

  it("rejects protected endpoints when the bearer token is missing", async () => {
    const response = await app.inject({
      headers: {
        "x-request-id": "req_missing_auth",
      },
      method: "GET",
      url: "/api/v1/me/profile",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: "auth.missing_token",
        fallbackMessage: "Sign in to continue.",
        messageKey: "errors.auth.missingToken",
        requestId: "req_missing_auth",
        retryable: false,
      },
    });
  });

  it("rejects protected endpoints when the bearer token is invalid", async () => {
    const response = await app.inject({
      headers: {
        authorization: "Bearer not-a-valid-jwt",
        "x-request-id": "req_invalid_auth",
      },
      method: "GET",
      url: "/api/v1/me/profile",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "auth.invalid_token",
        fallbackMessage: "Your session could not be verified.",
        messageKey: "errors.auth.invalidToken",
        requestId: "req_invalid_auth",
        retryable: false,
      },
    });
  });

  it("returns a token-derived profile for authenticated smoke endpoints", async () => {
    const token = await signTestToken();
    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
        "x-request-id": "req_profile",
      },
      method: "GET",
      url: "/api/v1/auth/session",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe("req_profile");
    expect(response.json()).toMatchObject({
      requestId: "req_profile",
      session: {
        provider: "supabase",
      },
      user: {
        displayName: "Mira Rivera",
        email: "student@example.com",
        gradeLevel: 4,
        id: "user-student-1",
        onboardingCompleted: true,
        role: "student",
      },
    });
  });

  it.each(["teacher", "admin"] as const)(
    "does not elevate the backend role from client-writable user metadata role %s",
    async (userMetadataRole) => {
      const token = await signTestToken({
        userMetadataRole,
      });
      const response = await app.inject({
        headers: {
          authorization: `Bearer ${token}`,
          "x-request-id": `req_user_metadata_role_${userMetadataRole}`,
        },
        method: "GET",
        url: "/api/v1/me/profile",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        requestId: `req_user_metadata_role_${userMetadataRole}`,
        user: {
          id: "user-student-1",
          role: "student",
        },
      });
    },
  );

  it("derives elevated backend roles only from trusted app metadata", async () => {
    const token = await signTestToken({
      appMetadataRole: "teacher",
      userMetadataRole: "student",
    });
    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
        "x-request-id": "req_app_metadata_role",
      },
      method: "GET",
      url: "/api/v1/me/profile",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      requestId: "req_app_metadata_role",
      user: {
        id: "user-student-1",
        role: "teacher",
      },
    });
  });

  it("standardizes validation errors before disabled mutating routes run", async () => {
    const token = await signTestToken();
    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "x-request-id": "req_invalid_body",
      },
      method: "POST",
      payload: JSON.stringify("not an object"),
      url: "/api/v1/students/student-1/assignments/assignment-1/start",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "validation.invalid_field",
        fallbackMessage: "Check the highlighted fields and try again.",
        messageKey: "errors.validation.invalidField",
        requestId: "req_invalid_body",
        retryable: false,
      },
    });
  });

  it("fails registered but incomplete feature routes closed with a typed 501", async () => {
    const token = await signTestToken();
    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
        "x-request-id": "req_feature_disabled",
      },
      method: "GET",
      url: "/api/v1/students/student-1/assignments",
    });

    expect(response.statusCode).toBe(501);
    expect(response.json()).toEqual({
      error: {
        code: "feature.disabled",
        details: {
          endpoint: "GET /api/v1/students/:studentId/assignments",
          feature: "assignments",
        },
        fallbackMessage:
          "This production API route is registered but disabled until persistence and authorization are implemented.",
        messageKey: "errors.feature.disabled",
        requestId: "req_feature_disabled",
        retryable: false,
      },
    });
  });
});
