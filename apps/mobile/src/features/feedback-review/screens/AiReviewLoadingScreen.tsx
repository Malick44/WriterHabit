import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";

import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { LoadingState, StatusState } from "@/shared/components/feedback";
import { Screen, Stack } from "@/shared/components/layout";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function AiReviewLoadingScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ submissionId?: string | string[] }>();
  const submissionId = useMemo(() => getParamValue(params.submissionId), [params.submissionId]);

  return (
    <Screen
      backgroundColor={colors.gradeBand.middle.background}
      gradeBand="middle"
      subtitle={t("feedbackReview.loadingSubtitle")}
      testID="ai-review-loading-screen"
      title={t("feedbackReview.loadingTitle")}
    >
      <Stack gap="lg">
        <LoadingState
          accessibilityLabel={t("feedbackReview.loadingAccessibility")}
          description={t("feedbackReview.loadingDescription", { submissionId: submissionId ?? t("common.unavailable") })}
          gradeBand="middle"
          label={t("feedbackReview.loadingLabel")}
          testID="ai-review-loading"
        />
        <StatusState
          accessibilityLabel={t("feedbackReview.coachingAccessibility")}
          description={t("feedbackReview.coachingDescription")}
          gradeBand="middle"
          title={t("feedbackReview.coachingTitle")}
          tone="info"
        />
      </Stack>
    </Screen>
  );
}
