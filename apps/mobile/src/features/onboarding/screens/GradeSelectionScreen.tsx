import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors, palette, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { LoadingState } from "@/shared/components/feedback";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import { GRADE_GROUPS, onboardingErrorMessageKeys, onboardingValidationMessageKeys } from "../types";

const NAVY = colors.onboarding.navy;

export function GradeSelectionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const [showValidationError, setShowValidationError] = useState(false);
  const { settings } = useAccessibilityContext();

  const gradeBand = onboarding.progress.gradeLevel
    ? typography.getGradeBandForGrade(onboarding.progress.gradeLevel)
    : "middle";

  if (!onboarding.hydrated) {
    return (
      <LoadingState
        description={t("onboarding.loading.description")}
        label={t("onboarding.loading.title")}
      />
    );
  }

  const validationMessage =
    showValidationError && !onboarding.progress.gradeLevel
      ? t(onboardingValidationMessageKeys.grade_required)
      : null;
  const errorMessage = validationMessage ?? (onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null);

  return (
    <OnboardingStepFrame
      errorMessage={errorMessage}
      gradeBand={gradeBand}
      onPrimaryPress={() => {
        if (!onboarding.progress.gradeLevel) {
          setShowValidationError(true);
          return;
        }

        router.push(routes.onboardingWritingGoals);
      }}
      onSecondaryPress={() => {
        router.back();
      }}
      primaryLabel={t("common.continue")}
      secondaryLabel={t("common.back")}
      showProgressDots
      step="grade"
      subtitle={t("onboarding.gradeSelection.description")}
      title={t("onboarding.gradeSelection.title")}
      headerAlign="center"
      titleStyle={styles.title}
    >
      <View style={styles.groups}>
        {GRADE_GROUPS.map((group) => (
          <View key={group.titleKey} style={styles.group}>
            <Text
              accessibilityRole="header"
              selectable
              style={getAccessibleTextStyle(styles.groupTitle, settings)}
            >
              {t(group.titleKey)}
            </Text>
            <View accessibilityRole="radiogroup" style={styles.gradeGrid}>
              {group.grades.map((grade) => {
                const isSelected = onboarding.progress.gradeLevel === grade;
                return (
                  <Pressable
                    accessibilityHint={t("onboarding.gradeSelection.gradeAccessibilityHint", { grade })}
                    accessibilityLabel={t("onboarding.gradeSelection.gradeLabel", { grade })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    key={grade}
                    onPress={() => {
                      setShowValidationError(false);
                      void onboarding.setGradeLevel(grade);
                    }}
                    style={({ pressed }) => [
                      styles.gradeButton,
                      isSelected ? styles.gradeButtonSelected : null,
                      pressed ? styles.gradeButtonPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        getAccessibleTextStyle(styles.gradeLabel, settings),
                        isSelected ? styles.gradeLabelSelected : null,
                      ]}
                    >
                      {t("onboarding.gradeSelection.gradeLabel", { grade })}
                    </Text>
                    {isSelected ? (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={22} color={palette.white} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </OnboardingStepFrame>
  );
}

const styles = StyleSheet.create({
  gradeButton: {
    alignItems: "center",
    backgroundColor: colors.onboarding.surface,
    borderColor: colors.onboarding.cardBorder,
    borderRadius: 12,
    borderWidth: 1.5,
    flexBasis: "30%",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 88,
    paddingHorizontal: 16,
    position: "relative",
  },
  gradeButtonPressed: {
    opacity: 0.78,
  },
  gradeButtonSelected: {
    backgroundColor: colors.onboarding.iconBubble,
    borderColor: NAVY,
    borderWidth: 2.5,
  },
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
  },
  gradeLabel: {
    color: colors.onboarding.ink,
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 30,
    textAlign: "center",
  },
  gradeLabelSelected: {
    color: NAVY,
    fontWeight: "800",
  },
  group: {
    gap: 22,
  },
  groupTitle: {
    color: colors.onboarding.ink,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  groups: {
    gap: 54,
  },
  selectedBadge: {
    alignItems: "center",
    backgroundColor: NAVY,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: -14,
    top: -14,
    width: 36,
  },
  title: {
    fontSize: 36,
    lineHeight: 44,
  },
});
