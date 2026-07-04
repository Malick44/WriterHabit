import { Image, ScrollView, Text, View, useWindowDimensions } from "react-native";

import { colors, fonts, radius, shadows, spacing, typography } from "@/design/tokens";
import { ReadAloudText, TextActionBar, useTextActionBar } from "@/shared/components/text";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { grade3Theme } from "../../theme/grade3Theme";
import type { Grade3WritingDay } from "../../types";

const mayaAvatar = require("../../../../../assets/images/writerhabit-child-home/01_maya_avatar.png");
const writingPuppy = require("../../../../../assets/images/writerhabit-child-home/02_writing_puppy.png");

type ReadStepProps = {
  lesson: Grade3WritingDay;
};

/**
 * Storybook reading style for Grades 1–3: bigger than the elementary body
 * token, extra leading, and a touch of letter spacing so early readers can
 * track lines. Runs through getAccessibleTextStyle so user text-size and
 * dyslexia settings still apply on top.
 */
const storyTextStyle = {
  fontFamily: fonts.sans,
  fontSize: 21,
  fontWeight: "400",
  letterSpacing: 0.4,
  lineHeight: 34,
} as const;

export function ReadStep({ lesson }: ReadStepProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const { height: windowHeight } = useWindowDimensions();
  const type = typography.gradeBands.elementary;
  // The story panel gets its own bounded scroll area so a long passage
  // scrolls under the (fixed) scene illustration instead of pushing it away.
  const storyMaxHeight = Math.max(180, Math.round(windowHeight * 0.32));
  const actionBar = useTextActionBar({
    enableFeedback: false,
    sourceType: "reading",
    text: lesson.reading,
  });

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ gap: spacing.xs }}>
        <Text
          accessibilityRole="header"
          style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}
        >
          {t("grade3WritingAdventure.lessonFlow.read.title")}
        </Text>
        <Text style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
          {t("grade3WritingAdventure.lessonFlow.read.cardSubtitle")}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: settings.highContrast ? accessibleColors.surface : colors.background.surface,
          borderColor: settings.highContrast ? accessibleColors.border : grade3Theme.scene.cardBorder,
          borderRadius: radius.lg,
          borderWidth: 1,
          gap: spacing.md,
          padding: spacing.md,
          ...shadows.raised,
        }}
      >
        <View
          accessibilityLabel={lesson.visualPrompt.scene}
          accessibilityRole="image"
          style={{
            backgroundColor: grade3Theme.scene.background,
            borderColor: grade3Theme.scene.border,
            borderRadius: radius.md,
            borderWidth: 1,
            height: 150,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: grade3Theme.scene.sky,
              height: 70,
              left: 0,
              position: "absolute",
              right: 0,
              top: 0,
            }}
          />
          <View
            style={{
              backgroundColor: grade3Theme.scene.ground,
              bottom: 0,
              height: 62,
              left: 0,
              position: "absolute",
              right: 0,
            }}
          />
          <View
            style={{
              backgroundColor: grade3Theme.scene.bush,
              borderRadius: radius.full,
              height: 70,
              left: -18,
              position: "absolute",
              top: 52,
              width: 70,
            }}
          />
          <View
            style={{
              backgroundColor: grade3Theme.scene.sun,
              borderRadius: radius.full,
              height: 54,
              position: "absolute",
              right: -14,
              top: 36,
              width: 54,
            }}
          />
          <View
            style={{
              backgroundColor: grade3Theme.scene.table,
              borderRadius: radius.md,
              bottom: 16,
              height: 50,
              left: 24,
              position: "absolute",
              right: 24,
            }}
          />
          <Image
            accessibilityIgnoresInvertColors
            source={mayaAvatar}
            style={{
              bottom: 34,
              height: 98,
              left: 38,
              position: "absolute",
              resizeMode: "contain",
              width: 98,
            }}
          />
          <Image
            accessibilityIgnoresInvertColors
            source={writingPuppy}
            style={{
              bottom: 22,
              height: 100,
              position: "absolute",
              resizeMode: "contain",
              right: 28,
              width: 100,
            }}
          />
        </View>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          style={{ maxHeight: storyMaxHeight }}
        >
          <ReadAloudText
            selectable
            style={[getAccessibleTextStyle(storyTextStyle, settings), { color: accessibleColors.text }]}
            text={lesson.reading}
          />
        </ScrollView>
        <TextActionBar
          {...actionBar.actionBarProps}
          gradeBand="elementary"
          size="sm"
          style={{ alignSelf: "flex-end" }}
          testID="read-step-text-actions"
          variant="inline"
        />
      </View>
    </View>
  );
}
