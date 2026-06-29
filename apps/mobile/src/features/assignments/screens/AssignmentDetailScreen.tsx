import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  getCanvasCreateRoute,
} from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import {
  colors,
  fonts,
  layout,
  radius,
  spacing,
} from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusState,
} from "@/shared/components/feedback";
import { ComposerSurface } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import {
  buildAccessibilityLabel,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useAssignmentDetailData } from "../hooks/useAssignments";
import type { AssignmentRecord, AssignmentStatus } from "../types";

const dashboard = colors.dashboard;

function getParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function StateFrame({ children }: { children: ReactNode }) {
  return (
    <ComposerSurface>
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
    </ComposerSurface>
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
      <Text
        selectable
        style={getAccessibleTextStyle(styles.factLabel, settings)}
      >
        {label}
      </Text>
      {valueChip ? (
        <View style={styles.factChip}>
          <Text
            selectable
            style={getAccessibleTextStyle(styles.factChipText, settings)}
          >
            {value}
          </Text>
        </View>
      ) : (
        <Text
          selectable
          style={[
            getAccessibleTextStyle(styles.factValue, settings),
            styles.factValueAligned,
          ]}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

type AssignmentWorkStage = "understand" | "draft" | "revise" | "submit";

const assignmentWorkStages: {
  id: AssignmentWorkStage;
  labelKey: TranslationKey;
}[] = [
  { id: "understand", labelKey: "writingWorkspace.sections.prompt" },
  { id: "draft", labelKey: "writingWorkspace.sections.draft" },
  { id: "revise", labelKey: "writingWorkspace.sections.rubric" },
  { id: "submit", labelKey: "writingWorkspace.sections.submit" },
];

function getAssignmentWorkStageIndex(status: AssignmentStatus): number {
  switch (status) {
    case "not_started":
      return 0;
    case "in_progress":
      return 1;
    case "feedback_ready":
    case "revision_in_progress":
      return 2;
    case "submitted":
    case "reviewing":
    case "completed":
      return 3;
  }
}

function isAssignmentWorkStageEnabled({
  assignment,
  canStartWriting,
  canSubmit,
  stage,
}: {
  assignment: AssignmentRecord;
  canStartWriting: boolean;
  canSubmit: boolean;
  stage: AssignmentWorkStage;
}) {
  switch (stage) {
    case "understand":
      return true;
    case "draft":
      return canStartWriting;
    case "revise":
      return canStartWriting && Boolean(assignment.draft);
    case "submit":
      return canSubmit;
  }
}

function AssignmentStageTabs({
  assignment,
  canStartWriting,
  canSubmit,
  onSelectStage,
}: {
  assignment: AssignmentRecord;
  canStartWriting: boolean;
  canSubmit: boolean;
  onSelectStage: (stage: AssignmentWorkStage) => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const currentIndex = getAssignmentWorkStageIndex(assignment.status);

  return (
    <View
      style={styles.assignmentStageTabs}
      testID="assignment-detail-stage-tabs"
    >
      {assignmentWorkStages.map((stage, index) => {
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex;
        const isEnabled = isAssignmentWorkStageEnabled({
          assignment,
          canStartWriting,
          canSubmit,
          stage: stage.id,
        });

        return (
          <Pressable
            accessibilityLabel={t("writingWorkspace.stages.tabAccessibility", {
              stage: t(stage.labelKey),
            })}
            accessibilityRole="tab"
            accessibilityState={{ disabled: !isEnabled, selected: isCurrent }}
            disabled={!isEnabled}
            key={stage.id}
            onPress={() => onSelectStage(stage.id)}
            style={({ pressed }) => [
              styles.assignmentStageTab,
              isCurrent ? styles.assignmentStageTabActive : null,
              isDone ? styles.assignmentStageTabDone : null,
              !isEnabled ? styles.assignmentStageTabDisabled : null,
              pressed ? styles.assignmentStageTabPressed : null,
            ]}
            testID={`assignment-detail-stage-tab-${stage.id}`}
          >
            {isDone ? (
              <Ionicons
                color={dashboard.secondary}
                name="checkmark"
                size={15}
              />
            ) : (
              <Text
                selectable={false}
                style={[
                  getAccessibleTextStyle(styles.assignmentStageStep, settings),
                  isCurrent ? styles.assignmentStageTextActive : null,
                ]}
              >
                {index + 1}
              </Text>
            )}
            <Text
              numberOfLines={1}
              selectable={false}
              style={[
                getAccessibleTextStyle(styles.assignmentStageLabel, settings),
                isCurrent ? styles.assignmentStageTextActive : null,
                isDone ? styles.assignmentStageTextDone : null,
              ]}
            >
              {t(stage.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function WorkOptionTile({
  accessibilityLabel,
  description,
  disabled = false,
  icon,
  label,
  onPress,
}: {
  accessibilityLabel: string;
  description: string;
  disabled?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { settings } = useAccessibilityContext();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.workOptionTile,
        pressed ? styles.workOptionTilePressed : null,
        disabled ? styles.workOptionTileDisabled : null,
      ]}
    >
      <View style={styles.workOptionIcon}>
        <Ionicons color={dashboard.primary} name={icon} size={18} />
      </View>
      <View style={styles.workOptionText}>
        <Text
          selectable={false}
          style={getAccessibleTextStyle(styles.workOptionLabel, settings)}
        >
          {label}
        </Text>
        <Text
          selectable={false}
          style={getAccessibleTextStyle(
            styles.workOptionDescription,
            settings,
          )}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function FloatingWorkMenu({
  canStartCanvas,
  canUploadWork,
  expanded,
  onOpenCanvas,
  onToggle,
  onUploadWork,
}: {
  canStartCanvas: boolean;
  canUploadWork: boolean;
  expanded: boolean;
  onOpenCanvas: () => void;
  onToggle: () => void;
  onUploadWork: () => void;
}) {
  const { t } = useI18n();

  const runAction = (action: () => void) => {
    onToggle();
    action();
  };

  return (
    <View
      accessibilityLabel={t("assignments.detail.inputMenuAccessibility")}
      pointerEvents="box-none"
      style={styles.floatingMenu}
      testID="assignment-detail-input-menu"
    >
      {expanded ? (
        <View style={styles.floatingOptions}>
          <WorkOptionTile
            accessibilityLabel={t(
              "assignments.detail.uploadWorkAccessibility",
            )}
            description={t("assignments.detail.uploadWorkDescription")}
            disabled={!canUploadWork}
            icon="cloud-upload-outline"
            label={t("assignments.detail.uploadWorkCta")}
            onPress={() => runAction(onUploadWork)}
          />
          <WorkOptionTile
            accessibilityLabel={t(
              "assignments.detail.startCanvasAccessibility",
            )}
            description={t("assignments.detail.canvasWorkDescription")}
            disabled={!canStartCanvas}
            icon="brush-outline"
            label={t("assignments.detail.useCanvasCta")}
            onPress={() => runAction(onOpenCanvas)}
          />
        </View>
      ) : null}
      <Pressable
        accessibilityLabel={
          expanded
            ? t("assignments.detail.inputMenuCloseAccessibility")
            : t("assignments.detail.inputMenuOpenAccessibility")
        }
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.floatingMenuButton,
          pressed ? styles.floatingMenuButtonPressed : null,
        ]}
      >
        <Ionicons
          color={dashboard.onPrimary}
          name={expanded ? "close" : "add"}
          size={28}
        />
      </Pressable>
    </View>
  );
}

function AssignmentContent({
  assignment,
  canStartWriting,
  canSubmit,
  isOffline,
  onRefresh,
  onSelectStage,
}: {
  assignment: AssignmentRecord;
  canStartWriting: boolean;
  canSubmit: boolean;
  isOffline: boolean;
  onRefresh: () => void;
  onSelectStage: (stage: AssignmentWorkStage) => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const skillFocus = assignment.skillFocus
    .map((skill) => t(`assignments.skills.${skill}`))
    .join(", ");
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

          <AssignmentStageTabs
            assignment={assignment}
            canStartWriting={canStartWriting}
            canSubmit={canSubmit}
            onSelectStage={onSelectStage}
          />

          <View
            accessibilityLabel={buildAccessibilityLabel([
              t("assignments.detail.promptAccessibility"),
              assignment.prompt,
            ])}
            accessible
            style={styles.card}
            testID="assignment-detail-prompt"
          >
            <Text
              selectable
              style={getAccessibleTextStyle(styles.cardEyebrow, settings)}
            >
              {t("assignments.detail.promptTitle")}
            </Text>
            <Text
              selectable
              style={getAccessibleTextStyle(styles.promptText, settings)}
            >
              {assignment.prompt}
            </Text>
          </View>

          <View
            accessibilityLabel={t("assignments.detail.factsAccessibility")}
            accessible
            style={[styles.card, styles.factsCard]}
            testID="assignment-detail-facts"
          >
            <FactRow
              label={t("assignments.detail.skillFocusLabel")}
              value={skillFocus || t("assignments.detail.generalWriting")}
            />
            {rubricFocus ? (
              <FactRow
                label={t("assignments.detail.rubricFocusLabel")}
                value={rubricFocus}
              />
            ) : null}
            <FactRow
              label={t("assignments.detail.estimatedTimeLabel")}
              value={t("assignments.detail.estimatedTime", {
                count: assignment.estimatedMinutes,
              })}
            />
            <FactRow
              label={t("assignments.detail.difficultyLabel")}
              value={t(`assignments.difficulty.${assignment.difficulty}`)}
              valueChip
            />
            <FactRow
              divider={false}
              label={t("assignments.detail.dueDateLabel")}
              value={assignment.dueLabel}
            />
          </View>

          <View style={styles.coachBanner}>
            <View style={styles.coachIcon}>
              <Ionicons color={dashboard.secondary} name="sparkles" size={16} />
            </View>
            <Text
              selectable
              style={[
                getAccessibleTextStyle(styles.coachText, settings),
                styles.coachTextFlex,
              ]}
            >
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
  const assignmentId = useMemo(
    () => getParamValue(params.assignmentId),
    [params.assignmentId],
  );
  const state = useAssignmentDetailData(assignmentId);
  const contentWidth = Math.min(width, 480);
  const [inputMenuExpanded, setInputMenuExpanded] = useState(false);

  const openSubmit = useCallback(() => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    router.push(getAssignmentSubmissionRoute(state.viewModel.assignment.id));
  }, [router, state]);

  // Students do their work by handwriting on the canvas; starting from a
  // not-started assignment also flips it to in-progress so the draft tracks.
  const openCanvas = useCallback(async () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    if (state.viewModel.assignment.status === "not_started") {
      const startedAssignment = await state.startAssignment();

      if (startedAssignment) {
        router.push(getCanvasCreateRoute(startedAssignment.id));
      }

      return;
    }

    router.push(getCanvasCreateRoute(state.viewModel.assignment.id));
  }, [router, state]);

  const openUploadWork = useCallback(async () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    if (state.viewModel.assignment.status === "not_started") {
      const startedAssignment = await state.startAssignment();

      if (startedAssignment) {
        router.push(getAssignmentSubmissionRoute(startedAssignment.id));
      }

      return;
    }

    router.push(getAssignmentSubmissionRoute(state.viewModel.assignment.id));
  }, [router, state]);

  const handleStageSelect = useCallback(
    (stage: AssignmentWorkStage) => {
      if (stage === "understand") {
        return;
      }

      if (stage === "submit") {
        if (state.status === "success" && state.viewModel.canSubmit) {
          openSubmit();
        }

        return;
      }

      void openCanvas();
    },
    [openCanvas, openSubmit, state],
  );

  const handlePrimaryPress = useCallback(() => {
    if (state.status !== "success") {
      return;
    }

    if (state.viewModel.canSubmit) {
      openSubmit();
      return;
    }

    void openCanvas();
  }, [openCanvas, openSubmit, state]);

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
    : t("assignments.detail.useCanvasCta");

  return (
    <ComposerSurface>
      <View style={styles.root}>
        <View style={[styles.phoneFrame, { maxWidth: contentWidth }]}>
          {assignment ? (
            <AssignmentContent
              assignment={assignment}
              canStartWriting={state.viewModel.canStartWriting}
              canSubmit={state.viewModel.canSubmit}
              isOffline={state.viewModel.isOffline}
              onRefresh={state.refetch}
              onSelectStage={handleStageSelect}
            />
          ) : null}
        </View>
        {assignment ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.floatingMenuFrame,
              {
                bottom: Math.max(insets.bottom, spacing.lg) + 118,
                right: Math.max((width - contentWidth) / 2 + 20, 20),
              },
            ]}
          >
            <FloatingWorkMenu
              canStartCanvas={state.viewModel.canStartCanvas}
              canUploadWork={
                state.viewModel.canStartWriting || state.viewModel.canSubmit
              }
              expanded={inputMenuExpanded}
              onOpenCanvas={() => {
                void openCanvas();
              }}
              onToggle={() => setInputMenuExpanded((value) => !value)}
              onUploadWork={() => {
                void openUploadWork();
              }}
            />
          </View>
        ) : null}
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
                  state.viewModel.canSubmit
                    ? t("assignments.submit.hint")
                    : t("assignments.detail.startCanvasHint")
                }
                accessibilityLabel={
                  state.viewModel.canSubmit
                    ? t("assignments.submit.ctaAccessibility")
                    : t("assignments.detail.startCanvasAccessibility")
                }
                disabled={
                  !state.viewModel.canStartCanvas && !state.viewModel.canSubmit
                }
                label={primaryLabel}
                loading={state.startStatus === "loading"}
                onPress={handlePrimaryPress}
                size="md"
                style={styles.primaryButton}
                variant="primary"
              />
              {!state.viewModel.canSubmit && state.viewModel.canStartWriting ? (
                <Button
                  accessibilityHint={t(
                    "assignments.detail.uploadWorkAccessibility",
                  )}
                  accessibilityLabel={t(
                    "assignments.detail.uploadWorkAccessibility",
                  )}
                  label={t("assignments.detail.uploadWorkCta")}
                  onPress={() => {
                    void openUploadWork();
                  }}
                  size="md"
                  style={styles.canvasButton}
                  variant="secondary"
                />
              ) : null}
            </View>
            {!state.viewModel.canSubmit && state.viewModel.assignment?.draft ? (
              <Pressable
                accessibilityLabel={t(
                  "assignments.detail.submitLinkAccessibility",
                )}
                accessibilityRole="button"
                onPress={openSubmit}
                style={({ pressed }) => [
                  styles.submitLink,
                  pressed ? styles.submitLinkPressed : null,
                ]}
              >
                <Text
                  selectable={false}
                  style={getAccessibleTextStyle(
                    styles.submitLinkText,
                    settings,
                  )}
                >
                  {t("assignments.detail.submitLinkCta")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </ComposerSurface>
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
  floatingMenu: {
    alignItems: "flex-end",
  },
  floatingMenuButton: {
    alignItems: "center",
    backgroundColor: dashboard.primary,
    borderColor: dashboard.primary,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 60,
    justifyContent: "center",
    width: 60,
    ...cardShadow,
  },
  floatingMenuButtonPressed: {
    opacity: 0.82,
  },
  floatingMenuFrame: {
    position: "absolute",
    zIndex: 20,
  },
  floatingOptions: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
    width: 286,
  },
  header: {
    backgroundColor: dashboard.backgroundOverlay,
    borderBottomWidth: 0,
    paddingBottom: spacing.sm,
    paddingHorizontal: 20,
  },
  assignmentStageLabel: {
    color: dashboard.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  assignmentStageStep: {
    color: dashboard.outline,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
    textAlign: "center",
  },
  assignmentStageTab: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 4,
    paddingVertical: 8,
    ...cardShadow,
  },
  assignmentStageTabActive: {
    backgroundColor: dashboard.primary,
    borderColor: dashboard.primary,
  },
  assignmentStageTabDisabled: {
    opacity: 0.5,
  },
  assignmentStageTabDone: {
    backgroundColor: dashboard.primarySubtle,
    borderColor: dashboard.primaryFixedBorder,
  },
  assignmentStageTabPressed: {
    opacity: 0.78,
  },
  assignmentStageTabs: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  assignmentStageTextActive: {
    color: dashboard.onPrimary,
  },
  assignmentStageTextDone: {
    color: dashboard.secondary,
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
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
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
  workOptionDescription: {
    color: dashboard.onSurfaceVariant,
    fontSize: 11.5,
    lineHeight: 16,
  },
  workOptionIcon: {
    alignItems: "center",
    backgroundColor: dashboard.primarySubtle,
    borderColor: dashboard.primaryFixedBorder,
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  workOptionLabel: {
    color: dashboard.onSurface,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  workOptionText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  workOptionTile: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 58,
    padding: 12,
    width: "100%",
    ...cardShadow,
  },
  workOptionTileDisabled: {
    opacity: 0.45,
  },
  workOptionTilePressed: {
    opacity: 0.78,
  },
});
