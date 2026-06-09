import { Text } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { StudentHomeDraft } from "../types";

interface ContinueDraftCardProps {
  draft: StudentHomeDraft;
  gradeBand: GradeBand;
  onContinuePress: () => void;
}

export function ContinueDraftCard({ draft, gradeBand, onContinuePress }: ContinueDraftCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("studentHome.continueDraft.accessibility"),
        draft.title,
        draft.wordCount,
      ])}
      gradeBand={gradeBand}
      testID="student-home-continue-draft"
      title={t("studentHome.continueDraft.title")}
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
            {draft.title}
          </Text>
          <Text
            numberOfLines={gradeBand === "elementary" ? 2 : 3}
            selectable
            style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}
          >
            {draft.preview}
          </Text>
        </Stack>
        <Inline gap="sm">
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {draft.lastEditedLabel}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {t("studentHome.continueDraft.wordCount", { count: draft.wordCount })}
          </Text>
          {draft.revisionNumber > 0 ? (
            <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
              {t("studentHome.continueDraft.revision", { count: draft.revisionNumber })}
            </Text>
          ) : null}
        </Inline>
        <Button
          accessibilityHint={t("studentHome.continueDraft.hint")}
          accessibilityLabel={t("studentHome.continueDraft.ctaAccessibility")}
          gradeBand={gradeBand}
          label={t("studentHome.continueDraft.cta")}
          onPress={onContinuePress}
          size={gradeBand === "elementary" ? "lg" : "md"}
        />
      </Stack>
    </Card>
  );
}
