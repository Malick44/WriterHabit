import { create } from "zustand";

import type {
  AuthActionResult,
  AuthErrorCode,
  AuthLoginLinkInput,
  AuthOnboardingCompletionInput,
  AuthOperationStatus,
  AuthSession,
  AuthSignInInput,
  AuthSignUpInput,
  DemoUserId,
  MockSessionRole,
  MockSessionScenario,
} from "./authTypes";
import { getDefaultDemoUserForRole, getDemoUserById, type DemoUserProfile } from "./demoUsers";

type AuthStoreState = {
  status: "hydrating" | "ready";
  operationStatus: AuthOperationStatus;
  session: AuthSession | null;
  errorCode: AuthErrorCode | null;
};

type AuthStoreActions = {
  hydrateSession: () => Promise<void>;
  signInWithEmail: (input: AuthSignInInput) => Promise<AuthActionResult>;
  signInWithEmailLink: (input: AuthLoginLinkInput) => Promise<AuthActionResult>;
  signUpWithEmail: (input: AuthSignUpInput) => Promise<AuthActionResult>;
  signInWithDemoUser: (demoUserId: DemoUserId) => Promise<AuthActionResult>;
  signInWithMockRole: (role: MockSessionRole, options?: { onboardingComplete?: boolean }) => Promise<AuthActionResult>;
  completeOnboarding: (input?: AuthOnboardingCompletionInput) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  setSession: (session: AuthSession | null) => void;
  setErrorCode: (code: AuthErrorCode | null) => void;
  resetMockSession: () => void;
};

export type AuthStore = AuthStoreState & AuthStoreActions;

function createDemoSession(profile: DemoUserProfile): AuthSession {
  return {
    source: "mock",
    token: `mock-${profile.id}-token`,
    user: {
      id: profile.authUserId,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      gradeLevel: profile.gradeLevel,
    },
    onboardingComplete: profile.onboardingComplete,
    subscriptionStatus: profile.subscriptionStatus,
  };
}

function createMockSession(role: MockSessionRole, onboardingComplete: boolean): AuthSession {
  return createDemoSession(getDefaultDemoUserForRole(role, onboardingComplete));
}

function readDefaultScenario(): MockSessionScenario {
  const scenario = process.env.EXPO_PUBLIC_WRITEWISE_MOCK_SESSION;

  switch (scenario) {
    case "student_onboarding":
    case "student":
    case "parent":
    case "teacher":
      return scenario;
    default:
      return "signed_out";
  }
}

function getDefaultMockSession(): AuthSession | null {
  switch (readDefaultScenario()) {
    case "student_onboarding":
      return createMockSession("student", false);
    case "student":
      return createMockSession("student", true);
    case "parent":
      return createMockSession("parent", true);
    case "teacher":
      return createMockSession("teacher", true);
    case "signed_out":
      return null;
  }
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  status: "hydrating",
  operationStatus: "idle",
  session: null,
  errorCode: null,
  hydrateSession: async () => {
    const defaultMockSession = getDefaultMockSession();

    if (defaultMockSession) {
      set({
        errorCode: null,
        session: defaultMockSession,
        status: "ready",
      });
      return;
    }

    try {
      const { sessionService } = await import("./sessionService");
      const session = await sessionService.getCurrentSession();
      set({
        errorCode: null,
        session,
        status: "ready",
      });
    } catch {
      set({
        errorCode: "restore_failed",
        session: null,
        status: "ready",
      });
    }
  },
  signInWithEmail: async (input) => {
    set({ errorCode: null, operationStatus: "loading" });
    try {
      const { sessionService } = await import("./sessionService");
      const result = await sessionService.signInWithEmail(input);
      set({
        errorCode: null,
        operationStatus: "idle",
        session: result.session,
        status: "ready",
      });
      return result;
    } catch {
      set({ errorCode: "sign_in_failed", operationStatus: "idle", session: null, status: "ready" });
      return { errorCode: "sign_in_failed", session: null };
    }
  },
  signInWithEmailLink: async (input) => {
    set({ errorCode: null, operationStatus: "loading" });
    try {
      const { sessionService } = await import("./sessionService");
      const result = await sessionService.signInWithEmailLink(input);
      set({
        errorCode: null,
        operationStatus: "idle",
        session: result.session,
        status: "ready",
      });
      return result;
    } catch {
      set({ errorCode: "sign_in_failed", operationStatus: "idle", session: null, status: "ready" });
      return { errorCode: "sign_in_failed", session: null };
    }
  },
  signUpWithEmail: async (input) => {
    set({ errorCode: null, operationStatus: "loading" });
    try {
      const { sessionService } = await import("./sessionService");
      const result = await sessionService.signUpWithEmail(input);
      set({
        errorCode: null,
        operationStatus: "idle",
        session: result.session,
        status: "ready",
      });
      return result;
    } catch {
      set({ errorCode: "sign_up_failed", operationStatus: "idle", status: "ready" });
      return { errorCode: "sign_up_failed", session: null };
    }
  },
  signInWithDemoUser: async (demoUserId) => {
    const session = createDemoSession(getDemoUserById(demoUserId));
    set({
      errorCode: null,
      operationStatus: "idle",
      status: "ready",
      session,
    });
    return { session };
  },
  signInWithMockRole: async (role, options) => {
    const session = createMockSession(role, options?.onboardingComplete ?? true);
    set({
      errorCode: null,
      operationStatus: "idle",
      status: "ready",
      session,
    });
    return { session };
  },
  completeOnboarding: async (input) => {
    const currentSession = get().session;

    if (!currentSession) {
      return { session: null };
    }

    if (currentSession.source === "mock") {
      const session = {
        ...currentSession,
        onboardingComplete: true,
        user: {
          ...currentSession.user,
          gradeLevel: input?.gradeLevel ?? currentSession.user.gradeLevel,
          role: input?.role ?? currentSession.user.role,
        },
      };
      set({
        errorCode: null,
        status: "ready",
        session,
      });
      return { session };
    }

    set({ errorCode: null, operationStatus: "loading" });
    try {
      const { sessionService } = await import("./sessionService");
      const session = await sessionService.completeOnboarding(input);
      set({
        errorCode: null,
        operationStatus: "idle",
        session,
        status: "ready",
      });
      return { session };
    } catch {
      set({ errorCode: "complete_onboarding_failed", operationStatus: "idle", status: "ready" });
      return { errorCode: "complete_onboarding_failed", session: currentSession };
    }
  },
  signOut: async () => {
    const currentSession = get().session;
    set({ errorCode: null, operationStatus: "loading" });

    try {
      if (currentSession?.source === "supabase") {
        const { sessionService } = await import("./sessionService");
        await sessionService.signOut();
      }
    } finally {
      set({
        errorCode: null,
        operationStatus: "idle",
        status: "ready",
        session: null,
      });
    }
  },
  setSession: (session) => {
    set({
      errorCode: null,
      status: "ready",
      session,
    });
  },
  setErrorCode: (code) => {
    set({ errorCode: code });
  },
  resetMockSession: () => {
    set({
      errorCode: null,
      operationStatus: "idle",
      status: "hydrating",
      session: null,
    });
  },
}));

export { createMockSession };
