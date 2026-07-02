import { ScrollView, Text, View } from "react-native";

import { colors, spacing, typography } from "@/design/tokens";
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
              gap: 2,
              minWidth: 44,
            }}
          >
            <View
              style={{
                alignItems: "center",
                backgroundColor: isCurrent ? "#5F3DC4" : isComplete ? colors.feedback.success.border : "#EEE9F6",
                borderColor: isCurrent ? "#5F3DC4" : "#D9D0E9",
                borderRadius: 999,
                borderWidth: 1,
                height: 18,
                justifyContent: "center",
                width: 18,
              }}
            >
              <Text style={{ color: isCurrent ? "#FFFFFF" : accessibleColors.text, fontSize: 9, fontWeight: "700" }}>
                {isComplete ? "★" : index + 1}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(type.caption, settings),
                { color: isCurrent ? "#5F3DC4" : accessibleColors.mutedText, fontSize: 10, lineHeight: 13 },
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
