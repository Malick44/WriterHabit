import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type DimensionValue,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { routes } from "@/core/navigation/routeNames";
import { colors, layout, radius, shadows, spacing } from "@/design/tokens";
import { EntitlementGate } from "@/features/subscriptions";
import { useI18n, type Locale, type TFunction, type TranslationKey } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { AppHeader } from "@/shared/components/navigation";
import {
  buildAccessibilityLabel,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useProgressDashboard } from "../hooks/useProgress";
import type {
  ProgressBadgeId,
  ProgressBadgeViewModel,
  ProgressDailyActivity,
  ProgressDashboardViewModel,
  ProgressSkillViewModel,
} from "../types";

type IconName = keyof typeof Ionicons.glyphMap;

type HistoryRow = {
  dateLabel: string;
  id: string;
  levelKey: TranslationKey;
  score: number;
  title: string;
};

const TABLET_BREAKPOINT = 768;
const RING_SEGMENT_COUNT = 32;
const RING_SEGMENTS = Array.from({ length: RING_SEGMENT_COUNT }, (_, index) => index);

const dayLabelKeys = [
  "progress.dashboard.chart.days.sun",
  "progress.dashboard.chart.days.mon",
  "progress.dashboard.chart.days.tue",
  "progress.dashboard.chart.days.wed",
  "progress.dashboard.chart.days.thu",
  "progress.dashboard.chart.days.fri",
  "progress.dashboard.chart.days.sat",
] satisfies TranslationKey[];

const badgeIconMap = {
  feedback_applier: "chatbubble-ellipses",
  first_assignment: "checkmark-circle",
  handwriting_helper: "brush",
  revision_builder: "create",
  rubric_riser: "trending-up",
  three_day_streak: "flame",
  weekly_goal: "trophy",
  word_builder: "book",
} satisfies Record<ProgressBadgeId, IconName>;

function getDayLabelKey(date: string): TranslationKey {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();

  return dayLabelKeys[day] ?? "progress.dashboard.chart.days.mon";
}

function getBarHeight(words: number, maxWords: number): DimensionValue {
  if (maxWords <= 0 || words <= 0) {
    return "8%";
  }

  return `${Math.max(12, Math.round((words / maxWords) * 100))}%` as DimensionValue;
}

function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}

function formatActivityDate(locale: Locale, date: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function getWritingTrendPercent(activity: ProgressDailyActivity[]): number {
  const recentDays = activity.slice(-3);
  const previousDays = activity.slice(-6, -3);
  const recentWords = recentDays.reduce((total, day) => total + day.words, 0);
  const previousWords = previousDays.reduce((total, day) => total + day.words, 0);

  if (previousWords <= 0) {
    return recentWords > 0 ? 100 : 0;
  }

  return Math.round(((recentWords - previousWords) / previousWords) * 100);
}

function getTrendLabel(t: TFunction, percent: number): string {
  if (percent > 0) {
    return t("progress.dashboard.volume.trendUp", { count: percent });
  }

  if (percent < 0) {
    return t("progress.dashboard.volume.trendDown", { count: Math.abs(percent) });
  }

  return t("progress.dashboard.volume.trendFlat");
}

function getTrendIcon(percent: number): IconName {
  if (percent > 0) {
    return "trending-up";
  }

  if (percent < 0) {
    return "trending-down";
  }

  return "remove";
}

function getScoreLevelKey(score: number): TranslationKey {
  if (score >= 85) {
    return "progress.dashboard.history.levelStrong";
  }

  if (score >= 72) {
    return "progress.dashboard.history.levelReady";
  }

  if (score >= 60) {
    return "progress.dashboard.history.levelGrowing";
  }

  return "progress.dashboard.history.levelPracticing";
}

function getAverageScore(skills: ProgressSkillViewModel[]): number {
  if (skills.length === 0) {
    return 0;
  }

  return Math.round(skills.reduce((total, skill) => total + skill.currentScore, 0) / skills.length);
}

function buildHistoryRows(t: TFunction, locale: Locale, viewModel: ProgressDashboardViewModel): HistoryRow[] {
  const fallbackScore = getAverageScore(viewModel.visibleSkills);

  return viewModel.dailyActivity
    .filter((activity) => activity.assignmentsCompleted > 0)
    .slice(-3)
    .reverse()
    .map((activity) => {
      const primarySkillId = activity.skillsPracticed[0];
      const primarySkill = primarySkillId
        ? viewModel.skills.find((skill) => skill.skill === primarySkillId)
        : undefined;
      const score = primarySkill?.currentScore ?? fallbackScore;
      const skillLabel = primarySkill ? t(primarySkill.labelKey) : t("progress.dashboard.history.practiceFallback");

      return {
        dateLabel: formatActivityDate(locale, activity.date),
        id: activity.date,
        levelKey: getScoreLevelKey(score),
        score,
        title: t("progress.dashboard.history.practiceTitle", { skill: skillLabel }),
      };
    });
}

export function StudentProgressScreen() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const { width } = useWindowDimensions();
  const state = useProgressDashboard();
  const isTablet = width >= TABLET_BREAKPOINT;

  const handleOpenSettings = useCallback(() => {
    router.push(routes.studentSettings);
  }, [router]);

  const handleOpenNotifications = useCallback(() => {
    router.push(routes.studentNotificationSettings);
  }, [router]);

  const handleOpenAssignments = useCallback(() => {
    router.push(routes.studentAssignmentsHistory);
  }, [router]);

  const handleOpenBadges = useCallback(() => {
    router.push(routes.studentProgressBadges);
  }, [router]);

  const handleOpenSkill = useCallback(
    (skill: ProgressSkillViewModel) => {
      router.push({
        pathname: "/(student)/progress/skills/[skillId]",
        params: { skillId: skill.skill },
      });
    },
    [router],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <AppHeader
        contentStyle={isTablet ? styles.headerContentTablet : undefined}
        gradeBand={state.gradeBand}
        leftAction={{ type: "none" }}
        rightActions={[
          {
            accessibilityLabelKey: "progress.dashboard.header.notificationsAccessibility",
            icon: "notifications-outline",
            onPress: handleOpenNotifications,
            type: "icon",
          },
          {
            accessibilityLabelKey: "progress.dashboard.header.settingsAccessibility",
            icon: "settings-outline",
            onPress: handleOpenSettings,
            type: "icon",
          },
        ]}
        showSafeArea={false}
        style={styles.header}
        titleKey="progress.dashboard.title"
        variant="compact"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet ? styles.scrollContentTablet : null]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        testID="progress-dashboard-screen"
      >
        <View style={[styles.content, isTablet ? styles.contentTablet : null]}>
          {state.status === "loading" ? (
            <LoadingState
              accessibilityLabel={t("progress.dashboard.loading.accessibility")}
              description={t("progress.dashboard.loading.description")}
              gradeBand={state.gradeBand}
              label={t("progress.dashboard.loading.title")}
              testID="progress-dashboard-loading"
            />
          ) : null}

          {state.status === "error" ? (
            <ErrorState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("progress.dashboard.error.accessibility")}
              description={t("progress.dashboard.error.description")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              testID="progress-dashboard-error"
              title={t("progress.dashboard.error.title")}
            />
          ) : null}

          {state.status === "empty" ? (
            <EmptyState
              actionLabel={t("progress.dashboard.empty.action")}
              accessibilityLabel={t("progress.dashboard.empty.accessibility")}
              description={t("progress.dashboard.empty.description")}
              gradeBand={state.gradeBand}
              onActionPress={handleOpenAssignments}
              testID="progress-dashboard-empty"
              title={t("progress.dashboard.empty.title")}
            />
          ) : null}

          {state.status === "success" ? (
            <>
              {state.viewModel.isOffline ? (
                <StatusState
                  actionLabel={t("common.retry")}
                  accessibilityLabel={t("progress.dashboard.offline.accessibility")}
                  description={t("progress.dashboard.offline.description")}
                  gradeBand={state.gradeBand}
                  onActionPress={state.refetch}
                  title={t("progress.dashboard.offline.title")}
                  tone="warning"
                />
              ) : null}

              <WeeklyWritingVolumeSection isTablet={isTablet} viewModel={state.viewModel} />
              <SkillProficiencySection
                isTablet={isTablet}
                onOpenSkill={handleOpenSkill}
                skills={state.viewModel.visibleSkills}
              />
              <RecentAchievementsSection
                badges={state.viewModel.badgePreview}
                isTablet={isTablet}
                onOpenBadges={handleOpenBadges}
              />
              <EntitlementGate featureId="extended_progress_history">
                <AssignmentHistorySection
                  isTablet={isTablet}
                  onOpenAssignments={handleOpenAssignments}
                  rows={buildHistoryRows(t, locale, state.viewModel)}
                />
              </EntitlementGate>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ titleKey }: { titleKey: TranslationKey }) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();

  return (
    <Text accessibilityRole="header" numberOfLines={1} style={getAccessibleTextStyle(styles.sectionTitle, settings)}>
      {t(titleKey)}
    </Text>
  );
}

function WeeklyWritingVolumeSection({
  isTablet,
  viewModel,
}: {
  isTablet: boolean;
  viewModel: ProgressDashboardViewModel;
}) {
  const { locale, t } = useI18n();
  const { settings } = useAccessibilityContext();
  const activity = viewModel.dailyActivity.slice(-7);
  const maxWords = Math.max(1, ...activity.map((day) => day.words));
  const trendPercent = getWritingTrendPercent(viewModel.dailyActivity);
  const trendPositive = trendPercent > 0;
  const activeDay = activity.reduce<ProgressDailyActivity | null>(
    (highest, day) => (highest === null || day.words > highest.words ? day : highest),
    null,
  );

  return (
    <View style={styles.section}>
      <View style={styles.volumeHeader}>
        <View style={styles.volumeCopy}>
          <Text numberOfLines={1} style={getAccessibleTextStyle(styles.volumeEyebrow, settings)}>
            {t("progress.dashboard.volume.title")}
          </Text>
          <Text numberOfLines={1} style={getAccessibleTextStyle(styles.volumeTotal, settings)}>
            {t("progress.dashboard.volume.totalWords", {
              count: formatNumber(locale, viewModel.totals.wordsWritten),
            })}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={t("progress.dashboard.volume.trendAccessibility", {
            value: getTrendLabel(t, trendPercent),
          })}
          style={[styles.trendPill, trendPositive ? null : styles.trendPillNeutral]}
        >
          <Ionicons
            name={getTrendIcon(trendPercent)}
            size={16}
            color={trendPositive ? colors.dashboard.onSecondaryContainer : colors.dashboard.onSurfaceVariant}
          />
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.trendText, settings),
              trendPositive ? null : styles.trendTextNeutral,
            ]}
          >
            {getTrendLabel(t, trendPercent)}
          </Text>
        </View>
      </View>

      <View
        accessible
        accessibilityLabel={t("progress.dashboard.volume.chartAccessibility")}
        style={[styles.card, styles.chartCard, isTablet ? styles.chartCardTablet : null]}
      >
        <View pointerEvents="none" style={styles.chartGrid}>
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
        </View>
        {activity.map((day) => {
          const isActive = activeDay?.date === day.date;

          return (
            <View
              accessible
              accessibilityLabel={t("progress.dashboard.volume.barAccessibility", {
                count: day.words,
                day: t(getDayLabelKey(day.date)),
              })}
              key={day.date}
              style={styles.barColumn}
            >
              <View
                style={[
                  styles.chartBar,
                  {
                    backgroundColor: isActive ? colors.dashboard.primary : colors.dashboard.primaryMuted,
                    height: getBarHeight(day.words, maxWords),
                  },
                ]}
              />
              <Text
                numberOfLines={1}
                style={[
                  getAccessibleTextStyle(styles.barLabel, settings),
                  isActive ? styles.barLabelActive : null,
                ]}
              >
                {t(getDayLabelKey(day.date))}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SkillProficiencySection({
  isTablet,
  onOpenSkill,
  skills,
}: {
  isTablet: boolean;
  onOpenSkill: (skill: ProgressSkillViewModel) => void;
  skills: ProgressSkillViewModel[];
}) {
  return (
    <View style={styles.section}>
      <SectionTitle titleKey="progress.dashboard.skills.title" />
      <View style={[styles.skillGrid, isTablet ? styles.skillGridTablet : null]}>
        {skills.map((skill, index) => (
          <SkillRingCard
            index={index}
            isTablet={isTablet}
            key={skill.skill}
            onPress={() => onOpenSkill(skill)}
            skill={skill}
          />
        ))}
      </View>
    </View>
  );
}

function SkillRingCard({
  index,
  isTablet,
  onPress,
  skill,
}: {
  index: number;
  isTablet: boolean;
  onPress: () => void;
  skill: ProgressSkillViewModel;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const label = t(skill.labelKey);
  const activeSegments = Math.round(skill.progressValue * RING_SEGMENT_COUNT);
  const accentColor = index === 2 ? colors.dashboard.secondaryContainer : colors.dashboard.primary;

  return (
    <Pressable
      accessibilityHint={t("progress.skills.openHint")}
      accessibilityLabel={t("progress.dashboard.skills.scoreAccessibility", {
        count: skill.currentScore,
        skill: label,
      })}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        styles.skillCard,
        isTablet ? styles.skillCardTablet : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.skillRing}>
        {RING_SEGMENTS.map((segment) => (
          <View
            key={segment}
            style={[
              styles.ringSegment,
              {
                backgroundColor: segment < activeSegments ? accentColor : colors.dashboard.surfaceContainer,
                transform: [{ rotate: `${segment * (360 / RING_SEGMENT_COUNT)}deg` }, { translateY: -34 }],
              },
            ]}
          />
        ))}
        <View style={styles.ringCenter}>
          <Text
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1}
            numberOfLines={1}
            style={getAccessibleTextStyle(styles.ringValue, settings)}
          >
            {t("progress.dashboard.skills.percent", { count: skill.currentScore })}
          </Text>
        </View>
      </View>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={getAccessibleTextStyle(styles.skillLabel, settings)}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RecentAchievementsSection({
  badges,
  isTablet,
  onOpenBadges,
}: {
  badges: ProgressBadgeViewModel[];
  isTablet: boolean;
  onOpenBadges: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <SectionTitle titleKey="progress.dashboard.achievements.title" />
        <HeaderLink
          accessibilityKey="progress.badges.openAccessibility"
          labelKey="common.viewAll"
          onPress={onOpenBadges}
        />
      </View>
      <ScrollView
        contentContainerStyle={[styles.achievementScrollerContent, isTablet ? styles.achievementScrollerTablet : null]}
        horizontal={!isTablet}
        showsHorizontalScrollIndicator={false}
      >
        {badges.map((badge, index) => (
          <AchievementTile badge={badge} index={index} key={badge.id} />
        ))}
      </ScrollView>
    </View>
  );
}

function AchievementTile({ badge, index }: { badge: ProgressBadgeViewModel; index: number }) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const isLocked = !badge.unlocked;
  const iconName = isLocked ? "lock-closed" : badgeIconMap[badge.id];
  const bubbleStyle = [
    styles.achievementIconBubble,
    index === 0 ? styles.achievementIconBubbleGreen : null,
    index === 1 ? styles.achievementIconBubbleBlue : null,
    index === 2 ? styles.achievementIconBubbleGold : null,
    isLocked ? styles.achievementIconBubbleLocked : null,
  ];

  return (
    <View
      accessible
      accessibilityLabel={buildAccessibilityLabel([
        t(badge.titleKey),
        t(isLocked ? "progress.badges.status.locked" : "progress.badges.status.unlocked"),
      ])}
      style={[styles.card, styles.achievementTile, isLocked ? styles.achievementTileLocked : null]}
    >
      <View style={bubbleStyle}>
        <Ionicons
          name={iconName}
          size={31}
          color={isLocked ? colors.dashboard.onSurfaceVariant : colors.dashboard.primary}
        />
      </View>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={2}
        style={getAccessibleTextStyle(styles.achievementText, settings)}
      >
        {t(badge.titleKey)}
      </Text>
    </View>
  );
}

function AssignmentHistorySection({
  isTablet,
  onOpenAssignments,
  rows,
}: {
  isTablet: boolean;
  onOpenAssignments: () => void;
  rows: HistoryRow[];
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();

  return (
    <View style={[styles.section, styles.historySection]}>
      <View style={styles.sectionHeaderRow}>
        <SectionTitle titleKey="progress.dashboard.history.title" />
        <HeaderLink
          accessibilityKey="progress.dashboard.history.viewAllAccessibility"
          labelKey="common.viewAll"
          onPress={onOpenAssignments}
        />
      </View>

      <View style={[styles.card, styles.historyCard]}>
        {isTablet ? (
          <View style={styles.historyHeaderRow}>
            <Text
              numberOfLines={1}
              style={[getAccessibleTextStyle(styles.historyHeaderText, settings), styles.historyNameCell]}
            >
              {t("progress.dashboard.history.assignmentHeader")}
            </Text>
            <Text
              numberOfLines={1}
              style={[getAccessibleTextStyle(styles.historyHeaderText, settings), styles.historyDateCell]}
            >
              {t("progress.dashboard.history.dateHeader")}
            </Text>
            <Text
              numberOfLines={1}
              style={[getAccessibleTextStyle(styles.historyHeaderText, settings), styles.historyScoreCell]}
            >
              {t("progress.dashboard.history.scoreHeader")}
            </Text>
            <Text
              numberOfLines={1}
              style={[getAccessibleTextStyle(styles.historyHeaderText, settings), styles.historyLevelCell]}
            >
              {t("progress.dashboard.history.signalHeader")}
            </Text>
          </View>
        ) : null}

        {rows.length > 0 ? (
          rows.map((row) => (
            <View key={row.id} style={[styles.historyRow, isTablet ? styles.historyRowTablet : null]}>
              <Text
                numberOfLines={2}
                style={[getAccessibleTextStyle(styles.historyName, settings), isTablet ? styles.historyNameCell : null]}
              >
                {row.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[getAccessibleTextStyle(styles.historyDate, settings), isTablet ? styles.historyDateCell : null]}
              >
                {row.dateLabel}
              </Text>
              <Text
                numberOfLines={1}
                style={[getAccessibleTextStyle(styles.historyScore, settings), isTablet ? styles.historyScoreCell : null]}
              >
                {t("progress.dashboard.skills.percent", { count: row.score })}
              </Text>
              <Text
                numberOfLines={1}
                style={[getAccessibleTextStyle(styles.historyLevel, settings), isTablet ? styles.historyLevelCell : null]}
              >
                {t(row.levelKey)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={getAccessibleTextStyle(styles.historyEmptyText, settings)}>
            {t("progress.dashboard.history.empty")}
          </Text>
        )}
      </View>
    </View>
  );
}

function HeaderLink({
  accessibilityKey,
  labelKey,
  onPress,
}: {
  accessibilityKey: TranslationKey;
  labelKey: TranslationKey;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();

  return (
    <Pressable
      accessibilityLabel={t(accessibilityKey)}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.headerLink, pressed ? styles.pressed : null]}
    >
      <Text numberOfLines={1} style={getAccessibleTextStyle(styles.headerLinkText, settings)}>
        {t(labelKey)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  achievementIconBubble: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 64,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 64,
  },
  achievementIconBubbleBlue: {
    backgroundColor: colors.dashboard.primaryFixedBorder,
  },
  achievementIconBubbleGold: {
    backgroundColor: colors.dashboard.tertiaryFixed,
  },
  achievementIconBubbleGreen: {
    backgroundColor: colors.dashboard.secondaryContainer,
  },
  achievementIconBubbleLocked: {
    backgroundColor: colors.dashboard.surfaceContainer,
  },
  achievementScrollerContent: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  achievementScrollerTablet: {
    alignSelf: "stretch",
    flexDirection: "row",
  },
  achievementText: {
    color: colors.dashboard.onSurface,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "center",
  },
  achievementTile: {
    alignItems: "center",
    backgroundColor: colors.dashboard.surfaceContainerLow,
    justifyContent: "center",
    minHeight: 138,
    padding: spacing.lg,
    width: 140,
  },
  achievementTileLocked: {
    opacity: 0.55,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    height: "100%",
    justifyContent: "flex-end",
    minWidth: 0,
    zIndex: 1,
  },
  barLabel: {
    color: colors.dashboard.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  barLabelActive: {
    color: colors.dashboard.primary,
    fontWeight: "800",
  },
  card: {
    ...shadows.card,
    backgroundColor: colors.dashboard.surfaceContainerLowest,
    borderColor: colors.dashboard.outlineVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
  },
  chartBar: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    width: "100%",
  },
  chartCard: {
    flexDirection: "row",
    gap: spacing.sm,
    height: 192,
    padding: spacing.lg,
    position: "relative",
  },
  chartCardTablet: {
    height: 216,
  },
  chartGrid: {
    bottom: 38,
    justifyContent: "space-between",
    left: spacing.lg,
    position: "absolute",
    right: spacing.lg,
    top: spacing.lg,
  },
  content: {
    alignSelf: "center",
    gap: spacing.xxl,
    maxWidth: 430,
    width: "100%",
  },
  contentTablet: {
    maxWidth: 1180,
  },
  gridLine: {
    borderBottomColor: colors.dashboard.outlineFaint,
    borderBottomWidth: 1,
    height: 1,
  },
  header: {
    backgroundColor: colors.dashboard.surface,
    borderBottomColor: colors.dashboard.outlineVariant,
    paddingHorizontal: layout.screenPadding.phone,
  },
  headerContentTablet: {
    alignSelf: "center",
    maxWidth: 1180,
    width: "100%",
  },
  headerLink: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  headerLinkText: {
    color: colors.dashboard.primary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  historyCard: {
    overflow: "hidden",
  },
  historyDate: {
    color: colors.dashboard.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  historyDateCell: {
    flex: 0.85,
    textAlign: "left",
  },
  historyEmptyText: {
    color: colors.dashboard.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    padding: spacing.lg,
  },
  historyHeaderRow: {
    backgroundColor: colors.dashboard.surfaceContainerLow,
    borderBottomColor: colors.dashboard.outlineVariant,
    borderBottomWidth: 1,
    flexDirection: "row",
    padding: spacing.lg,
  },
  historyHeaderText: {
    color: colors.dashboard.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  historyLevel: {
    color: colors.dashboard.onSurface,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  historyLevelCell: {
    flex: 0.75,
    textAlign: "right",
  },
  historyName: {
    color: colors.dashboard.onSurface,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  historyNameCell: {
    flex: 1.45,
  },
  historyRow: {
    borderBottomColor: colors.dashboard.outlineVariant,
    borderBottomWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  historyRowTablet: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  historyScore: {
    color: colors.dashboard.primary,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 24,
  },
  historyScoreCell: {
    flex: 0.65,
    textAlign: "right",
  },
  historySection: {
    paddingBottom: 48,
  },
  pressed: {
    opacity: 0.72,
  },
  ringCenter: {
    alignItems: "center",
    backgroundColor: colors.dashboard.card,
    borderRadius: radius.full,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  ringSegment: {
    borderRadius: 3,
    height: 10,
    left: 38,
    position: "absolute",
    top: 35,
    width: 6,
  },
  ringValue: {
    color: colors.dashboard.primary,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 24,
  },
  safeArea: {
    backgroundColor: colors.dashboard.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 132,
    paddingHorizontal: layout.screenPadding.phone,
    paddingTop: spacing.lg,
  },
  scrollContentTablet: {
    paddingHorizontal: layout.screenPadding.tablet,
  },
  section: {
    gap: spacing.lg,
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.dashboard.onSurface,
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  skillCard: {
    alignItems: "center",
    flexBasis: "47%",
    flexGrow: 1,
    gap: spacing.md,
    minHeight: 148,
    padding: spacing.lg,
  },
  skillCardTablet: {
    flexBasis: "22%",
    maxWidth: 260,
  },
  skillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  skillGridTablet: {
    flexWrap: "nowrap",
  },
  skillLabel: {
    color: colors.dashboard.onSurface,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
  skillRing: {
    alignItems: "center",
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  trendPill: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: colors.dashboard.secondaryContainer,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 28,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  trendPillNeutral: {
    backgroundColor: colors.dashboard.surfaceContainer,
  },
  trendText: {
    color: colors.dashboard.onSecondaryContainer,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  trendTextNeutral: {
    color: colors.dashboard.onSurfaceVariant,
  },
  volumeCopy: {
    flex: 1,
    minWidth: 0,
  },
  volumeEyebrow: {
    color: colors.dashboard.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  volumeHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
  },
  volumeTotal: {
    color: colors.dashboard.onSurface,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 32,
  },
});
