import {
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";

import { FormField } from "./FormField";

export interface TextFieldProps extends Omit<TextInputProps, "style" | "accessibilityLabel"> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  accessibilityLabel?: string;
  gradeBand?: GradeBand;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function TextField({
  label,
  hint,
  error,
  required,
  accessibilityLabel,
  accessibilityHint,
  gradeBand: gradeBandProp,
  containerStyle,
  inputStyle,
  placeholderTextColor = colors.text.muted,
  editable = true,
  ...inputProps
}: TextFieldProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const hasError = Boolean(error);

  return (
    <FormField
      error={error}
      gradeBand={gradeBand}
      hint={hint}
      label={label}
      required={required}
      style={containerStyle}
    >
      <TextInput
        accessibilityHint={accessibilityHint ?? error ?? hint}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: !editable }}
        editable={editable}
        placeholderTextColor={placeholderTextColor}
        style={[
          getAccessibleTextStyle(type.body, settings),
          {
            backgroundColor: editable ? accessibleColors.surface : colors.background.canvas,
            borderColor: hasError ? colors.border.danger : accessibleColors.border,
            borderRadius: radius.md,
            borderWidth: 1,
            color: accessibleColors.text,
            minHeight: Math.max(48, getMinimumTouchTarget(settings)),
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
          inputProps.multiline ? { minHeight: 112, textAlignVertical: "top" } : null,
          inputStyle,
        ]}
        {...inputProps}
      />
    </FormField>
  );
}
