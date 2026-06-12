import { memo, useMemo } from "react";
import { I18nManager, Text, View, type TextStyle } from "react-native";

import { typography, type GradeBand, type TextRole } from "@/design/tokens";
import { useI18n, type TranslationKey, type TranslationParams } from "@/i18n";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { APP_HEADER_TEST_IDS } from "./appHeader.constants";
import { styles } from "./appHeader.styles";
import type { AppHeaderResolvedColors, AppHeaderVariant } from "./appHeader.types";

const APP_HEADER_TITLE_FONT_SCALE = 0.9;
const APP_HEADER_TITLE_LINE_HEIGHT_SCALE = 0.93;

interface AppHeaderTitleProps {
  titleKey?: TranslationKey;
  titleParams?: TranslationParams;
  subtitleKey?: TranslationKey;
  subtitleParams?: TranslationParams;
  colors: AppHeaderResolvedColors;
  centered: boolean;
  gradeBand: GradeBand;
  titleRole: TextRole;
  variant: AppHeaderVariant;
}

function getCompactTitleStyle(style: TextStyle): TextStyle {
  const fontSize =
    typeof style.fontSize === "number"
      ? Math.max(13, Math.round(style.fontSize * APP_HEADER_TITLE_FONT_SCALE))
      : style.fontSize;
  const lineHeight =
    typeof style.lineHeight === "number"
      ? Math.max(18, Math.round(style.lineHeight * APP_HEADER_TITLE_LINE_HEIGHT_SCALE))
      : style.lineHeight;

  return {
    ...style,
    fontSize,
    lineHeight,
  };
}

export const AppHeaderTitle = memo(function AppHeaderTitle({
  titleKey,
  titleParams,
  subtitleKey,
  subtitleParams,
  colors: headerColors,
  centered,
  gradeBand,
  titleRole,
  variant,
}: AppHeaderTitleProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const title = titleKey ? t(titleKey, titleParams) : undefined;
  const displayTitle = title?.toUpperCase();
  const subtitle = subtitleKey ? t(subtitleKey, subtitleParams) : undefined;
  const numberOfTitleLines = variant === "compact" ? 1 : variant === "large" ? 3 : 2;
  const titleStyle = useMemo(
    () => getCompactTitleStyle(getAccessibleTextStyle(type[titleRole], settings)),
    [settings, titleRole, type],
  );
  const subtitleStyle = useMemo(
    () => getAccessibleTextStyle(type.bodySmall, settings),
    [settings, type],
  );

  if (!title && !subtitle) {
    return <View style={styles.titleBlock} />;
  }

  return (
    <View
      style={[
        styles.titleBlock,
        centered ? styles.titleBlockCentered : null,
        I18nManager.isRTL && !centered ? styles.titleBlockRtl : null,
      ]}
    >
      {title ? (
        <Text
          accessibilityLabel={title}
          accessibilityRole="header"
          numberOfLines={numberOfTitleLines}
          selectable
          style={[
            titleStyle,
            styles.titleText,
            {
              color: headerColors.text,
              textAlign: "center",
              writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
            },
          ]}
          testID={APP_HEADER_TEST_IDS.title}
        >
          {displayTitle}
        </Text>
      ) : null}

      {subtitle ? (
        <Text
          numberOfLines={variant === "compact" ? 1 : 2}
          selectable
          style={[
            subtitleStyle,
            styles.subtitleText,
            {
              color: headerColors.mutedText,
              textAlign: centered ? "center" : I18nManager.isRTL ? "right" : "left",
              writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
            },
          ]}
          testID={APP_HEADER_TEST_IDS.subtitle}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
});
