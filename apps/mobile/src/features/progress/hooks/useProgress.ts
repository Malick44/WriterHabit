import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { typography, type GradeBand } from "@/design/tokens";

import { progressApi } from "../api/progressApi";
import { buildProgressDashboardViewModel } from "../services/progressViewModel";
import {
  writingSkillSchema,
  type ProgressBadgeViewModel,
  type ProgressDashboardViewModel,
  type ProgressSkillViewModel,
  type ProgressWeeklyReviewViewModel,
} from "../types";

export type ProgressDashboardDataState =
  | {
      status: "loading";
      gradeBand: GradeBand;
      refetch: () => void;
    }
  | {
      status: "error";
      gradeBand: GradeBand;
      refetch: () => void;
    }
  | {
      status: "empty";
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      viewModel: ProgressDashboardViewModel;
    }
  | {
      status: "success";
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      viewModel: ProgressDashboardViewModel;
    };

export type ProgressSkillDataState =
  | { status: "loading"; gradeBand: GradeBand; refetch: () => void }
  | { status: "error"; gradeBand: GradeBand; refetch: () => void }
  | { status: "missing"; gradeBand: GradeBand; refetch: () => void }
  | {
      status: "success";
      dashboard: ProgressDashboardViewModel;
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      skill: ProgressSkillViewModel;
    };

export type ProgressBadgesDataState =
  | { status: "loading"; gradeBand: GradeBand; refetch: () => void }
  | { status: "error"; gradeBand: GradeBand; refetch: () => void }
  | {
      status: "success";
      badges: ProgressBadgeViewModel[];
      dashboard: ProgressDashboardViewModel;
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
    };

export type ProgressWeeklyReviewDataState =
  | { status: "loading"; gradeBand: GradeBand; refetch: () => void }
  | { status: "error"; gradeBand: GradeBand; refetch: () => void }
  | {
      status: "empty";
      dashboard: ProgressDashboardViewModel;
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      weeklyReview: ProgressWeeklyReviewViewModel;
    }
  | {
      status: "success";
      dashboard: ProgressDashboardViewModel;
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      weeklyReview: ProgressWeeklyReviewViewModel;
    };

function getFallbackGradeBand(gradeLevel?: number): GradeBand {
  return gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
}

function useProgressDashboardQuery() {
  const { session } = useAuthSession();
  const studentId = session?.user.id ?? "local-student";
  const displayName = session?.user.displayName ?? "Writer";
  const gradeLevel = session?.user.gradeLevel;
  const fallbackGradeBand = getFallbackGradeBand(gradeLevel);
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => progressApi.getDashboard({ gradeLevel, studentId }),
    queryKey: ["student-progress", studentId, gradeLevel],
    retry: false,
    staleTime: 30_000,
  });

  const viewModel = useMemo(() => {
    return query.data
      ? buildProgressDashboardViewModel({
          dashboard: query.data,
          displayName,
        })
      : null;
  }, [displayName, query.data]);

  const refetch = () => {
    void query.refetch();
  };

  return {
    fallbackGradeBand,
    isSessionReady: Boolean(session),
    query,
    refetch,
    viewModel,
  };
}

export function useProgressDashboard(): ProgressDashboardDataState {
  const { fallbackGradeBand, isSessionReady, query, refetch, viewModel } = useProgressDashboardQuery();

  if (!isSessionReady || (query.isLoading && !query.data)) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "loading",
    };
  }

  if (query.isError || !viewModel) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "error",
    };
  }

  if (viewModel.isEmpty) {
    return {
      gradeBand: viewModel.gradeAdaptation.band,
      isRefreshing: query.isFetching,
      refetch,
      status: "empty",
      viewModel,
    };
  }

  return {
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: query.isFetching,
    refetch,
    status: "success",
    viewModel,
  };
}

export function useProgressSkill(skillId?: string): ProgressSkillDataState {
  const state = useProgressDashboard();

  if (state.status === "loading" || state.status === "error") {
    return state;
  }

  const parsedSkill = writingSkillSchema.safeParse(skillId);

  if (!parsedSkill.success) {
    return {
      gradeBand: state.gradeBand,
      refetch: state.refetch,
      status: "missing",
    };
  }

  const skill = state.viewModel.skills.find((item) => item.skill === parsedSkill.data);

  if (!skill) {
    return {
      gradeBand: state.gradeBand,
      refetch: state.refetch,
      status: "missing",
    };
  }

  return {
    dashboard: state.viewModel,
    gradeBand: state.gradeBand,
    isRefreshing: state.isRefreshing,
    refetch: state.refetch,
    skill,
    status: "success",
  };
}

export function useProgressBadges(): ProgressBadgesDataState {
  const state = useProgressDashboard();

  if (state.status === "loading" || state.status === "error") {
    return state;
  }

  return {
    badges: state.viewModel.badges,
    dashboard: state.viewModel,
    gradeBand: state.gradeBand,
    isRefreshing: state.isRefreshing,
    refetch: state.refetch,
    status: "success",
  };
}

export function useProgressWeeklyReview(): ProgressWeeklyReviewDataState {
  const state = useProgressDashboard();

  if (state.status === "loading" || state.status === "error") {
    return state;
  }

  if (state.viewModel.weeklyReview.isEmpty) {
    return {
      dashboard: state.viewModel,
      gradeBand: state.gradeBand,
      isRefreshing: state.isRefreshing,
      refetch: state.refetch,
      status: "empty",
      weeklyReview: state.viewModel.weeklyReview,
    };
  }

  return {
    dashboard: state.viewModel,
    gradeBand: state.gradeBand,
    isRefreshing: state.isRefreshing,
    refetch: state.refetch,
    status: "success",
    weeklyReview: state.viewModel.weeklyReview,
  };
}
