import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadows, spacing, typography } from "@/design/tokens";
import { Button } from "@/shared/components";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

type LessonBottomBarProps = {
  backLabel: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  helperText?: string;
  saveLabel?: string;
};

export function LessonBottomBar({
  backLabel,
  helperText,
  nextDisabled = false,
  nextLabel,
  nextLoading = false,
  onBack,
  onNext,
  saveLabel,
}: LessonBottomBarProps) {
  const insets = useSafeAreaInsets();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;

  return (
    <View
      style={{
        backgroundColor: settings.highContrast ? accessibleColors.surface : "#FFF8E9",
        borderTopColor: settings.highContrast ? accessibleColors.border : "#E8CFA2",
        borderTopWidth: 1,
        gap: spacing.sm,
        paddingBottom: Math.max(insets.bottom, spacing.md),
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        ...shadows.raised,
      }}
    >
      {helperText || saveLabel ? (
        <View
          style={{
            alignSelf: "center",
            backgroundColor: helperText ? colors.feedback.warning.background : "#ECF8F0",
            borderColor: helperText ? colors.feedback.warning.border : "#A6D6B5",
            borderRadius: radius.lg,
            borderWidth: 1,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
          }}
        >
          <Text
            accessibilityLiveRegion="polite"
            style={[
              getAccessibleTextStyle(type.bodySmall, settings),
              { color: helperText ? colors.feedback.warning.text : accessibleColors.text },
            ]}
          >
            {helperText ?? saveLabel}
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Button
          gradeBand="elementary"
          label={backLabel}
          onPress={onBack}
          size="lg"
          style={{ flex: 1 }}
          variant="secondary"
        />
        <Button
          disabled={nextDisabled}
          gradeBand="elementary"
          label={nextLabel}
          loading={nextLoading}
          onPress={onNext}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
