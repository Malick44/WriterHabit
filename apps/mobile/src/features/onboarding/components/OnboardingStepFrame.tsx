import type { ReactNode } from "react";
import {
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { StatusState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout/Screen";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { OnboardingStep } from "../types";

type OnboardingStepFrameProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  step: OnboardingStep;
  gradeBand?: GradeBand;
  errorMessage?: string | null;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  backgroundColor?: string;
  footerStyle?: StyleProp<ViewStyle>;
  headerAlign?: "left" | "center";
  progressActiveIndex?: number;
  progressStepsCount?: number;
  scroll?: boolean;
  showBackButton?: boolean;
  showProgressDots?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  primaryButtonStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  backIconColor?: string;
  progressActiveColor?: string;
  progressInactiveColor?: string;
};

const NAVY = colors.onboarding.navy;
const SURFACE = colors.onboarding.surface;
const PROGRESS_STEPS: OnboardingStep[] = ["role", "grade", "goals", "dailyPractice", "planSummary"];

const titleTextStyle: TextStyle = {
  color: NAVY,
  fontSize: 34,
  fontWeight: "800",
  lineHeight: 42,
};

const subtitleTextStyle: TextStyle = {
  color: colors.onboarding.subtitle,
  fontSize: 21,
  fontWeight: "400",
  lineHeight: 30,
};

const primaryButtonTextStyle: TextStyle = {
  color: colors.onboarding.surface,
  fontSize: 22,
  fontWeight: "800",
  lineHeight: 28,
};

export function OnboardingStepFrame({
  children,
  title,
  subtitle,
  step,
  gradeBand = "middle",
  errorMessage,
  primaryLabel,
  onPrimaryPress,
  primaryDisabled,
  primaryLoading,
  secondaryLabel,
  onSecondaryPress,
  backgroundColor = SURFACE,
  footerStyle,
  headerAlign = "left",
  progressActiveIndex,
  progressStepsCount = PROGRESS_STEPS.length,
  scroll = true,
  showBackButton,
  showProgressDots = false,
  contentStyle,
  primaryButtonStyle,
  titleStyle,
  subtitleStyle,
  backIconColor = colors.onboarding.ink,
  progressActiveColor = NAVY,
  progressInactiveColor = colors.onboarding.dotInactive,
}: OnboardingStepFrameProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const shouldShowBackButton = showBackButton ?? Boolean(secondaryLabel && onSecondaryPress);
  const activeIndex = progressActiveIndex ?? Math.max(PROGRESS_STEPS.indexOf(step), 0);
  const headerIsCentered = headerAlign === "center";
  const accessibleTitleStyle = getAccessibleTextStyle(
    settings.highContrast ? { ...titleTextStyle, color: accessibleColors.text } : titleTextStyle,
    settings,
  );
  const accessibleSubtitleStyle = getAccessibleTextStyle(
    settings.highContrast ? { ...subtitleTextStyle, color: accessibleColors.text } : subtitleTextStyle,
    settings,
  );
  const accessiblePrimaryButtonTextStyle = getAccessibleTextStyle(primaryButtonTextStyle, settings);

  const footer =
    primaryLabel && onPrimaryPress ? (
      <View
        style={[
          styles.footer,
          {
            backgroundColor,
            paddingBottom: Math.max(insets.bottom, 24),
          },
          footerStyle,
        ]}
      >
        <Button
          disabled={primaryDisabled}
          fullWidth
          gradeBand={gradeBand}
          label={primaryLabel}
          loading={primaryLoading}
          onPress={onPrimaryPress}
          size="lg"
          style={[styles.primaryButton, primaryButtonStyle]}
          textStyle={accessiblePrimaryButtonTextStyle}
        />
      </View>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Screen
        backgroundColor={backgroundColor}
        contentStyle={[styles.content, contentStyle]}
        footer={footer}
        gradeBand={gradeBand}
        scroll={scroll}
      >
        <View style={styles.topBar}>
          {shouldShowBackButton && onSecondaryPress ? (
            <Pressable
              accessibilityHint={secondaryLabel}
              accessibilityLabel={secondaryLabel ?? t("common.back")}
              accessibilityRole="button"
              hitSlop={12}
              onPress={onSecondaryPress}
              style={styles.backButton}
            >
              <Ionicons
                name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
                size={32}
                color={backIconColor}
              />
            </Pressable>
          ) : null}

          {showProgressDots ? (
            <View
              accessibilityLabel={t("onboarding.progressLabel")}
              accessibilityRole="progressbar"
              accessibilityValue={{ max: progressStepsCount, min: 0, now: activeIndex + 1 }}
              style={styles.progressDots}
            >
              {Array.from({ length: progressStepsCount }).map((_, index) => {
                const isActive = index === activeIndex;

                return (
                  <View
                    key={`${step}-progress-${index}`}
                    style={[
                      styles.progressDot,
                      { backgroundColor: progressInactiveColor },
                      isActive ? [styles.progressDotActive, { backgroundColor: progressActiveColor }] : null,
                    ]}
                  />
                );
              })}
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.header,
            headerIsCentered ? styles.headerCentered : null,
          ]}
        >
          <Text
            accessibilityRole="header"
            selectable
            style={[
              accessibleTitleStyle,
              headerIsCentered ? styles.titleCentered : null,
              titleStyle,
            ]}
          >
            {title}
          </Text>
          <Text
            selectable
            style={[
              accessibleSubtitleStyle,
              headerIsCentered ? styles.subtitleCentered : null,
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Text>
        </View>

        {errorMessage ? (
          <StatusState
            description={errorMessage}
            gradeBand={gradeBand}
            title={t("onboarding.errors.title")}
            tone="error"
          />
        ) : null}

        <View style={styles.children}>{children}</View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    top: 0,
    width: 44,
  },
  children: {
    minHeight: 120,
  },
  content: {
    gap: 0,
    paddingBottom: 104,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    gap: 12,
    marginBottom: 32,
    marginTop: 28,
  },
  headerCentered: {
    alignItems: "center",
    marginBottom: 42,
    marginTop: 38,
  },
  primaryButton: {
    backgroundColor: NAVY,
    borderColor: NAVY,
    borderRadius: 16,
    minHeight: 64,
    shadowColor: colors.onboarding.buttonShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  progressDot: {
    backgroundColor: colors.onboarding.dotInactive,
    borderRadius: 7,
    height: 14,
    width: 14,
  },
  progressDotActive: {
    backgroundColor: NAVY,
    width: 44,
  },
  progressDots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  subtitleCentered: {
    maxWidth: 620,
    textAlign: "center",
  },
  titleCentered: {
    maxWidth: 540,
    textAlign: "center",
  },
  topBar: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    marginTop: 4,
    position: "relative",
  },
});
