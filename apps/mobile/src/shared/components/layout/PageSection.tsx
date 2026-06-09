import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, spacing, typography, type GradeBand } from "@/design/tokens";

interface PageSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  gradeBand?: GradeBand;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function PageSection({ title, subtitle, children, gradeBand = "middle", style, testID }: PageSectionProps) {
  const type = typography.gradeBands[gradeBand];

  return (
    <View testID={testID} style={[{ gap: spacing.md }, style]}>
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
