import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { RetryButton } from "./RetryButton";

export interface OfflineBannerProps {
  title: string;
  description: string;
  actionLabel?: string;
  accessibilityLabel?: string;
  gradeBand?: GradeBand;
  isRetrying?: boolean;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function OfflineBanner({
  title,
  description,
  actionLabel,
  accessibilityLabel,
  gradeBand = "middle",
  isRetrying = false,
  onRetry,
  style,
  testID,
}: OfflineBannerProps) {
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const toneTokens = colors.feedback.warning;
  const hasAction = Boolean(actionLabel && onRetry);

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="summary"
      accessibilityState={{ busy: isRetrying }}
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
        <Text
          selectable
          style={[
            getAccessibleTextStyle(type.body, settings),
            { color: accessibleColors.mutedText },
          ]}
        >
          {description}
        </Text>
      </View>
      {hasAction ? (
        <RetryButton
          accessibilityLabel={actionLabel}
          gradeBand={gradeBand}
          label={actionLabel ?? ""}
          onRetry={onRetry}
          retrying={isRetrying}
        />
      ) : null}
    </View>
  );
}
