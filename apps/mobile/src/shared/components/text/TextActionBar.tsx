import { useState, type ComponentProps } from "react";
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";

import { colors, layout, radius, shadows, spacing, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";
import { usePressScale } from "@/shared/utils/usePressScale";
import type { TranslationKey } from "@/shared/i18n";

import type { TextActionBarAction } from "./textActionBar.types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type TextActionBarVariant = "floating" | "inline";
export type TextActionBarSize = "sm" | "md";

export interface TextActionBarProps {
  onLike?: () => void;
  onDislike?: () => void;
  onReadAloud?: () => void;
  onCopy?: () => void;
  onMore?: () => void;
  /** Actions rendered in a highlighted state (selected thumb, reading, copied). */
  activeActions?: readonly TextActionBarAction[];
  disabledActions?: readonly TextActionBarAction[];
  /**
   * Actions rendered with a spinner. Still pressable so controllers can
   * treat the press as cancel (e.g. stop preparing read-aloud).
   */
  loadingActions?: readonly TextActionBarAction[];
  variant?: TextActionBarVariant;
  size?: TextActionBarSize;
  gradeBand?: GradeBand;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

type ActionDefinition = {
  action: TextActionBarAction;
  icon: IoniconName;
  activeIcon: IoniconName;
  labelKey: TranslationKey;
  activeLabelKey: TranslationKey;
  hintKey: TranslationKey;
};

const actionDefinitions: ActionDefinition[] = [
  {
    action: "like",
    icon: "thumbs-up-outline",
    activeIcon: "thumbs-up",
    labelKey: "textActionBar.like",
    activeLabelKey: "textActionBar.like",
    hintKey: "textActionBar.likeHint",
  },
  {
    action: "dislike",
    icon: "thumbs-down-outline",
    activeIcon: "thumbs-down",
    labelKey: "textActionBar.dislike",
    activeLabelKey: "textActionBar.dislike",
    hintKey: "textActionBar.dislikeHint",
  },
  {
    action: "readAloud",
    icon: "volume-medium-outline",
    activeIcon: "volume-high",
    labelKey: "textActionBar.readAloud",
    activeLabelKey: "textActionBar.readAloudActive",
    hintKey: "textActionBar.readAloudHint",
  },
  {
    action: "copy",
    icon: "copy-outline",
    activeIcon: "checkmark",
    labelKey: "textActionBar.copy",
    activeLabelKey: "textActionBar.copyActive",
    hintKey: "textActionBar.copyHint",
  },
  {
    action: "more",
    icon: "ellipsis-horizontal",
    activeIcon: "ellipsis-horizontal",
    labelKey: "textActionBar.more",
    activeLabelKey: "textActionBar.more",
    hintKey: "textActionBar.moreHint",
  },
];

const iconSizes: Record<TextActionBarSize, number> = {
  sm: 18,
  md: 20,
};

function ActionButton({
  active,
  definition,
  disabled,
  iconSize,
  loading,
  minTarget,
  onPress,
  testID,
}: {
  active: boolean;
  definition: ActionDefinition;
  disabled: boolean;
  iconSize: number;
  loading: boolean;
  minTarget: number;
  onPress: () => void;
  testID?: string;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const [pressed, setPressed] = useState(false);
  const { handlePressIn, handlePressOut, pressScaleStyle } = usePressScale(!disabled);

  const restingColor = settings.highContrast ? accessibleColors.text : colors.text.secondary;
  const iconColor = disabled
    ? colors.action.ghost.disabledForeground
    : active || loading
      ? settings.highContrast
        ? accessibleColors.text
        : colors.action.primary.background
      : restingColor;

  return (
    <AnimatedPressable
      accessibilityHint={t(definition.hintKey)}
      accessibilityLabel={t(active || loading ? definition.activeLabelKey : definition.labelKey)}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled, selected: active }}
      disabled={disabled}
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={onPress}
      onPressIn={() => {
        setPressed(true);
        handlePressIn();
      }}
      onPressOut={() => {
        setPressed(false);
        handlePressOut();
      }}
      style={[
        {
          alignItems: "center",
          backgroundColor:
            pressed && !disabled ? colors.action.ghost.pressed : colors.action.ghost.background,
          borderRadius: radius.full,
          justifyContent: "center",
          minHeight: minTarget,
          minWidth: minTarget,
        },
        pressScaleStyle,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <Ionicons
          accessible={false}
          color={iconColor}
          importantForAccessibility="no"
          name={active ? definition.activeIcon : definition.icon}
          size={iconSize}
        />
      )}
    </AnimatedPressable>
  );
}

/**
 * Compact capsule of icon-only actions to drop under any block of coaching
 * text (coach messages, feedback, hints, brainstorm suggestions). Purely
 * presentational: every side effect lives in the handlers, typically supplied
 * by `useTextActionBar`. An action is rendered only when its handler is given.
 */
export function TextActionBar({
  onLike,
  onDislike,
  onReadAloud,
  onCopy,
  onMore,
  activeActions,
  disabledActions,
  loadingActions,
  variant = "floating",
  size = "md",
  gradeBand: gradeBandProp,
  style,
  testID,
}: TextActionBarProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
  const accessibleColors = getAccessibleColors(settings);

  const handlers: Record<TextActionBarAction, (() => void) | undefined> = {
    like: onLike,
    dislike: onDislike,
    readAloud: onReadAloud,
    copy: onCopy,
    more: onMore,
  };
  const visibleActions = actionDefinitions.filter((definition) => handlers[definition.action]);

  if (visibleActions.length === 0) {
    return null;
  }

  const minTarget = Math.max(
    getMinimumTouchTarget(settings),
    gradeBand === "elementary" ? layout.touchTargetLarge : layout.touchTarget,
  );

  return (
    <View
      style={[
        {
          alignItems: "center",
          alignSelf: "flex-start",
          backgroundColor: settings.highContrast
            ? accessibleColors.surface
            : variant === "floating"
              ? colors.background.surface
              : colors.background.surfaceRaised,
          borderColor: settings.highContrast ? accessibleColors.border : colors.border.default,
          borderRadius: radius.full,
          borderWidth: 1,
          flexDirection: "row",
          gap: size === "sm" ? spacing.xxs : spacing.xs,
          paddingHorizontal: spacing.xs,
          paddingVertical: spacing.xxs,
        },
        variant === "floating" ? shadows.floating : shadows.none,
        style,
      ]}
      testID={testID}
    >
      {visibleActions.map((definition) => {
        const handler = handlers[definition.action];

        if (!handler) {
          return null;
        }

        return (
          <ActionButton
            active={activeActions?.includes(definition.action) ?? false}
            definition={definition}
            disabled={disabledActions?.includes(definition.action) ?? false}
            iconSize={iconSizes[size]}
            key={definition.action}
            loading={loadingActions?.includes(definition.action) ?? false}
            minTarget={minTarget}
            onPress={handler}
            testID={testID ? `${testID}-${definition.action}` : undefined}
          />
        );
      })}
    </View>
  );
}
