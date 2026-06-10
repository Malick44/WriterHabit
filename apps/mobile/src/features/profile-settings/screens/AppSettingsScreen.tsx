import { useCallback, useState, type ComponentProps, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { routes, type AppRoute } from "@/core/navigation/routeNames";
import { layout, radius, spacing, typography } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { AppHeader } from "@/shared/components/navigation";
import { useTopAlert } from "@/shared/components/feedback/top-alert";
import {
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

type IconName = ComponentProps<typeof Ionicons>["name"];
type AppearanceMode = "light" | "dark";

type SettingsRowConfig = {
  id: string;
  icon: IconName;
  iconBackground: string;
  iconColor: string;
  labelKey: TranslationKey;
  route?: AppRoute;
  valueKey?: TranslationKey;
  trailingIcon?: IconName;
};

const settingsColors = {
  background: "#F8F9FF",
  border: "#C3C6D5",
  error: "#BA1A1A",
  errorContainer: "#FFDAD6",
  onPrimary: "#FFFFFF",
  onPrimaryContainer: "#A5BDFF",
  onSecondaryContainer: "#00714D",
  onSurface: "#0B1C30",
  onSurfaceVariant: "#434653",
  outline: "#737784",
  outlineVariant: "#C3C6D5",
  primary: "#00327D",
  primaryContainer: "#0047AB",
  primaryFixed: "#DAE2FF",
  secondary: "#006C49",
  secondaryContainer: "#6CF8BB",
  secondaryFixed: "#6FFBBE",
  surface: "#F8F9FF",
  surfaceContainer: "#E5EEFF",
  surfaceContainerHigh: "#DCE9FF",
  surfaceContainerHighest: "#D3E4FE",
  surfaceContainerLow: "#EFF4FF",
  surfaceLowest: "#FFFFFF",
  tertiaryFixed: "#FFDDB8",
  tertiaryText: "#653E00",
} as const;

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

const preferenceRows: readonly SettingsRowConfig[] = [
  {
    id: "app-language",
    icon: "language-outline",
    iconBackground: settingsColors.secondaryFixed,
    iconColor: settingsColors.onSecondaryContainer,
    labelKey: "profileSettings.settings.preferences.appLanguage",
    route: routes.studentLanguageSettings,
    valueKey: "profileSettings.settings.preferences.english",
  },
  {
    id: "font-size",
    icon: "text-outline",
    iconBackground: settingsColors.surfaceContainerHigh,
    iconColor: settingsColors.outline,
    labelKey: "profileSettings.settings.preferences.fontSize",
    valueKey: "profileSettings.settings.preferences.medium",
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

function IconBadge({
  backgroundColor,
  color,
  icon,
}: {
  backgroundColor: string;
  color: string;
  icon: IconName;
}) {
  return (
    <View style={[styles.iconBadge, { backgroundColor }]}>
      <Ionicons color={color} name={icon} size={22} />
    </View>
  );
}

function SettingsRow({
  icon,
  iconBackground,
  iconColor,
  label,
  onPress,
  trailingIcon = "chevron-forward",
  value,
}: {
  icon: IconName;
  iconBackground: string;
  iconColor: string;
  label: string;
  onPress: () => void;
  trailingIcon?: IconName;
  value?: string;
}) {
  const { settings } = useAccessibilityContext();
  const minimumTouchTarget = getMinimumTouchTarget(settings);

  return (
    <Pressable
      accessibilityHint={label}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityRole="button"
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { minHeight: Math.max(64, minimumTouchTarget + spacing.lg) },
        pressed ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.rowLabel}>
        <IconBadge backgroundColor={iconBackground} color={iconColor} icon={icon} />
        <Text
          numberOfLines={2}
          selectable
          style={[getAccessibleTextStyle(typography.gradeBands.middle.body, settings), styles.rowTitle]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.rowTrailing}>
        {value ? (
          <Text
            numberOfLines={1}
            selectable
            style={[getAccessibleTextStyle(typography.gradeBands.middle.caption, settings), styles.rowValue]}
          >
            {value}
          </Text>
        ) : null}
        <Ionicons color={settingsColors.outlineVariant} name={trailingIcon} size={22} />
      </View>
    </Pressable>
  );
}

function ToggleRow({
  icon,
  iconBackground,
  iconColor,
  label,
  onValueChange,
  value,
}: {
  icon: IconName;
  iconBackground: string;
  iconColor: string;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  const { settings } = useAccessibilityContext();
  const minimumTouchTarget = getMinimumTouchTarget(settings);

  return (
    <View
      accessibilityLabel={label}
      accessible
      style={[styles.row, { minHeight: Math.max(64, minimumTouchTarget + spacing.lg) }]}
    >
      <View style={styles.rowLabel}>
        <IconBadge backgroundColor={iconBackground} color={iconColor} icon={icon} />
        <Text
          numberOfLines={2}
          selectable
          style={[getAccessibleTextStyle(typography.gradeBands.middle.body, settings), styles.rowTitle]}
        >
          {label}
        </Text>
      </View>
      <Switch
        accessibilityLabel={label}
        ios_backgroundColor={settingsColors.outlineVariant}
        onValueChange={onValueChange}
        thumbColor={settingsColors.surfaceLowest}
        trackColor={{
          false: settingsColors.outlineVariant,
          true: settingsColors.primary,
        }}
        value={value}
      />
    </View>
  );
}

function AppearanceControl({
  mode,
  onSelect,
}: {
  mode: AppearanceMode;
  onSelect: (mode: AppearanceMode) => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();

  return (
    <View style={styles.appearanceControl}>
      {(["light", "dark"] as const).map((option) => {
        const selected = mode === option;
        const label =
          option === "light"
            ? t("profileSettings.settings.preferences.light")
            : t("profileSettings.settings.preferences.dark");

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            hitSlop={getAccessibleHitSlop(settings)}
            key={option}
            onPress={() => onSelect(option)}
            style={({ pressed }) => [
              styles.appearanceOption,
              selected ? styles.appearanceOptionSelected : null,
              pressed ? styles.appearanceOptionPressed : null,
            ]}
          >
            <Ionicons
              color={selected ? settingsColors.onPrimary : settingsColors.onSurfaceVariant}
              name={option === "light" ? "sunny-outline" : "moon-outline"}
              size={16}
            />
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(typography.gradeBands.middle.caption, settings),
                selected ? styles.appearanceTextSelected : styles.appearanceText,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AppearanceRow({
  mode,
  onSelect,
}: {
  mode: AppearanceMode;
  onSelect: (mode: AppearanceMode) => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const minimumTouchTarget = getMinimumTouchTarget(settings);

  return (
    <View style={[styles.row, { minHeight: Math.max(72, minimumTouchTarget + spacing.xl) }]}>
      <View style={styles.rowLabel}>
        <IconBadge
          backgroundColor={settingsColors.surfaceContainerHighest}
          color={settingsColors.onSurfaceVariant}
          icon="color-palette-outline"
        />
        <Text
          numberOfLines={2}
          selectable
          style={[getAccessibleTextStyle(typography.gradeBands.middle.body, settings), styles.rowTitle]}
        >
          {t("profileSettings.settings.preferences.appearance")}
        </Text>
      </View>
      <AppearanceControl mode={mode} onSelect={onSelect} />
    </View>
  );
}

export function AppSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthSession();
  const { t } = useI18n();
  const topAlert = useTopAlert();
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [emailSummariesEnabled, setEmailSummariesEnabled] = useState(false);
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>("light");

  const showUnavailableAlert = useCallback(() => {
    topAlert.show({
      descriptionKey: "profileSettings.settings.unavailableDescription",
      titleKey: "profileSettings.settings.unavailableTitle",
      type: "info",
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
            <ToggleRow
              icon="notifications-outline"
              iconBackground={settingsColors.primaryFixed}
              iconColor={settingsColors.primary}
              label={t("profileSettings.settings.notifications.push")}
              onValueChange={setPushNotificationsEnabled}
              value={pushNotificationsEnabled}
            />
            <Divider />
            <ToggleRow
              icon="mail-outline"
              iconBackground={settingsColors.tertiaryFixed}
              iconColor={settingsColors.tertiaryText}
              label={t("profileSettings.settings.notifications.emailSummaries")}
              onValueChange={setEmailSummariesEnabled}
              value={emailSummariesEnabled}
            />
          </Section>

          <Section title={t("profileSettings.settings.preferences.title")}>
            <AppearanceRow mode={appearanceMode} onSelect={setAppearanceMode} />
            <Divider />
            {preferenceRows.map((row, index) => (
              <View key={row.id}>
                <SettingsRow
                  icon={row.icon}
                  iconBackground={row.iconBackground}
                  iconColor={row.iconColor}
                  label={t(row.labelKey)}
                  onPress={getRowPressHandler(row)}
                  value={row.valueKey ? t(row.valueKey) : undefined}
                />
                {index < preferenceRows.length - 1 ? <Divider /> : null}
              </View>
            ))}
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
              <Text style={styles.logoutText}>{t("profileSettings.settings.logout")}</Text>
            </Pressable>
            <Text style={styles.versionText}>{t("profileSettings.settings.version")}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appearanceControl: {
    alignItems: "center",
    backgroundColor: settingsColors.surfaceContainer,
    borderColor: settingsColors.outlineVariant,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  appearanceOption: {
    alignItems: "center",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 10,
  },
  appearanceOptionPressed: {
    opacity: 0.76,
  },
  appearanceOptionSelected: {
    backgroundColor: settingsColors.primary,
  },
  appearanceText: {
    color: settingsColors.onSurfaceVariant,
    fontWeight: "600",
  },
  appearanceTextSelected: {
    color: settingsColors.onPrimary,
    fontWeight: "700",
  },
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
  iconBadge: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
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
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowLabel: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 16,
    minWidth: 0,
  },
  rowPressed: {
    backgroundColor: settingsColors.surfaceContainerLow,
  },
  rowTitle: {
    color: settingsColors.onSurface,
    flex: 1,
  },
  rowTrailing: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    maxWidth: "46%",
  },
  rowValue: {
    color: settingsColors.outline,
    flexShrink: 1,
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
