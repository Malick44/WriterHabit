import { useCallback, useState, type ComponentProps, type ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { routes, type AppRoute } from "@/core/navigation/routeNames";
import { colors, layout, radius, shadows, spacing, typography } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { PageSection } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import {
  buildAccessibilityLabel,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

type IconName = ComponentProps<typeof Ionicons>["name"];
type GrowthMetric = {
  fillColor: string;
  labelKey: TranslationKey;
  progress: number;
  value?: string;
  valueKey?: TranslationKey;
  valueParams?: Record<string, string | number>;
};

const avatarImageUri =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC6oDyvp4o2Z_ZD1dWq1_OEZzz-ukxizaeW8WqBns1USXqSkaQeJHGGqJLTVK4Xb_n4qrx71aq_895XxqhC4WhZzxdNpA7kZhP5Cjr8V3OoDc2VeoJNmide0Ty3XMg1ktEBr-C52uZAb5THoQrRwCoalVtsU81Nx8ZEu10GRbpBZHZzo8lBj838ZnK3i0rCN5qQLBSS-zoWI84EFCtmdrrRUSd6i-zDK04GcuqIc6w5Gl8C3_MeIGE_hexVFWFPfIddbCSztsX6Mxg";

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

const weeklyActivity = [
  { height: 40, labelKey: "profileSettings.profile.days.mon" },
  { height: 65, labelKey: "profileSettings.profile.days.tue" },
  { height: 30, labelKey: "profileSettings.profile.days.wed" },
  { height: 85, labelKey: "profileSettings.profile.days.thu" },
  { height: 50, labelKey: "profileSettings.profile.days.fri" },
  { height: 95, labelKey: "profileSettings.profile.days.sat" },
  { height: 70, labelKey: "profileSettings.profile.days.sun" },
] as const satisfies readonly { height: number; labelKey: TranslationKey }[];

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

const growthMetrics: readonly GrowthMetric[] = [
  {
    fillColor: profileColors.primary,
    labelKey: "profileSettings.profile.progress.assignmentsCompleted",
    progress: 72,
    value: "18/25",
  },
  {
    fillColor: profileColors.secondary,
    labelKey: "profileSettings.profile.progress.vocabularySkill",
    progress: 80,
    valueKey: "profileSettings.profile.progress.vocabularyLevel",
    valueParams: { level: 8 },
  },
];

function ProfileText({
  children,
  color = profileColors.onSurface,
  role = "body",
  style,
}: {
  children: string;
  color?: string;
  role?: keyof typeof typography.gradeBands.middle;
  style?: StyleProp<TextStyle>;
}) {
  const { settings } = useAccessibilityContext();

  return (
    <Text selectable style={[getAccessibleTextStyle(typography.gradeBands.middle[role], settings), { color }, style]}>
      {children}
    </Text>
  );
}

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

function WeeklyActivityChart() {
  const { t } = useI18n();

  return (
    <View>
      <View style={styles.barChart}>
        {weeklyActivity.map((day) => (
          <View key={day.labelKey} style={styles.barColumn}>
            <View
              accessibilityLabel={t("profileSettings.profile.progress.dayActivityAccessibility", {
                day: t(day.labelKey),
                percent: day.height,
              })}
              accessible
              style={[styles.bar, { height: `${day.height}%` }]}
            />
          </View>
        ))}
      </View>
      <View style={styles.dayLabels}>
        {weeklyActivity.map((day) => (
          <Text key={day.labelKey} selectable style={styles.dayLabel}>
            {t(day.labelKey)}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function StudentProfileScreen() {
  const { session, signOut } = useAuthSession();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useAccessibilityContext();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [darkModeRequested, setDarkModeRequested] = useState(false);
  const profileName = session?.user.displayName ?? t("profileSettings.profile.defaultName");
  const profileGrade = session?.user.gradeLevel ?? 5;
  const profileInitial = profileName.trim().slice(0, 1).toUpperCase() || "A";
  const noopPress = useCallback(() => undefined, []);
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

  const stats = [
    {
      accessibilityLabel: t("profileSettings.profile.stats.assignmentsAccessibility", { value: 18 }),
      color: profileColors.primary,
      icon: "document-text-outline",
      label: t("profileSettings.profile.stats.assignments"),
      value: "18",
    },
    {
      accessibilityLabel: t("profileSettings.profile.stats.wordsAccessibility", { value: "4,250" }),
      color: profileColors.primary,
      icon: "create-outline",
      label: t("profileSettings.profile.stats.words"),
      value: "4,250",
    },
    {
      accessibilityLabel: t("profileSettings.profile.stats.streakAccessibility", { value: 7 }),
      color: profileColors.secondary,
      icon: "flame",
      label: t("profileSettings.profile.stats.streak"),
      value: t("profileSettings.profile.stats.streakValue", { count: 7 }),
    },
  ] as const satisfies readonly {
    accessibilityLabel: string;
    color: string;
    icon: IconName;
    label: string;
    value: string;
  }[];

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
                {!avatarFailed ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    onError={() => setAvatarFailed(true)}
                    source={{ uri: avatarImageUri }}
                    style={styles.avatarImage}
                  />
                ) : null}
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

          <PageSection style={styles.section} title={t("profileSettings.profile.progressTitle")}>
            <View style={styles.progressStack}>
              <SectionCard>
                <View style={styles.cardHeader}>
                  <ProfileText role="label">{t("profileSettings.profile.progress.weeklyActivity")}</ProfileText>
                  <ProfileText color={profileColors.primary} role="caption">
                    {t("profileSettings.profile.progress.lastSevenDays")}
                  </ProfileText>
                </View>
                <WeeklyActivityChart />
              </SectionCard>

              <SectionCard>
                <ProfileText role="label">{t("profileSettings.profile.progress.overallGrowth")}</ProfileText>
                <View style={styles.growthStack}>
                  {growthMetrics.map((metric) => {
                    const value = metric.value ?? (metric.valueKey ? t(metric.valueKey, metric.valueParams) : "");

                    return (
                      <View
                        accessibilityLabel={buildAccessibilityLabel([t(metric.labelKey), value])}
                        accessible
                        key={metric.labelKey}
                        style={styles.growthMetric}
                      >
                        <View style={styles.growthMetricHeader}>
                          <ProfileText role="caption">{t(metric.labelKey)}</ProfileText>
                          <ProfileText role="caption">{value}</ProfileText>
                        </View>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { backgroundColor: metric.fillColor, width: `${metric.progress}%` },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </SectionCard>
            </View>
          </PageSection>

          <PageSection style={styles.section} title={t("profileSettings.profile.preferencesTitle")}>
            <View style={styles.listStack}>
              <ProfileListRow
                icon="moon-outline"
                label={t("profileSettings.profile.preferences.darkMode")}
                rightAccessory={
                  <Switch
                    accessibilityLabel={t("profileSettings.profile.preferences.darkModeAccessibility")}
                    ios_backgroundColor={profileColors.outlineVariant}
                    onValueChange={setDarkModeRequested}
                    thumbColor={profileColors.surfaceLowest}
                    trackColor={{
                      false: profileColors.outlineVariant,
                      true: profileColors.primary,
                    }}
                    value={darkModeRequested}
                  />
                }
              />
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
                  onPress={noopPress}
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
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarWrap: {
    position: "relative",
  },
  bar: {
    backgroundColor: profileColors.primary,
    borderTopLeftRadius: radius.xs,
    borderTopRightRadius: radius.xs,
    width: 16,
  },
  barChart: {
    alignItems: "flex-end",
    flexDirection: "row",
    height: 96,
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  barColumn: {
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    width: 24,
  },
  cardContent: {
    gap: spacing.md,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  dayLabel: {
    color: profileColors.onSurfaceVariant,
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
    textAlign: "center",
  },
  dayLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
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
  growthMetric: {
    gap: spacing.xs,
  },
  growthMetricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  growthStack: {
    gap: spacing.md,
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
  progressFill: {
    borderRadius: radius.full,
    height: "100%",
  },
  progressStack: {
    gap: spacing.lg,
  },
  progressTrack: {
    backgroundColor: profileColors.surfaceContainerHighest,
    borderRadius: radius.full,
    height: 8,
    overflow: "hidden",
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
