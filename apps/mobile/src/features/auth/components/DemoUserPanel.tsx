import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { DemoUserId } from "@/core/auth/authTypes";
import { demoUsers } from "@/core/auth/demoUsers";
import { colors, radius, spacing, typography } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { ChoiceCard } from "@/shared/components/forms";
import { Stack } from "@/shared/components/layout";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

export type DemoPanelPreviewOption = {
  id: string;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  accessibilityKey: TranslationKey;
};

type DemoUserPanelProps = {
  disabled?: boolean;
  onSelectDemoUser: (demoUserId: DemoUserId) => Promise<void> | void;
  onboardingPreviewOptions?: readonly DemoPanelPreviewOption[];
  onSelectOnboardingPreview?: (targetId: string) => Promise<void> | void;
};

export function DemoUserPanel({
  disabled = false,
  onSelectDemoUser,
  onboardingPreviewOptions = [],
  onSelectOnboardingPreview,
}: DemoUserPanelProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.middle;
  const [selectedPreviewId, setSelectedPreviewId] = useState(onboardingPreviewOptions[0]?.id ?? "");

  const selectedPreview = useMemo(
    () => onboardingPreviewOptions.find((option) => option.id === selectedPreviewId) ?? onboardingPreviewOptions[0],
    [onboardingPreviewOptions, selectedPreviewId],
  );

  if (!__DEV__) {
    return null;
  }

  return (
    <View
      accessibilityLabel={t("auth.demoUsers.panelAccessibility")}
      style={[
        styles.container,
        {
          backgroundColor: accessibleColors.surface,
          borderColor: accessibleColors.border,
        },
      ]}
      testID="demo-user-panel"
    >
      <Stack gap="md">
        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            selectable
            style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}
          >
            {t("auth.demoUsers.title")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), styles.devBadge]}>
            {t("auth.demoUsers.devOnlyBadge")}
          </Text>
        </View>

        <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
          {t("auth.demoUsers.description")}
        </Text>

        <Stack gap="sm" style={styles.optionList}>
          {demoUsers.map((demoUser) => (
            <ChoiceCard
              accessibilityHint={t("auth.demoUsers.optionHint")}
              accessibilityLabel={t(demoUser.accessibilityKey)}
              disabled={disabled}
              key={demoUser.id}
              label={t(demoUser.labelKey)}
              description={t(demoUser.descriptionKey)}
              onPress={() => {
                void onSelectDemoUser(demoUser.id);
              }}
              selected={false}
              testID={`demo-user-option-${demoUser.id}`}
            />
          ))}
        </Stack>

        {selectedPreview && onSelectOnboardingPreview ? (
          <View style={[styles.previewSection, { borderColor: accessibleColors.border }]}>
            <Stack gap="md">
              <View style={styles.sectionHeader}>
                <Text
                  accessibilityRole="header"
                  selectable
                  style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}
                >
                  {t("auth.demoUsers.onboardingTitle")}
                </Text>
                <Text
                  selectable
                  style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}
                >
                  {t("auth.demoUsers.onboardingSubtitle")}
                </Text>
              </View>

              <Text
                selectable
                style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
              >
                {t("auth.demoUsers.onboardingDescription")}
              </Text>

              <Stack gap="sm" style={styles.optionList}>
                {onboardingPreviewOptions.map((option) => (
                  <ChoiceCard
                    accessibilityHint={t("auth.demoUsers.onboardingOptionHint")}
                    accessibilityLabel={t(option.accessibilityKey)}
                    disabled={disabled}
                    key={option.id}
                    label={t(option.labelKey)}
                    description={t(option.descriptionKey)}
                    onPress={() => {
                      setSelectedPreviewId(option.id);
                    }}
                    selected={option.id === selectedPreview.id}
                    testID={`onboarding-preview-option-${option.id}`}
                  />
                ))}
              </Stack>

              <Button
                disabled={disabled}
                fullWidth
                label={t("auth.demoUsers.openOnboardingCta", { screen: t(selectedPreview.labelKey) })}
                onPress={() => {
                  void onSelectOnboardingPreview(selectedPreview.id);
                }}
                testID="open-onboarding-preview-button"
                variant="secondary"
              />
            </Stack>
          </View>
        ) : null}
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    width: "100%",
  },
  devBadge: {
    backgroundColor: colors.feedback.warning.background,
    borderColor: colors.feedback.warning.border,
    borderRadius: radius.full,
    borderWidth: 1,
    color: colors.feedback.warning.text,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  optionList: {
    width: "100%",
  },
  previewSection: {
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
});
