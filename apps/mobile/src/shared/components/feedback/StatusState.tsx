import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Button } from "@/shared/components/buttons/Button";
import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";

import { RetryButton } from "./RetryButton";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "error";

export interface StatusStateProps {
  title: string;
  description?: string;
  tone?: StatusTone;
  actionLabel?: string;
  actionLoading?: boolean;
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
  actionLoading = false,
  onActionPress,
  accessibilityLabel,
  gradeBand: gradeBandProp,
  style,
  testID,
}: StatusStateProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
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
        tone === "error" || tone === "warning" ? (
          <RetryButton
            accessibilityLabel={actionLabel}
            gradeBand={gradeBand}
            label={actionLabel}
            onRetry={onActionPress}
            retrying={actionLoading}
          />
        ) : (
          <Button
            accessibilityLabel={actionLabel}
            gradeBand={gradeBand}
            label={actionLabel}
            loading={actionLoading}
            onPress={onActionPress}
            size="sm"
            variant="secondary"
          />
        )
      ) : null}
    </View>
  );
}
