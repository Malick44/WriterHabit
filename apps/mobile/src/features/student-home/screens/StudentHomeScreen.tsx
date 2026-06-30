import { useCallback, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAssignmentDetailRoute,
  getCanvasCreateRoute,
  getStudentReviewRoute,
} from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import {
  overrideRecord,
  overrideStyle,
  useRegisterTunableComponents,
  useRegisterTunableScreen,
} from "@/devtools/theme-tuner";
import { palette, type GradeBand } from "@/design/tokens";
import { useI18n, type TFunction, type TranslationKey } from "@/i18n";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
  StatusState,
} from "@/shared/components/feedback";
import { ComposerSurface } from "@/shared/components/layout";
import {
  AppHeader,
  BOTTOM_MENU_SCROLL_EVENT_THROTTLE,
  useBottomMenuScrollHandler,
} from "@/shared/components/navigation";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
  type AccessibilitySettings,
} from "@/shared/utils/accessibility";

import { MomentumCardsRow, StreakHeroCard } from "../components";
import { useStudentHomeData } from "../hooks/useStudentHomeData";
import {
  homeColors,
  homeRadius,
  homeSpacing,
  studentHomeComponentConfigs,
  studentHomeScreenConfig,
  useStudentHomeTokenOverrides,
  type StudentHomeTokenOverrides,
} from "../themeTuning";
import type {
  StudentHomeAssignment,
  StudentHomeCoachAction,
  StudentHomeDraft,
  StudentHomeFeedback,
  StudentHomeNavigationTarget,
  StudentHomeSkillProgress,
  StudentHomeViewModel,
} from "../types";

type IconName = keyof typeof Ionicons.glyphMap;

type WeeklyStat = {
  accentColor: string;
  backgroundColor: string;
  icon: IconName;
  key: string;
  label: string;
  value: string;
};

const FEEDBACK_REWARD_POINTS = 12;
const RING_SEGMENT_COUNT = 24;
const RING_SEGMENTS = Array.from(
  { length: RING_SEGMENT_COUNT },
  (_, index) => index,
);
const TABLET_BREAKPOINT = 768;

const skillLabelKeys = {
  argument_strength: "assignments.skills.argument_strength",
  clarity: "assignments.skills.clarity",
  creativity: "assignments.skills.creativity",
  evidence_usage: "assignments.skills.evidence_usage",
  grammar: "assignments.skills.grammar",
  handwriting: "assignments.skills.handwriting",
  organization: "assignments.skills.organization",
  punctuation: "assignments.skills.punctuation",
  reading_response: "assignments.skills.reading_response",
  revision_quality: "assignments.skills.revision_quality",
  sentence_structure: "assignments.skills.sentence_structure",
  spelling: "assignments.skills.spelling",
  vocabulary: "assignments.skills.vocabulary",
} satisfies Record<StudentHomeAssignment["skillFocus"][number], TranslationKey>;

const assignmentStatusLabelKeys = {
  feedback_ready: "assignments.status.feedback_ready",
  in_progress: "assignments.status.in_progress",
  not_started: "assignments.status.not_started",
  revision_in_progress: "assignments.status.revision_in_progress",
  submitted: "assignments.status.submitted",
} satisfies Record<StudentHomeAssignment["status"], TranslationKey>;

const skillProgressColors = [
  homeColors.secondaryFixedDim,
  homeColors.secondaryFixedDim,
  homeColors.tertiaryFixedDim,
] as const;

function getSkillLabel(
  t: TFunction,
  skill: StudentHomeAssignment["skillFocus"][number],
) {
  return t(skillLabelKeys[skill]);
}

function getProgressSkillLabel(t: TFunction, skill: StudentHomeSkillProgress) {
  return t(skillLabelKeys[skill.skill]);
}

function getAssignmentStatusLabel(
  t: TFunction,
  assignment: StudentHomeAssignment,
) {
  return t(assignmentStatusLabelKeys[assignment.status]);
}

// Dev-only style fragments for the theme tuner. They resolve to null unless a
// token is overridden, which never happens in production builds. Compact cards
// (draft, feedback) ship 4pt tighter than regular cards, so a tuned
// `spacing.cardPadding` keeps that offset instead of unifying every card.
const COMPACT_CARD_PADDING_OFFSET = homeSpacing.lg - homeSpacing.md;

function tunedCardStyle(
  tuned: StudentHomeTokenOverrides,
  padding?: "regular" | "compact",
): ViewStyle | null {
  const cardPadding = tuned["spacing.cardPadding"];

  return overrideStyle<ViewStyle>({
    backgroundColor: tuned["colors.cardBackground"],
    borderColor: tuned["colors.cardBorder"],
    borderRadius: tuned["radius.card"],
    padding:
      padding === undefined || cardPadding === undefined
        ? undefined
        : padding === "compact"
          ? Math.max(homeSpacing.xs, cardPadding - COMPACT_CARD_PADDING_OFFSET)
          : cardPadding,
  });
}

function tunedTextStyle(
  color?: string,
  fontSize?: number,
  lineHeight?: number,
): TextStyle | null {
  return overrideStyle<TextStyle>({
    color,
    fontSize,
    lineHeight:
      lineHeight ??
      (fontSize === undefined ? undefined : Math.round(fontSize * 1.4)),
  });
}

/**
 * High-contrast color overrides for directly colored dashboard text. Resolves
 * to null entries when high contrast is off so the navy palette is untouched.
 */
function getHighContrastTextStyles(settings: AccessibilitySettings): {
  body: TextStyle | null;
  muted: TextStyle | null;
} {
  if (!settings.highContrast) {
    return { body: null, muted: null };
  }

  const accessibleColors = getAccessibleColors(settings);

  return {
    body: { color: accessibleColors.text },
    muted: { color: accessibleColors.mutedText },
  };
}

export function StudentHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const state = useStudentHomeData();
  const viewModel = state.status === "success" ? state.viewModel : null;
  const isTablet = width >= TABLET_BREAKPOINT;
  const handleBottomMenuScroll = useBottomMenuScrollHandler();

  useRegisterTunableScreen(studentHomeScreenConfig);
  useRegisterTunableComponents(studentHomeComponentConfigs);
  const tuned = useStudentHomeTokenOverrides();
  const tunedScreenBackground = overrideStyle<ViewStyle>({
    backgroundColor: tuned["colors.screenBackground"],
  });
  const tunedHeaderColors = overrideRecord({
    actionForeground: tuned["colors.textSecondary"],
    background: tuned["colors.screenBackground"],
    mutedText: tuned["colors.textSecondary"],
    text: tuned["colors.textPrimary"],
  });

  const navigateToTarget = useCallback(
    (target: StudentHomeNavigationTarget) => {
      switch (target.kind) {
        case "assignmentDetail":
          router.push(getAssignmentDetailRoute(target.assignmentId));
          return;
        case "assignmentHistory":
          router.push(routes.studentAssignmentsHistory);
          return;
        case "canvasCreate":
          router.push(getCanvasCreateRoute());
          return;
        case "progress":
          router.push(routes.studentProgress);
          return;
        case "review":
          router.push(getStudentReviewRoute(target.submissionId));
          return;
        case "write":
          // Writing work happens by handwriting on the canvas, so the "write"
          // target opens the canvas templates for the assignment.
          router.push(getCanvasCreateRoute(target.assignmentId));
          return;
      }
    },
    [router],
  );

  const handleOpenTodayAssignment = useCallback(() => {
    if (!viewModel?.todayAssignment) {
      navigateToTarget({ kind: "assignmentHistory" });
      return;
    }

    navigateToTarget({
      assignmentId: viewModel.todayAssignment.id,
      kind: "assignmentDetail",
    });
  }, [navigateToTarget, viewModel]);

  const handleViewProgress = useCallback(() => {
    navigateToTarget({ kind: "progress" });
  }, [navigateToTarget]);

  const handleContinueDraft = useCallback(() => {
    if (!viewModel?.continueDraft) {
      return;
    }

    navigateToTarget({
      assignmentId: viewModel.continueDraft.assignmentId,
      kind: "write",
      stage: "draft",
    });
  }, [navigateToTarget, viewModel]);

  const handleReviewFeedback = useCallback(() => {
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

  const handleOpenAllAssignments = useCallback(() => {
    navigateToTarget({ kind: "assignmentHistory" });
  }, [navigateToTarget]);

  const handleStartPractice = useCallback(() => {
    navigateToTarget({ kind: "canvasCreate" });
  }, [navigateToTarget]);

  const handleOpenGrade3Writing = useCallback(() => {
    router.push(routes.studentGrade3Writing);
  }, [router]);

  const handleOpenTask = useCallback(() => {
    if (viewModel?.continueDraft) {
      handleContinueDraft();
      return;
    }

    handleOpenTodayAssignment();
  }, [handleContinueDraft, handleOpenTodayAssignment, viewModel]);

  const handleOpenSettings = useCallback(() => {
    router.push(routes.studentSettings);
  }, [router]);

  const handleOpenNotifications = useCallback(() => {
    router.push(routes.studentNotificationSettings);
  }, [router]);

  return (
    <ComposerSurface>
      <SafeAreaView
        edges={["top"]}
        style={[
          styles.safeArea,
          tunedScreenBackground,
          styles.transparentSurface,
        ]}
      >
        <AppHeader
          gradeBand={state.gradeBand}
          leftAction={{ type: "none" }}
          titleKey="common.dashboard"
          rightActions={[
            {
              accessibilityLabelKey:
                "studentHome.header.notificationsAccessibility",
              icon: "notifications-outline",
              onPress: handleOpenNotifications,
              type: "icon",
            },
            {
              accessibilityLabelKey: "studentHome.header.settingsAccessibility",
              icon: "settings-outline",
              onPress: handleOpenSettings,
              type: "icon",
            },
          ]}
          colorOverrides={tunedHeaderColors}
          contentStyle={isTablet ? styles.appHeaderContentTablet : undefined}
          showSafeArea={false}
          style={[
            styles.appHeader,
            isTablet ? styles.appHeaderTablet : null,
            tunedScreenBackground,
          ]}
          variant="compact"
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet ? styles.scrollContentTablet : null,
          ]}
          contentInsetAdjustmentBehavior="automatic"
          onScroll={handleBottomMenuScroll}
          scrollEventThrottle={BOTTOM_MENU_SCROLL_EVENT_THROTTLE}
          showsVerticalScrollIndicator={false}
          testID="student-home-screen"
        >
          <View
            style={[
              styles.content,
              isTablet ? styles.contentTablet : null,
              overrideStyle<ViewStyle>({ gap: tuned["spacing.section"] }),
            ]}
          >
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
                onActionPress={() =>
                  navigateToTarget({ kind: "assignmentHistory" })
                }
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

                {isTablet ? (
                  <>
                    <TodayPlanOverviewCard
                      isTablet={isTablet}
                      onOpenPractice={handleStartPractice}
                      onOpenTask={handleOpenTask}
                      onViewProgress={handleViewProgress}
                      viewModel={viewModel}
                    />

                    <View style={styles.tabletDashboardGrid}>
                      <View style={styles.tabletPrimaryColumn}>
                        {viewModel.todayAssignment ? (
                          <DashboardSection titleKey="studentHome.todayAssignment.sectionLabel">
                            <TodayAssignmentCard
                              assignment={viewModel.todayAssignment}
                              isTablet={isTablet}
                              onPress={handleOpenTodayAssignment}
                            />
                          </DashboardSection>
                        ) : null}

                        {viewModel.continueDraft ? (
                          <DashboardSection titleKey="studentHome.continueDraft.title">
                            <ContinueDraftCard
                              draft={viewModel.continueDraft}
                              isTablet={isTablet}
                              onPress={handleContinueDraft}
                            />
                          </DashboardSection>
                        ) : null}

                        <RecentFeedbackSection
                          feedback={viewModel.recentFeedback[0] ?? null}
                          isTablet={isTablet}
                          onPress={handleReviewFeedback}
                        />
                      </View>

                      <View style={styles.tabletSecondaryColumn}>
                        <StreakHeroCard
                          streak={viewModel.streak}
                          weeklySessionsCompleted={
                            viewModel.weeklyWriting.sessionsCompleted
                          }
                        />
                        <Grade3AdventureHomeCard
                          isTablet={isTablet}
                          onPress={handleOpenGrade3Writing}
                        />
                        <WeeklyProgressSummary
                          isTablet={isTablet}
                          viewModel={viewModel}
                        />
                        <SkillProgressCard
                          isTablet={isTablet}
                          onViewAll={handleViewProgress}
                          skills={viewModel.skillProgress}
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Greeting name={viewModel.studentFirstName} />

                    <TodayPlanOverviewCard
                      onOpenPractice={handleStartPractice}
                      onOpenTask={handleOpenTask}
                      onViewProgress={handleViewProgress}
                      viewModel={viewModel}
                    />

                    <MomentumCardsRow
                      onOpenAllAssignments={handleOpenAllAssignments}
                      onOpenFeedback={handleReviewFeedback}
                      onOpenPractice={handleStartPractice}
                      onOpenTask={handleOpenTask}
                      viewModel={viewModel}
                    />

                    <Grade3AdventureHomeCard onPress={handleOpenGrade3Writing} />

                    <StreakHeroCard
                      streak={viewModel.streak}
                      weeklySessionsCompleted={
                        viewModel.weeklyWriting.sessionsCompleted
                      }
                    />

                    <CoachChipsCard
                      actions={viewModel.coachActions}
                      onActionPress={(action) =>
                        navigateToTarget(action.target)
                      }
                    />

                    <WeeklyWritingCard
                      gradeBand={state.gradeBand}
                      viewModel={viewModel}
                    />

                    <SkillProgressCard
                      onViewAll={handleViewProgress}
                      skills={viewModel.skillProgress}
                    />
                  </>
                )}
              </>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ComposerSurface>
  );
}

function Greeting({ name }: { name: string }) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const highContrastText = getHighContrastTextStyles(settings);

  return (
    <Text
      accessibilityRole="header"
      numberOfLines={1}
      selectable
      style={[
        getAccessibleTextStyle(styles.greeting, settings),
        highContrastText.body,
      ]}
    >
      {t("studentHome.greeting", { name })}
    </Text>
  );
}

function CoachChipsCard({
  actions,
  onActionPress,
}: {
  actions: StudentHomeCoachAction[];
  onActionPress: (action: StudentHomeCoachAction) => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);

  return (
    <View
      accessibilityLabel={t("studentHome.coach.accessibility")}
      style={[styles.card, styles.coachCard, tunedCardStyle(tuned, "regular")]}
      testID="student-home-coach"
    >
      <View style={styles.coachHeaderRow}>
        <View style={styles.coachIconBubble}>
          <Ionicons name="sparkles" size={16} color={homeColors.secondary} />
        </View>
        <Text
          numberOfLines={1}
          selectable
          style={[
            getAccessibleTextStyle(styles.coachTitle, settings),
            highContrastText.body,
          ]}
        >
          {t("studentHome.coach.title")}
        </Text>
      </View>
      <View style={styles.coachChips}>
        {actions.map((action) => (
          <Pressable
            accessibilityHint={t("studentHome.coach.actionHint")}
            accessibilityLabel={t(action.accessibilityLabelKey)}
            accessibilityRole="button"
            key={action.id}
            onPress={() => onActionPress(action)}
            style={({ pressed }) => [
              styles.coachChip,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              numberOfLines={1}
              selectable={false}
              style={[
                getAccessibleTextStyle(styles.coachChipText, settings),
                highContrastText.body,
              ]}
            >
              {t(action.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text
        selectable
        style={[
          getAccessibleTextStyle(styles.coachSafetyNote, settings),
          highContrastText.muted,
        ]}
      >
        {t("aiCoach.safetyReminder")}
      </Text>
    </View>
  );
}

function WeeklyWritingCard({
  gradeBand,
  viewModel,
}: {
  gradeBand: GradeBand;
  viewModel: StudentHomeViewModel;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);
  const description = viewModel.gradeAdaptation.showWeeklySessionCount
    ? t("studentHome.practice.weeklyDescriptionWithSessions", {
        count: viewModel.weeklyWriting.sessionsCompleted,
      })
    : t("studentHome.practice.weeklyDescription");

  return (
    <View
      style={[styles.card, styles.weeklyCard, tunedCardStyle(tuned, "regular")]}
      testID="student-home-weekly-minutes"
    >
      <View style={styles.weeklyHeaderRow}>
        <Text
          numberOfLines={1}
          selectable
          style={[
            getAccessibleTextStyle(styles.sectionTitle, settings),
            highContrastText.muted,
          ]}
        >
          {t("studentHome.practice.weeklyTitle")}
        </Text>
        <Text
          numberOfLines={1}
          selectable
          style={[
            getAccessibleTextStyle(styles.weeklyValue, settings),
            highContrastText.body,
          ]}
        >
          {t("studentHome.practice.weeklyValue", {
            completed: viewModel.weeklyWriting.minutesCompleted,
            goal: viewModel.weeklyWriting.minutesGoal,
          })}
        </Text>
      </View>
      <ProgressBar
        gradeBand={gradeBand}
        label={t("studentHome.practice.weeklyProgressAccessibility")}
        value={viewModel.weeklyProgressValue}
      />
      <Text
        selectable
        style={[
          getAccessibleTextStyle(styles.weeklyDescription, settings),
          highContrastText.muted,
        ]}
      >
        {description}
      </Text>
    </View>
  );
}

function TodayPlanOverviewCard({
  isTablet = false,
  onOpenPractice,
  onOpenTask,
  onViewProgress,
  viewModel,
}: {
  isTablet?: boolean;
  onOpenPractice: () => void;
  onOpenTask: () => void;
  onViewProgress: () => void;
  viewModel: StudentHomeViewModel;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);
  const primaryColor = tuned["colors.buttonPrimary"] ?? homeColors.primary;
  const draft = viewModel.continueDraft;
  const assignment = viewModel.todayAssignment;
  const planTitle =
    draft?.title ??
    assignment?.title ??
    t("studentHome.todayPlan.emptyTaskTitle");
  const planMeta = draft
    ? t("studentHome.todayPlan.draftMeta", { count: draft.wordCount })
    : assignment
      ? t("studentHome.todayPlan.assignmentMeta", {
          count: assignment.estimatedMinutes,
          skill: getSkillLabel(t, assignment.skillFocus[0]),
        })
      : t("studentHome.todayPlan.emptyTaskMeta");
  const primaryActionLabel = draft
    ? t("studentHome.todayPlan.continueCta")
    : assignment
      ? t("studentHome.todayPlan.startCta")
      : t("studentHome.todayPlan.assignmentsCta");
  const practiceMeta = viewModel.dailyPractice.completedToday
    ? t("studentHome.todayPlan.practiceDone")
    : t("studentHome.todayPlan.practiceMinutes", {
        count: viewModel.dailyPractice.minutesGoal,
      });

  return (
    <View
      accessible
      accessibilityLabel={t("studentHome.todayPlan.accessibility")}
      style={[
        styles.card,
        styles.todayPlanCard,
        isTablet ? styles.todayPlanCardTablet : null,
        tunedCardStyle(tuned, "regular"),
      ]}
      testID="student-home-today-plan"
    >
      <View style={styles.todayPlanHeader}>
        <View style={styles.todayPlanIconBubble}>
          <Ionicons name="sparkles" size={20} color={primaryColor} />
        </View>
        <View style={styles.todayPlanHeaderCopy}>
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.todayPlanEyebrow, settings),
              highContrastText.muted,
            ]}
          >
            {t("studentHome.todayPlan.eyebrow")}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              getAccessibleTextStyle(styles.todayPlanTitle, settings),
              tunedTextStyle(tuned["colors.textPrimary"]),
              highContrastText.body,
            ]}
          >
            {planTitle}
          </Text>
        </View>
      </View>

      <Text
        numberOfLines={2}
        style={[
          getAccessibleTextStyle(styles.todayPlanMeta, settings),
          tunedTextStyle(tuned["colors.textSecondary"]),
          highContrastText.muted,
        ]}
      >
        {planMeta}
      </Text>

      <View style={styles.todayPlanStatsRow}>
        <TodayPlanStat
          icon="flame-outline"
          label={t("studentHome.todayPlan.streakLabel")}
          value={t("studentHome.todayPlan.streakValue", {
            count: viewModel.streak.currentDays,
          })}
        />
        <TodayPlanStat
          icon="time-outline"
          label={t("studentHome.todayPlan.practiceLabel")}
          value={practiceMeta}
        />
        <TodayPlanStat
          icon="bar-chart-outline"
          label={t("studentHome.todayPlan.weekLabel")}
          value={t("studentHome.todayPlan.weekValue", {
            completed: viewModel.weeklyWriting.minutesCompleted,
            goal: viewModel.weeklyWriting.minutesGoal,
          })}
        />
      </View>

      <View style={styles.todayPlanActions}>
        <Pressable
          accessibilityLabel={t("studentHome.todayPlan.primaryAccessibility")}
          accessibilityRole="button"
          onPress={onOpenTask}
          style={({ pressed }) => [
            styles.todayPlanPrimaryButton,
            pressed ? styles.cardPressed : null,
          ]}
        >
          <Text
            numberOfLines={1}
            style={getAccessibleTextStyle(styles.todayPlanPrimaryText, settings)}
          >
            {primaryActionLabel}
          </Text>
          <Ionicons name="arrow-forward" size={17} color={homeColors.inverseText} />
        </Pressable>
        <Pressable
          accessibilityLabel={t("studentHome.todayPlan.practiceAccessibility")}
          accessibilityRole="button"
          onPress={onOpenPractice}
          style={({ pressed }) => [
            styles.todayPlanSecondaryButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons name="create-outline" size={17} color={primaryColor} />
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.todayPlanSecondaryText, settings),
              highContrastText.body,
            ]}
          >
            {t("studentHome.todayPlan.practiceCta")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={t("studentHome.todayPlan.progressAccessibility")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onViewProgress}
          style={({ pressed }) => [
            styles.todayPlanIconButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons name="stats-chart" size={18} color={primaryColor} />
        </Pressable>
      </View>
    </View>
  );
}

function TodayPlanStat({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  const { settings } = useAccessibilityContext();
  const highContrastText = getHighContrastTextStyles(settings);

  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.todayPlanStat}>
      <Ionicons name={icon} size={16} color={homeColors.primary} />
      <View style={styles.todayPlanStatCopy}>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.todayPlanStatValue, settings),
            highContrastText.body,
          ]}
        >
          {value}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.todayPlanStatLabel, settings),
            highContrastText.muted,
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function Grade3AdventureHomeCard({
  isTablet = false,
  onPress,
}: {
  isTablet?: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);
  const primaryColor = tuned["colors.buttonPrimary"] ?? homeColors.primary;

  return (
    <Pressable
      accessibilityHint={t("studentHome.grade3Adventure.hint")}
      accessibilityLabel={t("studentHome.grade3Adventure.accessibility")}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        styles.grade3AdventureCard,
        isTablet ? styles.grade3AdventureCardTablet : null,
        tunedCardStyle(tuned, "regular"),
        pressed ? styles.cardPressed : null,
      ]}
      testID="student-home-grade3-writing"
    >
      <View style={styles.grade3AdventureIcon}>
        <Ionicons name="map-outline" size={25} color={primaryColor} />
      </View>
      <View style={styles.grade3AdventureCopy}>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.grade3AdventureEyebrow, settings),
            highContrastText.muted,
          ]}
        >
          {t("studentHome.grade3Adventure.eyebrow")}
        </Text>
        <Text
          numberOfLines={2}
          style={[
            getAccessibleTextStyle(styles.grade3AdventureTitle, settings),
            tunedTextStyle(tuned["colors.buttonPrimary"]),
            highContrastText.body,
          ]}
        >
          {t("studentHome.grade3Adventure.title")}
        </Text>
        <Text
          numberOfLines={2}
          style={[
            getAccessibleTextStyle(styles.grade3AdventureDescription, settings),
            tunedTextStyle(tuned["colors.textSecondary"]),
            highContrastText.muted,
          ]}
        >
          {t("studentHome.grade3Adventure.description")}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={23}
        color={tuned["colors.cardBorder"] ?? homeColors.outlineVariant}
      />
    </Pressable>
  );
}

function DashboardSection({
  children,
  titleKey,
}: {
  children: ReactNode;
  titleKey: TranslationKey;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);

  return (
    <View style={styles.section}>
      <Text
        numberOfLines={1}
        style={[
          getAccessibleTextStyle(styles.sectionTitle, settings),
          tunedTextStyle(tuned["colors.textSecondary"]),
          highContrastText.muted,
        ]}
      >
        {t(titleKey)}
      </Text>
      {children}
    </View>
  );
}

function SectionHeaderWithAction({
  actionAccessibilityKey,
  onPress,
  titleKey,
}: {
  actionAccessibilityKey: TranslationKey;
  onPress: () => void;
  titleKey: TranslationKey;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);

  return (
    <View style={styles.sectionHeaderRow}>
      <Text
        numberOfLines={1}
        style={[
          getAccessibleTextStyle(styles.sectionTitle, settings),
          tunedTextStyle(tuned["colors.textSecondary"]),
          highContrastText.muted,
        ]}
      >
        {t(titleKey)}
      </Text>
      <Pressable
        accessibilityLabel={t(actionAccessibilityKey)}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => [
          styles.seeAllButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.seeAllText, settings),
            tunedTextStyle(tuned["colors.buttonPrimary"]),
            highContrastText.body,
          ]}
        >
          {t("common.viewAll")}
        </Text>
      </Pressable>
    </View>
  );
}

function TodayAssignmentCard({
  assignment,
  isTablet = false,
  onPress,
}: {
  assignment: StudentHomeAssignment;
  isTablet?: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);
  const primarySkill = assignment.skillFocus[0];
  const statusLabel = getAssignmentStatusLabel(t, assignment);
  const skillLabel = primarySkill
    ? getSkillLabel(t, primarySkill)
    : t("common.unavailable");

  return (
    <Pressable
      accessibilityHint={t("studentHome.todayAssignment.detailsHint")}
      accessibilityLabel={t("studentHome.todayAssignment.detailsAccessibility")}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        styles.assignmentCard,
        isTablet ? styles.assignmentCardTablet : null,
        tunedCardStyle(tuned, "regular"),
        pressed ? styles.cardPressed : null,
      ]}
      testID="student-home-today-assignment"
    >
      <View style={styles.assignmentTitleRow}>
        <View style={styles.assignmentTitleCopy}>
          <Text
            numberOfLines={3}
            style={[
              getAccessibleTextStyle(styles.assignmentTitle, settings),
              tunedTextStyle(
                tuned["colors.buttonPrimary"],
                tuned["typography.titleSize"],
                tuned["typography.titleLineHeight"],
              ),
              highContrastText.body,
            ]}
          >
            {assignment.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.assignmentSkill, settings),
              tunedTextStyle(tuned["colors.textSecondary"]),
              highContrastText.muted,
            ]}
          >
            {skillLabel}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={24}
          color={tuned["colors.cardBorder"] ?? homeColors.outlineVariant}
        />
      </View>

      <View style={styles.assignmentMetaRow}>
        <View style={styles.inlineMeta}>
          <Ionicons
            name="time-outline"
            size={16}
            color={tuned["colors.textSecondary"] ?? homeColors.onSurfaceVariant}
          />
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.metaText, settings),
              tunedTextStyle(tuned["colors.textSecondary"]),
              highContrastText.muted,
            ]}
          >
            {t("common.minutes", { count: assignment.estimatedMinutes })}
          </Text>
        </View>
        <View style={styles.inlineMeta}>
          <Ionicons
            name="ellipse-outline"
            size={16}
            color={tuned["colors.cardBorder"] ?? homeColors.outlineVariant}
          />
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.metaTextMuted, settings),
              highContrastText.muted,
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function WeeklyProgressSummary({
  isTablet = false,
  viewModel,
}: {
  isTablet?: boolean;
  viewModel: StudentHomeViewModel;
}) {
  const { t } = useI18n();
  const tuned = useStudentHomeTokenOverrides();
  const stats: WeeklyStat[] = [
    {
      accentColor: homeColors.error,
      backgroundColor: homeColors.errorContainer,
      icon: "flame",
      key: "streak",
      label: t("studentHome.weeklySummary.streakLabel"),
      value: t("studentHome.weeklySummary.dayCount", {
        count: viewModel.streak.currentDays,
      }),
    },
    {
      accentColor: tuned["colors.buttonPrimary"] ?? homeColors.primary,
      backgroundColor:
        tuned["colors.accentCyan"] ?? homeColors.surfaceContainerHigh,
      icon: "timer",
      key: "time",
      label: t("studentHome.weeklySummary.timeLabel"),
      value: t("common.minutes", {
        count: viewModel.weeklyWriting.minutesCompleted,
      }),
    },
  ];

  return (
    <View
      style={[
        styles.card,
        styles.statsGroupCard,
        isTablet ? styles.statsGroupCardTablet : null,
        tunedCardStyle(tuned, "regular"),
      ]}
    >
      {stats.map((stat) => (
        <WeeklyStatCard isTablet={isTablet} key={stat.key} stat={stat} />
      ))}
    </View>
  );
}

function WeeklyStatCard({
  isTablet = false,
  stat,
}: {
  isTablet?: boolean;
  stat: WeeklyStat;
}) {
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);

  return (
    <View
      accessible
      accessibilityLabel={`${stat.value}, ${stat.label}`}
      style={[styles.statCard, isTablet ? styles.statCardTablet : null]}
    >
      <View
        style={[
          styles.statIconBubble,
          { backgroundColor: stat.backgroundColor },
        ]}
      >
        <Ionicons name={stat.icon} size={23} color={stat.accentColor} />
      </View>
      <View style={styles.statCopy}>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.statValue, settings),
            tunedTextStyle(
              tuned["colors.buttonPrimary"],
              tuned["typography.titleSize"],
              tuned["typography.titleLineHeight"],
            ),
            highContrastText.body,
          ]}
        >
          {stat.value}
        </Text>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.statLabel, settings),
            tunedTextStyle(tuned["colors.textSecondary"]),
            highContrastText.muted,
          ]}
        >
          {stat.label}
        </Text>
      </View>
    </View>
  );
}

function SkillProgressCard({
  isTablet = false,
  onViewAll,
  skills,
}: {
  isTablet?: boolean;
  onViewAll: () => void;
  skills: StudentHomeSkillProgress[];
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);
  const ringColors = [
    tuned["colors.progressGreen"] ?? skillProgressColors[0],
    tuned["colors.progressGreen"] ?? skillProgressColors[1],
    tuned["colors.achievementGold"] ?? skillProgressColors[2],
  ];

  return (
    <View style={styles.section} testID="student-home-skills">
      <SectionHeaderWithAction
        actionAccessibilityKey="studentHome.skills.ctaAccessibility"
        onPress={onViewAll}
        titleKey="studentHome.skills.title"
      />
      <View
        accessible
        accessibilityLabel={t("studentHome.skills.accessibility")}
        style={[
          styles.card,
          styles.skillsCard,
          isTablet ? styles.skillsCardTablet : null,
          tunedCardStyle(tuned, "regular"),
        ]}
      >
        {skills.length > 0 ? (
          skills.map((skill, index) => (
            <SkillProgressRing
              color={ringColors[index % ringColors.length]}
              key={skill.skill}
              label={getProgressSkillLabel(t, skill)}
              score={skill.currentScore}
            />
          ))
        ) : (
          <Text
            style={[
              getAccessibleTextStyle(styles.emptyInlineText, settings),
              highContrastText.muted,
            ]}
          >
            {t("studentHome.skills.previewSubtitle")}
          </Text>
        )}
      </View>
    </View>
  );
}

function SkillProgressRing({
  color,
  label,
  score,
}: {
  color: string;
  label: string;
  score: number;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);
  const activeSegments = Math.round(
    (Math.min(100, Math.max(0, score)) / 100) * RING_SEGMENT_COUNT,
  );

  return (
    <View style={styles.skillRingItem}>
      <View
        accessibilityLabel={`${label} ${t("studentHome.skills.percent", { count: score })}`}
        accessibilityRole="progressbar"
        accessibilityValue={{ max: 100, min: 0, now: score }}
        style={styles.ring}
      >
        {RING_SEGMENTS.map((segment) => (
          <View
            key={segment}
            style={[
              styles.ringSegment,
              {
                backgroundColor:
                  segment < activeSegments ? color : homeColors.surfaceVariant,
                transform: [
                  { rotate: `${segment * (360 / RING_SEGMENT_COUNT)}deg` },
                  { translateY: -24 },
                ],
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.ringCenter,
            overrideStyle<ViewStyle>({
              backgroundColor: tuned["colors.cardBackground"],
            }),
          ]}
        >
          {/* The ring center is a fixed 38px circle, so text scaling must stay
              capped here and shrink to fit instead of overflowing the ring. */}
          <Text
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1}
            minimumFontScale={0.6}
            numberOfLines={1}
            style={[
              styles.ringText,
              tunedTextStyle(tuned["colors.buttonPrimary"]),
              highContrastText.body,
            ]}
          >
            {t("studentHome.skills.percent", { count: score })}
          </Text>
        </View>
      </View>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={[
          getAccessibleTextStyle(styles.skillRingLabel, settings),
          tunedTextStyle(tuned["colors.textSecondary"]),
          highContrastText.muted,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ContinueDraftCard({
  draft,
  isTablet = false,
  onPress,
}: {
  draft: StudentHomeDraft;
  isTablet?: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);
  const primaryColor = tuned["colors.buttonPrimary"] ?? homeColors.primary;

  return (
    <Pressable
      accessibilityHint={t("studentHome.continueDraft.hint")}
      accessibilityLabel={`${t("studentHome.continueDraft.accessibility")}: ${draft.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        styles.draftCard,
        isTablet ? styles.draftCardTablet : null,
        tunedCardStyle(tuned, "compact"),
        pressed ? styles.cardPressed : null,
      ]}
      testID="student-home-continue-draft"
    >
      <View
        style={[
          styles.draftIcon,
          overrideStyle<ViewStyle>({
            backgroundColor: tuned["colors.accentCyan"],
          }),
        ]}
      >
        <Ionicons name="document-text-outline" size={24} color={primaryColor} />
      </View>
      <View style={styles.draftCopy}>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.draftTitle, settings),
            tunedTextStyle(tuned["colors.buttonPrimary"]),
            highContrastText.body,
          ]}
        >
          {draft.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(styles.draftMeta, settings),
            tunedTextStyle(tuned["colors.textSecondary"]),
            highContrastText.muted,
          ]}
        >
          {draft.lastEditedLabel}
        </Text>
      </View>
      <View style={styles.draftActions}>
        <Ionicons name="create-outline" size={20} color={primaryColor} />
        <Ionicons
          name="chevron-forward"
          size={22}
          color={tuned["colors.cardBorder"] ?? homeColors.outlineVariant}
        />
      </View>
    </Pressable>
  );
}

function RecentFeedbackSection({
  feedback,
  isTablet = false,
  onPress,
}: {
  feedback: StudentHomeFeedback | null;
  isTablet?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.section}>
      <SectionHeaderWithAction
        actionAccessibilityKey="studentHome.feedback.ctaAccessibility"
        onPress={onPress}
        titleKey="studentHome.feedback.title"
      />
      <RecentFeedbackCard
        feedback={feedback}
        isTablet={isTablet}
        onPress={onPress}
      />
    </View>
  );
}

function RecentFeedbackCard({
  feedback,
  isTablet = false,
  onPress,
}: {
  feedback: StudentHomeFeedback | null;
  isTablet?: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tuned = useStudentHomeTokenOverrides();
  const highContrastText = getHighContrastTextStyles(settings);
  const feedbackCopy =
    feedback?.strength ?? t("studentHome.feedback.emptyDescription");

  return (
    <Pressable
      accessibilityHint={t("studentHome.feedback.hint")}
      accessibilityLabel={t("studentHome.feedback.accessibility")}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        styles.feedbackCard,
        isTablet ? styles.feedbackCardTablet : null,
        tunedCardStyle(tuned, "compact"),
        pressed ? styles.cardPressed : null,
      ]}
      testID="student-home-feedback"
    >
      <View style={styles.feedbackCopy}>
        <Ionicons
          name="checkmark-circle"
          size={21}
          color={tuned["colors.progressGreen"] ?? homeColors.secondary}
        />
        <Text
          numberOfLines={2}
          style={[
            getAccessibleTextStyle(styles.feedbackText, settings),
            tunedTextStyle(
              tuned["colors.textPrimary"],
              tuned["typography.bodySize"],
              tuned["typography.bodyLineHeight"],
            ),
            highContrastText.body,
          ]}
        >
          {feedbackCopy}
        </Text>
      </View>
      {feedback ? (
        <View style={styles.rewardChip}>
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(styles.rewardText, settings),
              highContrastText.body,
            ]}
          >
            {t("studentHome.feedback.points", {
              count: FEEDBACK_REWARD_POINTS,
            })}
          </Text>
        </View>
      ) : null}
    </Pressable>
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
  appHeader: {
    backgroundColor: homeColors.surface,
    borderBottomWidth: 0,
    paddingHorizontal: homeSpacing.xl,
  },
  appHeaderContentTablet: {
    alignSelf: "center",
    maxWidth: 900,
    width: "100%",
  },
  appHeaderTablet: {
    paddingHorizontal: 32,
  },
  assignmentCard: {
    gap: homeSpacing.md,
    padding: homeSpacing.lg,
  },
  assignmentCardTablet: {
    gap: homeSpacing.lg,
    minHeight: 168,
    padding: homeSpacing.xl,
  },
  assignmentMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  assignmentSkill: {
    color: homeColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: homeSpacing.sm,
  },
  assignmentTitle: {
    color: homeColors.primary,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  assignmentTitleCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: homeSpacing.sm,
  },
  assignmentTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    ...cardShadow,
    backgroundColor: homeColors.card,
    borderColor: homeColors.outlineVariant,
    borderRadius: homeRadius.xl,
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
  },
  coachCard: {
    gap: homeSpacing.md,
    padding: homeSpacing.lg,
  },
  coachChip: {
    backgroundColor: homeColors.surfaceContainerLow,
    borderColor: homeColors.outlineVariant,
    borderRadius: homeRadius.xl,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: homeSpacing.sm,
  },
  coachChipText: {
    color: homeColors.onSurface,
    fontSize: 12.5,
    fontWeight: "600",
    lineHeight: 17,
  },
  coachChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: homeSpacing.sm,
  },
  coachHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: homeSpacing.sm,
  },
  coachIconBubble: {
    alignItems: "center",
    backgroundColor: homeColors.secondaryContainerSoft,
    borderRadius: homeRadius.lg,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  coachSafetyNote: {
    color: homeColors.onSurfaceVariant,
    fontSize: 11.5,
    lineHeight: 16,
  },
  coachTitle: {
    color: homeColors.onSurface,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  content: {
    alignSelf: "center",
    gap: homeSpacing.section,
    maxWidth: 430,
    width: "100%",
  },
  contentTablet: {
    gap: 24,
    maxWidth: 900,
  },
  draftActions: {
    alignItems: "center",
    flexDirection: "row",
  },
  draftCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: homeSpacing.md,
    minHeight: 72,
    padding: homeSpacing.md,
  },
  draftCardTablet: {
    minHeight: 88,
    padding: homeSpacing.lg,
  },
  draftCopy: {
    flex: 1,
    minWidth: 0,
  },
  draftIcon: {
    alignItems: "center",
    backgroundColor: homeColors.surfaceContainer,
    borderRadius: homeRadius.lg,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  draftMeta: {
    color: homeColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 2,
  },
  draftTitle: {
    color: homeColors.primary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  emptyInlineText: {
    color: homeColors.onSurfaceVariant,
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
    textAlign: "center",
  },
  feedbackCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: homeSpacing.md,
    justifyContent: "space-between",
    minHeight: 66,
    padding: homeSpacing.md,
  },
  feedbackCardTablet: {
    minHeight: 88,
    padding: homeSpacing.lg,
  },
  feedbackCopy: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    gap: homeSpacing.sm,
    minWidth: 0,
  },
  feedbackText: {
    color: homeColors.onSurface,
    flex: 1,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
  greeting: {
    color: homeColors.onSurface,
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
  },
  grade3AdventureCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: homeSpacing.md,
    minHeight: 118,
    padding: homeSpacing.lg,
  },
  grade3AdventureCardTablet: {
    alignItems: "flex-start",
    minHeight: 154,
  },
  grade3AdventureCopy: {
    flex: 1,
    gap: homeSpacing.xs,
    minWidth: 0,
  },
  grade3AdventureDescription: {
    color: homeColors.onSurfaceVariant,
    fontSize: 12.5,
    lineHeight: 18,
  },
  grade3AdventureEyebrow: {
    color: homeColors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  grade3AdventureIcon: {
    alignItems: "center",
    backgroundColor: homeColors.secondaryContainerSoft,
    borderRadius: homeRadius.lg,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  grade3AdventureTitle: {
    color: homeColors.primary,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23,
  },
  inlineMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minWidth: 0,
  },
  metaText: {
    color: homeColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  metaTextMuted: {
    color: homeColors.outline,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.72,
  },
  rewardChip: {
    alignItems: "center",
    backgroundColor: homeColors.secondaryContainerSoft,
    borderRadius: homeRadius.sm,
    minHeight: 28,
    paddingHorizontal: homeSpacing.sm,
    paddingVertical: homeSpacing.xs,
  },
  rewardText: {
    color: homeColors.secondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  ring: {
    alignItems: "center",
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  ringCenter: {
    alignItems: "center",
    backgroundColor: homeColors.card,
    borderRadius: homeRadius.full,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  ringSegment: {
    borderRadius: 3,
    height: 8,
    left: 25.5,
    position: "absolute",
    top: 24,
    width: 5,
  },
  ringText: {
    color: homeColors.primary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    lineHeight: 16,
  },
  safeArea: {
    backgroundColor: homeColors.background,
    flex: 1,
  },
  transparentSurface: {
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 132,
    paddingHorizontal: homeSpacing.xl,
    paddingTop: homeSpacing.lg,
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    paddingTop: homeSpacing.xl,
  },
  section: {
    gap: homeSpacing.sm,
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: homeColors.onSurfaceVariant,
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  seeAllButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: homeSpacing.sm,
  },
  seeAllText: {
    color: homeColors.primary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  skillRingItem: {
    alignItems: "center",
    flex: 1,
    gap: homeSpacing.sm,
    minWidth: 0,
  },
  skillRingLabel: {
    color: homeColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "center",
  },
  skillsCard: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    minHeight: 112,
    padding: homeSpacing.lg,
  },
  skillsCardTablet: {
    minHeight: 156,
    paddingHorizontal: homeSpacing.md,
    paddingVertical: homeSpacing.xl,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: homeSpacing.md,
    minHeight: 74,
    minWidth: 0,
    paddingHorizontal: homeSpacing.sm,
  },
  statCardTablet: {
    minHeight: 88,
  },
  statCopy: {
    flex: 1,
    minWidth: 0,
  },
  statIconBubble: {
    alignItems: "center",
    borderRadius: homeRadius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  statLabel: {
    color: homeColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  statValue: {
    color: homeColors.primary,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    lineHeight: 24,
  },
  statsGroupCard: {
    flexDirection: "row",
    gap: homeSpacing.md,
    padding: homeSpacing.lg,
  },
  statsGroupCardTablet: {
    flexDirection: "row",
    gap: homeSpacing.md,
    paddingHorizontal: homeSpacing.md,
    paddingVertical: homeSpacing.lg,
  },
  tabletDashboardGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 24,
  },
  tabletPrimaryColumn: {
    flex: 1.45,
    gap: 24,
    minWidth: 0,
  },
  tabletSecondaryColumn: {
    flex: 1,
    gap: 24,
    minWidth: 280,
  },
  todayPlanActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: homeSpacing.sm,
  },
  todayPlanCard: {
    gap: homeSpacing.md,
    padding: homeSpacing.lg,
  },
  todayPlanCardTablet: {
    padding: homeSpacing.xl,
  },
  todayPlanEyebrow: {
    color: homeColors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  todayPlanHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: homeSpacing.md,
  },
  todayPlanHeaderCopy: {
    flex: 1,
    gap: homeSpacing.xs,
    minWidth: 0,
  },
  todayPlanIconBubble: {
    alignItems: "center",
    backgroundColor: homeColors.secondaryContainerSoft,
    borderRadius: homeRadius.lg,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  todayPlanIconButton: {
    alignItems: "center",
    backgroundColor: homeColors.surfaceContainerLow,
    borderColor: homeColors.outlineVariant,
    borderRadius: homeRadius.lg,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  todayPlanMeta: {
    color: homeColors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  todayPlanPrimaryButton: {
    alignItems: "center",
    backgroundColor: homeColors.primary,
    borderRadius: homeRadius.lg,
    flexDirection: "row",
    flexGrow: 1,
    gap: homeSpacing.sm,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 154,
    paddingHorizontal: homeSpacing.md,
  },
  todayPlanPrimaryText: {
    color: homeColors.inverseText,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  todayPlanSecondaryButton: {
    alignItems: "center",
    backgroundColor: homeColors.surfaceContainerLow,
    borderColor: homeColors.outlineVariant,
    borderRadius: homeRadius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: homeSpacing.xs,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: homeSpacing.md,
  },
  todayPlanSecondaryText: {
    color: homeColors.primary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  todayPlanStat: {
    alignItems: "center",
    backgroundColor: homeColors.surfaceContainerLow,
    borderColor: homeColors.outlineVariant,
    borderRadius: homeRadius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: homeSpacing.xs,
    minHeight: 58,
    minWidth: 100,
    paddingHorizontal: homeSpacing.sm,
  },
  todayPlanStatCopy: {
    flex: 1,
    minWidth: 0,
  },
  todayPlanStatLabel: {
    color: homeColors.onSurfaceVariant,
    fontSize: 10.5,
    fontWeight: "600",
    lineHeight: 13,
  },
  todayPlanStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: homeSpacing.sm,
  },
  todayPlanStatValue: {
    color: homeColors.onSurface,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  todayPlanTitle: {
    color: homeColors.onSurface,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  weeklyCard: {
    gap: homeSpacing.md,
    padding: homeSpacing.lg,
  },
  weeklyDescription: {
    color: homeColors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
  },
  weeklyHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: homeSpacing.md,
    justifyContent: "space-between",
  },
  weeklyValue: {
    color: homeColors.primary,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    lineHeight: 20,
  },
});
