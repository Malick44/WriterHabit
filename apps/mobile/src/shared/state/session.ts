import type { ReactNode } from "react";

import { useAuthSession } from "@/core/auth/useAuthSession";

/**
 * Compatibility wrapper for older shared/session imports.
 *
 * The canonical session implementation lives in `@/core/auth` and persists
 * Supabase auth through `@/core/supabase/supabaseClient`.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useSession() {
  return useAuthSession();
}
