import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { DemoUserId } from "@/core/auth/authTypes";
import { demoUsers } from "@/core/auth/demoUsers";
import { colors, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { ChoiceCard } from "@/shared/components/forms";
import { Stack } from "@/shared/components/layout";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

type DemoUserPanelProps = {
  disabled?: boolean;
  onSelectDemoUser: (demoUserId: DemoUserId) => Promise<void> | void;
};

const defaultDemoUserId: DemoUserId = "middle_school_student";

export function DemoUserPanel({ disabled = false, onSelectDemoUser }: DemoUserPanelProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.middle;
  const [selectedDemoUserId, setSelectedDemoUserId] = useState<DemoUserId>(defaultDemoUserId);

  const selectedDemoUser = useMemo(
    () => demoUsers.find((user) => user.id === selectedDemoUserId) ?? demoUsers[0],
    [selectedDemoUserId],
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

        <Stack gap="sm">
          {demoUsers.map((demoUser) => (
            <ChoiceCard
              accessibilityHint={t("auth.demoUsers.optionHint")}
              accessibilityLabel={t(demoUser.accessibilityKey)}
              disabled={disabled}
              key={demoUser.id}
              label={t(demoUser.labelKey)}
              description={t(demoUser.descriptionKey)}
              onPress={() => {
                setSelectedDemoUserId(demoUser.id);
              }}
              selected={demoUser.id === selectedDemoUserId}
              testID={`demo-user-option-${demoUser.id}`}
            />
          ))}
        </Stack>

        <Button
          disabled={disabled}
          fullWidth
          label={t("auth.demoUsers.signInCta", { user: t(selectedDemoUser.labelKey) })}
          onPress={() => {
            void onSelectDemoUser(selectedDemoUser.id);
          }}
          testID="demo-user-sign-in-button"
          variant="secondary"
        />
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
});
