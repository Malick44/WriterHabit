import { useState, type ReactNode } from "react";
import {
  Pressable,
  Text,
  View,
  type AccessibilityState,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";

import { colors, radius, shadows, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
  type AccessibilitySettings,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";
import { usePressScale } from "@/shared/utils/usePressScale";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  accessibilityState?: AccessibilityState;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const cardVariants: Record<
  CardVariant,
  { backgroundColor: string; borderColor: string; pressedColor: string }
> = {
  default: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    pressedColor: colors.background.subtle,
  },
  accent: {
    backgroundColor: colors.feedback.info.background,
    borderColor: colors.feedback.info.border,
    pressedColor: colors.feedback.info.pressed,
  },
  success: {
    backgroundColor: colors.feedback.success.background,
    borderColor: colors.feedback.success.border,
    pressedColor: colors.feedback.success.pressed,
  },
  warning: {
    backgroundColor: colors.feedback.warning.background,
    borderColor: colors.feedback.warning.border,
    pressedColor: colors.feedback.warning.pressed,
  },
  danger: {
    backgroundColor: colors.feedback.error.background,
    borderColor: colors.feedback.error.border,
    pressedColor: colors.feedback.error.pressed,
  },
};

function CardContent({
  children,
  title,
  subtitle,
  gradeBand,
  contentStyle,
  settings,
}: Pick<CardProps, "children" | "title" | "subtitle" | "gradeBand" | "contentStyle"> & {
  settings: AccessibilitySettings;
}) {
  const type = typography.gradeBands[gradeBand ?? "middle"];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <View style={[{ gap: spacing.md }, contentStyle]}>
      {title || subtitle ? (
        <View style={{ gap: spacing.xs }}>
          {title ? (
            <Text
              accessibilityRole="header"
              selectable
              style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              selectable
              style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
            >
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
  gradeBand: gradeBandProp,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  style,
  contentStyle,
  testID,
}: CardProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
  const accessibleColors = getAccessibleColors(settings);
  const [pressed, setPressed] = useState(false);
  const { handlePressIn, handlePressOut, pressScaleStyle } = usePressScale(Boolean(onPress));
  const variantStyle = cardVariants[variant];
  const pressedColor = settings.highContrast ? accessibleColors.surface : variantStyle.pressedColor;
  const baseStyle: ViewStyle = {
    backgroundColor: settings.highContrast ? accessibleColors.surface : variantStyle.backgroundColor,
    borderColor: settings.highContrast ? accessibleColors.border : variantStyle.borderColor,
    borderCurve: "continuous",
    borderRadius: radius.md,
    borderWidth: settings.highContrast ? 2 : 1,
    padding: spacing.lg,
    ...shadows.raised,
  };
  const content = (
    <CardContent contentStyle={contentStyle} gradeBand={gradeBand} settings={settings} subtitle={subtitle} title={title}>
      {children}
    </CardContent>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        hitSlop={getAccessibleHitSlop(settings)}
        onPress={onPress}
        onPressIn={() => {
          setPressed(true);
          handlePressIn();
        }}
        onPressOut={() => {
          setPressed(false);
          handlePressOut();
        }}
        testID={testID}
        style={[
          baseStyle,
          pressed ? { backgroundColor: pressedColor } : null,
          pressScaleStyle,
          style,
        ]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View accessibilityState={accessibilityState} testID={testID} style={[baseStyle, style]}>
      {content}
    </View>
  );
}
