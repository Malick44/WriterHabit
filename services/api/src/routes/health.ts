import type { FastifyInstance } from "fastify";

import type { ApiConfig } from "../runtime/config";

export async function registerHealthRoutes(app: FastifyInstance, config: ApiConfig): Promise<void> {
  app.get("/health", async (request) => ({
    authConfigured: config.auth.mode !== "unconfigured",
    requestId: request.id,
    service: "writerhabit-api",
    status: "ok",
    timestamp: new Date().toISOString(),
  }));
}
