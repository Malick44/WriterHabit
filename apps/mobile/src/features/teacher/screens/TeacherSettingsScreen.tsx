import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { routes } from "@/core/navigation/routeNames";
import { colors, radius } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { SettingsRow } from "@/shared/components/forms";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";

export function TeacherSettingsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { signOut } = useAuthSession();

  const handleOpenAccessibilitySettings = useCallback(() => {
    router.push(routes.teacherAccessibilitySettings);
  }, [router]);

  const handleSignOut = useCallback(() => {
    void signOut().then(() => {
      router.replace(routes.authWelcome);
    });
  }, [router, signOut]);

  return (
    <Screen testID="teacher-settings-screen">
      <AppHeader
        showSafeArea={false}
        style={styles.header}
        subtitleKey="teacher.settings.subtitle"
        titleKey="teacher.settings.title"
        variant="transparent"
      />
      <Stack gap="lg">
        <PageSection
          subtitle={t("teacher.settings.preferencesSubtitle")}
          title={t("teacher.settings.preferencesTitle")}
        >
          <View style={styles.sectionCard}>
            <SettingsRow
              accessibilityHint={t("teacher.settings.accessibilityHint")}
              icon="accessibility-outline"
              iconBackground={colors.dashboard.primaryFixed}
              iconColor={colors.dashboard.primary}
              label={t("teacher.settings.accessibilityLabel")}
              onPress={handleOpenAccessibilitySettings}
              testID="teacher-settings-accessibility"
            />
          </View>
        </PageSection>

        <PageSection
          subtitle={t("teacher.settings.accountSubtitle")}
          title={t("teacher.settings.accountTitle")}
        >
          <Button
            accessibilityLabel={t("teacher.settings.signOutAccessibility")}
            fullWidth
            label={t("teacher.settings.signOut")}
            onPress={handleSignOut}
            testID="teacher-settings-sign-out"
            variant="danger"
          />
        </PageSection>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  sectionCard: {
    backgroundColor: colors.dashboard.surfaceLowest,
    borderColor: colors.dashboard.outlineVariant,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
});
