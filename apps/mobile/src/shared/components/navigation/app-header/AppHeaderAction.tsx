import { memo, useCallback } from "react";
import {
  I18nManager,
  Image,
  Pressable,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, layout, radius, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Pill } from "@/shared/components/pills";
import {
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { APP_HEADER_BORDER_WIDTH, APP_HEADER_ICON_SIZE, APP_HEADER_TEST_IDS } from "./appHeader.constants";
import { styles } from "./appHeader.styles";
import type { AppHeaderIconName, AppHeaderResolvedColors, HeaderAction } from "./appHeader.types";

interface AppHeaderActionProps {
  action?: HeaderAction;
  colors: AppHeaderResolvedColors;
  gradeBand: GradeBand;
  style?: StyleProp<ViewStyle>;
}

function getBackIconName(): AppHeaderIconName {
  return I18nManager.isRTL ? "chevron-forward" : "chevron-back";
}

export const AppHeaderAction = memo(function AppHeaderAction({
  action,
  colors: headerColors,
  gradeBand,
  style,
}: AppHeaderActionProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const minTouchTarget = getMinimumTouchTarget(settings);

  const handlePress = useCallback(() => {
    if (!action || action.type === "none" || action.disabled) {
      return;
    }

    if (action.type === "back" || action.type === "close") {
      if (action.onPress) {
        action.onPress();
        return;
      }

      router.back();
      return;
    }

    action.onPress();
  }, [action, router]);

  if (!action || action.type === "none") {
    return null;
  }

  const actionBackground = action.disabled ? headerColors.actionDisabledBackground : headerColors.actionBackground;
  const actionBorder = action.disabled ? headerColors.actionDisabledBorder : headerColors.actionBorder;
  const actionForeground = action.disabled ? headerColors.actionDisabledForeground : headerColors.actionForeground;
  const accessibilityLabel = t(action.accessibilityLabelKey, action.accessibilityLabelParams);
  const accessibilityHint = action.accessibilityHintKey
    ? t(action.accessibilityHintKey, action.accessibilityHintParams)
    : undefined;
  const testID = action.testID ?? `${APP_HEADER_TEST_IDS.action}-${action.type}`;

  if (action.type === "avatar") {
    const avatarBackground = action.backgroundColor ?? actionBackground;
    const avatarForeground = action.foregroundColor ?? actionForeground;

    return (
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: action.disabled }}
        disabled={action.disabled}
        hitSlop={getAccessibleHitSlop(settings)}
        onPress={handlePress}
        style={({ pressed }) => [
          {
            alignItems: "center",
            backgroundColor: pressed && !action.disabled ? colors.action.ghost.pressed : avatarBackground,
            borderColor: actionBorder,
            borderRadius: radius.full,
            borderWidth: APP_HEADER_BORDER_WIDTH,
            height: Math.max(minTouchTarget, layout.touchTarget),
            justifyContent: "center",
            width: Math.max(minTouchTarget, layout.touchTarget),
          },
          style,
        ]}
        testID={testID}
      >
        {action.imageUri ? (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: action.imageUri }}
            style={[styles.avatarImage, action.imageStyle]}
            testID={APP_HEADER_TEST_IDS.avatar}
          />
        ) : (
          <Text
            maxFontSizeMultiplier={1}
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(type.button, settings),
              styles.avatarFallbackText,
              { color: avatarForeground },
            ]}
            testID={APP_HEADER_TEST_IDS.avatar}
          >
            {action.fallbackText}
          </Text>
        )}
      </Pressable>
    );
  }

  if (action.type === "text" || action.type === "pill") {
    const label = t(action.labelKey, action.labelParams);

    return (
      <Pill
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        colorOverrides={{
          background: actionBackground,
          border: actionBorder,
          foreground: actionForeground,
          pressedBackground: colors.action.ghost.pressed,
        }}
        disabled={action.disabled}
        gradeBand={gradeBand}
        label={label}
        leadingIcons={action.type === "pill" ? action.leadingIcons : undefined}
        onPress={handlePress}
        style={style}
        testID={testID}
        trailingIcons={action.type === "pill" ? action.trailingIcons : undefined}
      />
    );
  }

  const iconName: AppHeaderIconName =
    action.type === "back" ? getBackIconName() : action.type === "close" ? "close" : action.icon;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: action.disabled }}
      disabled={action.disabled}
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={handlePress}
      style={({ pressed }) => [
        {
          alignItems: "center",
          backgroundColor: pressed && !action.disabled ? colors.action.ghost.pressed : actionBackground,
          borderColor: actionBorder,
          borderRadius: radius.full,
          borderWidth: APP_HEADER_BORDER_WIDTH,
          height: Math.max(minTouchTarget, layout.touchTarget),
          justifyContent: "center",
          width: Math.max(minTouchTarget, layout.touchTarget),
        },
        style,
      ]}
      testID={testID}
    >
      <Ionicons color={actionForeground} name={iconName} size={APP_HEADER_ICON_SIZE} />
    </Pressable>
  );
});
