import type { AssignmentType, GradeLevel, WritingSkill } from "@WriterHabit/shared";

import { supabase } from "@/core/supabase/supabaseClient";
import {
  parentAssignmentReviewApiResponseSchema,
  parentDashboardApiResponseSchema,
  parentScenarioSchema,
  parentSettingsApiResponseSchema,
  parentStudentReportApiResponseSchema,
  type ParentAssignmentReview,
  type ParentAssignmentReviewApiResponse,
  type ParentAssignmentSummary,
  type ParentDashboardApiResponse,
  type ParentScenario,
  type ParentSettings,
  type ParentSettingsApiResponse,
  type ParentSkillProgress,
  type ParentStudentReportApiResponse,
  type ParentStudentSummary,
  type ParentWeeklyProgress,
} from "../types";

interface ParentRequestInput {
  parentId: string;
}

interface ParentDashboardInput extends ParentRequestInput {
  selectedStudentId?: string;
}

interface ParentStudentInput extends ParentRequestInput {
  studentId?: string;
}

interface ParentAssignmentReviewInput extends ParentRequestInput {
  submissionId?: string;
}

interface ParentSettingsInput extends ParentRequestInput {
  settings: ParentSettings;
}

const generatedAt = "2026-06-08T09:00:00.000Z";

type StudentProfileRow = {
  daily_goal_minutes: number | null;
  grade_level: number;
  id: string;
  user_id: string;
};

type ProgressTotalRow = {
  assignments_completed: number | null;
  current_streak_days: number | null;
  minutes_this_week: number | null;
  revisions_completed: number | null;
  rubric_improvement: number | string | null;
  weekly_minutes_goal: number | null;
};

type SkillProgressRow = {
  current_score: number | string | null;
  previous_score: number | string | null;
  skill: WritingSkill;
};

type AssignmentJoinRow = {
  assignment_type: AssignmentType;
  prompt_fallback: string;
  skill_focus: WritingSkill[] | null;
  title_fallback: string;
};

type StudentAssignmentRow = {
  assignments: AssignmentJoinRow | AssignmentJoinRow[] | null;
  completed_at: string | null;
  current_submission_id: string | null;
  id: string;
  status: string;
  submitted_at: string | null;
};

type SubmissionRow = {
  id: string;
  status: string;
  student_assignment_id: string;
  submitted_at: string;
  typed_text_excerpt: string;
  word_count: number | null;
};

type FeedbackRow = {
  id: string;
  improvement_fallback: string;
  next_revision_task_fallback: string;
  strength_fallback: string;
  submission_id: string;
};

type RubricCriterionJoinRow = {
  description_fallback: string;
  id: string;
  label_fallback: string;
  max_score: number;
};

type RubricScoreRow = {
  feedback_id: string;
  id: string;
  max_score: number;
  rubric_criteria: RubricCriterionJoinRow | RubricCriterionJoinRow[] | null;
  score: number;
};

type CanvasDocumentRow = {
  id: string;
  student_assignment_id: string | null;
  template: string;
  title: string;
};

type ParentSupabaseData = {
  assignmentRows: StudentAssignmentRow[];
  canvasRows: CanvasDocumentRow[];
  feedbackRows: FeedbackRow[];
  progressTotal: ProgressTotalRow | null;
  rubricRows: RubricScoreRow[];
  settings: ParentSettings;
  skillRows: SkillProgressRow[];
  student: ParentStudentSummary;
  submissionRows: SubmissionRow[];
};

type ParentSettingsRow = {
  ai_coach_access: ParentSettings["aiCoachAccess"];
  assignment_alerts_enabled: boolean;
  digest_frequency: ParentSettings["digestFrequency"];
  practice_reminder_enabled: boolean;
  quiet_hours_label: string;
  share_weekly_summary_with_teacher: boolean;
  weekly_report_email_enabled: boolean;
};

const parentStudents: ParentStudentSummary[] = [
  {
    avatarInitials: "EM",
    displayName: "Emma",
    gradeLevel: 4,
    id: "student-emma",
    relationshipLabel: "Daughter",
    schoolLabel: "Grade 4",
  },
  {
    avatarInitials: "MJ",
    displayName: "Miles",
    gradeLevel: 7,
    id: "student-miles",
    relationshipLabel: "Son",
    schoolLabel: "Grade 7",
  },
  {
    avatarInitials: "AR",
    displayName: "Ari",
    gradeLevel: 10,
    id: "student-ari",
    relationshipLabel: "Student",
    schoolLabel: "Grade 10",
  },
];

const defaultSettings: ParentSettings = {
  aiCoachAccess: "hints_and_revision",
  assignmentAlertsEnabled: true,
  digestFrequency: "weekly",
  practiceReminderEnabled: true,
  quietHoursLabel: "8:00 PM - 7:00 AM",
  shareWeeklySummaryWithTeacher: false,
  weeklyReportEmailEnabled: true,
};

function readScenario(): ParentScenario {
  const parsed = parentScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WriterHabit_PARENT_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function getConnectionStatus(scenario: ParentScenario): ParentDashboardApiResponse["connectionStatus"] {
  return scenario === "offline" ? "offline_cached" : "online";
}

function toGradeLevel(value: number): GradeLevel {
  return value >= 1 && value <= 12 ? (value as GradeLevel) : 7;
}

function toInteger(value: unknown, fallback = 0): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function getDisplayNameFromEmail(email?: string): string {
  const localPart = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();

  return localPart || "Dev Student";
}

function getInitials(displayName: string): string {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials.slice(0, 2) || "DS";
}

function getSubmittedLabel(value?: string | null): string {
  if (!value) {
    return "Saved";
  }

  const submitted = new Date(value);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - submitted.getTime()) / 86_400_000));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return submitted.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getSkillLabel(skill: WritingSkill): string {
  const labels: Record<WritingSkill, string> = {
    argument_strength: "Argument strength",
    clarity: "Clarity",
    creativity: "Creativity",
    evidence_usage: "Evidence",
    grammar: "Grammar",
    handwriting: "Handwriting",
    organization: "Organization",
    punctuation: "Punctuation",
    reading_response: "Reading response",
    revision_quality: "Revision",
    sentence_structure: "Sentences",
    spelling: "Spelling",
    vocabulary: "Vocabulary",
  };

  return labels[skill];
}

function getSkillNextPractice(skill: WritingSkill): string {
  const prompts: Record<WritingSkill, string> = {
    argument_strength: "Ask what claim the paragraph is proving.",
    clarity: "Ask for one specific example after the topic sentence.",
    creativity: "Ask which detail would surprise the reader.",
    evidence_usage: "Ask how the evidence connects back to the claim.",
    grammar: "Review one sentence for a grammar pattern.",
    handwriting: "Use the lined canvas for one short response.",
    organization: "Check that each detail supports the same main idea.",
    punctuation: "Read one sentence aloud and check the ending mark.",
    reading_response: "Keep evidence in the same order as the passage.",
    revision_quality: "Choose one sentence and revise it for clarity.",
    sentence_structure: "Combine two short ideas into one clearer sentence.",
    spelling: "Circle one word to check before submitting.",
    vocabulary: "Choose one stronger describing word.",
  };

  return prompts[skill];
}

function getPrimaryPracticeSkill(skillRows: SkillProgressRow[]): WritingSkill {
  return skillRows
    .slice()
    .sort((a, b) => toInteger(a.current_score) - toInteger(b.current_score))[0]?.skill ?? "clarity";
}

function toParentSkillProgress(row: SkillProgressRow): ParentSkillProgress {
  const currentScore = toInteger(row.current_score);
  const previousScore = toInteger(row.previous_score);
  const delta = currentScore - previousScore;

  return {
    currentScore,
    label: getSkillLabel(row.skill),
    nextPractice: getSkillNextPractice(row.skill),
    previousScore,
    skill: row.skill,
    trendDescription:
      delta > 0 ? `Up ${delta} points this week` : delta < 0 ? `Down ${Math.abs(delta)} points this week` : "Steady progress",
  };
}

function toParentStatus(status: string): ParentAssignmentSummary["status"] {
  if (status === "completed") {
    return "completed";
  }

  if (status === "revision_in_progress") {
    return "revision_in_progress";
  }

  return "feedback_ready";
}

function getFeedbackScorePercent(feedback: FeedbackRow | undefined, rubricRows: RubricScoreRow[]): number {
  const rows = rubricRows.filter((row) => row.feedback_id === feedback?.id);
  const earned = rows.reduce((total, row) => total + row.score, 0);
  const possible = rows.reduce((total, row) => total + row.max_score, 0);

  return possible > 0 ? Math.round((earned / possible) * 100) : 75;
}

function getAssignmentFromRow(row: StudentAssignmentRow): AssignmentJoinRow | null {
  if (Array.isArray(row.assignments)) {
    return row.assignments[0] ?? null;
  }

  return row.assignments;
}

function getRubricCriterionFromRow(row: RubricScoreRow): RubricCriterionJoinRow | null {
  if (Array.isArray(row.rubric_criteria)) {
    return row.rubric_criteria[0] ?? null;
  }

  return row.rubric_criteria;
}

function toParentSettings(row?: ParentSettingsRow | null): ParentSettings {
  if (!row) {
    return defaultSettings;
  }

  return {
    aiCoachAccess: row.ai_coach_access,
    assignmentAlertsEnabled: row.assignment_alerts_enabled,
    digestFrequency: row.digest_frequency,
    practiceReminderEnabled: row.practice_reminder_enabled,
    quietHoursLabel: row.quiet_hours_label,
    shareWeeklySummaryWithTeacher: row.share_weekly_summary_with_teacher,
    weeklyReportEmailEnabled: row.weekly_report_email_enabled,
  };
}

function toParentSettingsRow(userId: string, settings: ParentSettings): ParentSettingsRow & { parent_user_id: string } {
  return {
    ai_coach_access: settings.aiCoachAccess,
    assignment_alerts_enabled: settings.assignmentAlertsEnabled,
    digest_frequency: settings.digestFrequency,
    parent_user_id: userId,
    practice_reminder_enabled: settings.practiceReminderEnabled,
    quiet_hours_label: settings.quietHoursLabel,
    share_weekly_summary_with_teacher: settings.shareWeeklySummaryWithTeacher,
    weekly_report_email_enabled: settings.weeklyReportEmailEnabled,
  };
}

async function getSignedInParentUserId(parentId: string): Promise<string | null> {
  const { data: authData } = await supabase.auth.getSession();
  const userId = authData.session?.user.id;

  return userId && userId === parentId ? userId : null;
}

async function saveSignedInParentSettings(input: ParentSettingsInput): Promise<boolean> {
  const userId = await getSignedInParentUserId(input.parentId);

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("parent_settings")
    .upsert(toParentSettingsRow(userId, input.settings), { onConflict: "parent_user_id" });

  if (error) {
    throw error;
  }

  return true;
}

async function getSignedInParentSupabaseData(parentId: string): Promise<ParentSupabaseData | null> {
  const { data: authData } = await supabase.auth.getSession();
  const user = authData.session?.user;

  if (!user || user.id !== parentId) {
    return null;
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("student_profiles")
    .select("id,user_id,grade_level,daily_goal_minutes")
    .eq("user_id", user.id)
    .limit(1);

  if (profileError) {
    throw profileError;
  }

  const profile = ((profileRows ?? []) as StudentProfileRow[])[0];

  if (!profile) {
    return null;
  }

  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : getDisplayNameFromEmail(user.email);
  const gradeLevel = toGradeLevel(profile.grade_level);
  const student: ParentStudentSummary = {
    avatarInitials: getInitials(displayName),
    displayName,
    gradeLevel,
    id: profile.id,
    relationshipLabel: "Student",
    schoolLabel: `Grade ${gradeLevel}`,
  };

  const [
    progressResult,
    skillsResult,
    assignmentsResult,
    submissionsResult,
    feedbackResult,
    canvasResult,
    settingsResult,
  ] = await Promise.all([
    supabase
      .from("student_progress_totals")
      .select("assignments_completed,current_streak_days,minutes_this_week,revisions_completed,rubric_improvement,weekly_minutes_goal")
      .eq("student_profile_id", profile.id)
      .maybeSingle(),
    supabase
      .from("student_skill_progress")
      .select("skill,current_score,previous_score")
      .eq("student_profile_id", profile.id),
    supabase
      .from("student_assignments")
      .select("id,status,submitted_at,completed_at,current_submission_id,assignments(title_fallback,prompt_fallback,assignment_type,skill_focus)")
      .eq("student_profile_id", profile.id)
      .in("status", ["feedback_ready", "revision_in_progress", "completed"])
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("submissions")
      .select("id,student_assignment_id,status,typed_text_excerpt,word_count,submitted_at")
      .eq("student_profile_id", profile.id)
      .order("submitted_at", { ascending: false })
      .limit(8),
    supabase
      .from("feedback")
      .select("id,submission_id,strength_fallback,improvement_fallback,next_revision_task_fallback")
      .eq("student_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("canvas_documents")
      .select("id,student_assignment_id,title,template")
      .eq("student_profile_id", profile.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("parent_settings")
      .select("ai_coach_access,assignment_alerts_enabled,digest_frequency,practice_reminder_enabled,quiet_hours_label,share_weekly_summary_with_teacher,weekly_report_email_enabled")
      .eq("parent_user_id", user.id)
      .maybeSingle(),
  ]);

  if (progressResult.error) throw progressResult.error;
  if (skillsResult.error) throw skillsResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;
  if (submissionsResult.error) throw submissionsResult.error;
  if (feedbackResult.error) throw feedbackResult.error;
  if (canvasResult.error) throw canvasResult.error;
  if (settingsResult.error) throw settingsResult.error;

  const feedbackRows = (feedbackResult.data ?? []) as FeedbackRow[];
  const feedbackIds = feedbackRows.map((row) => row.id);
  let rubricRows: RubricScoreRow[] = [];

  if (feedbackIds.length > 0) {
    const { data: rubricData, error: rubricError } = await supabase
      .from("feedback_rubric_scores")
      .select("id,feedback_id,score,max_score,rubric_criteria(id,label_fallback,description_fallback,max_score)")
      .in("feedback_id", feedbackIds);

    if (rubricError) {
      throw rubricError;
    }

    rubricRows = (rubricData ?? []) as RubricScoreRow[];
  }

  return {
    assignmentRows: (assignmentsResult.data ?? []) as StudentAssignmentRow[],
    canvasRows: (canvasResult.data ?? []) as CanvasDocumentRow[],
    feedbackRows,
    progressTotal: (progressResult.data as ProgressTotalRow | null) ?? null,
    rubricRows,
    settings: toParentSettings((settingsResult.data as ParentSettingsRow | null) ?? null),
    skillRows: (skillsResult.data ?? []) as SkillProgressRow[],
    student,
    submissionRows: (submissionsResult.data ?? []) as SubmissionRow[],
  };
}

function buildSupabaseAssignmentSummaries(data: ParentSupabaseData): ParentAssignmentSummary[] {
  return data.assignmentRows.flatMap((studentAssignment) => {
    const assignment = getAssignmentFromRow(studentAssignment);
    const submission =
      data.submissionRows.find((row) => row.id === studentAssignment.current_submission_id) ??
      data.submissionRows.find((row) => row.student_assignment_id === studentAssignment.id);

    if (!assignment || !submission) {
      return [];
    }

    const feedback = data.feedbackRows.find((row) => row.submission_id === submission.id);

    return [
      {
        assignmentType: assignment.assignment_type,
        feedbackSummary: feedback?.improvement_fallback ?? "Feedback is ready for one focused revision.",
        hasCanvas: data.canvasRows.some((row) => row.student_assignment_id === studentAssignment.id),
        scorePercent: getFeedbackScorePercent(feedback, data.rubricRows),
        skillFocus: assignment.skill_focus && assignment.skill_focus.length > 0 ? assignment.skill_focus : ["clarity"],
        status: toParentStatus(studentAssignment.status),
        studentId: data.student.id,
        submissionId: submission.id,
        submittedLabel: getSubmittedLabel(submission.submitted_at),
        title: assignment.title_fallback,
      },
    ];
  });
}

function buildSupabaseWeeklyProgress(data: ParentSupabaseData): ParentWeeklyProgress {
  const focusSkill = getPrimaryPracticeSkill(data.skillRows);
  const progress = data.progressTotal;
  const assignments = buildSupabaseAssignmentSummaries(data);

  return {
    areaToPractice: focusSkill,
    areaToPracticeDescription: getSkillNextPractice(focusSkill),
    areaToPracticeLabel: getSkillLabel(focusSkill),
    assignedAssignments: Math.max(assignments.length, toInteger(progress?.assignments_completed)),
    celebration: "Your student has current WriterHabit practice and feedback saved in Supabase.",
    completedAssignments: toInteger(progress?.assignments_completed),
    minutesCompleted: toInteger(progress?.minutes_this_week),
    minutesGoal: Math.max(1, toInteger(progress?.weekly_minutes_goal, data.student.gradeLevel <= 5 ? 50 : 75)),
    sessionsCompleted: Math.max(assignments.length, toInteger(progress?.revisions_completed)),
    skillImprovementPercent: toInteger(progress?.rubric_improvement),
    streakDays: toInteger(progress?.current_streak_days),
    weekLabel: "Current week",
  };
}

function buildSupabaseDashboard(
  input: ParentDashboardInput,
  scenario: ParentScenario,
  data: ParentSupabaseData,
): ParentDashboardApiResponse {
  const assignments = buildSupabaseAssignmentSummaries(data);

  return parentDashboardApiResponseSchema.parse({
    assignments,
    connectionStatus: getConnectionStatus(scenario),
    generatedAt: new Date().toISOString(),
    parentId: input.parentId,
    selectedStudentId: data.student.id,
    settingsSummary: data.settings,
    skillProgress: data.skillRows.map(toParentSkillProgress),
    students: [data.student],
    weeklyProgress: buildSupabaseWeeklyProgress(data),
  });
}

function buildSupabaseReport(
  scenario: ParentScenario,
  data: ParentSupabaseData,
): ParentStudentReportApiResponse {
  const weeklyProgress = buildSupabaseWeeklyProgress(data);
  const skillProgress = data.skillRows.map(toParentSkillProgress);
  const topSkill = skillProgress[0];

  return parentStudentReportApiResponseSchema.parse({
    assignments: buildSupabaseAssignmentSummaries(data),
    connectionStatus: getConnectionStatus(scenario),
    familyNote: "This report is built from the logged-in dev user's Supabase writing data.",
    generatedAt: new Date().toISOString(),
    nextSteps: [
      weeklyProgress.areaToPracticeDescription,
      "Open the latest feedback and ask about the next student-owned revision task.",
    ],
    practiceFocus: [weeklyProgress.areaToPracticeLabel, weeklyProgress.areaToPracticeDescription],
    skillProgress,
    strengths: [
      topSkill ? `${topSkill.label} is currently at ${topSkill.currentScore}%.` : "Writing practice is being tracked.",
      "Feedback and revisions are connected to saved submissions.",
    ],
    student: data.student,
    weeklyProgress,
  });
}

function buildSupabaseReview(
  scenario: ParentScenario,
  data: ParentSupabaseData,
  submissionId?: string,
): ParentAssignmentReviewApiResponse {
  const submission =
    data.submissionRows.find((row) => row.id === submissionId) ??
    data.submissionRows.find((row) => data.feedbackRows.some((feedback) => feedback.submission_id === row.id));

  if (!submission) {
    return parentAssignmentReviewApiResponseSchema.parse({
      connectionStatus: getConnectionStatus(scenario),
      generatedAt: new Date().toISOString(),
      review: null,
    });
  }

  const studentAssignment = data.assignmentRows.find((row) => row.id === submission.student_assignment_id);
  const assignment = studentAssignment ? getAssignmentFromRow(studentAssignment) : null;
  const feedback = data.feedbackRows.find((row) => row.submission_id === submission.id);
  const rubricRows = data.rubricRows.filter((row) => row.feedback_id === feedback?.id);
  const canvas = data.canvasRows.find((row) => row.student_assignment_id === studentAssignment?.id);

  return parentAssignmentReviewApiResponseSchema.parse({
    connectionStatus: getConnectionStatus(scenario),
    generatedAt: new Date().toISOString(),
    review: {
      aiFeedback: {
        improvement: feedback?.improvement_fallback ?? "Choose one sentence to make more specific.",
        revisionTask: feedback?.next_revision_task_fallback ?? "Revise one sentence using your own words.",
        strength: feedback?.strength_fallback ?? "The response has a clear starting point.",
      },
      assignmentPrompt: assignment?.prompt_fallback ?? "Review the saved student response.",
      assignmentTitle: assignment?.title_fallback ?? "WriterHabit assignment",
      canvasPreview: canvas
        ? {
            canvasId: canvas.id,
            strokeCount: 0,
            templateLabel: canvas.template.replace(/_/g, " "),
            title: canvas.title,
          }
        : null,
      gradeLevel: data.student.gradeLevel,
      parentGuidance: [
        "Ask what the student was trying to improve.",
        "Look for one revision that keeps the student's own wording.",
      ],
      rubric:
        rubricRows.length > 0
          ? rubricRows.map((row) => ({
              description: getRubricCriterionFromRow(row)?.description_fallback ?? "Writing skill",
              id: getRubricCriterionFromRow(row)?.id ?? row.id,
              label: getRubricCriterionFromRow(row)?.label_fallback ?? "Writing",
              maxScore: row.max_score,
              score: row.score,
            }))
          : [
              {
                description: "The response has one clear idea to revise.",
                id: "revision-focus",
                label: "Revision focus",
                maxScore: 4,
                score: 3,
              },
            ],
      safetyNote: "WriterHabit gives hints and revision tasks, not finished student work.",
      studentId: data.student.id,
      studentName: data.student.displayName,
      submittedLabel: getSubmittedLabel(submission.submitted_at),
      submissionId: submission.id,
      wordCount: toInteger(submission.word_count),
      writingPreview: submission.typed_text_excerpt || feedback?.strength_fallback || "Student writing preview unavailable.",
    },
  });
}

function getSelectedStudent(studentId?: string): ParentStudentSummary {
  return parentStudents.find((student) => student.id === studentId) ?? parentStudents[0];
}

function buildWeeklyProgress(student: ParentStudentSummary): ParentWeeklyProgress {
  if (student.gradeLevel <= 5) {
    return {
      areaToPractice: "vocabulary",
      areaToPracticeDescription: "Emma is ready to add more describing words to her sentences.",
      areaToPracticeLabel: "Word choice",
      assignedAssignments: 4,
      celebration: "Emma finished three short writing practices and used feedback to add details.",
      completedAssignments: 3,
      minutesCompleted: 34,
      minutesGoal: 50,
      sessionsCompleted: 4,
      skillImprovementPercent: 8,
      streakDays: 5,
      weekLabel: "Jun 2-8",
    };
  }

  if (student.gradeLevel <= 8) {
    return {
      areaToPractice: "organization",
      areaToPracticeDescription: "Miles should keep practicing topic sentences and supporting details.",
      areaToPracticeLabel: "Paragraph organization",
      assignedAssignments: 5,
      celebration: "Miles revised two paragraphs and improved clarity after feedback.",
      completedAssignments: 4,
      minutesCompleted: 68,
      minutesGoal: 75,
      sessionsCompleted: 5,
      skillImprovementPercent: 11,
      streakDays: 6,
      weekLabel: "Jun 2-8",
    };
  }

  return {
    areaToPractice: "evidence_usage",
    areaToPracticeDescription: "Ari should connect evidence back to the claim with more analysis.",
    areaToPracticeLabel: "Evidence analysis",
    assignedAssignments: 4,
    celebration: "Ari completed a revision pass and strengthened thesis focus.",
    completedAssignments: 3,
    minutesCompleted: 112,
    minutesGoal: 125,
    sessionsCompleted: 4,
    skillImprovementPercent: 7,
    streakDays: 4,
    weekLabel: "Jun 2-8",
  };
}

function buildSkillProgress(student: ParentStudentSummary): ParentSkillProgress[] {
  if (student.gradeLevel <= 5) {
    return [
      {
        currentScore: 72,
        label: "Sentences",
        nextPractice: "Read one sentence out loud and add one detail.",
        previousScore: 64,
        skill: "sentence_structure",
        trendDescription: "Up 8 points this week",
      },
      {
        currentScore: 61,
        label: "Word choice",
        nextPractice: "Choose one stronger describing word.",
        previousScore: 56,
        skill: "vocabulary",
        trendDescription: "Up 5 points this week",
      },
      {
        currentScore: 67,
        label: "Handwriting",
        nextPractice: "Use the lined canvas for one short response.",
        previousScore: 65,
        skill: "handwriting",
        trendDescription: "Steady progress",
      },
    ];
  }

  if (student.gradeLevel <= 8) {
    return [
      {
        currentScore: 76,
        label: "Clarity",
        nextPractice: "Add one specific example after the topic sentence.",
        previousScore: 69,
        skill: "clarity",
        trendDescription: "Up 7 points this week",
      },
      {
        currentScore: 70,
        label: "Organization",
        nextPractice: "Check that each detail supports the same main idea.",
        previousScore: 64,
        skill: "organization",
        trendDescription: "Up 6 points this week",
      },
      {
        currentScore: 66,
        label: "Revision",
        nextPractice: "Revise one sentence for a clearer reason.",
        previousScore: 59,
        skill: "revision_quality",
        trendDescription: "Up 7 points this week",
      },
      {
        currentScore: 63,
        label: "Grammar",
        nextPractice: "Check commas after introductory phrases.",
        previousScore: 61,
        skill: "grammar",
        trendDescription: "Steady progress",
      },
    ];
  }

  return [
    {
      currentScore: 78,
      label: "Thesis",
      nextPractice: "Make the claim arguable before drafting evidence.",
      previousScore: 73,
      skill: "argument_strength",
      trendDescription: "Up 5 points this week",
    },
    {
      currentScore: 72,
      label: "Evidence",
      nextPractice: "Add analysis after each evidence sentence.",
      previousScore: 65,
      skill: "evidence_usage",
      trendDescription: "Up 7 points this week",
    },
    {
      currentScore: 68,
      label: "Organization",
      nextPractice: "Use a transition before the counterpoint.",
      previousScore: 64,
      skill: "organization",
      trendDescription: "Up 4 points this week",
    },
    {
      currentScore: 65,
      label: "Revision",
      nextPractice: "Run one revision pass for sentence variety.",
      previousScore: 60,
      skill: "revision_quality",
      trendDescription: "Up 5 points this week",
    },
    {
      currentScore: 74,
      label: "Clarity",
      nextPractice: "Trim one sentence that repeats an idea.",
      previousScore: 72,
      skill: "clarity",
      trendDescription: "Steady progress",
    },
  ];
}

function buildAssignmentSummaries(student: ParentStudentSummary): ParentAssignmentSummary[] {
  if (student.gradeLevel <= 5) {
    return [
      {
        assignmentType: "sentence_practice",
        feedbackSummary: "Strong beginning; next step is adding one more detail.",
        hasCanvas: true,
        scorePercent: 78,
        skillFocus: ["sentence_structure", "vocabulary"],
        status: "feedback_ready",
        studentId: student.id,
        submissionId: "submission-emma-park",
        submittedLabel: "Yesterday",
        title: "Park sentences",
      },
      {
        assignmentType: "handwriting_practice",
        feedbackSummary: "Letters are easier to read; keep spacing between words.",
        hasCanvas: true,
        scorePercent: 74,
        skillFocus: ["handwriting", "punctuation"],
        status: "completed",
        studentId: student.id,
        submissionId: "submission-emma-handwriting",
        submittedLabel: "Fri",
        title: "Lined handwriting practice",
      },
    ];
  }

  if (student.gradeLevel <= 8) {
    return [
      {
        assignmentType: "paragraph_writing",
        feedbackSummary: "Clear opinion; next revision should add a more specific example.",
        hasCanvas: false,
        scorePercent: 82,
        skillFocus: ["clarity", "organization", "revision_quality"],
        status: "revision_in_progress",
        studentId: student.id,
        submissionId: "submission-miles-practice",
        submittedLabel: "Today",
        title: "Practice and talent paragraph",
      },
      {
        assignmentType: "reading_response",
        feedbackSummary: "Good summary; keep evidence in the same order as the passage.",
        hasCanvas: true,
        scorePercent: 79,
        skillFocus: ["reading_response", "organization"],
        status: "completed",
        studentId: student.id,
        submissionId: "submission-miles-response",
        submittedLabel: "Mon",
        title: "Reading response notes",
      },
      {
        assignmentType: "grammar_practice",
        feedbackSummary: "Comma choices improved after revision.",
        hasCanvas: false,
        scorePercent: 76,
        skillFocus: ["grammar", "punctuation"],
        status: "feedback_ready",
        studentId: student.id,
        submissionId: "submission-miles-commas",
        submittedLabel: "Fri",
        title: "Comma practice",
      },
    ];
  }

  return [
    {
      assignmentType: "essay_writing",
      feedbackSummary: "Focused thesis; evidence needs one more analysis sentence.",
      hasCanvas: false,
      scorePercent: 84,
      skillFocus: ["argument_strength", "evidence_usage", "organization"],
      status: "revision_in_progress",
      studentId: student.id,
      submissionId: "submission-ari-technology",
      submittedLabel: "Today",
      title: "Technology and learning paragraph",
    },
    {
      assignmentType: "test_prep",
      feedbackSummary: "Claim is clear; counterpoint transition is the next focus.",
      hasCanvas: false,
      scorePercent: 81,
      skillFocus: ["argument_strength", "clarity"],
      status: "feedback_ready",
      studentId: student.id,
      submissionId: "submission-ari-counterpoint",
      submittedLabel: "Tue",
      title: "Argument counterpoint",
    },
    {
      assignmentType: "essay_writing",
      feedbackSummary: "Outline shows a logical evidence order.",
      hasCanvas: true,
      scorePercent: 80,
      skillFocus: ["organization", "evidence_usage"],
      status: "completed",
      studentId: student.id,
      submissionId: "submission-ari-outline",
      submittedLabel: "Fri",
      title: "Evidence outline",
    },
  ];
}

function buildAssignmentReview(student: ParentStudentSummary, submissionId: string): ParentAssignmentReview {
  if (student.gradeLevel <= 5) {
    return {
      aiFeedback: {
        improvement: "Add one more describing word so the reader can picture the park.",
        revisionTask: "Choose your favorite sentence and add one detail.",
        strength: "Emma wrote clear complete sentences.",
      },
      assignmentPrompt: "Write three sentences about a place you know. Add one describing word to each sentence.",
      assignmentTitle: "Park sentences",
      canvasPreview: {
        canvasId: "canvas-emma-park",
        strokeCount: 42,
        templateLabel: "Lined handwriting",
        title: "Sentence sketch",
      },
      gradeLevel: student.gradeLevel,
      parentGuidance: [
        "Ask Emma to read one sentence out loud.",
        "Celebrate the sentence that already has the clearest detail.",
      ],
      rubric: [
        {
          description: "The response uses complete sentences.",
          id: "complete-sentences",
          label: "Complete sentences",
          maxScore: 4,
          score: 3,
        },
        {
          description: "The response includes describing words.",
          id: "describing-words",
          label: "Describing words",
          maxScore: 4,
          score: 3,
        },
        {
          description: "The response uses capitals and punctuation.",
          id: "mechanics",
          label: "Capitals and punctuation",
          maxScore: 4,
          score: 3,
        },
      ],
      safetyNote: "WriterHabit gives hints and revision tasks, not finished student work.",
      studentId: student.id,
      studentName: student.displayName,
      submittedLabel: "Yesterday",
      submissionId,
      wordCount: 36,
      writingPreview: "The park is bright. I see a tall slide. My dog runs fast by the swings.",
    };
  }

  if (student.gradeLevel <= 8) {
    return {
      aiFeedback: {
        improvement: "The paragraph needs a more specific example after the topic sentence.",
        revisionTask: "Add one example that proves why practice helps people improve.",
        strength: "Miles has a clear opinion and keeps the paragraph focused.",
      },
      assignmentPrompt: "Write a paragraph explaining whether practice or talent matters more when learning a skill.",
      assignmentTitle: "Practice and talent paragraph",
      canvasPreview: null,
      gradeLevel: student.gradeLevel,
      parentGuidance: [
        "Ask Miles what example best supports the opinion.",
        "Look for one revision that makes the reason more specific.",
      ],
      rubric: [
        {
          description: "The topic sentence gives a clear opinion.",
          id: "topic-sentence",
          label: "Topic sentence",
          maxScore: 4,
          score: 4,
        },
        {
          description: "Details explain the opinion with examples.",
          id: "supporting-details",
          label: "Supporting details",
          maxScore: 4,
          score: 3,
        },
        {
          description: "Revision improves clarity and flow.",
          id: "revision-quality",
          label: "Revision quality",
          maxScore: 4,
          score: 3,
        },
      ],
      safetyNote: "WriterHabit keeps feedback focused on coaching and student-owned revision.",
      studentId: student.id,
      studentName: student.displayName,
      submittedLabel: "Today",
      submissionId,
      wordCount: 142,
      writingPreview:
        "Practice matters more because people can improve when they repeat a skill and get feedback. Talent helps at first, but practice makes the skill stronger over time.",
    };
  }

  return {
    aiFeedback: {
      improvement: "The evidence needs one more analysis sentence that connects back to the thesis.",
      revisionTask: "After the evidence sentence, explain why that evidence proves the claim.",
      strength: "Ari's claim is focused and arguable.",
    },
    assignmentPrompt:
      "Draft a thesis and one evidence-based body paragraph about how technology affects learning.",
    assignmentTitle: "Technology and learning paragraph",
    canvasPreview: {
      canvasId: "canvas-ari-outline",
      strokeCount: 31,
      templateLabel: "Essay outline",
      title: "Evidence outline",
    },
    gradeLevel: student.gradeLevel,
    parentGuidance: [
      "Ask Ari to point to the claim and the evidence sentence.",
      "Check whether the next sentence explains why the evidence matters.",
    ],
    rubric: [
      {
        description: "The thesis states a focused, arguable claim.",
        id: "thesis",
        label: "Thesis",
        maxScore: 4,
        score: 4,
      },
      {
        description: "Evidence is relevant and introduced clearly.",
        id: "evidence",
        label: "Evidence",
        maxScore: 4,
        score: 3,
      },
      {
        description: "Analysis explains how evidence supports the claim.",
        id: "analysis",
        label: "Analysis",
        maxScore: 4,
        score: 3,
      },
      {
        description: "Paragraph order and transitions are easy to follow.",
        id: "organization",
        label: "Organization",
        maxScore: 4,
        score: 3,
      },
    ],
    safetyNote: "WriterHabit does not generate final drafts; it gives coaching signals and revision tasks.",
    studentId: student.id,
    studentName: student.displayName,
    submittedLabel: "Today",
    submissionId,
    wordCount: 218,
    writingPreview:
      "Technology affects learning most when it gives students faster feedback. For example, writing tools can show patterns in revision and help students notice unclear sentences.",
  };
}

function buildDashboard(input: ParentDashboardInput, scenario: ParentScenario): ParentDashboardApiResponse {
  if (scenario === "empty") {
    return parentDashboardApiResponseSchema.parse({
      assignments: [],
      connectionStatus: "online",
      generatedAt,
      parentId: input.parentId,
      selectedStudentId: null,
      settingsSummary: defaultSettings,
      skillProgress: [],
      students: [],
      weeklyProgress: null,
    });
  }

  const selectedStudent = getSelectedStudent(input.selectedStudentId);

  return parentDashboardApiResponseSchema.parse({
    assignments: buildAssignmentSummaries(selectedStudent),
    connectionStatus: getConnectionStatus(scenario),
    generatedAt,
    parentId: input.parentId,
    selectedStudentId: selectedStudent.id,
    settingsSummary: defaultSettings,
    skillProgress: buildSkillProgress(selectedStudent),
    students: parentStudents,
    weeklyProgress: buildWeeklyProgress(selectedStudent),
  });
}

function buildReport(input: ParentStudentInput, scenario: ParentScenario): ParentStudentReportApiResponse {
  if (scenario === "empty") {
    return parentStudentReportApiResponseSchema.parse({
      assignments: [],
      connectionStatus: "online",
      familyNote: null,
      generatedAt,
      nextSteps: [],
      practiceFocus: [],
      skillProgress: [],
      strengths: [],
      student: null,
      weeklyProgress: null,
    });
  }

  const student = getSelectedStudent(input.studentId);
  const weeklyProgress = buildWeeklyProgress(student);

  return parentStudentReportApiResponseSchema.parse({
    assignments: buildAssignmentSummaries(student),
    connectionStatus: getConnectionStatus(scenario),
    familyNote:
      student.gradeLevel <= 5
        ? "Short read-aloud practice will help Emma notice where to add details."
        : student.gradeLevel <= 8
          ? "Miles responds well when feedback is framed as one focused revision task."
          : "Ari is ready for more targeted evidence analysis practice.",
    generatedAt,
    nextSteps:
      student.gradeLevel <= 5
        ? ["Read one sentence together.", "Ask what detail could help the reader picture it."]
        : student.gradeLevel <= 8
          ? ["Choose one paragraph.", "Ask which example best supports the topic sentence."]
          : ["Review the thesis and evidence sentence.", "Ask how the evidence proves the claim."],
    practiceFocus: [weeklyProgress.areaToPracticeLabel, weeklyProgress.areaToPracticeDescription],
    skillProgress: buildSkillProgress(student),
    strengths:
      student.gradeLevel <= 5
        ? ["Completes short practices", "Uses feedback to add details"]
        : student.gradeLevel <= 8
          ? ["Revises after feedback", "Keeps paragraph focus"]
          : ["Builds focused claims", "Uses revision feedback productively"],
    student,
    weeklyProgress,
  });
}

function findStudentForSubmission(submissionId?: string): ParentStudentSummary {
  if (!submissionId) {
    return parentStudents[1];
  }

  return parentStudents.find((student) => submissionId.includes(student.displayName.toLowerCase())) ?? parentStudents[1];
}

function buildReview(input: ParentAssignmentReviewInput, scenario: ParentScenario): ParentAssignmentReviewApiResponse {
  if (scenario === "empty" || !input.submissionId) {
    return parentAssignmentReviewApiResponseSchema.parse({
      connectionStatus: "online",
      generatedAt,
      review: null,
    });
  }

  const student = findStudentForSubmission(input.submissionId);

  return parentAssignmentReviewApiResponseSchema.parse({
    connectionStatus: getConnectionStatus(scenario),
    generatedAt,
    review: buildAssignmentReview(student, input.submissionId),
  });
}

export const parentApi = {
  async getAssignmentReview(input: ParentAssignmentReviewInput): Promise<ParentAssignmentReviewApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Parent assignment review mock error");
    }

    const supabaseData = scenario === "empty" ? null : await getSignedInParentSupabaseData(input.parentId);

    if (supabaseData) {
      return buildSupabaseReview(scenario, supabaseData, input.submissionId);
    }

    return buildReview(input, scenario);
  },

  async getDashboard(input: ParentDashboardInput): Promise<ParentDashboardApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Parent dashboard mock error");
    }

    const supabaseData = scenario === "empty" ? null : await getSignedInParentSupabaseData(input.parentId);

    if (supabaseData) {
      return buildSupabaseDashboard(input, scenario, supabaseData);
    }

    return buildDashboard(input, scenario);
  },

  async getSettings(input: ParentRequestInput): Promise<ParentSettingsApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Parent settings mock error");
    }

    const supabaseData = scenario === "empty" ? null : await getSignedInParentSupabaseData(input.parentId);
    const linkedStudents = supabaseData ? [supabaseData.student] : scenario === "empty" ? [] : parentStudents;

    return parentSettingsApiResponseSchema.parse({
      connectionStatus: getConnectionStatus(scenario),
      generatedAt: supabaseData ? new Date().toISOString() : generatedAt,
      linkedStudents,
      parentId: input.parentId,
      settings: supabaseData?.settings ?? defaultSettings,
    });
  },

  async getStudentReport(input: ParentStudentInput): Promise<ParentStudentReportApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Parent student report mock error");
    }

    const supabaseData = scenario === "empty" ? null : await getSignedInParentSupabaseData(input.parentId);

    if (supabaseData) {
      return buildSupabaseReport(scenario, supabaseData);
    }

    return buildReport(input, scenario);
  },

  async updateSettings(input: ParentSettingsInput): Promise<ParentSettingsApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Parent settings update mock error");
    }

    const didSave = scenario === "empty" ? false : await saveSignedInParentSettings(input);
    const supabaseData = scenario === "empty" ? null : await getSignedInParentSupabaseData(input.parentId);
    const linkedStudents = supabaseData ? [supabaseData.student] : scenario === "empty" ? [] : parentStudents;

    return parentSettingsApiResponseSchema.parse({
      connectionStatus: getConnectionStatus(scenario),
      generatedAt: didSave || supabaseData ? new Date().toISOString() : generatedAt,
      linkedStudents,
      parentId: input.parentId,
      settings: didSave ? input.settings : supabaseData?.settings ?? input.settings,
    });
  },
};
