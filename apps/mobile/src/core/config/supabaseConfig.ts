import { z } from "zod";

const supabaseEnvSchema = z
  .object({
    EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  })
  .refine(
    (env) => Boolean(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    "Missing EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY",
  );

const parsedSupabaseEnv = supabaseEnvSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsedSupabaseEnv.success) {
  throw new Error(`Invalid Supabase configuration: ${parsedSupabaseEnv.error.message}`);
}

const publishableKey =
  parsedSupabaseEnv.data.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  parsedSupabaseEnv.data.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!publishableKey) {
  throw new Error("Missing Supabase publishable key");
}

export const supabaseConfig = {
  url: parsedSupabaseEnv.data.EXPO_PUBLIC_SUPABASE_URL,
  publishableKey,
} as const;
