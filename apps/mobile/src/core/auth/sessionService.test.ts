import type { Session as SupabaseSession, User as SupabaseUser } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

import { supabase } from "@/core/supabase/supabaseClient";

import { mapSupabaseSession, sessionService } from "./sessionService";

jest.mock("expo-linking", () => ({
  createURL: jest.fn(() => "writerhabit://"),
}));

jest.mock("expo-apple-authentication", () => ({
  AppleAuthenticationScope: {
    EMAIL: "EMAIL",
    FULL_NAME: "FULL_NAME",
  },
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: {
    SHA256: "SHA-256",
  },
  digestStringAsync: jest.fn(),
  getRandomBytesAsync: jest.fn(),
}));

jest.mock("@/core/supabase/supabaseClient", () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      setSession: jest.fn(),
      signInWithIdToken: jest.fn(),
      signInWithOtp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

type SignUpResult = {
  data: {
    session: SupabaseSession | null;
    user: SupabaseUser | null;
  };
  error: Error | null;
};

type UpdateUserResult = {
  data: {
    user: SupabaseUser | null;
  };
  error: Error | null;
};

type GetSessionResult = {
  data: {
    session: SupabaseSession | null;
  };
  error: Error | null;
};

type SupabaseAuthMock = {
  getSession: jest.MockedFunction<() => Promise<GetSessionResult>>;
  signInWithIdToken: jest.MockedFunction<(input: unknown) => Promise<SignUpResult>>;
  signUp: jest.MockedFunction<(input: unknown) => Promise<SignUpResult>>;
  updateUser: jest.MockedFunction<(input: unknown) => Promise<UpdateUserResult>>;
};

const authMock = supabase.auth as unknown as SupabaseAuthMock;
const appleAuthMock = AppleAuthentication as unknown as {
  isAvailableAsync: jest.MockedFunction<() => Promise<boolean>>;
  signInAsync: jest.MockedFunction<(input: unknown) => Promise<{
    fullName: {
      familyName: string | null;
      givenName: string | null;
    } | null;
    identityToken: string | null;
  }>>;
};
const cryptoMock = Crypto as unknown as {
  digestStringAsync: jest.MockedFunction<(algorithm: unknown, value: string) => Promise<string>>;
  getRandomBytesAsync: jest.MockedFunction<(length: number) => Promise<Uint8Array>>;
};

function createSupabaseUser(input: {
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
} = {}): SupabaseUser {
  return {
    app_metadata: input.appMetadata ?? {},
    aud: "authenticated",
    confirmed_at: "2026-06-11T12:00:00.000Z",
    created_at: "2026-06-11T12:00:00.000Z",
    email: "student@example.com",
    id: "user-student-1",
    role: "authenticated",
    updated_at: "2026-06-11T12:00:00.000Z",
    user_metadata: {
      display_name: "Mira Rivera",
      grade_level: 4,
      onboarding_complete: true,
      ...input.userMetadata,
    },
  } as SupabaseUser;
}

function createSupabaseSession(input: {
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
} = {}): SupabaseSession {
  return {
    access_token: "access-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    refresh_token: "refresh-token",
    token_type: "bearer",
    user: createSupabaseUser(input),
  } as SupabaseSession;
}

describe("mapSupabaseSession", () => {
  it("does not elevate role or subscription from client-writable user metadata", () => {
    const session = createSupabaseSession({
      userMetadata: {
        role: "admin",
        subscription_status: "active",
      },
    });

    expect(mapSupabaseSession(session)).toMatchObject({
      subscriptionStatus: "free",
      user: {
        role: "student",
      },
    });
  });

  it("uses trusted app metadata for mobile UX role and subscription state", () => {
    const session = createSupabaseSession({
      appMetadata: {
        role: "teacher",
        subscription_status: "trial",
      },
      userMetadata: {
        role: "admin",
        subscription_status: "active",
      },
    });

    expect(mapSupabaseSession(session)).toMatchObject({
      subscriptionStatus: "trial",
      user: {
        role: "teacher",
      },
    });
  });

  it("defaults invalid trusted role and subscription values to least privilege", () => {
    const session = createSupabaseSession({
      appMetadata: {
        role: "super_admin",
        subscription_status: "lifetime",
      },
    });

    expect(mapSupabaseSession(session)).toMatchObject({
      subscriptionStatus: "free",
      user: {
        role: "student",
      },
    });
  });
});

describe("sessionService role metadata writes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("does not send role or entitlement fields during mobile sign-up", async () => {
    authMock.signUp.mockResolvedValueOnce({
      data: {
        session: null,
        user: createSupabaseUser(),
      },
      error: null,
    });

    await sessionService.signUpWithEmail({
      displayName: " Mira Rivera ",
      email: " student@example.com ",
      password: "password123",
    });

    expect(authMock.signUp).toHaveBeenCalledWith({
      email: "student@example.com",
      options: {
        data: {
          display_name: "Mira Rivera",
          onboarding_complete: false,
        },
      },
      password: "password123",
    });
  });

  it("does not send role fields during mobile onboarding completion", async () => {
    const session = createSupabaseSession();
    authMock.updateUser.mockResolvedValueOnce({
      data: {
        user: session.user,
      },
      error: null,
    });
    authMock.getSession.mockResolvedValueOnce({
      data: {
        session,
      },
      error: null,
    });

    await sessionService.completeOnboarding({
      confidenceLevel: "steady",
      dailyPracticeMinutes: 15,
      gradeLevel: 7,
      role: "teacher",
      writingGoals: ["write_essays"],
    });

    const updateInput = authMock.updateUser.mock.calls[0]?.[0] as
      | {
          data: Record<string, unknown>;
        }
      | undefined;

    expect(updateInput?.data).toMatchObject({
      confidence_level: "steady",
      daily_practice_minutes: 15,
      grade_level: 7,
      onboarding_complete: true,
      writing_goals: ["write_essays"],
    });
    expect(updateInput?.data).not.toHaveProperty("role");
  });

  it("exchanges Apple identity tokens without writing role or entitlement metadata", async () => {
    const session = createSupabaseSession({
      userMetadata: {
        display_name: "Mira Appleseed",
      },
    });
    appleAuthMock.isAvailableAsync.mockResolvedValueOnce(true);
    appleAuthMock.signInAsync.mockResolvedValueOnce({
      fullName: {
        familyName: "Appleseed",
        givenName: "Mira",
      },
      identityToken: "apple-identity-token",
    });
    cryptoMock.getRandomBytesAsync.mockResolvedValueOnce(new Uint8Array(Array.from({ length: 32 }, (_, index) => index)));
    cryptoMock.digestStringAsync.mockResolvedValueOnce("hashed-nonce");
    authMock.signInWithIdToken.mockResolvedValueOnce({
      data: {
        session,
        user: session.user,
      },
      error: null,
    });
    authMock.updateUser.mockResolvedValueOnce({
      data: {
        user: session.user,
      },
      error: null,
    });
    authMock.getSession.mockResolvedValueOnce({
      data: {
        session,
      },
      error: null,
    });

    await sessionService.signInWithApple();

    expect(appleAuthMock.signInAsync).toHaveBeenCalledWith({
      nonce: "hashed-nonce",
      requestedScopes: ["FULL_NAME", "EMAIL"],
    });
    expect(authMock.signInWithIdToken).toHaveBeenCalledWith({
      nonce: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
      provider: "apple",
      token: "apple-identity-token",
    });
    const updateInput = authMock.updateUser.mock.calls[0]?.[0] as
      | {
          data: Record<string, unknown>;
        }
      | undefined;
    expect(updateInput?.data).toMatchObject({
      display_name: "Mira Appleseed",
      family_name: "Appleseed",
      full_name: "Mira Appleseed",
      given_name: "Mira",
    });
    expect(updateInput?.data).not.toHaveProperty("role");
    expect(updateInput?.data).not.toHaveProperty("subscription_status");
    expect(updateInput?.data).not.toHaveProperty("entitlement");
  });
});
