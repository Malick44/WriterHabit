import { useCallback, type ComponentProps, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { routes, type AppRoute } from "@/core/navigation/routeNames";
import { colors, layout, radius, shadows, spacing, typography } from "@/design/tokens";
import { useProgressDashboard } from "@/features/progress/hooks/useProgress";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { useTopAlert } from "@/shared/components/feedback/top-alert";
import { PageSection } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import {
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

type IconName = ComponentProps<typeof Ionicons>["name"];

const profileColors = {
  background: colors.dashboard.background,
  error: colors.dashboard.error,
  errorContainer: colors.dashboard.errorContainer,
  glass: colors.dashboard.glass,
  onErrorContainer: colors.dashboard.onErrorContainer,
  onPrimaryContainer: colors.dashboard.onPrimaryContainer,
  onSecondary: colors.dashboard.onSecondary,
  onSecondaryContainer: colors.dashboard.onSecondaryContainer,
  onSurface: colors.dashboard.onSurface,
  onSurfaceVariant: colors.dashboard.onSurfaceVariant,
  outline: colors.dashboard.outline,
  outlineVariant: colors.dashboard.outlineVariant,
  primary: colors.dashboard.primary,
  primaryContainer: colors.dashboard.primaryContainer,
  secondary: colors.dashboard.secondary,
  secondaryContainer: colors.dashboard.secondaryContainer,
  surfaceContainerHigh: colors.dashboard.surfaceContainerHigh,
  surfaceContainerHighest: colors.dashboard.surfaceContainerHighest,
  surfaceContainerLow: colors.dashboard.surfaceContainerLow,
  surfaceLowest: colors.dashboard.surfaceLowest,
} as const;

const achievements = [
  {
    backgroundColor: profileColors.secondaryContainer,
    foregroundColor: profileColors.onSecondaryContainer,
    icon: "ribbon-outline",
    labelKey: "profileSettings.profile.achievements.earlyBird",
  },
  {
    backgroundColor: profileColors.primaryContainer,
    foregroundColor: profileColors.onPrimaryContainer,
    icon: "reader-outline",
    labelKey: "profileSettings.profile.achievements.words1k",
  },
  {
    backgroundColor: profileColors.surfaceContainerHighest,
    foregroundColor: profileColors.outline,
    icon: "medal-outline",
    labelKey: "profileSettings.profile.achievements.topTen",
  },
  {
    backgroundColor: profileColors.surfaceContainerHighest,
    foregroundColor: profileColors.outline,
    icon: "sparkles-outline",
    labelKey: "profileSettings.profile.achievements.perfectScore",
  },
] as const satisfies readonly {
  backgroundColor: string;
  foregroundColor: string;
  icon: IconName;
  labelKey: TranslationKey;
}[];

const accountRows = [
  {
    icon: "person-outline",
    labelKey: "profileSettings.profile.account.editProfile",
    route: routes.studentEditProfile,
  },
  {
    icon: "flag-outline",
    labelKey: "profileSettings.profile.account.manageGoals",
    route: routes.studentWritingGoals,
  },
  {
    icon: "notifications-outline",
    labelKey: "profileSettings.profile.account.notifications",
    route: routes.studentNotificationSettings,
  },
] as const satisfies readonly { icon: IconName; labelKey: TranslationKey; route: AppRoute }[];

const supportRows = [
  {
    icon: "help-circle-outline",
    labelKey: "profileSettings.profile.support.helpCenter",
  },
  {
    icon: "information-circle-outline",
    labelKey: "profileSettings.profile.support.about",
  },
] as const satisfies readonly { icon: IconName; labelKey: TranslationKey }[];

function SectionCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Card contentStyle={styles.cardContent} style={[styles.glassCard, style]}>
      {children}
    </Card>
  );
}

function ProfileStat({
  accessibilityLabel,
  color,
  divider,
  icon,
  label,
  value,
}: {
  accessibilityLabel: string;
  color: string;
  divider?: boolean;
  icon: IconName;
  label: string;
  value: string;
}) {
  const { settings } = useAccessibilityContext();

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessible
      style={[styles.statItem, divider ? styles.statDivider : null]}
    >
      <Ionicons color={color} name={icon} size={24} />
      <Text
        numberOfLines={1}
        selectable
        style={[
          getAccessibleTextStyle(typography.gradeBands.middle.caption, settings),
          styles.centerText,
          { color: profileColors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        selectable
        style={[
          getAccessibleTextStyle(typography.gradeBands.middle.title, settings),
          styles.centerText,
          { color },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function AchievementBadge({
  backgroundColor,
  foregroundColor,
  icon,
  label,
}: {
  backgroundColor: string;
  foregroundColor: string;
  icon: IconName;
  label: string;
}) {
  const { settings } = useAccessibilityContext();

  return (
    <View accessibilityLabel={label} accessible style={styles.achievementItem}>
      <View style={[styles.achievementIcon, { backgroundColor }]}>
        <Ionicons color={foregroundColor} name={icon} size={24} />
      </View>
      <Text
        numberOfLines={2}
        selectable
        style={[
          getAccessibleTextStyle(typography.gradeBands.middle.caption, settings),
          styles.achievementLabel,
          { color: profileColors.onSurface },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ProfileListRow({
  icon,
  label,
  onPress,
  rightAccessory,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  rightAccessory?: ReactNode;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const minTouchTarget = getMinimumTouchTarget(settings);

  if (!onPress) {
    return (
      <View
        accessibilityLabel={rightAccessory ? undefined : label}
        accessible={!rightAccessory}
        style={[styles.listRow, { minHeight: minTouchTarget + spacing.md }]}
      >
        <View style={styles.listRowLabel}>
          <Ionicons color={profileColors.primary} name={icon} size={24} />
          <Text
            numberOfLines={2}
            selectable
            style={[
              getAccessibleTextStyle(typography.gradeBands.middle.label, settings),
              styles.rowText,
              { color: profileColors.onSurface },
            ]}
          >
            {label}
          </Text>
        </View>
        {rightAccessory}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={t("profileSettings.profile.rowHint")}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={layout.hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        { minHeight: minTouchTarget + spacing.md },
        pressed ? styles.listRowPressed : null,
      ]}
    >
      <View style={styles.listRowLabel}>
        <Ionicons color={profileColors.primary} name={icon} size={24} />
        <Text
          numberOfLines={2}
          selectable
          style={[
            getAccessibleTextStyle(typography.gradeBands.middle.label, settings),
            styles.rowText,
            { color: profileColors.onSurface },
          ]}
        >
          {label}
        </Text>
      </View>
      {rightAccessory ?? <Ionicons color={profileColors.outlineVariant} name="chevron-forward" size={22} />}
    </Pressable>
  );
}

export function StudentProfileScreen() {
  const { session, signOut } = useAuthSession();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useAccessibilityContext();
  const topAlert = useTopAlert();
  const progressState = useProgressDashboard();
  const progressViewModel =
    progressState.status === "success" || progressState.status === "empty" ? progressState.viewModel : null;
  const profileName = session?.user.displayName ?? t("profileSettings.profile.defaultName");
  const profileGrade = session?.user.gradeLevel ?? 5;
  const profileInitial = profileName.trim().slice(0, 1).toUpperCase() || "A";
  const showUnavailableAlert = useCallback(() => {
    topAlert.show({
      descriptionKey: "profileSettings.settings.unavailableDescription",
      titleKey: "profileSettings.settings.unavailableTitle",
      type: "info",
    });
  }, [topAlert]);
  const handleOpenSettings = useCallback(() => {
    router.push(routes.studentSettings);
  }, [router]);
  const handleOpenRoute = useCallback(
    (route: AppRoute) => {
      router.push(route);
    },
    [router],
  );
  const handleLogOut = useCallback(() => {
    void signOut().then(() => {
      router.replace(routes.authWelcome);
    });
  }, [router, signOut]);

  const stats = progressViewModel
    ? ([
      {
        accessibilityLabel: t("profileSettings.profile.stats.assignmentsAccessibility", {
          value: progressViewModel.totals.assignmentsCompleted,
        }),
        color: profileColors.primary,
        icon: "document-text-outline",
        label: t("profileSettings.profile.stats.assignments"),
        value: String(progressViewModel.totals.assignmentsCompleted),
      },
      {
        accessibilityLabel: t("profileSettings.profile.stats.wordsAccessibility", {
          value: progressViewModel.totals.wordsWritten,
        }),
        color: profileColors.primary,
        icon: "create-outline",
        label: t("profileSettings.profile.stats.words"),
        value: progressViewModel.totals.wordsWritten.toLocaleString("en-US"),
      },
      {
        accessibilityLabel: t("profileSettings.profile.stats.streakAccessibility", {
          value: progressViewModel.streak.currentDays,
        }),
        color: profileColors.secondary,
        icon: "flame",
        label: t("profileSettings.profile.stats.streak"),
        value: t("profileSettings.profile.stats.streakValue", {
          count: progressViewModel.streak.currentDays,
        }),
      },
    ] as const satisfies readonly {
      accessibilityLabel: string;
      color: string;
      icon: IconName;
      label: string;
      value: string;
    }[])
    : null;

  return (
    <View style={styles.root}>
      <AppHeader
        leftAction={{
          accessibilityLabelKey: "profileSettings.profile.headerBackAccessibility",
          type: "back",
        }}
        rightActions={[
          {
            accessibilityLabelKey: "profileSettings.profile.headerSettingsAccessibility",
            icon: "settings-outline",
            onPress: handleOpenSettings,
            type: "icon",
          },
        ]}
        style={styles.header}
        titleKey="profileSettings.studentProfileTitle"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom + 112, 136),
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        testID="student-profile-screen"
      >
        <View style={styles.content}>
          <View style={styles.profileHero}>
            <View style={styles.avatarWrap}>
              <View
                accessibilityLabel={t("profileSettings.profile.avatarAccessibility", { name: profileName })}
                accessible
                style={styles.avatarFrame}
              >
                <View style={styles.avatarFallback}>
                  <Text
                    style={[
                      getAccessibleTextStyle(typography.gradeBands.middle.heading, settings),
                      { color: profileColors.primary },
                    ]}
                  >
                    {profileInitial}
                  </Text>
                </View>
              </View>
              <View
                accessibilityLabel={t("profileSettings.profile.verifiedAccessibility")}
                accessible
                style={styles.verifiedBadge}
              >
                <Ionicons color={profileColors.onSecondary} name="checkmark-circle" size={18} />
              </View>
            </View>

            <View style={styles.profileIdentity}>
              <Text
                accessibilityRole="header"
                selectable
                style={[
                  getAccessibleTextStyle(typography.gradeBands.middle.heading, settings),
                  styles.profileName,
                ]}
              >
                {profileName}
              </Text>
              <View style={styles.gradePill}>
                <Text
                  numberOfLines={1}
                  selectable
                  style={[
                    getAccessibleTextStyle(typography.gradeBands.middle.caption, settings),
                    styles.gradePillText,
                  ]}
                >
                  {t("profileSettings.profile.gradeBadge", { grade: profileGrade })}
                </Text>
              </View>
            </View>
          </View>

          {stats ? (
            <SectionCard>
              <View style={styles.statsGrid}>
                {stats.map((stat, index) => (
                  <ProfileStat
                    accessibilityLabel={stat.accessibilityLabel}
                    color={stat.color}
                    divider={index === 1}
                    icon={stat.icon}
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                  />
                ))}
              </View>
            </SectionCard>
          ) : null}

          <PageSection style={styles.section} title={t("profileSettings.profile.achievementsTitle")}>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <AchievementBadge
                  backgroundColor={achievement.backgroundColor}
                  foregroundColor={achievement.foregroundColor}
                  icon={achievement.icon}
                  key={achievement.labelKey}
                  label={t(achievement.labelKey)}
                />
              ))}
            </View>
          </PageSection>

          <PageSection style={styles.section} title={t("profileSettings.profile.accountTitle")}>
            <View style={styles.listStack}>
              {accountRows.map((row) => (
                <ProfileListRow
                  icon={row.icon}
                  key={row.labelKey}
                  label={t(row.labelKey)}
                  onPress={() => handleOpenRoute(row.route)}
                />
              ))}
            </View>
          </PageSection>

          <PageSection style={styles.section} title={t("profileSettings.profile.preferencesTitle")}>
            <View style={styles.listStack}>
              <ProfileListRow
                icon="language-outline"
                label={t("profileSettings.profile.preferences.appLanguage")}
                onPress={() => handleOpenRoute(routes.studentLanguageSettings)}
                rightAccessory={
                  <View style={styles.languageValue}>
                    <Text
                      numberOfLines={1}
                      selectable
                      style={[
                        getAccessibleTextStyle(typography.gradeBands.middle.caption, settings),
                        { color: profileColors.onSurfaceVariant },
                      ]}
                    >
                      {t("profileSettings.profile.preferences.english")}
                    </Text>
                    <Ionicons color={profileColors.outlineVariant} name="chevron-forward" size={22} />
                  </View>
                }
              />
            </View>
          </PageSection>

          <PageSection style={styles.section} title={t("profileSettings.profile.supportTitle")}>
            <View style={styles.listStack}>
              {supportRows.map((row) => (
                <ProfileListRow
                  icon={row.icon}
                  key={row.labelKey}
                  label={t(row.labelKey)}
                  onPress={showUnavailableAlert}
                />
              ))}
            </View>
          </PageSection>

          <View style={styles.logoutSection}>
            <Button
              accessibilityLabel={t("profileSettings.profile.logoutAccessibility")}
              fullWidth
              label={t("profileSettings.profile.logout")}
              leftAccessory={<Ionicons color={profileColors.onErrorContainer} name="log-out-outline" size={22} />}
              onPress={handleLogOut}
              size="md"
              style={styles.logoutButton}
              textStyle={styles.logoutText}
              variant="danger"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  achievementIcon: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  achievementItem: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  achievementLabel: {
    minHeight: 36,
    textAlign: "center",
  },
  achievementsGrid: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: profileColors.surfaceContainerLow,
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  avatarFrame: {
    borderColor: profileColors.surfaceContainerHighest,
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: 4,
    height: 96,
    overflow: "hidden",
    width: 96,
    ...shadows.card,
  },
  avatarWrap: {
    position: "relative",
  },
  cardContent: {
    gap: spacing.md,
  },
  centerText: {
    textAlign: "center",
  },
  content: {
    alignSelf: "center",
    gap: spacing.xxl,
    maxWidth: layout.maxContentWidth,
    width: "100%",
  },
  glassCard: {
    backgroundColor: profileColors.glass,
    borderColor: profileColors.outlineVariant,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.raised,
  },
  gradePill: {
    alignSelf: "center",
    backgroundColor: profileColors.primaryContainer,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  gradePillText: {
    color: profileColors.onPrimaryContainer,
    fontWeight: "700",
  },
  header: {
    backgroundColor: profileColors.background,
    borderBottomWidth: 0,
    ...shadows.raised,
  },
  languageValue: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing.sm,
  },
  listRow: {
    alignItems: "center",
    backgroundColor: profileColors.surfaceLowest,
    borderColor: profileColors.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  listRowLabel: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minWidth: 0,
  },
  listRowPressed: {
    backgroundColor: profileColors.surfaceContainerLow,
  },
  listStack: {
    gap: spacing.sm,
  },
  logoutButton: {
    backgroundColor: profileColors.errorContainer,
    borderColor: profileColors.error,
    borderRadius: radius.lg,
  },
  logoutSection: {
    paddingTop: spacing.lg,
  },
  logoutText: {
    color: profileColors.onErrorContainer,
  },
  profileHero: {
    alignItems: "center",
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  profileIdentity: {
    alignItems: "center",
  },
  profileName: {
    color: profileColors.onSurface,
    textAlign: "center",
  },
  root: {
    backgroundColor: profileColors.background,
    flex: 1,
  },
  rowText: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
  },
  section: {
    gap: spacing.lg,
  },
  statDivider: {
    borderColor: profileColors.outlineVariant,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
  },
  verifiedBadge: {
    alignItems: "center",
    backgroundColor: profileColors.secondary,
    borderColor: profileColors.surfaceLowest,
    borderRadius: radius.full,
    borderWidth: 2,
    bottom: 0,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    width: 28,
  },
});
