import type { ApiConfig } from "../runtime/config";
import { createSupabaseDatabase } from "./supabase-database";
import type { Database } from "./types";

export * from "./types";
export { MemoryDatabase } from "./memory-database";
export type { MemoryDatabaseSeed, MemoryParentLink, MemoryTeacherLink } from "./memory-database";
export { SupabaseDatabase, createSupabaseDatabase } from "./supabase-database";

/**
 * Resolves the configured Database implementation. Returns undefined when no
 * database credentials are configured so the writing-loop routes stay behind
 * the fail-closed placeholders.
 */
export function createDatabaseFromConfig(config: ApiConfig["database"]): Database | undefined {
  if (config.mode !== "supabase" || !config.supabaseUrl || !config.serviceRoleKey) {
    return undefined;
  }

  return createSupabaseDatabase({
    serviceRoleKey: config.serviceRoleKey,
    supabaseUrl: config.supabaseUrl,
  });
}
