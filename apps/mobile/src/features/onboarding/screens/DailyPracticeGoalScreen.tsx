import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { LoadingState } from "@/shared/components/feedback";

import { dailyPracticeCopyKeys } from "../constants";
import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  type DailyPracticeMinutes,
  onboardingErrorMessageKeys,
  onboardingValidationMessageKeys,
} from "../types";

const NAVY = "#083E8E";
const SCREEN_BACKGROUND = "#F8FAFF";
const visibleDailyPracticeOptions = [5, 10, 15, 20] as const satisfies readonly DailyPracticeMinutes[];

const iconByMinutes: Record<DailyPracticeMinutes, keyof typeof Ionicons.glyphMap> = {
  5: "stopwatch-outline",
  10: "alarm-outline",
  15: "checkmark-circle-outline",
  20: "ribbon-outline",
  30: "time-outline",
};

export function DailyPracticeGoalScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const [showValidationError, setShowValidationError] = useState(false);

  const gradeBand = "middle";
  const selectedMinutes = onboarding.progress.dailyPracticeMinutes ?? 10;

  if (!onboarding.hydrated) {
    return (
      <LoadingState
        description={t("onboarding.loading.description")}
        label={t("onboarding.loading.title")}
      />
    );
  }

  const validationMessage =
    showValidationError && !onboarding.progress.dailyPracticeMinutes
      ? t(onboardingValidationMessageKeys.daily_practice_required)
      : null;

  const errorMessage =
    validationMessage ??
    (onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null);

  return (
    <OnboardingStepFrame
      errorMessage={errorMessage}
      gradeBand={gradeBand}
      onPrimaryPress={() => {
        void (async () => {
          if (!selectedMinutes) {
            setShowValidationError(true);
            return;
          }

          await onboarding.setDailyPracticeMinutes(selectedMinutes);
          router.push(routes.onboardingPlanSummary);
        })();
      }}
      onSecondaryPress={() => router.back()}
      backgroundColor={SCREEN_BACKGROUND}
      footerStyle={{ backgroundColor: SCREEN_BACKGROUND }}
      primaryLabel={t("common.continue")}
      secondaryLabel={t("common.back")}
      step="dailyPractice"
      subtitle={t("onboarding.dailyPracticeGoal.description")}
      title={t("onboarding.dailyPracticeGoal.title")}
      contentStyle={styles.frameContent}
      primaryButtonStyle={{
        backgroundColor: NAVY,
        borderColor: NAVY,
        borderRadius: 999,
        minHeight: 62,
      }}
      titleStyle={styles.title}
      subtitleStyle={styles.subtitle}
    >
      <View style={styles.options}>
        {visibleDailyPracticeOptions.map((minutes) => {
          const isSelected = selectedMinutes === minutes;
          const iconName = iconByMinutes[minutes] ?? "time-outline";

          return (
            <Pressable
              key={minutes}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityHint={t("onboarding.dailyPracticeGoal.dailyGoalAccessibilityHint")}
              onPress={() => {
                setShowValidationError(false);
                void onboarding.setDailyPracticeMinutes(minutes);
              }}
              style={[
                styles.card,
                {
                  borderColor: isSelected ? NAVY : "#C5CBD8",
                  backgroundColor: isSelected ? "#F8FBFF" : "#FFFFFF",
                  shadowOpacity: isSelected ? 0.14 : 0.05,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: "#E0ECFF",
                  },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={34}
                  color={NAVY}
                />
              </View>

              <View style={styles.copy}>
                <Text style={styles.cardTitle}>
                  {t(dailyPracticeCopyKeys[minutes].label)}
                </Text>
                <Text style={styles.cardDescription}>
                  {t(dailyPracticeCopyKeys[minutes].description)}
                </Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  {
                    backgroundColor: isSelected ? NAVY : "#FFFFFF",
                    borderColor: isSelected ? NAVY : "#C7CBD7",
                  },
                ]}
              >
                {isSelected ? null : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStepFrame>
  );
}

const styles = StyleSheet.create({
  frameContent: {
    gap: 0,
  },
  title: {
    color: NAVY,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
  },
  subtitle: {
    color: "#333949",
    fontSize: 21,
    lineHeight: 30,
  },
  options: {
    gap: 32,
    marginTop: 8,
  },
  card: {
    minHeight: 126,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 30,
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 2,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    marginLeft: 30,
  },
  cardTitle: {
    color: "#071426",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "700",
  },
  cardDescription: {
    color: "#343949",
    fontSize: 24,
    lineHeight: 31,
    marginTop: 3,
  },
  radioOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});
