import type { ReactNode } from "react";

import type { GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { ProgressBar, StatusState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout/Screen";
import { Stack } from "@/shared/components/layout/Stack";

import { getStepProgress, type OnboardingStep } from "../types";

type OnboardingStepFrameProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  step: OnboardingStep;
  gradeBand?: GradeBand;
  errorMessage?: string | null;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
};

export function OnboardingStepFrame({
  children,
  title,
  subtitle,
  step,
  gradeBand = "middle",
  errorMessage,
  primaryLabel,
  onPrimaryPress,
  primaryDisabled,
  primaryLoading,
  secondaryLabel,
  onSecondaryPress,
}: OnboardingStepFrameProps) {
  const { t } = useI18n();

  return (
    <Screen
      gradeBand={gradeBand}
      subtitle={subtitle}
      title={title}
    >
      <Stack gap="lg">
        <ProgressBar
          gradeBand={gradeBand}
          label={t("onboarding.progressLabel")}
          showValue
          value={getStepProgress(step)}
        />
        {errorMessage ? (
          <StatusState
            description={errorMessage}
            gradeBand={gradeBand}
            title={t("onboarding.errors.title")}
            tone="error"
          />
        ) : null}
        {children}
        {primaryLabel && onPrimaryPress ? (
          <Stack gap="sm">
            <Button
              disabled={primaryDisabled}
              fullWidth
              gradeBand={gradeBand}
              label={primaryLabel}
              loading={primaryLoading}
              onPress={onPrimaryPress}
            />
            {secondaryLabel && onSecondaryPress ? (
              <Button
                fullWidth
                gradeBand={gradeBand}
                label={secondaryLabel}
                onPress={onSecondaryPress}
                variant="ghost"
              />
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Screen>
  );
}
