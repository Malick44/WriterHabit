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
