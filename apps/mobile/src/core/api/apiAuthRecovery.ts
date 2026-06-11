import { supabase } from "@/core/supabase/supabaseClient";

let refreshPromise: Promise<string | null> | null = null;

async function refreshCurrentSession(): Promise<string | null> {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw error;
  }

  return data.session?.access_token ?? null;
}

export async function refreshApiAccessToken(): Promise<string | null> {
  refreshPromise ??= refreshCurrentSession().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function clearApiSession(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
