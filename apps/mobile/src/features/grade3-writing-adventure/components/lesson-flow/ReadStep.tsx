import { Image, Text, View } from "react-native";

import { radius, shadows, spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

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
          style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text, fontSize: 20, lineHeight: 25 }]}
        >
          {t("grade3WritingAdventure.lessonFlow.read.cardTitle")}
        </Text>
        <Text style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText, fontSize: 13, lineHeight: 18 }]}>
          {t("grade3WritingAdventure.lessonFlow.read.cardSubtitle")}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: settings.highContrast ? accessibleColors.surface : "#FFFFFF",
          borderColor: settings.highContrast ? accessibleColors.border : "#E7DED3",
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
            backgroundColor: "#F6E9CF",
            borderColor: "#E1D3B8",
            borderRadius: radius.md,
            borderWidth: 1,
            height: 150,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: "#CFEBDD",
              height: 70,
              left: 0,
              position: "absolute",
              right: 0,
              top: 0,
            }}
          />
          <View
            style={{
              backgroundColor: "#E9D6B4",
              bottom: 0,
              height: 62,
              left: 0,
              position: "absolute",
              right: 0,
            }}
          />
          <View
            style={{
              backgroundColor: "#93C98E",
              borderRadius: 999,
              height: 70,
              left: -18,
              position: "absolute",
              top: 52,
              width: 70,
            }}
          />
          <View
            style={{
              backgroundColor: "#9BC4D7",
              borderRadius: 999,
              height: 54,
              position: "absolute",
              right: -14,
              top: 36,
              width: 54,
            }}
          />
          <View
            style={{
              backgroundColor: "#D9A96D",
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
          style={[
            getAccessibleTextStyle(type.body, settings),
            { color: accessibleColors.text, fontSize: 16, lineHeight: 24 },
          ]}
        >
          {lesson.reading}
        </Text>
      </View>
    </View>
  );
}
