import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Screen } from "@/shared/components/layout/Screen";
import { Stack } from "@/shared/components/layout/Stack";
import { radius, spacing, typography } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGlacierThemeStore } from "@/shared/theme/glacierThemeStore";

import { useAuth } from "../hooks/useAuth";

export function WelcomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { clearError, isBusy } = useAuth();
  const { settings } = useAccessibilityContext();
  const { primaryColor, fontSizeScale } = useGlacierThemeStore();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.roles;

  return (
    <Screen
      backgroundColor={accessibleColors.background}
      contentStyle={styles.screenContent}
      scroll={false}
      testID="welcome-screen"
    >
      <Stack align="center" gap="xxl" style={styles.container}>
        <View style={styles.brandRow}>
          <Ionicons
            name="create"
            size={16}
            color={primaryColor}
            accessibilityLabel={t("auth.welcome.logoIconAccessibility")}
          />
          <Text
            style={[
              getAccessibleTextStyle(type.bodySmall, settings),
              styles.brandText,
              { color: primaryColor, fontSize: type.bodySmall.fontSize * fontSizeScale },
            ]}
          >
            {t("auth.welcome.logoLabel")}
          </Text>
        </View>

        <View style={styles.heroCopy}>
          <Text
            accessibilityRole="header"
            style={[
              getAccessibleTextStyle(type.bodyStrong, settings),
              styles.heroTitle,
              { color: accessibleColors.text, fontSize: type.bodyStrong.fontSize * fontSizeScale },
            ]}
          >
            {t("auth.welcome.heroTitle")}
          </Text>
          <Text
            style={[
              getAccessibleTextStyle(type.body, settings),
              styles.heroSubtitle,
              { color: accessibleColors.mutedText, fontSize: type.body.fontSize * fontSizeScale },
            ]}
          >
            {t("auth.welcome.heroSubtitle")}
          </Text>
        </View>

        <View style={[styles.illustrationContainer, { backgroundColor: accessibleColors.surface }]}>
          <Image
            accessibilityLabel={t("auth.welcome.illustrationAccessibility")}
            source={require("../../../../assets/generated/onboarding/welcome-onboarding.png")}
            style={styles.illustrationImage}
          />
        </View>

        <Stack gap="md" style={styles.actionsContainer}>
          <Button
            disabled={isBusy}
            label={t("auth.welcome.getStartedCta")}
            onPress={() => {
              clearError();
              router.push(routes.authSignUp);
            }}
          />
          <Pressable
            accessibilityLabel={t("auth.welcome.alreadyHaveAccountCta")}
            accessibilityRole="button"
            disabled={isBusy}
            hitSlop={getAccessibleHitSlop(settings)}
            onPress={() => {
              clearError();
              router.push(routes.authSignIn);
            }}
            style={({ pressed }) => [styles.accountLink, pressed && !isBusy ? styles.accountLinkPressed : null]}
          >
            <Text
              style={[
                getAccessibleTextStyle(type.bodySmall, settings),
                styles.accountLinkText,
                { color: accessibleColors.text },
              ]}
            >
              {t("auth.welcome.alreadyHaveAccountCta")}
            </Text>
          </Pressable>
        </Stack>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountLink: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  accountLinkPressed: {
    opacity: 0.72,
  },
  accountLinkText: {
    textAlign: "center",
  },
  actionsContainer: {
    marginTop: spacing.xxl,
    width: "100%",
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
  },
  brandText: {
    fontWeight: "700",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
    paddingBottom: spacing.huge,
    paddingTop: spacing.xxl,
    width: "100%",
  },
  heroCopy: {
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: 260,
  },
  heroSubtitle: {
    lineHeight: 20,
    textAlign: "center",
  },
  heroTitle: {
    maxWidth: 210,
    textAlign: "center",
  },
  illustrationContainer: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: radius.md,
    justifyContent: "center",
    maxWidth: 252,
    overflow: "hidden",
    width: "100%",
  },
  illustrationImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%",
  },
  screenContent: {
    flex: 1,
    maxWidth: 300,
  },
});
