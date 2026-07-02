import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";

import { colors, radius, shadows, spacing, typography } from "@/design/tokens";
import { Button } from "@/shared/components";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { grade3Theme } from "../../theme/grade3Theme";

type LessonBottomBarProps = {
  backLabel: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  helperText?: string;
  saveLabel?: string;
  readAloudText?: string;
};

export function LessonBottomBar({
  backLabel,
  helperText,
  nextDisabled = false,
  nextLabel,
  nextLoading = false,
  onBack,
  onNext,
  readAloudText,
  saveLabel,
}: LessonBottomBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const [speaking, setSpeaking] = useState(false);
  const isReadBar = Boolean(readAloudText);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const toggleReadAloud = () => {
    if (!readAloudText) {
      return;
    }

    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    Speech.speak(readAloudText, {
      language: "en-US",
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
      pitch: 1.05,
      rate: 0.88,
    });
  };

  return (
    <View
      style={{
        backgroundColor: settings.highContrast ? accessibleColors.surface : grade3Theme.screen.background,
        borderTopColor: settings.highContrast ? accessibleColors.border : grade3Theme.screen.barBorder,
        borderTopWidth: 1,
        gap: spacing.sm,
        paddingBottom: Math.max(insets.bottom, spacing.md),
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        ...shadows.raised,
      }}
    >
      {!isReadBar && (helperText || saveLabel) ? (
        <View
          style={{
            alignSelf: "center",
            backgroundColor: helperText ? colors.feedback.warning.background : grade3Theme.card.mint.background,
            borderColor: helperText ? colors.feedback.warning.border : grade3Theme.card.mint.border,
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
          accessibilityLabel={backLabel}
          gradeBand="elementary"
          label={isReadBar ? "←" : backLabel}
          onPress={onBack}
          size={isReadBar ? "md" : "lg"}
          style={isReadBar ? { borderRadius: radius.full, width: 56 } : { flex: 1 }}
          textStyle={isReadBar ? { fontSize: 24, lineHeight: 28 } : undefined}
          variant="secondary"
        />
        {isReadBar ? (
          <Button
            gradeBand="elementary"
            label={
              speaking
                ? t("grade3WritingAdventure.lesson.stopReading")
                : t("grade3WritingAdventure.lesson.readAloud")
            }
            onPress={toggleReadAloud}
            size="md"
            style={{ flex: 1 }}
            textStyle={{ fontSize: 15, lineHeight: 20 }}
            variant="secondary"
          />
        ) : null}
        <Button
          disabled={nextDisabled}
          gradeBand="elementary"
          label={nextLabel}
          loading={nextLoading}
          onPress={onNext}
          size={isReadBar ? "md" : "lg"}
          style={{
            backgroundColor: isReadBar && !nextDisabled ? grade3Theme.accent.lavenderBright : undefined,
            flex: isReadBar ? 1.15 : 1,
          }}
          textStyle={isReadBar ? { fontSize: 15, lineHeight: 20 } : undefined}
        />
      </View>
    </View>
  );
}
