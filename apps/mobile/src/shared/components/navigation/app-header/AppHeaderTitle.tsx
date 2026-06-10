import { memo, useMemo } from "react";
import { I18nManager, Text, View } from "react-native";

import { typography, type GradeBand, type TextRole } from "@/design/tokens";
import { useI18n, type TranslationKey, type TranslationParams } from "@/i18n";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { APP_HEADER_TEST_IDS } from "./appHeader.constants";
import { styles } from "./appHeader.styles";
import type { AppHeaderResolvedColors, AppHeaderVariant } from "./appHeader.types";

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
  const subtitle = subtitleKey ? t(subtitleKey, subtitleParams) : undefined;
  const numberOfTitleLines = variant === "compact" ? 1 : variant === "large" ? 3 : 2;
  const titleStyle = useMemo(
    () => getAccessibleTextStyle(type[titleRole], settings),
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
          accessibilityRole="header"
          numberOfLines={numberOfTitleLines}
          selectable
          style={[
            titleStyle,
            styles.titleText,
            {
              color: headerColors.text,
              textAlign: centered ? "center" : I18nManager.isRTL ? "right" : "left",
              writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
            },
          ]}
          testID={APP_HEADER_TEST_IDS.title}
        >
          {title}
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
