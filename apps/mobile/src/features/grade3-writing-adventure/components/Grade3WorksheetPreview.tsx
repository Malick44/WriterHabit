import { StyleSheet, Text, View } from "react-native";

import { palette, radius, spacing, typography, withAlpha } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

type Grade3WorksheetPreviewProps = {
  emoji: string;
  scene: string;
};

const lineKeys = [
  "grade3WritingAdventure.lesson.worksheetLineOne",
  "grade3WritingAdventure.lesson.worksheetLineTwo",
  "grade3WritingAdventure.lesson.worksheetLineThree",
] as const;

export function Grade3WorksheetPreview({ emoji, scene }: Grade3WorksheetPreviewProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;

  return (
    <View
      accessible
      accessibilityLabel={t("grade3WritingAdventure.lesson.worksheetAccessibility", { scene })}
      style={[
        styles.sheet,
        settings.highContrast
          ? { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }
          : null,
      ]}
    >
      <View style={styles.holeColumn} accessibilityElementsHidden importantForAccessibility="no">
        {[0, 1, 2].map((hole) => (
          <View key={hole} style={styles.hole} />
        ))}
      </View>
      <View style={styles.sheetContent}>
        <View style={styles.headerRow}>
          <View style={styles.emojiBox}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text
              numberOfLines={2}
              style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}
            >
              {scene}
            </Text>
            <Text
              style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
            >
              {t("grade3WritingAdventure.lesson.worksheetSubtitle")}
            </Text>
          </View>
        </View>
        <View style={styles.pictureFrame}>
          <Text style={styles.pictureEmoji}>{emoji}</Text>
          <View style={styles.promptLines}>
            {lineKeys.map((key) => (
              <Text
                key={key}
                style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}
              >
                {t(key)}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.writingLines} accessibilityElementsHidden importantForAccessibility="no">
          {[0, 1, 2, 3].map((line) => (
            <View key={line} style={styles.writingLine} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 34,
    lineHeight: 40,
  },
  emojiBox: {
    alignItems: "center",
    backgroundColor: "#FFF4D6",
    borderColor: "#EBCB8B",
    borderRadius: radius.md,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  hole: {
    backgroundColor: "#F4E7D0",
    borderColor: "#D8B986",
    borderRadius: 999,
    borderWidth: 1,
    height: 12,
    width: 12,
  },
  holeColumn: {
    alignItems: "center",
    gap: 34,
    paddingTop: spacing.lg,
    width: 20,
  },
  pictureEmoji: {
    fontSize: 42,
    lineHeight: 50,
  },
  pictureFrame: {
    alignItems: "center",
    backgroundColor: "#FFFDF8",
    borderColor: "#D7C2A4",
    borderRadius: radius.md,
    borderStyle: "dashed",
    borderWidth: 2,
    gap: spacing.sm,
    minHeight: 132,
    justifyContent: "center",
    padding: spacing.lg,
  },
  promptLines: {
    alignItems: "center",
    gap: spacing.xs,
  },
  sheet: {
    backgroundColor: "#FFFDF8",
    borderColor: "#E3C79A",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  sheetContent: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  writingLine: {
    backgroundColor: withAlpha("#7EA4B8", 0.45),
    borderRadius: 999,
    height: 2,
  },
  writingLines: {
    gap: spacing.md,
  },
});
