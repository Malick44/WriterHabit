import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Button } from "@/shared/components/buttons/Button";
import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "error";

export interface StatusStateProps {
  title: string;
  description?: string;
  tone?: StatusTone;
  actionLabel?: string;
  onActionPress?: () => void;
  accessibilityLabel?: string;
  gradeBand?: GradeBand;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const toneMap = {
  neutral: colors.feedback.neutral,
  info: colors.feedback.info,
  success: colors.feedback.success,
  warning: colors.feedback.warning,
  error: colors.feedback.error,
} as const;

export function StatusState({
  title,
  description,
  tone = "neutral",
  actionLabel,
  onActionPress,
  accessibilityLabel,
  gradeBand = "middle",
  style,
  testID,
}: StatusStateProps) {
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const toneTokens = toneMap[tone];

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole={tone === "error" ? "alert" : "summary"}
      testID={testID}
      style={[
        {
          alignItems: "flex-start",
          backgroundColor: settings.highContrast ? accessibleColors.surface : toneTokens.background,
          borderColor: settings.highContrast ? accessibleColors.border : toneTokens.border,
          borderRadius: radius.md,
          borderWidth: 1,
          gap: spacing.md,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      <View style={{ gap: spacing.xs }}>
        <Text
          selectable
          style={[
            getAccessibleTextStyle(type.title, settings),
            { color: settings.highContrast ? accessibleColors.text : toneTokens.text },
          ]}
        >
          {title}
        </Text>
        {description ? (
          <Text
            selectable
            style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel && onActionPress ? (
        <Button
          accessibilityLabel={actionLabel}
          gradeBand={gradeBand}
          label={actionLabel}
          onPress={onActionPress}
          size="sm"
          variant={tone === "error" ? "danger" : "secondary"}
        />
      ) : null}
    </View>
  );
}
