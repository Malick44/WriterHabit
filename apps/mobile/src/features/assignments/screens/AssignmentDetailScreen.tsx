import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
  type GradeBand,
} from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusState,
} from "@/shared/components/feedback";
import { ComposerSurface, Screen } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import {
  ReadAloudText,
  TextActionBar,
  useTextActionBar,
} from "@/shared/components/text";
import {
  buildAccessibilityLabel,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasDocumentSummary } from "@/features/canvas/types";

import { AssignmentAttachmentUploader, RubricChecklist } from "../components";
import {
  useAssignmentCanvasWork,
  useAssignmentDetailData,
} from "../hooks/useAssignments";
import {
  useAssignmentAttachments,
  type AssignmentAttachmentsState,
} from "../hooks/useAssignmentAttachments";
import { useAssignmentRubricChecklist } from "../hooks/useAssignmentRubricChecklist";
import { useTypedCopyDraft } from "../hooks/useTypedCopyDraft";
import { useTypedCopyInputPreference } from "../services/typedCopyInputPreference";
import type {
  AssignmentGradeAdaptation,
  AssignmentRecord,
  AssignmentStatus,
} from "../types";

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
  canStartWriting,
  canSubmit,
  hasWork,
  rubricComplete,
  stage,
}: {
  canStartWriting: boolean;
  canSubmit: boolean;
  /** Any saved work: typed draft, attached canvas, or pending photo/file. */
  hasWork: boolean;
  /** Every rubric self-check ticked on the revise step. */
  rubricComplete: boolean;
  stage: AssignmentWorkStage;
}) {
  switch (stage) {
    case "understand":
      return true;
    case "draft":
      return canStartWriting;
    case "revise":
      return canStartWriting && hasWork;
    case "submit":
      return (canSubmit || (canStartWriting && hasWork)) && rubricComplete;
  }
}

const STAGE_NODE_SIZE = 28;
const STAGE_CONNECTOR_HEIGHT = 3;

function AssignmentStageTabs({
  activeStage,
  assignment,
  canStartWriting,
  canSubmit,
  hasWork,
  onSelectStage,
  rubricComplete,
}: {
  activeStage: AssignmentWorkStage;
  assignment: AssignmentRecord;
  canStartWriting: boolean;
  canSubmit: boolean;
  hasWork: boolean;
  onSelectStage: (stage: AssignmentWorkStage) => void;
  rubricComplete: boolean;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  // Like the Grade 3 tracker: the highlighted node follows the step being
  // viewed, while checkmarks and lit connectors track actual progress.
  const progressIndex = getAssignmentWorkStageIndex(assignment.status);

  return (
    <View
      style={styles.assignmentStageTabs}
      testID="assignment-detail-stage-tabs"
    >
      {assignmentWorkStages.map((stage, index) => {
        const isCurrent = stage.id === activeStage;
        const isDone = index < progressIndex;
        // The line leading into this step lights up once the previous step is done.
        const isReached = index <= progressIndex;
        const isEnabled =
          index <= progressIndex ||
          isAssignmentWorkStageEnabled({
            canStartWriting,
            canSubmit,
            hasWork,
            rubricComplete,
            stage: stage.id,
          });

        return (
          <Fragment key={stage.id}>
            {index > 0 ? (
              <View
                accessible={false}
                importantForAccessibility="no"
                style={[
                  styles.assignmentStageConnector,
                  isReached ? styles.assignmentStageConnectorReached : null,
                ]}
              />
            ) : null}
            <Pressable
              accessibilityLabel={t(
                "writingWorkspace.stages.tabAccessibility",
                {
                  stage: t(stage.labelKey),
                },
              )}
              accessibilityRole="tab"
              accessibilityState={{ disabled: !isEnabled, selected: isCurrent }}
              disabled={!isEnabled}
              onPress={() => onSelectStage(stage.id)}
              style={({ pressed }) => [
                styles.assignmentStageTab,
                !isEnabled ? styles.assignmentStageTabDisabled : null,
                pressed ? styles.assignmentStageTabPressed : null,
              ]}
              testID={`assignment-detail-stage-tab-${stage.id}`}
            >
              <View
                style={[
                  styles.assignmentStageCircle,
                  isCurrent ? styles.assignmentStageCircleCurrent : null,
                  isDone ? styles.assignmentStageCircleDone : null,
                ]}
              >
                {isDone ? (
                  <Ionicons
                    color={dashboard.onPrimary}
                    name="checkmark"
                    size={15}
                  />
                ) : (
                  <Text
                    selectable={false}
                    style={[
                      getAccessibleTextStyle(
                        styles.assignmentStageStep,
                        settings,
                      ),
                      isCurrent ? styles.assignmentStageTextActive : null,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                numberOfLines={1}
                selectable={false}
                style={[
                  getAccessibleTextStyle(styles.assignmentStageLabel, settings),
                  isCurrent ? styles.assignmentStageLabelCurrent : null,
                  isDone ? styles.assignmentStageTextDone : null,
                ]}
              >
                {t(stage.labelKey)}
              </Text>
            </Pressable>
          </Fragment>
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
          style={getAccessibleTextStyle(styles.workOptionDescription, settings)}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function AssignmentPromptCard({
  assignment,
  gradeBand,
}: {
  assignment: AssignmentRecord;
  gradeBand: GradeBand;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const actionBar = useTextActionBar({
    enableFeedback: false,
    sourceType: "reading",
    text: assignment.prompt,
  });

  return (
    <View style={styles.card} testID="assignment-detail-prompt">
      {assignment.promptImageUrl ? (
        <View
          accessibilityLabel={t("assignments.detail.promptImageAccessibility")}
          accessibilityRole="image"
          style={styles.promptImageBox}
          testID="assignment-detail-prompt-image"
        >
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            source={{ uri: assignment.promptImageUrl }}
            style={styles.promptImage}
          />
        </View>
      ) : null}
      <Text
        selectable
        style={getAccessibleTextStyle(styles.cardEyebrow, settings)}
      >
        {t("assignments.detail.promptTitle")}
      </Text>
      <ReadAloudText
        accessibilityLabel={buildAccessibilityLabel([
          t("assignments.detail.promptAccessibility"),
          assignment.prompt,
        ])}
        selectable
        style={
          gradeBand === "elementary"
            ? getAccessibleTextStyle(styles.storyPromptText, settings)
            : getAccessibleTextStyle(styles.promptText, settings)
        }
        text={assignment.prompt}
      />
      <TextActionBar
        {...actionBar.actionBarProps}
        gradeBand={gradeBand}
        size="sm"
        style={styles.promptActions}
        testID="assignment-detail-prompt-actions"
        variant="inline"
      />
    </View>
  );
}

// Canvas-only work has zero typed words; describe it by its pages instead.
function getDraftSummaryLine(
  draft: NonNullable<AssignmentRecord["draft"]>,
  t: ReturnType<typeof useI18n>["t"],
): string {
  return draft.wordCount === 0 && draft.canvasPageCount > 0
    ? t("assignments.detail.draftCanvasSummary", {
        count: draft.canvasPageCount,
        label: draft.lastEditedLabel,
      })
    : t("assignments.history.draftSummary", {
        count: draft.wordCount,
        label: draft.lastEditedLabel,
      });
}

function DraftStepContent({
  assignment,
  attachedCanvas,
  attachmentsState,
  canWork,
  gradeBand,
  onOpenCanvas,
  onTypedCopyChange,
  typedCopyEnabled,
  typedCopyText,
}: {
  assignment: AssignmentRecord;
  attachedCanvas: CanvasDocumentSummary | null;
  attachmentsState: AssignmentAttachmentsState;
  canWork: boolean;
  gradeBand: GradeBand;
  onOpenCanvas: () => void;
  onTypedCopyChange: (text: string) => void;
  typedCopyEnabled: boolean;
  typedCopyText: string;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  // The server draft already counts canvas pages once it knows about them;
  // only add the separate canvas line while that link hasn't synced yet.
  const showCanvasLine =
    attachedCanvas !== null &&
    !(assignment.draft && assignment.draft.canvasPageCount > 0);
  const hasSavedWork =
    Boolean(assignment.draft) ||
    showCanvasLine ||
    attachmentsState.attachments.length > 0;

  return (
    <>
      <View style={styles.card} testID="assignment-detail-draft-intro">
        <Text
          selectable
          style={getAccessibleTextStyle(styles.cardEyebrow, settings)}
        >
          {t("writingWorkspace.sections.draft")}
        </Text>
        <Text
          selectable
          style={getAccessibleTextStyle(styles.stepDescription, settings)}
        >
          {t("assignments.detail.actionsDescription")}
        </Text>
      </View>
      <WorkOptionTile
        accessibilityLabel={t("assignments.detail.startCanvasAccessibility")}
        description={t("assignments.detail.canvasWorkDescription")}
        disabled={!canWork}
        icon="brush-outline"
        label={t("assignments.detail.useCanvasCta")}
        onPress={onOpenCanvas}
      />
      {canWork ? (
        <AssignmentAttachmentUploader
          attachments={attachmentsState.attachments}
          error={attachmentsState.error}
          gradeBand={gradeBand}
          isPicking={attachmentsState.isPicking}
          onPickFile={() => {
            void attachmentsState.pickFile();
          }}
          onPickPhoto={() => {
            void attachmentsState.pickPhoto();
          }}
          onRemove={attachmentsState.remove}
          onRetryExtraction={attachmentsState.retryExtraction}
          onTakePhoto={() => {
            void attachmentsState.takePhoto();
          }}
        />
      ) : null}
      {typedCopyEnabled ? (
        <View style={styles.card} testID="assignment-detail-typed-copy">
          <Text
            selectable
            style={getAccessibleTextStyle(styles.cardEyebrow, settings)}
          >
            {t("writingWorkspace.sections.draft")}
          </Text>
          <Text
            selectable
            style={getAccessibleTextStyle(styles.stepDescription, settings)}
          >
            {t("writingWorkspace.editor.inputHint")}
          </Text>
          <TextInput
            accessibilityLabel={t("writingWorkspace.editor.inputAccessibility")}
            editable={canWork}
            multiline
            onChangeText={onTypedCopyChange}
            placeholder={t("writingWorkspace.editor.placeholder")}
            placeholderTextColor={dashboard.outline}
            style={[
              getAccessibleTextStyle(styles.typedCopyInput, settings),
              styles.typedCopyInputBox,
            ]}
            testID="assignment-detail-typed-copy-input"
            textAlignVertical="top"
            value={typedCopyText}
          />
        </View>
      ) : null}
      {hasSavedWork ? (
        <View
          accessibilityLabel={t("assignments.detail.draftSummaryAccessibility")}
          accessible
          style={styles.card}
          testID="assignment-detail-draft-summary"
        >
          <Text
            selectable
            style={getAccessibleTextStyle(styles.cardEyebrow, settings)}
          >
            {t("assignments.detail.draftSummaryTitle")}
          </Text>
          {assignment.draft ? (
            <>
              <Text
                selectable
                style={getAccessibleTextStyle(styles.promptText, settings)}
              >
                {assignment.draft.preview}
              </Text>
              <Text
                selectable
                style={getAccessibleTextStyle(styles.draftMeta, settings)}
              >
                {getDraftSummaryLine(assignment.draft, t)}
              </Text>
            </>
          ) : null}
          {showCanvasLine ? (
            <Text
              selectable
              style={getAccessibleTextStyle(styles.draftMeta, settings)}
            >
              {t("assignments.detail.savedCanvasLine", {
                label: attachedCanvas.updatedLabel,
              })}
            </Text>
          ) : null}
          {attachmentsState.attachments.length > 0 ? (
            <Text
              selectable
              style={getAccessibleTextStyle(styles.draftMeta, settings)}
            >
              {t("assignments.detail.savedAttachmentsLine", {
                count: attachmentsState.attachments.length,
              })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

function SubmitStepContent({
  assignment,
  hasLocalWork,
}: {
  assignment: AssignmentRecord;
  hasLocalWork: boolean;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();

  return (
    <View style={styles.card} testID="assignment-detail-submit-summary">
      <Text
        selectable
        style={getAccessibleTextStyle(styles.cardEyebrow, settings)}
      >
        {t("assignments.submit.title")}
      </Text>
      <Text
        selectable
        style={getAccessibleTextStyle(styles.stepDescription, settings)}
      >
        {t("assignments.submit.description")}
      </Text>
      <Text
        selectable
        style={getAccessibleTextStyle(styles.draftMeta, settings)}
      >
        {assignment.draft
          ? getDraftSummaryLine(assignment.draft, t)
          : hasLocalWork
            ? t("assignments.detail.stepLocalWorkSummary")
            : t("assignments.submit.disabledHint")}
      </Text>
      <Text
        selectable
        style={getAccessibleTextStyle(styles.stepDescription, settings)}
      >
        {t("assignments.detail.safetyNote")}
      </Text>
    </View>
  );
}

function AssignmentContent({
  activeStage,
  assignment,
  attachedCanvas,
  attachmentsState,
  canStartWriting,
  canSubmit,
  checkedRubricIds,
  gradeAdaptation,
  gradeBand,
  hasLocalWork,
  isOffline,
  footer,
  onOpenCanvas,
  onRefresh,
  onSelectStage,
  onToggleRubric,
  onTypedCopyChange,
  rubricComplete,
  typedCopyEnabled,
  typedCopyText,
}: {
  activeStage: AssignmentWorkStage;
  assignment: AssignmentRecord;
  attachedCanvas: CanvasDocumentSummary | null;
  attachmentsState: AssignmentAttachmentsState;
  canStartWriting: boolean;
  canSubmit: boolean;
  checkedRubricIds: Record<string, boolean>;
  footer: ReactNode;
  gradeAdaptation: AssignmentGradeAdaptation;
  gradeBand: GradeBand;
  hasLocalWork: boolean;
  isOffline: boolean;
  onOpenCanvas: () => void;
  onRefresh: () => void;
  onSelectStage: (stage: AssignmentWorkStage) => void;
  onToggleRubric: (criterionId: string) => void;
  onTypedCopyChange: (text: string) => void;
  rubricComplete: boolean;
  typedCopyEnabled: boolean;
  typedCopyText: string;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  // Collapsed by default: the facts are secondary reference info, so the
  // prompt keeps the visual priority on the understand step.
  const [factsExpanded, setFactsExpanded] = useState(false);
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

      <Screen
        backgroundColor="transparent"
        contentPaddingTop={spacing.lg}
        footer={footer}
        gradeBand={gradeBand}
        keyboardAvoiding
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
            activeStage={activeStage}
            assignment={assignment}
            canStartWriting={canStartWriting}
            canSubmit={canSubmit}
            hasWork={hasLocalWork}
            onSelectStage={onSelectStage}
            rubricComplete={rubricComplete}
          />

          {activeStage === "understand" ? (
            <>
              <AssignmentPromptCard
                assignment={assignment}
                gradeBand={gradeBand}
              />

              <View
                style={[styles.card, styles.factsCard]}
                testID="assignment-detail-facts"
              >
                <Pressable
                  accessibilityLabel={t("assignments.detail.factsAccessibility")}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: factsExpanded }}
                  hitSlop={layout.hitSlop}
                  onPress={() => setFactsExpanded((expanded) => !expanded)}
                  style={[styles.factsToggle, factsExpanded ? styles.factRowDivider : null]}
                  testID="assignment-detail-facts-toggle"
                >
                  <Text
                    selectable
                    style={getAccessibleTextStyle(styles.factLabel, settings)}
                  >
                    {t("assignments.detail.factsTitle")}
                  </Text>
                  <Ionicons
                    color={dashboard.outline}
                    name={factsExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                  />
                </Pressable>
                {factsExpanded ? (
                  <>
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
                  </>
                ) : null}
              </View>

              <View style={styles.coachBanner}>
                <View style={styles.coachIcon}>
                  <Ionicons
                    color={dashboard.secondary}
                    name="sparkles"
                    size={16}
                  />
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
            </>
          ) : null}

          {activeStage === "draft" ? (
            <DraftStepContent
              assignment={assignment}
              attachedCanvas={attachedCanvas}
              attachmentsState={attachmentsState}
              canWork={canStartWriting}
              gradeBand={gradeBand}
              onOpenCanvas={onOpenCanvas}
              onTypedCopyChange={onTypedCopyChange}
              typedCopyEnabled={typedCopyEnabled}
              typedCopyText={typedCopyText}
            />
          ) : null}

          {activeStage === "revise" ? (
            <RubricChecklist
              assignment={assignment}
              checkedIds={checkedRubricIds}
              gradeAdaptation={gradeAdaptation}
              gradeBand={gradeBand}
              onToggle={onToggleRubric}
            />
          ) : null}

          {activeStage === "submit" ? (
            <SubmitStepContent
              assignment={assignment}
              hasLocalWork={hasLocalWork}
            />
          ) : null}
        </View>
      </Screen>
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
  // Canvas work saves local-first, so ask the canvas store directly instead
  // of relying on the server draft summary alone.
  const canvasWork = useAssignmentCanvasWork(assignmentId);
  // Scoped by assignment so the same photos are visible on the submission
  // screen later.
  const attachmentsState = useAssignmentAttachments(assignmentId);
  // Typed copy box is opt-in from app settings; the draft hook stays idle
  // (no hydration, no saves) while the preference is off.
  const typedCopyEnabled = useTypedCopyInputPreference(
    (store) => store.enabled,
  );
  const hydrateTypedCopyPreference = useTypedCopyInputPreference(
    (store) => store.hydrate,
  );
  useEffect(() => {
    void hydrateTypedCopyPreference();
  }, [hydrateTypedCopyPreference]);
  const typedCopy = useTypedCopyDraft(
    typedCopyEnabled ? assignmentId : undefined,
  );
  // Persisted per assignment: hydrated from device storage / the server
  // draft, written back on every toggle.
  const rubricChecklist = useAssignmentRubricChecklist({
    assignmentId,
    serverChecks:
      state.status === "success"
        ? state.viewModel.assignment?.draft?.rubricChecks
        : undefined,
  });
  const checkedRubricIds = rubricChecklist.checkedIds;
  const contentWidth = Math.min(width, 480);
  // Which step the student is viewing. Null means "follow the assignment's
  // progress" so a reopened assignment lands on its current step.
  const [selectedStage, setSelectedStage] =
    useState<AssignmentWorkStage | null>(null);

  // Canvas work happens on a pushed screen that doesn't remount this one on
  // return, so refetch on focus to pick up newly saved work — otherwise
  // step 2's gate would keep showing stale "no draft" data.
  const refetchRef = useRef({
    canvas: canvasWork.refetch,
    detail: state.refetch,
  });
  useEffect(() => {
    refetchRef.current = { canvas: canvasWork.refetch, detail: state.refetch };
  });
  useFocusEffect(
    useCallback(() => {
      refetchRef.current.detail();
      refetchRef.current.canvas();
    }, []),
  );

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

  const handleStageSelect = useCallback((stage: AssignmentWorkStage) => {
    setSelectedStage(stage);
  }, []);

  // Step 1's next button: flip a not-started assignment to in-progress before
  // moving on so the draft tracks against it.
  const handleUnderstandNext = useCallback(async () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    if (state.viewModel.assignment.status === "not_started") {
      const startedAssignment = await state.startAssignment();

      if (!startedAssignment) {
        return;
      }
    }

    setSelectedStage("draft");
  }, [state]);

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
  const { canStartWriting, canSubmit } = state.viewModel;
  const progressIndex = assignment
    ? getAssignmentWorkStageIndex(assignment.status)
    : 0;
  // Work can live in four places: the server draft, the canvas store
  // (local-first handwriting), pending photo/file attachments, and the
  // opt-in typed copy box.
  const hasLocalWork =
    Boolean(assignment?.draft) ||
    Boolean(canvasWork.attachedCanvas) ||
    attachmentsState.attachments.length > 0 ||
    (typedCopyEnabled && typedCopy.text.trim().length > 0);
  // Every rubric criterion must be self-checked on the revise step before the
  // student can move on to submit.
  const rubricComplete = Boolean(
    assignment?.rubric.every((criterion) => checkedRubricIds[criterion.id]),
  );
  const submitEligible = canSubmit || (canStartWriting && hasLocalWork);
  const canProceedToReview = submitEligible && rubricComplete;
  const requestedStage =
    selectedStage ?? assignmentWorkStages[progressIndex].id;
  const requestedIndex = assignmentWorkStages.findIndex(
    (stage) => stage.id === requestedStage,
  );
  // A stale selection (e.g. after a refetch changed the status) falls back to
  // the assignment's own progress step.
  const activeStage =
    assignment &&
    (requestedIndex <= progressIndex ||
      isAssignmentWorkStageEnabled({
        canStartWriting,
        canSubmit,
        hasWork: hasLocalWork,
        rubricComplete,
        stage: requestedStage,
      }))
      ? requestedStage
      : assignmentWorkStages[progressIndex].id;

  const stepBar = assignment
    ? (() => {
        switch (activeStage) {
          case "understand":
            return {
              back: null,
              helperText: undefined as string | undefined,
              next: {
                accessibilityLabel: t(
                  "assignments.detail.startWritingAccessibility",
                ),
                disabled: false,
                label: hasLocalWork
                  ? t("assignments.continueDraft")
                  : t("assignments.startWriting"),
                loading: state.startStatus === "loading",
                onPress: () => {
                  void handleUnderstandNext();
                },
              },
            };
          case "draft":
            return {
              back: { onPress: () => setSelectedStage("understand") },
              helperText: hasLocalWork
                ? undefined
                : t("assignments.detail.stepDraftHelper"),
              next: {
                accessibilityLabel: t(
                  "assignments.detail.stepNextAccessibility",
                ),
                disabled: !hasLocalWork,
                label: t("writingWorkspace.stages.nextRevise"),
                loading: false,
                onPress: () => setSelectedStage("revise"),
              },
            };
          case "revise":
            return {
              back: { onPress: () => setSelectedStage("draft") },
              helperText: rubricComplete
                ? undefined
                : t("assignments.detail.stepReviseHelper"),
              next: {
                accessibilityLabel: t(
                  "assignments.detail.stepNextAccessibility",
                ),
                disabled: !rubricComplete,
                label: t("writingWorkspace.stages.nextSubmit"),
                loading: false,
                onPress: () => setSelectedStage("submit"),
              },
            };
          case "submit":
            return {
              back: { onPress: () => setSelectedStage("revise") },
              // Pick the helper by what is actually blocking: no work at all,
              // an unfinished rubric check, or work already in review.
              helperText: canProceedToReview
                ? undefined
                : !hasLocalWork
                  ? t("assignments.submit.disabledHint")
                  : !submitEligible
                    ? t("assignments.detail.stepSubmittedHelper")
                    : t("assignments.detail.stepReviseHelper"),
              next: {
                accessibilityLabel: t("assignments.submit.ctaAccessibility"),
                disabled: !canProceedToReview,
                label: t("assignments.submit.reviewCta"),
                loading: false,
                onPress: openSubmit,
              },
            };
        }
      })()
    : null;

  return (
    <ComposerSurface>
      <View style={styles.root}>
        <View style={[styles.phoneFrame, { maxWidth: contentWidth }]}>
          {assignment ? (
            <AssignmentContent
              activeStage={activeStage}
              assignment={assignment}
              attachedCanvas={canvasWork.attachedCanvas}
              attachmentsState={attachmentsState}
              canStartWriting={canStartWriting}
              canSubmit={canSubmit}
              checkedRubricIds={checkedRubricIds}
              footer={
                stepBar ? (
                  <View
                    style={[
                      styles.bottomBarSurface,
                      { paddingBottom: Math.max(insets.bottom, spacing.lg) },
                    ]}
                  >
                    {stepBar.helperText ? (
                      <Text
                        selectable
                        style={getAccessibleTextStyle(
                          styles.helperText,
                          settings,
                        )}
                      >
                        {stepBar.helperText}
                      </Text>
                    ) : null}
                    <View style={styles.bottomButtonRow}>
                      {stepBar.back ? (
                        <Button
                          accessibilityLabel={t(
                            "assignments.detail.stepBackAccessibility",
                          )}
                          label={t("common.back")}
                          onPress={stepBar.back.onPress}
                          size="md"
                          style={styles.backButton}
                          variant="secondary"
                        />
                      ) : null}
                      <Button
                        accessibilityLabel={stepBar.next.accessibilityLabel}
                        disabled={stepBar.next.disabled}
                        label={stepBar.next.label}
                        loading={stepBar.next.loading}
                        onPress={stepBar.next.onPress}
                        size="md"
                        style={styles.primaryButton}
                        variant="primary"
                      />
                    </View>
                  </View>
                ) : null
              }
              gradeAdaptation={state.viewModel.gradeAdaptation}
              gradeBand={state.gradeBand}
              hasLocalWork={hasLocalWork}
              isOffline={state.viewModel.isOffline}
              onOpenCanvas={() => {
                void openCanvas();
              }}
              onRefresh={state.refetch}
              onSelectStage={handleStageSelect}
              onToggleRubric={rubricChecklist.toggle}
              onTypedCopyChange={typedCopy.setText}
              rubricComplete={rubricComplete}
              typedCopyEnabled={typedCopyEnabled}
              typedCopyText={typedCopy.text}
            />
          ) : null}
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
  backButton: {
    borderRadius: 14,
    flex: 1,
  },
  bottomButtonRow: {
    flexDirection: "row",
    gap: 10,
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
  // Horizontal and top padding come from the shared Screen scroll container.
  content: {
    gap: spacing.lg,
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
  factsToggle: {
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
  draftMeta: {
    color: dashboard.outline,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: spacing.sm,
  },
  header: {
    backgroundColor: dashboard.backgroundOverlay,
    borderBottomWidth: 0,
    paddingBottom: spacing.sm,
    paddingHorizontal: 20,
  },
  assignmentStageCircle: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderRadius: radius.full,
    borderWidth: 1,
    height: STAGE_NODE_SIZE,
    justifyContent: "center",
    width: STAGE_NODE_SIZE,
  },
  assignmentStageCircleCurrent: {
    backgroundColor: dashboard.primary,
    borderColor: dashboard.primary,
  },
  assignmentStageCircleDone: {
    backgroundColor: colors.feedback.success.border,
    borderColor: colors.feedback.success.border,
  },
  assignmentStageConnector: {
    backgroundColor: dashboard.outlineVariant,
    borderRadius: radius.full,
    flex: 1,
    height: STAGE_CONNECTOR_HEIGHT,
    marginHorizontal: spacing.xxs,
    marginTop: (STAGE_NODE_SIZE - STAGE_CONNECTOR_HEIGHT) / 2,
    minWidth: spacing.sm,
  },
  assignmentStageConnectorReached: {
    backgroundColor: colors.feedback.success.border,
  },
  assignmentStageLabel: {
    color: dashboard.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
    textAlign: "center",
  },
  assignmentStageLabelCurrent: {
    color: dashboard.primary,
  },
  assignmentStageStep: {
    color: dashboard.outline,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  assignmentStageTab: {
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 44,
  },
  assignmentStageTabDisabled: {
    opacity: 0.5,
  },
  assignmentStageTabPressed: {
    opacity: 0.78,
  },
  assignmentStageTabs: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
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
  helperText: {
    color: dashboard.outline,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: "center",
  },
  promptActions: {
    alignSelf: "flex-end",
    marginTop: spacing.sm,
  },
  promptImage: {
    height: "100%",
    width: "100%",
  },
  promptImageBox: {
    backgroundColor: dashboard.surfaceContainer,
    borderColor: dashboard.outlineVariant,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 150,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  promptText: {
    color: dashboard.onSurfaceVariant,
    fontFamily: fonts.serifRegular,
    fontSize: 15.5,
    lineHeight: 24,
  },
  stepDescription: {
    color: dashboard.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  typedCopyInput: {
    color: dashboard.onSurface,
    fontSize: 15.5,
    lineHeight: 22,
  },
  typedCopyInputBox: {
    backgroundColor: dashboard.surfaceContainerLow,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    minHeight: 140,
    padding: spacing.md,
  },
  /**
   * Storybook reading style for elementary students, matching the Grade 3
   * lesson read step: larger than body, extra leading and letter spacing so
   * early readers can track lines.
   */
  storyPromptText: {
    color: dashboard.onSurface,
    fontFamily: fonts.sans,
    fontSize: 21,
    letterSpacing: 0.4,
    lineHeight: 34,
  },
  root: {
    backgroundColor: "transparent",
    flex: 1,
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
