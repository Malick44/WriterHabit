import { useCallback, useEffect, useState } from "react";
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

import { useAuthSession } from "@/core/auth/useAuthSession";
import { getTeacherClassProgressRoute, getTeacherSubmissionReviewRoute } from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors, palette } from "@/design/tokens";
import { useI18n, type TFunction, type TranslationKey } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import {
  AppHeader,
  BOTTOM_MENU_SCROLL_EVENT_THROTTLE,
  useBottomMenuScrollHandler,
} from "@/shared/components/navigation";
import { dashboardRadius, dashboardSpacing } from "@/shared/styles/dashboardMetrics";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useTeacherDashboardData } from "../hooks/useTeacher";
import { teacherDashboardPreferencesService } from "../services/teacherDashboardPreferencesService";
import type {
  TeacherDashboardActivityItem,
  TeacherDashboardViewModel,
  TeacherDashboardWatchlistItem,
} from "../types";

type IconName = keyof typeof Ionicons.glyphMap;

const TABLET_BREAKPOINT = 768;

const teacherColors = {
  background: colors.dashboard.background,
  card: colors.dashboard.card,
  error: colors.dashboard.error,
  inverseSurface: colors.dashboard.inverseSurface,
  inverseText: colors.dashboard.inverseOnSurface,
  onPrimary: colors.dashboard.onPrimary,
  onSecondaryContainer: colors.dashboard.onSecondaryContainer,
  onSurface: colors.dashboard.onSurface,
  onSurfaceVariant: colors.dashboard.onSurfaceVariant,
  outline: colors.dashboard.outline,
  outlineVariant: colors.dashboard.outlineVariant,
  primary: colors.dashboard.primary,
  primaryContainer: colors.dashboard.primaryContainer,
  primaryFixed: colors.dashboard.primaryFixed,
  secondary: colors.dashboard.secondary,
  secondaryContainer: colors.dashboard.secondaryContainer,
  surface: colors.dashboard.surface,
  surfaceContainerHigh: colors.dashboard.surfaceContainerHigh,
  surfaceContainerLow: colors.dashboard.surfaceContainerLow,
  tertiaryContainer: colors.dashboard.tertiaryContainer,
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
  const { session } = useAuthSession();
  const { width } = useWindowDimensions();
  const state = useTeacherDashboardData();
  const viewModel = state.status === "success" ? state.viewModel : null;
  const isTablet = width >= TABLET_BREAKPOINT;
  const [isInsightVisible, setIsInsightVisible] = useState(false);
  const handleBottomMenuScroll = useBottomMenuScrollHandler();
  const teacherPreferenceUserId = session?.user.id ?? "preview-teacher";

  useEffect(() => {
    let active = true;

    void teacherDashboardPreferencesService
      .getInsightDismissed(teacherPreferenceUserId)
      .then((dismissed) => {
        if (active) {
          setIsInsightVisible(!dismissed);
        }
      })
      .catch(() => {
        if (active) {
          setIsInsightVisible(true);
        }
      });

    return () => {
      active = false;
    };
  }, [teacherPreferenceUserId]);

  const handleCreateAssignment = useCallback(() => {
    router.push(routes.teacherCreateAssignment);
  }, [router]);

  const handleOpenReviewQueue = useCallback(() => {
    router.push(routes.teacherSubmissions);
  }, [router]);

  const handleOpenSettings = useCallback(() => {
    router.push(routes.teacherSettings);
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
    void teacherDashboardPreferencesService.setInsightDismissed(teacherPreferenceUserId, true).catch(() => undefined);
  }, [teacherPreferenceUserId]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <AppHeader
        contentStyle={isTablet ? styles.headerContentTablet : undefined}
        gradeBand={state.gradeBand}
        rightActions={[
          {
            accessibilityLabelKey: "teacher.dashboard.header.settingsAccessibility",
            icon: "settings-outline",
            onPress: handleOpenSettings,
            type: "icon",
          },
        ]}
        showSafeArea={false}
        style={[styles.header, isTablet ? styles.headerTablet : null]}
        titleKey="common.dashboard"
        variant="compact"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet ? styles.scrollContentTablet : null]}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={handleBottomMenuScroll}
        scrollEventThrottle={BOTTOM_MENU_SCROLL_EVENT_THROTTLE}
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
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);

  return (
    <View style={styles.intro}>
      <Text
        numberOfLines={2}
        style={[
          getAccessibleTextStyle(styles.pageTitle, settings),
          settings.highContrast ? { color: accessibleColors.text } : null,
        ]}
      >
        {t("teacher.dashboard.title")}
      </Text>
      <Text
        numberOfLines={3}
        style={[
          getAccessibleTextStyle(styles.pageSubtitle, settings),
          settings.highContrast ? { color: accessibleColors.mutedText } : null,
        ]}
      >
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
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
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
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(styles.overline, settings),
                settings.highContrast ? { color: accessibleColors.mutedText } : null,
              ]}
            >
              {t("teacher.dashboard.performance.label")}
            </Text>
            <View style={styles.scoreRow}>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                numberOfLines={1}
                style={[
                  getAccessibleTextStyle(styles.scoreText, settings),
                  settings.highContrast ? { color: accessibleColors.text } : null,
                ]}
              >
                {t("teacher.dashboard.performance.percent", { count: score })}
              </Text>
              <View style={styles.growthChip}>
                <Ionicons color={teacherColors.secondary} name="trending-up-outline" size={16} />
                <Text
                  numberOfLines={1}
                  style={[
                    getAccessibleTextStyle(styles.growthChipText, settings),
                    settings.highContrast ? { color: accessibleColors.text } : null,
                  ]}
                >
                  {t("teacher.dashboard.performance.growthChip", {
                    count: viewModel.metrics.weeklyGrowthPercent,
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.gradeRing}>
            <Text
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.05}
              minimumFontScale={0.72}
              numberOfLines={1}
              style={[
                styles.gradeText,
                settings.highContrast ? { color: accessibleColors.text } : null,
              ]}
            >
              {viewModel.metrics.classAverageGrade}
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={3}
          style={[
            getAccessibleTextStyle(styles.performanceInsight, settings),
            settings.highContrast ? { color: accessibleColors.mutedText } : null,
          ]}
        >
          <Text style={settings.highContrast ? { color: accessibleColors.mutedText } : styles.performanceInsightMuted}>
            {t("teacher.dashboard.performance.growthLead")}
          </Text>
          <Text
            style={[
              styles.performanceInsightStrong,
              settings.highContrast ? { color: accessibleColors.text } : null,
            ]}
          >
            {viewModel.topTrendLabel}
          </Text>
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
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
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
      <Text
        numberOfLines={1}
        style={[
          getAccessibleTextStyle(styles.activeValue, settings),
          settings.highContrast ? { color: accessibleColors.text } : null,
        ]}
      >
        {t("teacher.dashboard.activeToday.value", { active, total })}
      </Text>
      <Text
        numberOfLines={2}
        style={[
          getAccessibleTextStyle(styles.activeLabel, settings),
          settings.highContrast ? { color: accessibleColors.mutedText } : null,
        ]}
      >
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
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);

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
        minimumFontScale={0.76}
        numberOfLines={1}
        style={[
          getAccessibleTextStyle(styles.actionButtonText, settings),
          tone === "primary" ? styles.actionButtonTextPrimary : styles.actionButtonTextDefault,
          settings.highContrast && tone !== "primary" ? { color: accessibleColors.text } : null,
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
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);

  return (
    <View style={[styles.section, isTablet ? styles.watchlistColumn : null]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleGroup}>
          <Ionicons color={teacherColors.error} name="warning-outline" size={22} />
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.sectionTitle, settings),
              settings.highContrast ? { color: accessibleColors.text } : null,
            ]}
          >
            {t("teacher.dashboard.watchlist.title")}
          </Text>
        </View>
        <View style={styles.countChip}>
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.countChipText, settings),
              settings.highContrast ? { color: accessibleColors.mutedText } : null,
            ]}
          >
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
        {items.length === 0 ? (
          <Text
            style={[
              getAccessibleTextStyle(styles.emptyInlineText, settings),
              settings.highContrast ? { color: accessibleColors.mutedText } : null,
            ]}
          >
            {t("teacher.dashboard.watchlist.empty")}
          </Text>
        ) : null}
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
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
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
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.avatarText, settings),
              settings.highContrast ? { color: accessibleColors.text } : null,
            ]}
          >
            {item.initials}
          </Text>
        </View>
        <View style={styles.watchlistCopy}>
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.watchlistName, settings),
              settings.highContrast ? { color: accessibleColors.text } : null,
            ]}
          >
            {item.studentName}
          </Text>
          <Text numberOfLines={1} style={getAccessibleTextStyle(styles.watchlistReason, settings)}>
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
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.watchlistButtonText, settings),
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
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
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const router = useRouter();

  const handleViewAll = useCallback(() => {
    router.push(routes.teacherSubmissions);
  }, [router]);

  return (
    <View style={[styles.section, styles.activityColumn]}>
      <View style={styles.sectionHeader}>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.sectionTitle, settings),
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
          {t("teacher.dashboard.activity.title")}
        </Text>
        <Pressable
          accessibilityLabel={t("teacher.dashboard.activity.viewAllAccessibility")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleViewAll}
          style={({ pressed }) => [styles.viewAllButton, pressed ? styles.pressed : null]}
        >
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.viewAllText, settings),
              settings.highContrast ? { color: accessibleColors.text } : null,
            ]}
          >
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
        {items.length === 0 ? (
          <Text
            style={[
              getAccessibleTextStyle(styles.emptyInlineText, settings),
              styles.activityEmptyText,
              settings.highContrast ? { color: accessibleColors.mutedText } : null,
            ]}
          >
            {t("teacher.dashboard.activity.empty")}
          </Text>
        ) : null}
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
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
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
        <Text
          numberOfLines={2}
          style={[
            getAccessibleTextStyle(styles.activityTitle, settings),
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
          {getActivityLabel(t, item)}
        </Text>
        <View style={styles.activityMetaRow}>
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.activityMeta, settings),
              settings.highContrast ? { color: accessibleColors.mutedText } : null,
            ]}
          >
            {item.className}
          </Text>
          <View style={styles.metaDot} />
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.activityMeta, settings),
              settings.highContrast ? { color: accessibleColors.mutedText } : null,
            ]}
          >
            {item.submittedLabel}
          </Text>
        </View>
      </View>
      {item.scorePercent === null ? (
        <Ionicons color={teacherColors.outline} name="chevron-forward" size={20} />
      ) : (
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.activityScore, settings),
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
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
  const { settings } = useAccessibilityContext();

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
        <Text numberOfLines={1} style={getAccessibleTextStyle(styles.insightTitle, settings)}>
          {t("teacher.dashboard.insight.title")}
        </Text>
        <Text numberOfLines={3} style={getAccessibleTextStyle(styles.insightText, settings)}>
          {t("teacher.dashboard.insight.description")}
        </Text>
        <Text numberOfLines={3} style={getAccessibleTextStyle(styles.insightSafety, settings)}>
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
  shadowColor: palette.black,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
} as const;

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: dashboardRadius.xl,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: dashboardSpacing.sm,
    justifyContent: "center",
    minHeight: 58,
    minWidth: 160,
    paddingHorizontal: dashboardSpacing.lg,
    paddingVertical: dashboardSpacing.md,
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
    padding: dashboardSpacing.lg,
  },
  activeIconBubble: {
    alignItems: "center",
    backgroundColor: teacherColors.surfaceContainerHigh,
    borderRadius: dashboardRadius.full,
    height: 48,
    justifyContent: "center",
    marginBottom: dashboardSpacing.md,
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
    borderRadius: dashboardRadius.full,
    height: "100%",
  },
  activeProgressTrack: {
    backgroundColor: teacherColors.surfaceContainerHigh,
    borderRadius: dashboardRadius.full,
    height: 8,
    marginTop: dashboardSpacing.lg,
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
    gap: dashboardSpacing.xs,
    minWidth: 0,
  },
  activityEmptyText: {
    padding: dashboardSpacing.lg,
  },
  activityIconBubble: {
    alignItems: "center",
    borderRadius: dashboardRadius.full,
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
    gap: dashboardSpacing.sm,
    minWidth: 0,
  },
  activityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: dashboardSpacing.lg,
    minHeight: 82,
    padding: dashboardSpacing.lg,
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
    borderRadius: dashboardRadius.full,
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
    borderRadius: dashboardRadius.xl,
    borderWidth: 1,
  },
  content: {
    alignSelf: "center",
    gap: dashboardSpacing.section,
    maxWidth: 430,
    width: "100%",
  },
  contentTablet: {
    maxWidth: 1024,
  },
  countChip: {
    alignItems: "center",
    backgroundColor: teacherColors.surfaceContainerHigh,
    borderRadius: dashboardRadius.full,
    minHeight: 24,
    paddingHorizontal: dashboardSpacing.sm,
    paddingVertical: 2,
  },
  countChipText: {
    color: teacherColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  dashboardGrid: {
    gap: dashboardSpacing.section,
  },
  dashboardGridTablet: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  emptyInlineText: {
    color: teacherColors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  gradeRing: {
    alignItems: "center",
    borderColor: teacherColors.surfaceContainerHigh,
    borderRadius: dashboardRadius.full,
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
    borderRadius: dashboardRadius.full,
    flexDirection: "row",
    gap: dashboardSpacing.xs,
    minHeight: 26,
    paddingHorizontal: dashboardSpacing.sm,
  },
  growthChipText: {
    color: teacherColors.secondary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  header: {
    backgroundColor: teacherColors.surface,
    paddingHorizontal: dashboardSpacing.xl,
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
    gap: dashboardSpacing.md,
    padding: dashboardSpacing.lg,
  },
  insightCopy: {
    flex: 1,
    gap: dashboardSpacing.xs,
    minWidth: 0,
  },
  insightDismiss: {
    alignItems: "center",
    borderRadius: dashboardRadius.full,
    justifyContent: "center",
    minHeight: 32,
    width: 32,
  },
  insightIcon: {
    alignItems: "center",
    backgroundColor: teacherColors.primary,
    borderRadius: dashboardRadius.full,
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
    gap: dashboardSpacing.xs,
  },
  listStack: {
    gap: dashboardSpacing.md,
  },
  metaDot: {
    backgroundColor: teacherColors.outline,
    borderRadius: dashboardRadius.full,
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
    padding: dashboardSpacing.lg,
  },
  performanceContent: {
    gap: dashboardSpacing.lg,
    zIndex: 1,
  },
  performanceCopy: {
    flex: 1,
    minWidth: 0,
  },
  performanceGrid: {
    gap: dashboardSpacing.lg,
  },
  performanceGridTablet: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  performanceHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: dashboardSpacing.lg,
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
    gap: dashboardSpacing.lg,
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
    gap: dashboardSpacing.sm,
    marginTop: dashboardSpacing.xs,
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
    paddingHorizontal: dashboardSpacing.xl,
    paddingTop: dashboardSpacing.xl,
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
  },
  section: {
    gap: dashboardSpacing.lg,
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
    gap: dashboardSpacing.sm,
    minWidth: 0,
  },
  viewAllButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: dashboardSpacing.sm,
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
    borderRadius: dashboardRadius.lg,
    borderWidth: 1,
    minHeight: 36,
    minWidth: 72,
    paddingHorizontal: dashboardSpacing.md,
    paddingVertical: dashboardSpacing.xs,
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
    gap: dashboardSpacing.md,
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
    borderRadius: dashboardRadius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: dashboardSpacing.md,
    justifyContent: "space-between",
    minHeight: 74,
    padding: dashboardSpacing.lg,
  },
});
