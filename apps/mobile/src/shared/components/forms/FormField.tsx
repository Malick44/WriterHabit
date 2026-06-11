import type { ReactNode } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";

export interface FormFieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  gradeBand?: GradeBand;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function FormField({
  label,
  children,
  hint,
  error,
  required = false,
  gradeBand: gradeBandProp,
  style,
  testID,
}: FormFieldProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const helperText = error ?? hint;

  return (
    <View testID={testID} style={[{ gap: spacing.xs }, style]}>
      <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.text }]}>
        {required ? `${label} *` : label}
      </Text>
      {children}
      {helperText ? (
        <Text
          accessibilityRole={error ? "alert" : "text"}
          selectable
          style={[
            getAccessibleTextStyle(type.caption, settings),
            { color: error ? colors.text.danger : accessibleColors.mutedText },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
