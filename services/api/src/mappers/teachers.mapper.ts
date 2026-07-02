import type {
  ClassRosterStudentRecord,
  ClassRecord,
  StudentActivityDayRecord,
  StudentProgressTotalsRecord,
  StudentSkillProgressRecord,
  SubmissionQueueRecord,
  SubmissionStatus,
} from "../data/types";
import { emptyProgressTotals } from "./dashboards.mapper";
import { localizedCopy, type LocalizedCopy } from "../routes/writing-shared";

export interface TeacherClassSummaryApiResponse {
  activeAssignmentCount: number;
  averageCompletionPercent: number;
  averageSkillScore: number;
  gradeLevel: number;
  id: string;
  name: string;
  studentCount: number;
  submissionsNeedingReview: number;
  weeklyWritingMinutes: number;
}

export interface TeacherQueueItemApiResponse {
  assignmentId: string;
  assignmentTitle: LocalizedCopy;
  classId: string;
  hasCanvas: boolean;
  id: string;
  status: SubmissionStatus;
  studentDisplayName: string;
  studentId: string;
  submittedAt: string;
  wordCount: number;
}

export interface TeacherDashboardApiResponse {
  classes: TeacherClassSummaryApiResponse[];
  connectionStatus: "online" | "offline_cached";
  emptyState: {
    body: LocalizedCopy;
    title: LocalizedCopy;
  } | null;
  generatedAt: string;
  submissionsNeedingReview: TeacherQueueItemApiResponse[];
  teacherId: string;
}

export interface TeacherMobileDashboardViewModel {
  assignments: [];
  classes: {
    activeAssignmentCount: number;
    averageCompletionPercent: number;
    averageSkillScore: number;
    gradeLevel: number;
    id: string;
    name: string;
    studentCount: number;
    submissionsNeedingReview: number;
    trendLabel: string;
    weeklyWritingMinutes: number;
  }[];
  connectionStatus: "online" | "offline_cached";
  generatedAt: string;
  safetyNote: string;
  submissions: {
    assignmentId: string;
    assignmentTitle: string;
    classId: string;
    className: string;
    gradeLevel: number;
    hasCanvas: boolean;
    id: string;
    priority: "normal" | "high";
    scorePercent: number | null;
    status: "awaiting_review" | "reviewed" | "revision_requested" | "completed";
    studentId: string;
    studentName: string;
    submittedLabel: string;
    wordCount: number;
  }[];
  teacherId: string;
}

export function mapTeacherClassSummaryApiResponse(input: {
  activityDays: readonly StudentActivityDayRecord[];
  activeAssignmentCount: number;
  classRecord: ClassRecord;
  completedAssignments: number;
  needsReview: number;
  rosterSize: number;
  skillRows: readonly StudentSkillProgressRecord[];
  totalAssigned: number;
}): TeacherClassSummaryApiResponse {
  const averageSkillScore =
    input.skillRows.length > 0
      ? Math.round(
          (input.skillRows.reduce((sum, row) => sum + row.currentScore, 0) / input.skillRows.length) * 10,
        ) / 10
      : 0;

  return {
    activeAssignmentCount: input.activeAssignmentCount,
    averageCompletionPercent:
      input.totalAssigned > 0 ? Math.round((input.completedAssignments / input.totalAssigned) * 100) : 0,
    averageSkillScore,
    gradeLevel: input.classRecord.gradeLevel,
    id: input.classRecord.id,
    name: input.classRecord.name,
    studentCount: input.rosterSize,
    submissionsNeedingReview: input.needsReview,
    weeklyWritingMinutes: input.activityDays.reduce((sum, day) => sum + day.minutesPracticed, 0),
  };
}

export function mapTeacherQueueItemApiResponse(record: SubmissionQueueRecord): TeacherQueueItemApiResponse {
  return {
    assignmentId: record.assignmentId,
    assignmentTitle: localizedCopy(record.assignmentTitleKey, record.assignmentTitleFallback),
    classId: record.classId,
    hasCanvas: record.hasCanvas,
    id: record.id,
    status: record.status,
    studentDisplayName: record.studentDisplayName,
    studentId: record.studentProfileId,
    submittedAt: record.submittedAt,
    wordCount: record.wordCount,
  };
}

export function mapTeacherDashboardApiResponse(input: {
  classes: readonly TeacherClassSummaryApiResponse[];
  generatedAt: string;
  queue: readonly SubmissionQueueRecord[];
  teacherId: string;
}): TeacherDashboardApiResponse {
  return {
    classes: [...input.classes],
    connectionStatus: "online",
    emptyState:
      input.classes.length > 0
        ? null
        : {
            body: localizedCopy("teachers.dashboard.emptyState.body", "Create a class to start assigning writing practice."),
            title: localizedCopy("teachers.dashboard.emptyState.title", "No classes yet"),
          },
    generatedAt: input.generatedAt,
    submissionsNeedingReview: input.queue.map((record) => mapTeacherQueueItemApiResponse(record)),
    teacherId: input.teacherId,
  };
}

export function mapTeacherClassesListApiResponse(classes: readonly TeacherClassSummaryApiResponse[]) {
  return {
    items: [...classes],
    nextCursor: null,
  };
}

export function mapTeacherClassProgressApiResponse(input: {
  activityDays: readonly StudentActivityDayRecord[];
  classRecord: ClassRecord;
  generatedAt: string;
  roster: readonly ClassRosterStudentRecord[];
  skillRows: readonly StudentSkillProgressRecord[];
  totalsRows: readonly StudentProgressTotalsRecord[];
  weekLabel: string;
}) {
  const students = input.roster.map((student) => {
    const totals =
      input.totalsRows.find((row) => row.studentProfileId === student.studentProfileId) ??
      emptyProgressTotals(student.studentProfileId);
    const skills = input.skillRows.filter((row) => row.studentProfileId === student.studentProfileId);
    const averageSkillScore =
      skills.length > 0
        ? Math.round((skills.reduce((sum, row) => sum + row.currentScore, 0) / skills.length) * 10) / 10
        : 0;

    return {
      assignmentsCompleted: totals.assignmentsCompleted,
      averageSkillScore,
      currentStreakDays: totals.currentStreakDays,
      displayName: student.displayName,
      gradeLevel: student.gradeLevel,
      studentId: student.studentProfileId,
      weeklyWritingMinutes: input.activityDays
        .filter((day) => day.studentProfileId === student.studentProfileId)
        .reduce((sum, day) => sum + day.minutesPracticed, 0),
    };
  });

  return {
    classId: input.classRecord.id,
    generatedAt: input.generatedAt,
    gradeLevel: input.classRecord.gradeLevel,
    name: input.classRecord.name,
    students,
    weekLabel: input.weekLabel,
  };
}

export function mapTeacherQueueApiResponse(records: readonly SubmissionQueueRecord[]): {
  items: TeacherQueueItemApiResponse[];
  nextCursor: string | null;
} {
  return {
    items: records.map((record) => mapTeacherQueueItemApiResponse(record)),
    nextCursor: null,
  };
}

export function mapTeacherDashboardToMobileViewModel(
  response: TeacherDashboardApiResponse,
): TeacherMobileDashboardViewModel {
  const classById = new Map(response.classes.map((classSummary) => [classSummary.id, classSummary]));

  return {
    assignments: [],
    classes: response.classes.map((classSummary) => ({
      ...classSummary,
      averageSkillScore: Math.round(classSummary.averageSkillScore),
      trendLabel: classSummary.averageCompletionPercent >= 70 ? "On track" : "Needs attention",
    })),
    connectionStatus: response.connectionStatus,
    generatedAt: response.generatedAt,
    safetyNote:
      "Teacher feedback should identify a strength, one improvement, and one next student revision task.",
    submissions: response.submissionsNeedingReview.map((item) => {
      const classSummary = classById.get(item.classId);

      return {
        assignmentId: item.assignmentId,
        assignmentTitle: item.assignmentTitle.fallback,
        classId: item.classId,
        className: classSummary?.name ?? "Class",
        gradeLevel: classSummary?.gradeLevel ?? 3,
        hasCanvas: item.hasCanvas,
        id: item.id,
        priority: item.status === "submitted" ? "high" : "normal",
        scorePercent: null,
        status: mapTeacherMobileSubmissionStatus(item.status),
        studentId: item.studentId,
        studentName: item.studentDisplayName,
        submittedLabel: item.submittedAt.slice(0, 10),
        wordCount: item.wordCount,
      };
    }),
    teacherId: response.teacherId,
  };
}

function mapTeacherMobileSubmissionStatus(
  status: SubmissionStatus,
): "awaiting_review" | "reviewed" | "revision_requested" | "completed" {
  switch (status) {
    case "completed":
      return "completed";
    case "feedback_ready":
      return "reviewed";
    case "revision_in_progress":
      return "revision_requested";
    case "reviewing":
    case "submitted":
      return "awaiting_review";
  }
}
