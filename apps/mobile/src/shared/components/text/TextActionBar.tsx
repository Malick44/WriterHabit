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
  sm: 15,
  md: 17,
};

/**
 * Visible button box — deliberately about half the accessible touch target
 * so the bar stays a slim footer. The full 44–52px target is preserved by
 * extending hitSlop around the visual circle.
 */
const visualSizes: Record<TextActionBarSize, number> = {
  sm: 26,
  md: 30,
};

/**
 * Soft per-action tints (token roles) so each button reads as a friendly
 * colored chip for young students instead of a bare gray glyph.
 */
const actionTints: Record<
  TextActionBarAction,
  { background: string; icon: string; pressed: string }
> = {
  like: {
    background: colors.feedback.success.background,
    icon: colors.feedback.success.icon,
    pressed: colors.feedback.success.pressed,
  },
  dislike: {
    background: colors.feedback.neutral.background,
    icon: colors.feedback.neutral.icon,
    pressed: colors.feedback.neutral.pressed,
  },
  readAloud: {
    background: colors.feedback.info.background,
    icon: colors.feedback.info.icon,
    pressed: colors.feedback.info.pressed,
  },
  copy: {
    background: colors.feedback.warning.background,
    icon: colors.feedback.warning.icon,
    pressed: colors.feedback.warning.pressed,
  },
  more: {
    background: colors.feedback.neutral.background,
    icon: colors.feedback.neutral.icon,
    pressed: colors.feedback.neutral.pressed,
  },
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
  visualSize,
}: {
  active: boolean;
  definition: ActionDefinition;
  disabled: boolean;
  iconSize: number;
  loading: boolean;
  minTarget: number;
  onPress: () => void;
  testID?: string;
  visualSize: number;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const [pressed, setPressed] = useState(false);
  const { handlePressIn, handlePressOut, pressScaleStyle } = usePressScale(!disabled);
  const tint = actionTints[definition.action];

  // Grow the touch area vertically to the full accessible target; keep the
  // horizontal slop at the shared accessible default so neighbouring buttons
  // don't fight over the same touch point.
  const baseSlop = getAccessibleHitSlop(settings);
  const verticalSlop = Math.max(baseSlop.top ?? 0, Math.ceil((minTarget - visualSize) / 2));
  const hitSlop = {
    bottom: verticalSlop,
    left: baseSlop.left ?? 0,
    right: baseSlop.right ?? 0,
    top: verticalSlop,
  };

  const highContrast = settings.highContrast;
  const backgroundColor = disabled
    ? colors.action.secondary.disabledBackground
    : active || loading
      ? highContrast
        ? accessibleColors.text
        : colors.action.primary.background
      : highContrast
        ? accessibleColors.surface
        : pressed
          ? tint.pressed
          : tint.background;
  const iconColor = disabled
    ? colors.action.secondary.disabledForeground
    : active || loading
      ? highContrast
        ? accessibleColors.surface
        : colors.action.primary.foreground
      : highContrast
        ? accessibleColors.text
        : tint.icon;

  return (
    <AnimatedPressable
      accessibilityHint={t(definition.hintKey)}
      accessibilityLabel={t(active || loading ? definition.activeLabelKey : definition.labelKey)}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled, selected: active }}
      disabled={disabled}
      hitSlop={hitSlop}
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
          backgroundColor,
          borderRadius: radius.full,
          height: visualSize,
          justifyContent: "center",
          width: visualSize,
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
          gap: size === "sm" ? spacing.xs : spacing.sm,
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
            visualSize={visualSizes[size]}
          />
        );
      })}
    </View>
  );
}
