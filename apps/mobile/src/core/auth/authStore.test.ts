import { useAuthStore } from "./authStore";

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
    const originalScenario = process.env.EXPO_PUBLIC_WRITEWISE_MOCK_SESSION;
    process.env.EXPO_PUBLIC_WRITEWISE_MOCK_SESSION = "student";

    try {
      await useAuthStore.getState().hydrateSession();

      // Hydration must fall through to the real session service path (no
      // session in tests) instead of seating the mock student session.
      expect(useAuthStore.getState().session?.source).not.toBe("mock");
    } finally {
      if (originalScenario === undefined) {
        delete process.env.EXPO_PUBLIC_WRITEWISE_MOCK_SESSION;
      } else {
        process.env.EXPO_PUBLIC_WRITEWISE_MOCK_SESSION = originalScenario;
      }
    }
  });
});
