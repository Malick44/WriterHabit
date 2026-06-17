import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export type TopAlertBannerPalette = {
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
  shadow?: string;
  iconBackground?: string;
  progressTrack?: string;
  progressFill?: string;
  actionBackground?: string;
  actionText?: string;
  dismissText?: string;
};

export type TopAlertBannerTypography = {
  title?: StyleProp<TextStyle>;
  message?: StyleProp<TextStyle>;
  meta?: StyleProp<TextStyle>;
  action?: StyleProp<TextStyle>;
  dismiss?: StyleProp<TextStyle>;
};

export type TopAlertBannerMetrics = {
  topOffset?: number;
  horizontalInset?: number;
  borderRadius?: number;
  contentPaddingHorizontal?: number;
  contentPaddingVertical?: number;
  gap?: number;
  iconSize?: number;
  actionRadius?: number;
  progressHeight?: number;
  slideDistance?: number;
  zIndex?: number;
};

export type TopAlertBannerAction = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export type TopAlertBannerProps = {
  visible: boolean;
  palette: TopAlertBannerPalette;
  title: string;
  message?: string;
  meta?: string;
  icon?: React.ReactNode;
  progress?: number | null;
  primaryAction?: TopAlertBannerAction;
  secondaryAction?: TopAlertBannerAction;
  onDismiss?: () => void;
  onHidden?: () => void;
  autoDismissMs?: number;
  dismissContent?: React.ReactNode;
  dismissAccessibilityLabel?: string;
  dismissTestID?: string;
  typography?: TopAlertBannerTypography;
  metrics?: TopAlertBannerMetrics;
  containerStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

const DEFAULT_METRICS: Required<TopAlertBannerMetrics> = {
  topOffset: 0,
  horizontalInset: 16,
  borderRadius: 22,
  contentPaddingHorizontal: 14,
  contentPaddingVertical: 12,
  gap: 10,
  iconSize: 34,
  actionRadius: 999,
  progressHeight: 3,
  slideDistance: 120,
  zIndex: 10000,
};

const normalizeProgress = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
};

export function TopAlertBanner({
  visible,
  palette,
  title,
  message,
  meta,
  icon,
  progress,
  primaryAction,
  secondaryAction,
  onDismiss,
  onHidden,
  autoDismissMs,
  dismissContent,
  dismissAccessibilityLabel,
  dismissTestID,
  typography,
  metrics,
  containerStyle,
  cardStyle,
  testID,
}: TopAlertBannerProps) {
  const resolvedMetrics = useMemo(
    () => ({ ...DEFAULT_METRICS, ...(metrics ?? {}) }),
    [metrics],
  );
  const [shouldRender, setShouldRender] = useState(visible);
  const renderedRef = useRef(visible);

  // Adjust during render (instead of in an effect) so the banner mounts immediately when it becomes visible.
  if (visible && !shouldRender) {
    setShouldRender(true);
  }
  const [translateY] = useState(() => new Animated.Value(visible ? 0 : -1));
  const [opacity] = useState(() => new Animated.Value(visible ? 1 : 0));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);

  const clearAutoDismissTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    renderedRef.current = shouldRender;
  }, [shouldRender]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (visible) {
      renderedRef.current = true;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        translateY.stopAnimation();
        opacity.stopAnimation();
        animation = Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 76,
            friction: 12,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]);
        animation.start();
      });

      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
        animation?.stop();
      };
    }

    clearAutoDismissTimer();

    if (!renderedRef.current) {
      return undefined;
    }

    translateY.stopAnimation();
    opacity.stopAnimation();
    animation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: -1,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (!finished) {
        return;
      }
      renderedRef.current = false;
      setShouldRender(false);
      onHidden?.();
    });

    return () => {
      animation?.stop();
    };
  }, [clearAutoDismissTimer, onHidden, opacity, translateY, visible]);

  useEffect(() => {
    clearAutoDismissTimer();

    if (!visible || !autoDismissMs || !onDismiss) {
      return undefined;
    }

    timerRef.current = setTimeout(onDismiss, autoDismissMs);

    return clearAutoDismissTimer;
  }, [autoDismissMs, clearAutoDismissTimer, onDismiss, visible]);

  useEffect(() => {
    return () => {
      clearAutoDismissTimer();
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, [clearAutoDismissTimer, opacity, translateY]);

  const progressValue = normalizeProgress(progress);
  const animatedTranslateY = translateY.interpolate({
    inputRange: [-1, 0],
    outputRange: [-resolvedMetrics.slideDistance, 0],
  });

  const renderAction = (action: TopAlertBannerAction | undefined, kind: "primary" | "secondary") => {
    if (!action) {
      return null;
    }

    const isPrimary = kind === "primary";
    return (
      <Pressable
        accessibilityLabel={action.accessibilityLabel ?? action.label}
        accessibilityRole="button"
        disabled={action.disabled}
        onPress={action.onPress}
        style={({ pressed }) => [
          styles.actionButton,
          {
            borderColor: palette.border,
            borderRadius: resolvedMetrics.actionRadius,
            backgroundColor: isPrimary
              ? (palette.actionBackground ?? palette.accent)
              : palette.surface,
            opacity: action.disabled ? 0.55 : pressed ? 0.78 : 1,
          },
          action.style,
        ]}
        testID={action.testID}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.actionText,
            { color: isPrimary ? (palette.actionText ?? palette.surface) : palette.text },
            typography?.action,
            action.textStyle,
          ]}
        >
          {action.label}
        </Text>
      </Pressable>
    );
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: resolvedMetrics.topOffset,
          left: resolvedMetrics.horizontalInset,
          right: resolvedMetrics.horizontalInset,
          zIndex: resolvedMetrics.zIndex,
          opacity,
          transform: [{ translateY: animatedTranslateY }],
        },
        containerStyle,
      ]}
      testID={testID}
    >
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            borderRadius: resolvedMetrics.borderRadius,
            paddingHorizontal: resolvedMetrics.contentPaddingHorizontal,
            paddingVertical: resolvedMetrics.contentPaddingVertical,
            shadowColor: palette.shadow ?? palette.border,
          },
          cardStyle,
        ]}
      >
        <View style={[styles.row, { gap: resolvedMetrics.gap }]}>
          {icon ? (
            <View
              style={[
                styles.iconShell,
                {
                  width: resolvedMetrics.iconSize,
                  height: resolvedMetrics.iconSize,
                  borderRadius: resolvedMetrics.iconSize / 2,
                  backgroundColor: palette.iconBackground ?? palette.surface,
                },
              ]}
            >
              {icon}
            </View>
          ) : null}

          <View style={styles.textColumn}>
            {meta ? (
              <Text
                numberOfLines={1}
                style={[styles.meta, { color: palette.accent }, typography?.meta]}
              >
                {meta}
              </Text>
            ) : null}
            <Text
              numberOfLines={1}
              style={[styles.title, { color: palette.text }, typography?.title]}
            >
              {title}
            </Text>
            {message ? (
              <Text
                numberOfLines={2}
                style={[styles.message, { color: palette.textMuted }, typography?.message]}
              >
                {message}
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            {renderAction(secondaryAction, "secondary")}
            {renderAction(primaryAction, "primary")}
            {onDismiss ? (
              <Pressable
                accessibilityLabel={dismissAccessibilityLabel}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onDismiss}
                style={({ pressed }) => [
                  styles.dismissButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                testID={dismissTestID}
              >
                {dismissContent ?? (
                  <View style={styles.dismissGlyph}>
                    <View
                      style={[
                        styles.dismissLine,
                        {
                          backgroundColor: palette.dismissText ?? palette.textMuted,
                          transform: [{ rotate: "45deg" }],
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.dismissLine,
                        {
                          backgroundColor: palette.dismissText ?? palette.textMuted,
                          transform: [{ rotate: "-45deg" }],
                        },
                      ]}
                    />
                  </View>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>

        {progressValue !== null ? (
          <View
            style={[
              styles.progressTrack,
              {
                height: resolvedMetrics.progressHeight,
                borderRadius: resolvedMetrics.progressHeight / 2,
                backgroundColor: palette.progressTrack ?? palette.border,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressValue * 100}%`,
                  borderRadius: resolvedMetrics.progressHeight / 2,
                  backgroundColor: palette.progressFill ?? palette.accent,
                },
              ]}
            />
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 12,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
  },
  iconShell: {
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "center",
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  title: {
    includeFontPadding: false,
  },
  message: {
    includeFontPadding: false,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 6,
  },
  actionButton: {
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    maxWidth: 128,
    minHeight: 34,
    paddingHorizontal: 12,
  },
  actionText: {
    includeFontPadding: false,
  },
  dismissButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    minWidth: 32,
  },
  dismissGlyph: {
    alignItems: "center",
    height: 16,
    justifyContent: "center",
    width: 16,
  },
  dismissLine: {
    height: 2,
    position: "absolute",
    width: 14,
  },
  progressTrack: {
    marginTop: 10,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: "100%",
  },
});

export default TopAlertBanner;
