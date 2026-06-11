import cors, { type FastifyCorsOptions } from "@fastify/cors";
import Fastify, { type FastifyServerOptions } from "fastify";
import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";

import { createDatabaseFromConfig, type Database } from "./data";
import { createAuthenticateHook, createSupabaseJwtVerifier, type AuthVerifier } from "./runtime/auth";
import { loadConfig, type ApiConfig } from "./runtime/config";
import { createErrorHandler, createNotFoundHandler } from "./runtime/errors";
import { registerAiReviewRoutes } from "./routes/ai-review";
import { registerAssignmentRoutes } from "./routes/assignments";
import { dashboardImplementedEndpoints } from "./routes/dashboards-shared";
import { registerHealthRoutes } from "./routes/health";
import { registerParentRoutes } from "./routes/parents";
import { registerPlaceholderRoutes } from "./routes/placeholders";
import { registerProfileRoutes } from "./routes/profile";
import { registerProgressRoutes } from "./routes/progress";
import { registerSubmissionRoutes } from "./routes/submissions";
import { registerTeacherRoutes } from "./routes/teachers";
import { writingLoopImplementedEndpoints } from "./routes/writing-shared";

interface BuildServerOptions {
  authVerifier?: AuthVerifier;
  config?: ApiConfig;
  database?: Database;
  logger?: FastifyServerOptions["logger"];
}

const requestIdPattern = /^[A-Za-z0-9_.:-]{1,128}$/;

function createRequestId(): string {
  return `req_${randomUUID().replace(/-/g, "")}`;
}

function getIncomingRequestId(request: IncomingMessage): string | undefined {
  const value = request.headers["x-request-id"];
  const requestId = Array.isArray(value) ? value[0] : value;

  if (!requestId || !requestIdPattern.test(requestId)) {
    return undefined;
  }

  return requestId;
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}

function createCorsOriginResolver(config: ApiConfig): FastifyCorsOptions["origin"] {
  const allowedOrigins = new Set(config.cors.allowedOrigins);

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin) || (config.cors.allowLocalhostInDevelopment && isLocalhostOrigin(origin))) {
      callback(null, true);
      return;
    }

    callback(null, false);
  };
}

export async function buildServer(options: BuildServerOptions = {}) {
  const config = options.config ?? loadConfig();
  const authVerifier = options.authVerifier ?? createSupabaseJwtVerifier(config.auth);
  // Without a configured database the writing-loop routes are not registered
  // and stay behind the fail-closed 501 placeholders.
  const database = options.database ?? createDatabaseFromConfig(config.database);
  const app = Fastify({
    genReqId: (request) => getIncomingRequestId(request) ?? createRequestId(),
    logger:
      options.logger ??
      {
        level: config.logLevel,
        redact: {
          paths: [
            "req.headers.authorization",
            "request.headers.authorization",
            "headers.authorization",
            "*.token",
            "*.accessToken",
            "*.refreshToken",
            "*.password",
            "*.serviceRoleKey",
          ],
          remove: true,
        },
      },
    requestIdHeader: "x-request-id",
  });
  const authenticate = createAuthenticateHook(authVerifier);

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });
  app.setErrorHandler(createErrorHandler());
  app.setNotFoundHandler(createNotFoundHandler());

  await app.register(cors, {
    allowedHeaders: ["authorization", "content-type", "x-request-id"],
    credentials: false,
    exposedHeaders: ["x-request-id"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: createCorsOriginResolver(config),
  });

  await app.register(
    async (v1) => {
      await registerHealthRoutes(v1, config);
      await registerProfileRoutes(v1, authenticate);

      if (database) {
        await registerAssignmentRoutes(v1, authenticate, database);
        await registerSubmissionRoutes(v1, authenticate, database);
        await registerAiReviewRoutes(v1, authenticate, database);
        await registerProgressRoutes(v1, authenticate, database);
        await registerParentRoutes(v1, authenticate, database);
        await registerTeacherRoutes(v1, authenticate, database);
      }

      await registerPlaceholderRoutes(v1, authenticate, {
        ...(database
          ? {
              implementedEndpoints: new Set([
                ...writingLoopImplementedEndpoints,
                ...dashboardImplementedEndpoints,
              ]),
            }
          : {}),
      });
    },
    { prefix: config.apiBasePath },
  );

  return app;
}
