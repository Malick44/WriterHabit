import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { WritingGoal } from "@WriterHabit/shared";

import { routes } from "@/core/navigation/routeNames";
import { colors, getGradeBandForGrade, motion, palette } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { ErrorState, LoadingState } from "@/shared/components/feedback";
import {
  getAccessibleTextStyle,
  getMotionDuration,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import type { AccessibilitySettings } from "@/shared/utils/accessibility";

import { OnboardingStepFrame, PlanMinutesRing, SkillGrowthChart } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  CONFIDENCE_OPTIONS,
  getCompletedOnboardingProfile,
  onboardingErrorMessageKeys,
  onboardingStepRoutes,
  type OnboardingRole,
  type PersonalizedPlan,
  type WritingConfidenceLevel,
} from "../types";

const NAVY = colors.onboarding.navy;
const SCREEN_BACKGROUND = colors.onboarding.surface;

const goalSummaryCopyKeys: Partial<Record<WritingGoal, TranslationKey>> = {
  creative_writing: "onboarding.planSummary.goalNames.creativeWriting",
  improve_grammar: "onboarding.planSummary.goalNames.grammar",
  improve_handwriting: "onboarding.planSummary.goalNames.handwriting",
  improve_spelling: "onboarding.planSummary.goalNames.spelling",
  school_assignments: "onboarding.planSummary.goalNames.schoolAssignments",
  test_prep: "onboarding.planSummary.goalNames.testPrep",
  write_better_sentences: "onboarding.planSummary.goalNames.sentences",
  write_essays: "onboarding.planSummary.goalNames.essays",
  write_paragraphs: "onboarding.planSummary.goalNames.paragraphs",
};

const roleLabelKeys: Record<OnboardingRole, TranslationKey> = {
  parent: "onboarding.roleSelection.parentLabel",
  student: "onboarding.roleSelection.studentLabel",
  teacher: "onboarding.roleSelection.teacherLabel",
};

const confidenceShortKeys: Record<WritingConfidenceLevel, TranslationKey> = {
  building: "onboarding.planSummary.confidenceShort.building",
  confident: "onboarding.planSummary.confidenceShort.confident",
  getting_started: "onboarding.planSummary.confidenceShort.gettingStarted",
  steady: "onboarding.planSummary.confidenceShort.steady",
};

const week1FocusKeys: Record<
  PersonalizedPlan["assignmentFocus"],
  { title: TranslationKey; description: TranslationKey }
> = {
  essay_practice: {
    description: "onboarding.planSummary.week1Focus.essayDescription",
    title: "onboarding.planSummary.week1Focus.essayTitle",
  },
  paragraph_practice: {
    description: "onboarding.planSummary.week1Focus.paragraphDescription",
    title: "onboarding.planSummary.week1Focus.paragraphTitle",
  },
  sentence_practice: {
    description: "onboarding.planSummary.week1Focus.sentenceDescription",
    title: "onboarding.planSummary.week1Focus.sentenceTitle",
  },
};

export function PersonalizedPlanSummaryScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const [isCompleting, setIsCompleting] = useState(false);

  const { settings } = useAccessibilityContext();
  const profile = getCompletedOnboardingProfile(onboarding.progress);
  const gradeBand = getGradeBandForGrade(onboarding.progress.gradeLevel ?? 7);

  useEffect(() => {
    if (!onboarding.hydrated || onboarding.plan || onboarding.status !== "idle" || !profile.success) {
      return;
    }

    void onboarding.createPlan();
  }, [onboarding, onboarding.hydrated, onboarding.plan, onboarding.status, profile.success]);

  if (!onboarding.hydrated) {
    return (
      <LoadingState
        description={t("onboarding.loading.description")}
        label={t("onboarding.loading.title")}
      />
    );
  }

  if (!profile.success) {
    const redirectStep = onboarding.firstIncompleteStep ?? "role";

    return (
      <OnboardingStepFrame
        gradeBand={gradeBand}
        backgroundColor={SCREEN_BACKGROUND}
        step="planSummary"
        subtitle={t("onboarding.planSummary.description")}
        title={t("onboarding.planSummary.title")}
      >
        <ErrorState
          actionLabel={t("onboarding.planSummary.fixMissingAction")}
          description={t("onboarding.planSummary.missingDescription")}
          gradeBand={gradeBand}
          onActionPress={() => {
            router.replace(onboardingStepRoutes[redirectStep]);
          }}
          title={t("onboarding.planSummary.missingTitle")}
        />
      </OnboardingStepFrame>
    );
  }

  if (onboarding.status === "loading" || !onboarding.plan) {
    return (
      <OnboardingStepFrame
        gradeBand={gradeBand}
        backgroundColor={SCREEN_BACKGROUND}
        step="planSummary"
        subtitle={t("onboarding.planSummary.loadingDescription")}
        title={t("onboarding.planSummary.loadingTitle")}
      >
        <PlanBuildingSkeleton />
      </OnboardingStepFrame>
    );
  }

  const errorMessage = onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null;
  const plan = onboarding.plan;
  const role = onboarding.progress.role ?? "student";
  const goalsCount = plan.firstWeekGoals.length;
  const focusAreasLabel =
    goalsCount === 1
      ? t("onboarding.planSummary.focusAreaCountOne")
      : t("onboarding.planSummary.focusAreaCountOther", { count: goalsCount });
  const confidenceShort = t(confidenceShortKeys[plan.confidenceLevel]);
  const confidenceIndex = CONFIDENCE_OPTIONS.indexOf(plan.confidenceLevel);
  const week1Focus = week1FocusKeys[plan.assignmentFocus];

  return (
    <OnboardingStepFrame
      errorMessage={errorMessage}
      gradeBand={gradeBand}
      onPrimaryPress={() => {
        setIsCompleting(true);
        void onboarding.completeOnboarding().then((result) => {
          if (result.ok) {
            router.replace(routes.studentHome);
            return;
          }

          if (result.redirectTo) {
            router.replace(result.redirectTo);
          }
        }).finally(() => {
          setIsCompleting(false);
        });
      }}
      onSecondaryPress={() => {
        router.back();
      }}
      primaryLabel={t("onboarding.planSummary.startCta")}
      primaryLoading={isCompleting || onboarding.authOperationStatus === "loading"}
      secondaryLabel={t("common.back")}
      showProgressDots
      step="planSummary"
      subtitle={t("onboarding.planSummary.description")}
      title={t("onboarding.planSummary.title")}
      backgroundColor={SCREEN_BACKGROUND}
      headerAlign="left"
      primaryButtonStyle={styles.primaryButton}
      titleStyle={styles.title}
    >
      <View style={styles.summaryStack}>
        <RiseIn>
          <View style={styles.heroCard}>
            <PlanMinutesRing
              minutes={plan.dailyPracticeMinutes}
              unitLabel={t("onboarding.planSummary.hero.minutesUnit")}
            />
            <View style={styles.heroCopy}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={13} color={palette.teal[700]} />
                <Text selectable style={getAccessibleTextStyle(styles.heroBadgeText, settings)}>
                  {t("onboarding.planSummary.hero.tailoredBadge")}
                </Text>
              </View>
              <Text selectable style={getAccessibleTextStyle(styles.heroHeadline, settings)}>
                {t("onboarding.planSummary.hero.headline", { grade: plan.gradeLevel })}
              </Text>
              <Text selectable style={getAccessibleTextStyle(styles.heroSubline, settings)}>
                {t("onboarding.planSummary.hero.subline", {
                  confidence: confidenceShort,
                  focusAreas: focusAreasLabel,
                  grade: plan.gradeLevel,
                })}
              </Text>
            </View>
          </View>
        </RiseIn>

        <RiseIn delay={80}>
          <View style={styles.card}>
            <View style={styles.chartHeader}>
              <View style={styles.chartHeaderCopy}>
                <Text selectable style={getAccessibleTextStyle(styles.cardEyebrow, settings)}>
                  {t("onboarding.planSummary.chart.eyebrow")}
                </Text>
                <Text selectable style={getAccessibleTextStyle(styles.chartTitle, settings)}>
                  {t("onboarding.planSummary.chart.title")}
                </Text>
              </View>
              <View style={styles.chartLegend}>
                <LegendRow
                  color={palette.teal[500]}
                  label={t("onboarding.planSummary.chart.legendApp")}
                  settings={settings}
                  textColor={palette.teal[700]}
                />
                <LegendRow
                  color={palette.slate[300]}
                  label={t("onboarding.planSummary.chart.legendSolo")}
                  settings={settings}
                  textColor={palette.slate[400]}
                />
              </View>
            </View>
            <SkillGrowthChart
              axisEndLabel={t("onboarding.planSummary.chart.axisEnd")}
              axisMidLabel={t("onboarding.planSummary.chart.axisMid")}
              axisStartLabel={t("onboarding.planSummary.chart.axisStart")}
              milestoneLabel={t("onboarding.planSummary.chart.milestoneBadge")}
            />
            <Text selectable style={getAccessibleTextStyle(styles.chartFootnote, settings)}>
              {t("onboarding.planSummary.chart.footnote", { minutes: plan.dailyPracticeMinutes })}
            </Text>
          </View>
        </RiseIn>

        <RiseIn delay={160}>
          <View style={styles.card}>
            <Text selectable style={getAccessibleTextStyle(styles.cardEyebrow, settings)}>
              {t("onboarding.planSummary.recap.title")}
            </Text>
            <View style={styles.recapRows}>
              <View style={styles.recapRow}>
                <RecapIcon name="person-outline" />
                <View style={styles.recapCopy}>
                  <Text selectable style={getAccessibleTextStyle(styles.recapLabel, settings)}>
                    {t("onboarding.planSummary.recap.writerLabel")}
                  </Text>
                  <Text selectable style={getAccessibleTextStyle(styles.recapValue, settings)}>
                    {t("onboarding.planSummary.recap.writerValue", {
                      grade: plan.gradeLevel,
                      role: t(roleLabelKeys[role]),
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.recapDivider} />

              <View style={styles.recapRow}>
                <RecapIcon name="grid-outline" />
                <View style={styles.recapCopy}>
                  <Text selectable style={getAccessibleTextStyle(styles.recapLabel, settings)}>
                    {t("onboarding.planSummary.recap.focusLabel")}
                  </Text>
                  <View style={styles.goalChips}>
                    {plan.firstWeekGoals.map((goal) => (
                      <View key={goal} style={styles.goalChip}>
                        <Text selectable style={getAccessibleTextStyle(styles.goalChipText, settings)}>
                          {t(goalSummaryCopyKeys[goal] ?? "onboarding.planSummary.goalNames.general")}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.recapDivider} />

              <View style={styles.recapRow}>
                <RecapIcon name="heart-outline" />
                <View style={styles.recapCopy}>
                  <Text selectable style={getAccessibleTextStyle(styles.recapLabel, settings)}>
                    {t("onboarding.planSummary.recap.confidenceLabel")}
                  </Text>
                  <Text selectable style={getAccessibleTextStyle(styles.recapValue, settings)}>
                    {confidenceShort}
                  </Text>
                </View>
                <View style={styles.confidenceDots}>
                  {CONFIDENCE_OPTIONS.map((level, index) => (
                    <View
                      key={level}
                      style={[
                        styles.confidenceDot,
                        {
                          backgroundColor:
                            index <= confidenceIndex ? palette.blue[600] : colors.onboarding.dotInactive,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </RiseIn>

        <RiseIn delay={240}>
          <LinearGradient
            colors={[palette.teal[50], palette.blue[50]]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.focusCard}
          >
            <View style={styles.focusIcon}>
              <Ionicons name="disc-outline" size={26} color={NAVY} />
            </View>
            <View style={styles.focusCopy}>
              <Text selectable style={getAccessibleTextStyle(styles.focusEyebrow, settings)}>
                {t("onboarding.planSummary.week1Focus.eyebrow")}
              </Text>
              <Text selectable style={getAccessibleTextStyle(styles.focusTitle, settings)}>
                {t(week1Focus.title)}
              </Text>
              <Text selectable style={getAccessibleTextStyle(styles.focusDescription, settings)}>
                {t(week1Focus.description)}
              </Text>
            </View>
          </LinearGradient>
        </RiseIn>

        <RiseIn delay={320}>
          <View style={styles.card}>
            <Text selectable style={getAccessibleTextStyle(styles.cardEyebrow, settings)}>
              {t("onboarding.planSummary.growthPath.title")}
            </Text>
            <View style={styles.milestones}>
              <MilestoneRow
                dotColor={NAVY}
                iconColor={palette.white}
                iconName="flag"
                settings={settings}
                showLine
                tag={t("onboarding.planSummary.growthPath.todayTag")}
                tagColor={palette.blue[700]}
                title={t("onboarding.planSummary.growthPath.todayTitle")}
              />
              <MilestoneRow
                dotColor={palette.amber[100]}
                iconColor={palette.amber[500]}
                iconName="flame"
                settings={settings}
                showLine
                tag={t("onboarding.planSummary.growthPath.streakTag")}
                tagColor={palette.amber[700]}
                title={t("onboarding.planSummary.growthPath.streakTitle")}
              />
              <MilestoneRow
                dotColor={palette.green[100]}
                iconColor={palette.green[600]}
                iconName="ribbon"
                settings={settings}
                tag={t("onboarding.planSummary.growthPath.milestoneTag")}
                tagColor={palette.green[600]}
                title={t("onboarding.planSummary.growthPath.milestoneTitle", {
                  focus: t(week1Focus.title),
                })}
              />
            </View>
          </View>
        </RiseIn>

        <RiseIn delay={400}>
          <View style={styles.safetyCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={palette.teal[500]} />
            <Text selectable style={getAccessibleTextStyle(styles.safetyText, settings)}>
              {t("onboarding.planSummary.safetyNote")}
            </Text>
          </View>
        </RiseIn>
      </View>
    </OnboardingStepFrame>
  );
}

function RiseIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { settings } = useAccessibilityContext();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      getMotionDuration(settings, delay),
      withTiming(1, {
        duration: getMotionDuration(settings, motion.duration.lg),
        easing: Easing.bezier(...motion.easing.standard),
      }),
    );
  }, [delay, progress, settings]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 10 * (1 - progress.value) }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function PlanBuildingSkeleton() {
  const { settings } = useAccessibilityContext();
  const pulse = useSharedValue(settings.reducedMotion ? 0.6 : 0.45);
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (settings.reducedMotion) {
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.45, { duration: 650, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) }),
      ),
      -1,
    );
  }, [bounce, pulse, settings.reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.skeletonStack}>
      <View style={styles.skeletonDots}>
        {[0, 1, 2].map((index) => (
          <SkeletonDot bounce={bounce} index={index} key={index} />
        ))}
      </View>
      <Animated.View style={[styles.skeletonBlock, styles.skeletonBlockTall, pulseStyle]} />
      <Animated.View style={[styles.skeletonBlock, pulseStyle]} />
      <Animated.View style={[styles.skeletonBlock, pulseStyle]} />
      <Animated.View style={[styles.skeletonBlock, styles.skeletonBlockShort, pulseStyle]} />
    </View>
  );
}

function SkeletonDot({ bounce, index }: { bounce: SharedValue<number>; index: number }) {
  const style = useAnimatedStyle(() => {
    const phase = Math.max(0, Math.min(1, bounce.value * 1.5 - index * 0.25));
    return {
      opacity: 0.35 + 0.65 * phase,
      transform: [{ translateY: -6 * phase }],
    };
  });

  return <Animated.View style={[styles.skeletonDot, style]} />;
}

function LegendRow({
  color,
  label,
  settings,
  textColor,
}: {
  color: string;
  label: string;
  settings: AccessibilitySettings;
  textColor: string;
}) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text selectable style={getAccessibleTextStyle({ ...styles.legendText, color: textColor }, settings)}>
        {label}
      </Text>
    </View>
  );
}

function RecapIcon({ name }: { name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.recapIcon}>
      <Ionicons name={name} size={20} color={palette.blue[700]} />
    </View>
  );
}

function MilestoneRow({
  dotColor,
  iconColor,
  iconName,
  settings,
  showLine,
  tag,
  tagColor,
  title,
}: {
  dotColor: string;
  iconColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  settings: AccessibilitySettings;
  showLine?: boolean;
  tag: string;
  tagColor: string;
  title: string;
}) {
  return (
    <View style={styles.milestoneRow}>
      {showLine ? <View style={styles.milestoneLine} /> : null}
      <View style={[styles.milestoneDot, { backgroundColor: dotColor }]}>
        <Ionicons name={iconName} size={17} color={iconColor} />
      </View>
      <View style={styles.milestoneCopy}>
        <Text selectable style={getAccessibleTextStyle({ ...styles.milestoneTag, color: tagColor }, settings)}>
          {tag}
        </Text>
        <Text selectable style={getAccessibleTextStyle(styles.milestoneTitle, settings)}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.onboarding.surface,
    borderColor: palette.slate[200],
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: colors.onboarding.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
  },
  cardEyebrow: {
    color: palette.slate[400],
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  chartFootnote: {
    color: palette.slate[400],
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  chartHeader: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  chartHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  chartLegend: {
    gap: 4,
    paddingTop: 2,
  },
  chartTitle: {
    color: palette.slate[900],
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
  },
  confidenceDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  confidenceDots: {
    flexDirection: "row",
    gap: 5,
  },
  focusCard: {
    alignItems: "center",
    borderColor: palette.blue[100],
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  focusCopy: {
    flex: 1,
    gap: 2,
  },
  focusDescription: {
    color: palette.slate[600],
    fontSize: 14,
    lineHeight: 19,
  },
  focusEyebrow: {
    color: palette.teal[700],
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  focusIcon: {
    alignItems: "center",
    backgroundColor: colors.onboarding.surface,
    borderColor: palette.blue[100],
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: 52,
  },
  focusTitle: {
    color: palette.slate[900],
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  goalChip: {
    backgroundColor: palette.blue[100],
    borderColor: palette.blue[200],
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goalChipText: {
    color: palette.blue[700],
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  goalChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  heroBadge: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  heroBadgeText: {
    color: palette.teal[700],
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: colors.onboarding.surface,
    borderColor: palette.teal[100],
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 16,
    shadowColor: palette.teal[500],
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroHeadline: {
    color: palette.slate[900],
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 24,
  },
  heroSubline: {
    color: palette.slate[500],
    fontSize: 13,
    lineHeight: 18,
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  legendSwatch: {
    borderRadius: 5,
    height: 9,
    width: 9,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "700",
  },
  milestoneCopy: {
    flex: 1,
    gap: 2,
    paddingTop: 2,
  },
  milestoneDot: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
    zIndex: 1,
  },
  milestoneLine: {
    backgroundColor: palette.slate[100],
    bottom: 0,
    left: 17,
    position: "absolute",
    top: 36,
    width: 2,
  },
  milestoneRow: {
    flexDirection: "row",
    gap: 13,
    paddingBottom: 18,
    position: "relative",
  },
  milestoneTag: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  milestoneTitle: {
    color: palette.slate[900],
    fontSize: 15.5,
    fontWeight: "700",
    lineHeight: 21,
  },
  milestones: {
    marginTop: 16,
  },
  primaryButton: {
    borderRadius: 999,
  },
  recapCopy: {
    flex: 1,
    gap: 1,
  },
  recapDivider: {
    backgroundColor: palette.slate[100],
    height: 1,
  },
  recapIcon: {
    alignItems: "center",
    backgroundColor: colors.onboarding.selectedBackground,
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  recapLabel: {
    color: palette.slate[400],
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  recapRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  recapRows: {
    gap: 13,
    marginTop: 14,
  },
  recapValue: {
    color: palette.slate[900],
    fontSize: 15.5,
    fontWeight: "700",
    lineHeight: 21,
  },
  safetyCard: {
    alignItems: "flex-start",
    backgroundColor: palette.teal[50],
    borderColor: palette.teal[100],
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  safetyText: {
    color: palette.teal[700],
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
  },
  skeletonBlock: {
    backgroundColor: palette.slate[100],
    borderRadius: 16,
    height: 64,
  },
  skeletonBlockShort: {
    height: 44,
    width: "70%",
  },
  skeletonBlockTall: {
    height: 88,
  },
  skeletonDot: {
    backgroundColor: NAVY,
    borderRadius: 6,
    height: 11,
    width: 11,
  },
  skeletonDots: {
    alignItems: "flex-end",
    alignSelf: "center",
    flexDirection: "row",
    gap: 7,
    height: 30,
    marginBottom: 6,
  },
  skeletonStack: {
    gap: 14,
  },
  summaryStack: {
    gap: 14,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
  },
});
