import { ScrollView, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { grade3Theme } from "../../theme/grade3Theme";
import { getLessonStepIndex, lessonSteps, type LessonStep } from "./lessonFlowTypes";

type LessonStepTrackerProps = {
  currentStep: LessonStep;
  furthestStepIndex: number;
};

export function LessonStepTracker({ currentStep, furthestStepIndex }: LessonStepTrackerProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const currentIndex = getLessonStepIndex(currentStep);

  return (
    <ScrollView
      accessibilityLabel={t("grade3WritingAdventure.lessonFlow.tracker.accessibility")}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.lg, paddingVertical: 0 }}
    >
      {lessonSteps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < furthestStepIndex || currentStep === "celebration";
        const label = t(`grade3WritingAdventure.lessonFlow.steps.${step}` as const);

        return (
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
            key={step}
            style={{
              alignItems: "center",
              gap: spacing.xs,
              minWidth: 52,
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
                height: 28,
                justifyContent: "center",
                width: 28,
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
                  fontSize: 12,
                  lineHeight: 16,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
