import { sessionService } from "./sessionService";
import { useAuthStore } from "./authStore";

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

function resetAuthStore() {
  useAuthStore.setState({
    errorCode: null,
    operationStatus: "idle",
    session: null,
    status: "ready",
  });
}

describe("auth demo users", () => {
  afterEach(() => {
    resetAuthStore();
  });

  it("creates a mock session for the selected demo user", async () => {
    const result = await useAuthStore.getState().signInWithDemoUser("high_school_student");

    expect(result.session).toMatchObject({
      source: "mock",
      onboardingComplete: true,
      subscriptionStatus: "active",
      user: {
        displayName: "Avery Chen",
        email: "avery.high@example.test",
        gradeLevel: 10,
        role: "student",
      },
    });
    expect(useAuthStore.getState().session?.user.id).toBe("demo-student-high");
  });

  it("keeps role-based mock sessions compatible with existing demo env flags", async () => {
    const result = await useAuthStore.getState().signInWithMockRole("student", {
      onboardingComplete: false,
    });

    expect(result.session?.user.displayName).toBe("Sam Patel");
    expect(result.session?.onboardingComplete).toBe(false);
  });
});

describe("auth Apple sign-in", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetAuthStore();
  });

  it("does not show an auth error when the Apple sheet is cancelled", async () => {
    jest.spyOn(sessionService, "signInWithApple").mockRejectedValueOnce({
      code: "ERR_REQUEST_CANCELED",
    });

    const result = await useAuthStore.getState().signInWithApple();

    expect(result).toMatchObject({
      cancelled: true,
      session: null,
    });
    expect(useAuthStore.getState().errorCode).toBeNull();
    expect(useAuthStore.getState().operationStatus).toBe("idle");
  });
});

describe("auth mock sessions outside development", () => {
  const devGlobal = globalThis as { __DEV__?: boolean };
  const originalDev = devGlobal.__DEV__;

  beforeEach(() => {
    devGlobal.__DEV__ = false;
  });

  afterEach(() => {
    devGlobal.__DEV__ = originalDev;
    resetAuthStore();
  });

  it("rejects demo user sign-in in production builds", async () => {
    const result = await useAuthStore.getState().signInWithDemoUser("high_school_student");

    expect(result.session).toBeNull();
    expect(result.errorCode).toBe("sign_in_failed");
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("rejects role-based mock sign-in in production builds", async () => {
    const result = await useAuthStore.getState().signInWithMockRole("teacher");

    expect(result.session).toBeNull();
    expect(result.errorCode).toBe("sign_in_failed");
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("ignores the mock session env flag during hydration in production builds", async () => {
    const originalScenario = process.env.EXPO_PUBLIC_WriterHabit_MOCK_SESSION;
    process.env.EXPO_PUBLIC_WriterHabit_MOCK_SESSION = "student";

    try {
      await useAuthStore.getState().hydrateSession();

      // Hydration must fall through to the real session service path (no
      // session in tests) instead of seating the mock student session.
      expect(useAuthStore.getState().session?.source).not.toBe("mock");
    } finally {
      if (originalScenario === undefined) {
        delete process.env.EXPO_PUBLIC_WriterHabit_MOCK_SESSION;
      } else {
        process.env.EXPO_PUBLIC_WriterHabit_MOCK_SESSION = originalScenario;
      }
    }
  });
});
