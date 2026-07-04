import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { typography, type GradeBand } from "@/design/tokens";
import { canvasApi } from "@/features/canvas";
import type { CanvasDocumentSummary } from "@/features/canvas/types";

import { assignmentsApi } from "../api/assignmentsApi";
import {
  buildAssignmentDetailViewModel,
  buildAssignmentHistoryViewModel,
} from "../services/assignmentViewModel";
import type {
  AssignmentDetailViewModel,
  AssignmentHistoryTab,
  AssignmentHistoryViewModel,
  AssignmentRecord,
  AssignmentSubmissionResponse,
} from "../types";
import type { AssignmentAttachment } from "../services/attachmentTypes";

export type AssignmentHistoryDataState =
  | { status: "loading"; gradeBand: GradeBand; refetch: () => void }
  | { status: "error"; gradeBand: GradeBand; refetch: () => void }
  | {
      status: "empty";
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      viewModel: AssignmentHistoryViewModel;
    }
  | {
      status: "success";
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      viewModel: AssignmentHistoryViewModel;
    };

export type AssignmentDetailDataState =
  | { status: "loading"; gradeBand: GradeBand; refetch: () => void }
  | { status: "error"; gradeBand: GradeBand; refetch: () => void }
  | {
      status: "missing";
      gradeBand: GradeBand;
      refetch: () => void;
      viewModel: AssignmentDetailViewModel;
    }
  | {
      status: "success";
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      startStatus: "idle" | "loading" | "error" | "success";
      startAssignment: () => Promise<AssignmentRecord | null>;
      viewModel: AssignmentDetailViewModel;
    };

export type AssignmentSubmissionDataState =
  | { status: "loading"; gradeBand: GradeBand; refetch: () => void }
  | { status: "error"; gradeBand: GradeBand; refetch: () => void }
  | {
      status: "missing";
      gradeBand: GradeBand;
      refetch: () => void;
      viewModel: AssignmentDetailViewModel;
    }
  | {
      status: "success";
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      submitStatus: "idle" | "loading" | "error" | "success";
      submitResult: AssignmentSubmissionResponse | null;
      submitAssignment: (input?: {
        attachments?: AssignmentAttachment[];
        typedText?: string;
      }) => Promise<AssignmentSubmissionResponse | null>;
      viewModel: AssignmentDetailViewModel;
    };

function getFallbackGradeBand(gradeLevel?: number): GradeBand {
  return gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
}

export function useAssignmentHistoryData(
  selectedTab: AssignmentHistoryTab,
): AssignmentHistoryDataState {
  const { session } = useAuthSession();
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const fallbackGradeBand = getFallbackGradeBand(gradeLevel);
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => assignmentsApi.getAssignments({ gradeLevel, studentId }),
    queryKey: ["assignments", studentId, gradeLevel],
  });
  const refetch = () => {
    void query.refetch();
  };
  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildAssignmentHistoryViewModel({
      response: query.data,
      selectedTab,
    });
  }, [query.data, selectedTab]);

  if (query.isLoading || !session) {
    return { gradeBand: fallbackGradeBand, refetch, status: "loading" };
  }

  if (query.isError || !viewModel) {
    return { gradeBand: fallbackGradeBand, refetch, status: "error" };
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

export function useAssignmentDetailData(
  assignmentId?: string,
): AssignmentDetailDataState {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const fallbackGradeBand = getFallbackGradeBand(gradeLevel);
  const query = useQuery({
    enabled: Boolean(session && assignmentId),
    queryFn: () =>
      assignmentsApi.getAssignmentDetail({
        assignmentId: assignmentId ?? "",
        gradeLevel,
        studentId,
      }),
    queryKey: ["assignment-detail", studentId, gradeLevel, assignmentId],
  });
  const startMutation = useMutation({
    mutationFn: () =>
      assignmentsApi.startAssignment({
        assignmentId: assignmentId ?? "",
        gradeLevel,
        studentId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["assignments", studentId, gradeLevel],
      });
      await queryClient.invalidateQueries({
        queryKey: ["assignment-detail", studentId, gradeLevel, assignmentId],
      });
    },
  });
  const refetch = () => {
    void query.refetch();
  };
  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildAssignmentDetailViewModel(query.data);
  }, [query.data]);

  if (query.isLoading || !session || !assignmentId) {
    return { gradeBand: fallbackGradeBand, refetch, status: "loading" };
  }

  if (query.isError || !viewModel) {
    return { gradeBand: fallbackGradeBand, refetch, status: "error" };
  }

  if (viewModel.isMissing) {
    return {
      gradeBand: viewModel.gradeAdaptation.band,
      refetch,
      status: "missing",
      viewModel,
    };
  }

  return {
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: query.isFetching,
    refetch,
    startAssignment: async () => {
      try {
        return await startMutation.mutateAsync();
      } catch {
        return null;
      }
    },
    startStatus: startMutation.isPending
      ? "loading"
      : startMutation.isError
        ? "error"
        : startMutation.isSuccess
          ? "success"
          : "idle",
    status: "success",
    viewModel,
  };
}

export function useAssignmentSubmissionData(
  assignmentId?: string,
): AssignmentSubmissionDataState {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const fallbackGradeBand = getFallbackGradeBand(gradeLevel);
  const query = useQuery({
    enabled: Boolean(session && assignmentId),
    queryFn: () =>
      assignmentsApi.getAssignmentDetail({
        assignmentId: assignmentId ?? "",
        gradeLevel,
        studentId,
      }),
    queryKey: ["assignment-detail", studentId, gradeLevel, assignmentId],
  });
  const submitMutation = useMutation({
    mutationFn: (input?: {
      attachments?: AssignmentAttachment[];
      typedText?: string;
    }) =>
      assignmentsApi.submitAssignment({
        attachments: input?.attachments,
        assignmentId: assignmentId ?? "",
        gradeLevel,
        studentId,
        typedText: input?.typedText,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["assignments", studentId, gradeLevel],
      });
      await queryClient.invalidateQueries({
        queryKey: ["assignment-detail", studentId, gradeLevel, assignmentId],
      });
    },
  });
  const refetch = () => {
    void query.refetch();
  };
  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildAssignmentDetailViewModel(query.data);
  }, [query.data]);

  if (query.isLoading || !session || !assignmentId) {
    return { gradeBand: fallbackGradeBand, refetch, status: "loading" };
  }

  if (query.isError || !viewModel) {
    return { gradeBand: fallbackGradeBand, refetch, status: "error" };
  }

  if (viewModel.isMissing) {
    return {
      gradeBand: viewModel.gradeAdaptation.band,
      refetch,
      status: "missing",
      viewModel,
    };
  }

  return {
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: query.isFetching,
    refetch,
    status: "success",
    submitAssignment: async (input?: {
      attachments?: AssignmentAttachment[];
      typedText?: string;
    }) => {
      try {
        return await submitMutation.mutateAsync(input);
      } catch {
        return null;
      }
    },
    submitResult: submitMutation.data ?? null,
    submitStatus: submitMutation.isPending
      ? "loading"
      : submitMutation.isError
        ? "error"
        : submitMutation.isSuccess
          ? "success"
          : "idle",
    viewModel,
  };
}

export function useAssignments() {
  return useAssignmentHistoryData("all");
}

export interface AssignmentCanvasWorkState {
  attachedCanvas: CanvasDocumentSummary | null;
  refetch: () => void;
}

/**
 * Canvas work saves local-first and only reaches the backend when sync is
 * available, so the server-side draft summary can miss it. This checks the
 * canvas store directly (remote with local fallback) so step gating on the
 * assignment detail screen unlocks as soon as a canvas is attached.
 */
export function useAssignmentCanvasWork(
  assignmentId?: string,
): AssignmentCanvasWorkState {
  const { session } = useAuthSession();
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const query = useQuery({
    enabled: Boolean(assignmentId),
    queryFn: () =>
      canvasApi.getAttachedCanvasSummary({
        assignmentId: assignmentId ?? "",
        gradeLevel,
        studentId,
      }),
    queryKey: ["assignment-attached-canvas", studentId, assignmentId],
  });

  return {
    attachedCanvas: query.data ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
