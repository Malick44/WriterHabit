import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  getAssignmentDetailRoute,
  getCanvasTemplatePickerRoute,
  getStudentReviewRoute,
  getWritingWorkspaceRoute,
} from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors, radius, spacing } from "@/design/tokens";
import { useI18n, type TFunction, type TranslationKey } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout";
import { useGlacierThemeStore } from "@/shared/theme/glacierThemeStore";

import { useStudentHomeData } from "../hooks/useStudentHomeData";
import type { StudentHomeNavigationTarget, StudentHomeViewModel } from "../types";

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  key: string;
  labelKey: TranslationKey;
  onPress: () => void;
};

type Achievement = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  key: string;
  labelKey: TranslationKey;
  surfaceColor: string;
};

const WEEKLY_SEGMENT_LIMIT = 7;

function getStudentInitial(name: string) {
  return name.trim().slice(0, 1).toLocaleUpperCase();
}

function getWeeklyTargetDays(viewModel: StudentHomeViewModel) {
  const practiceDays = Math.ceil(viewModel.weeklyWriting.minutesGoal / viewModel.dailyPractice.minutesGoal);

  return Math.min(WEEKLY_SEGMENT_LIMIT, Math.max(1, practiceDays + 1));
}

function getWeeklyCompletedDays(viewModel: StudentHomeViewModel) {
  return Math.min(getWeeklyTargetDays(viewModel), Math.round(viewModel.weeklyProgressValue * getWeeklyTargetDays(viewModel)));
}

function getStudentLevel(viewModel: StudentHomeViewModel) {
  return Math.max(
    1,
    Math.min(9, Math.ceil((viewModel.streak.currentDays + viewModel.weeklyWriting.sessionsCompleted) / 3)),
  );
}

function getPointTotal(viewModel: StudentHomeViewModel) {
  return viewModel.weeklyWriting.minutesCompleted + viewModel.streak.currentDays * 10;
}

function getContinueStepTotal(viewModel: StudentHomeViewModel) {
  return Math.max(3, Math.min(5, (viewModel.todayAssignment?.rubricFocus.length ?? 1) + 2));
}

function getPracticeStepCount(viewModel: StudentHomeViewModel) {
  return getContinueStepTotal(viewModel);
}

function buildAchievements(t: TFunction, viewModel: StudentHomeViewModel): Achievement[] {
  const points = getPointTotal(viewModel);
  const practiceCount = Math.max(viewModel.weeklyWriting.sessionsCompleted, viewModel.streak.currentDays);

  return [
    {
      description: t("studentHome.achievements.firstSteps.description", {
        count: Math.max(1, viewModel.weeklyWriting.sessionsCompleted),
      }),
      icon: "star",
      iconColor: "#FFFFFF",
      key: "first-steps",
      labelKey: "studentHome.achievements.firstSteps.title",
      surfaceColor: "#FBBF24",
    },
    {
      description: t("studentHome.achievements.wordExplorer.description", { count: points }),
      icon: "pencil",
      iconColor: "#FFFFFF",
      key: "word-explorer",
      labelKey: "studentHome.achievements.wordExplorer.title",
      surfaceColor: "#3B82F6",
    },
    {
      description: t("studentHome.achievements.onFire.description", {
        count: viewModel.streak.currentDays,
      }),
      icon: "flame",
      iconColor: "#16A34A",
      key: "on-fire",
      labelKey: "studentHome.achievements.onFire.title",
      surfaceColor: "#BBF7D0",
    },
    {
      description: t("studentHome.achievements.risingWriter.description", { count: practiceCount }),
      icon: "trophy",
      iconColor: "#FDE68A",
      key: "rising-writer",
      labelKey: "studentHome.achievements.risingWriter.title",
      surfaceColor: "#8B5CF6",
    },
  ];
}

export function StudentHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useStudentHomeData();
  const { primaryColor, fontSizeScale } = useGlacierThemeStore();
  const dashboardFontScale = Math.min(fontSizeScale, 1);
  const viewModel = state.status === "success" ? state.viewModel : null;
  const studentFirstName =
    state.status === "success" || state.status === "empty"
      ? state.viewModel.studentFirstName
      : t("studentHome.defaultStudent");
  const studentInitial = getStudentInitial(studentFirstName) || getStudentInitial(t("common.fallbackDisplayName"));

  const navigateToTarget = useCallback(
    (target: StudentHomeNavigationTarget) => {
      switch (target.kind) {
        case "assignmentDetail":
          router.push(getAssignmentDetailRoute(target.assignmentId));
          return;
        case "assignmentHistory":
          router.push(routes.studentAssignmentsHistory);
          return;
        case "canvasTemplates":
          router.push(getCanvasTemplatePickerRoute());
          return;
        case "progress":
          router.push(routes.studentProgress);
          return;
        case "review":
          router.push(getStudentReviewRoute(target.submissionId));
          return;
        case "write":
          router.push(getWritingWorkspaceRoute(target.assignmentId));
          return;
      }
    },
    [router],
  );

  const handleOpenAssignmentHistory = useCallback(() => {
    navigateToTarget({ kind: "assignmentHistory" });
  }, [navigateToTarget]);

  const handleOpenProgress = useCallback(() => {
    navigateToTarget({ kind: "progress" });
  }, [navigateToTarget]);

  const handleOpenCanvasTemplates = useCallback(() => {
    navigateToTarget({ kind: "canvasTemplates" });
  }, [navigateToTarget]);

  const handleStartPractice = useCallback(() => {
    if (!viewModel?.todayAssignment) {
      navigateToTarget({ kind: "assignmentHistory" });
      return;
    }

    navigateToTarget({
      assignmentId: viewModel.todayAssignment.id,
      kind: "write",
    });
  }, [navigateToTarget, viewModel]);

  const handleContinueDraft = useCallback(() => {
    if (!viewModel?.continueDraft) {
      return;
    }

    navigateToTarget({
      assignmentId: viewModel.continueDraft.assignmentId,
      kind: "write",
    });
  }, [navigateToTarget, viewModel]);

  const handleOpenFeedback = useCallback(() => {
    const recentFeedback = viewModel?.recentFeedback[0];

    if (!recentFeedback) {
      navigateToTarget({ kind: "assignmentHistory" });
      return;
    }

    navigateToTarget({
      kind: "review",
      submissionId: recentFeedback.submissionId,
    });
  }, [navigateToTarget, viewModel]);

  const quickActions: QuickAction[] = [
    {
      icon: "clipboard",
      iconColor: "#6D28D9",
      key: "assignments",
      labelKey: "studentHome.quickActions.assignments",
      onPress: handleOpenAssignmentHistory,
    },
    {
      icon: "bar-chart",
      iconColor: "#3B82F6",
      key: "progress",
      labelKey: "studentHome.quickActions.progress",
      onPress: handleOpenProgress,
    },
    {
      icon: "chatbubble-ellipses",
      iconColor: "#EA580C",
      key: "feedback",
      labelKey: "studentHome.quickActions.feedback",
      onPress: handleOpenFeedback,
    },
    {
      icon: "book",
      iconColor: "#16A34A",
      key: "library",
      labelKey: "studentHome.quickActions.library",
      onPress: handleOpenCanvasTemplates,
    },
  ];

  return (
    <Screen
      backgroundColor={colors.background.surface}
      contentStyle={styles.screenContent}
      gradeBand={state.gradeBand}
      testID="student-home-screen"
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text
            adjustsFontSizeToFit
            accessibilityRole="header"
            maxFontSizeMultiplier={1}
            minimumFontScale={0.78}
            numberOfLines={1}
            style={[
              styles.greeting,
              { fontSize: Math.round(21 * dashboardFontScale), lineHeight: Math.round(27 * dashboardFontScale) },
            ]}
          >
            {t("studentHome.greeting", { name: studentFirstName })}
          </Text>
          <Text
            maxFontSizeMultiplier={1}
            numberOfLines={1}
            style={[
              styles.subtitle,
              { fontSize: Math.round(14 * dashboardFontScale), lineHeight: Math.round(20 * dashboardFontScale) },
            ]}
          >
            {t("studentHome.subtitle")}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={t("studentHome.profile.avatarAccessibilityLabel", { name: studentFirstName })}
          accessibilityRole="image"
          style={[styles.avatar, { backgroundColor: primaryColor }]}
        >
          <Text maxFontSizeMultiplier={1} style={[styles.avatarInitial, { fontSize: Math.round(22 * dashboardFontScale) }]}>
            {studentInitial}
          </Text>
        </View>
      </View>

      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("studentHome.loading.accessibility")}
          description={t("studentHome.loading.description")}
          gradeBand={state.gradeBand}
          label={t("studentHome.loading.title")}
          testID="student-home-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("studentHome.error.accessibility")}
          description={t("studentHome.error.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="student-home-error"
          title={t("studentHome.error.title")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("studentHome.empty.action")}
          accessibilityLabel={t("studentHome.empty.accessibility")}
          description={t("studentHome.empty.description")}
          gradeBand={state.gradeBand}
          onActionPress={handleOpenAssignmentHistory}
          testID="student-home-empty"
          title={t("studentHome.empty.title")}
        />
      ) : null}

      {viewModel ? (
        <>
          {viewModel.isOffline ? (
            <StatusState
              actionLabel={t("studentHome.offline.action")}
              accessibilityLabel={t("studentHome.offline.accessibility")}
              description={t("studentHome.offline.description")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("studentHome.offline.title")}
              tone="warning"
            />
          ) : null}

          <StatsPill
            level={getStudentLevel(viewModel)}
            points={getPointTotal(viewModel)}
            streakDays={viewModel.streak.currentDays}
          />

          {viewModel.todayAssignment ? (
            <PracticeHeroCard
              fontSizeScale={dashboardFontScale}
              onStartPractice={handleStartPractice}
              stepCount={getPracticeStepCount(viewModel)}
              title={viewModel.todayAssignment.title}
              description={viewModel.todayAssignment.prompt}
              estimatedMinutes={viewModel.todayAssignment.estimatedMinutes}
            />
          ) : null}

          <WeeklyGoalCard
            completedDays={getWeeklyCompletedDays(viewModel)}
            totalDays={getWeeklyTargetDays(viewModel)}
          />

          {viewModel.continueDraft ? (
            <ContinueDraftRow
              estimatedMinutes={viewModel.todayAssignment?.estimatedMinutes ?? viewModel.dailyPractice.minutesGoal}
              onPress={handleContinueDraft}
              step={Math.max(1, viewModel.continueDraft.revisionNumber + 1)}
              title={viewModel.continueDraft.title}
              totalSteps={getContinueStepTotal(viewModel)}
            />
          ) : null}

          <QuickActionGrid actions={quickActions} />

          <AchievementsPanel achievements={buildAchievements(t, viewModel)} />
        </>
      ) : null}
    </Screen>
  );
}

function StatsPill({
  level,
  points,
  streakDays,
}: {
  level: number;
  points: number;
  streakDays: number;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.statsPill}>
      <StatCell
        icon="flame"
        iconColor="#F97316"
        label={t("studentHome.stats.dayStreak")}
        value={String(streakDays)}
      />
      <View style={styles.statDivider} />
      <StatCell
        icon="star"
        iconColor="#FBBF24"
        label={t("studentHome.stats.points")}
        value={String(points)}
      />
      <View style={styles.statDivider} />
      <StatCell
        icon="ribbon"
        iconColor="#3B82F6"
        label={t("studentHome.stats.levelName")}
        value={t("studentHome.stats.level", { level })}
      />
    </View>
  );
}

function StatCell({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCell}>
      <Ionicons name={icon} size={23} color={iconColor} />
      <View style={styles.statCopy}>
        <Text maxFontSizeMultiplier={1} numberOfLines={1} style={styles.statValue}>
          {value}
        </Text>
        <Text adjustsFontSizeToFit maxFontSizeMultiplier={1} minimumFontScale={0.75} numberOfLines={1} style={styles.statLabel}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function PracticeHeroCard({
  description,
  estimatedMinutes,
  fontSizeScale,
  onStartPractice,
  stepCount,
  title,
}: {
  description: string;
  estimatedMinutes: number;
  fontSizeScale: number;
  onStartPractice: () => void;
  stepCount: number;
  title: string;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.practiceCard}>
      <View pointerEvents="none" style={styles.practiceCardTint} />
      <View pointerEvents="none" style={styles.practiceCardGlow} />
      <View style={styles.practiceCopy}>
        <Text style={styles.practiceBadge}>{t("studentHome.practice.badge")}</Text>
        <Text
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1}
          minimumFontScale={0.72}
          numberOfLines={2}
          style={[
            styles.practiceTitle,
            { fontSize: Math.round(17 * fontSizeScale), lineHeight: Math.round(21 * fontSizeScale) },
          ]}
        >
          {title}
        </Text>
        <Text
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1}
          minimumFontScale={0.78}
          numberOfLines={2}
          style={[
            styles.practiceDescription,
            { fontSize: Math.round(11 * fontSizeScale), lineHeight: Math.round(16 * fontSizeScale) },
          ]}
        >
          {description}
        </Text>
        <View style={styles.practiceMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={17} color="#64748B" />
            <Text maxFontSizeMultiplier={1} style={styles.metaText}>{t("common.minutes", { count: estimatedMinutes })}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="sync-outline" size={17} color="#64748B" />
            <Text maxFontSizeMultiplier={1} style={styles.metaText}>{t("studentHome.practice.steps", { count: stepCount })}</Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel={t("studentHome.practice.startAccessibilityLabel")}
          accessibilityRole="button"
          onPress={onStartPractice}
          style={({ pressed }) => [styles.startButton, pressed ? styles.buttonPressed : null]}
        >
          <Text maxFontSizeMultiplier={1} style={styles.startButtonText}>{t("studentHome.practice.start")}</Text>
          <Ionicons name="arrow-forward" size={22} color={colors.text.inverse} />
        </Pressable>
      </View>
      <HeroPaperIllustration />
    </View>
  );
}

function HeroPaperIllustration() {
  return (
    <View pointerEvents="none" style={styles.heroArt}>
      <View style={styles.sparkleLarge}>
        <Ionicons name="sparkles" size={21} color="#FFFFFF" />
      </View>
      <View style={styles.sparkleSmall}>
        <Ionicons name="sparkles" size={18} color="#FFFFFF" />
      </View>
      <View style={styles.paper}>
        <View style={styles.paperLineWide} />
        <View style={styles.paperLine} />
        <View style={styles.paperLineWide} />
        <View style={styles.paperLine} />
        <View style={styles.paperLineShort} />
      </View>
      <View style={styles.pen}>
        <View style={styles.penCap} />
        <View style={styles.penBody} />
        <View style={styles.penTip} />
      </View>
    </View>
  );
}

function WeeklyGoalCard({
  completedDays,
  totalDays,
}: {
  completedDays: number;
  totalDays: number;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.weeklyCard}>
      <View style={styles.weeklyHeader}>
        <View>
          <Text maxFontSizeMultiplier={1} style={styles.cardTitle}>{t("studentHome.weeklyGoal.title")}</Text>
          <Text maxFontSizeMultiplier={1} numberOfLines={1} style={styles.cardSubtitle}>{t("studentHome.weeklyGoal.description")}</Text>
        </View>
        <Text adjustsFontSizeToFit maxFontSizeMultiplier={1} minimumFontScale={0.8} numberOfLines={1} style={styles.weeklyCount}>
          {t("studentHome.weeklyGoal.count", { completed: completedDays, total: totalDays })}
        </Text>
      </View>
      <View style={styles.weeklySegments}>
        {Array.from({ length: totalDays }).map((_, index) => (
          <View
            key={`weekly-day-${index}`}
            style={[styles.weeklySegment, index < completedDays ? styles.weeklySegmentComplete : null]}
          />
        ))}
      </View>
    </View>
  );
}

function ContinueDraftRow({
  estimatedMinutes,
  onPress,
  step,
  title,
  totalSteps,
}: {
  estimatedMinutes: number;
  onPress: () => void;
  step: number;
  title: string;
  totalSteps: number;
}) {
  const { t } = useI18n();

  return (
    <Pressable
      accessibilityLabel={t("studentHome.continueDraft.accessibility")}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.continueCard, pressed ? styles.buttonPressed : null]}
    >
      <View style={styles.continueIcon}>
        <Ionicons name="document-text" size={30} color={colors.text.inverse} />
      </View>
      <View style={styles.continueCopy}>
        <Text maxFontSizeMultiplier={1} numberOfLines={2} style={styles.continueEyebrow}>{t("studentHome.continueDraft.eyebrow")}</Text>
        <Text adjustsFontSizeToFit maxFontSizeMultiplier={1} minimumFontScale={0.8} numberOfLines={1} style={styles.continueTitle}>
          {title}
        </Text>
        <Text maxFontSizeMultiplier={1} numberOfLines={1} style={styles.continueMeta}>
          {t("studentHome.continueDraft.progressMeta", {
            minutes: estimatedMinutes,
            step,
            total: totalSteps,
          })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={28} color="#475569" />
    </Pressable>
  );
}

function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  const { t } = useI18n();

  return (
    <View style={styles.quickGrid}>
      {actions.map((action) => (
        <Pressable
          accessibilityLabel={t(action.labelKey)}
          accessibilityRole="button"
          key={action.key}
          onPress={action.onPress}
          style={({ pressed }) => [styles.quickAction, pressed ? styles.buttonPressed : null]}
        >
          <Ionicons name={action.icon} size={25} color={action.iconColor} />
          <Text adjustsFontSizeToFit maxFontSizeMultiplier={1} minimumFontScale={0.75} numberOfLines={1} style={styles.quickActionLabel}>{t(action.labelKey)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function AchievementsPanel({ achievements }: { achievements: Achievement[] }) {
  const { t } = useI18n();

  return (
    <View style={styles.achievementsCard}>
      <View style={styles.achievementsHeader}>
        <Text maxFontSizeMultiplier={1} style={styles.cardTitle}>{t("studentHome.achievements.title")}</Text>
        <Text maxFontSizeMultiplier={1} style={styles.viewAllText}>{t("common.viewAll")}</Text>
      </View>
      <View style={styles.achievementRow}>
        {achievements.map((achievement) => (
          <View key={achievement.key} style={styles.achievementItem}>
            <View style={[styles.achievementBadge, { backgroundColor: achievement.surfaceColor }]}>
              <View style={styles.achievementBadgeIcon}>
                <Ionicons name={achievement.icon} size={27} color={achievement.iconColor} />
              </View>
            </View>
            <Text adjustsFontSizeToFit maxFontSizeMultiplier={1} minimumFontScale={0.75} numberOfLines={1} style={styles.achievementTitle}>
              {t(achievement.labelKey)}
            </Text>
            <Text adjustsFontSizeToFit maxFontSizeMultiplier={1} minimumFontScale={0.75} numberOfLines={1} style={styles.achievementDescription}>
              {achievement.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  achievementBadge: {
    alignItems: "center",
    borderRadius: 18,
    height: 58,
    justifyContent: "center",
    marginBottom: 9,
    transform: [{ rotate: "45deg" }],
    width: 58,
  },
  achievementBadgeIcon: {
    transform: [{ rotate: "-45deg" }],
  },
  achievementDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  achievementItem: {
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  achievementRow: {
    flexDirection: "row",
    gap: 13,
  },
  achievementTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
    textAlign: "center",
  },
  achievementsCard: {
    backgroundColor: colors.background.surface,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 17,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  achievementsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  avatar: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarInitial: {
    color: colors.text.inverse,
    fontWeight: "800",
    lineHeight: 28,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  cardSubtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  continueCard: {
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderColor: "#B7E4CB",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 74,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  continueCopy: {
    flex: 1,
    minWidth: 0,
  },
  continueEyebrow: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
    lineHeight: 15,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  continueIcon: {
    alignItems: "center",
    backgroundColor: "#22C55E",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  continueMeta: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  continueTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  greeting: {
    color: "#111827",
    fontWeight: "800",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroArt: {
    bottom: 12,
    height: 94,
    position: "absolute",
    right: 4,
    width: 110,
  },
  metaDivider: {
    backgroundColor: "#CBD5E1",
    height: 18,
    width: 1,
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  metaText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  paper: {
    backgroundColor: colors.background.surface,
    borderRadius: 10,
    bottom: 0,
    height: 74,
    justifyContent: "center",
    paddingHorizontal: 14,
    position: "absolute",
    right: 20,
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.2,
    shadowRadius: 13,
    transform: [{ rotate: "8deg" }],
    width: 74,
  },
  paperLine: {
    backgroundColor: "#C7CBD8",
    borderRadius: 2,
    height: 2,
    marginBottom: 8,
    width: 48,
  },
  paperLineShort: {
    backgroundColor: "#C7CBD8",
    borderRadius: 2,
    height: 2,
    width: 34,
  },
  paperLineWide: {
    backgroundColor: "#C7CBD8",
    borderRadius: 2,
    height: 2,
    marginBottom: 8,
    width: 56,
  },
  pen: {
    bottom: 10,
    height: 84,
    position: "absolute",
    right: 12,
    transform: [{ rotate: "31deg" }],
    width: 25,
  },
  penBody: {
    backgroundColor: "#6D28D9",
    borderRadius: 13,
    height: 49,
    width: 20,
  },
  penCap: {
    backgroundColor: "#7C3AED",
    borderRadius: 13,
    height: 30,
    marginBottom: -3,
    width: 24,
  },
  penTip: {
    borderLeftColor: "transparent",
    borderLeftWidth: 6,
    borderRightColor: "transparent",
    borderRightWidth: 6,
    borderTopColor: "#4C1D95",
    borderTopWidth: 13,
    marginLeft: 5,
  },
  practiceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(109, 40, 217, 0.09)",
    borderRadius: radius.md,
    color: "#6D28D9",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.2,
    lineHeight: 14,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: "uppercase",
  },
  practiceCard: {
    backgroundColor: "#F4EAFF",
    borderColor: "#DEC8FF",
    borderRadius: 22,
    borderWidth: 1,
    height: 190,
    overflow: "hidden",
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  practiceCardGlow: {
    backgroundColor: "#C8A7FF",
    borderRadius: 140,
    bottom: -66,
    height: 170,
    opacity: 0.56,
    position: "absolute",
    right: -48,
    width: 170,
  },
  practiceCardTint: {
    backgroundColor: "#EFE2FF",
    borderRadius: 130,
    bottom: 20,
    height: 104,
    opacity: 0.8,
    position: "absolute",
    right: 48,
    width: 104,
  },
  practiceCopy: {
    height: "100%",
    maxWidth: "57%",
    zIndex: 1,
  },
  practiceDescription: {
    color: "#64748B",
    marginTop: 6,
  },
  practiceMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    marginTop: 9,
  },
  practiceTitle: {
    color: "#111827",
    fontWeight: "900",
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: colors.background.surface,
    borderColor: "#E5E7EB",
    borderRadius: 17,
    borderWidth: 1,
    flex: 1,
    gap: 9,
    height: 78,
    justifyContent: "center",
    minWidth: 0,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  quickActionLabel: {
    color: "#111827",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 14,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 12,
  },
  screenContent: {
    gap: 19,
    maxWidth: 430,
  },
  sparkleLarge: {
    position: "absolute",
    right: 24,
    top: 2,
  },
  sparkleSmall: {
    left: 8,
    position: "absolute",
    top: 55,
  },
  startButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#6D28D9",
    borderRadius: 13,
    flexDirection: "row",
    bottom: 0,
    gap: 11,
    height: 42,
    justifyContent: "center",
    left: 0,
    marginTop: 0,
    minWidth: 146,
    paddingHorizontal: 16,
    position: "absolute",
  },
  startButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  statCell: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minWidth: 0,
  },
  statCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  statDivider: {
    backgroundColor: "#E5E7EB",
    height: 39,
    width: 1,
  },
  statLabel: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 13,
  },
  statValue: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 17,
  },
  statsPill: {
    alignItems: "center",
    backgroundColor: colors.background.surface,
    borderColor: "#E5E7EB",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    height: 54,
    paddingHorizontal: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  subtitle: {
    color: "#64748B",
    marginTop: 4,
  },
  viewAllText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  weeklyCard: {
    backgroundColor: colors.background.surface,
    borderColor: "#E5E7EB",
    borderRadius: 17,
    borderWidth: 1,
    gap: 13,
    minHeight: 82,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  weeklyCount: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  weeklyHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weeklySegment: {
    backgroundColor: "#EEF0F4",
    borderRadius: 3,
    flex: 1,
    height: 9,
  },
  weeklySegmentComplete: {
    backgroundColor: "#27AE60",
  },
  weeklySegments: {
    flexDirection: "row",
    gap: 6,
  },
});
