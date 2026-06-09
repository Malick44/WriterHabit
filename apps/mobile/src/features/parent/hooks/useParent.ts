import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { typography, type GradeBand } from "@/design/tokens";

import { parentApi } from "../api/parentApi";
import {
  buildParentAssignmentReviewViewModel,
  buildParentDashboardViewModel,
  buildParentStudentReportViewModel,
} from "../services/parentViewModel";
import type {
  ParentAssignmentReviewViewModel,
  ParentDashboardViewModel,
  ParentSettings,
  ParentSettingsApiResponse,
  ParentStudentReportViewModel,
} from "../types";

type ParentDashboardState =
  | {
      gradeBand: GradeBand;
      refetch: () => void;
      selectStudent: (studentId: string) => void;
      selectedStudentId?: string;
      status: "loading" | "error";
    }
  | {
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      selectStudent: (studentId: string) => void;
      selectedStudentId?: string;
      status: "empty" | "success";
      viewModel: ParentDashboardViewModel;
    };

type ParentReportState =
  | {
      gradeBand: GradeBand;
      refetch: () => void;
      status: "loading" | "error";
    }
  | {
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      status: "empty" | "success";
      viewModel: ParentStudentReportViewModel;
    };

type ParentAssignmentReviewState =
  | {
      gradeBand: GradeBand;
      refetch: () => void;
      status: "loading" | "error" | "missing";
    }
  | {
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      status: "success";
      viewModel: ParentAssignmentReviewViewModel;
    };

type ParentSettingsState =
  | {
      gradeBand: GradeBand;
      refetch: () => void;
      status: "loading" | "error";
    }
  | {
      gradeBand: GradeBand;
      isSaving: boolean;
      isRefreshing: boolean;
      refetch: () => void;
      status: "success";
      updateSetting: <Key extends keyof ParentSettings>(key: Key, value: ParentSettings[Key]) => void;
      updateSettings: (settings: ParentSettings) => void;
      viewModel: ParentSettingsApiResponse;
    };

function getParentId(): string {
  return "local-parent";
}

function getFallbackGradeBand(gradeLevel?: number): GradeBand {
  return gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
}

export function useParentDashboardData(): ParentDashboardState {
  const { session } = useAuthSession();
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>();
  const parentId = session?.user.id ?? getParentId();
  const fallbackGradeBand = getFallbackGradeBand(session?.user.gradeLevel);
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => parentApi.getDashboard({ parentId, selectedStudentId }),
    queryKey: ["parent-dashboard", parentId, selectedStudentId],
  });

  const refetch = () => {
    void query.refetch();
  };

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildParentDashboardViewModel(query.data);
  }, [query.data]);

  const selectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  if (query.isLoading || !session) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      selectStudent,
      selectedStudentId,
      status: "loading",
    };
  }

  if (query.isError || !viewModel) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      selectStudent,
      selectedStudentId,
      status: "error",
    };
  }

  return {
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: query.isFetching,
    refetch,
    selectStudent,
    selectedStudentId: viewModel.selectedStudent?.id ?? selectedStudentId,
    status: viewModel.isEmpty ? "empty" : "success",
    viewModel,
  };
}

export function useParentAssignmentsData(): ParentDashboardState {
  return useParentDashboardData();
}

export function useParentStudentReportData(studentId?: string): ParentReportState {
  const { session } = useAuthSession();
  const parentId = session?.user.id ?? getParentId();
  const fallbackGradeBand = getFallbackGradeBand(session?.user.gradeLevel);
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => parentApi.getStudentReport({ parentId, studentId }),
    queryKey: ["parent-student-report", parentId, studentId],
  });

  const refetch = () => {
    void query.refetch();
  };

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildParentStudentReportViewModel(query.data);
  }, [query.data]);

  if (query.isLoading || !session) {
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

  return {
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: query.isFetching,
    refetch,
    status: viewModel.isEmpty ? "empty" : "success",
    viewModel,
  };
}

export function useParentAssignmentReviewData(submissionId?: string): ParentAssignmentReviewState {
  const { session } = useAuthSession();
  const parentId = session?.user.id ?? getParentId();
  const fallbackGradeBand = getFallbackGradeBand(session?.user.gradeLevel);
  const query = useQuery({
    enabled: Boolean(session) && Boolean(submissionId),
    queryFn: () => parentApi.getAssignmentReview({ parentId, submissionId }),
    queryKey: ["parent-assignment-review", parentId, submissionId],
  });

  const refetch = () => {
    void query.refetch();
  };

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildParentAssignmentReviewViewModel(query.data);
  }, [query.data]);

  if (!submissionId) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "missing",
    };
  }

  if (query.isLoading || !session) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "loading",
    };
  }

  if (query.isError) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "error",
    };
  }

  if (!viewModel) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "missing",
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

export function useParentSettingsData(): ParentSettingsState {
  const { session } = useAuthSession();
  const parentId = session?.user.id ?? getParentId();
  const queryClient = useQueryClient();
  const fallbackGradeBand = getFallbackGradeBand(session?.user.gradeLevel);
  const queryKey = ["parent-settings", parentId] as const;
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => parentApi.getSettings({ parentId }),
    queryKey,
  });
  const mutation = useMutation({
    mutationFn: (settings: ParentSettings) => parentApi.updateSettings({ parentId, settings }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });

  const refetch = () => {
    void query.refetch();
  };

  if (query.isLoading || !session) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "loading",
    };
  }

  if (query.isError || !query.data) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "error",
    };
  }

  const primaryStudent = query.data.linkedStudents[0];
  const gradeBand = primaryStudent ? typography.getGradeBandForGrade(primaryStudent.gradeLevel) : "middle";
  const updateSettings = (settings: ParentSettings) => {
    mutation.mutate(settings);
  };
  const updateSetting = <Key extends keyof ParentSettings>(key: Key, value: ParentSettings[Key]) => {
    mutation.mutate({
      ...query.data.settings,
      [key]: value,
    });
  };

  return {
    gradeBand,
    isRefreshing: query.isFetching,
    isSaving: mutation.isPending,
    refetch,
    status: "success",
    updateSetting,
    updateSettings,
    viewModel: query.data,
  };
}
