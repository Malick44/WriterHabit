import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { typography, type GradeBand } from "@/design/tokens";

import { subscriptionsApi } from "../api/subscriptionsApi";
import { buildSubscriptionViewModel } from "../services/entitlementService";
import type {
  SubscriptionCheckoutResult,
  SubscriptionPlanId,
  SubscriptionRestoreResult,
  SubscriptionViewModel,
} from "../types";

type SubscriptionMutationStatus = "idle" | "loading" | "success" | "error";

export type SubscriptionsState =
  | {
      checkoutError: boolean;
      checkoutStatus: "idle" | "loading" | "success" | "error";
      checkoutWithPlan: (planId: SubscriptionPlanId) => void;
      gradeBand: GradeBand;
      refetch: () => void;
      restoreError: boolean;
      restorePurchases: () => void;
      restoreResult: SubscriptionRestoreResult | null;
      restoreStatus: "idle" | "loading" | "success" | "error";
      status: "loading" | "error";
    }
  | {
      checkoutError: boolean;
      checkoutResult: SubscriptionCheckoutResult | null;
      checkoutStatus: "idle" | "loading" | "success" | "error";
      checkoutWithPlan: (planId: SubscriptionPlanId) => void;
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      restoreError: boolean;
      restorePurchases: () => void;
      restoreResult: SubscriptionRestoreResult | null;
      restoreStatus: "idle" | "loading" | "success" | "error";
      status: "empty" | "success";
      viewModel: SubscriptionViewModel;
    };

function mapMutationStatus(status: "idle" | "pending" | "success" | "error"): SubscriptionMutationStatus {
  return status === "pending" ? "loading" : status;
}

function getFallbackGradeBand(gradeLevel?: number): GradeBand {
  return gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
}

export function useSubscriptions(): SubscriptionsState {
  const queryClient = useQueryClient();
  const auth = useAuthSession();
  const session = auth.session;
  const userId = session?.user.id ?? "local-user";
  const role = session?.user.role ?? "student";
  const gradeLevel = session?.user.gradeLevel;
  const sessionSubscriptionStatus = session?.subscriptionStatus ?? "free";
  const queryKey = ["subscriptions", userId, role, gradeLevel, sessionSubscriptionStatus] as const;
  const fallbackGradeBand = getFallbackGradeBand(gradeLevel);

  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () =>
      subscriptionsApi.getEntitlements({
        gradeLevel,
        role,
        sessionSubscriptionStatus,
        userId,
      }),
    queryKey,
  });

  const updateSessionSubscriptionStatus = (
    result: SubscriptionCheckoutResult | SubscriptionRestoreResult,
  ) => {
    if (!session) {
      return;
    }

    auth.setSession({
      ...session,
      subscriptionStatus: result.entitlement.status,
    });
  };

  const checkoutMutation = useMutation({
    mutationFn: (planId: SubscriptionPlanId) =>
      subscriptionsApi.startCheckout({
        gradeLevel,
        planId,
        role,
        sessionSubscriptionStatus,
        userId,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result.entitlement);
      updateSessionSubscriptionStatus(result);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () =>
      subscriptionsApi.restorePurchases({
        gradeLevel,
        role,
        sessionSubscriptionStatus,
        userId,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result.entitlement);
      if (result.status === "restored") {
        updateSessionSubscriptionStatus(result);
      }
    },
  });

  const refetch = () => {
    void query.refetch();
  };

  const checkoutWithPlan = (planId: SubscriptionPlanId) => {
    checkoutMutation.mutate(planId);
  };

  const restorePurchases = () => {
    restoreMutation.mutate();
  };

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildSubscriptionViewModel(query.data, { gradeLevel });
  }, [gradeLevel, query.data]);

  const checkoutStatus = mapMutationStatus(checkoutMutation.status);
  const restoreStatus = mapMutationStatus(restoreMutation.status);
  const baseState = {
    checkoutError: checkoutMutation.isError,
    checkoutStatus,
    checkoutWithPlan,
    gradeBand: fallbackGradeBand,
    refetch,
    restoreError: restoreMutation.isError,
    restorePurchases,
    restoreResult: restoreMutation.data ?? null,
    restoreStatus,
  };

  if (query.isLoading || !session) {
    return {
      ...baseState,
      status: "loading",
    };
  }

  if (query.isError || !viewModel) {
    return {
      ...baseState,
      status: "error",
    };
  }

  return {
    ...baseState,
    checkoutResult: checkoutMutation.data ?? null,
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: query.isFetching,
    status: viewModel.isEmpty ? "empty" : "success",
    viewModel,
  };
}

export function useEntitlements(): SubscriptionsState {
  return useSubscriptions();
}
