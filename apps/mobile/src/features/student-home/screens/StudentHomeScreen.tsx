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
  getCanvasTemplatePickerRoute,
  getStudentReviewRoute,
  getWritingWorkspaceRoute,
} from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import {
  overrideRecord,
  overrideStyle,
  useRegisterTunableComponents,
  useRegisterTunableScreen,
} from "@/devtools/theme-tuner";
import { useI18n, type TFunction, type TranslationKey } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { AppHeader } from "@/shared/components/navigation";

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
const RING_SEGMENTS = Array.from({ length: RING_SEGMENT_COUNT }, (_, index) => index);
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

function getSkillLabel(t: TFunction, skill: StudentHomeAssignment["skillFocus"][number]) {
  return t(skillLabelKeys[skill]);
}

function getProgressSkillLabel(t: TFunction, skill: StudentHomeSkillProgress) {
  return t(skillLabelKeys[skill.skill]);
}

function getAssignmentStatusLabel(t: TFunction, assignment: StudentHomeAssignment) {
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

function tunedTextStyle(color?: string, fontSize?: number, lineHeight?: number): TextStyle | null {
  return overrideStyle<TextStyle>({
    color,
    fontSize,
    lineHeight:
      lineHeight ?? (fontSize === undefined ? undefined : Math.round(fontSize * 1.4)),
  });
}

export function StudentHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const state = useStudentHomeData();
  const viewModel = state.status === "success" ? state.viewModel : null;
  const isTablet = width >= TABLET_BREAKPOINT;

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

  const handleOpenSettings = useCallback(() => {
    router.push(routes.studentSettings);
  }, [router]);

  const handleOpenNotifications = useCallback(() => {}, []);

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, tunedScreenBackground]}>
      <AppHeader
        gradeBand={state.gradeBand}
        leftAction={{ type: "none" }}
        rightActions={[
          {
            accessibilityLabelKey: "studentHome.header.notificationsAccessibility",
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
        style={[styles.appHeader, isTablet ? styles.appHeaderTablet : null, tunedScreenBackground]}
        variant="compact"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet ? styles.scrollContentTablet : null]}
        contentInsetAdjustmentBehavior="automatic"
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
              onActionPress={() => navigateToTarget({ kind: "assignmentHistory" })}
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
                    <WeeklyProgressSummary isTablet={isTablet} viewModel={viewModel} />
                    <SkillProgressCard
                      isTablet={isTablet}
                      onViewAll={handleViewProgress}
                      skills={viewModel.skillProgress}
                    />
                  </View>
                </View>
              ) : (
                <>
                  {viewModel.todayAssignment ? (
                    <DashboardSection titleKey="studentHome.todayAssignment.sectionLabel">
                      <TodayAssignmentCard
                        assignment={viewModel.todayAssignment}
                        onPress={handleOpenTodayAssignment}
                      />
                    </DashboardSection>
                  ) : null}

                  <WeeklyProgressSummary viewModel={viewModel} />

                  <SkillProgressCard onViewAll={handleViewProgress} skills={viewModel.skillProgress} />

                  {viewModel.continueDraft ? (
                    <DashboardSection titleKey="studentHome.continueDraft.title">
                      <ContinueDraftCard draft={viewModel.continueDraft} onPress={handleContinueDraft} />
                    </DashboardSection>
                  ) : null}

                  <RecentFeedbackSection feedback={viewModel.recentFeedback[0] ?? null} onPress={handleReviewFeedback} />
                </>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  const tuned = useStudentHomeTokenOverrides();

  return (
    <View style={styles.section}>
      <Text
        maxFontSizeMultiplier={1.1}
        numberOfLines={1}
        style={[styles.sectionTitle, tunedTextStyle(tuned["colors.textSecondary"])]}
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
  const tuned = useStudentHomeTokenOverrides();

  return (
    <View style={styles.sectionHeaderRow}>
      <Text
        maxFontSizeMultiplier={1.1}
        numberOfLines={1}
        style={[styles.sectionTitle, tunedTextStyle(tuned["colors.textSecondary"])]}
      >
        {t(titleKey)}
      </Text>
      <Pressable
        accessibilityLabel={t(actionAccessibilityKey)}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => [styles.seeAllButton, pressed ? styles.pressed : null]}
      >
        <Text
          maxFontSizeMultiplier={1.05}
          numberOfLines={1}
          style={[styles.seeAllText, tunedTextStyle(tuned["colors.buttonPrimary"])]}
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
  const tuned = useStudentHomeTokenOverrides();
  const primarySkill = assignment.skillFocus[0];
  const statusLabel = getAssignmentStatusLabel(t, assignment);
  const skillLabel = primarySkill ? getSkillLabel(t, primarySkill) : t("common.unavailable");

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
            maxFontSizeMultiplier={1.12}
            numberOfLines={3}
            style={[
              styles.assignmentTitle,
              tunedTextStyle(tuned["colors.buttonPrimary"], tuned["typography.titleSize"], tuned["typography.titleLineHeight"]),
            ]}
          >
            {assignment.title}
          </Text>
          <Text
            maxFontSizeMultiplier={1.05}
            numberOfLines={1}
            style={[styles.assignmentSkill, tunedTextStyle(tuned["colors.textSecondary"])]}
          >
            {skillLabel}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={tuned["colors.cardBorder"] ?? homeColors.outlineVariant} />
      </View>

      <View style={styles.assignmentMetaRow}>
        <View style={styles.inlineMeta}>
          <Ionicons
            name="time-outline"
            size={16}
            color={tuned["colors.textSecondary"] ?? homeColors.onSurfaceVariant}
          />
          <Text
            maxFontSizeMultiplier={1.05}
            numberOfLines={1}
            style={[styles.metaText, tunedTextStyle(tuned["colors.textSecondary"])]}
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
          <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.metaTextMuted}>
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
      value: t("studentHome.weeklySummary.dayCount", { count: viewModel.streak.currentDays }),
    },
    {
      accentColor: tuned["colors.buttonPrimary"] ?? homeColors.primary,
      backgroundColor: tuned["colors.accentCyan"] ?? homeColors.surfaceContainerHigh,
      icon: "timer",
      key: "time",
      label: t("studentHome.weeklySummary.timeLabel"),
      value: t("common.minutes", { count: viewModel.weeklyWriting.minutesCompleted }),
    },
  ];

  return (
    <View style={[styles.statsGrid, isTablet ? styles.statsGridTablet : null]}>
      {stats.map((stat) => (
        <WeeklyStatCard key={stat.key} stat={stat} />
      ))}
    </View>
  );
}

function WeeklyStatCard({ stat }: { stat: WeeklyStat }) {
  const tuned = useStudentHomeTokenOverrides();

  return (
    <View
      accessible
      accessibilityLabel={`${stat.value}, ${stat.label}`}
      style={[styles.card, styles.statCard, tunedCardStyle(tuned, "regular")]}
    >
      <View style={[styles.statIconBubble, { backgroundColor: stat.backgroundColor }]}>
        <Ionicons name={stat.icon} size={23} color={stat.accentColor} />
      </View>
      <View style={styles.statCopy}>
        <Text
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.05}
          minimumFontScale={0.75}
          numberOfLines={1}
          style={[
            styles.statValue,
            tunedTextStyle(tuned["colors.buttonPrimary"], tuned["typography.titleSize"], tuned["typography.titleLineHeight"]),
          ]}
        >
          {stat.value}
        </Text>
        <Text
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.05}
          minimumFontScale={0.72}
          numberOfLines={1}
          style={[styles.statLabel, tunedTextStyle(tuned["colors.textSecondary"])]}
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
  const tuned = useStudentHomeTokenOverrides();
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
        style={[styles.card, styles.skillsCard, isTablet ? styles.skillsCardTablet : null, tunedCardStyle(tuned, "regular")]}
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
          <Text maxFontSizeMultiplier={1.1} style={styles.emptyInlineText}>
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
  const tuned = useStudentHomeTokenOverrides();
  const activeSegments = Math.round((Math.min(100, Math.max(0, score)) / 100) * RING_SEGMENT_COUNT);

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
                backgroundColor: segment < activeSegments ? color : homeColors.surfaceVariant,
                transform: [{ rotate: `${segment * (360 / RING_SEGMENT_COUNT)}deg` }, { translateY: -24 }],
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.ringCenter,
            overrideStyle<ViewStyle>({ backgroundColor: tuned["colors.cardBackground"] }),
          ]}
        >
          <Text
            maxFontSizeMultiplier={1}
            numberOfLines={1}
            style={[styles.ringText, tunedTextStyle(tuned["colors.buttonPrimary"])]}
          >
            {t("studentHome.skills.percent", { count: score })}
          </Text>
        </View>
      </View>
      <Text
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.05}
        minimumFontScale={0.72}
        numberOfLines={1}
        style={[styles.skillRingLabel, tunedTextStyle(tuned["colors.textSecondary"])]}
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
  const tuned = useStudentHomeTokenOverrides();
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
      <View style={[styles.draftIcon, overrideStyle<ViewStyle>({ backgroundColor: tuned["colors.accentCyan"] })]}>
        <Ionicons name="document-text-outline" size={24} color={primaryColor} />
      </View>
      <View style={styles.draftCopy}>
        <Text
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          style={[styles.draftTitle, tunedTextStyle(tuned["colors.buttonPrimary"])]}
        >
          {draft.title}
        </Text>
        <Text
          maxFontSizeMultiplier={1.05}
          numberOfLines={1}
          style={[styles.draftMeta, tunedTextStyle(tuned["colors.textSecondary"])]}
        >
          {draft.lastEditedLabel}
        </Text>
      </View>
      <View style={styles.draftActions}>
        <Ionicons name="create-outline" size={20} color={primaryColor} />
        <Ionicons name="chevron-forward" size={22} color={tuned["colors.cardBorder"] ?? homeColors.outlineVariant} />
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
      <RecentFeedbackCard feedback={feedback} isTablet={isTablet} onPress={onPress} />
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
  const tuned = useStudentHomeTokenOverrides();
  const feedbackCopy = feedback?.strength ?? t("studentHome.feedback.emptyDescription");

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
        <Ionicons name="checkmark-circle" size={21} color={tuned["colors.progressGreen"] ?? homeColors.secondary} />
        <Text
          maxFontSizeMultiplier={1.08}
          numberOfLines={2}
          style={[
            styles.feedbackText,
            tunedTextStyle(tuned["colors.textPrimary"], tuned["typography.bodySize"], tuned["typography.bodyLineHeight"]),
          ]}
        >
          {feedbackCopy}
        </Text>
      </View>
      {feedback ? (
        <View style={styles.rewardChip}>
          <Text maxFontSizeMultiplier={1.05} numberOfLines={1} style={styles.rewardText}>
            {t("studentHome.feedback.points", { count: FEEDBACK_REWARD_POINTS })}
          </Text>
        </View>
      ) : null}
    </Pressable>
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
    padding: homeSpacing.lg,
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
  statsGrid: {
    flexDirection: "row",
    gap: homeSpacing.lg,
  },
  statsGridTablet: {
    gap: homeSpacing.md,
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
});
