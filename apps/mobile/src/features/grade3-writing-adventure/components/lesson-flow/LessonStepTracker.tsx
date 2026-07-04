import { Fragment } from "react";
import { Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { grade3Theme } from "../../theme/grade3Theme";
import { getLessonStepIndex, lessonSteps, type LessonStep } from "./lessonFlowTypes";

type LessonStepTrackerProps = {
  currentStep: LessonStep;
  furthestStepIndex: number;
};

const STEP_CIRCLE_SIZE = 28;
const CONNECTOR_HEIGHT = 3;

export function LessonStepTracker({ currentStep, furthestStepIndex }: LessonStepTrackerProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const currentIndex = getLessonStepIndex(currentStep);

  return (
    <View
      accessibilityLabel={t("grade3WritingAdventure.lessonFlow.tracker.accessibility")}
      style={{ alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }}
    >
      {lessonSteps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < furthestStepIndex || currentStep === "celebration";
        // The line leading into this step lights up once the previous step is done.
        const isReached = index - 1 < furthestStepIndex || currentStep === "celebration";
        const label = t(`grade3WritingAdventure.lessonFlow.steps.${step}` as const);

        return (
          <Fragment key={step}>
            {index > 0 ? (
              <View
                accessible={false}
                importantForAccessibility="no"
                style={{
                  backgroundColor: isReached
                    ? colors.feedback.success.border
                    : grade3Theme.accent.lavenderBorder,
                  borderRadius: radius.full,
                  flex: 1,
                  height: CONNECTOR_HEIGHT,
                  marginHorizontal: spacing.xxs,
                  marginTop: (STEP_CIRCLE_SIZE - CONNECTOR_HEIGHT) / 2,
                  minWidth: spacing.sm,
                }}
              />
            ) : null}
            <View
            accessibilityLabel={t("grade3WritingAdventure.lessonFlow.tracker.stepAccessibility", {
              label,
              status: isCurrent
                ? t("grade3WritingAdventure.lessonFlow.tracker.current")
                : isComplete
                  ? t("grade3WritingAdventure.lessonFlow.tracker.complete")
                  : t("grade3WritingAdventure.lessonFlow.tracker.locked"),
            })}
            accessibilityRole="text"
            style={{
              alignItems: "center",
              gap: spacing.xs,
              minWidth: 44,
            }}
          >
            <View
              style={{
                alignItems: "center",
                backgroundColor: isCurrent
                  ? grade3Theme.accent.lavender
                  : isComplete
                    ? colors.feedback.success.border
                    : grade3Theme.accent.lavenderSoft,
                borderColor: isCurrent ? grade3Theme.accent.lavender : grade3Theme.accent.lavenderBorder,
                borderRadius: radius.full,
                borderWidth: 1,
                height: STEP_CIRCLE_SIZE,
                justifyContent: "center",
                width: STEP_CIRCLE_SIZE,
              }}
            >
              <Text
                style={{
                  color: isCurrent ? colors.text.inverse : accessibleColors.text,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {isComplete ? "✓" : index + 1}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(type.caption, settings),
                {
                  color: isCurrent ? grade3Theme.accent.lavender : accessibleColors.mutedText,
                  fontSize: 11,
                  lineHeight: 14,
                },
              ]}
            >
              {label}
            </Text>
          </View>
          </Fragment>
        );
      })}
    </View>
  );
}
