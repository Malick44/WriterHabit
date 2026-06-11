import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from "fastify";

function getProfileResponse(request: FastifyRequest) {
  const principal = request.principal;

  if (!principal) {
    throw new Error("Authenticated route missing principal");
  }

  return {
    requestId: request.id,
    session: {
      expiresAt: principal.expiresAt ?? null,
      provider: "supabase",
    },
    user: {
      displayName: principal.displayName,
      email: principal.email,
      gradeLevel: principal.gradeLevel ?? null,
      id: principal.id,
      onboardingCompleted: principal.onboardingCompleted,
      role: principal.role,
    },
  };
}

export async function registerProfileRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
): Promise<void> {
  app.get("/auth/session", { preHandler: authenticate }, async (request) => getProfileResponse(request));
  app.get("/me/profile", { preHandler: authenticate }, async (request) => getProfileResponse(request));
}
