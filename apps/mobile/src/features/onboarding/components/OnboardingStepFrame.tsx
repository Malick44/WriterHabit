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

import { colors, palette, type GradeBand } from "@/design/tokens";
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
const PROGRESS_STEPS: OnboardingStep[] = ["role", "grade", "goals", "confidence", "dailyPractice", "planSummary"];

const titleTextStyle: TextStyle = {
  color: NAVY,
  fontSize: 30,
  fontWeight: "800",
  lineHeight: 38,
};

const subtitleTextStyle: TextStyle = {
  color: colors.onboarding.subtitle,
  fontSize: 18,
  fontWeight: "400",
  lineHeight: 24,
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
  const mergedTitleStyle: TextStyle = { ...titleTextStyle, ...StyleSheet.flatten(titleStyle) };
  const mergedSubtitleStyle: TextStyle = { ...subtitleTextStyle, ...StyleSheet.flatten(subtitleStyle) };
  const accessibleTitleStyle = getAccessibleTextStyle(
    settings.highContrast ? { ...mergedTitleStyle, color: accessibleColors.text } : mergedTitleStyle,
    settings,
  );
  const accessibleSubtitleStyle = getAccessibleTextStyle(
    settings.highContrast ? { ...mergedSubtitleStyle, color: accessibleColors.text } : mergedSubtitleStyle,
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
        contentPaddingTop={0}
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
                name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"}
                size={24}
                color={backIconColor}
              />
            </Pressable>
          ) : null}

          {showProgressDots ? (
            <Text selectable={false} style={styles.stepLabel}>
              {t("onboarding.stepLabel", { current: activeIndex + 1, total: progressStepsCount })}
            </Text>
          ) : null}
        </View>

        {showProgressDots ? (
          <View
            accessibilityLabel={t("onboarding.progressLabel")}
            accessibilityRole="progressbar"
            accessibilityValue={{ max: progressStepsCount, min: 0, now: activeIndex + 1 }}
            style={styles.progressSegments}
          >
            {Array.from({ length: progressStepsCount }).map((_, index) => {
              const isFilled = index <= activeIndex;

              return (
                <View
                  key={`${step}-progress-${index}`}
                  style={[
                    styles.progressSegment,
                    { backgroundColor: isFilled ? progressActiveColor : progressInactiveColor },
                  ]}
                />
              );
            })}
          </View>
        ) : null}

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
            ]}
          >
            {title}
          </Text>
          <Text
            selectable
            style={[
              accessibleSubtitleStyle,
              headerIsCentered ? styles.subtitleCentered : null,
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
    backgroundColor: colors.onboarding.surface,
    borderColor: palette.slate[200],
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    shadowColor: colors.onboarding.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    top: 0,
    width: 44,
  },
  children: {
    minHeight: 120,
  },
  content: {
    gap: 0,
    paddingBottom: 88,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    gap: 6,
    marginBottom: 12,
    marginTop: 0,
  },
  headerCentered: {
    alignItems: "center",
    marginBottom: 14,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: NAVY,
    borderColor: NAVY,
    borderRadius: 14,
    minHeight: 56,
    shadowColor: colors.onboarding.buttonShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  progressSegment: {
    borderRadius: 999,
    flex: 1,
    height: 5,
  },
  progressSegments: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  stepLabel: {
    color: palette.slate[500],
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
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
    height: 36,
    justifyContent: "center",
    marginTop: 2,
    position: "relative",
  },
});
