import type {
  ParentLinkedStudentRecord,
  StudentActivityDayRecord,
  StudentProfileRecord,
  StudentProgressTotalsRecord,
  StudentSkillProgressRecord,
  WeeklyReviewRecord,
} from "../data/types";
import {
  computeWeeklyProgress,
  emptyProgressTotals,
  gradeBandFor,
  mapProgressTotals,
  mapSkillProgress,
  mapStreak,
  mapWeeklyReviewSummary,
  skillLabel,
  type IsoDateRange,
} from "./dashboards.mapper";
import { localizedCopy, type LocalizedCopy } from "../routes/writing-shared";

export interface ParentLinkedStudentApiResponse {
  displayName: string;
  gradeLevel: number;
  id: string;
  relationshipLabel: LocalizedCopy;
}

export interface ParentWeeklyProgressApiResponse {
  areaToPractice: string;
  assignedAssignments: number;
  celebration: LocalizedCopy;
  completedAssignments: number;
  minutesCompleted: number;
  minutesGoal: number;
  sessionsCompleted: number;
  skillImprovementPercent: number;
  streakDays: number;
  weekLabel: string;
}

export interface ParentDashboardStudentApiResponse extends ParentLinkedStudentApiResponse {
  weeklyProgress: ParentWeeklyProgressApiResponse;
}

export interface ParentDashboardApiResponse {
  connectionStatus: "online" | "offline_cached";
  emptyState: {
    body: LocalizedCopy;
    title: LocalizedCopy;
  } | null;
  generatedAt: string;
  parentId: string;
  students: ParentDashboardStudentApiResponse[];
}

export interface ParentMobileDashboardViewModel {
  assignments: [];
  connectionStatus: "online" | "offline_cached";
  generatedAt: string;
  parentId: string;
  selectedStudentId: string | null;
  settingsSummary: {
    aiCoachAccess: "hints_and_revision";
    assignmentAlertsEnabled: boolean;
    digestFrequency: "weekly";
    practiceReminderEnabled: boolean;
    quietHoursLabel: string;
    shareWeeklySummaryWithTeacher: boolean;
    weeklyReportEmailEnabled: boolean;
  };
  skillProgress: {
    currentScore: number;
    label: string;
    nextPractice: string;
    previousScore: number;
    skill: string;
    trendDescription: string;
  }[];
  students: {
    avatarInitials: string;
    displayName: string;
    gradeLevel: number;
    id: string;
    relationshipLabel: string;
    schoolLabel: string;
  }[];
  weeklyProgress: {
    areaToPractice: string;
    areaToPracticeDescription: string;
    areaToPracticeLabel: string;
    assignedAssignments: number;
    celebration: string;
    completedAssignments: number;
    minutesCompleted: number;
    minutesGoal: number;
    sessionsCompleted: number;
    skillImprovementPercent: number;
    streakDays: number;
    weekLabel: string;
  } | null;
}

export function mapParentLinkedStudentApiResponse(record: ParentLinkedStudentRecord): ParentLinkedStudentApiResponse {
  return {
    displayName: record.displayName,
    gradeLevel: record.gradeLevel,
    id: record.studentProfileId,
    relationshipLabel: localizedCopy(
      `parents.relationship.${record.relationshipLabel}`,
      record.relationshipLabel,
    ),
  };
}

export function mapParentLinkedStudentsListApiResponse(
  records: readonly ParentLinkedStudentRecord[],
): {
  items: (ParentLinkedStudentApiResponse & { gradeBand: ReturnType<typeof gradeBandFor> })[];
  nextCursor: string | null;
} {
  return {
    items: records.map((record) => ({
      ...mapParentLinkedStudentApiResponse(record),
      gradeBand: gradeBandFor(record.gradeLevel),
    })),
    nextCursor: null,
  };
}

export function mapParentStudentReportApiResponse(input: {
  activityDays: readonly StudentActivityDayRecord[];
  assignedAssignments: number;
  generatedAt: string;
  skills: readonly StudentSkillProgressRecord[];
  studentProfile: StudentProfileRecord;
  totals?: StudentProgressTotalsRecord;
  weeklyReview: WeeklyReviewRecord | null;
  week: IsoDateRange;
}) {
  const totals = input.totals ?? emptyProgressTotals(input.studentProfile.id);

  return {
    generatedAt: input.generatedAt,
    gradeBand: gradeBandFor(input.studentProfile.gradeLevel),
    gradeLevel: input.studentProfile.gradeLevel,
    skills: input.skills.map((record) => mapSkillProgress(record)),
    streak: mapStreak(totals, input.generatedAt.slice(0, 10)),
    studentId: input.studentProfile.id,
    totals: mapProgressTotals(totals),
    weeklyProgress: computeWeeklyProgress({
      activityDays: [...input.activityDays],
      assignedAssignments: input.assignedAssignments,
      skills: [...input.skills],
      totals,
      week: input.week,
    }),
    weeklyReview: input.weeklyReview ? mapWeeklyReviewSummary(input.weeklyReview) : null,
  };
}

export function mapParentDashboardApiResponse(input: {
  activityDaysByStudentId: ReadonlyMap<string, readonly StudentActivityDayRecord[]>;
  assignedCountsByStudentId: ReadonlyMap<string, number>;
  generatedAt: string;
  parentId: string;
  skillRowsByStudentId: ReadonlyMap<string, readonly StudentSkillProgressRecord[]>;
  students: readonly ParentLinkedStudentRecord[];
  totalsByStudentId: ReadonlyMap<string, StudentProgressTotalsRecord>;
  week: IsoDateRange;
}): ParentDashboardApiResponse {
  const students = input.students.map((student) => {
    const totals = input.totalsByStudentId.get(student.studentProfileId);

    return {
      ...mapParentLinkedStudentApiResponse(student),
      weeklyProgress: mapParentWeeklyProgressApiResponse({
        activityDays: input.activityDaysByStudentId.get(student.studentProfileId) ?? [],
        assignedAssignments: input.assignedCountsByStudentId.get(student.studentProfileId) ?? 0,
        skills: input.skillRowsByStudentId.get(student.studentProfileId) ?? [],
        totals,
        week: input.week,
      }),
    };
  });

  return {
    connectionStatus: "online",
    emptyState:
      students.length > 0
        ? null
        : {
            body: localizedCopy(
              "parents.dashboard.emptyState.body",
              "Link a student account to see weekly writing progress here.",
            ),
            title: localizedCopy("parents.dashboard.emptyState.title", "No linked students yet"),
          },
    generatedAt: input.generatedAt,
    parentId: input.parentId,
    students,
  };
}

export function mapParentDashboardToMobileViewModel(
  response: ParentDashboardApiResponse,
): ParentMobileDashboardViewModel {
  const selectedStudent = response.students[0] ?? null;

  return {
    assignments: [],
    connectionStatus: response.connectionStatus,
    generatedAt: response.generatedAt,
    parentId: response.parentId,
    selectedStudentId: selectedStudent?.id ?? null,
    settingsSummary: {
      aiCoachAccess: "hints_and_revision",
      assignmentAlertsEnabled: true,
      digestFrequency: "weekly",
      practiceReminderEnabled: true,
      quietHoursLabel: "After 8 PM",
      shareWeeklySummaryWithTeacher: false,
      weeklyReportEmailEnabled: true,
    },
    skillProgress: [],
    students: response.students.map((student) => ({
      avatarInitials: initialsFor(student.displayName),
      displayName: student.displayName,
      gradeLevel: student.gradeLevel,
      id: student.id,
      relationshipLabel: student.relationshipLabel.fallback,
      schoolLabel: "Linked student",
    })),
    weeklyProgress: selectedStudent
      ? {
          areaToPractice: selectedStudent.weeklyProgress.areaToPractice,
          areaToPracticeDescription: "A focused skill for this week's practice.",
          areaToPracticeLabel: skillLabel(selectedStudent.weeklyProgress.areaToPractice).fallback,
          assignedAssignments: selectedStudent.weeklyProgress.assignedAssignments,
          celebration: selectedStudent.weeklyProgress.celebration.fallback,
          completedAssignments: selectedStudent.weeklyProgress.completedAssignments,
          minutesCompleted: selectedStudent.weeklyProgress.minutesCompleted,
          minutesGoal: Math.max(1, selectedStudent.weeklyProgress.minutesGoal),
          sessionsCompleted: selectedStudent.weeklyProgress.sessionsCompleted,
          skillImprovementPercent: selectedStudent.weeklyProgress.skillImprovementPercent,
          streakDays: selectedStudent.weeklyProgress.streakDays,
          weekLabel: selectedStudent.weeklyProgress.weekLabel,
        }
      : null,
  };
}

function mapParentWeeklyProgressApiResponse(input: {
  activityDays: readonly StudentActivityDayRecord[];
  assignedAssignments: number;
  skills: readonly StudentSkillProgressRecord[];
  totals?: StudentProgressTotalsRecord;
  week: IsoDateRange;
}): ParentWeeklyProgressApiResponse {
  const minutesCompleted = input.activityDays.reduce((sum, day) => sum + day.minutesPracticed, 0);
  const sessionsCompleted = input.activityDays.filter((day) => day.minutesPracticed > 0).length;
  const completedAssignments = input.activityDays.reduce((sum, day) => sum + day.assignmentsCompleted, 0);
  const weakestSkill = input.skills.reduce<StudentSkillProgressRecord | null>(
    (weakest, skill) => (!weakest || skill.currentScore < weakest.currentScore ? skill : weakest),
    null,
  );
  const improvements = input.skills.map((skill) =>
    skill.previousScore > 0 ? ((skill.currentScore - skill.previousScore) / skill.previousScore) * 100 : 0,
  );
  const skillImprovementPercent =
    improvements.length > 0
      ? Math.round(improvements.reduce((sum, value) => sum + value, 0) / improvements.length)
      : 0;

  return {
    areaToPractice: weakestSkill?.skill ?? "organization",
    assignedAssignments: input.assignedAssignments,
    celebration:
      completedAssignments > 0
        ? localizedCopy("parents.weeklyProgress.celebration.completedWork", "Completed writing practice this week!")
        : localizedCopy("parents.weeklyProgress.celebration.gettingStarted", "Ready to start writing this week."),
    completedAssignments,
    minutesCompleted,
    minutesGoal: input.totals?.weeklyMinutesGoal ?? 1,
    sessionsCompleted,
    skillImprovementPercent,
    streakDays: input.totals?.currentStreakDays ?? 0,
    weekLabel: `${input.week.fromDate} - ${input.week.toDate}`,
  };
}

function initialsFor(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
