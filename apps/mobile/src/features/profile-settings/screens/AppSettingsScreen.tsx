import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { notificationDeliveryService } from "@/core/notifications/notificationDeliveryService";
import { routes, type AppRoute } from "@/core/navigation/routeNames";
import { colors, layout, radius, typography } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { AppHeader } from "@/shared/components/navigation";
import { SettingsRow, SettingsToggleRow, type SettingsRowIconName } from "@/shared/components/forms";
import { useTopAlert } from "@/shared/components/feedback/top-alert";
import {
  getAccessibleTextStyle,
  useAccessibilityContext,
  type AccessibilityTextSize,
} from "@/shared/utils/accessibility";

import { notificationPreferencesService } from "../services/notificationPreferencesService";

type SettingsRowConfig = {
  id: string;
  icon: SettingsRowIconName;
  iconBackground: string;
  iconColor: string;
  labelKey: TranslationKey;
  route?: AppRoute;
  valueKey?: TranslationKey;
  trailingIcon?: SettingsRowIconName;
};

const settingsColors = {
  background: colors.dashboard.background,
  error: colors.dashboard.error,
  errorContainer: colors.dashboard.errorContainer,
  onPrimaryContainer: colors.dashboard.onPrimaryContainer,
  onSecondaryContainer: colors.dashboard.onSecondaryContainer,
  outline: colors.dashboard.outline,
  outlineVariant: colors.dashboard.outlineVariant,
  primary: colors.dashboard.primary,
  primaryContainer: colors.dashboard.primaryContainer,
  primaryFixed: colors.dashboard.primaryFixed,
  secondaryContainer: colors.dashboard.secondaryContainer,
  secondaryFixed: colors.dashboard.secondaryFixed,
  surface: colors.dashboard.surface,
  surfaceContainerHigh: colors.dashboard.surfaceContainerHigh,
  surfaceLowest: colors.dashboard.surfaceLowest,
  tertiaryFixed: colors.dashboard.tertiaryFixed,
  tertiaryText: colors.dashboard.tertiaryText,
} as const;

const textSizeValueKeys = {
  default: "accessibility.textSize.defaultLabel",
  extraLarge: "accessibility.textSize.extraLargeLabel",
  large: "accessibility.textSize.largeLabel",
} as const satisfies Record<AccessibilityTextSize, TranslationKey>;

const accountRows: readonly SettingsRowConfig[] = [
  {
    id: "personal-information",
    icon: "person-circle-outline",
    iconBackground: settingsColors.primaryContainer,
    iconColor: settingsColors.onPrimaryContainer,
    labelKey: "profileSettings.settings.account.personalInformation",
    route: routes.studentEditProfile,
  },
  {
    id: "linked-accounts",
    icon: "link-outline",
    iconBackground: settingsColors.secondaryContainer,
    iconColor: settingsColors.onSecondaryContainer,
    labelKey: "profileSettings.settings.account.linkedAccounts",
    valueKey: "profileSettings.settings.account.linkedAccountsValue",
  },
  {
    id: "manage-data",
    icon: "server-outline",
    iconBackground: settingsColors.surfaceContainerHigh,
    iconColor: settingsColors.outline,
    labelKey: "profileSettings.settings.account.manageData",
  },
] as const;

const supportRows: readonly SettingsRowConfig[] = [
  {
    id: "help-center",
    icon: "help-circle-outline",
    iconBackground: settingsColors.primaryContainer,
    iconColor: settingsColors.onPrimaryContainer,
    labelKey: "profileSettings.settings.support.helpCenter",
    trailingIcon: "open-outline",
  },
  {
    id: "submit-feedback",
    icon: "chatbubble-ellipses-outline",
    iconBackground: settingsColors.secondaryContainer,
    iconColor: settingsColors.onSecondaryContainer,
    labelKey: "profileSettings.settings.support.submitFeedback",
  },
  {
    id: "privacy-policy",
    icon: "shield-checkmark-outline",
    iconBackground: settingsColors.tertiaryFixed,
    iconColor: settingsColors.tertiaryText,
    labelKey: "profileSettings.settings.support.privacyPolicy",
  },
] as const;

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const { settings } = useAccessibilityContext();

  return (
    <View style={styles.section}>
      <Text
        accessibilityRole="header"
        selectable
        style={[getAccessibleTextStyle(typography.gradeBands.middle.caption, settings), styles.sectionTitle]}
      >
        {title}
      </Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export function AppSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuthSession();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const topAlert = useTopAlert();
  const studentId = session?.user.id ?? "preview-student";
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [emailSummariesEnabled, setEmailSummariesEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    void notificationPreferencesService
      .getPreferences(studentId)
      .then((preferences) => {
        if (!active) {
          return;
        }

        setPushNotificationsEnabled(preferences.enabled);
        setEmailSummariesEnabled(preferences.weeklyReport.enabled);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [studentId]);

  const showUnavailableAlert = useCallback(() => {
    topAlert.show({
      descriptionKey: "profileSettings.settings.unavailableDescription",
      titleKey: "profileSettings.settings.unavailableTitle",
      type: "info",
    });
  }, [topAlert]);
  const showSaveErrorAlert = useCallback(() => {
    topAlert.show({
      descriptionKey: "profileSettings.saveErrorDescription",
      titleKey: "profileSettings.saveErrorTitle",
      type: "error",
    });
  }, [topAlert]);
  const handleOpenRoute = useCallback(
    (route: AppRoute) => {
      router.push(route);
    },
    [router],
  );
  const getRowPressHandler = useCallback(
    (row: SettingsRowConfig) => {
      if (!row.route) {
        return showUnavailableAlert;
      }

      const route = row.route;

      return () => handleOpenRoute(route);
    },
    [handleOpenRoute, showUnavailableAlert],
  );

  const handleTogglePush = useCallback(
    (enabled: boolean) => {
      setPushNotificationsEnabled(enabled);
      void notificationPreferencesService
        .updatePreferences(studentId, { enabled })
        .then((nextPreferences) => {
          void notificationDeliveryService
            .syncNotificationDelivery({ preferences: nextPreferences, studentId })
            .catch(() => undefined);
        })
        .catch(() => {
          setPushNotificationsEnabled(!enabled);
          showSaveErrorAlert();
        });
    },
    [showSaveErrorAlert, studentId],
  );

  const handleToggleEmailSummaries = useCallback(
    (enabled: boolean) => {
      setEmailSummariesEnabled(enabled);
      void notificationPreferencesService
        .updatePreferences(studentId, { weeklyReport: { enabled } })
        .then((nextPreferences) => {
          void notificationDeliveryService
            .syncNotificationDelivery({ preferences: nextPreferences, studentId })
            .catch(() => undefined);
        })
        .catch(() => {
          setEmailSummariesEnabled(!enabled);
          showSaveErrorAlert();
        });
    },
    [showSaveErrorAlert, studentId],
  );

  const handleLogOut = useCallback(() => {
    void signOut().then(() => {
      router.replace(routes.authWelcome);
    });
  }, [router, signOut]);

  return (
    <View style={styles.root}>
      <AppHeader
        leftAction={{
          accessibilityLabelKey: "profileSettings.settings.headerBackAccessibility",
          type: "back",
        }}
        rightActions={[
          {
            accessibilityLabelKey: "profileSettings.settings.headerSearchAccessibility",
            icon: "search",
            onPress: showUnavailableAlert,
            type: "icon",
          },
        ]}
        style={styles.header}
        titleKey="profileSettings.settings.title"
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom + 120, 144),
          },
        ]}
        showsVerticalScrollIndicator={false}
        testID="app-settings-screen"
      >
        <View style={styles.content}>
          <Section title={t("profileSettings.settings.account.title")}>
            {accountRows.map((row, index) => (
              <View key={row.id}>
                <SettingsRow
                  icon={row.icon}
                  iconBackground={row.iconBackground}
                  iconColor={row.iconColor}
                  label={t(row.labelKey)}
                  onPress={getRowPressHandler(row)}
                  value={row.valueKey ? t(row.valueKey) : undefined}
                />
                {index < accountRows.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </Section>

          <Section title={t("profileSettings.settings.notifications.title")}>
            <SettingsToggleRow
              icon="notifications-outline"
              iconBackground={settingsColors.primaryFixed}
              iconColor={settingsColors.primary}
              label={t("profileSettings.settings.notifications.push")}
              onValueChange={handleTogglePush}
              value={pushNotificationsEnabled}
            />
            <Divider />
            <SettingsToggleRow
              icon="mail-outline"
              iconBackground={settingsColors.tertiaryFixed}
              iconColor={settingsColors.tertiaryText}
              label={t("profileSettings.settings.notifications.emailSummaries")}
              onValueChange={handleToggleEmailSummaries}
              value={emailSummariesEnabled}
            />
          </Section>

          <Section title={t("profileSettings.settings.preferences.title")}>
            <SettingsRow
              icon="language-outline"
              iconBackground={settingsColors.secondaryFixed}
              iconColor={settingsColors.onSecondaryContainer}
              label={t("profileSettings.settings.preferences.appLanguage")}
              onPress={() => handleOpenRoute(routes.studentLanguageSettings)}
              value={t("profileSettings.settings.preferences.english")}
            />
            <Divider />
            <SettingsRow
              icon="text-outline"
              iconBackground={settingsColors.surfaceContainerHigh}
              iconColor={settingsColors.outline}
              label={t("profileSettings.settings.preferences.fontSize")}
              onPress={() => handleOpenRoute(routes.studentAccessibilitySettings)}
              value={t(textSizeValueKeys[settings.textSize])}
            />
            <Divider />
            <SettingsRow
              icon="volume-medium-outline"
              iconBackground={settingsColors.primaryContainer}
              iconColor={settingsColors.onPrimaryContainer}
              label={t("profileSettings.settings.preferences.coachVoice")}
              onPress={() => handleOpenRoute(routes.studentReadAloudVoiceSettings)}
            />
          </Section>

          <Section title={t("profileSettings.settings.support.title")}>
            {supportRows.map((row, index) => (
              <View key={row.id}>
                <SettingsRow
                  icon={row.icon}
                  iconBackground={row.iconBackground}
                  iconColor={row.iconColor}
                  label={t(row.labelKey)}
                  onPress={showUnavailableAlert}
                  trailingIcon={row.trailingIcon}
                />
                {index < supportRows.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </Section>

          <View style={styles.logoutSection}>
            <Pressable
              accessibilityLabel={t("profileSettings.settings.logoutAccessibility")}
              accessibilityRole="button"
              hitSlop={layout.hitSlop}
              onPress={handleLogOut}
              style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutButtonPressed : null]}
            >
              <Ionicons color={settingsColors.error} name="log-out-outline" size={22} />
              <Text style={getAccessibleTextStyle(styles.logoutText, settings)}>
                {t("profileSettings.settings.logout")}
              </Text>
            </Pressable>
            <Text style={getAccessibleTextStyle(styles.versionText, settings)}>
              {t("profileSettings.settings.version")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    gap: 32,
    maxWidth: 768,
    width: "100%",
  },
  divider: {
    backgroundColor: settingsColors.outlineVariant,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  header: {
    backgroundColor: settingsColors.surface,
    borderBottomColor: settingsColors.outlineVariant,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: settingsColors.surfaceLowest,
    borderColor: settingsColors.error,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 60,
    paddingHorizontal: 16,
  },
  logoutButtonPressed: {
    backgroundColor: settingsColors.errorContainer,
    transform: [{ scale: 0.98 }],
  },
  logoutSection: {
    gap: 24,
    marginTop: 8,
  },
  logoutText: {
    color: settingsColors.error,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  root: {
    backgroundColor: settingsColors.background,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: settingsColors.surfaceLowest,
    borderColor: settingsColors.outlineVariant,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionTitle: {
    color: settingsColors.outline,
    fontWeight: "700",
    letterSpacing: 0.6,
    paddingHorizontal: 8,
    textTransform: "uppercase",
  },
  versionText: {
    color: settingsColors.outline,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "center",
  },
});
