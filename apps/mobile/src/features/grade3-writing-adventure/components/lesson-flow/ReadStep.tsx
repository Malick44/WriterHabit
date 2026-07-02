import { Image, Text, View } from "react-native";

import { colors, radius, shadows, spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { grade3Theme } from "../../theme/grade3Theme";
import type { Grade3WritingDay } from "../../types";

const mayaAvatar = require("../../../../../assets/images/writerhabit-child-home/01_maya_avatar.png");
const writingPuppy = require("../../../../../assets/images/writerhabit-child-home/02_writing_puppy.png");

type ReadStepProps = {
  lesson: Grade3WritingDay;
};

export function ReadStep({ lesson }: ReadStepProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ gap: spacing.xs }}>
        <Text
          accessibilityRole="header"
          style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}
        >
          {t("grade3WritingAdventure.lessonFlow.read.cardTitle")}
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
        <Text
          selectable
          style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}
        >
          {lesson.reading}
        </Text>
      </View>
    </View>
  );
}
