import { ScrollView, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

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
      contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
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
              backgroundColor: isCurrent
                ? "#FFE1B9"
                : isComplete
                  ? "#E9F8E9"
                  : settings.highContrast
                    ? accessibleColors.surface
                    : "#F3EBDD",
              borderColor: isCurrent ? "#D9762A" : isComplete ? colors.feedback.success.border : "#D7C7AD",
              borderRadius: radius.lg,
              borderWidth: 1,
              flexDirection: "row",
              gap: spacing.xs,
              minHeight: 48,
              paddingHorizontal: isCurrent ? spacing.lg : spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Text style={{ fontSize: isCurrent ? 22 : 18 }}>{isComplete ? "★" : index + 1}</Text>
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(isCurrent ? type.bodyStrong : type.bodySmall, settings),
                { color: accessibleColors.text },
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
