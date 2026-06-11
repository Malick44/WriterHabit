import { z } from "zod";

const logLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);
const nodeEnvSchema = z.enum(["development", "test", "production"]);

const envSchema = z.object({
  API_BASE_PATH: z.string().regex(/^\/[A-Za-z0-9/_-]*$/).default("/api/v1"),
  CORS_ORIGINS: z.string().optional(),
  HOST: z.string().min(1).default("0.0.0.0"),
  LOG_LEVEL: logLevelSchema.default("info"),
  NODE_ENV: nodeEnvSchema.default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  SUPABASE_JWT_AUDIENCE: z.string().min(1).optional(),
  SUPABASE_JWT_ISSUER: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(16).optional(),
  SUPABASE_URL: z.string().url().optional(),
});

export type RuntimeEnvironment = z.infer<typeof nodeEnvSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;

export interface ApiConfig {
  apiBasePath: string;
  auth: {
    audience?: string;
    issuer?: string;
    jwksUrl?: string;
    jwtSecret?: string;
    mode: "hs256" | "jwks" | "unconfigured";
    supabaseUrl?: string;
  };
  cors: {
    allowedOrigins: readonly string[];
    allowLocalhostInDevelopment: boolean;
  };
  environment: RuntimeEnvironment;
  host: string;
  logLevel: LogLevel;
  port: number;
}

function parseCorsOrigins(value: string | undefined): readonly string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function getAuthMode(input: {
  SUPABASE_JWKS_URL?: string;
  SUPABASE_JWT_SECRET?: string;
  SUPABASE_URL?: string;
}): ApiConfig["auth"]["mode"] {
  if (input.SUPABASE_JWT_SECRET) {
    return "hs256";
  }

  if (input.SUPABASE_JWKS_URL || input.SUPABASE_URL) {
    return "jwks";
  }

  return "unconfigured";
}

function deriveJwksUrl(input: {
  SUPABASE_JWKS_URL?: string;
  SUPABASE_URL?: string;
}): string | undefined {
  if (input.SUPABASE_JWKS_URL) {
    return input.SUPABASE_JWKS_URL;
  }

  if (!input.SUPABASE_URL) {
    return undefined;
  }

  return `${input.SUPABASE_URL.replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json`;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(`Invalid API configuration: ${parsed.error.message}`);
  }

  const data = parsed.data;

  return {
    apiBasePath: data.API_BASE_PATH.replace(/\/+$/, "") || "/api/v1",
    auth: {
      audience: data.SUPABASE_JWT_AUDIENCE,
      issuer: data.SUPABASE_JWT_ISSUER,
      jwksUrl: deriveJwksUrl(data),
      jwtSecret: data.SUPABASE_JWT_SECRET,
      mode: getAuthMode(data),
      supabaseUrl: data.SUPABASE_URL,
    },
    cors: {
      allowedOrigins: parseCorsOrigins(data.CORS_ORIGINS),
      allowLocalhostInDevelopment: data.NODE_ENV !== "production",
    },
    environment: data.NODE_ENV,
    host: data.HOST,
    logLevel: data.LOG_LEVEL,
    port: data.PORT,
  };
}
