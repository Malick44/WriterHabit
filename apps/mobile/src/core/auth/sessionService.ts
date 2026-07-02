import type { Session as SupabaseSession, User as SupabaseUser } from "@supabase/supabase-js";
import type { GradeLevel } from "@WriterHabit/shared";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
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
const nonceCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._";

const userMetadataSchema = z.object({
  display_name: z.string().min(1).optional(),
  full_name: z.string().min(1).optional(),
  onboarding_complete: z.boolean().catch(false),
  grade_level: z.coerce.number().int().min(1).max(12).optional(),
});

const studentProfileCompletionSchema = z.object({
  confidenceLevel: z.enum(["getting_started", "building", "steady", "confident"]),
  dailyPracticeMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30)]),
  gradeLevel: z.coerce.number().int().min(1).max(12),
  writingGoals: z.array(z.string()).max(4),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTrustedAppMetadata(user: SupabaseUser): Record<string, unknown> {
  return isRecord(user.app_metadata) ? user.app_metadata : {};
}

function getTrustedRole(user: SupabaseUser): NavigableUserRole {
  const parsedRole = roleSchema.safeParse(getTrustedAppMetadata(user).role);

  return parsedRole.success ? parsedRole.data : "student";
}

function getTrustedSubscriptionStatus(user: SupabaseUser): AuthSession["subscriptionStatus"] {
  const parsedStatus = subscriptionSchema.safeParse(getTrustedAppMetadata(user).subscription_status);

  return parsedStatus.success ? parsedStatus.data : "free";
}

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

function createNonce(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => nonceCharacters[byte % nonceCharacters.length]).join("");
}

async function createAppleNoncePair(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const rawNonce = createNonce(await Crypto.getRandomBytesAsync(32));
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  return { hashedNonce, rawNonce };
}

function getAppleDisplayName(fullName: AppleAuthentication.AppleAuthenticationFullName | null): string | null {
  if (!fullName) {
    return null;
  }

  const displayName = [fullName.givenName, fullName.familyName].filter(Boolean).join(" ").trim();

  return displayName.length > 0 ? displayName : null;
}

export function isAppleSignInCancellation(error: unknown): boolean {
  return isRecord(error) && error.code === "ERR_REQUEST_CANCELED";
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
    subscriptionStatus: getTrustedSubscriptionStatus(user),
    token: session.access_token,
    onboardingComplete: metadata.onboarding_complete,
    user: {
      displayName: getDisplayName(user, metadata),
      email: user.email ?? "",
      gradeLevel: metadata.grade_level as GradeLevel | undefined,
      id: user.id,
      role: getTrustedRole(user),
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

  async isAppleSignInAvailable(): Promise<boolean> {
    if (Platform.OS !== "ios") {
      return false;
    }

    return AppleAuthentication.isAvailableAsync();
  },

  async signInWithApple(): Promise<AuthActionResult> {
    const isAvailable = await this.isAppleSignInAvailable();

    if (!isAvailable) {
      throw new Error("Apple sign-in is not available on this device.");
    }

    const { hashedNonce, rawNonce } = await createAppleNoncePair();
    const credential = await AppleAuthentication.signInAsync({
      nonce: hashedNonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error("Apple did not return an identity token.");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) {
      throw error;
    }

    const displayName = getAppleDisplayName(credential.fullName);

    if (displayName) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          family_name: credential.fullName?.familyName ?? undefined,
          full_name: displayName,
          given_name: credential.fullName?.givenName ?? undefined,
        },
      });

      if (updateError) {
        throw updateError;
      }

      return {
        session: await this.getCurrentSession(),
      };
    }

    return {
      session: mapSupabaseSession(data.session),
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
    const { data: currentAuthData, error: currentAuthError } = await supabase.auth.getSession();

    if (currentAuthError) {
      throw currentAuthError;
    }

    const currentSession = currentAuthData.session;

    const metadata: Record<string, unknown> = {
      onboarding_complete: true,
    };

    if (input?.gradeLevel) {
      metadata.grade_level = input.gradeLevel;
    }

    const profileCompletion = studentProfileCompletionSchema.safeParse(input);

    if (currentSession && profileCompletion.success) {
      const { error: ensureProfileError } = await supabase.rpc("ensure_own_student_profile", {
        p_grade_level: profileCompletion.data.gradeLevel,
      });

      if (ensureProfileError) {
        throw ensureProfileError;
      }

      const { error: profileUpdateError } = await supabase
        .from("student_profiles")
        .update({
          daily_goal_minutes: profileCompletion.data.dailyPracticeMinutes,
          grade_level: profileCompletion.data.gradeLevel,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          writing_goals: profileCompletion.data.writingGoals,
          writing_level: profileCompletion.data.confidenceLevel,
        })
        .eq("user_id", currentSession.user.id);

      if (profileUpdateError) {
        throw profileUpdateError;
      }
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
