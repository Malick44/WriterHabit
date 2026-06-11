import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTeacherClassProgressRoute, getTeacherSubmissionReviewRoute } from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { useI18n, type TFunction, type TranslationKey } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { AppHeader } from "@/shared/components/navigation";

import { useTeacherDashboardData } from "../hooks/useTeacher";
import type {
  TeacherDashboardActivityItem,
  TeacherDashboardViewModel,
  TeacherDashboardWatchlistItem,
} from "../types";

type IconName = keyof typeof Ionicons.glyphMap;

const TABLET_BREAKPOINT = 768;

const teacherColors = {
  background: "#f8f9ff",
  card: "#ffffff",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  inverseSurface: "#213145",
  inverseText: "#eaf1ff",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#a5bdff",
  onSecondaryContainer: "#00714d",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#434653",
  outline: "#737784",
  outlineVariant: "#c3c6d5",
  primary: "#00327d",
  primaryContainer: "#0047ab",
  primaryFixed: "#dae2ff",
  secondary: "#006c49",
  secondaryContainer: "#6cf8bb",
  surface: "#f8f9ff",
  surfaceContainerHigh: "#dce9ff",
  surfaceContainerLow: "#eff4ff",
  surfaceVariant: "#d3e4fe",
  tertiaryContainer: "#ffddb8",
} as const;

const teacherSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  section: 32,
} as const;

const teacherRadius = {
  sm: 4,
  lg: 8,
  xl: 12,
  full: 999,
} as const;

const watchlistReasonKeys = {
  high_priority_review: "teacher.dashboard.watchlist.reasons.highPriorityReview",
  low_completion: "teacher.dashboard.watchlist.reasons.lowCompletion",
  revision_follow_up: "teacher.dashboard.watchlist.reasons.revisionFollowUp",
} satisfies Record<TeacherDashboardWatchlistItem["reason"], TranslationKey>;

const activityLabelKeys = {
  reviewed: "teacher.dashboard.activity.items.reviewed",
  revision_requested: "teacher.dashboard.activity.items.revisionRequested",
  submitted: "teacher.dashboard.activity.items.submitted",
} satisfies Record<TeacherDashboardActivityItem["kind"], TranslationKey>;

function getWatchlistReasonLabel(t: TFunction, item: TeacherDashboardWatchlistItem) {
  if (item.reason === "low_completion") {
    return t(watchlistReasonKeys[item.reason], { percent: item.percent ?? 0 });
  }

  return t(watchlistReasonKeys[item.reason]);
}

function getActivityLabel(t: TFunction, item: TeacherDashboardActivityItem) {
  return t(activityLabelKeys[item.kind], {
    assignment: item.assignmentTitle,
    student: item.studentName,
  });
}

function getActivityIcon(kind: TeacherDashboardActivityItem["kind"]): IconName {
  switch (kind) {
    case "reviewed":
      return "checkmark-done-outline";
    case "revision_requested":
      return "chatbubble-ellipses-outline";
    case "submitted":
      return "document-text-outline";
  }
}

function getActivityIconStyle(kind: TeacherDashboardActivityItem["kind"]) {
  switch (kind) {
    case "reviewed":
      return {
        backgroundColor: teacherColors.tertiaryContainer,
        color: teacherColors.primaryContainer,
      };
    case "revision_requested":
      return {
        backgroundColor: teacherColors.primaryFixed,
        color: teacherColors.primary,
      };
    case "submitted":
      return {
        backgroundColor: teacherColors.secondaryContainer,
        color: teacherColors.onSecondaryContainer,
      };
  }
}

export function TeacherDashboardScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const state = useTeacherDashboardData();
  const viewModel = state.status === "success" ? state.viewModel : null;
  const isTablet = width >= TABLET_BREAKPOINT;
  const [isInsightVisible, setIsInsightVisible] = useState(true);

  const handleCreateAssignment = useCallback(() => {
    router.push(routes.teacherCreateAssignment);
  }, [router]);

  const handleOpenReviewQueue = useCallback(() => {
    router.push(routes.teacherSubmissions);
  }, [router]);

  const handleOpenClassReport = useCallback(() => {
    const firstClass = viewModel?.classes[0];

    if (!firstClass) {
      return;
    }

    router.push(getTeacherClassProgressRoute(firstClass.id));
  }, [router, viewModel]);

  const handleWatchlistAction = useCallback(
    (item: TeacherDashboardWatchlistItem) => {
      if (item.action === "review" && item.submissionId) {
        router.push(getTeacherSubmissionReviewRoute(item.submissionId));
        return;
      }

      router.push(getTeacherClassProgressRoute(item.classId));
    },
    [router],
  );

  const handleOpenActivity = useCallback(
    (item: TeacherDashboardActivityItem) => {
      router.push(getTeacherSubmissionReviewRoute(item.submissionId));
    },
    [router],
  );

  const handleDismissInsight = useCallback(() => {
    setIsInsightVisible(false);
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <AppHeader
        contentStyle={isTablet ? styles.headerContentTablet : undefined}
        gradeBand={state.gradeBand}
        leftAction={{
          accessibilityLabelKey: "teacher.dashboard.header.logoAccessibility",
          icon: "book-outline",
          onPress: handleOpenClassReport,
          type: "icon",
        }}
        rightActions={[
        ]}
        showSafeArea={false}
        style={[styles.header, isTablet ? styles.headerTablet : null]}
        titleKey="common.appName"
        variant="compact"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet ? styles.scrollContentTablet : null]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        testID="teacher-dashboard-screen"
      >
        <View style={[styles.content, isTablet ? styles.contentTablet : null]}>
          {state.status === "loading" ? (
            <LoadingState
              accessibilityLabel={t("teacher.loading.dashboardAccessibility")}
              description={t("teacher.loading.dashboardDescription")}
              gradeBand={state.gradeBand}
              label={t("teacher.loading.dashboardTitle")}
            />
          ) : null}

          {state.status === "error" ? (
            <ErrorState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("teacher.error.dashboardAccessibility")}
              description={t("teacher.error.dashboardDescription")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("teacher.error.dashboardTitle")}
            />
          ) : null}

          {state.status === "empty" ? (
            <EmptyState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("teacher.empty.dashboardAccessibility")}
              description={t("teacher.empty.dashboardDescription")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("teacher.empty.dashboardTitle")}
            />
          ) : null}

          {viewModel ? (
            <>
              {viewModel.isOffline ? (
                <StatusState
                  actionLabel={t("common.retry")}
                  accessibilityLabel={t("teacher.offline.accessibility")}
                  description={t("teacher.offline.description")}
                  gradeBand={state.gradeBand}
                  onActionPress={state.refetch}
                  title={t("teacher.offline.title")}
                  tone="warning"
                />
              ) : null}

              <DashboardIntro />
              <PerformanceOverview isTablet={isTablet} viewModel={viewModel} />
              <QuickActions
                isTablet={isTablet}
                onCreateAssignment={handleCreateAssignment}
                onOpenClassReport={handleOpenClassReport}
                onOpenReviewQueue={handleOpenReviewQueue}
                pendingReviewCount={viewModel.metrics.pendingReviewTotal}
              />

              <View style={[styles.dashboardGrid, isTablet ? styles.dashboardGridTablet : null]}>
                <WatchlistSection
                  isTablet={isTablet}
                  items={viewModel.watchlist}
                  onActionPress={handleWatchlistAction}
                />
                <ActivitySection items={viewModel.activities} onActivityPress={handleOpenActivity} />
              </View>

              {isInsightVisible ? (
                <AiInsightCard onDismiss={handleDismissInsight} safetyNote={viewModel.safetyNote} />
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardIntro() {
  const { t } = useI18n();

  return (
    <View style={styles.intro}>
      <Text maxFontSizeMultiplier={1.1} numberOfLines={2} style={styles.pageTitle}>
        {t("teacher.dashboard.title")}
      </Text>
      <Text maxFontSizeMultiplier={1.08} numberOfLines={3} style={styles.pageSubtitle}>
        {t("teacher.dashboard.subtitle")}
      </Text>
    </View>
  );
}

function PerformanceOverview({
  isTablet,
  viewModel,
}: {
  isTablet: boolean;
  viewModel: TeacherDashboardViewModel;
}) {
  return (
    <View style={[styles.performanceGrid, isTablet ? styles.performanceGridTablet : null]}>
      <ClassAverageCard viewModel={viewModel} />
      <ActiveStudentsCard viewModel={viewModel} />
    </View>
  );
}

function ClassAverageCard({ viewModel }: { viewModel: TeacherDashboardViewModel }) {
  const { t } = useI18n();
  const score = viewModel.metrics.classAverageScore;

  return (
    <View
      accessible
      accessibilityLabel={t("teacher.dashboard.performance.accessibility", { score })}
      style={[styles.card, styles.performanceCard]}
    >
      <View style={styles.performanceContent}>
        <View style={styles.performanceHeader}>
          <View style={styles.performanceCopy}>
            <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.overline}>
              {t("teacher.dashboard.performance.label")}
            </Text>
            <View style={styles.scoreRow}>
              <Text
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1}
                minimumFontScale={0.72}
                numberOfLines={1}
                style={styles.scoreText}
              >
                {t("teacher.dashboard.performance.percent", { count: score })}
              </Text>
              <View style={styles.growthChip}>
                <Ionicons color={teacherColors.secondary} name="trending-up-outline" size={16} />
                <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.growthChipText}>
                  {t("teacher.dashboard.performance.growthChip", {
                    count: viewModel.metrics.weeklyGrowthPercent,
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.gradeRing}>
            <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.gradeText}>
              {viewModel.metrics.classAverageGrade}
            </Text>
          </View>
        </View>

        <Text maxFontSizeMultiplier={1.08} numberOfLines={3} style={styles.performanceInsight}>
          <Text style={styles.performanceInsightMuted}>
            {t("teacher.dashboard.performance.growthLead")}
          </Text>
          <Text style={styles.performanceInsightStrong}>{viewModel.topTrendLabel}</Text>
        </Text>
      </View>

      <Ionicons
        color={teacherColors.primary}
        name="analytics-outline"
        size={126}
        style={styles.performanceWatermark}
      />
    </View>
  );
}

function ActiveStudentsCard({ viewModel }: { viewModel: TeacherDashboardViewModel }) {
  const { t } = useI18n();
  const active = viewModel.metrics.activeStudentsToday;
  const total = viewModel.metrics.activeStudentsTodayTotal;
  const percent = viewModel.metrics.activeStudentsTodayPercent;

  return (
    <View
      accessible
      accessibilityLabel={t("teacher.dashboard.activeToday.accessibility", { active, total })}
      style={[styles.card, styles.activeCard]}
    >
      <View style={styles.activeIconBubble}>
        <Ionicons color={teacherColors.primary} name="checkbox-outline" size={24} />
      </View>
      <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.activeValue}>
        {t("teacher.dashboard.activeToday.value", { active, total })}
      </Text>
      <Text maxFontSizeMultiplier={1.05} numberOfLines={2} style={styles.activeLabel}>
        {t("teacher.dashboard.activeToday.label")}
      </Text>
      <View
        accessibilityLabel={t("teacher.dashboard.activeToday.progressAccessibility", { percent })}
        accessibilityRole="progressbar"
        accessibilityValue={{ max: 100, min: 0, now: percent }}
        style={styles.activeProgressTrack}
      >
        <View style={[styles.activeProgressFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

function QuickActions({
  isTablet,
  onCreateAssignment,
  onOpenClassReport,
  onOpenReviewQueue,
  pendingReviewCount,
}: {
  isTablet: boolean;
  onCreateAssignment: () => void;
  onOpenClassReport: () => void;
  onOpenReviewQueue: () => void;
  pendingReviewCount: number;
}) {
  return (
    <View style={[styles.quickActions, isTablet ? styles.quickActionsTablet : null]}>
      <QuickActionButton
        accessibilityKey="teacher.dashboard.actions.createAccessibility"
        icon="add-circle-outline"
        labelKey="teacher.dashboard.actions.create"
        onPress={onCreateAssignment}
        tone="primary"
      />
      <QuickActionButton
        accessibilityKey="teacher.dashboard.actions.gradePendingAccessibility"
        accessibilityParams={{ count: pendingReviewCount }}
        icon="clipboard-outline"
        labelKey="teacher.dashboard.actions.gradePending"
        labelParams={{ count: pendingReviewCount }}
        onPress={onOpenReviewQueue}
        tone="secondary"
      />
      <QuickActionButton
        accessibilityKey="teacher.dashboard.actions.reportAccessibility"
        icon="bar-chart-outline"
        labelKey="teacher.dashboard.actions.report"
        onPress={onOpenClassReport}
        tone="neutral"
      />
    </View>
  );
}

function QuickActionButton({
  accessibilityKey,
  accessibilityParams,
  icon,
  labelKey,
  labelParams,
  onPress,
  tone,
}: {
  accessibilityKey: TranslationKey;
  accessibilityParams?: Record<string, string | number>;
  icon: IconName;
  labelKey: TranslationKey;
  labelParams?: Record<string, string | number>;
  onPress: () => void;
  tone: "neutral" | "primary" | "secondary";
}) {
  const { t } = useI18n();

  return (
    <Pressable
      accessibilityLabel={t(accessibilityKey, accessibilityParams)}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        tone === "primary" ? styles.actionButtonPrimary : null,
        tone === "secondary" ? styles.actionButtonSecondary : null,
        tone === "neutral" ? styles.actionButtonNeutral : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Ionicons
        color={tone === "primary" ? teacherColors.onPrimary : teacherColors.primary}
        name={icon}
        size={22}
      />
      <Text
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.05}
        minimumFontScale={0.76}
        numberOfLines={1}
        style={[
          styles.actionButtonText,
          tone === "primary" ? styles.actionButtonTextPrimary : styles.actionButtonTextDefault,
        ]}
      >
        {t(labelKey, labelParams)}
      </Text>
    </Pressable>
  );
}

function WatchlistSection({
  isTablet,
  items,
  onActionPress,
}: {
  isTablet: boolean;
  items: TeacherDashboardWatchlistItem[];
  onActionPress: (item: TeacherDashboardWatchlistItem) => void;
}) {
  const { t } = useI18n();

  return (
    <View style={[styles.section, isTablet ? styles.watchlistColumn : null]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleGroup}>
          <Ionicons color={teacherColors.error} name="warning-outline" size={22} />
          <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.sectionTitle}>
            {t("teacher.dashboard.watchlist.title")}
          </Text>
        </View>
        <View style={styles.countChip}>
          <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.countChipText}>
            {t("teacher.dashboard.watchlist.count", { count: items.length })}
          </Text>
        </View>
      </View>

      <View style={styles.listStack}>
        {items.map((item, index) => (
          <WatchlistRow
            avatarColor={index % 2 === 0 ? teacherColors.surfaceContainerHigh : teacherColors.primaryFixed}
            item={item}
            key={item.id}
            onActionPress={onActionPress}
          />
        ))}
      </View>
    </View>
  );
}

function WatchlistRow({
  avatarColor,
  item,
  onActionPress,
}: {
  avatarColor: string;
  item: TeacherDashboardWatchlistItem;
  onActionPress: (item: TeacherDashboardWatchlistItem) => void;
}) {
  const { t } = useI18n();
  const actionLabel =
    item.action === "review"
      ? t("teacher.dashboard.watchlist.reviewCta")
      : t("teacher.dashboard.watchlist.remindCta");

  return (
    <View
      accessible
      accessibilityLabel={t("teacher.dashboard.watchlist.rowAccessibility", {
        reason: getWatchlistReasonLabel(t, item),
        student: item.studentName,
      })}
      style={styles.watchlistRow}
    >
      <View style={styles.watchlistIdentity}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.avatarText}>
            {item.initials}
          </Text>
        </View>
        <View style={styles.watchlistCopy}>
          <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.watchlistName}>
            {item.studentName}
          </Text>
          <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.watchlistReason}>
            {getWatchlistReasonLabel(t, item)}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel={t("teacher.dashboard.watchlist.actionAccessibility", {
          action: actionLabel,
          student: item.studentName,
        })}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onActionPress(item)}
        style={({ pressed }) => [styles.watchlistButton, pressed ? styles.pressed : null]}
      >
        <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.watchlistButtonText}>
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function ActivitySection({
  items,
  onActivityPress,
}: {
  items: TeacherDashboardActivityItem[];
  onActivityPress: (item: TeacherDashboardActivityItem) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();

  const handleViewAll = useCallback(() => {
    router.push(routes.teacherSubmissions);
  }, [router]);

  return (
    <View style={[styles.section, styles.activityColumn]}>
      <View style={styles.sectionHeader}>
        <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.sectionTitle}>
          {t("teacher.dashboard.activity.title")}
        </Text>
        <Pressable
          accessibilityLabel={t("teacher.dashboard.activity.viewAllAccessibility")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleViewAll}
          style={({ pressed }) => [styles.viewAllButton, pressed ? styles.pressed : null]}
        >
          <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.viewAllText}>
            {t("common.viewAll")}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.card, styles.activityCard]}>
        {items.map((item, index) => (
          <ActivityRow
            item={item}
            key={item.id}
            onPress={onActivityPress}
            showDivider={index < items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function ActivityRow({
  item,
  onPress,
  showDivider,
}: {
  item: TeacherDashboardActivityItem;
  onPress: (item: TeacherDashboardActivityItem) => void;
  showDivider: boolean;
}) {
  const { t } = useI18n();
  const iconStyle = getActivityIconStyle(item.kind);

  return (
    <Pressable
      accessibilityLabel={t("teacher.dashboard.activity.rowAccessibility", {
        activity: getActivityLabel(t, item),
      })}
      accessibilityRole="button"
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.activityRow,
        showDivider ? styles.activityRowBorder : null,
        pressed ? styles.activityRowPressed : null,
      ]}
    >
      <View style={[styles.activityIconBubble, { backgroundColor: iconStyle.backgroundColor }]}>
        <Ionicons color={iconStyle.color} name={getActivityIcon(item.kind)} size={20} />
      </View>
      <View style={styles.activityCopy}>
        <Text maxFontSizeMultiplier={1.08} numberOfLines={2} style={styles.activityTitle}>
          {getActivityLabel(t, item)}
        </Text>
        <View style={styles.activityMetaRow}>
          <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.activityMeta}>
            {item.className}
          </Text>
          <View style={styles.metaDot} />
          <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.activityMeta}>
            {item.submittedLabel}
          </Text>
        </View>
      </View>
      {item.scorePercent === null ? (
        <Ionicons color={teacherColors.outline} name="chevron-forward" size={20} />
      ) : (
        <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.activityScore}>
          {t("teacher.dashboard.activity.score", { score: item.scorePercent })}
        </Text>
      )}
    </Pressable>
  );
}

function AiInsightCard({
  onDismiss,
  safetyNote,
}: {
  onDismiss: () => void;
  safetyNote: string;
}) {
  const { t } = useI18n();

  return (
    <View
      accessible
      accessibilityLabel={t("teacher.dashboard.insight.accessibility")}
      style={styles.insightCard}
    >
      <View style={styles.insightIcon}>
        <Ionicons color={teacherColors.onPrimary} name="sparkles-outline" size={22} />
      </View>
      <View style={styles.insightCopy}>
        <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.insightTitle}>
          {t("teacher.dashboard.insight.title")}
        </Text>
        <Text maxFontSizeMultiplier={1.08} numberOfLines={3} style={styles.insightText}>
          {t("teacher.dashboard.insight.description")}
        </Text>
        <Text maxFontSizeMultiplier={1.05} numberOfLines={3} style={styles.insightSafety}>
          {safetyNote}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={t("teacher.dashboard.insight.dismissAccessibility")}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onDismiss}
        style={({ pressed }) => [styles.insightDismiss, pressed ? styles.pressed : null]}
      >
        <Ionicons color={teacherColors.inverseText} name="close" size={18} />
      </Pressable>
    </View>
  );
}

const cardShadow = {
  elevation: 2,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
} as const;

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: teacherRadius.xl,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: teacherSpacing.sm,
    justifyContent: "center",
    minHeight: 58,
    minWidth: 160,
    paddingHorizontal: teacherSpacing.lg,
    paddingVertical: teacherSpacing.md,
  },
  actionButtonNeutral: {
    backgroundColor: teacherColors.card,
    borderColor: teacherColors.outline,
  },
  actionButtonPrimary: {
    ...cardShadow,
    backgroundColor: teacherColors.primary,
    borderColor: teacherColors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: teacherColors.card,
    borderColor: teacherColors.primary,
  },
  actionButtonText: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    textAlign: "center",
  },
  actionButtonTextDefault: {
    color: teacherColors.primary,
  },
  actionButtonTextPrimary: {
    color: teacherColors.onPrimary,
  },
  activeCard: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 180,
    minWidth: 220,
    padding: teacherSpacing.lg,
  },
  activeIconBubble: {
    alignItems: "center",
    backgroundColor: teacherColors.surfaceContainerHigh,
    borderRadius: teacherRadius.full,
    height: 48,
    justifyContent: "center",
    marginBottom: teacherSpacing.md,
    width: 48,
  },
  activeLabel: {
    color: teacherColors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    textAlign: "center",
  },
  activeProgressFill: {
    backgroundColor: teacherColors.secondary,
    borderRadius: teacherRadius.full,
    height: "100%",
  },
  activeProgressTrack: {
    backgroundColor: teacherColors.surfaceContainerHigh,
    borderRadius: teacherRadius.full,
    height: 8,
    marginTop: teacherSpacing.lg,
    overflow: "hidden",
    width: "100%",
  },
  activeValue: {
    color: teacherColors.onSurface,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 32,
  },
  activityCard: {
    gap: 0,
    overflow: "hidden",
    padding: 0,
  },
  activityColumn: {
    flex: 3,
    minWidth: 0,
  },
  activityCopy: {
    flex: 1,
    gap: teacherSpacing.xs,
    minWidth: 0,
  },
  activityIconBubble: {
    alignItems: "center",
    borderRadius: teacherRadius.full,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  activityMeta: {
    color: teacherColors.onSurfaceVariant,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  activityMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: teacherSpacing.sm,
    minWidth: 0,
  },
  activityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: teacherSpacing.lg,
    minHeight: 82,
    padding: teacherSpacing.lg,
  },
  activityRowBorder: {
    borderBottomColor: teacherColors.outlineVariant,
    borderBottomWidth: 1,
  },
  activityRowPressed: {
    backgroundColor: teacherColors.surfaceContainerLow,
  },
  activityScore: {
    color: teacherColors.secondary,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 20,
  },
  activityTitle: {
    color: teacherColors.onSurface,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  avatar: {
    alignItems: "center",
    borderRadius: teacherRadius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarText: {
    color: teacherColors.primary,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  card: {
    ...cardShadow,
    backgroundColor: teacherColors.card,
    borderColor: teacherColors.outlineVariant,
    borderRadius: teacherRadius.xl,
    borderWidth: 1,
  },
  content: {
    alignSelf: "center",
    gap: teacherSpacing.section,
    maxWidth: 430,
    width: "100%",
  },
  contentTablet: {
    maxWidth: 1024,
  },
  countChip: {
    alignItems: "center",
    backgroundColor: teacherColors.surfaceContainerHigh,
    borderRadius: teacherRadius.full,
    minHeight: 24,
    paddingHorizontal: teacherSpacing.sm,
    paddingVertical: 2,
  },
  countChipText: {
    color: teacherColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  dashboardGrid: {
    gap: teacherSpacing.section,
  },
  dashboardGridTablet: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  gradeRing: {
    alignItems: "center",
    borderColor: teacherColors.surfaceContainerHigh,
    borderRadius: teacherRadius.full,
    borderTopColor: teacherColors.primary,
    borderWidth: 4,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  gradeText: {
    color: teacherColors.primary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  growthChip: {
    alignItems: "center",
    backgroundColor: teacherColors.secondaryContainer,
    borderRadius: teacherRadius.full,
    flexDirection: "row",
    gap: teacherSpacing.xs,
    minHeight: 26,
    paddingHorizontal: teacherSpacing.sm,
  },
  growthChipText: {
    color: teacherColors.secondary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  header: {
    backgroundColor: teacherColors.surface,
    paddingHorizontal: teacherSpacing.xl,
  },
  headerContentTablet: {
    alignSelf: "center",
    maxWidth: 1024,
    width: "100%",
  },
  headerTablet: {
    paddingHorizontal: 32,
  },
  insightCard: {
    ...cardShadow,
    alignItems: "flex-start",
    backgroundColor: teacherColors.inverseSurface,
    borderRadius: 20,
    flexDirection: "row",
    gap: teacherSpacing.md,
    padding: teacherSpacing.lg,
  },
  insightCopy: {
    flex: 1,
    gap: teacherSpacing.xs,
    minWidth: 0,
  },
  insightDismiss: {
    alignItems: "center",
    borderRadius: teacherRadius.full,
    justifyContent: "center",
    minHeight: 32,
    width: 32,
  },
  insightIcon: {
    alignItems: "center",
    backgroundColor: teacherColors.primary,
    borderRadius: teacherRadius.full,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  insightSafety: {
    color: teacherColors.inverseText,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    opacity: 0.78,
  },
  insightText: {
    color: teacherColors.inverseText,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    opacity: 0.92,
  },
  insightTitle: {
    color: teacherColors.inverseText,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  intro: {
    gap: teacherSpacing.xs,
  },
  listStack: {
    gap: teacherSpacing.md,
  },
  metaDot: {
    backgroundColor: teacherColors.outline,
    borderRadius: teacherRadius.full,
    height: 4,
    width: 4,
  },
  overline: {
    color: teacherColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  pageSubtitle: {
    color: teacherColors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  pageTitle: {
    color: teacherColors.onSurface,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
  },
  performanceCard: {
    flex: 2,
    minHeight: 180,
    minWidth: 0,
    overflow: "hidden",
    padding: teacherSpacing.lg,
  },
  performanceContent: {
    gap: teacherSpacing.lg,
    zIndex: 1,
  },
  performanceCopy: {
    flex: 1,
    minWidth: 0,
  },
  performanceGrid: {
    gap: teacherSpacing.lg,
  },
  performanceGridTablet: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  performanceHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: teacherSpacing.lg,
    justifyContent: "space-between",
  },
  performanceInsight: {
    color: teacherColors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  performanceInsightMuted: {
    color: teacherColors.onSurfaceVariant,
  },
  performanceInsightStrong: {
    color: teacherColors.onSurface,
    fontWeight: "700",
  },
  performanceWatermark: {
    bottom: -24,
    opacity: 0.1,
    position: "absolute",
    right: -4,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: teacherSpacing.lg,
  },
  quickActionsTablet: {
    flexWrap: "nowrap",
  },
  safeArea: {
    backgroundColor: teacherColors.background,
    flex: 1,
  },
  scoreRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: teacherSpacing.sm,
    marginTop: teacherSpacing.xs,
  },
  scoreText: {
    color: teacherColors.primary,
    fontSize: 48,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 56,
  },
  scrollContent: {
    paddingBottom: 132,
    paddingHorizontal: teacherSpacing.xl,
    paddingTop: teacherSpacing.xl,
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
  },
  section: {
    gap: teacherSpacing.lg,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: teacherColors.onSurface,
    flexShrink: 1,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  sectionTitleGroup: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: teacherSpacing.sm,
    minWidth: 0,
  },
  viewAllButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: teacherSpacing.sm,
  },
  viewAllText: {
    color: teacherColors.primary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  watchlistButton: {
    alignItems: "center",
    borderColor: teacherColors.outlineVariant,
    borderRadius: teacherRadius.lg,
    borderWidth: 1,
    minHeight: 36,
    minWidth: 72,
    paddingHorizontal: teacherSpacing.md,
    paddingVertical: teacherSpacing.xs,
  },
  watchlistButtonText: {
    color: teacherColors.primary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  watchlistColumn: {
    flex: 2,
    minWidth: 0,
  },
  watchlistCopy: {
    flex: 1,
    minWidth: 0,
  },
  watchlistIdentity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: teacherSpacing.md,
    minWidth: 0,
  },
  watchlistName: {
    color: teacherColors.onSurface,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  watchlistReason: {
    color: teacherColors.error,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  watchlistRow: {
    alignItems: "center",
    backgroundColor: teacherColors.card,
    borderColor: teacherColors.outlineVariant,
    borderRadius: teacherRadius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: teacherSpacing.md,
    justifyContent: "space-between",
    minHeight: 74,
    padding: teacherSpacing.lg,
  },
});
