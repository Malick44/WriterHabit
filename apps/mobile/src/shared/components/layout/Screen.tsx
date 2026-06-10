import { type PropsWithChildren, type ReactNode } from "react";
import {
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { layout, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

interface ScreenProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  gradeBand?: GradeBand;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  testID?: string;
}

export function Screen({
  title,
  subtitle,
  footer,
  gradeBand = "middle",
  scroll = true,
  contentStyle,
  backgroundColor,
  testID,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { settings } = useAccessibilityContext();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const horizontalPadding = isTablet
    ? layout.screenPadding.tablet
    : settings.simplifiedUi
      ? layout.screenPadding.phone + spacing.sm
      : layout.screenPadding.phone;
  const resolvedBackgroundColor = backgroundColor ?? accessibleColors.background;
  const content = (
    <View
      style={[
        {
          alignSelf: "center",
          gap: spacing.lg,
          maxWidth: layout.maxContentWidth,
          width: "100%",
        },
        contentStyle,
      ]}
    >
      {title || subtitle ? (
        <View style={{ gap: spacing.xs }}>
          {title ? (
            <Text
              accessibilityRole="header"
              selectable
              style={[getAccessibleTextStyle(type.heading, settings), { color: accessibleColors.text }]}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              selectable
              style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={{ gap: spacing.md }}>{children}</View>
    </View>
  );

  if (!scroll) {
    return (
      <View
        testID={testID}
        style={{
          backgroundColor: resolvedBackgroundColor,
          flex: 1,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
          paddingHorizontal: horizontalPadding,
          paddingTop: Math.max(insets.top, spacing.lg),
        }}
      >
        {content}
        {footer}
      </View>
    );
  }

  return (
    <View testID={testID} style={{ backgroundColor: resolvedBackgroundColor, flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, spacing.xl),
          paddingHorizontal: horizontalPadding,
          paddingTop: Math.max(insets.top, spacing.lg),
        }}
      >
        {content}
      </ScrollView>
      {footer}
    </View>
  );
}
