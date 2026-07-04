import { Text, View } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import { ReadAloudText, TextActionBar, useTextActionBar } from "@/shared/components/text";
import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import type { TranslationKey } from "@/shared/i18n";

import { useAiCoach } from "../hooks/useAiCoach";
import { buildAiCoachContext } from "../services/aiCoachContextService";
import type {
  AiCoachAction,
  AiCoachCanvasContext,
  AiCoachContextBuilderInput,
  AiCoachDraftMetrics,
  AiCoachResponse,
} from "../types";

interface AiCoachDrawerProps {
  assignment: AiCoachContextBuilderInput["assignment"] | null;
  canvasContext?: AiCoachCanvasContext | null;
  connectionStatus?: AiCoachContextBuilderInput["connectionStatus"];
  draftText: string;
  gradeBand: GradeBand;
  gradeLevel: AiCoachContextBuilderInput["gradeLevel"];
  metrics: AiCoachDraftMetrics;
  onClose: () => void;
  studentId: string;
  visibleActionCount: number;
}

type CoachActionDefinition = {
  action: AiCoachAction;
  descriptionKey: TranslationKey;
  labelKey: TranslationKey;
};

const coachActions: CoachActionDefinition[] = [
  {
    action: "hint",
    descriptionKey: "aiCoach.actions.hint.description",
    labelKey: "aiCoach.hintCta",
  },
  {
    action: "brainstorm",
    descriptionKey: "aiCoach.actions.brainstorm.description",
    labelKey: "aiCoach.brainstormCta",
  },
  {
    action: "ask_question",
    descriptionKey: "aiCoach.actions.askQuestion.description",
    labelKey: "aiCoach.askQuestionCta",
  },
  {
    action: "sentence_check",
    descriptionKey: "aiCoach.actions.sentenceCheck.description",
    labelKey: "aiCoach.sentenceCheckCta",
  },
  {
    action: "revision_help",
    descriptionKey: "aiCoach.actions.revisionHelp.description",
    labelKey: "aiCoach.revisionHelpCta",
  },
  {
    action: "explain_mistake",
    descriptionKey: "aiCoach.actions.explainMistake.description",
    labelKey: "aiCoach.explainMistakeCta",
  },
  {
    action: "stronger_word",
    descriptionKey: "aiCoach.actions.strongerWord.description",
    labelKey: "aiCoach.strongerWordCta",
  },
];

function ResponseRow({
  label,
  value,
  gradeBand,
}: {
  gradeBand: GradeBand;
  label: string;
  value?: string;
}) {
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  if (!value) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: settings.highContrast ? accessibleColors.surface : colors.background.surface,
        borderColor: settings.highContrast ? accessibleColors.border : colors.border.default,
        borderRadius: radius.md,
        borderWidth: 1,
        gap: spacing.xs,
        padding: spacing.md,
      }}
    >
      <Text
        selectable
        style={[getAccessibleTextStyle(type.caption, settings), { color: colors.coach.accentStrong }]}
      >
        {label}
      </Text>
      <ReadAloudText
        selectable
        style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}
        text={value}
      />
    </View>
  );
}

function AiCoachResponseView({
  gradeBand,
  response,
}: {
  gradeBand: GradeBand;
  response: AiCoachResponse;
}) {
  const { t } = useI18n();
  const coachingText = [response.strength, response.improvement, response.nextStep, response.guidingQuestion]
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
  const actionBar = useTextActionBar({
    sourceType: "coach-message",
    text: coachingText,
  });

  return (
    <Stack gap="sm" testID="ai-coach-response">
      <ResponseRow gradeBand={gradeBand} label={t("aiCoach.response.strength")} value={response.strength} />
      <ResponseRow gradeBand={gradeBand} label={t("aiCoach.response.improvement")} value={response.improvement} />
      <ResponseRow gradeBand={gradeBand} label={t("aiCoach.response.nextStep")} value={response.nextStep} />
      <ResponseRow gradeBand={gradeBand} label={t("aiCoach.response.question")} value={response.guidingQuestion} />
      <TextActionBar
        {...actionBar.actionBarProps}
        gradeBand={gradeBand}
        testID="ai-coach-response-actions"
      />
    </Stack>
  );
}

export function AiCoachDrawer({
  assignment,
  canvasContext = null,
  connectionStatus = "online",
  draftText,
  gradeBand,
  gradeLevel,
  metrics,
  onClose,
  studentId,
  visibleActionCount,
}: AiCoachDrawerProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const coach = useAiCoach();
  const visibleActions = coachActions.slice(0, visibleActionCount);

  const requestAction = (action: AiCoachAction) => {
    if (!assignment) {
      return;
    }

    const context = buildAiCoachContext({
      assignment,
      canvasContext,
      connectionStatus,
      draftText,
      gradeLevel,
      metrics,
      requestedAction: action,
      studentId,
    });

    void coach.requestCoaching(context);
  };

  return (
    <Card
      accessibilityLabel={t("aiCoach.drawerAccessibility")}
      gradeBand={gradeBand}
      testID="ai-coach-drawer"
      title={t("aiCoach.drawerTitle")}
      variant="accent"
    >
      <Stack gap="md">
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
          {gradeBand === "elementary"
            ? t("aiCoach.descriptionElementary")
            : gradeBand === "middle"
              ? t("aiCoach.descriptionMiddle")
              : t("aiCoach.descriptionHigh")}
        </Text>

        {!assignment ? (
          <EmptyState
            accessibilityLabel={t("aiCoach.missing.accessibility")}
            description={t("aiCoach.missing.description")}
            gradeBand={gradeBand}
            title={t("aiCoach.missing.title")}
          />
        ) : (
          <Stack gap="md">
            <Inline align="stretch" gap="sm">
              {visibleActions.map((action) => (
                <Button
                  accessibilityHint={t(action.descriptionKey)}
                  accessibilityLabel={t(action.labelKey)}
                  disabled={coach.isLoading}
                  gradeBand={gradeBand}
                  key={action.action}
                  label={t(action.labelKey)}
                  loading={coach.isLoading && coach.lastAction === action.action}
                  onPress={() => requestAction(action.action)}
                  size={gradeBand === "elementary" ? "lg" : "md"}
                  style={{ flexGrow: 1, flexBasis: gradeBand === "high" ? "30%" : "42%" }}
                  variant={coach.lastAction === action.action ? "primary" : "secondary"}
                />
              ))}
            </Inline>

            {coach.status === "idle" ? (
              <EmptyState
                accessibilityLabel={t("aiCoach.empty.accessibility")}
                description={t("aiCoach.empty.description")}
                gradeBand={gradeBand}
                title={t("aiCoach.empty.title")}
              />
            ) : null}

            {coach.status === "loading" ? (
              <LoadingState
                accessibilityLabel={t("aiCoach.loading.accessibility")}
                description={t("aiCoach.loading.description")}
                gradeBand={gradeBand}
                label={t("aiCoach.loading.title")}
              />
            ) : null}

            {coach.status === "empty" ? (
              <EmptyState
                actionLabel={t("aiCoach.emptyResult.action")}
                accessibilityLabel={t("aiCoach.emptyResult.accessibility")}
                description={t("aiCoach.emptyResult.description")}
                gradeBand={gradeBand}
                onActionPress={coach.reset}
                title={t("aiCoach.emptyResult.title")}
              />
            ) : null}

            {coach.status === "error" ? (
              <ErrorState
                actionLabel={t("common.retry")}
                accessibilityLabel={t("aiCoach.error.accessibility")}
                description={t("aiCoach.error.description")}
                gradeBand={gradeBand}
                onActionPress={() => {
                  void coach.retry();
                }}
                title={t("aiCoach.error.title")}
              />
            ) : null}

            {coach.status === "offline" ? (
              <StatusState
                actionLabel={t("aiCoach.offline.action")}
                accessibilityLabel={t("aiCoach.offline.accessibility")}
                description={t("aiCoach.offline.description")}
                gradeBand={gradeBand}
                onActionPress={coach.reset}
                title={t("aiCoach.offline.title")}
                tone="warning"
              />
            ) : null}

            {coach.status === "safety_blocked" ? (
              <StatusState
                actionLabel={t("aiCoach.safetyBlocked.action")}
                accessibilityLabel={t("aiCoach.safetyBlocked.accessibility")}
                description={t("aiCoach.safetyBlocked.description")}
                gradeBand={gradeBand}
                onActionPress={coach.reset}
                title={t("aiCoach.safetyBlocked.title")}
                tone="warning"
              />
            ) : null}

            {coach.status === "success" && coach.response ? (
              <Stack gap="sm">
                <StatusState
                  accessibilityLabel={t("aiCoach.success.accessibility")}
                  description={t("aiCoach.success.description")}
                  gradeBand={gradeBand}
                  title={t("aiCoach.success.title")}
                  tone="success"
                />
                <AiCoachResponseView gradeBand={gradeBand} response={coach.response} />
              </Stack>
            ) : null}
          </Stack>
        )}

        <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.coach.accentStrong }]}>
          {t("aiCoach.safetyReminder")}
        </Text>
        <Button
          accessibilityLabel={t("aiCoach.closeAccessibility")}
          gradeBand={gradeBand}
          label={t("aiCoach.closeCta")}
          onPress={onClose}
          size="sm"
          variant="ghost"
        />
      </Stack>
    </Card>
  );
}
