import { supabase } from "@/core/supabase/supabaseClient";

export async function getApiAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session?.access_token ?? null;
}
