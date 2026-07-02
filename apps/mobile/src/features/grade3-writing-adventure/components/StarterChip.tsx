import { Pressable, Text } from "react-native";

import { colors, layout, radius, spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { grade3Theme } from "../theme/grade3Theme";

type StarterChipProps = {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
};

/**
 * Sunshine sentence-starter button shared by the Talk and Write steps.
 * Sized for small hands (52px target) with a pressed state so kids get
 * immediate visual confirmation that their tap landed.
 */
export function StarterChip({ accessibilityHint, label, onPress }: StarterChipProps) {
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: settings.highContrast
          ? accessibleColors.surface
          : pressed
            ? grade3Theme.chip.pressedBackground
            : grade3Theme.chip.background,
        borderColor: settings.highContrast ? accessibleColors.border : grade3Theme.chip.border,
        borderRadius: radius.full,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: layout.touchTargetLarge,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        transform: [{ scale: pressed && !settings.reducedMotion ? 0.96 : 1 }],
      })}
    >
      <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: colors.text.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}
