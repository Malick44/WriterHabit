import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import * as Speech from "expo-speech";

import { colors, radius, spacing, typography } from "@/design/tokens";
import { Button, TextField } from "@/shared/components";
import { AssignmentAttachmentUploader } from "@/features/assignments/components";
import type { AssignmentAttachmentsState } from "@/features/assignments/hooks/useAssignmentAttachments";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { Grade3AdventureCard } from "../Grade3AdventureCard";
import { WordBankChips } from "../WordBankChips";
import type { Grade3WritingDay } from "../../types";

type WriteStepProps = {
  attachments: AssignmentAttachmentsState;
  draft: string;
  lesson: Grade3WritingDay;
  onDraftChange: (nextDraft: string) => void;
  onOpenCanvas: () => void;
  saveLabel: string;
  startedCanvas: boolean;
};

export function WriteStep({
  attachments,
  draft,
  lesson,
  onDraftChange,
  onOpenCanvas,
  saveLabel,
  startedCanvas,
}: WriteStepProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const [speaking, setSpeaking] = useState(false);
  const starters = [
    t("grade3WritingAdventure.lessonFlow.write.starterFirst"),
    t("grade3WritingAdventure.lessonFlow.write.starterThen"),
    t("grade3WritingAdventure.lessonFlow.write.starterNoticed"),
    t("grade3WritingAdventure.lessonFlow.write.starterEnd"),
  ];

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const appendStarter = (starter: string) => {
    onDraftChange(draft.trim() ? `${draft}\n${starter} ` : `${starter} `);
  };

  const readDraft = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }

    if (!draft.trim()) {
      return;
    }

    setSpeaking(true);
    Speech.speak(draft, {
      language: "en-US",
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
      pitch: 1.05,
      rate: 0.88,
    });
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Grade3AdventureCard
        icon="4"
        subtitle={lesson.writingPrompt}
        title={t("grade3WritingAdventure.lessonFlow.write.title")}
        variant="mint"
      >
        <View style={{ gap: spacing.md }}>
          <Text style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
            {t("grade3WritingAdventure.lessonFlow.microcopy.firstDraft")}
          </Text>
          <WordBankChips words={lesson.wordBank} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {starters.map((starter) => (
              <Pressable
                accessibilityRole="button"
                key={starter}
                onPress={() => appendStarter(starter)}
                style={{
                  backgroundColor: "#FFF5D7",
                  borderColor: "#E1B858",
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  minHeight: 44,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }}
              >
                <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: colors.text.primary }]}>
                  {starter}
                </Text>
              </Pressable>
            ))}
          </View>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#ECF8F0",
              borderColor: "#A6D6B5",
              borderRadius: radius.lg,
              borderWidth: 1,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
            }}
          >
            <Text accessibilityLiveRegion="polite" style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.text }]}>
              {saveLabel}
            </Text>
          </View>
          <TextField
            gradeBand="elementary"
            inputStyle={{ minHeight: 220 }}
            label={t("grade3WritingAdventure.lessonFlow.write.draftLabel")}
            multiline
            onChangeText={onDraftChange}
            placeholder={t("grade3WritingAdventure.lessonFlow.write.draftPlaceholder")}
            scrollEnabled={false}
            textAlignVertical="top"
            value={draft}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <Button
              gradeBand="elementary"
              label={
                startedCanvas
                  ? t("grade3WritingAdventure.lessonFlow.write.returnCanvas")
                  : t("grade3WritingAdventure.lessonFlow.write.openCanvas")
              }
              onPress={onOpenCanvas}
              size="md"
              variant="secondary"
            />
            <Button
              disabled={!draft.trim()}
              gradeBand="elementary"
              label={
                speaking
                  ? t("grade3WritingAdventure.lessonFlow.write.stopDraft")
                  : t("grade3WritingAdventure.lessonFlow.write.readDraft")
              }
              onPress={readDraft}
              size="md"
              variant="secondary"
            />
          </View>
        </View>
      </Grade3AdventureCard>
      <Grade3AdventureCard
        icon="🖼️"
        subtitle={t("grade3WritingAdventure.lessonFlow.write.uploadSubtitle")}
        title={t("grade3WritingAdventure.lessonFlow.write.uploadTitle")}
        variant="cream"
      >
        <AssignmentAttachmentUploader
          attachments={attachments.attachments}
          error={attachments.error}
          gradeBand="elementary"
          isPicking={attachments.isPicking}
          onPickFile={() => {
            void attachments.pickFile();
          }}
          onPickPhoto={() => {
            void attachments.pickPhoto();
          }}
          onRemove={attachments.remove}
          onRetryExtraction={attachments.retryExtraction}
          onTakePhoto={() => {
            void attachments.takePhoto();
          }}
        />
      </Grade3AdventureCard>
    </View>
  );
}
