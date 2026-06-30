import { useMemo, useState } from "react";
import {
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getCanvasDocumentRoute, getCanvasCreateRoute, getStudentReviewRoute } from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors, fonts, layout, palette, radius, spacing, typography } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, OfflineBanner, StatusState } from "@/shared/components/feedback";
import { Screen, Stack } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import { getAccessibleTextStyle, getAccessibleColors, useAccessibilityContext } from "@/shared/utils/accessibility";

import { CanvasAttachmentPreview } from "../components/CanvasAttachmentPreview";
import { CoachEntryPanel } from "../components/CoachEntryPanel";
import { AutosaveStatusBadge } from "../components/AutosaveStatusBadge";
import { WorkspaceSubmitPanel } from "../components/WorkspaceSubmitPanel";
import { useWritingWorkspace } from "../hooks/useWritingWorkspace";
import { useWritingWorkspaceUiStore } from "../stores/writingWorkspaceUiStore";

const dashboard = colors.dashboard;

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type WorkspaceStage = "understand" | "draft" | "revise" | "submit";

const stageOrder: { id: WorkspaceStage; labelKey: TranslationKey }[] = [
  { id: "understand", labelKey: "writingWorkspace.sections.prompt" },
  { id: "draft", labelKey: "writingWorkspace.sections.draft" },
  { id: "revise", labelKey: "writingWorkspace.sections.rubric" },
  { id: "submit", labelKey: "writingWorkspace.sections.submit" },
];

function getWorkspaceStageParam(value: string | string[] | undefined): WorkspaceStage | null {
  const stage = getParamValue(value);

  return stage === "understand" || stage === "draft" || stage === "revise" || stage === "submit"
    ? stage
    : null;
}

function StageTabs({
  activeStage,
  onSelect,
}: {
  activeStage: WorkspaceStage;
  onSelect: (stage: WorkspaceStage) => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();

  return (
    <View style={styles.stageTabs} testID="writing-workspace-stage-tabs">
      {stageOrder.map((stage, index) => {
        const isActive = stage.id === activeStage;

        return (
          <Pressable
            accessibilityLabel={t("writingWorkspace.stages.tabAccessibility", { stage: t(stage.labelKey) })}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={stage.id}
            onPress={() => onSelect(stage.id)}
            style={[styles.stageTab, isActive ? styles.stageTabActive : null]}
            testID={`workspace-stage-tab-${stage.id}`}
          >
            <Text
              selectable={false}
              style={[
                getAccessibleTextStyle(styles.stageTabIndex, settings),
                isActive ? styles.stageTabTextActive : null,
              ]}
            >
              {index + 1}
            </Text>
            <Text
              selectable={false}
              style={[
                getAccessibleTextStyle(styles.stageTabLabel, settings),
                isActive ? styles.stageTabTextActive : null,
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

function CoachChip({
  icon = "sparkles",
  label,
  onPress,
}: {
  icon?: "sparkles" | "pencil";
  label: string;
  onPress: () => void;
}) {
  const { settings } = useAccessibilityContext();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.coachChip, pressed ? styles.pressed : null]}
    >
      <Ionicons color={dashboard.secondary} name={icon} size={14} />
      <Text selectable={false} style={getAccessibleTextStyle(styles.coachChipText, settings)}>
        {label}
      </Text>
    </Pressable>
  );
}

function StageCta({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  return (
    <Button
      accessibilityLabel={label}
      fullWidth
      label={label}
      onPress={onPress}
      size="md"
      style={styles.stageCta}
      testID={testID}
      variant="primary"
    />
  );
}

export function WritingWorkspaceScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ assignmentId?: string | string[]; stage?: string | string[] }>();
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const routeStage = useMemo(() => getWorkspaceStageParam(params.stage), [params.stage]);
  const state = useWritingWorkspace(assignmentId);
  const successState = state.status === "success" ? state : null;
  const activePanel = useWritingWorkspaceUiStore((store) => store.activePanel);
  const openPanel = useWritingWorkspaceUiStore((store) => store.openPanel);
  const closePanel = useWritingWorkspaceUiStore((store) => store.closePanel);
  const [isSavingNow, setIsSavingNow] = useState(false);
  const [selectedStage, setSelectedStage] = useState<WorkspaceStage | null>(null);
  const [checkedRubricIds, setCheckedRubricIds] = useState<readonly string[]>([]);
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = state.status === "success" ? typography.gradeBands[state.gradeBand] : typography.gradeBands.middle;

  const assignment = successState?.viewModel.assignment ?? null;
  const hasDraftText = (successState?.viewModel.text.trim().length ?? 0) > 0;
  const stage = selectedStage ?? routeStage ?? (hasDraftText ? "draft" : "understand");
  const stageIndex = stageOrder.findIndex((entry) => entry.id === stage);
  const rubric = assignment?.rubric ?? [];
  const checkedCount = rubric.filter((item) => checkedRubricIds.includes(item.id)).length;

  const toggleRubricItem = (id: string) => {
    setCheckedRubricIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  const saveNow = async () => {
    if (state.status !== "success") {
      return;
    }

    setIsSavingNow(true);
    await state.saveNow();
    setIsSavingNow(false);
  };

  const submitDraft = async () => {
    if (state.status !== "success") {
      return;
    }

    const response = await state.submitDraft();

    if (response) {
      router.push(getStudentReviewRoute(response.submissionId));
    }
  };

  const openCanvas = () => {
    const targetAssignmentId = assignment?.id ?? assignmentId;
    const attachment = successState?.viewModel.draft?.canvasAttachment;

    if (attachment) {
      router.push(getCanvasDocumentRoute(attachment.canvasId, targetAssignmentId));
      return;
    }

    router.push(getCanvasCreateRoute(targetAssignmentId));
  };

  return (
    <Screen
      backgroundColor={dashboard.background}
      contentPaddingTop={spacing.md}
      gradeBand={state.gradeBand}
      keyboardAvoiding
      testID="writing-workspace-screen"
    >
      {state.status !== "success" ? (
        <AppHeader
          gradeBand={state.gradeBand}
          leftAction={{
            accessibilityLabelKey: "common.back",
            type: "back",
          }}
          showSafeArea={false}
          style={styles.stateHeader}
          titleKey="writingWorkspace.headerTitle"
          variant="centered"
        />
      ) : null}

      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("writingWorkspace.loading.accessibility")}
          description={t("writingWorkspace.loading.description")}
          gradeBand={state.gradeBand}
          label={t("writingWorkspace.loading.title")}
          testID="writing-workspace-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("writingWorkspace.error.accessibility")}
          description={t("writingWorkspace.error.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="writing-workspace-error"
          title={t("writingWorkspace.error.title")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("writingWorkspace.missing.action")}
          accessibilityLabel={t("writingWorkspace.missing.accessibility")}
          description={t("writingWorkspace.missing.description")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.replace(routes.studentAssignmentsHistory)}
          testID="writing-workspace-missing"
          title={t("writingWorkspace.missing.title")}
        />
      ) : null}

      {successState && assignment ? (
        <Stack gap="md">
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityLabel={t("common.back")}
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.headerIconContainer}
            >
              <Ionicons
                color={accessibleColors.text}
                name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"}
                size={20}
              />
            </TouchableOpacity>

            <View style={styles.headerTitleBlock}>
              <Text
                accessibilityRole="header"
                numberOfLines={1}
                style={[getAccessibleTextStyle(styles.headerTitle, settings), { color: accessibleColors.text }]}
              >
                {t("writingWorkspace.headerTitle")}
              </Text>
            </View>

            <TouchableOpacity
              accessibilityLabel={t("writingWorkspace.aiCoachButton")}
              accessibilityRole="button"
              onPress={() => openPanel("coach")}
              style={styles.headerCoachButton}
              testID="writing-workspace-coach-button"
            >
              <Ionicons color={dashboard.primary} name="sparkles" size={18} />
            </TouchableOpacity>
          </View>

          <StageTabs activeStage={stage} onSelect={setSelectedStage} />

          <View style={styles.draftStatusRow}>
            <AutosaveStatusBadge gradeBand={state.gradeBand} status={successState.viewModel.autosaveStatus} />
            <View style={styles.wordChip}>
              <Text selectable={false} style={getAccessibleTextStyle(styles.wordChipText, settings)}>
                {t("writingWorkspace.metrics.words", { count: successState.viewModel.metrics.wordCount })}
              </Text>
            </View>
          </View>

          {successState.viewModel.isOffline ? (
            <OfflineBanner
              actionLabel={t("writingWorkspace.offline.action")}
              accessibilityLabel={t("writingWorkspace.offline.accessibility")}
              description={t("writingWorkspace.offline.description")}
              gradeBand={state.gradeBand}
              isRetrying={successState.isRefreshing}
              onRetry={state.refetch}
              title={t("writingWorkspace.offline.title")}
            />
          ) : null}

          {successState.viewModel.autosaveStatus === "failed" ? (
            <StatusState
              actionLabel={t("writingWorkspace.recovery.action")}
              actionLoading={isSavingNow}
              accessibilityLabel={t("writingWorkspace.recovery.accessibility")}
              description={t("writingWorkspace.recovery.description")}
              gradeBand={state.gradeBand}
              onActionPress={() => {
                void saveNow();
              }}
              title={t("writingWorkspace.recovery.title")}
              tone="error"
            />
          ) : null}

          {stage === "understand" ? (
            <Stack gap="md">
              <View style={styles.card} testID="writing-workspace-prompt">
                <Text selectable style={getAccessibleTextStyle(styles.cardEyebrow, settings)}>
                  {t("writingWorkspace.stages.promptEyebrow")}
                </Text>
                <Text selectable style={getAccessibleTextStyle(styles.promptText, settings)}>
                  {assignment.prompt}
                </Text>
                <View style={styles.chipRow}>
                  {assignment.skillFocus[0] ? (
                    <View style={[styles.metaChip, styles.metaChipGreen]}>
                      <Text selectable style={getAccessibleTextStyle(styles.metaChipGreenText, settings)}>
                        {t("writingWorkspace.stages.skillChip", {
                          skill: t(`assignments.skills.${assignment.skillFocus[0]}`),
                        })}
                      </Text>
                    </View>
                  ) : null}
                  {assignment.rubric[0] ? (
                    <View style={styles.metaChip}>
                      <Text selectable style={getAccessibleTextStyle(styles.metaChipText, settings)}>
                        {t("writingWorkspace.stages.rubricChip", { rubric: assignment.rubric[0].label })}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.chipRow}>
                <CoachChip label={t("writingWorkspace.brainstorm")} onPress={() => openPanel("coach")} />
                <CoachChip icon="pencil" label={t("writingWorkspace.stages.sketchOnCanvas")} onPress={openCanvas} />
              </View>

              <CanvasAttachmentPreview
                attachment={successState.viewModel.draft?.canvasAttachment ?? null}
                gradeBand={state.gradeBand}
                onOpenCanvas={openCanvas}
              />

              <StageCta
                label={t("writingWorkspace.stages.startDrafting")}
                onPress={() => setSelectedStage("draft")}
                testID="workspace-cta-start-drafting"
              />
            </Stack>
          ) : null}

          {stage === "draft" ? (
            <Stack gap="md">
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text selectable style={[getAccessibleTextStyle(styles.cardEyebrow, settings), styles.cardEyebrowGreen]}>
                    {t("writingWorkspace.stages.draftEyebrow")}
                  </Text>
                  <Text selectable style={getAccessibleTextStyle(styles.cardHeaderMeta, settings)}>
                    {t("writingWorkspace.stages.stepLabel", { step: stageIndex + 1 })}
                  </Text>
                </View>
                <TextInput
                  accessibilityHint={t("writingWorkspace.editor.inputHint")}
                  accessibilityLabel={t("writingWorkspace.editor.inputAccessibility")}
                  multiline
                  onChangeText={successState.setText}
                  placeholder={t("writingWorkspace.editor.placeholder")}
                  placeholderTextColor={colors.text.muted}
                  scrollEnabled
                  style={[
                    getAccessibleTextStyle(styles.editorInput, settings),
                    {
                      color: accessibleColors.text,
                      minHeight: Math.max(260, successState.viewModel.gradeAdaptation.editorMinHeight),
                    },
                  ]}
                  testID="writing-workspace-draft-input"
                  value={successState.viewModel.text}
                />
              </View>

              <View style={styles.coachBar}>
                <View style={styles.coachBarIcon}>
                  <Ionicons color={dashboard.secondary} name="sparkles" size={14} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.coachBarChips}>
                    <CoachChip label={t("writingWorkspace.askForHint")} onPress={() => openPanel("coach")} />
                    <CoachChip label={t("writingWorkspace.brainstorm")} onPress={() => openPanel("coach")} />
                    <CoachChip label={t("writingWorkspace.revise")} onPress={() => openPanel("coach")} />
                  </View>
                </ScrollView>
              </View>

              <StageCta
                label={t("writingWorkspace.stages.nextRevise")}
                onPress={() => setSelectedStage("revise")}
                testID="workspace-cta-next-revise"
              />
            </Stack>
          ) : null}

          {stage === "revise" ? (
            <Stack gap="md">
              <View style={styles.card} testID="writing-workspace-revise-checklist">
                <View style={styles.cardHeaderRow}>
                  <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
                    {t("writingWorkspace.stages.reviseTitle")}
                  </Text>
                  <Text selectable style={getAccessibleTextStyle(styles.reviseCount, settings)}>
                    {t("writingWorkspace.stages.reviseProgress", { count: checkedCount, total: rubric.length })}
                  </Text>
                </View>
                <Text selectable style={getAccessibleTextStyle(styles.cardSubtitle, settings)}>
                  {t("writingWorkspace.stages.reviseSubtitle")}
                </Text>
                <View
                  accessibilityRole="progressbar"
                  accessibilityValue={{ max: rubric.length, min: 0, now: checkedCount }}
                  style={styles.reviseTrack}
                >
                  <View
                    style={[
                      styles.reviseFill,
                      { width: rubric.length > 0 ? `${(checkedCount / rubric.length) * 100}%` : "0%" },
                    ]}
                  />
                </View>
                {rubric.map((item) => {
                  const isChecked = checkedRubricIds.includes(item.id);

                  return (
                    <Pressable
                      accessibilityLabel={t("writingWorkspace.stages.reviseToggleAccessibility", { label: item.label })}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChecked }}
                      key={item.id}
                      onPress={() => toggleRubricItem(item.id)}
                      style={styles.reviseRow}
                    >
                      <View style={[styles.reviseCheck, isChecked ? styles.reviseCheckDone : null]}>
                        {isChecked ? <Ionicons color={dashboard.onPrimary} name="checkmark" size={15} /> : null}
                      </View>
                      <Text
                        selectable
                        style={[getAccessibleTextStyle(styles.reviseLabel, settings), styles.reviseLabelFlex]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.chipRow}>
                <CoachChip label={t("writingWorkspace.revise")} onPress={() => openPanel("coach")} />
              </View>

              <StageCta
                label={t("writingWorkspace.stages.nextSubmit")}
                onPress={() => setSelectedStage("submit")}
                testID="workspace-cta-next-submit"
              />
            </Stack>
          ) : null}

          {stage === "submit" ? (
            <Stack gap="md">
              <View style={styles.card} testID="writing-workspace-submit-summary">
                <View style={styles.cardHeaderRow}>
                  <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
                    {t("writingWorkspace.stages.submitSummaryTitle")}
                  </Text>
                  <AutosaveStatusBadge gradeBand={state.gradeBand} status={successState.viewModel.autosaveStatus} />
                </View>
                <View style={styles.chipRow}>
                  <View style={styles.metaChip}>
                    <Text selectable style={getAccessibleTextStyle(styles.metaChipText, settings)}>
                      {t("writingWorkspace.metrics.words", { count: successState.viewModel.metrics.wordCount })}
                    </Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text selectable style={getAccessibleTextStyle(styles.metaChipText, settings)}>
                      {t("writingWorkspace.metrics.paragraphs", {
                        count: successState.viewModel.metrics.paragraphCount,
                      })}
                    </Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text selectable style={getAccessibleTextStyle(styles.metaChipText, settings)}>
                      {t("writingWorkspace.stages.submitChecklistChip", {
                        count: checkedCount,
                        total: rubric.length,
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.submitNoteRow}>
                <Ionicons color={dashboard.secondary} name="checkmark-circle-outline" size={16} />
                <Text selectable style={[getAccessibleTextStyle(styles.submitNote, settings), styles.reviseLabelFlex]}>
                  {t("writingWorkspace.stages.submitNote")}
                </Text>
              </View>

              <WorkspaceSubmitPanel
                canSubmit={successState.viewModel.canSubmit}
                gradeBand={state.gradeBand}
                metrics={successState.viewModel.metrics}
                onSave={() => {
                  void saveNow();
                }}
                onSubmit={() => {
                  void submitDraft();
                }}
                submitError={successState.viewModel.submitError}
                submitStatus={successState.submitStatus}
              />
            </Stack>
          ) : null}

          {activePanel === "coach" ? (
            <CoachEntryPanel
              assignment={successState.viewModel.assignment}
              canvasAttachment={successState.viewModel.draft?.canvasAttachment ?? null}
              draftText={successState.viewModel.text}
              gradeAdaptation={successState.viewModel.gradeAdaptation}
              gradeLevel={successState.gradeLevel}
              isOffline={successState.viewModel.isOffline}
              metrics={successState.viewModel.metrics}
              onClose={closePanel}
              studentId={successState.studentId}
              visible
            />
          ) : null}
        </Stack>
      ) : null}
    </Screen>
  );
}

const cardShadow = {
  elevation: 2,
  shadowColor: dashboard.onSurface,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
} as const;

const styles = StyleSheet.create({
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
  cardEyebrowGreen: {
    color: dashboard.secondary,
    marginBottom: 0,
  },
  cardHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  cardHeaderMeta: {
    color: dashboard.outline,
    fontSize: 11.5,
    fontWeight: "500",
    lineHeight: 15,
  },
  cardSubtitle: {
    color: dashboard.outline,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  coachBar: {
    alignItems: "center",
    backgroundColor: dashboard.surfaceContainerLow,
    borderColor: dashboard.surfaceContainerHighest,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  coachBarChips: {
    flexDirection: "row",
    gap: 7,
  },
  coachBarIcon: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderRadius: 8,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  coachChip: {
    alignItems: "center",
    backgroundColor: dashboard.surfaceContainerLow,
    borderColor: dashboard.surfaceDim,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: layout.touchTarget - 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  coachChipText: {
    color: colors.coach.accent,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  draftStatusRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
    width: "100%",
  },
  editorInput: {
    fontFamily: fonts.serifRegular,
    fontSize: 15.5,
    lineHeight: 25,
    textAlignVertical: "top",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
    width: "100%",
  },
  headerCoachButton: {
    alignItems: "center",
    backgroundColor: dashboard.primarySubtle,
    borderColor: dashboard.primaryFixedBorder,
    borderRadius: 11,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  headerIconContainer: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderColor: dashboard.surfaceContainerHighest,
    borderRadius: 11,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 21,
  },
  headerTitleBlock: {
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  metaChip: {
    backgroundColor: dashboard.surfaceContainer,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  metaChipGreen: {
    backgroundColor: dashboard.primarySubtle,
  },
  metaChipGreenText: {
    color: dashboard.secondary,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  metaChipText: {
    color: dashboard.onSurfaceVariant,
    fontSize: 11.5,
    fontWeight: "600",
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.75,
  },
  promptText: {
    color: colors.text.secondary,
    fontFamily: fonts.serifRegular,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 13,
  },
  reviseCheck: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderColor: dashboard.surfaceDim,
    borderRadius: 7,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  reviseCheckDone: {
    backgroundColor: colors.feedback.success.icon,
    borderColor: colors.feedback.success.icon,
  },
  reviseCount: {
    color: palette.teal[500],
    fontSize: 11.5,
    fontWeight: "700",
    lineHeight: 15,
  },
  reviseFill: {
    backgroundColor: palette.teal[500],
    borderRadius: 4,
    height: "100%",
  },
  reviseLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
  },
  reviseLabelFlex: {
    flex: 1,
  },
  reviseRow: {
    alignItems: "center",
    borderTopColor: dashboard.surfaceContainer,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 13,
  },
  reviseTrack: {
    backgroundColor: palette.teal[50],
    borderRadius: 4,
    height: 6,
    marginBottom: 8,
    overflow: "hidden",
  },
  stageCta: {
    borderRadius: 15,
  },
  stateHeader: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    paddingBottom: spacing.xs,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  stageTab: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderColor: dashboard.surfaceContainerHighest,
    borderRadius: radius.full,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 6,
  },
  stageTabActive: {
    backgroundColor: dashboard.primary,
    borderColor: dashboard.primary,
  },
  stageTabIndex: {
    color: dashboard.outline,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
    opacity: 0.7,
  },
  stageTabLabel: {
    color: dashboard.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 15,
  },
  stageTabTextActive: {
    color: dashboard.onPrimary,
  },
  stageTabs: {
    flexDirection: "row",
    gap: 6,
    width: "100%",
  },
  submitNote: {
    color: colors.text.muted,
    fontSize: 12.5,
    lineHeight: 18,
  },
  submitNoteRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 4,
  },
  wordChip: {
    backgroundColor: dashboard.surfaceContainer,
    borderRadius: radius.full,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  wordChipText: {
    color: colors.text.secondary,
    fontSize: 11.5,
    fontWeight: "600",
    lineHeight: 14,
  },
});
