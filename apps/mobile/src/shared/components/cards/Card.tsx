import type { ReactNode } from "react";
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, layout, radius, shadows, spacing, typography, type GradeBand } from "@/design/tokens";

export type CardVariant = "default" | "accent" | "success" | "warning" | "danger";

export interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  variant?: CardVariant;
  gradeBand?: GradeBand;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const cardVariants: Record<CardVariant, { backgroundColor: string; borderColor: string }> = {
  default: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
  },
  accent: {
    backgroundColor: colors.feedback.info.background,
    borderColor: colors.feedback.info.border,
  },
  success: {
    backgroundColor: colors.feedback.success.background,
    borderColor: colors.feedback.success.border,
  },
  warning: {
    backgroundColor: colors.feedback.warning.background,
    borderColor: colors.feedback.warning.border,
  },
  danger: {
    backgroundColor: colors.feedback.error.background,
    borderColor: colors.feedback.error.border,
  },
};

function CardContent({
  children,
  title,
  subtitle,
  gradeBand,
  contentStyle,
}: Pick<CardProps, "children" | "title" | "subtitle" | "gradeBand" | "contentStyle">) {
  const type = typography.gradeBands[gradeBand ?? "middle"];

  return (
    <View style={[{ gap: spacing.md }, contentStyle]}>
      {title || subtitle ? (
        <View style={{ gap: spacing.xs }}>
          {title ? (
            <Text accessibilityRole="header" selectable style={[type.title, { color: colors.text.primary }]}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text selectable style={[type.bodySmall, { color: colors.text.secondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Card({
  children,
  title,
  subtitle,
  variant = "default",
  gradeBand = "middle",
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  contentStyle,
  testID,
}: CardProps) {
  const variantStyle = cardVariants[variant];
  const baseStyle: ViewStyle = {
    backgroundColor: variantStyle.backgroundColor,
    borderColor: variantStyle.borderColor,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.raised,
  };
  const content = (
    <CardContent contentStyle={contentStyle} gradeBand={gradeBand} subtitle={subtitle} title={title}>
      {children}
    </CardContent>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        hitSlop={layout.hitSlop}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          baseStyle,
          pressed ? { backgroundColor: colors.background.subtle } : null,
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[baseStyle, style]}>
      {content}
    </View>
  );
}
