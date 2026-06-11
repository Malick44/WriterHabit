import type { Session as SupabaseSession, User as SupabaseUser } from "@supabase/supabase-js";
import type { GradeLevel } from "@WriterHabit/shared";
import * as Linking from "expo-linking";
import { z } from "zod";

import { supabase } from "@/core/supabase/supabaseClient";
import { translate } from "@/i18n";

import type {
  AuthActionResult,
  AuthLoginLinkInput,
  AuthOnboardingCompletionInput,
  AuthSession,
  AuthSignInInput,
  AuthSignUpInput,
  NavigableUserRole,
} from "./authTypes";

const roleSchema = z.enum(["student", "parent", "teacher", "admin"]);
const subscriptionSchema = z.enum(["free", "trial", "active", "past_due"]);

const userMetadataSchema = z.object({
  display_name: z.string().min(1).optional(),
  full_name: z.string().min(1).optional(),
  role: roleSchema.catch("student"),
  onboarding_complete: z.boolean().catch(false),
  grade_level: z.coerce.number().int().min(1).max(12).optional(),
  subscription_status: subscriptionSchema.catch("free"),
});

function getAuthRedirectUrl(): string {
  return Linking.createURL("/");
}

function getAuthCallbackParams(url: string): URLSearchParams {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  const hashParams = new URLSearchParams(parsedUrl.hash.startsWith("#") ? parsedUrl.hash.slice(1) : parsedUrl.hash);

  hashParams.forEach((value, key) => {
    params.set(key, value);
  });

  return params;
}

function getDisplayName(user: SupabaseUser, metadata: z.infer<typeof userMetadataSchema>): string {
  return metadata.display_name ?? metadata.full_name ?? user.email ?? translate("en", "common.fallbackUserName");
}

export function mapSupabaseSession(session: SupabaseSession | null): AuthSession | null {
  if (!session) {
    return null;
  }

  if (session.expires_at && session.expires_at * 1000 <= Date.now()) {
    return null;
  }

  const user = session.user;
  const metadata = userMetadataSchema.parse(user.user_metadata ?? {});

  return {
    expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
    refreshToken: session.refresh_token,
    source: "supabase",
    subscriptionStatus: metadata.subscription_status,
    token: session.access_token,
    onboardingComplete: metadata.onboarding_complete,
    user: {
      displayName: getDisplayName(user, metadata),
      email: user.email ?? "",
      gradeLevel: metadata.grade_level as GradeLevel | undefined,
      id: user.id,
      role: metadata.role as NavigableUserRole,
    },
  };
}

export const sessionService = {
  async getCurrentSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return mapSupabaseSession(data.session);
  },

  async signInWithEmail(input: AuthSignInInput): Promise<AuthActionResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email.trim(),
      password: input.password,
    });

    if (error) {
      throw error;
    }

    return {
      session: mapSupabaseSession(data.session),
    };
  },

  async signInWithEmailLink(input: AuthLoginLinkInput): Promise<AuthActionResult> {
    const { error } = await supabase.auth.signInWithOtp({
      email: input.email.trim(),
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw error;
    }

    return {
      session: null,
      requiresEmailConfirmation: true,
    };
  },

  async recoverSessionFromUrl(url: string): Promise<AuthSession | null> {
    const params = getAuthCallbackParams(url);
    const errorCode = params.get("error_code") ?? params.get("error");
    const errorDescription = params.get("error_description");

    if (errorCode) {
      throw new Error(errorDescription ?? errorCode);
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const code = params.get("code");

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        throw error;
      }

      return mapSupabaseSession(data.session);
    }

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        throw error;
      }

      return mapSupabaseSession(data.session);
    }

    return null;
  },

  async signUpWithEmail(input: AuthSignUpInput): Promise<AuthActionResult> {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          display_name: input.displayName.trim(),
          onboarding_complete: false,
          role: input.role,
          subscription_status: "free",
        },
      },
    });

    if (error) {
      throw error;
    }

    const session = mapSupabaseSession(data.session);

    return {
      requiresEmailConfirmation: Boolean(data.user && !session),
      session,
    };
  },

  async completeOnboarding(input?: AuthOnboardingCompletionInput): Promise<AuthSession | null> {
    const metadata: Record<string, unknown> = {
      onboarding_complete: true,
    };

    if (input?.confidenceLevel) {
      metadata.confidence_level = input.confidenceLevel;
    }

    if (input?.dailyPracticeMinutes) {
      metadata.daily_practice_minutes = input.dailyPracticeMinutes;
    }

    if (input?.gradeLevel) {
      metadata.grade_level = input.gradeLevel;
    }

    if (input?.role) {
      metadata.role = input.role;
    }

    if (input?.writingGoals) {
      metadata.writing_goals = input.writingGoals;
    }

    const { error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) {
      throw error;
    }

    return this.getCurrentSession();
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  },

  subscribeToSessionChanges(onSessionChange: (session: AuthSession | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      onSessionChange(mapSupabaseSession(session));
    });

    return () => {
      data.subscription.unsubscribe();
    };
  },
};
