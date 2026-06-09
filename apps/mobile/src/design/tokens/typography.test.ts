import { getGradeBandForGrade, getTypographyForGrade } from "./typography";

describe("design typography tokens", () => {
  it("maps grades to the correct grade bands", () => {
    expect(getGradeBandForGrade(1)).toBe("elementary");
    expect(getGradeBandForGrade(5)).toBe("elementary");
    expect(getGradeBandForGrade(6)).toBe("middle");
    expect(getGradeBandForGrade(8)).toBe("middle");
    expect(getGradeBandForGrade(9)).toBe("high");
    expect(getGradeBandForGrade(12)).toBe("high");
  });

  it("uses larger body text for elementary students", () => {
    expect(getTypographyForGrade(3).body.fontSize ?? 0).toBeGreaterThan(
      getTypographyForGrade(11).body.fontSize ?? 0,
    );
  });
});
