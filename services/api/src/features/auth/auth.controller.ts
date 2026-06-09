export const authEndpoints = [
  "POST /api/v1/auth/sign-up",
  "POST /api/v1/auth/sign-in",
  "POST /api/v1/auth/sign-out",
  "GET /api/v1/auth/session",
] as const;

export type AuthEndpoint = (typeof authEndpoints)[number];

// Framework-neutral placeholder for a future controller adapter.
export class AuthController {}
