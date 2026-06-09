import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { type GradeBand } from "@/design/tokens";

import { teacherApi } from "../api/teacherApi";
import {
  buildTeacherAssignmentsViewModel,
  buildTeacherClassProgressViewModel,
  buildTeacherDashboardViewModel,
  buildTeacherSubmissionReviewViewModel,
  buildTeacherSubmissionsViewModel,
} from "../services/teacherViewModel";
import type {
  CreateTeacherAssignmentInput,
  TeacherAssignmentSummary,
  TeacherAssignmentsViewModel,
  TeacherClassProgressViewModel,
  TeacherDashboardViewModel,
  TeacherSubmissionReviewViewModel,
  TeacherSubmissionsViewModel,
} from "../types";

type TeacherDashboardState =
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
      viewModel: TeacherDashboardViewModel;
    };

type TeacherAssignmentsState =
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
      viewModel: TeacherAssignmentsViewModel;
    };

type TeacherSubmissionsState =
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
      viewModel: TeacherSubmissionsViewModel;
    };

type TeacherClassProgressState =
  | {
      gradeBand: GradeBand;
      refetch: () => void;
      status: "loading" | "error" | "missing";
    }
  | {
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      status: "empty" | "success";
      viewModel: TeacherClassProgressViewModel;
    };

type TeacherSubmissionReviewState =
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
      viewModel: TeacherSubmissionReviewViewModel;
    };

interface CreateTeacherAssignmentState {
  createdAssignment: TeacherAssignmentSummary | null;
  isCreating: boolean;
  reset: () => void;
  status: "idle" | "pending" | "success" | "error";
  submitAssignment: (input: CreateTeacherAssignmentInput) => Promise<TeacherAssignmentSummary>;
}

interface UpdateTeacherSubmissionCommentState {
  isSaving: boolean;
  reset: () => void;
  saveComment: (input: { comment: string; submissionId: string }) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
}

function getTeacherId(): string {
  return "local-teacher";
}

function getFallbackGradeBand(): GradeBand {
  return "middle";
}

export function useTeacherDashboardData(): TeacherDashboardState {
  const { session } = useAuthSession();
  const teacherId = session?.user.id ?? getTeacherId();
  const fallbackGradeBand = getFallbackGradeBand();
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => teacherApi.getDashboard({ teacherId }),
    queryKey: ["teacher-dashboard", teacherId],
  });

  const refetch = () => {
    void query.refetch();
  };

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildTeacherDashboardViewModel(query.data);
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

export function useTeacherAssignmentsData(): TeacherAssignmentsState {
  const { session } = useAuthSession();
  const teacherId = session?.user.id ?? getTeacherId();
  const fallbackGradeBand = getFallbackGradeBand();
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => teacherApi.getAssignments({ teacherId }),
    queryKey: ["teacher-assignments", teacherId],
  });

  const refetch = () => {
    void query.refetch();
  };

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildTeacherAssignmentsViewModel(query.data);
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

export function useTeacherSubmissionsData(): TeacherSubmissionsState {
  const { session } = useAuthSession();
  const teacherId = session?.user.id ?? getTeacherId();
  const fallbackGradeBand = getFallbackGradeBand();
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => teacherApi.getSubmissions({ teacherId }),
    queryKey: ["teacher-submissions", teacherId],
  });

  const refetch = () => {
    void query.refetch();
  };

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildTeacherSubmissionsViewModel(query.data);
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

export function useTeacherClassProgressData(classId?: string): TeacherClassProgressState {
  const { session } = useAuthSession();
  const teacherId = session?.user.id ?? getTeacherId();
  const fallbackGradeBand = getFallbackGradeBand();
  const query = useQuery({
    enabled: Boolean(session) && Boolean(classId),
    queryFn: () => teacherApi.getClassProgress({ classId, teacherId }),
    queryKey: ["teacher-class-progress", teacherId, classId],
  });

  const refetch = () => {
    void query.refetch();
  };

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildTeacherClassProgressViewModel(query.data);
  }, [query.data]);

  if (!classId) {
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
    status: viewModel.isEmpty ? "empty" : "success",
    viewModel,
  };
}

export function useTeacherSubmissionReviewData(submissionId?: string): TeacherSubmissionReviewState {
  const { session } = useAuthSession();
  const teacherId = session?.user.id ?? getTeacherId();
  const fallbackGradeBand = getFallbackGradeBand();
  const query = useQuery({
    enabled: Boolean(session) && Boolean(submissionId),
    queryFn: () => teacherApi.getSubmissionReview({ submissionId, teacherId }),
    queryKey: ["teacher-submission-review", teacherId, submissionId],
  });

  const refetch = () => {
    void query.refetch();
  };

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildTeacherSubmissionReviewViewModel(query.data);
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

export function useCreateTeacherAssignment(): CreateTeacherAssignmentState {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const teacherId = session?.user.id ?? getTeacherId();
  const mutation = useMutation({
    mutationFn: (input: CreateTeacherAssignmentInput) =>
      teacherApi.createAssignment({
        ...input,
        teacherId,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teacher-dashboard", teacherId] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-assignments", teacherId] }),
      ]);
    },
  });

  return {
    createdAssignment: mutation.data ?? null,
    isCreating: mutation.isPending,
    reset: mutation.reset,
    status: mutation.status,
    submitAssignment: mutation.mutateAsync,
  };
}

export function useUpdateTeacherSubmissionComment(): UpdateTeacherSubmissionCommentState {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const teacherId = session?.user.id ?? getTeacherId();
  const mutation = useMutation({
    mutationFn: (input: { comment: string; submissionId: string }) =>
      teacherApi.updateSubmissionComment({
        ...input,
        teacherId,
      }),
    onSuccess: async (_response, input) => {
      await queryClient.invalidateQueries({
        queryKey: ["teacher-submission-review", teacherId, input.submissionId],
      });
    },
  });

  return {
    isSaving: mutation.isPending,
    reset: mutation.reset,
    saveComment: async (input) => {
      await mutation.mutateAsync(input);
    },
    status: mutation.status,
  };
}
