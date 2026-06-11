import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";

interface PageSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  gradeBand?: GradeBand;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function PageSection({ title, subtitle, children, gradeBand: gradeBandProp, style, testID }: PageSectionProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <View testID={testID} style={[{ gap: spacing.md }, style]}>
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
