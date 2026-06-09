import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { typography, type GradeBand } from "@/design/tokens";

import { FeedbackReviewApiError, feedbackReviewApi } from "../api/feedbackreviewApi";
import { buildFeedbackReviewViewModel } from "../services/feedbackReviewService";
import type {
  FeedbackReviewViewModel,
  FeedbackRevisionCompletion,
  FeedbackRevisionError,
} from "../types";

export type FeedbackReviewDataState =
  | { status: "loading"; gradeBand: GradeBand; refetch: () => void }
  | { status: "error"; gradeBand: GradeBand; refetch: () => void }
  | { status: "missing"; gradeBand: GradeBand; refetch: () => void }
  | { status: "processing"; gradeBand: GradeBand; refetch: () => void }
  | {
      status: "success";
      completion: FeedbackRevisionCompletion | null;
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      revisionError: FeedbackRevisionError | null;
      revisionStatus: "idle" | "loading" | "error" | "success";
      studentId: string;
      submitRevision: (input: {
        originalExcerpt: string;
        revisedText: string;
      }) => Promise<FeedbackRevisionCompletion | null>;
      viewModel: FeedbackReviewViewModel;
    };

function getFallbackGradeBand(gradeLevel?: number): GradeBand {
  return gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
}

function getRevisionError(error: unknown): FeedbackRevisionError {
  if (error instanceof FeedbackReviewApiError && error.code !== "review_failed") {
    return error.code;
  }

  return "submit_failed";
}

export function useFeedbackReview(submissionId?: string): FeedbackReviewDataState {
  const { session } = useAuthSession();
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const fallbackGradeBand = getFallbackGradeBand(gradeLevel);
  const query = useQuery({
    enabled: Boolean(session && submissionId),
    gcTime: 5 * 60_000,
    queryFn: () =>
      feedbackReviewApi.getFeedbackReview({
        gradeLevel,
        studentId,
        submissionId: submissionId ?? "",
      }),
    queryKey: ["feedback-review", studentId, gradeLevel, submissionId],
    retry: false,
    staleTime: 30_000,
  });
  const revisionMutation = useMutation({
    gcTime: 60_000,
    mutationFn: (input: { originalExcerpt: string; revisedText: string }) =>
      feedbackReviewApi.submitRevision({
        gradeLevel,
        originalExcerpt: input.originalExcerpt,
        revisedText: input.revisedText,
        studentId,
        submissionId: submissionId ?? "",
      }),
  });
  const refetch = () => {
    void query.refetch();
  };

  const viewModel = useMemo(() => {
    return query.data ? buildFeedbackReviewViewModel(query.data) : null;
  }, [query.data]);

  const submitRevision = useCallback(
    async (input: { originalExcerpt: string; revisedText: string }) => {
      try {
        return await revisionMutation.mutateAsync(input);
      } catch {
        return null;
      }
    },
    [revisionMutation],
  );

  if (!session || (query.isLoading && !query.data)) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "loading",
    };
  }

  if (!submissionId || query.isError) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "error",
    };
  }

  if (!query.data) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "loading",
    };
  }

  if (query.data.status === "processing") {
    return {
      gradeBand: getFallbackGradeBand(query.data.gradeLevel),
      refetch,
      status: "processing",
    };
  }

  if (!viewModel || query.data.status === "missing") {
    return {
      gradeBand: getFallbackGradeBand(query.data.gradeLevel),
      refetch,
      status: "missing",
    };
  }

  return {
    completion: revisionMutation.data ?? null,
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: query.isFetching,
    refetch,
    revisionError: revisionMutation.isError ? getRevisionError(revisionMutation.error) : null,
    revisionStatus: revisionMutation.status === "pending" ? "loading" : revisionMutation.status,
    status: "success",
    studentId,
    submitRevision,
    viewModel,
  };
}
