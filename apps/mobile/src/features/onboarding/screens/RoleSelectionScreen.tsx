import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { useI18n, type TranslationKey } from "@/i18n";
import { LoadingState } from "@/shared/components/feedback";

import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import { ONBOARDING_ROLE_OPTIONS, onboardingErrorMessageKeys, type OnboardingRole } from "../types";

const NAVY = "#083E8E";
const SELECTED_BACKGROUND = "#EEF4FF";

const roleIconNames = {
  parent: "people",
  student: "person",
  teacher: "school",
} as const satisfies Record<OnboardingRole, keyof typeof Ionicons.glyphMap>;

const roleCopyKeys = {
  parent: {
    description: "onboarding.roleSelection.parentDescription",
    hint: "onboarding.roleSelection.parentAccessibilityHint",
    label: "onboarding.roleSelection.parentLabel",
  },
  student: {
    description: "onboarding.roleSelection.studentDescription",
    hint: "onboarding.roleSelection.studentAccessibilityHint",
    label: "onboarding.roleSelection.studentLabel",
  },
  teacher: {
    description: "onboarding.roleSelection.teacherDescription",
    hint: "onboarding.roleSelection.teacherAccessibilityHint",
    label: "onboarding.roleSelection.teacherLabel",
  },
} as const satisfies Record<OnboardingRole, {
  description: TranslationKey;
  hint: TranslationKey;
  label: TranslationKey;
}>;

const nextRouteByRole = {
  parent: routes.parentHome,
  student: routes.onboardingGradeSelection,
  teacher: routes.teacherDashboard,
} as const satisfies Record<OnboardingRole, typeof routes[keyof typeof routes]>;

export function RoleSelectionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const [isCompletingRole, setIsCompletingRole] = useState(false);

  if (!onboarding.hydrated) {
    return (
      <LoadingState
        description={t("onboarding.loading.description")}
        label={t("onboarding.loading.title")}
      />
    );
  }

  const errorMessage = onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null;
  const selectedRole = onboarding.progress.role ?? "student";

  const handleContinue = async () => {
    await onboarding.setRole(selectedRole);

    if (selectedRole === "student") {
      router.push(routes.onboardingGradeSelection);
      return;
    }

    setIsCompletingRole(true);
    const result = await onboarding.completeRoleOnlyOnboarding(selectedRole);
    setIsCompletingRole(false);

    if (result.ok) {
      router.replace(nextRouteByRole[selectedRole]);
    }
  };

  return (
    <OnboardingStepFrame
      errorMessage={errorMessage}
      onPrimaryPress={() => {
        void handleContinue();
      }}
      primaryLabel={t("common.continue")}
      primaryLoading={isCompletingRole || onboarding.authOperationStatus === "loading"}
      step="role"
      subtitle={t("onboarding.roleSelection.description")}
      title={t("onboarding.roleSelection.title")}
      titleStyle={styles.title}
    >
      <View style={styles.roles}>
        {ONBOARDING_ROLE_OPTIONS.map((role) => {
          const isSelected = selectedRole === role;

          return (
            <Pressable
              accessibilityHint={t(roleCopyKeys[role].hint)}
              accessibilityLabel={t(roleCopyKeys[role].label)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              key={role}
              onPress={() => {
                void onboarding.setRole(role);
              }}
              style={[
                styles.card,
                isSelected ? styles.selectedCard : null,
              ]}
            >
              <View style={styles.avatar}>
                <Ionicons name={roleIconNames[role]} size={38} color={NAVY} />
              </View>

              <View style={styles.copy}>
                <Text style={[styles.roleLabel, isSelected ? styles.selectedLabel : null]}>
                  {t(roleCopyKeys[role].label)}
                </Text>
                <Text style={styles.roleDescription}>
                  {t(roleCopyKeys[role].description)}
                </Text>
              </View>

              <View style={[styles.checkOuter, isSelected ? styles.checkOuterSelected : null]}>
                {isSelected ? <Ionicons name="checkmark" size={24} color="#FFFFFF" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStepFrame>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: "#D8E8FF",
    borderColor: "#C5D3E3",
    borderRadius: 44,
    borderWidth: 2,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#C5CBD8",
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: "row",
    minHeight: 132,
    paddingHorizontal: 30,
    paddingVertical: 24,
  },
  checkOuter: {
    alignItems: "center",
    borderColor: "#C7CBD7",
    borderRadius: 24,
    borderWidth: 3,
    height: 48,
    justifyContent: "center",
    marginLeft: 18,
    width: 48,
  },
  checkOuterSelected: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  copy: {
    flex: 1,
    gap: 10,
    marginLeft: 34,
  },
  roleDescription: {
    color: "#343949",
    fontSize: 26,
    lineHeight: 36,
  },
  roleLabel: {
    color: "#071426",
    fontSize: 32,
    fontWeight: "400",
    lineHeight: 38,
  },
  roles: {
    gap: 28,
  },
  selectedCard: {
    backgroundColor: SELECTED_BACKGROUND,
    borderColor: NAVY,
    borderWidth: 2.5,
  },
  selectedLabel: {
    color: NAVY,
    fontWeight: "800",
  },
  title: {
    fontSize: 36,
    lineHeight: 44,
  },
});
