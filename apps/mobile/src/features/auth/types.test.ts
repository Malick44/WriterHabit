import { signInInputSchema, signUpFormSchema, toSignUpInput } from "./types";

describe("auth form schemas", () => {
  it("trims and accepts valid sign-in input", () => {
    expect(
      signInInputSchema.parse({
        email: " student@example.test ",
        password: "password",
      }),
    ).toEqual({
      email: "student@example.test",
      password: "password",
    });
  });

  it("rejects mismatched sign-up passwords", () => {
    const result = signUpFormSchema.safeParse({
      confirmPassword: "different-password",
      displayName: "Student Writer",
      email: "student@example.test",
      password: "student-password",
      role: "student",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("auth.errors.passwordMismatch");
  });

  it("converts sign-up form values to session input", () => {
    const values = signUpFormSchema.parse({
      confirmPassword: "student-password",
      displayName: " Student Writer ",
      email: " student@example.test ",
      password: "student-password",
      role: "student",
    });

    expect(toSignUpInput(values)).toEqual({
      displayName: "Student Writer",
      email: "student@example.test",
      password: "student-password",
      role: "student",
    });
  });
});
