import type { ReactNode } from "react";
import { Redirect } from "expo-router";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { LoadingState } from "@/shared/components/feedback";

import { getRouteAccessDecision, type RouteAccessArea } from "./roleRouter";

interface RouteGateProps {
  area: RouteAccessArea;
  children: ReactNode;
  loadingLabel: string;
  loadingDescription?: string;
}

export function RouteGate({ area, children, loadingLabel, loadingDescription }: RouteGateProps) {
  const { status, session } = useAuthSession();

  if (status === "hydrating") {
    return <LoadingState description={loadingDescription} label={loadingLabel} />;
  }

  const decision = getRouteAccessDecision(session, area);

  if (!decision.allowed) {
    return <Redirect href={decision.redirectTo} />;
  }

  return children;
}
