import { describe, expect, it } from "vitest";

import type {
  ClassRecord,
  BadgeRecord,
  ParentLinkedStudentRecord,
  StudentBadgeRecord,
  StudentActivityDayRecord,
  StudentProgressTotalsRecord,
  StudentProfileRecord,
  StudentSkillProgressRecord,
  SubmissionQueueRecord,
  WeeklyReviewRecord,
} from "../data/types";
import {
  mapParentDashboardApiResponse,
  mapParentDashboardToMobileViewModel,
} from "../mappers/parents.mapper";
import {
  mapTeacherClassSummaryApiResponse,
  mapTeacherDashboardApiResponse,
  mapTeacherDashboardToMobileViewModel,
} from "../mappers/teachers.mapper";
import {
  mapStudentProgressApiResponse,
  mapStudentProgressToMobileViewModel,
} from "../mappers/progress.mapper";
import { parentDashboardApiResponseSchema } from "../../../../apps/mobile/src/features/parent/types";
import { progressApiResponseSchema } from "../../../../apps/mobile/src/features/progress/types";
import { teacherDashboardApiResponseSchema } from "../../../../apps/mobile/src/features/teacher/types";

const generatedAt = "2026-06-30T16:00:00.000Z";
const week = { fromDate: "2026-06-29", toDate: "2026-07-05" };

describe("dashboard contract mappers", () => {
  it("maps parent dashboard API responses into the current mobile Zod schema", () => {
    const linkedStudent: ParentLinkedStudentRecord = {
      displayName: "Maya Rivera",
      gradeLevel: 3,
      relationshipLabel: "Child",
      studentProfileId: "student-profile-1",
    };
    const totals: StudentProgressTotalsRecord = {
      aiFeedbackApplied: 1,
      assignmentsCompleted: 4,
      bestStreakDays: 6,
      currentStreakDays: 3,
      handwritingMinutes: 20,
      minutesThisWeek: 35,
      practicedTodayOn: "2026-06-30",
      revisionsCompleted: 2,
      rubricImprovement: 8,
      streakStatus: "continued",
      studentProfileId: "student-profile-1",
      weeklyMinutesGoal: 45,
      wordsWritten: 220,
    };
    const skill: StudentSkillProgressRecord = {
      currentScore: 68,
      level: 2,
      previousScore: 60,
      skill: "organization",
      studentProfileId: "student-profile-1",
      updatedAt: generatedAt,
    };
    const activity: StudentActivityDayRecord = {
      activityDate: "2026-06-30",
      assignmentsCompleted: 1,
      feedbackApplied: 0,
      handwritingMinutes: 12,
      minutesPracticed: 18,
      practicedSkills: ["organization"],
      revisionsCompleted: 1,
      studentProfileId: "student-profile-1",
      wordsWritten: 80,
    };

    const apiResponse = mapParentDashboardApiResponse({
      activityDaysByStudentId: new Map([["student-profile-1", [activity]]]),
      assignedCountsByStudentId: new Map([["student-profile-1", 2]]),
      generatedAt,
      parentId: "parent-1",
      skillRowsByStudentId: new Map([["student-profile-1", [skill]]]),
      students: [linkedStudent],
      totalsByStudentId: new Map([["student-profile-1", totals]]),
      week,
    });
    const mobileResponse = mapParentDashboardToMobileViewModel(apiResponse);

    expect(() => parentDashboardApiResponseSchema.parse(mobileResponse)).not.toThrow();
  });

  it("maps teacher dashboard API responses into the current mobile Zod schema", () => {
    const classRecord: ClassRecord = {
      gradeLevel: 3,
      id: "class-1",
      name: "Room 3 Writers",
      status: "active",
      teacherProfileId: "teacher-profile-1",
    };
    const skill: StudentSkillProgressRecord = {
      currentScore: 74,
      level: 3,
      previousScore: 70,
      skill: "clarity",
      studentProfileId: "student-profile-1",
      updatedAt: generatedAt,
    };
    const activity: StudentActivityDayRecord = {
      activityDate: "2026-06-30",
      assignmentsCompleted: 1,
      feedbackApplied: 0,
      handwritingMinutes: 8,
      minutesPracticed: 16,
      practicedSkills: ["clarity"],
      revisionsCompleted: 0,
      studentProfileId: "student-profile-1",
      wordsWritten: 90,
    };
    const submission: SubmissionQueueRecord = {
      assignmentId: "assignment-1",
      assignmentTitleFallback: "Friendly Problem Solver",
      assignmentTitleKey: "assignments.contract.title",
      classId: "class-1",
      hasCanvas: true,
      id: "submission-1",
      status: "submitted",
      studentAssignmentId: "student-assignment-1",
      studentDisplayName: "Maya Rivera",
      studentProfileId: "student-profile-1",
      submittedAt: generatedAt,
      wordCount: 87,
    };
    const classSummary = mapTeacherClassSummaryApiResponse({
      activeAssignmentCount: 2,
      activityDays: [activity],
      classRecord,
      completedAssignments: 3,
      needsReview: 1,
      rosterSize: 18,
      skillRows: [skill],
      totalAssigned: 4,
    });
    const apiResponse = mapTeacherDashboardApiResponse({
      classes: [classSummary],
      generatedAt,
      queue: [submission],
      teacherId: "teacher-profile-1",
    });
    const mobileResponse = mapTeacherDashboardToMobileViewModel(apiResponse);

    expect(() => teacherDashboardApiResponseSchema.parse(mobileResponse)).not.toThrow();
  });

  it("keeps private student content out of parent and teacher dashboard list models", () => {
    const privateFullDraft = "PRIVATE FULL DRAFT TEXT";
    const privateSubmissionText = "PRIVATE FULL SUBMISSION TEXT";
    const privateCanvasStroke = "\"points\":[{\"x\":0.1,\"y\":0.2}]";
    const privateRecognizedText = "PRIVATE RECOGNIZED HANDWRITING TEXT";
    const privateAiInteraction = "PRIVATE AI COACH INTERACTION";

    const parentPayload = mapParentDashboardApiResponse({
      activityDaysByStudentId: new Map(),
      assignedCountsByStudentId: new Map(),
      generatedAt,
      parentId: "parent-1",
      skillRowsByStudentId: new Map(),
      students: [],
      totalsByStudentId: new Map(),
      week,
    });
    const teacherPayload = mapTeacherDashboardApiResponse({
      classes: [],
      generatedAt,
      queue: [],
      teacherId: "teacher-profile-1",
    });
    const serialized = JSON.stringify({ parentPayload, teacherPayload });

    expect(serialized).not.toContain(privateFullDraft);
    expect(serialized).not.toContain(privateSubmissionText);
    expect(serialized).not.toContain(privateCanvasStroke);
    expect(serialized).not.toContain(privateRecognizedText);
    expect(serialized).not.toContain(privateAiInteraction);
    expect(serialized).not.toContain("textContent");
    expect(serialized).not.toContain("typedText");
    expect(serialized).not.toContain("recognizedText");
    expect(serialized).not.toContain("strokes");
    expect(serialized).not.toContain("aiInteraction");
  });

  it("maps student progress API responses into the current mobile Zod schema", () => {
    const profile: StudentProfileRecord = {
      gradeLevel: 3,
      id: "student-profile-1",
      userId: "student-user-1",
    };
    const totals: StudentProgressTotalsRecord = {
      aiFeedbackApplied: 2,
      assignmentsCompleted: 5,
      bestStreakDays: 7,
      currentStreakDays: 4,
      handwritingMinutes: 26,
      minutesThisWeek: 42,
      practicedTodayOn: "2026-06-30",
      revisionsCompleted: 3,
      rubricImprovement: 6,
      streakStatus: "continued",
      studentProfileId: "student-profile-1",
      weeklyMinutesGoal: 50,
      wordsWritten: 310,
    };
    const skill: StudentSkillProgressRecord = {
      currentScore: 72,
      level: 3,
      previousScore: 65,
      skill: "sentence_structure",
      studentProfileId: "student-profile-1",
      updatedAt: generatedAt,
    };
    const activity: StudentActivityDayRecord = {
      activityDate: "2026-06-30",
      assignmentsCompleted: 1,
      feedbackApplied: 1,
      handwritingMinutes: 10,
      minutesPracticed: 20,
      practicedSkills: ["sentence_structure"],
      revisionsCompleted: 1,
      studentProfileId: "student-profile-1",
      wordsWritten: 120,
    };
    const badge: BadgeRecord = {
      code: "first_assignment",
      descriptionFallback: "Complete your first assignment.",
      descriptionKey: "progress.badges.firstAssignment.description",
      iconName: "star",
      id: "first_assignment",
      nameFallback: "First Assignment",
      nameKey: "progress.badges.firstAssignment.title",
    };
    const studentBadge: StudentBadgeRecord = {
      badgeId: "first_assignment",
      progressPercent: 100,
      status: "unlocked",
      studentProfileId: "student-profile-1",
      unlockedAt: generatedAt,
    };
    const weeklyReview: WeeklyReviewRecord = {
      celebrationFallback: "You practiced writing this week.",
      celebrationKey: "progress.weeklyReview.celebration",
      focusForNextWeekFallback: "Try stronger sentences.",
      focusForNextWeekKey: "progress.weeklyReview.focus",
      id: "weekly-review-1",
      studentProfileId: "student-profile-1",
      weekEnd: "2026-07-05",
      weekStart: "2026-06-29",
    };
    const apiResponse = mapStudentProgressApiResponse({
      activityDays: [activity],
      badges: [badge],
      generatedAt,
      profile,
      skills: [skill],
      studentBadges: [studentBadge],
      totals,
      weeklyReview,
    });
    const mobileResponse = mapStudentProgressToMobileViewModel(apiResponse);

    expect(() => progressApiResponseSchema.parse(mobileResponse)).not.toThrow();
  });
});
