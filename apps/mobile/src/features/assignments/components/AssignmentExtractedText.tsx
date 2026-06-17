import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  colors,
  radius,
  spacing,
  typography,
  type GradeBand,
} from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

const dashboard = colors.dashboard;

function countWords(text: string): number {
  const trimmed = text.trim();

  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

interface AssignmentExtractedTextProps {
  gradeBand: GradeBand;
  value: string;
  onChangeText: (text: string) => void;
  isExtracting: boolean;
  isEdited: boolean;
  onReset: () => void;
}

export function AssignmentExtractedText({
  gradeBand,
  value,
  onChangeText,
  isExtracting,
  isEdited,
  onReset,
}: AssignmentExtractedTextProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const wordCount = countWords(value);
  const showExtractingHint = isExtracting && value.length === 0;

  return (
    <View style={styles.container} testID="assignment-extracted-text">
      <Text
        style={[getAccessibleTextStyle(type.body, settings), styles.subtitle]}
      >
        {t("assignments.attachments.extractedSectionSubtitle")}
      </Text>

      {showExtractingHint ? (
        <View style={styles.hintRow}>
          <ActivityIndicator color={dashboard.primary} size="small" />
          <Text
            style={[
              getAccessibleTextStyle(type.caption, settings),
              styles.hintText,
            ]}
          >
            {t("assignments.attachments.extractingHint")}
          </Text>
        </View>
      ) : null}

      <TextInput
        accessibilityLabel={t("assignments.attachments.extractedAccessibility")}
        multiline
        onChangeText={onChangeText}
        placeholder={t("assignments.attachments.extractedPlaceholder")}
        placeholderTextColor={dashboard.onSurfaceVariant}
        style={[getAccessibleTextStyle(type.body, settings), styles.input]}
        textAlignVertical="top"
        value={value}
      />

      <View style={styles.footer}>
        <Text
          style={[
            getAccessibleTextStyle(type.caption, settings),
            styles.wordCount,
          ]}
        >
          {t("assignments.attachments.extractedWordCount", {
            count: wordCount,
          })}
        </Text>
        {isEdited ? (
          <Pressable
            accessibilityLabel={t("assignments.attachments.resetAccessibility")}
            accessibilityRole="button"
            hitSlop={getAccessibleHitSlop(settings)}
            onPress={onReset}
          >
            <Text
              style={[
                getAccessibleTextStyle(type.caption, settings),
                styles.resetLink,
              ]}
            >
              {t("assignments.attachments.resetToExtracted")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hintRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  hintText: {
    color: dashboard.onSurfaceVariant,
  },
  input: {
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    color: dashboard.onSurface,
    minHeight: 132,
    padding: spacing.md,
  },
  resetLink: {
    color: dashboard.primary,
    fontWeight: "700",
  },
  subtitle: {
    color: dashboard.onSurfaceVariant,
  },
  wordCount: {
    color: dashboard.onSurfaceVariant,
  },
});
