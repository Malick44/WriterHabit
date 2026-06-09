import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { typography, type GradeBand } from "@/design/tokens";
import { translate } from "@/i18n";

import { studentHomeApi } from "../api/studentHomeApi";
import { buildStudentHomeViewModel } from "../services/studentHomeViewModel";
import type { StudentHomeViewModel } from "../types";

export type StudentHomeDataState =
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
      viewModel: StudentHomeViewModel;
    }
  | {
      status: "success";
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      viewModel: StudentHomeViewModel;
    };

function getFallbackGradeBand(gradeLevel?: number): GradeBand {
  return gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
}

export function useStudentHomeData(): StudentHomeDataState {
  const { session } = useAuthSession();
  const studentId = session?.user.id ?? "local-student";
  const displayName = session?.user.displayName ?? translate("en", "common.fallbackDisplayName");
  const gradeLevel = session?.user.gradeLevel;
  const fallbackGradeBand = getFallbackGradeBand(gradeLevel);
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => studentHomeApi.getDashboard({ gradeLevel, studentId }),
    queryKey: ["student-home", studentId, gradeLevel],
  });

  const refetch = () => {
    void query.refetch();
  };

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildStudentHomeViewModel({
      dashboard: query.data,
      displayName,
    });
  }, [displayName, query.data]);

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
