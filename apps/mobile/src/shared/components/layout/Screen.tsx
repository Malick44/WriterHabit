import { type PropsWithChildren, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { layout, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";
import {
  BOTTOM_MENU_SCROLL_EVENT_THROTTLE,
  useBottomMenuScrollHandler,
} from "@/shared/components/navigation/bottom-menu";

interface ScreenProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  gradeBand?: GradeBand;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  contentPaddingTop?: number;
  backgroundColor?: string;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  testID?: string;
}

export function Screen({
  title,
  subtitle,
  footer,
  gradeBand: gradeBandProp,
  scroll = true,
  keyboardAvoiding = false,
  contentStyle,
  contentPaddingTop,
  backgroundColor,
  onScroll,
  scrollEventThrottle,
  testID,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const gradeBand = useGradeBand(gradeBandProp);
  const { settings } = useAccessibilityContext();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const handleBottomMenuScroll = useBottomMenuScrollHandler();
  const horizontalPadding = isTablet
    ? layout.screenPadding.tablet
    : settings.simplifiedUi
      ? layout.screenPadding.phone + spacing.sm
      : layout.screenPadding.phone;
  const resolvedBackgroundColor = backgroundColor ?? accessibleColors.background;
  const resolvedContentPaddingTop = contentPaddingTop ?? Math.max(insets.top, spacing.lg);
  const content = (
    <View
      style={[
        {
          alignSelf: "center",
          gap: spacing.lg,
          maxWidth: layout.maxContentWidth,
          width: "100%",
        },
        contentStyle,
      ]}
    >
      {title || subtitle ? (
        <View style={{ gap: spacing.xs }}>
          {title ? (
            <Text
              accessibilityRole="header"
              selectable
              style={[getAccessibleTextStyle(type.heading, settings), { color: accessibleColors.text }]}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              selectable
              style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={{ gap: spacing.md }}>{children}</View>
    </View>
  );

  if (!scroll) {
    return (
      <View
        testID={testID}
        style={{
          backgroundColor: resolvedBackgroundColor,
          flex: 1,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
          paddingHorizontal: horizontalPadding,
          paddingTop: resolvedContentPaddingTop,
        }}
      >
        {content}
        {footer}
      </View>
    );
  }

  const scrollContent = (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps={keyboardAvoiding ? "handled" : undefined}
      onScroll={(event) => {
        handleBottomMenuScroll(event);
        onScroll?.(event);
      }}
      scrollEventThrottle={scrollEventThrottle ?? BOTTOM_MENU_SCROLL_EVENT_THROTTLE}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom, spacing.xl),
        paddingHorizontal: horizontalPadding,
        paddingTop: resolvedContentPaddingTop,
      }}
    >
      {content}
    </ScrollView>
  );

  return (
    <View testID={testID} style={{ backgroundColor: resolvedBackgroundColor, flex: 1 }}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {scrollContent}
        </KeyboardAvoidingView>
      ) : (
        scrollContent
      )}
      {footer}
    </View>
  );
}
