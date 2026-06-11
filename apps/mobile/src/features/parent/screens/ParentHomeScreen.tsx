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

import {
  getParentAssignmentReviewRoute,
  getParentStudentReportRoute,
} from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors } from "@/design/tokens";
import { useI18n, type TFunction, type TranslationKey } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { AppHeader } from "@/shared/components/navigation";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { ParentStudentSelector } from "../components";
import { useParentDashboardData } from "../hooks/useParent";
import type {
  ParentAssignmentSummary,
  ParentDashboardMilestone,
  ParentDashboardUpcomingItem,
  ParentDashboardViewModel,
  ParentDashboardWritingLevel,
} from "../types";

type IconName = keyof typeof Ionicons.glyphMap;

const TABLET_BREAKPOINT = 768;
const RING_SEGMENT_COUNT = 36;
const RING_SEGMENTS = Array.from({ length: RING_SEGMENT_COUNT }, (_, index) => index);

const parentColors = {
  background: colors.dashboard.background,
  card: colors.dashboard.cardTranslucent,
  error: colors.dashboard.error,
  errorContainer: colors.dashboard.errorContainer,
  onErrorContainer: colors.dashboard.onErrorContainer,
  onPrimary: colors.dashboard.onPrimary,
  onPrimaryContainer: colors.dashboard.onPrimaryContainer,
  onSecondaryContainer: colors.dashboard.onSecondaryContainer,
  onSurface: colors.dashboard.onSurface,
  onSurfaceVariant: colors.dashboard.onSurfaceVariant,
  outline: colors.dashboard.outline,
  outlineVariant: colors.dashboard.outlineVariant,
  primary: colors.dashboard.primary,
  primaryFixed: colors.dashboard.primaryFixed,
  secondary: colors.dashboard.secondary,
  secondaryContainer: colors.dashboard.secondaryContainer,
  surface: colors.dashboard.surface,
  surfaceContainerHigh: colors.dashboard.surfaceContainerHigh,
} as const;

const parentSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  section: 32,
} as const;

const parentRadius = {
  sm: 4,
  lg: 8,
  xl: 12,
  full: 999,
} as const;

const writingLevelKeys = {
  advanced: "parent.dashboard.hero.writingLevels.advanced",
  developing: "parent.dashboard.hero.writingLevels.developing",
  intermediate: "parent.dashboard.hero.writingLevels.intermediate",
} satisfies Record<ParentDashboardWritingLevel, TranslationKey>;

const assignmentStatusLabelKeys = {
  completed: "parent.assignments.status.completed",
  feedback_ready: "parent.assignments.status.feedbackReady",
  revision_in_progress: "parent.assignments.status.revisionInProgress",
} satisfies Record<ParentAssignmentSummary["status"], TranslationKey>;

function getRingBarHeight(minutesCompleted: number, minutesGoal: number): DimensionValue {
  if (minutesGoal <= 0) {
    return "0%";
  }

  return `${Math.round(Math.min(1, Math.max(0, minutesCompleted / minutesGoal)) * 100)}%` as DimensionValue;
}

function getMilestoneIcon(kind: ParentDashboardMilestone["kind"]): IconName {
  switch (kind) {
    case "assignment":
      return "school";
    case "skill":
      return "sparkles";
    case "streak":
      return "flame";
  }
}

function getMilestoneColors(kind: ParentDashboardMilestone["kind"]) {
  switch (kind) {
    case "assignment":
      return {
        backgroundColor: parentColors.primaryFixed,
        borderColor: "rgba(0, 50, 125, 0.16)",
        foregroundColor: parentColors.primary,
      };
    case "skill":
      return {
        backgroundColor: parentColors.surfaceContainerHigh,
        borderColor: parentColors.outlineVariant,
        foregroundColor: parentColors.onSurfaceVariant,
      };
    case "streak":
      return {
        backgroundColor: parentColors.secondaryContainer,
        borderColor: "rgba(0, 108, 73, 0.2)",
        foregroundColor: parentColors.onSecondaryContainer,
      };
  }
}

function getMilestoneTitle(t: TFunction, milestone: ParentDashboardMilestone): string {
  switch (milestone.kind) {
    case "assignment":
      return t("parent.dashboard.milestones.assignmentTitle", {
        title: milestone.title ?? t("parent.dashboard.milestones.assignmentFallback"),
      });
    case "skill":
      return t("parent.dashboard.milestones.skillTitle", {
        skill: milestone.skillLabel ?? t("parent.dashboard.milestones.skillFallback"),
      });
    case "streak":
      return t("parent.dashboard.milestones.streakTitle", {
        count: milestone.streakDays ?? 0,
      });
  }
}

export function ParentHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const state = useParentDashboardData();
  const viewModel = state.status === "success" ? state.viewModel : null;
  const isTablet = width >= TABLET_BREAKPOINT;

  const handleOpenSettings = useCallback(() => {
    router.push(routes.parentSettings);
  }, [router]);

  const handleOpenAssignments = useCallback(() => {
    router.push(routes.parentAssignments);
  }, [router]);

  const handleOpenReport = useCallback(() => {
    if (!viewModel?.selectedStudent) {
      return;
    }

    router.push(getParentStudentReportRoute(viewModel.selectedStudent.id));
  }, [router, viewModel]);

  const handleOpenLatestAssignment = useCallback(() => {
    const assignment = viewModel?.assignments[0];

    if (!assignment) {
      router.push(routes.parentAssignments);
      return;
    }

    router.push(getParentAssignmentReviewRoute(assignment.submissionId));
  }, [router, viewModel]);

  const handleOpenUpcomingItem = useCallback(
    (item: ParentDashboardUpcomingItem) => {
      router.push(getParentAssignmentReviewRoute(item.submissionId));
    },
    [router],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <AppHeader
        contentStyle={isTablet ? styles.headerContentTablet : undefined}
        gradeBand={state.gradeBand}
        leftAction={{
          accessibilityLabelKey: "parent.dashboard.header.profileAccessibility",
          fallbackText: t("parent.dashboard.header.profileInitials"),
          onPress: handleOpenSettings,
          type: "avatar",
        }}
        rightActions={[
          {
            accessibilityLabelKey: "parent.dashboard.header.notificationsAccessibility",
            icon: "notifications-outline",
            onPress: handleOpenSettings,
            type: "icon",
          },
        ]}
        showSafeArea={false}
        style={[styles.header, isTablet ? styles.headerTablet : null]}
        titleKey="parent.dashboard.header.title"
        variant="compact"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet ? styles.scrollContentTablet : null]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        testID="parent-home-screen"
      >
        <View style={[styles.content, isTablet ? styles.contentTablet : null]}>
          {state.status === "loading" ? (
            <LoadingState
              accessibilityLabel={t("parent.loading.homeAccessibility")}
              description={t("parent.loading.homeDescription")}
              gradeBand={state.gradeBand}
              label={t("parent.loading.homeTitle")}
              testID="parent-home-loading"
            />
          ) : null}

          {state.status === "error" ? (
            <ErrorState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("parent.error.homeAccessibility")}
              description={t("parent.error.homeDescription")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              testID="parent-home-error"
              title={t("parent.error.homeTitle")}
            />
          ) : null}

          {state.status === "empty" ? (
            <EmptyState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("parent.empty.homeAccessibility")}
              description={t("parent.empty.homeDescription")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              testID="parent-home-empty"
              title={t("parent.empty.homeTitle")}
            />
          ) : null}

          {viewModel ? (
            <>
              {viewModel.isOffline ? (
                <StatusState
                  actionLabel={t("common.retry")}
                  accessibilityLabel={t("parent.offline.accessibility")}
                  description={t("parent.offline.description")}
                  gradeBand={state.gradeBand}
                  onActionPress={state.refetch}
                  title={t("parent.offline.title")}
                  tone="warning"
                />
              ) : null}

              <HeroGrid
                isTablet={isTablet}
                onOpenReport={handleOpenReport}
                selectedStudentId={state.selectedStudentId}
                selectStudent={state.selectStudent}
                viewModel={viewModel}
              />

              <DashboardBento
                isTablet={isTablet}
                onOpenAssignments={handleOpenAssignments}
                onOpenUpcomingItem={handleOpenUpcomingItem}
                viewModel={viewModel}
              />

              <EncouragementBand
                onOpenAssignments={handleOpenLatestAssignment}
                onOpenReport={handleOpenReport}
                viewModel={viewModel}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroGrid({
  isTablet,
  onOpenReport,
  selectedStudentId,
  selectStudent,
  viewModel,
}: {
  isTablet: boolean;
  onOpenReport: () => void;
  selectedStudentId?: string;
  selectStudent: (studentId: string) => void;
  viewModel: ParentDashboardViewModel;
}) {
  return (
    <View style={[styles.heroGrid, isTablet ? styles.heroGridTablet : null]}>
      <ChildOverviewHero
        isTablet={isTablet}
        selectedStudentId={selectedStudentId}
        selectStudent={selectStudent}
        viewModel={viewModel}
      />
      <CoachInsightCard onOpenReport={onOpenReport} viewModel={viewModel} />
    </View>
  );
}

function ChildOverviewHero({
  isTablet,
  selectedStudentId,
  selectStudent,
  viewModel,
}: {
  isTablet: boolean;
  selectedStudentId?: string;
  selectStudent: (studentId: string) => void;
  viewModel: ParentDashboardViewModel;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const student = viewModel.selectedStudent;

  if (!student) {
    return null;
  }

  return (
    <View style={[styles.glassCard, styles.childHero, isTablet ? styles.childHeroTablet : null]}>
      <View style={styles.heroBubblePrimary} />
      <View style={styles.heroBubbleSecondary} />
      <View style={styles.heroContent}>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.heroEyebrow, settings),
            settings.highContrast ? { color: accessibleColors.mutedText } : null,
          ]}
        >
          {t("parent.dashboard.hero.greeting")}
        </Text>
        <View style={[styles.childTitleRow, isTablet ? styles.childTitleRowTablet : null]}>
          <Text
            numberOfLines={2}
            style={[
              getAccessibleTextStyle(styles.childName, settings),
              settings.highContrast ? { color: accessibleColors.text } : null,
            ]}
          >
            {student.displayName}
          </Text>
          <View style={styles.gradeChip}>
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(styles.gradeChipText, settings),
                settings.highContrast ? { color: accessibleColors.mutedText } : null,
              ]}
            >
              {student.schoolLabel}
            </Text>
          </View>
        </View>

        <ParentStudentSelector
          gradeBand={viewModel.gradeAdaptation.band}
          onSelectStudent={selectStudent}
          selectedStudentId={selectedStudentId}
          students={viewModel.students}
        />

        <View style={styles.heroStats}>
          <HeroStat
            icon="analytics"
            labelKey="parent.dashboard.hero.writingLevel"
            value={t(writingLevelKeys[viewModel.writingLevel])}
          />
          <HeroStat
            icon="star"
            labelKey="parent.dashboard.hero.recentRank"
            value={t("parent.dashboard.hero.rankValue", { count: viewModel.recentRankPercent })}
          />
        </View>
      </View>
    </View>
  );
}

function HeroStat({
  icon,
  labelKey,
  value,
}: {
  icon: IconName;
  labelKey: TranslationKey;
  value: string;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);

  return (
    <View accessible accessibilityLabel={`${t(labelKey)}: ${value}`} style={styles.heroStat}>
      <Ionicons color={icon === "star" ? parentColors.secondary : parentColors.primary} name={icon} size={24} />
      <View style={styles.heroStatCopy}>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.heroStatLabel, settings),
            settings.highContrast ? { color: accessibleColors.mutedText } : null,
          ]}
        >
          {t(labelKey)}
        </Text>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.heroStatValue, settings),
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function CoachInsightCard({
  onOpenReport,
  viewModel,
}: {
  onOpenReport: () => void;
  viewModel: ParentDashboardViewModel;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();

  return (
    <View
      accessible
      accessibilityLabel={t("parent.dashboard.coach.accessibility")}
      style={[styles.coachCard, styles.cardShadow]}
    >
      <Ionicons color={parentColors.onPrimary} name="bulb-outline" size={76} style={styles.coachWatermark} />
      <View style={styles.coachContent}>
        <View style={styles.coachTitleRow}>
          <Ionicons color={parentColors.secondaryContainer} name="sparkles" size={24} />
          <Text numberOfLines={2} style={getAccessibleTextStyle(styles.coachTitle, settings)}>
            {t("parent.dashboard.coach.title")}
          </Text>
        </View>
        <Text numberOfLines={5} style={getAccessibleTextStyle(styles.coachText, settings)}>
          {viewModel.coachInsight}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={t("parent.dashboard.coach.openTipsAccessibility")}
        accessibilityRole="button"
        onPress={onOpenReport}
        style={({ pressed }) => [styles.coachButton, pressed ? styles.pressed : null]}
      >
        <Text numberOfLines={1} style={getAccessibleTextStyle(styles.coachButtonText, settings)}>
          {t("parent.dashboard.coach.openTips")}
        </Text>
        <Ionicons color={parentColors.onPrimary} name="arrow-forward" size={16} />
      </Pressable>
    </View>
  );
}

function DashboardBento({
  isTablet,
  onOpenAssignments,
  onOpenUpcomingItem,
  viewModel,
}: {
  isTablet: boolean;
  onOpenAssignments: () => void;
  onOpenUpcomingItem: (item: ParentDashboardUpcomingItem) => void;
  viewModel: ParentDashboardViewModel;
}) {
  return (
    <View style={[styles.bentoGrid, isTablet ? styles.bentoGridTablet : null]}>
      <WeeklyWritingCard viewModel={viewModel} />
      <MilestonesCard milestones={viewModel.milestones} />
      <UpcomingCard
        items={viewModel.upcomingItems}
        onOpenAssignments={onOpenAssignments}
        onOpenUpcomingItem={onOpenUpcomingItem}
      />
    </View>
  );
}

function WeeklyWritingCard({ viewModel }: { viewModel: ParentDashboardViewModel }) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const progress = Math.round(viewModel.weeklyProgressValue * RING_SEGMENT_COUNT);
  const weekly = viewModel.weeklyProgress;

  if (!weekly) {
    return null;
  }

  return (
    <View style={[styles.glassCard, styles.bentoCard]}>
      <CardHeader icon="time-outline" titleKey="parent.dashboard.weekly.title" />
      <View style={styles.weeklyBody}>
        <View
          accessibilityLabel={t("parent.dashboard.weekly.progressAccessibility", {
            completed: weekly.minutesCompleted,
            goal: weekly.minutesGoal,
          })}
          accessibilityRole="progressbar"
          accessibilityValue={{ max: weekly.minutesGoal, min: 0, now: weekly.minutesCompleted }}
          style={styles.weeklyRing}
        >
          {RING_SEGMENTS.map((segment) => (
            <View
              key={segment}
              style={[
                styles.ringSegment,
                {
                  backgroundColor: segment < progress ? parentColors.secondary : parentColors.surfaceContainerHigh,
                  transform: [{ rotate: `${segment * (360 / RING_SEGMENT_COUNT)}deg` }, { translateY: -70 }],
                },
              ]}
            />
          ))}
          <View style={styles.weeklyRingCenter}>
            <Text
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1}
              minimumFontScale={0.72}
              numberOfLines={1}
              style={[
                styles.weeklyMinutes,
                settings.highContrast ? { color: accessibleColors.text } : null,
              ]}
            >
              {weekly.minutesCompleted}
            </Text>
            <Text
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1}
              minimumFontScale={0.72}
              numberOfLines={1}
              style={[
                styles.weeklyGoal,
                settings.highContrast ? { color: accessibleColors.mutedText } : null,
              ]}
            >
              {t("parent.dashboard.weekly.minutesGoal", { goal: weekly.minutesGoal })}
            </Text>
          </View>
        </View>

        <View style={styles.streakBlock}>
          <View style={styles.streakRow}>
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(styles.streakLabel, settings),
                settings.highContrast ? { color: accessibleColors.mutedText } : null,
              ]}
            >
              {t("parent.dashboard.weekly.streakLabel")}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(styles.streakValue, settings),
                settings.highContrast ? { color: accessibleColors.text } : null,
              ]}
            >
              {t("parent.dashboard.weekly.streakValue", { count: weekly.streakDays })}
            </Text>
          </View>
          <View style={styles.streakTrack}>
            <View style={[styles.streakFill, { width: getRingBarHeight(weekly.streakDays, 7) }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

function MilestonesCard({ milestones }: { milestones: ParentDashboardMilestone[] }) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);

  return (
    <View style={[styles.glassCard, styles.bentoCard]}>
      <CardHeader icon="trophy-outline" titleKey="parent.dashboard.milestones.title" />
      <View style={styles.milestoneList}>
        {milestones.map((milestone) => (
          <MilestoneRow key={milestone.id} milestone={milestone} />
        ))}
        {milestones.length === 0 ? (
          <Text
            style={[
              getAccessibleTextStyle(styles.emptyInlineText, settings),
              settings.highContrast ? { color: accessibleColors.mutedText } : null,
            ]}
          >
            {t("parent.dashboard.milestones.empty")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function MilestoneRow({ milestone }: { milestone: ParentDashboardMilestone }) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const milestoneColors = getMilestoneColors(milestone.kind);

  return (
    <View
      accessible
      accessibilityLabel={t("parent.dashboard.milestones.rowAccessibility", {
        title: getMilestoneTitle(t, milestone),
      })}
      style={[
        styles.milestoneRow,
        {
          backgroundColor: milestoneColors.backgroundColor,
          borderColor: milestoneColors.borderColor,
        },
      ]}
    >
      <View style={styles.milestoneIcon}>
        <Ionicons color={milestoneColors.foregroundColor} name={getMilestoneIcon(milestone.kind)} size={22} />
      </View>
      <View style={styles.milestoneCopy}>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.milestoneTitle, settings),
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
          {getMilestoneTitle(t, milestone)}
        </Text>
        <Text
          numberOfLines={2}
          style={[
            getAccessibleTextStyle(styles.milestoneDescription, settings),
            settings.highContrast ? { color: accessibleColors.mutedText } : null,
          ]}
        >
          {milestone.description}
        </Text>
      </View>
    </View>
  );
}

function UpcomingCard({
  items,
  onOpenAssignments,
  onOpenUpcomingItem,
}: {
  items: ParentDashboardUpcomingItem[];
  onOpenAssignments: () => void;
  onOpenUpcomingItem: (item: ParentDashboardUpcomingItem) => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);

  return (
    <View style={[styles.glassCard, styles.bentoCard]}>
      <CardHeader icon="calendar-outline" titleKey="parent.dashboard.upcoming.title" />
      <View style={styles.upcomingList}>
        {items.map((item) => (
          <UpcomingRow item={item} key={item.id} onPress={onOpenUpcomingItem} />
        ))}
      </View>
      <Pressable
        accessibilityLabel={t("parent.dashboard.upcoming.openCalendarAccessibility")}
        accessibilityRole="button"
        onPress={onOpenAssignments}
        style={({ pressed }) => [styles.textButton, pressed ? styles.pressed : null]}
      >
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.textButtonLabel, settings),
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
          {t("parent.dashboard.upcoming.openCalendar")}
        </Text>
        <Ionicons color={parentColors.primary} name="open-outline" size={14} />
      </Pressable>
    </View>
  );
}

function UpcomingRow({
  item,
  onPress,
}: {
  item: ParentDashboardUpcomingItem;
  onPress: (item: ParentDashboardUpcomingItem) => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const isUrgent = item.status === "revision_in_progress";

  return (
    <Pressable
      accessibilityLabel={t("parent.dashboard.upcoming.rowAccessibility", { title: item.title })}
      accessibilityRole="button"
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.upcomingRow, pressed ? styles.upcomingRowPressed : null]}
    >
      <View style={styles.upcomingHeader}>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.upcomingTitle, settings),
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
          {item.title}
        </Text>
        <View style={[styles.upcomingBadge, isUrgent ? styles.upcomingBadgeUrgent : null]}>
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.upcomingBadgeText, settings),
              isUrgent ? styles.upcomingBadgeTextUrgent : null,
              settings.highContrast && !isUrgent ? { color: accessibleColors.mutedText } : null,
            ]}
          >
            {t(assignmentStatusLabelKeys[item.status])}
          </Text>
        </View>
      </View>
      <Text
        numberOfLines={2}
        style={[
          getAccessibleTextStyle(styles.upcomingContext, settings),
          settings.highContrast ? { color: accessibleColors.mutedText } : null,
        ]}
      >
        {item.context}
      </Text>
      <View style={styles.upcomingProgressRow}>
        <View style={styles.upcomingTrack}>
          <View
            style={[
              styles.upcomingFill,
              {
                backgroundColor: isUrgent ? parentColors.error : parentColors.secondary,
                width: `${item.progressPercent}%`,
              },
            ]}
          />
        </View>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.upcomingPercent, settings),
            settings.highContrast ? { color: accessibleColors.mutedText } : null,
          ]}
        >
          {t("parent.dashboard.upcoming.percent", { count: item.progressPercent })}
        </Text>
      </View>
    </Pressable>
  );
}

function CardHeader({
  icon,
  titleKey,
}: {
  icon: IconName;
  titleKey: TranslationKey;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);

  return (
    <View style={styles.cardHeader}>
      <Text
        numberOfLines={1}
        style={[
          getAccessibleTextStyle(styles.cardTitle, settings),
          settings.highContrast ? { color: accessibleColors.text } : null,
        ]}
      >
        {t(titleKey)}
      </Text>
      <Ionicons color={parentColors.outline} name={icon} size={24} />
    </View>
  );
}

function EncouragementBand({
  onOpenAssignments,
  onOpenReport,
  viewModel,
}: {
  onOpenAssignments: () => void;
  onOpenReport: () => void;
  viewModel: ParentDashboardViewModel;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const studentName = viewModel.selectedStudent?.displayName ?? t("common.fallbackDisplayName");

  return (
    <View style={[styles.glassCard, styles.encouragementBand]}>
      <View style={styles.mascotColumn}>
        <View style={styles.mascotCircle}>
          <Ionicons color={parentColors.primary} name="happy-outline" size={78} />
          <View style={styles.mascotBadge}>
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(styles.mascotBadgeText, settings),
                settings.highContrast ? { color: accessibleColors.text } : null,
              ]}
            >
              {t("parent.dashboard.encouragement.badge", { name: studentName })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.encouragementCopy}>
        <Text
          numberOfLines={2}
          style={[
            getAccessibleTextStyle(styles.encouragementTitle, settings),
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
          {t("parent.dashboard.encouragement.title", { name: studentName })}
        </Text>
        <Text
          numberOfLines={4}
          style={[
            getAccessibleTextStyle(styles.encouragementText, settings),
            settings.highContrast ? { color: accessibleColors.mutedText } : null,
          ]}
        >
          {t("parent.dashboard.encouragement.description", {
            count: viewModel.confidenceGrowthPercent,
            summary: viewModel.encouragementSummary,
          })}
        </Text>
        <View style={styles.encouragementActions}>
          <Pressable
            accessibilityLabel={t("parent.dashboard.encouragement.reviewAccessibility")}
            accessibilityRole="button"
            onPress={onOpenAssignments}
            style={({ pressed }) => [styles.primaryPillButton, pressed ? styles.pressed : null]}
          >
            <Text numberOfLines={1} style={getAccessibleTextStyle(styles.primaryPillButtonText, settings)}>
              {t("parent.dashboard.encouragement.review")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t("parent.dashboard.encouragement.sendAccessibility")}
            accessibilityRole="button"
            onPress={onOpenReport}
            style={({ pressed }) => [styles.secondaryPillButton, pressed ? styles.pressed : null]}
          >
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(styles.secondaryPillButtonText, settings),
                settings.highContrast ? { color: accessibleColors.text } : null,
              ]}
            >
              {t("parent.dashboard.encouragement.send")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const cardShadow = {
  elevation: 2,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 14,
} as const;

const styles = StyleSheet.create({
  bentoCard: {
    flex: 1,
    minHeight: 292,
    minWidth: 0,
    padding: parentSpacing.lg,
  },
  bentoGrid: {
    gap: parentSpacing.lg,
  },
  bentoGridTablet: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: parentSpacing.xl,
  },
  cardShadow,
  cardTitle: {
    color: parentColors.primary,
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  childHero: {
    flex: 2,
    minHeight: 276,
    minWidth: 0,
    overflow: "hidden",
    padding: 28,
  },
  childHeroTablet: {
    minHeight: 292,
  },
  childName: {
    color: parentColors.primary,
    flexShrink: 1,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
  },
  childTitleRow: {
    gap: parentSpacing.md,
    marginBottom: parentSpacing.lg,
  },
  childTitleRowTablet: {
    alignItems: "flex-end",
    flexDirection: "row",
  },
  coachButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: parentRadius.lg,
    flexDirection: "row",
    gap: parentSpacing.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: parentSpacing.lg,
  },
  coachButtonText: {
    color: parentColors.onPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  coachCard: {
    backgroundColor: parentColors.primary,
    borderRadius: parentRadius.xl,
    flex: 1,
    justifyContent: "space-between",
    minHeight: 276,
    minWidth: 252,
    overflow: "hidden",
    padding: 24,
  },
  coachContent: {
    gap: parentSpacing.lg,
    zIndex: 1,
  },
  coachText: {
    color: parentColors.onPrimaryContainer,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  coachTitle: {
    color: parentColors.onPrimary,
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  coachTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: parentSpacing.sm,
  },
  coachWatermark: {
    opacity: 0.1,
    position: "absolute",
    right: 16,
    top: 16,
  },
  content: {
    alignSelf: "center",
    gap: parentSpacing.section,
    maxWidth: 430,
    width: "100%",
  },
  contentTablet: {
    maxWidth: 1180,
  },
  emptyInlineText: {
    color: parentColors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  encouragementActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: parentSpacing.md,
    paddingTop: parentSpacing.sm,
  },
  encouragementBand: {
    alignItems: "center",
    gap: 28,
    padding: 28,
  },
  encouragementCopy: {
    flex: 1,
    gap: parentSpacing.md,
    minWidth: 0,
  },
  encouragementText: {
    color: parentColors.onSurfaceVariant,
    fontSize: 18,
    fontWeight: "400",
    lineHeight: 28,
  },
  encouragementTitle: {
    color: parentColors.primary,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
  },
  glassCard: {
    ...cardShadow,
    backgroundColor: parentColors.card,
    borderColor: parentColors.outlineVariant,
    borderRadius: parentRadius.xl,
    borderWidth: 1,
  },
  gradeChip: {
    alignSelf: "flex-start",
    backgroundColor: parentColors.surfaceContainerHigh,
    borderRadius: parentRadius.full,
    paddingHorizontal: parentSpacing.lg,
    paddingVertical: parentSpacing.xs,
  },
  gradeChipText: {
    color: parentColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  header: {
    backgroundColor: parentColors.surface,
    paddingHorizontal: parentSpacing.xl,
  },
  headerContentTablet: {
    alignSelf: "center",
    maxWidth: 1180,
    width: "100%",
  },
  headerTablet: {
    paddingHorizontal: 32,
  },
  heroBubblePrimary: {
    backgroundColor: "rgba(108, 248, 187, 0.18)",
    borderRadius: parentRadius.full,
    height: 192,
    position: "absolute",
    right: -54,
    top: -54,
    width: 192,
  },
  heroBubbleSecondary: {
    backgroundColor: "rgba(0, 71, 171, 0.08)",
    borderRadius: parentRadius.full,
    bottom: -28,
    height: 128,
    left: -24,
    position: "absolute",
    width: 128,
  },
  heroContent: {
    gap: parentSpacing.md,
    zIndex: 1,
  },
  heroEyebrow: {
    color: parentColors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  heroGrid: {
    gap: parentSpacing.lg,
  },
  heroGridTablet: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  heroStat: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    borderColor: parentColors.outlineVariant,
    borderRadius: parentRadius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: parentSpacing.sm,
    minHeight: 68,
    minWidth: 154,
    paddingHorizontal: parentSpacing.lg,
    paddingVertical: parentSpacing.sm,
  },
  heroStatCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroStatLabel: {
    color: parentColors.outline,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: parentSpacing.md,
    marginTop: parentSpacing.sm,
  },
  heroStatValue: {
    color: parentColors.onSurface,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  mascotBadge: {
    backgroundColor: parentColors.secondaryContainer,
    borderRadius: parentRadius.full,
    bottom: -8,
    paddingHorizontal: parentSpacing.lg,
    paddingVertical: parentSpacing.xs,
    position: "absolute",
  },
  mascotBadgeText: {
    color: parentColors.onSecondaryContainer,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  mascotCircle: {
    alignItems: "center",
    backgroundColor: parentColors.surfaceContainerHigh,
    borderRadius: parentRadius.full,
    height: 192,
    justifyContent: "center",
    width: 192,
  },
  mascotColumn: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 220,
  },
  milestoneCopy: {
    flex: 1,
    gap: parentSpacing.xs,
    minWidth: 0,
  },
  milestoneDescription: {
    color: parentColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  milestoneIcon: {
    alignItems: "center",
    backgroundColor: parentColors.surfaceContainerHigh,
    borderRadius: parentRadius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  milestoneList: {
    gap: parentSpacing.md,
  },
  milestoneRow: {
    alignItems: "flex-start",
    borderRadius: parentRadius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: parentSpacing.md,
    minHeight: 78,
    padding: parentSpacing.md,
  },
  milestoneTitle: {
    color: parentColors.onSurface,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  primaryPillButton: {
    alignItems: "center",
    backgroundColor: parentColors.primary,
    borderRadius: parentRadius.full,
    minHeight: 48,
    paddingHorizontal: 28,
    paddingVertical: parentSpacing.md,
  },
  primaryPillButtonText: {
    color: parentColors.onPrimary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  ringSegment: {
    borderRadius: 4,
    height: 12,
    left: 76,
    position: "absolute",
    top: 74,
    width: 8,
  },
  safeArea: {
    backgroundColor: parentColors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 132,
    paddingHorizontal: parentSpacing.xl,
    paddingTop: 28,
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
  },
  secondaryPillButton: {
    alignItems: "center",
    borderColor: parentColors.primary,
    borderRadius: parentRadius.full,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 28,
    paddingVertical: parentSpacing.md,
  },
  secondaryPillButtonText: {
    color: parentColors.primary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  streakBlock: {
    gap: parentSpacing.sm,
    width: "100%",
  },
  streakFill: {
    backgroundColor: parentColors.primary,
    borderRadius: parentRadius.full,
    height: "100%",
  },
  streakLabel: {
    color: parentColors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  streakRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  streakTrack: {
    backgroundColor: parentColors.surfaceContainerHigh,
    borderRadius: parentRadius.full,
    height: 8,
    overflow: "hidden",
  },
  streakValue: {
    color: parentColors.primary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  textButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: parentSpacing.xs,
    justifyContent: "center",
    marginTop: parentSpacing.md,
    minHeight: 44,
  },
  textButtonLabel: {
    color: parentColors.primary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  upcomingBadge: {
    backgroundColor: parentColors.surfaceContainerHigh,
    borderRadius: parentRadius.sm,
    paddingHorizontal: parentSpacing.sm,
    paddingVertical: 2,
  },
  upcomingBadgeText: {
    color: parentColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  upcomingBadgeTextUrgent: {
    color: parentColors.onErrorContainer,
  },
  upcomingBadgeUrgent: {
    backgroundColor: parentColors.errorContainer,
  },
  upcomingContext: {
    color: parentColors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  upcomingFill: {
    borderRadius: parentRadius.full,
    height: "100%",
  },
  upcomingHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: parentSpacing.sm,
    justifyContent: "space-between",
  },
  upcomingList: {
    gap: parentSpacing.md,
  },
  upcomingPercent: {
    color: parentColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  upcomingProgressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: parentSpacing.sm,
  },
  upcomingRow: {
    backgroundColor: parentColors.card,
    borderColor: parentColors.outlineVariant,
    borderRadius: parentRadius.xl,
    borderWidth: 1,
    gap: parentSpacing.sm,
    padding: parentSpacing.lg,
  },
  upcomingRowPressed: {
    borderColor: parentColors.primary,
  },
  upcomingTitle: {
    color: parentColors.onSurface,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  upcomingTrack: {
    backgroundColor: parentColors.surfaceContainerHigh,
    borderRadius: parentRadius.full,
    flex: 1,
    height: 6,
    overflow: "hidden",
  },
  weeklyBody: {
    alignItems: "center",
    flex: 1,
    gap: parentSpacing.xl,
    justifyContent: "center",
  },
  weeklyGoal: {
    color: parentColors.outline,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  weeklyMinutes: {
    color: parentColors.onSurface,
    fontSize: 32,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 40,
  },
  weeklyRing: {
    alignItems: "center",
    height: 160,
    justifyContent: "center",
    width: 160,
  },
  weeklyRingCenter: {
    alignItems: "center",
    backgroundColor: parentColors.card,
    borderRadius: parentRadius.full,
    height: 104,
    justifyContent: "center",
    width: 104,
  },
});
