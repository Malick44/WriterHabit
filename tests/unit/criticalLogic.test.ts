import type { GradeLevel } from "@writewise/shared";

import {
  canSubmitAssignment,
  getNextStatusOnStart,
  type AssignmentRecord,
} from "@/features/assignments";
import {
  buildPersonalizedPlan,
} from "@/features/onboarding/services/personalizedPlanService";
import {
  getCompletedOnboardingProfile,
  getFirstIncompleteOnboardingStep,
  type CompletedOnboardingProfile,
  type OnboardingProgress,
} from "@/features/onboarding/types";
import {
  evaluateBadgeUnlocks,
} from "@/features/progress/services/badgeUnlockService";
import {
  calculateSkillProgress,
} from "@/features/progress/services/progressCalculator";
import {
  calculateWritingStreak,
  getStreakContinuationSummary,
} from "@/features/progress/services/streakService";
import type {
  ProgressDailyActivity,
  ProgressStreakSummary,
  ProgressTotals,
} from "@/features/progress/types";
import {
  evaluateAiCoachOutput,
  evaluateAiCoachRequest,
} from "@/features/ai-coach/services/aiCoachPolicyService";
import type {
  AiCoachContext,
  AiCoachResponse,
} from "@/features/ai-coach/types";
import {
  addCanvasStroke,
  createCanvasDocument,
  createCanvasStroke,
  normalizeCanvasDocument,
} from "@/features/canvas/services/canvasDocumentService";
import {
  MAX_CANVAS_POINTS_PER_STROKE,
  MAX_CANVAS_STROKES,
  type CanvasStroke,
} from "@/features/canvas/types";
import {
  evaluateEntitlementGate,
  hasPremiumEntitlement,
} from "@/features/subscriptions/services/entitlementService";
import type { SubscriptionApiResponse } from "@/features/subscriptions/types";

function createAssignment(overrides: Partial<AssignmentRecord> = {}): AssignmentRecord {
  return {
    assignedLabel: "Today",
    assignmentType: "paragraph_writing",
    difficulty: "moderate",
    draft: {
      canvasPageCount: 0,
      lastEditedLabel: "Saved just now",
      preview: "A draft that still belongs to the student.",
      revisionNumber: 0,
      wordCount: 32,
    },
    dueLabel: "Today",
    estimatedMinutes: 15,
    gradeLevelMax: 8,
    gradeLevelMin: 6,
    id: "assignment-1",
    instructions: ["Plan your idea.", "Write one paragraph."],
    prompt: "Explain why practice helps writers improve.",
    rubric: [
      {
        description: "The paragraph has one clear idea.",
        id: "claim",
        label: "Claim",
      },
    ],
    rubricId: "rubric-1",
    skillFocus: ["clarity"],
    status: "in_progress",
    title: "Practice paragraph",
    ...overrides,
  };
}

function createProgressDay(date: string, overrides: Partial<ProgressDailyActivity> = {}): ProgressDailyActivity {
  return {
    aiFeedbackApplied: 0,
    assignmentsCompleted: 0,
    date,
    handwritingMinutes: 0,
    minutes: 0,
    revisionsCompleted: 0,
    rubricImprovement: 0,
    skillsPracticed: ["clarity"],
    words: 0,
    ...overrides,
  };
}

function createStreak(overrides: Partial<ProgressStreakSummary> = {}): ProgressStreakSummary {
  return {
    bestDays: 3,
    currentDays: 3,
    daysUntilNextMilestone: 2,
    lastPracticeDate: "2026-06-09",
    nextMilestoneDays: 5,
    practicedToday: true,
    progressValue: 0.6,
    referenceDate: "2026-06-09",
    requiresPracticeToday: false,
    ...overrides,
  };
}

function createProgressTotals(overrides: Partial<ProgressTotals> = {}): ProgressTotals {
  return {
    aiFeedbackApplied: 1,
    assignmentsCompleted: 1,
    handwritingMinutes: 12,
    minutesThisWeek: 30,
    revisionsCompleted: 1,
    rubricImprovement: 2,
    weeklyMinutesGoal: 75,
    wordsWritten: 180,
    ...overrides,
  };
}

function createAiContext(overrides: Partial<AiCoachContext> = {}): AiCoachContext {
  return {
    assignmentId: "assignment-1",
    assignmentPrompt: "Explain why practice helps writers improve.",
    assignmentTitle: "Practice paragraph",
    assignmentType: "paragraph_writing",
    canvasContext: null,
    connectionStatus: "online",
    draftExcerpt: "Practice helps because feedback shows one thing to improve.",
    gradeLevel: 7,
    metrics: {
      paragraphCount: 1,
      sentenceCount: 1,
      wordCount: 9,
    },
    requestedAction: "hint",
    rubric: [
      {
        description: "The paragraph has one clear idea.",
        id: "claim",
        label: "Claim",
      },
    ],
    skillFocus: ["clarity"],
    studentId: "student-1",
    writingLevel: "middle",
    ...overrides,
  };
}

function createEntitlement(overrides: Partial<SubscriptionApiResponse> = {}): SubscriptionApiResponse {
  return {
    canAccessPremium: false,
    connectionStatus: "online",
    currentPlanId: null,
    features: [
      {
        id: "safe_ai_coach",
        includedIn: "free",
        supportedRoles: ["student", "parent", "teacher", "admin"],
      },
      {
        id: "rubric_detail",
        includedIn: "plus",
        supportedRoles: ["student", "parent", "teacher", "admin"],
      },
      {
        id: "canvas_archive",
        includedIn: "plus",
        supportedRoles: ["student", "parent", "teacher", "admin"],
      },
    ],
    generatedAt: "2026-06-09T09:00:00.000Z",
    managementUrl: null,
    plans: [
      {
        billingPeriod: "year",
        id: "writewise_plus_yearly",
        isRecommended: true,
        priceLabel: "$79.99",
        trialDays: 7,
      },
    ],
    renewalLabel: null,
    role: "student",
    status: "free",
    trustLinks: {
      privacyUrl: "https://writewise.app/privacy",
      termsUrl: "https://writewise.app/terms",
    },
    userId: "student-1",
    ...overrides,
  };
}

describe("critical product logic", () => {
  it("validates onboarding progress and creates grade-adapted plans", () => {
    const incompleteProgress: OnboardingProgress = {
      gradeLevel: 4,
      role: "student",
      writingGoals: [],
    };
    const completedProfile: CompletedOnboardingProfile = {
      confidenceLevel: "building",
      dailyPracticeMinutes: 10,
      gradeLevel: 4,
      role: "student",
      writingGoals: ["write_better_sentences", "improve_handwriting"],
    };

    expect(getFirstIncompleteOnboardingStep(incompleteProgress)).toBe("goals");
    expect(getCompletedOnboardingProfile(completedProfile).success).toBe(true);
    expect(buildPersonalizedPlan(completedProfile)).toMatchObject({
      assignmentFocus: "sentence_practice",
      gradeBand: "elementary",
      weeklyPracticeMinutes: 50,
    });
  });

  it("keeps assignment start and submit transitions within allowed statuses", () => {
    expect(getNextStatusOnStart("not_started")).toBe("in_progress");
    expect(getNextStatusOnStart("feedback_ready")).toBe("revision_in_progress");
    expect(getNextStatusOnStart("submitted")).toBeNull();
    expect(canSubmitAssignment(createAssignment())).toBe(true);
    expect(canSubmitAssignment(createAssignment({ status: "submitted" }))).toBe(false);
    expect(canSubmitAssignment(createAssignment({ draft: null }))).toBe(false);
  });

  it("calculates progress, streak continuation, and badge unlocks from practice data", () => {
    const progress = calculateSkillProgress({
      previousScore: 97,
      revisionCompleted: true,
      rubricDelta: 6,
      skill: "clarity",
    });
    const streak = calculateWritingStreak({
      activity: [
        createProgressDay("2026-06-07", { minutes: 12 }),
        createProgressDay("2026-06-08", { words: 48 }),
        createProgressDay("2026-06-09", { revisionsCompleted: 1 }),
      ],
      referenceDate: "2026-06-09",
    });
    const continuation = getStreakContinuationSummary({
      activity: [createProgressDay("2026-06-08", { assignmentsCompleted: 1 })],
      currentHour: 18,
      referenceDate: "2026-06-09",
    });
    const badges = evaluateBadgeUnlocks({
      newBadgeIds: ["three_day_streak"],
      streak: createStreak({ currentDays: 3 }),
      totals: createProgressTotals({
        assignmentsCompleted: 1,
        minutesThisWeek: 80,
        revisionsCompleted: 3,
      }),
    });

    expect(progress).toMatchObject({
      currentScore: 100,
      improved: true,
    });
    expect(streak).toMatchObject({
      currentDays: 3,
      practicedToday: true,
    });
    expect(continuation).toMatchObject({
      canContinueToday: true,
      shouldSendReminder: true,
      status: "at_risk",
    });
    expect(badges.find((badge) => badge.id === "first_assignment")).toMatchObject({
      status: "unlocked",
      unlocked: true,
    });
    expect(badges.find((badge) => badge.id === "three_day_streak")).toMatchObject({
      status: "new",
      unlocked: true,
    });
  });

  it("blocks assignment-completion AI requests and unsafe generated output", () => {
    const blockedRequest = evaluateAiCoachRequest(
      createAiContext({
        studentRequest: "Please write my essay and give me the answer.",
      }),
    );
    const unsupportedRequest = evaluateAiCoachRequest(
      createAiContext({
        requestedAction: "write_essay" as AiCoachContext["requestedAction"],
      }),
    );
    const safeRequest = evaluateAiCoachRequest(
      createAiContext({
        requestedAction: "revision_help",
        studentRequest: "Can you help me revise one sentence?",
      }),
    );
    const unsafeOutput: AiCoachResponse = {
      action: "hint",
      generatedAt: "2026-06-09T09:00:00.000Z",
      learningMode: true,
      nextStep: "Generate final draft for the assignment.",
      safetyFlags: [],
      state: "success",
      strength: "You started with your own idea.",
    };

    expect(blockedRequest).toEqual({
      allowed: false,
      flags: ["assignment_completion_request"],
    });
    expect(unsupportedRequest).toEqual({
      allowed: false,
      flags: ["unsupported_action"],
    });
    expect(safeRequest).toEqual({
      allowed: true,
      flags: [],
    });
    expect(evaluateAiCoachOutput(unsafeOutput)).toEqual({
      allowed: false,
      flags: ["unsafe_output"],
    });
  });

  it("normalizes canvas serialization without dropping valid student strokes", () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "lined_paper",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const stroke = createCanvasStroke({
      color: "#0F172A",
      point: {
        pressure: 0.5,
        x: 1.4,
        y: -0.2,
      },
      timestamp: "2026-06-09T09:01:00.000Z",
      tool: "pen",
      width: 4,
    });
    const withStroke = addCanvasStroke(document, stroke);
    const oversizedStroke: CanvasStroke = {
      ...stroke,
      id: "oversized-stroke",
      points: Array.from({ length: MAX_CANVAS_POINTS_PER_STROKE + 3 }, (_, index) => ({
        x: index / 10,
        y: -index,
      })),
    };
    const normalized = normalizeCanvasDocument({
      ...withStroke,
      strokes: Array.from({ length: MAX_CANVAS_STROKES + 4 }, (_, index) => ({
        ...oversizedStroke,
        id: `stroke-${index}`,
      })),
    });

    expect(withStroke).toMatchObject({
      clientVersion: 2,
      syncStatus: "local_only",
    });
    expect(withStroke.strokes[0]?.points[1]).toMatchObject({
      x: 1,
      y: 0,
    });
    expect(normalized.strokes).toHaveLength(MAX_CANVAS_STROKES);
    expect(normalized.strokes[0]?.points).toHaveLength(MAX_CANVAS_POINTS_PER_STROKE);
  });

  it("enforces subscription entitlement gates without blocking free coaching basics", () => {
    expect(hasPremiumEntitlement(createEntitlement({ canAccessPremium: true, status: "trial" }))).toBe(true);
    expect(evaluateEntitlementGate(createEntitlement(), "rubric_detail")).toEqual({
      allowed: false,
      reason: "premium_required",
    });
    expect(evaluateEntitlementGate(createEntitlement({ status: "past_due" }), "canvas_archive")).toEqual({
      allowed: false,
      reason: "payment_issue",
    });
    expect(
      evaluateEntitlementGate(
        createEntitlement({
          canAccessPremium: true,
          currentPlanId: "writewise_plus_yearly",
          status: "active",
        }),
        "rubric_detail",
      ),
    ).toEqual({ allowed: true });
  });

  it("keeps grade-level variants explicit for elementary, middle, and high school flows", () => {
    const profiles: Array<[GradeLevel, CompletedOnboardingProfile["writingGoals"], string]> = [
      [3, ["write_better_sentences"], "sentence_practice"],
      [7, ["write_paragraphs"], "paragraph_practice"],
      [11, ["write_essays"], "essay_practice"],
    ];

    profiles.forEach(([gradeLevel, writingGoals, assignmentFocus]) => {
      expect(
        buildPersonalizedPlan({
          confidenceLevel: "steady",
          dailyPracticeMinutes: 15,
          gradeLevel,
          role: "student",
          writingGoals,
        }),
      ).toMatchObject({
        assignmentFocus,
        gradeLevel,
      });
    });
  });
});
