import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import type { CanvasTemplate } from "../types";
import { templateIcon, templateLabelKey } from "./canvasVisuals";

interface CanvasTemplatePillProps {
  template: CanvasTemplate;
  gradeBand: GradeBand;
}

/** Small rounded chip showing a canvas page's template type. */
export function CanvasTemplatePill({ template, gradeBand }: CanvasTemplatePillProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];

  return (
    <View
      style={{
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: colors.background.subtle,
        borderRadius: radius.full,
        flexDirection: "row",
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
      }}
    >
      <Ionicons color={colors.feedback.info.icon} name={templateIcon[template]} size={13} />
      <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.feedback.info.text }]}>
        {t(templateLabelKey[template])}
      </Text>
    </View>
  );
}
