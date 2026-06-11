import type { FastifyRequest, preHandlerHookHandler } from "fastify";
import {
  createRemoteJWKSet,
  errors as joseErrors,
  jwtVerify,
  type JWTVerifyOptions,
  type JWTPayload,
} from "jose";
import { z } from "zod";

import type { ApiConfig } from "./config";
import { ApiHttpError } from "./errors";

const userRoleSchema = z.enum(["student", "parent", "teacher", "admin"]);
const gradeLevelSchema = z.coerce.number().int().min(1).max(12).optional();
const publicMetadataSchema = z
  .object({
    display_name: z.string().min(1).optional(),
    full_name: z.string().min(1).optional(),
    grade_level: gradeLevelSchema,
    onboarding_complete: z.boolean().catch(false),
  })
  .passthrough();

export interface AuthPrincipal {
  displayName: string;
  email: string;
  expiresAt?: string;
  gradeLevel?: number;
  id: string;
  onboardingCompleted: boolean;
  role: z.infer<typeof userRoleSchema>;
}

export interface AuthVerifier {
  verifyToken(token: string): Promise<AuthPrincipal>;
}

declare module "fastify" {
  interface FastifyRequest {
    principal?: AuthPrincipal;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPublicMetadata(claims: JWTPayload): z.infer<typeof publicMetadataSchema> {
  const userMetadata = isRecord(claims.user_metadata) ? claims.user_metadata : {};

  return publicMetadataSchema.parse(userMetadata);
}

function getTrustedRole(claims: JWTPayload): z.infer<typeof userRoleSchema> {
  const appMetadata = isRecord(claims.app_metadata) ? claims.app_metadata : {};
  const appRole = userRoleSchema.safeParse(appMetadata.role);

  return appRole.success ? appRole.data : "student";
}

function claimsToPrincipal(claims: JWTPayload): AuthPrincipal {
  if (!claims.sub) {
    throw new ApiHttpError({
      code: "auth.invalid_token",
      details: {
        reason: "missing_sub",
      },
    });
  }

  const metadata = getPublicMetadata(claims);
  const email = typeof claims.email === "string" ? claims.email : "";

  return {
    displayName: metadata.display_name ?? metadata.full_name ?? (email || "WriterHabit user"),
    email,
    ...(claims.exp ? { expiresAt: new Date(claims.exp * 1000).toISOString() } : {}),
    ...(metadata.grade_level ? { gradeLevel: metadata.grade_level } : {}),
    id: claims.sub,
    onboardingCompleted: metadata.onboarding_complete,
    role: getTrustedRole(claims),
  };
}

function getVerifyOptions(config: ApiConfig["auth"]): JWTVerifyOptions {
  return {
    ...(config.audience ? { audience: config.audience } : {}),
    ...(config.issuer ? { issuer: config.issuer } : {}),
  };
}

function mapJwtError(error: unknown): ApiHttpError {
  if (error instanceof ApiHttpError) {
    return error;
  }

  if (error instanceof joseErrors.JWTExpired) {
    return new ApiHttpError({
      code: "auth.expired_token",
    });
  }

  return new ApiHttpError({
    code: "auth.invalid_token",
  });
}

export function createSupabaseJwtVerifier(config: ApiConfig["auth"]): AuthVerifier {
  if (config.mode === "hs256" && config.jwtSecret) {
    const secret = new TextEncoder().encode(config.jwtSecret);
    const options = getVerifyOptions(config);

    return {
      async verifyToken(token: string): Promise<AuthPrincipal> {
        try {
          const { payload } = await jwtVerify(token, secret, options);
          return claimsToPrincipal(payload);
        } catch (error) {
          throw mapJwtError(error);
        }
      },
    };
  }

  if (config.mode === "jwks" && config.jwksUrl) {
    const jwks = createRemoteJWKSet(new URL(config.jwksUrl));
    const options = getVerifyOptions(config);

    return {
      async verifyToken(token: string): Promise<AuthPrincipal> {
        try {
          const { payload } = await jwtVerify(token, jwks, options);
          return claimsToPrincipal(payload);
        } catch (error) {
          throw mapJwtError(error);
        }
      },
    };
  }

  return {
    async verifyToken(): Promise<AuthPrincipal> {
      throw new ApiHttpError({
        code: "system.unavailable",
        details: {
          ownerAction: "Set SUPABASE_JWT_SECRET or SUPABASE_URL/SUPABASE_JWKS_URL for API auth verification.",
        },
        fallbackMessage: "WriterHabit authentication is not configured.",
        retryable: false,
      });
    },
  };
}

function getBearerToken(request: FastifyRequest): string {
  const authorization = request.headers.authorization;

  if (!authorization) {
    throw new ApiHttpError({
      code: "auth.missing_token",
    });
  }

  const [scheme, token, extra] = authorization.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
    throw new ApiHttpError({
      code: "auth.invalid_token",
    });
  }

  return token;
}

export function createAuthenticateHook(verifier: AuthVerifier): preHandlerHookHandler {
  return async (request): Promise<void> => {
    const token = getBearerToken(request);
    request.principal = await verifier.verifyToken(token);
  };
}
