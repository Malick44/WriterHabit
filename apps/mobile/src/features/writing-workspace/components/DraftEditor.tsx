import { Text, TextInput } from "react-native";

import { Card } from "@/shared/components/cards";
import { StatusState } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { WritingMetrics, WritingWorkspaceGradeAdaptation } from "../types";
import { AutosaveStatusBadge } from "./AutosaveStatusBadge";

interface DraftEditorProps {
  autosaveStatus: "idle" | "restoring" | "unsaved" | "saving" | "saved" | "failed";
  gradeAdaptation: WritingWorkspaceGradeAdaptation;
  gradeBand: GradeBand;
  isEmptyDraft: boolean;
  metrics: WritingMetrics;
  onChangeText: (text: string) => void;
  text: string;
}

export function DraftEditor({
  autosaveStatus,
  gradeAdaptation,
  gradeBand,
  isEmptyDraft,
  metrics,
  onChangeText,
  text,
}: DraftEditorProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={t("writingWorkspace.editor.accessibility")}
      gradeBand={gradeBand}
      testID="writing-workspace-editor"
      title={t("writingWorkspace.editor.title")}
    >
      <Stack gap="md">
        <Inline align="flex-start" justify="space-between">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
              {gradeBand === "elementary"
                ? t("writingWorkspace.editor.descriptionElementary")
                : gradeBand === "middle"
                  ? t("writingWorkspace.editor.descriptionMiddle")
                  : t("writingWorkspace.editor.descriptionHigh")}
            </Text>
          </Stack>
          <AutosaveStatusBadge gradeBand={gradeBand} status={autosaveStatus} />
        </Inline>

        {isEmptyDraft ? (
          <StatusState
            accessibilityLabel={t("writingWorkspace.editor.emptyAccessibility")}
            description={t("writingWorkspace.editor.emptyDescription")}
            gradeBand={gradeBand}
            title={t("writingWorkspace.editor.emptyTitle")}
            tone="info"
          />
        ) : null}

        <TextInput
          accessibilityHint={t("writingWorkspace.editor.inputHint")}
          accessibilityLabel={t("writingWorkspace.editor.inputAccessibility")}
          multiline
          onChangeText={onChangeText}
          placeholder={t("writingWorkspace.editor.placeholder")}
          placeholderTextColor={colors.text.muted}
          scrollEnabled
          style={[
            getAccessibleTextStyle(type.body, settings),
            {
              backgroundColor: accessibleColors.surface,
              borderColor: accessibleColors.border,
              borderRadius: radius.md,
              borderWidth: 1,
              color: accessibleColors.text,
              minHeight: gradeAdaptation.editorMinHeight,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              textAlignVertical: "top",
            },
          ]}
          testID="writing-workspace-draft-input"
          value={text}
        />

        <Inline gap="sm">
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {t("writingWorkspace.metrics.words", { count: metrics.wordCount })}
          </Text>
          {gradeBand !== "elementary" ? (
            <>
              <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
                {t("writingWorkspace.metrics.sentences", { count: metrics.sentenceCount })}
              </Text>
              <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
                {t("writingWorkspace.metrics.paragraphs", { count: metrics.paragraphCount })}
              </Text>
            </>
          ) : null}
        </Inline>
      </Stack>
    </Card>
  );
}
