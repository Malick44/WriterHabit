import { Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { grade3Theme } from "../theme/grade3Theme";

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
            backgroundColor: settings.highContrast ? accessibleColors.surface : grade3Theme.chip.background,
            borderColor: settings.highContrast ? accessibleColors.border : grade3Theme.chip.border,
            borderRadius: radius.full,
            borderWidth: 1,
            justifyContent: "center",
            paddingHorizontal: spacing.lg,
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
