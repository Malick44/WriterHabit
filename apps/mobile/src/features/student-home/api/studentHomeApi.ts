import type { GradeLevel, WritingSkill } from "@writewise/shared";

import { supabase } from "@/core/supabase/supabaseClient";
import {
  studentHomeApiResponseSchema,
  studentHomeScenarioSchema,
  type StudentHomeApiResponse,
  type StudentHomeScenario,
} from "../types";

interface GetStudentHomeDashboardInput {
  gradeLevel?: GradeLevel;
  studentId: string;
}

function readScenario(): StudentHomeScenario {
  const parsed = studentHomeScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WRITEWISE_STUDENT_HOME_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function getGradeLevel(input: GetStudentHomeDashboardInput): GradeLevel {
  return input.gradeLevel ?? 7;
}

function createAssignmentForGrade(gradeLevel: GradeLevel): StudentHomeApiResponse["todayAssignment"] {
  if (gradeLevel <= 5) {
    return {
      assignmentType: "sentence_practice",
      coachSuggestion: "Start with your own sentence, then ask for a hint if you get stuck.",
      dueLabel: "Today",
      estimatedMinutes: 10,
      gradeLevelMax: 5,
      gradeLevelMin: 1,
      id: "00000000-0000-0000-0000-000000000001",
      prompt: "Write three sentences about a place you know. Add one describing word to each sentence.",
      rubricFocus: ["Clear sentence", "Describing word", "Capital letters"],
      skillFocus: ["sentence_structure", "vocabulary"],
      status: "not_started",
      title: "Add details to sentences",
    };
  }

  if (gradeLevel <= 8) {
    return {
      assignmentType: "paragraph_writing",
      coachSuggestion: "Build your topic sentence first, then add two details in your own words.",
      dueLabel: "Today",
      estimatedMinutes: 15,
      gradeLevelMax: 8,
      gradeLevelMin: 6,
      id: "00000000-0000-0000-0000-000000000002",
      prompt: "Write a paragraph explaining whether practice or talent matters more when learning a skill.",
      rubricFocus: ["Topic sentence", "Supporting detail", "Revision quality"],
      skillFocus: ["organization", "clarity", "revision_quality"],
      status: "in_progress",
      title: "Support a paragraph idea",
    };
  }

  return {
    assignmentType: "essay_writing",
    coachSuggestion: "Use the coach for questions about structure, evidence, or revision choices.",
    dueLabel: "Today",
    estimatedMinutes: 25,
    gradeLevelMax: 12,
    gradeLevelMin: 9,
    id: "00000000-0000-0000-0000-000000000003",
    prompt: "Draft a thesis and one evidence-based body paragraph about how technology affects learning.",
    rubricFocus: ["Thesis", "Evidence usage", "Analysis", "Revision quality"],
    skillFocus: ["argument_strength", "evidence_usage", "organization", "revision_quality"],
    status: "in_progress",
    title: "Strengthen a thesis and evidence",
  };
}

function createDraftForGrade(gradeLevel: GradeLevel): StudentHomeApiResponse["continueDraft"] {
  if (gradeLevel <= 5) {
    return {
      assignmentId: "00000000-0000-0000-0000-000000000001",
      lastEditedLabel: "Saved 12 minutes ago",
      preview: "The park is bright. I see a tall slide...",
      revisionNumber: 0,
      title: "My park sentences",
      wordCount: 22,
    };
  }

  if (gradeLevel <= 8) {
    return {
      assignmentId: "00000000-0000-0000-0000-000000000002",
      lastEditedLabel: "Saved 18 minutes ago",
      preview: "Practice matters more because people can improve with feedback...",
      revisionNumber: 1,
      title: "Practice and talent paragraph",
      wordCount: 96,
    };
  }

  return {
    assignmentId: "00000000-0000-0000-0000-000000000003",
    lastEditedLabel: "Saved 25 minutes ago",
    preview: "Technology affects learning most when it gives students faster feedback...",
    revisionNumber: 2,
    title: "Technology and learning paragraph",
    wordCount: 184,
  };
}

function createDashboard(input: GetStudentHomeDashboardInput, scenario: StudentHomeScenario): StudentHomeApiResponse {
  const gradeLevel = getGradeLevel(input);
  const isEmpty = scenario === "empty";
  const practicedToday = scenario === "practice_complete";
  const response: StudentHomeApiResponse = {
    connectionStatus: scenario === "offline" ? "offline_cached" : "online",
    continueDraft: isEmpty ? null : createDraftForGrade(gradeLevel),
    dailyPractice: {
      completedToday: practicedToday,
      minutesGoal: gradeLevel <= 5 ? 10 : gradeLevel <= 8 ? 15 : 25,
      nextPromptLabel: gradeLevel <= 5 ? "Sentence warmup" : gradeLevel <= 8 ? "Paragraph practice" : "Essay focus block",
    },
    generatedAt: new Date().toISOString(),
    gradeLevel,
    recentFeedback: isEmpty
      ? []
      : [
          {
            createdLabel: "Yesterday",
            improvement:
              gradeLevel <= 5
                ? "Add one more detail so the reader can picture it."
                : gradeLevel <= 8
                  ? "Use a clearer example after your topic sentence."
                  : "Connect the evidence back to the claim with one analysis sentence.",
            revisionTask:
              gradeLevel <= 5
                ? "Add one describing word to your favorite sentence."
                : gradeLevel <= 8
                  ? "Revise one sentence so the reason is more specific."
                  : "Revise the last sentence to explain why the evidence matters.",
            skill: gradeLevel <= 5 ? "vocabulary" : gradeLevel <= 8 ? "clarity" : "evidence_usage",
            strength:
              gradeLevel <= 5
                ? "You used a clear beginning."
                : gradeLevel <= 8
                  ? "Your paragraph has a clear opinion."
                  : "Your claim is focused and arguable.",
            submissionId: "feedback-latest",
            title: gradeLevel <= 5 ? "Story detail feedback" : gradeLevel <= 8 ? "Paragraph feedback" : "Argument feedback",
          },
        ],
    revisionNudges: isEmpty
      ? []
      : [
          gradeLevel <= 5
            ? "Try rereading one sentence out loud before you submit."
            : gradeLevel <= 8
              ? "Check that each detail supports the topic sentence."
              : "Make sure every evidence sentence is followed by your own analysis.",
        ],
    skillProgress: isEmpty
      ? []
      : gradeLevel <= 5
        ? [
            { currentScore: 68, label: "Sentences", previousScore: 61, skill: "sentence_structure" },
            { currentScore: 58, label: "Word choice", previousScore: 54, skill: "vocabulary" },
          ]
        : gradeLevel <= 8
          ? [
              { currentScore: 72, label: "Organization", previousScore: 66, skill: "organization" },
              { currentScore: 64, label: "Clarity", previousScore: 60, skill: "clarity" },
              { currentScore: 59, label: "Revision", previousScore: 52, skill: "revision_quality" },
            ]
          : [
              { currentScore: 76, label: "Evidence", previousScore: 70, skill: "evidence_usage" },
              { currentScore: 69, label: "Argument", previousScore: 64, skill: "argument_strength" },
              { currentScore: 62, label: "Revision", previousScore: 57, skill: "revision_quality" },
            ],
    streak: {
      bestDays: isEmpty ? 0 : 9,
      currentDays: isEmpty ? 0 : 4,
      nextMilestoneDays: gradeLevel <= 5 ? 5 : 7,
      practicedToday,
    },
    studentId: input.studentId,
    todayAssignment: isEmpty ? null : createAssignmentForGrade(gradeLevel),
    weeklyWriting: {
      minutesCompleted: isEmpty ? 0 : gradeLevel <= 5 ? 22 : gradeLevel <= 8 ? 54 : 92,
      minutesGoal: gradeLevel <= 5 ? 50 : gradeLevel <= 8 ? 75 : 125,
      sessionsCompleted: isEmpty ? 0 : practicedToday ? 4 : 3,
    },
  };

  return studentHomeApiResponseSchema.parse(response);
}

export const studentHomeApi = {
  async getDashboard(input: GetStudentHomeDashboardInput): Promise<StudentHomeApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Student home dashboard mock error");
    }

    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      return createDashboard(input, scenario);
    }

    try {
      // 1. Fetch or create student profile
      let { data: profile, error: profileErr } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      if (!profile) {
        // Create default profile for the user
        const { data: newProfile, error: insertErr } = await supabase
          .from("student_profiles")
          .insert({
            user_id: session.user.id,
            grade_level: getGradeLevel(input),
            writing_goals: ["write_better_sentences"],
            daily_goal_minutes: 10,
            writing_level: "getting_started",
          })
          .select("*")
          .single();

        if (insertErr) throw insertErr;
        profile = newProfile;
      }

      const gradeLevel = profile.grade_level as GradeLevel;

      // 2. Fetch or create progress totals
      let { data: progress, error: progressErr } = await supabase
        .from("student_progress_totals")
        .select("*")
        .eq("student_profile_id", profile.id)
        .maybeSingle();

      if (progressErr) throw progressErr;

      if (!progress) {
        const { data: newProgress, error: insertErr } = await supabase
          .from("student_progress_totals")
          .insert({
            student_profile_id: profile.id,
            weekly_minutes_goal: gradeLevel <= 5 ? 50 : gradeLevel <= 8 ? 75 : 125,
          })
          .select("*")
          .single();

        if (insertErr) throw insertErr;
        progress = newProgress;
      }

      // 3. Fetch skill progress
      let { data: dbSkills, error: skillsErr } = await supabase
        .from("student_skill_progress")
        .select("*")
        .eq("student_profile_id", profile.id);

      if (skillsErr) throw skillsErr;

      if (!dbSkills || dbSkills.length === 0) {
        const defaultSkills: WritingSkill[] =
          gradeLevel <= 5
            ? ["sentence_structure", "vocabulary"]
            : gradeLevel <= 8
              ? ["organization", "clarity", "revision_quality"]
              : ["argument_strength", "evidence_usage", "organization"];

        const insertRows = defaultSkills.map((skill) => ({
          student_profile_id: profile.id,
          skill,
          current_score: 60,
          previous_score: 55,
          level: 1,
        }));

        const { data: newSkills, error: insertErr } = await supabase
          .from("student_skill_progress")
          .insert(insertRows)
          .select("*");

        if (insertErr) throw insertErr;
        dbSkills = newSkills;
      }

      // 4. Fetch assignments
      let { data: studentAssignments, error: saErr } = await supabase
        .from("student_assignments")
        .select("*, assignments(*)")
        .eq("student_profile_id", profile.id);

      if (saErr) throw saErr;

      if (!studentAssignments || studentAssignments.length === 0) {
        // Assign the appropriate catalog assignment
        let defaultAssignmentId = "00000000-0000-0000-0000-000000000002";
        if (gradeLevel <= 5) {
          defaultAssignmentId = "00000000-0000-0000-0000-000000000001";
        } else if (gradeLevel >= 9) {
          defaultAssignmentId = "00000000-0000-0000-0000-000000000003";
        }

        const { error: insertErr } = await supabase
          .from("student_assignments")
          .insert({
            student_profile_id: profile.id,
            assignment_id: defaultAssignmentId,
            status: "not_started",
          });

        if (insertErr) throw insertErr;

        const { data: reFetched, error: reFetchErr } = await supabase
          .from("student_assignments")
          .select("*, assignments(*)")
          .eq("student_profile_id", profile.id);

        if (reFetchErr) throw reFetchErr;
        studentAssignments = reFetched;
      }

      // 5. Fetch continue draft
      let continueDraft: StudentHomeApiResponse["continueDraft"] = null;
      const activeSa = studentAssignments.find((sa) => sa.status === "in_progress");
      if (activeSa) {
        const { data: draft } = await supabase
          .from("writing_drafts")
          .select("*")
          .eq("student_assignment_id", activeSa.id)
          .maybeSingle();

        if (draft) {
          continueDraft = {
            assignmentId: activeSa.assignment_id,
            lastEditedLabel: "Saved recently",
            preview: draft.text_preview || "Draft in progress...",
            revisionNumber: draft.revision_number || 1,
            title: activeSa.assignments.title_fallback,
            wordCount: draft.word_count || 0,
          };
        }
      }

      // 6. Fetch recent feedback
      const { data: feedbackList } = await supabase
        .from("feedback")
        .select("*, submissions(*, student_assignments(*, assignments(*)))")
        .eq("student_profile_id", profile.id)
        .order("created_at", { ascending: false });

      const recentFeedback: StudentHomeApiResponse["recentFeedback"] = (feedbackList ?? []).slice(0, 1).map((f) => ({
        createdLabel: "Recently",
        improvement: f.improvement_fallback,
        revisionTask: f.next_revision_task_fallback,
        skill: "clarity" as WritingSkill,
        strength: f.strength_fallback,
        submissionId: f.submission_id,
        title: f.submissions?.student_assignments?.assignments?.title_fallback ?? "Feedback",
      }));

      // Map response fields
      const todaySa = studentAssignments.find(
        (sa) => sa.status === "not_started" || sa.status === "in_progress"
      );
      const todayAssignment = todaySa
        ? {
            assignmentType: todaySa.assignments.assignment_type,
            coachSuggestion: "Follow the coaching prompts inside the workspace.",
            dueLabel: "Today",
            estimatedMinutes: todaySa.assignments.estimated_minutes,
            gradeLevelMax: todaySa.assignments.grade_level_max,
            gradeLevelMin: todaySa.assignments.grade_level_min,
            id: todaySa.assignment_id,
            prompt: todaySa.assignments.prompt_fallback,
            rubricFocus: todaySa.assignments.instructions || [],
            skillFocus: todaySa.assignments.skill_focus || [],
            status: todaySa.status,
            title: todaySa.assignments.title_fallback,
          }
        : null;

      const practicedToday = progress.practiced_today_on === new Date().toISOString().split("T")[0];

      const dashboardResponse: StudentHomeApiResponse = {
        connectionStatus: "online",
        continueDraft,
        dailyPractice: {
          completedToday: practicedToday,
          minutesGoal: profile.daily_goal_minutes,
          nextPromptLabel: gradeLevel <= 5 ? "Sentence warmup" : gradeLevel <= 8 ? "Paragraph practice" : "Essay focus block",
        },
        generatedAt: new Date().toISOString(),
        gradeLevel,
        recentFeedback,
        revisionNudges:
          gradeLevel <= 5
            ? ["Try reading one sentence out loud before you submit."]
            : gradeLevel <= 8
              ? ["Check that each detail supports the topic sentence."]
              : ["Make sure every evidence sentence is followed by your own analysis."],
        skillProgress: (dbSkills ?? []).map((s) => ({
          currentScore: Math.round(Number(s.current_score)),
          label: s.skill.charAt(0).toUpperCase() + s.skill.slice(1).replace("_", " "),
          previousScore: Math.round(Number(s.previous_score)),
          skill: s.skill as WritingSkill,
        })),
        streak: {
          bestDays: progress.best_streak_days,
          currentDays: progress.current_streak_days,
          nextMilestoneDays: gradeLevel <= 5 ? 5 : 7,
          practicedToday,
        },
        studentId: input.studentId,
        todayAssignment,
        weeklyWriting: {
          minutesCompleted: progress.minutes_this_week,
          minutesGoal: progress.weekly_minutes_goal,
          sessionsCompleted: practicedToday ? 1 : 0,
        },
      };

      return studentHomeApiResponseSchema.parse(dashboardResponse);
    } catch (err) {
      console.error("Failed to query student dashboard from Supabase, falling back to mock:", err);
      return createDashboard(input, scenario);
    }
  },
};

