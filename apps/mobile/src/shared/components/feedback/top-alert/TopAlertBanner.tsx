import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, duration, layout, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  getMotionDuration,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import {
  TOP_ALERT_DEFAULT_AUTO_DISMISS_MS,
  TOP_ALERT_SWIPE_DISMISS_DISTANCE,
  TOP_ALERT_SWIPE_DISMISS_VELOCITY,
  TOP_ALERT_TEST_IDS,
} from "./topAlert.constants";
import { getTopAlertVariantStyle } from "./topAlert.styles";
import type { TopAlertDismissReason, TopAlertEntry } from "./topAlert.types";

interface TopAlertBannerProps {
  alert: TopAlertEntry;
  onDismiss: (id: string, reason: TopAlertDismissReason) => void;
}

export const TopAlertBanner = memo(function TopAlertBanner({ alert, onDismiss }: TopAlertBannerProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { settings } = useAccessibilityContext();
  const translateY = useSharedValue(-96);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.98);
  const dragY = useSharedValue(0);
  const [isPaused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedRef = useRef(false);
  const type = typography.gradeBands.middle;
  const variantStyle = useMemo(
    () => getTopAlertVariantStyle(alert.type, alert.colorScheme ?? "light"),
    [alert.colorScheme, alert.type],
  );
  const title = alert.titleKey ? t(alert.titleKey, alert.titleParams) : undefined;
  const description = alert.descriptionKey ? t(alert.descriptionKey, alert.descriptionParams) : undefined;
  const actionLabel = alert.actionLabelKey ? t(alert.actionLabelKey, alert.actionLabelParams) : undefined;
  const accessibilityLabel = alert.accessibilityLabelKey
    ? t(alert.accessibilityLabelKey, alert.accessibilityLabelParams)
    : [title, description].filter(Boolean).join(", ");
  const actionAccessibilityLabel = alert.actionAccessibilityLabelKey ? t(alert.actionAccessibilityLabelKey) : actionLabel;
  const actionAccessibilityHint = alert.actionAccessibilityHintKey ? t(alert.actionAccessibilityHintKey) : undefined;
  const closeAccessibilityLabel = t(alert.closeAccessibilityLabelKey ?? "alerts.dismiss");
  const closeAccessibilityHint = t(alert.closeAccessibilityHintKey ?? "alerts.dismissHint");
  const motionDuration = getMotionDuration(settings, duration.md);
  const minTouchTarget = getMinimumTouchTarget(settings);
  const isCompact = alert.variant === "compact";
  const maxWidth = Math.min(layout.maxReadableWidth, width - spacing.lg * 2);
  const autoDismissMs =
    alert.autoDismissMs === null
      ? null
      : alert.autoDismissMs ?? (alert.type === "loading" || alert.type === "offline" ? null : TOP_ALERT_DEFAULT_AUTO_DISMISS_MS);

  const dismiss = useCallback(
    (reason: TopAlertDismissReason) => {
      if (dismissedRef.current) {
        return;
      }

      dismissedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      translateY.value = withTiming(
        -120,
        {
          duration: motionDuration,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(onDismiss)(alert.id, reason);
          }
        },
      );
      opacity.value = withTiming(0, { duration: motionDuration });
      scale.value = withTiming(0.98, { duration: motionDuration });
    },
    [alert.id, motionDuration, onDismiss, opacity, scale, translateY],
  );

  const resumeAutoDismiss = useCallback(() => {
    setPaused(false);
  }, []);

  const pauseAutoDismiss = useCallback(() => {
    setPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    dismissedRef.current = false;
    dragY.value = 0;
    translateY.value = withSpring(0, {
      damping: 22,
      mass: 0.86,
      stiffness: 220,
    });
    opacity.value = withTiming(1, {
      duration: motionDuration,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withSpring(1, {
      damping: 22,
      mass: 0.86,
      stiffness: 220,
    });

    if (accessibilityLabel) {
      AccessibilityInfo.announceForAccessibility(accessibilityLabel);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(scale);
      cancelAnimation(dragY);
    };
  }, [accessibilityLabel, alert.id, dragY, motionDuration, opacity, scale, translateY]);

  useEffect(() => {
    if (!autoDismissMs || isPaused || dismissedRef.current) {
      return;
    }

    timerRef.current = setTimeout(() => {
      dismiss("auto");
    }, autoDismissMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoDismissMs, dismiss, isPaused]);

  const handleActionPress = useCallback(() => {
    void Promise.resolve(alert.onActionPress?.()).finally(() => {
      dismiss("action");
    });
  }, [alert, dismiss]);

  const handleTap = useCallback(() => {
    if (alert.tapToDismiss) {
      dismiss("tap");
    }
  }, [alert.tapToDismiss, dismiss]);

  const finishSwipeDismiss = useCallback(() => {
    dismiss("swipe");
  }, [dismiss]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 999])
        .failOffsetX([-24, 24])
        .onBegin(() => {
          runOnJS(pauseAutoDismiss)();
        })
        .onUpdate((event) => {
          dragY.value = Math.min(0, event.translationY);
        })
        .onEnd((event) => {
          const shouldDismiss =
            dragY.value < TOP_ALERT_SWIPE_DISMISS_DISTANCE || event.velocityY < TOP_ALERT_SWIPE_DISMISS_VELOCITY;

          if (shouldDismiss) {
            translateY.value = withTiming(-120, { duration: motionDuration }, (finished) => {
              if (finished) {
                runOnJS(finishSwipeDismiss)();
              }
            });
            opacity.value = withTiming(0, { duration: motionDuration });
            return;
          }

          dragY.value = withSpring(0, { damping: 20, stiffness: 220 });
          runOnJS(resumeAutoDismiss)();
        })
        .onFinalize(() => {
          runOnJS(resumeAutoDismiss)();
        }),
    [dragY, finishSwipeDismiss, motionDuration, opacity, pauseAutoDismiss, resumeAutoDismiss, translateY],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value + dragY.value },
      { scale: scale.value },
    ],
  }));

  const iconName = alert.iconName ?? variantStyle.icon;
  const showIcon = alert.showIcon ?? true;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        accessibilityLabel={accessibilityLabel}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        importantForAccessibility="yes"
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, spacing.md),
          },
          animatedStyle,
        ]}
        testID={TOP_ALERT_TEST_IDS.banner}
      >
        <Pressable
          accessibilityRole={alert.tapToDismiss ? "button" : undefined}
          onPress={handleTap}
          onPressIn={pauseAutoDismiss}
          onPressOut={resumeAutoDismiss}
          style={[
            styles.banner,
            isCompact ? styles.bannerCompact : styles.bannerExpanded,
            {
              backgroundColor: variantStyle.background,
              borderColor: variantStyle.border,
              flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
              maxWidth,
            },
            alert.style,
          ]}
          testID={TOP_ALERT_TEST_IDS.surface}
        >
          {showIcon ? (
            <View style={[styles.iconFrame, { backgroundColor: variantStyle.iconBackground }]}>
              {alert.type === "loading" ? (
                <ActivityIndicator color={variantStyle.foreground} size="small" />
              ) : (
                <Ionicons color={variantStyle.foreground} name={iconName} size={20} />
              )}
            </View>
          ) : null}

          <View style={styles.textGroup}>
            {title ? (
              <Text
                numberOfLines={isCompact ? 1 : 2}
                style={[
                  getAccessibleTextStyle(type.bodyStrong, settings),
                  styles.title,
                  {
                    color: variantStyle.foreground,
                    writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
                  },
                ]}
              >
                {title}
              </Text>
            ) : null}
            {description && !isCompact ? (
              <Text
                numberOfLines={3}
                style={[
                  getAccessibleTextStyle(type.bodySmall, settings),
                  styles.description,
                  {
                    color: variantStyle.mutedForeground,
                    writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
                  },
                ]}
              >
                {description}
              </Text>
            ) : null}
          </View>

          {actionLabel ? (
            <Pressable
              accessibilityHint={actionAccessibilityHint}
              accessibilityLabel={actionAccessibilityLabel}
              accessibilityRole="button"
              hitSlop={getAccessibleHitSlop(settings)}
              onPress={handleActionPress}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: pressed ? variantStyle.pressed : variantStyle.actionBackground,
                  borderColor: variantStyle.actionBorder,
                  minHeight: minTouchTarget,
                },
              ]}
              testID={TOP_ALERT_TEST_IDS.action}
            >
              <Text
                numberOfLines={2}
                style={[
                  getAccessibleTextStyle(type.button, settings),
                  styles.actionText,
                  { color: variantStyle.actionForeground },
                ]}
              >
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}

          {alert.showCloseButton === false ? null : (
            <Pressable
              accessibilityHint={closeAccessibilityHint}
              accessibilityLabel={closeAccessibilityLabel}
              accessibilityRole="button"
              hitSlop={getAccessibleHitSlop(settings)}
              onPress={() => dismiss("close")}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: pressed ? variantStyle.pressed : "transparent",
                  minHeight: minTouchTarget,
                  minWidth: minTouchTarget,
                },
              ]}
              testID={TOP_ALERT_TEST_IDS.close}
            >
              <Ionicons color={variantStyle.foreground} name="close" size={18} />
            </Pressable>
          )}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actionText: {
    flexShrink: 1,
    textAlign: "center",
  },
  banner: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    overflow: "hidden",
  },
  bannerCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerExpanded: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
  },
  description: {
    flexShrink: 1,
  },
  iconFrame: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  overlay: {
    left: spacing.sm,
    pointerEvents: "box-none",
    position: "absolute",
    right: spacing.sm,
    top: 0,
    zIndex: 10000,
  },
  textGroup: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
  },
});
