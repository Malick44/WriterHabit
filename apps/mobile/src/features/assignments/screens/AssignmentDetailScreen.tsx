import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getAssignmentSubmissionRoute,
  getCanvasTemplatePickerRoute,
  getWritingWorkspaceRoute,
} from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors, fonts, layout, palette, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { AppHeader } from "@/shared/components/navigation";
import {
  buildAccessibilityLabel,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { AssignmentStatusBadge } from "../components";
import { useAssignmentDetailData } from "../hooks/useAssignments";
import type { AssignmentRecord, AssignmentStatus } from "../types";

const dashboard = colors.dashboard;

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const DetailGradeBandContext = createContext<GradeBand>("middle");

function StateFrame({ children }: { children: ReactNode }) {
  return (
    <View style={styles.stateFrame}>
      <AppHeader
        leftAction={{
          accessibilityLabelKey: "common.back",
          type: "back",
        }}
        style={styles.header}
        titleKey="assignments.detail.headerTitle"
        variant="centered"
      />
      <View style={styles.stateContent}>{children}</View>
    </View>
  );
}

function FactRow({
  divider = true,
  label,
  value,
  valueChip = false,
}: {
  divider?: boolean;
  label: string;
  value: string;
  valueChip?: boolean;
}) {
  const { settings } = useAccessibilityContext();

  return (
    <View style={[styles.factRow, divider ? styles.factRowDivider : null]}>
      <Text selectable style={getAccessibleTextStyle(styles.factLabel, settings)}>
        {label}
      </Text>
      {valueChip ? (
        <View style={styles.factChip}>
          <Text selectable style={getAccessibleTextStyle(styles.factChipText, settings)}>
            {value}
          </Text>
        </View>
      ) : (
        <Text selectable style={[getAccessibleTextStyle(styles.factValue, settings), styles.factValueAligned]}>
          {value}
        </Text>
      )}
    </View>
  );
}

type JourneyStage = "draft" | "submitted" | "feedback" | "revised" | "complete";

const journeyStages: JourneyStage[] = ["draft", "submitted", "feedback", "revised", "complete"];

function getJourneyStageIndex(status: AssignmentStatus): number {
  switch (status) {
    case "not_started":
    case "in_progress":
      return 0;
    case "submitted":
    case "reviewing":
      return 1;
    case "feedback_ready":
      return 2;
    case "revision_in_progress":
      return 3;
    case "completed":
      return 4;
  }
}

function StatusJourney({ status }: { status: AssignmentStatus }) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const currentIndex = getJourneyStageIndex(status);

  return (
    <View
      accessibilityLabel={t("assignments.detail.statusJourneyAccessibility", {
        current: t(`assignments.detail.journey.${journeyStages[currentIndex]}`),
      })}
      accessible
      style={styles.journeyCard}
      testID="assignment-detail-journey"
    >
      <Text selectable style={getAccessibleTextStyle(styles.cardEyebrow, settings)}>
        {t("assignments.detail.statusSectionTitle")}
      </Text>
      <View style={styles.journeyRow}>
        <View style={styles.journeyTrack} />
        {journeyStages.map((stage, index) => {
          const isCurrent = index === currentIndex;
          const isDone = index < currentIndex;

          return (
            <View key={stage} style={styles.journeyStep}>
              <View
                style={[
                  styles.journeyDot,
                  isCurrent ? styles.journeyDotCurrent : null,
                  isDone ? styles.journeyDotDone : null,
                ]}
              >
                {isCurrent ? <View style={styles.journeyDotCore} /> : null}
                {isDone ? <Ionicons color={dashboard.onPrimary} name="checkmark" size={13} /> : null}
              </View>
              <Text
                selectable={false}
                style={[
                  getAccessibleTextStyle(styles.journeyLabel, settings),
                  isCurrent || isDone ? styles.journeyLabelActive : null,
                ]}
              >
                {t(`assignments.detail.journey.${stage}`)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function AssignmentContent({
  assignment,
  isOffline,
  onRefresh,
}: {
  assignment: AssignmentRecord;
  isOffline: boolean;
  onRefresh: () => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const gradeBand = useContext(DetailGradeBandContext);
  const type = typography.gradeBands[gradeBand];
  const skillFocus = assignment.skillFocus.map((skill) => t(`assignments.skills.${skill}`)).join(", ");
  const gradeRange =
    assignment.gradeLevelMin === assignment.gradeLevelMax
      ? `${assignment.gradeLevelMin}`
      : `${assignment.gradeLevelMin}–${assignment.gradeLevelMax}`;
  const rubricFocus = assignment.rubric[0]?.label;

  return (
    <>
      <AppHeader
        leftAction={{
          accessibilityLabelKey: "common.back",
          type: "back",
        }}
        style={styles.header}
        titleKey="assignments.detail.headerTitle"
        variant="centered"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        testID="assignment-detail-screen"
      >
        <View style={styles.content}>
          {isOffline ? (
            <StatusState
              actionLabel={t("assignments.detail.offlineAction")}
              accessibilityLabel={t("assignments.detail.offlineAccessibility")}
              description={t("assignments.detail.offlineDescription")}
              onActionPress={onRefresh}
              title={t("assignments.detail.offlineTitle")}
              tone="warning"
            />
          ) : null}

          <View>
            <Text selectable style={getAccessibleTextStyle(styles.typeEyebrow, settings)}>
              {t("assignments.detail.typeEyebrow", {
                type: t(`assignments.types.${assignment.assignmentType}`),
                grade: gradeRange,
              })}
            </Text>
            <View style={styles.titleRow}>
              <Text
                selectable
                style={[getAccessibleTextStyle(type.heading, settings), styles.titleText]}
                testID="assignment-detail-title"
              >
                {assignment.title}
              </Text>
              <AssignmentStatusBadge gradeBand={gradeBand} status={assignment.status} />
            </View>
          </View>

          <View
            accessibilityLabel={buildAccessibilityLabel([t("assignments.detail.promptAccessibility"), assignment.prompt])}
            accessible
            style={styles.card}
            testID="assignment-detail-prompt"
          >
            <Text selectable style={getAccessibleTextStyle(styles.cardEyebrow, settings)}>
              {t("assignments.detail.promptTitle")}
            </Text>
            <Text selectable style={getAccessibleTextStyle(styles.promptText, settings)}>
              {assignment.prompt}
            </Text>
          </View>

          <View
            accessibilityLabel={t("assignments.detail.factsAccessibility")}
            accessible
            style={[styles.card, styles.factsCard]}
            testID="assignment-detail-facts"
          >
            <FactRow label={t("assignments.detail.skillFocusLabel")} value={skillFocus || t("assignments.detail.generalWriting")} />
            {rubricFocus ? <FactRow label={t("assignments.detail.rubricFocusLabel")} value={rubricFocus} /> : null}
            <FactRow
              label={t("assignments.detail.estimatedTimeLabel")}
              value={t("assignments.detail.estimatedTime", { count: assignment.estimatedMinutes })}
            />
            <FactRow
              label={t("assignments.detail.difficultyLabel")}
              value={t(`assignments.difficulty.${assignment.difficulty}`)}
              valueChip
            />
            <FactRow divider={false} label={t("assignments.detail.dueDateLabel")} value={assignment.dueLabel} />
          </View>

          <StatusJourney status={assignment.status} />

          <View style={styles.coachBanner}>
            <View style={styles.coachIcon}>
              <Ionicons color={dashboard.secondary} name="sparkles" size={16} />
            </View>
            <Text selectable style={[getAccessibleTextStyle(styles.coachText, settings), styles.coachTextFlex]}>
              {t("assignments.detail.coachNote")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

export function AssignmentDetailScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const state = useAssignmentDetailData(assignmentId);
  const contentWidth = Math.min(width, 480);

  const startWriting = useCallback(async () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    const startedAssignment = await state.startAssignment();

    if (startedAssignment) {
      router.push(getWritingWorkspaceRoute(startedAssignment.id));
    }
  }, [router, state]);

  const openSubmit = useCallback(() => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    router.push(getAssignmentSubmissionRoute(state.viewModel.assignment.id));
  }, [router, state]);

  const openCanvas = useCallback(() => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    router.push(getCanvasTemplatePickerRoute(state.viewModel.assignment.id));
  }, [router, state]);

  const handlePrimaryPress = useCallback(() => {
    if (state.status !== "success") {
      return;
    }

    if (state.viewModel.canSubmit) {
      openSubmit();
      return;
    }

    void startWriting();
  }, [openSubmit, startWriting, state]);

  if (state.status === "loading") {
    return (
      <StateFrame>
        <LoadingState
          accessibilityLabel={t("assignments.detail.loadingAccessibility")}
          description={t("assignments.detail.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("assignments.detail.loadingTitle")}
          testID="assignment-detail-loading"
        />
      </StateFrame>
    );
  }

  if (state.status === "error") {
    return (
      <StateFrame>
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("assignments.detail.errorAccessibility")}
          description={t("assignments.detail.errorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="assignment-detail-error"
          title={t("assignments.detail.errorTitle")}
        />
      </StateFrame>
    );
  }

  if (state.status === "missing") {
    return (
      <StateFrame>
        <EmptyState
          actionLabel={t("assignments.detail.missingAction")}
          accessibilityLabel={t("assignments.detail.missingAccessibility")}
          description={t("assignments.detail.missingDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push(routes.studentAssignmentsHistory)}
          testID="assignment-detail-missing"
          title={t("assignments.detail.missingTitle")}
        />
      </StateFrame>
    );
  }

  const assignment = state.viewModel.assignment;
  const primaryLabel = state.viewModel.canSubmit
    ? t("assignments.submit.reviewCta")
    : assignment?.status === "not_started"
      ? t("assignments.detail.startWritingCta")
      : t("assignments.continueDraft");

  return (
    <View style={styles.root}>
      <View style={[styles.phoneFrame, { maxWidth: contentWidth }]}>
        {assignment ? (
          <DetailGradeBandContext.Provider value={state.gradeBand}>
            <AssignmentContent
              assignment={assignment}
              isOffline={state.viewModel.isOffline}
              onRefresh={state.refetch}
            />
          </DetailGradeBandContext.Provider>
        ) : null}
      </View>
      <View
        pointerEvents="box-none"
        style={[
          styles.footerFrame,
          {
            maxWidth: contentWidth,
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          },
        ]}
      >
        <View style={styles.bottomBarSurface}>
          <View style={styles.bottomButtonRow}>
            <Button
              accessibilityHint={
                state.viewModel.canSubmit ? t("assignments.submit.hint") : t("assignments.detail.startWritingHint")
              }
              accessibilityLabel={
                state.viewModel.canSubmit
                  ? t("assignments.submit.ctaAccessibility")
                  : t("assignments.detail.startWritingAccessibility")
              }
              disabled={!state.viewModel.canStartWriting && !state.viewModel.canSubmit}
              label={primaryLabel}
              loading={state.startStatus === "loading"}
              onPress={handlePrimaryPress}
              size="md"
              style={styles.primaryButton}
              variant="primary"
            />
            {state.viewModel.canStartCanvas ? (
              <Button
                accessibilityHint={t("assignments.detail.startCanvasHint")}
                accessibilityLabel={t("assignments.detail.startCanvasAccessibility")}
                label={t("assignments.detail.useCanvasCta")}
                onPress={openCanvas}
                size="md"
                style={styles.canvasButton}
                variant="secondary"
              />
            ) : null}
          </View>
          {!state.viewModel.canSubmit && state.viewModel.assignment?.draft ? (
            <Pressable
              accessibilityLabel={t("assignments.detail.submitLinkAccessibility")}
              accessibilityRole="button"
              onPress={openSubmit}
              style={({ pressed }) => [styles.submitLink, pressed ? styles.submitLinkPressed : null]}
            >
              <Text selectable={false} style={getAccessibleTextStyle(styles.submitLinkText, settings)}>
                {t("assignments.detail.submitLinkCta")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const cardShadow = {
  elevation: 2,
  shadowColor: colors.dashboard.onSurface,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
} as const;

const styles = StyleSheet.create({
  bottomBarSurface: {
    backgroundColor: dashboard.backgroundOverlay,
    borderTopColor: dashboard.surfaceContainerHigh,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bottomButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  canvasButton: {
    borderRadius: 14,
  },
  card: {
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: 18,
    borderWidth: 1,
    padding: 17,
    ...cardShadow,
  },
  cardEyebrow: {
    color: dashboard.outline,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.1,
    lineHeight: 14,
    marginBottom: 9,
    textTransform: "uppercase",
  },
  coachBanner: {
    alignItems: "flex-start",
    backgroundColor: dashboard.primarySubtle,
    borderColor: dashboard.primaryFixedBorder,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    padding: 14,
  },
  coachIcon: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderRadius: 9,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  coachText: {
    color: dashboard.onSecondaryContainer,
    fontSize: 13,
    lineHeight: 19,
  },
  coachTextFlex: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: 16,
    paddingTop: spacing.lg,
    width: "100%",
  },
  factChip: {
    borderColor: colors.feedback.warning.border,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  factChipText: {
    color: dashboard.tertiaryText,
    fontSize: 10.5,
    fontWeight: "600",
    lineHeight: 13,
  },
  factLabel: {
    color: dashboard.outline,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 17,
  },
  factRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  factRowDivider: {
    borderBottomColor: dashboard.surfaceContainer,
    borderBottomWidth: 1,
  },
  factValue: {
    color: dashboard.onSurface,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  factValueAligned: {
    flexShrink: 1,
    textAlign: "right",
  },
  factsCard: {
    paddingVertical: 4,
  },
  footerFrame: {
    alignSelf: "center",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    width: "100%",
  },
  header: {
    backgroundColor: dashboard.backgroundOverlay,
    borderBottomWidth: 0,
    paddingBottom: spacing.sm,
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
  },
  journeyCard: {
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: 18,
    borderWidth: 1,
    padding: 17,
    ...cardShadow,
  },
  journeyDot: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderColor: dashboard.surfaceDim,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  journeyDotCore: {
    backgroundColor: dashboard.onPrimary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  journeyDotCurrent: {
    backgroundColor: dashboard.primary,
    borderColor: dashboard.primary,
  },
  journeyDotDone: {
    backgroundColor: dashboard.primaryContainer,
    borderColor: dashboard.primaryContainer,
  },
  journeyLabel: {
    color: palette.slate[400],
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
    textAlign: "center",
  },
  journeyLabelActive: {
    color: dashboard.primary,
    fontWeight: "600",
  },
  journeyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
    position: "relative",
  },
  journeyStep: {
    alignItems: "center",
    gap: 8,
    width: "20%",
  },
  journeyTrack: {
    backgroundColor: dashboard.surfaceContainerHigh,
    height: 2,
    left: 11,
    position: "absolute",
    right: 11,
    top: 11,
  },
  phoneFrame: {
    alignSelf: "center",
    backgroundColor: dashboard.surface,
    flex: 1,
    overflow: "hidden",
    width: "100%",
  },
  primaryButton: {
    borderRadius: 14,
    flex: 1,
  },
  promptText: {
    color: dashboard.onSurfaceVariant,
    fontFamily: fonts.serifRegular,
    fontSize: 15.5,
    lineHeight: 24,
  },
  root: {
    backgroundColor: dashboard.surface,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 168,
  },
  stateContent: {
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
    maxWidth: layout.maxContentWidth,
    padding: 20,
    width: "100%",
  },
  stateFrame: {
    backgroundColor: dashboard.surface,
    flex: 1,
  },
  submitLink: {
    alignItems: "center",
    borderRadius: radius.sm,
    padding: 6,
  },
  submitLinkPressed: {
    opacity: 0.7,
  },
  submitLinkText: {
    color: dashboard.outline,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  titleText: {
    flex: 1,
  },
  typeEyebrow: {
    color: dashboard.secondary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.4,
    lineHeight: 14,
    marginBottom: 9,
    textTransform: "uppercase",
  },
});
