import { Pressable, Text, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";

import { colors, layout, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

export interface CheckboxRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  gradeBand?: GradeBand;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function CheckboxRow({
  label,
  description,
  checked,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  gradeBand = "middle",
  style,
  testID,
}: CheckboxRowProps) {
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const accent = settings.highContrast ? accessibleColors.actionBackground : colors.gradeBand[gradeBand].accentStrong;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        {
          alignItems: "center",
          flexDirection: "row",
          gap: spacing.md,
          minHeight: Math.max(
            getMinimumTouchTarget(settings),
            gradeBand === "elementary" ? layout.touchTargetLarge : layout.touchTarget,
          ),
          opacity: disabled ? 0.6 : 1,
          paddingVertical: spacing.sm,
        },
        pressed && !disabled ? { backgroundColor: colors.background.subtle } : null,
        style,
      ]}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: checked ? accent : colors.background.surface,
          borderColor: checked ? accent : colors.border.strong,
          borderRadius: radius.sm,
          borderWidth: 2,
          height: 24,
          justifyContent: "center",
          width: 24,
        }}
      >
        {checked ? (
          <View
            style={{
              backgroundColor: colors.text.inverse,
              borderRadius: radius.xs,
              height: 10,
              width: 10,
            }}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
          {label}
        </Text>
        {description ? (
          <Text
            selectable
            style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
