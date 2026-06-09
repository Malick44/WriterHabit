import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getLaunchRoute } from "@/core/navigation/roleRouter";
import { colors, radius, spacing } from "@/design/tokens";
import { onboardingPreviewTargets, prepareOnboardingPreview } from "@/features/onboarding";
import { useI18n } from "@/i18n";

import { useAuth } from "../hooks/useAuth";
import { DemoUserPanel } from "./DemoUserPanel";

function isHomeSegment(segments: string[]) {
  const [area, route] = segments;

  return (
    (area === "(student)" && route === "home") ||
    (area === "(parent)" && route === "home") ||
    (area === "(teacher)" && route === "dashboard")
  );
}

export function DevPanelFloatingLauncher() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { clearError, isBusy, session, signInWithDemoUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!__DEV__ || !session?.onboardingComplete || !isHomeSegment(segments)) {
    return null;
  }

  return (
    <>
      <Pressable
        accessibilityHint={t("auth.demoUsers.floatingHint")}
        accessibilityLabel={t("auth.demoUsers.floatingAccessibility")}
        accessibilityRole="button"
        onPress={() => {
          setIsOpen(true);
        }}
        style={({ pressed }) => [
          styles.floatingButton,
          {
            bottom: Math.max(insets.bottom, spacing.lg) + spacing.lg,
            opacity: pressed ? 0.76 : 1,
          },
        ]}
        testID="dev-panel-floating-button"
      >
        <Ionicons name="construct" size={24} color="#FFFFFF" />
        <Text style={styles.floatingText}>{t("auth.demoUsers.floatingLabel")}</Text>
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={() => {
          setIsOpen(false);
        }}
        transparent
        visible={isOpen}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel={t("auth.demoUsers.closePanelAccessibility")}
            accessibilityRole="button"
            onPress={() => {
              setIsOpen(false);
            }}
            style={styles.backdrop}
          />
          <View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, spacing.lg),
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t("auth.demoUsers.floatingTitle")}</Text>
              <Pressable
                accessibilityHint={t("auth.demoUsers.closePanelHint")}
                accessibilityLabel={t("auth.demoUsers.closePanelAccessibility")}
                accessibilityRole="button"
                hitSlop={spacing.sm}
                onPress={() => {
                  setIsOpen(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <DemoUserPanel
                disabled={isBusy}
                onboardingPreviewOptions={onboardingPreviewTargets}
                onSelectDemoUser={async (demoUserId) => {
                  clearError();
                  const result = await signInWithDemoUser(demoUserId);

                  if (result.session) {
                    setIsOpen(false);
                    router.replace(getLaunchRoute(result.session));
                  }
                }}
                onSelectOnboardingPreview={async (targetId) => {
                  clearError();
                  const result = await signInWithDemoUser("student_needs_onboarding");
                  const userId = result.session?.user.id;

                  if (!userId) {
                    return;
                  }

                  const route = await prepareOnboardingPreview(userId, targetId);
                  setIsOpen(false);
                  router.replace(route);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    bottom: 0,
    backgroundColor: "rgba(2, 6, 23, 0.42)",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.background.subtle,
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  floatingButton: {
    alignItems: "center",
    backgroundColor: colors.action.primary.background,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    position: "absolute",
    right: spacing.lg,
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    zIndex: 50,
  },
  floatingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "86%",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "800",
  },
});
