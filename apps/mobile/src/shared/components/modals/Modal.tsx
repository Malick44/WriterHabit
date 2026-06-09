import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  I18nManager,
  KeyboardAvoidingView,
  Modal as NativeModal,
  Pressable,
  ScrollView,
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
import { Button } from "@/shared/components/buttons";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  getMotionDuration,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { ModalAction, ModalCloseReason, ModalMode, ModalProps } from "./types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 950;
const MAX_DRAG_DISTANCE = 320;

function clampOpacity(value: number): number {
  return Math.min(0.92, Math.max(0, value));
}

function resolveMode({
  bottomSheet,
  fullScreen,
  mode,
}: {
  bottomSheet?: boolean;
  fullScreen?: boolean;
  mode?: ModalMode;
}): ModalMode {
  if (fullScreen) {
    return "fullScreen";
  }

  if (bottomSheet) {
    return "bottomSheet";
  }

  return mode ?? "dialog";
}

function resolveChildren(children: ModalProps["children"], renderContent?: ModalProps["renderContent"]) {
  if (renderContent) {
    return renderContent();
  }

  if (typeof children === "function") {
    return children();
  }

  return children;
}

function ModalActionFooter({
  actions,
  gradeBand,
  onActionPress,
}: {
  actions: readonly ModalAction[];
  gradeBand: ModalProps["gradeBand"];
  onActionPress: (action: ModalAction) => void;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.actionFooter}>
      {actions.map((action) => {
        const label = t(action.labelKey, action.labelParams);
        const accessibilityLabel = action.accessibilityLabelKey ? t(action.accessibilityLabelKey) : label;
        const accessibilityHint = action.accessibilityHintKey ? t(action.accessibilityHintKey) : undefined;
        const icon = action.iconName ? (
          <Ionicons color={colors.action[action.variant ?? "secondary"].foreground} name={action.iconName} size={18} />
        ) : null;

        return (
          <Button
            accessibilityHint={accessibilityHint}
            accessibilityLabel={accessibilityLabel}
            disabled={action.disabled}
            fullWidth={actions.length === 1}
            gradeBand={gradeBand}
            key={action.id}
            label={label}
            leftAccessory={icon}
            loading={action.loading}
            onPress={() => onActionPress(action)}
            size={gradeBand === "elementary" ? "lg" : "md"}
            style={actions.length === 1 ? styles.actionButtonSingle : styles.actionButton}
            testID={`modal-action-${action.id}`}
            variant={action.variant ?? "secondary"}
          />
        );
      })}
    </View>
  );
}

const MemoizedModalActionFooter = memo(ModalActionFooter);

export const Modal = memo(function Modal({
  visible,
  titleKey,
  titleParams,
  subtitleKey,
  subtitleParams,
  accessibilityLabelKey,
  accessibilityLabelParams,
  closeAccessibilityLabelKey = "modal.close",
  closeAccessibilityHintKey = "modal.closeHint",
  mode,
  colorScheme = "light",
  fullScreen,
  bottomSheet,
  backdropOpacity = 0.48,
  dismissible = true,
  closeOnBackdropPress = true,
  enableSwipeToDismiss = true,
  showCloseButton = true,
  avoidKeyboard = true,
  gradeBand = "middle",
  headerActions,
  footer,
  actions,
  children,
  renderContent,
  contentContainerStyle,
  panelStyle,
  testID,
  onClose,
  onAfterClose,
  onDismissBlocked,
}: ModalProps) {
  const [mounted, setMounted] = useState(visible);
  const titleRef = useRef<Text>(null);
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const modalColors = useMemo(
    () =>
      colorScheme === "dark" && !settings.highContrast
        ? {
            border: colors.border.strong,
            mutedText: colors.border.strong,
            pressed: "rgba(255, 255, 255, 0.12)",
            surface: colors.background.inverse,
            text: colors.text.inverse,
          }
        : {
            border: accessibleColors.border,
            mutedText: accessibleColors.mutedText,
            pressed: colors.action.ghost.pressed,
            surface: accessibleColors.surface,
            text: accessibleColors.text,
          },
    [
      accessibleColors.border,
      accessibleColors.mutedText,
      accessibleColors.surface,
      accessibleColors.text,
      colorScheme,
      settings.highContrast,
    ],
  );
  const progress = useSharedValue(visible ? 1 : 0);
  const dragY = useSharedValue(0);
  const resolvedMode = resolveMode({ bottomSheet, fullScreen, mode });
  const type = typography.gradeBands[gradeBand];
  const motionDuration = getMotionDuration(settings, duration.md);
  const isFullScreen = resolvedMode === "fullScreen";
  const isBottomSheet = resolvedMode === "bottomSheet";
  const resolvedBackdropOpacity = clampOpacity(backdropOpacity);
  const isWide = width >= 720;
  const horizontalInset = isFullScreen ? 0 : Math.max(spacing.lg, Math.min(spacing.xxl, width * 0.05));
  const panelMaxHeight = isFullScreen
    ? height
    : Math.max(240, height - insets.top - insets.bottom - spacing.xxl);
  const panelWidth = isFullScreen || isBottomSheet
    ? width
    : Math.min(layout.maxReadableWidth, width - horizontalInset * 2);
  const minTouchTarget = getMinimumTouchTarget(settings);
  const title = titleKey ? t(titleKey, titleParams) : undefined;
  const subtitle = subtitleKey ? t(subtitleKey, subtitleParams) : undefined;
  const accessibilityLabel = accessibilityLabelKey
    ? t(accessibilityLabelKey, accessibilityLabelParams)
    : title;
  const closeAccessibilityLabel = t(closeAccessibilityLabelKey);
  const closeAccessibilityHint = t(closeAccessibilityHintKey);
  const isIos = process.env.EXPO_OS === "ios";
  const hasHeader = Boolean(title || subtitle || showCloseButton || headerActions);
  const renderedChildren = mounted ? resolveChildren(children, renderContent) : null;

  const completeClose = useCallback(() => {
    dragY.value = 0;
    setMounted(false);
    onAfterClose?.();
  }, [dragY, onAfterClose]);

  const animateOpen = useCallback(() => {
    dragY.value = 0;
    progress.value = withTiming(1, {
      duration: motionDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [dragY, motionDuration, progress]);

  const animateClosed = useCallback(() => {
    progress.value = withTiming(
      0,
      {
        duration: motionDuration,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(completeClose)();
        }
      },
    );
  }, [completeClose, motionDuration, progress]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }

    if (mounted) {
      animateClosed();
    }
  }, [animateClosed, mounted, visible]);

  useEffect(() => {
    if (!mounted || !visible) {
      return;
    }

    animateOpen();
  }, [animateOpen, mounted, visible]);

  useEffect(() => {
    if (!mounted || !visible || !title) {
      return;
    }

    const focusTimeout = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(title);
      const reactTag = findNodeHandle(titleRef.current);
      if (reactTag) {
        AccessibilityInfo.setAccessibilityFocus(reactTag);
      }
    }, getMotionDuration(settings, duration.sm));

    return () => {
      clearTimeout(focusTimeout);
    };
  }, [mounted, settings, title, visible]);

  useEffect(() => {
    return () => {
      cancelAnimation(progress);
      cancelAnimation(dragY);
    };
  }, [dragY, progress]);

  const requestClose = useCallback(
    (reason: ModalCloseReason) => {
      const accidentalDismissReason = reason === "backdrop" || reason === "hardwareBack" || reason === "swipe";

      if (accidentalDismissReason && !dismissible) {
        onDismissBlocked?.(reason);
        return;
      }

      if (reason === "backdrop" && !closeOnBackdropPress) {
        onDismissBlocked?.(reason);
        return;
      }

      onClose(reason);
    },
    [closeOnBackdropPress, dismissible, onClose, onDismissBlocked],
  );

  const handleBackdropPress = useCallback(() => {
    requestClose("backdrop");
  }, [requestClose]);

  const handleHardwareBack = useCallback(() => {
    requestClose("hardwareBack");
  }, [requestClose]);

  const handleCloseButtonPress = useCallback(() => {
    requestClose("closeButton");
  }, [requestClose]);

  const handleAccessibilityEscape = useCallback(() => {
    requestClose("hardwareBack");
  }, [requestClose]);

  const handleActionPress = useCallback(
    (action: ModalAction) => {
      void Promise.resolve(action.onPress?.()).then((result) => {
        if (result === false || action.closeOnPress === false) {
          return;
        }

        requestClose("action");
      });
    },
    [requestClose],
  );

  const closeFromGesture = useCallback(() => {
    requestClose("swipe");
  }, [requestClose]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(enableSwipeToDismiss && dismissible && resolvedMode !== "fullScreen")
      .activeOffsetY(10)
      .failOffsetX([-24, 24])
      .onUpdate((event) => {
        dragY.value = Math.max(0, event.translationY);
      })
      .onEnd((event) => {
        const shouldDismiss = dragY.value > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY;

        if (shouldDismiss) {
          dragY.value = withTiming(MAX_DRAG_DISTANCE, {
            duration: motionDuration,
            easing: Easing.out(Easing.cubic),
          });
          progress.value = withTiming(
            0,
            {
              duration: motionDuration,
              easing: Easing.out(Easing.cubic),
            },
            (finished) => {
              if (finished) {
                runOnJS(closeFromGesture)();
              }
            },
          );
          return;
        }

        dragY.value = withSpring(0, {
          damping: 24,
          mass: 0.9,
          stiffness: 220,
        });
      });
  }, [closeFromGesture, dismissible, dragY, enableSwipeToDismiss, motionDuration, progress, resolvedMode]);

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const dragFade = interpolate(dragY.value, [0, MAX_DRAG_DISTANCE], [1, 0.22], "clamp");

    return {
      opacity: progress.value * resolvedBackdropOpacity * dragFade,
    };
  });

  const panelAnimatedStyle = useAnimatedStyle(() => {
    const offset = isBottomSheet ? 36 : 12;

    return {
      opacity: progress.value,
      transform: [
        {
          translateY: dragY.value + (1 - progress.value) * offset,
        },
        {
          scale: isBottomSheet || isFullScreen ? 1 : interpolate(progress.value, [0, 1], [0.98, 1], "clamp"),
        },
      ],
    };
  });

  const alignmentStyle = useMemo(
    () => [
      styles.alignment,
      isFullScreen ? styles.alignFullScreen : isBottomSheet ? styles.alignBottomSheet : styles.alignDialog,
      {
        paddingBottom: isFullScreen ? 0 : insets.bottom,
        paddingHorizontal: isFullScreen || isBottomSheet ? 0 : horizontalInset,
        paddingTop: isFullScreen ? 0 : Math.max(insets.top, spacing.lg),
      },
    ],
    [horizontalInset, insets.bottom, insets.top, isBottomSheet, isFullScreen],
  );

  const panelBaseStyle = useMemo(
    () => [
      styles.panel,
      isFullScreen ? styles.panelFullScreen : isBottomSheet ? styles.panelBottomSheet : styles.panelDialog,
      {
        backgroundColor: modalColors.surface,
        borderColor: modalColors.border,
        maxHeight: panelMaxHeight,
        minHeight: isFullScreen ? height : undefined,
        width: panelWidth,
      },
      isWide && !isFullScreen && !isBottomSheet ? styles.panelWide : null,
      panelStyle,
    ],
    [
      height,
      isBottomSheet,
      isFullScreen,
      isWide,
      modalColors.border,
      modalColors.surface,
      panelMaxHeight,
      panelStyle,
      panelWidth,
    ],
  );

  if (!mounted) {
    return null;
  }

  return (
    <NativeModal
      animationType="none"
      onRequestClose={handleHardwareBack}
      statusBarTranslucent
      supportedOrientations={["portrait", "landscape"]}
      transparent
      visible={mounted}
    >
      <View
        accessibilityElementsHidden={false}
        importantForAccessibility="yes"
        onAccessibilityEscape={handleAccessibilityEscape}
        style={styles.root}
        testID={testID}
      >
        <AnimatedPressable
          accessible={false}
          disabled={!closeOnBackdropPress && !dismissible}
          onPress={handleBackdropPress}
          style={StyleSheet.absoluteFill}
          testID={testID ? `${testID}-backdrop` : undefined}
        >
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
        </AnimatedPressable>

        <KeyboardAvoidingView
          behavior={avoidKeyboard && isIos ? "padding" : undefined}
          pointerEvents="box-none"
          style={styles.keyboardAvoider}
        >
          <View pointerEvents="box-none" style={alignmentStyle}>
            <GestureDetector gesture={panGesture}>
              <Animated.View
                accessibilityLabel={accessibilityLabel}
                accessibilityViewIsModal
                importantForAccessibility="yes"
                style={[panelBaseStyle, panelAnimatedStyle]}
              >
                {isBottomSheet ? <View style={styles.sheetGrabber} /> : null}

                {hasHeader ? (
                  <View
                    style={[
                      styles.header,
                      {
                        flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
                        paddingTop: isFullScreen ? Math.max(insets.top, spacing.lg) : spacing.lg,
                      },
                    ]}
                  >
                    <View style={styles.headerTextGroup}>
                      {title ? (
                        <Text
                          accessibilityRole="header"
                          ref={titleRef}
                          selectable
                          style={[
                            getAccessibleTextStyle(type.title, settings),
                          styles.title,
                          {
                              color: modalColors.text,
                              writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
                            },
                          ]}
                        >
                          {title}
                        </Text>
                      ) : null}
                      {subtitle ? (
                        <Text
                          selectable
                          style={[
                            getAccessibleTextStyle(type.bodySmall, settings),
                            styles.subtitle,
                            {
                              color: modalColors.mutedText,
                              writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
                            },
                          ]}
                        >
                          {subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {headerActions ? <View style={styles.headerActions}>{headerActions}</View> : null}
                    {showCloseButton ? (
                      <Pressable
                        accessibilityHint={closeAccessibilityHint}
                        accessibilityLabel={closeAccessibilityLabel}
                        accessibilityRole="button"
                        focusable
                        hitSlop={getAccessibleHitSlop(settings)}
                        onPress={handleCloseButtonPress}
                        style={({ pressed }) => [
                          styles.closeButton,
                          {
                            backgroundColor: pressed ? modalColors.pressed : colors.action.ghost.background,
                            minHeight: minTouchTarget,
                            minWidth: minTouchTarget,
                          },
                        ]}
                        testID={testID ? `${testID}-close` : undefined}
                      >
                        <Ionicons color={modalColors.text} name="close" size={22} />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                <ScrollView
                  automaticallyAdjustKeyboardInsets
                  contentContainerStyle={[styles.content, contentContainerStyle]}
                  contentInsetAdjustmentBehavior="automatic"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {renderedChildren}
                </ScrollView>

                {footer || actions?.length ? (
                  <View
                    style={[
                      styles.footer,
                      {
                        borderTopColor: modalColors.border,
                        paddingBottom: isFullScreen || isBottomSheet ? Math.max(insets.bottom, spacing.lg) : spacing.lg,
                      },
                    ]}
                  >
                    {footer}
                    {actions?.length ? (
                      <MemoizedModalActionFooter
                        actions={actions}
                        gradeBand={gradeBand}
                        onActionPress={handleActionPress}
                      />
                    ) : null}
                  </View>
                ) : null}
              </Animated.View>
            </GestureDetector>
          </View>
        </KeyboardAvoidingView>
      </View>
    </NativeModal>
  );
});

const styles = StyleSheet.create({
  actionButton: {
    flexBasis: 156,
    flexGrow: 1,
  },
  actionFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButtonSingle: {
    alignSelf: "stretch",
  },
  alignBottomSheet: {
    justifyContent: "flex-end",
  },
  alignDialog: {
    justifyContent: "center",
  },
  alignFullScreen: {
    justifyContent: "flex-start",
  },
  alignment: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  footer: {
    borderTopWidth: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerActions: {
    flexShrink: 0,
  },
  headerTextGroup: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  keyboardAvoider: {
    flex: 1,
  },
  panel: {
    borderColor: colors.border.default,
    borderWidth: 1,
    overflow: "hidden",
  },
  panelBottomSheet: {
    borderBottomWidth: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  panelDialog: {
    borderRadius: radius.xl,
  },
  panelFullScreen: {
    borderRadius: 0,
    borderWidth: 0,
  },
  panelWide: {
    alignSelf: "center",
  },
  root: {
    flex: 1,
  },
  sheetGrabber: {
    alignSelf: "center",
    backgroundColor: colors.border.strong,
    borderRadius: radius.full,
    height: 4,
    marginTop: spacing.sm,
    width: 44,
  },
  subtitle: {
    flexShrink: 1,
  },
  title: {
    flexShrink: 1,
  },
});
