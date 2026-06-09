import { StatusState, SuccessState } from "@/shared/components/feedback";
import { useI18n } from "@/i18n";
import type { GradeBand } from "@/design/tokens";

import type { StudentHomeViewModel } from "../types";

interface DashboardStatusBannerProps {
  gradeBand: GradeBand;
  onRetryPress: () => void;
  viewModel: StudentHomeViewModel;
}

export function DashboardStatusBanner({ gradeBand, onRetryPress, viewModel }: DashboardStatusBannerProps) {
  const { t } = useI18n();

  if (viewModel.isOffline) {
    return (
      <StatusState
        actionLabel={t("studentHome.offline.action")}
        accessibilityLabel={t("studentHome.offline.accessibility")}
        description={t("studentHome.offline.description")}
        gradeBand={gradeBand}
        onActionPress={onRetryPress}
        title={t("studentHome.offline.title")}
        tone="warning"
      />
    );
  }

  if (viewModel.dailyPractice.completedToday) {
    return (
      <SuccessState
        accessibilityLabel={t("studentHome.practiceComplete.accessibility")}
        description={t("studentHome.practiceComplete.description")}
        gradeBand={gradeBand}
        title={t("studentHome.practiceComplete.title")}
      />
    );
  }

  const [firstNudge] = viewModel.revisionNudges;

  if (!firstNudge) {
    return null;
  }

  return (
    <StatusState
      accessibilityLabel={t("studentHome.revisionNudge.accessibility")}
      description={firstNudge}
      gradeBand={gradeBand}
      title={t("studentHome.revisionNudge.title")}
      tone="info"
    />
  );
}
