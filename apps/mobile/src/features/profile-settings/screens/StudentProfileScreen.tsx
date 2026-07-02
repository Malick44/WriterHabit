import { useCallback, type ComponentProps, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { routes, type AppRoute } from "@/core/navigation/routeNames";
import { colors, radius, shadows, spacing, typography } from "@/design/tokens";
import { useStudentProfileSummary } from "@/features/profile-settings/hooks/useStudentProfileSummary";
import { useProgressDashboard } from "@/features/progress/hooks/useProgress";
import { useSubscriptions } from "@/features/subscriptions/hooks/useSubscriptions";
import { useI18n } from "@/i18n";
import { AppHeader } from "@/shared/components/navigation";
import {
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

type IconName = ComponentProps<typeof Ionicons>["name"];

const profileColors = {
  accent: colors.dashboard.tertiaryText,
  accentTrack: colors.dashboard.tertiaryContainer,
  background: colors.dashboard.background,
  card: colors.dashboard.card,
  connected: colors.dashboard.secondary,
  divider: colors.dashboard.surfaceContainer,
  gradePillBg: colors.dashboard.primaryContainer,
  gradePillText: colors.dashboard.primary,
  iconBg: colors.dashboard.surfaceContainerLow,
  muted: colors.dashboard.onSurfaceVariant,
  onSurface: colors.dashboard.onSurface,
  outline: colors.dashboard.outlineVariant,
  planPillBg: colors.dashboard.tertiaryContainer,
  planPillText: colors.dashboard.tertiaryText,
  primary: colors.dashboard.primary,
  statValue: colors.dashboard.onSurface,
} as const;

const type = typography.gradeBands.middle;

function ProfileStatTile({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  const { settings } = useAccessibilityContext();

  return (
    <View style={styles.statTile}>
      <Text
        style={[
          getAccessibleTextStyle(type.heading, settings),
          styles.statValue,
          { color },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          getAccessibleTextStyle(type.caption, settings),
          styles.statLabel,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ProfileRow({
  icon,
  iconColor,
  iconBg,
  label,
  onPress,
  rightAccessory,
  divider = true,
}: {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  label: string;
  onPress?: () => void;
  rightAccessory?: ReactNode;
  divider?: boolean;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const minTouchTarget = getMinimumTouchTarget(settings);

  return (
    <Pressable
      accessibilityHint={
        onPress ? t("profileSettings.profile.rowHint") : undefined
      }
      accessibilityLabel={label}
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { minHeight: minTouchTarget },
        divider ? styles.rowDivider : null,
        pressed && onPress ? styles.rowPressed : null,
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons color={iconColor} name={icon} size={16} />
      </View>
      <Text
        style={[getAccessibleTextStyle(type.label, settings), styles.rowLabel]}
      >
        {label}
      </Text>
      {rightAccessory}
      {onPress ? (
        <Ionicons
          color={profileColors.outline}
          name="chevron-forward"
          size={18}
        />
      ) : null}
    </Pressable>
  );
}

export function StudentProfileScreen() {
  const { session } = useAuthSession();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useAccessibilityContext();
  const progressState = useProgressDashboard();
  const progressViewModel =
    progressState.status === "success" || progressState.status === "empty"
      ? progressState.viewModel
      : null;
  const profileSummaryState = useStudentProfileSummary(
    progressViewModel?.totals ?? null,
  );
  const profileSummary =
    profileSummaryState.status === "success" ||
    profileSummaryState.status === "empty"
      ? profileSummaryState.summary
      : null;
  const subscriptionsState = useSubscriptions();
  const isPremium =
    subscriptionsState.status === "success" &&
    subscriptionsState.viewModel.isPremium;

  const profileName =
    session?.user.displayName ?? t("profileSettings.profile.defaultName");
  const profileGrade = session?.user.gradeLevel ?? 5;
  const profileInitial = profileName.trim().slice(0, 1).toUpperCase() || "A";
  const streakDays = progressViewModel?.streak.currentDays ?? 0;
  const completed = progressViewModel?.totals.assignmentsCompleted ?? 0;
  const dailyGoalMinutes = profileSummary?.dailyGoalMinutes ?? 10;
  const level = profileSummary?.level ?? 1;
  const xpToNext = profileSummary?.xpToNext ?? 300;
  const levelProgress = profileSummary?.levelProgress ?? 0;
  const points = profileSummary?.points ?? 0;
  const badgesEarned = profileSummary?.badgesEarned ?? 0;
  const badgesInReach = profileSummary?.badgesInReach ?? 0;

  const handleOpenSettings = useCallback(
    () => router.push(routes.studentSettings),
    [router],
  );
  const handleOpenRoute = useCallback(
    (route: AppRoute) => router.push(route),
    [router],
  );
  const handleOpenPlus = useCallback(
    () => router.push(routes.paywall),
    [router],
  );

  return (
    <View style={styles.root}>
      <AppHeader
        rightActions={[
          {
            accessibilityLabelKey:
              "profileSettings.profile.headerSettingsAccessibility",
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
          { paddingBottom: Math.max(insets.bottom + 112, 136) },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        testID="student-profile-screen"
      >
        <View style={styles.content}>
          <View style={styles.hero}>
            <View
              accessibilityLabel={t(
                "profileSettings.profile.avatarAccessibility",
                { name: profileName },
              )}
              accessible
              style={styles.avatar}
            >
              <Text
                style={[
                  getAccessibleTextStyle(type.heading, settings),
                  { color: profileColors.primary },
                ]}
              >
                {profileInitial}
              </Text>
            </View>
            <View style={styles.heroIdentity}>
              <Text
                accessibilityRole="header"
                style={[
                  getAccessibleTextStyle(type.title, settings),
                  styles.heroName,
                ]}
              >
                {profileName}
              </Text>
              <View style={styles.pillRow}>
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: profileColors.gradePillBg },
                  ]}
                >
                  <Text
                    style={[
                      getAccessibleTextStyle(type.caption, settings),
                      styles.gradePillText,
                    ]}
                  >
                    {t("profileSettings.profile.gradePillShort", {
                      grade: profileGrade,
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: profileColors.planPillBg },
                  ]}
                >
                  <Text
                    style={[
                      getAccessibleTextStyle(type.caption, settings),
                      styles.planPillText,
                    ]}
                  >
                    {isPremium
                      ? t("profileSettings.profile.planPlus")
                      : t("profileSettings.profile.planFree")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            accessibilityLabel={t(
              "profileSettings.profile.level.accessibility",
              {
                level,
                xp: xpToNext,
                next: level + 1,
              },
            )}
            accessible
            style={styles.card}
          >
            <View style={styles.levelRow}>
              <Text
                style={[
                  getAccessibleTextStyle(type.label, settings),
                  styles.levelTitle,
                ]}
              >
                {t("profileSettings.profile.level.title", {
                  level,
                  name: t("profileSettings.profile.level.name"),
                })}
              </Text>
              <Text
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  styles.levelXp,
                ]}
              >
                {t("profileSettings.profile.level.xpToNext", {
                  xp: xpToNext,
                  next: level + 1,
                })}
              </Text>
            </View>
            <View style={styles.levelTrack}>
              <View
                style={[
                  styles.levelFill,
                  { width: `${Math.round(levelProgress * 100)}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <ProfileStatTile
              color={profileColors.primary}
              label={t("profileSettings.profile.stats.streak")}
              value={String(streakDays)}
            />
            <ProfileStatTile
              color={profileColors.accent}
              label={t("profileSettings.profile.stats.points")}
              value={points.toLocaleString("en-US")}
            />
            <ProfileStatTile
              color={profileColors.statValue}
              label={t("profileSettings.profile.stats.completed")}
              value={String(completed)}
            />
          </View>

          <Pressable
            accessibilityHint={t("profileSettings.profile.rowHint")}
            accessibilityLabel={t(
              "profileSettings.profile.badgeShelf.accessibility",
              {
                earned: badgesEarned,
                inReach: badgesInReach,
              },
            )}
            accessibilityRole="button"
            onPress={() => handleOpenRoute(routes.studentProgressBadges)}
            style={({ pressed }) => [
              styles.card,
              styles.badgeCard,
              pressed ? styles.rowPressed : null,
            ]}
          >
            <View style={styles.badgeIcons}>
              <View
                style={[
                  styles.badgeIcon,
                  { backgroundColor: profileColors.accentTrack },
                ]}
              >
                <Ionicons
                  color={profileColors.accent}
                  name="ribbon"
                  size={16}
                />
              </View>
              <View
                style={[
                  styles.badgeIcon,
                  { backgroundColor: profileColors.accentTrack },
                ]}
              >
                <Ionicons
                  color={profileColors.accent}
                  name="create"
                  size={16}
                />
              </View>
              <View style={[styles.badgeIcon, styles.badgeIconEmpty]} />
            </View>
            <View style={styles.badgeText}>
              <Text
                style={[
                  getAccessibleTextStyle(type.label, settings),
                  styles.badgeTitle,
                ]}
              >
                {t("profileSettings.profile.badgeShelf.title")}
              </Text>
              <Text
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  styles.badgeSummary,
                ]}
              >
                {t("profileSettings.profile.badgeShelf.summary", {
                  earned: badgesEarned,
                  inReach: badgesInReach,
                })}
              </Text>
            </View>
            <Ionicons
              color={profileColors.outline}
              name="chevron-forward"
              size={18}
            />
          </Pressable>

          <View style={[styles.card, styles.rowsCard]}>
            <ProfileRow
              icon="trending-up"
              iconBg={colors.dashboard.secondaryContainer}
              iconColor={profileColors.connected}
              label={t("profileSettings.profile.rows.myProgress")}
              onPress={() => handleOpenRoute(routes.studentProgress)}
            />
            <ProfileRow
              icon="time-outline"
              iconBg={profileColors.gradePillBg}
              iconColor={profileColors.primary}
              label={t("profileSettings.profile.rows.dailyGoal")}
              onPress={() => handleOpenRoute(routes.studentWritingGoals)}
              rightAccessory={
                <Text
                  style={[
                    getAccessibleTextStyle(type.caption, settings),
                    styles.rowValue,
                  ]}
                >
                  {t("profileSettings.profile.rows.dailyGoalValue", {
                    minutes: dailyGoalMinutes,
                  })}
                </Text>
              }
            />
            <ProfileRow
              divider={false}
              icon="people-outline"
              iconBg={profileColors.accentTrack}
              iconColor={profileColors.accent}
              label={t("profileSettings.profile.rows.linkedParent")}
              rightAccessory={
                <View style={styles.connectedBadge}>
                  <View style={styles.connectedDot} />
                  <Text
                    style={[
                      getAccessibleTextStyle(type.caption, settings),
                      styles.connectedText,
                    ]}
                  >
                    {t("profileSettings.profile.rows.linkedParentConnected")}
                  </Text>
                </View>
              }
            />
          </View>

          <View style={[styles.card, styles.rowsCard]}>
            <ProfileRow
              divider={false}
              icon="sparkles"
              iconBg={profileColors.planPillBg}
              iconColor={profileColors.accent}
              label={t("profileSettings.profile.rows.plus")}
              onPress={handleOpenPlus}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: profileColors.gradePillBg,
    borderColor: profileColors.outline,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  badgeCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  badgeIcon: {
    alignItems: "center",
    borderRadius: radius.lg,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  badgeIconEmpty: {
    backgroundColor: profileColors.iconBg,
    borderColor: profileColors.outline,
    borderStyle: "dashed",
    borderWidth: 1.5,
  },
  badgeIcons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  badgeSummary: {
    color: profileColors.muted,
    marginTop: 2,
  },
  badgeText: {
    flex: 1,
  },
  badgeTitle: {
    color: profileColors.onSurface,
    fontWeight: "600",
  },
  card: {
    backgroundColor: profileColors.card,
    borderColor: profileColors.outline,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
  },
  connectedBadge: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  connectedDot: {
    backgroundColor: profileColors.connected,
    borderRadius: radius.full,
    height: 7,
    width: 7,
  },
  connectedText: {
    color: profileColors.connected,
    fontWeight: "600",
  },
  content: {
    alignSelf: "center",
    gap: spacing.md,
    maxWidth: 480,
    width: "100%",
  },
  gradePillText: {
    color: profileColors.gradePillText,
    fontWeight: "600",
  },
  header: {
    backgroundColor: profileColors.background,
    borderBottomWidth: 0,
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  heroIdentity: {
    flex: 1,
    minWidth: 0,
  },
  heroName: {
    color: profileColors.onSurface,
  },
  levelFill: {
    backgroundColor: profileColors.accent,
    borderRadius: radius.sm,
    height: "100%",
  },
  levelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  levelTitle: {
    color: profileColors.onSurface,
    fontWeight: "600",
  },
  levelTrack: {
    backgroundColor: profileColors.accentTrack,
    borderRadius: radius.sm,
    height: 7,
    overflow: "hidden",
  },
  levelXp: {
    color: profileColors.muted,
    fontWeight: "600",
  },
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pillRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  planPillText: {
    color: profileColors.planPillText,
    fontWeight: "600",
  },
  root: {
    backgroundColor: profileColors.background,
    flex: 1,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomColor: profileColors.divider,
    borderBottomWidth: 1,
  },
  rowIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  rowLabel: {
    color: profileColors.onSurface,
    flex: 1,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowValue: {
    color: profileColors.muted,
  },
  rowsCard: {
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
  },
  statLabel: {
    color: profileColors.muted,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    textAlign: "center",
    textTransform: "uppercase",
  },
  statTile: {
    alignItems: "center",
    backgroundColor: profileColors.card,
    borderColor: profileColors.outline,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statValue: {
    textAlign: "center",
  },
});
