import { memo, useMemo } from "react";
import { I18nManager, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAccessibilityContext } from "@/shared/utils/accessibility";

import { AppHeaderAction } from "./AppHeaderAction";
import { AppHeaderProgress } from "./AppHeaderProgress";
import { AppHeaderTitle } from "./AppHeaderTitle";
import { APP_HEADER_MAX_ACTIONS, APP_HEADER_TEST_IDS } from "./appHeader.constants";
import { getAppHeaderColors, getAppHeaderVariantStyle, styles } from "./appHeader.styles";
import type { AppHeaderProps, HeaderAction } from "./appHeader.types";

function isVisibleAction(action: HeaderAction | undefined): action is Exclude<HeaderAction, { type: "none" }> {
  return Boolean(action && action.type !== "none");
}

export const AppHeader = memo(function AppHeader({
  titleKey,
  titleParams,
  subtitleKey,
  subtitleParams,
  variant = "default",
  colorScheme = "light",
  colorOverrides,
  gradeBand = "middle",
  showSafeArea = true,
  sticky = false,
  leftAction,
  rightActions = [],
  progress,
  headerAccessory,
  style,
  contentStyle,
  testID = APP_HEADER_TEST_IDS.root,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { settings } = useAccessibilityContext();
  const variantStyle = getAppHeaderVariantStyle(variant);
  const centered = variant === "centered";
  const headerColors = useMemo(() => {
    const resolved = getAppHeaderColors(variant, colorScheme, settings.highContrast);

    return colorOverrides ? { ...resolved, ...colorOverrides } : resolved;
  }, [colorOverrides, colorScheme, settings.highContrast, variant]);
  const visibleRightActions = useMemo(
    () => rightActions.filter(isVisibleAction).slice(0, APP_HEADER_MAX_ACTIONS),
    [rightActions],
  );
  const safeAreaTop = showSafeArea ? insets.top : 0;
  const rootDynamicStyle = useMemo(
    () => ({
      backgroundColor: headerColors.background,
      borderBottomColor: headerColors.border,
      paddingTop: variantStyle.topPadding + safeAreaTop,
    }),
    [headerColors.background, headerColors.border, safeAreaTop, variantStyle.topPadding],
  );

  return (
    <View
      style={[
        styles.root,
        variantStyle.container,
        sticky ? styles.rootSticky : null,
        rootDynamicStyle,
        style,
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.content,
          variantStyle.content,
          I18nManager.isRTL ? styles.contentRtl : null,
          contentStyle,
        ]}
      >
        <View style={styles.sideSlot}>
          <AppHeaderAction action={leftAction} colors={headerColors} gradeBand={gradeBand} />
        </View>

        <AppHeaderTitle
          centered={centered}
          colors={headerColors}
          gradeBand={gradeBand}
          subtitleKey={subtitleKey}
          subtitleParams={subtitleParams}
          titleKey={titleKey}
          titleParams={titleParams}
          titleRole={variantStyle.titleRole}
          variant={variant}
        />

        <View style={[styles.actionGroup, I18nManager.isRTL ? styles.actionGroupRtl : null]}>
          {visibleRightActions.map((action, index) => (
            <AppHeaderAction
              action={action}
              colors={headerColors}
              gradeBand={gradeBand}
              key={`${action.type}-${action.testID ?? index}`}
            />
          ))}
        </View>
      </View>

      {headerAccessory}

      {progress ? <AppHeaderProgress colors={headerColors} config={progress} gradeBand={gradeBand} /> : null}
    </View>
  );
});
