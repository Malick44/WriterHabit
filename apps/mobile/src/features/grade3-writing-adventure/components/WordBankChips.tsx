import { Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

type WordBankChipsProps = {
  words: string[];
};

export function WordBankChips({ words }: WordBankChipsProps) {
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {words.map((word) => (
        <View
          accessibilityLabel={word}
          accessibilityRole="text"
          key={word}
          style={{
            backgroundColor: settings.highContrast ? accessibleColors.surface : "#FFF5D7",
            borderColor: settings.highContrast ? accessibleColors.border : "#E1B858",
            borderRadius: radius.lg,
            borderWidth: 1,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: colors.text.primary }]}>
            {word}
          </Text>
        </View>
      ))}
    </View>
  );
}
