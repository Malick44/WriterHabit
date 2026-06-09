import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { GradeLevel } from "@writewise/shared";

import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { LoadingState } from "@/shared/components/feedback";

import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import { onboardingErrorMessageKeys, onboardingValidationMessageKeys } from "../types";

const NAVY = "#083E8E";

const gradeGroups = [
  {
    grades: [3, 4, 5],
    titleKey: "onboarding.gradeSelection.elementaryTitle",
  },
  {
    grades: [6, 7, 8],
    titleKey: "onboarding.gradeSelection.middleTitle",
  },
  {
    grades: [9, 10, 11, 12],
    titleKey: "onboarding.gradeSelection.highTitle",
  },
] as const satisfies ReadonlyArray<{
  grades: readonly GradeLevel[];
  titleKey:
    | "onboarding.gradeSelection.elementaryTitle"
    | "onboarding.gradeSelection.middleTitle"
    | "onboarding.gradeSelection.highTitle";
}>;

export function GradeSelectionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const [showValidationError, setShowValidationError] = useState(false);

  const gradeBand = onboarding.progress.gradeLevel
    ? "middle" // Default fallback band
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
      progressActiveIndex={0}
      progressStepsCount={2}
      secondaryLabel={t("common.back")}
      showProgressDots
      step="grade"
      subtitle={t("onboarding.gradeSelection.description")}
      title={t("onboarding.gradeSelection.title")}
      headerAlign="center"
      titleStyle={styles.title}
    >
      <View style={styles.groups}>
        {gradeGroups.map((group) => (
          <View key={group.titleKey} style={styles.group}>
            <Text
              accessibilityRole="header"
              selectable
              style={styles.groupTitle}
            >
              {t(group.titleKey)}
            </Text>
            <View style={styles.gradeGrid}>
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
                    style={[styles.gradeButton, isSelected ? styles.gradeButtonSelected : null]}
                  >
                    <Text style={[styles.gradeLabel, isSelected ? styles.gradeLabelSelected : null]}>
                      {t("onboarding.gradeSelection.gradeLabel", { grade })}
                    </Text>
                    {isSelected ? (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={22} color="#FFFFFF" />
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
    backgroundColor: "#FFFFFF",
    borderColor: "#C5CBD8",
    borderRadius: 12,
    borderWidth: 1.5,
    flexBasis: "30%",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 88,
    paddingHorizontal: 16,
    position: "relative",
  },
  gradeButtonSelected: {
    backgroundColor: "#D8E8FF",
    borderColor: NAVY,
    borderWidth: 2.5,
  },
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
  },
  gradeLabel: {
    color: "#071426",
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
    color: "#071426",
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
