import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AuthSession, DemoUserId, NavigableUserRole } from "@/core/auth/authTypes";
import { routes, type AppRoute } from "@/core/navigation/routeNames";
import { getLaunchRoute, getPostLoginRoute } from "@/core/navigation/roleRouter";
import { colors, radius, spacing, typography } from "@/design/tokens";
import { onboardingPreviewTargets, prepareOnboardingPreview } from "@/features/onboarding";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { useTopAlert } from "@/shared/components/feedback/top-alert";
import { Modal } from "@/shared/components/modals";
import { useGlacierThemeStore } from "@/shared/theme/glacierThemeStore";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { useAuth } from "../hooks/useAuth";
import { DemoUserPanel } from "./DemoUserPanel";

type DevInfoRow = {
  id: string;
  labelKey: TranslationKey;
  value: string;
};

type DevRouteShortcut = {
  id: string;
  labelKey: TranslationKey;
  accessibilityKey: TranslationKey;
  route: AppRoute;
  iconName: keyof typeof Ionicons.glyphMap;
};

const commonRouteShortcuts = [
  {
    id: "launch",
    labelKey: "auth.demoUsers.devPanel.routes.launch",
    accessibilityKey: "auth.demoUsers.devPanel.routes.launchAccessibility",
    iconName: "navigate",
  },
  {
    id: "paywall",
    labelKey: "auth.demoUsers.devPanel.routes.paywall",
    accessibilityKey: "auth.demoUsers.devPanel.routes.paywallAccessibility",
    iconName: "card",
    route: routes.paywall,
  },
] as const;

const roleRouteShortcuts = {
  student: [
    {
      id: "student-home",
      labelKey: "auth.demoUsers.devPanel.routes.studentHome",
      accessibilityKey: "auth.demoUsers.devPanel.routes.studentHomeAccessibility",
      iconName: "home",
      route: routes.studentHome,
    },
    {
      id: "student-assignments",
      labelKey: "auth.demoUsers.devPanel.routes.studentAssignments",
      accessibilityKey: "auth.demoUsers.devPanel.routes.studentAssignmentsAccessibility",
      iconName: "document-text",
      route: routes.studentAssignmentsHistory,
    },
    {
      id: "student-canvas",
      labelKey: "auth.demoUsers.devPanel.routes.studentCanvas",
      accessibilityKey: "auth.demoUsers.devPanel.routes.studentCanvasAccessibility",
      iconName: "brush",
      route: routes.studentCanvasHome,
    },
    {
      id: "student-progress",
      labelKey: "auth.demoUsers.devPanel.routes.studentProgress",
      accessibilityKey: "auth.demoUsers.devPanel.routes.studentProgressAccessibility",
      iconName: "trending-up",
      route: routes.studentProgress,
    },
  ],
  parent: [
    {
      id: "parent-home",
      labelKey: "auth.demoUsers.devPanel.routes.parentHome",
      accessibilityKey: "auth.demoUsers.devPanel.routes.parentHomeAccessibility",
      iconName: "home",
      route: routes.parentHome,
    },
    {
      id: "parent-reports",
      labelKey: "auth.demoUsers.devPanel.routes.parentReports",
      accessibilityKey: "auth.demoUsers.devPanel.routes.parentReportsAccessibility",
      iconName: "bar-chart",
      route: routes.parentReports,
    },
    {
      id: "parent-assignments",
      labelKey: "auth.demoUsers.devPanel.routes.parentAssignments",
      accessibilityKey: "auth.demoUsers.devPanel.routes.parentAssignmentsAccessibility",
      iconName: "folder-open",
      route: routes.parentAssignments,
    },
    {
      id: "parent-settings",
      labelKey: "auth.demoUsers.devPanel.routes.parentSettings",
      accessibilityKey: "auth.demoUsers.devPanel.routes.parentSettingsAccessibility",
      iconName: "settings",
      route: routes.parentSettings,
    },
  ],
  teacher: [
    {
      id: "teacher-dashboard",
      labelKey: "auth.demoUsers.devPanel.routes.teacherDashboard",
      accessibilityKey: "auth.demoUsers.devPanel.routes.teacherDashboardAccessibility",
      iconName: "speedometer",
      route: routes.teacherDashboard,
    },
    {
      id: "teacher-assignments",
      labelKey: "auth.demoUsers.devPanel.routes.teacherAssignments",
      accessibilityKey: "auth.demoUsers.devPanel.routes.teacherAssignmentsAccessibility",
      iconName: "albums",
      route: routes.teacherAssignments,
    },
    {
      id: "teacher-submissions",
      labelKey: "auth.demoUsers.devPanel.routes.teacherSubmissions",
      accessibilityKey: "auth.demoUsers.devPanel.routes.teacherSubmissionsAccessibility",
      iconName: "file-tray-full",
      route: routes.teacherSubmissions,
    },
    {
      id: "teacher-create",
      labelKey: "auth.demoUsers.devPanel.routes.teacherCreateAssignment",
      accessibilityKey: "auth.demoUsers.devPanel.routes.teacherCreateAssignmentAccessibility",
      iconName: "add-circle",
      route: routes.teacherCreateAssignment,
    },
  ],
  admin: [
    {
      id: "admin-dashboard",
      labelKey: "auth.demoUsers.devPanel.routes.teacherDashboard",
      accessibilityKey: "auth.demoUsers.devPanel.routes.teacherDashboardAccessibility",
      iconName: "speedometer",
      route: routes.teacherDashboard,
    },
    {
      id: "admin-assignments",
      labelKey: "auth.demoUsers.devPanel.routes.teacherAssignments",
      accessibilityKey: "auth.demoUsers.devPanel.routes.teacherAssignmentsAccessibility",
      iconName: "albums",
      route: routes.teacherAssignments,
    },
    {
      id: "admin-submissions",
      labelKey: "auth.demoUsers.devPanel.routes.teacherSubmissions",
      accessibilityKey: "auth.demoUsers.devPanel.routes.teacherSubmissionsAccessibility",
      iconName: "file-tray-full",
      route: routes.teacherSubmissions,
    },
    {
      id: "admin-create",
      labelKey: "auth.demoUsers.devPanel.routes.teacherCreateAssignment",
      accessibilityKey: "auth.demoUsers.devPanel.routes.teacherCreateAssignmentAccessibility",
      iconName: "add-circle",
      route: routes.teacherCreateAssignment,
    },
  ],
} as const satisfies Record<NavigableUserRole, readonly DevRouteShortcut[]>;

function getRoleLabelKey(role: NavigableUserRole): TranslationKey {
  switch (role) {
    case "student":
      return "auth.roles.student.label";
    case "parent":
      return "auth.roles.parent.label";
    case "teacher":
      return "auth.roles.teacher.label";
    case "admin":
      return "auth.demoUsers.devPanel.roles.admin";
  }
}

function getSourceLabelKey(source: AuthSession["source"]): TranslationKey {
  return source === "mock" ? "auth.demoUsers.devPanel.sources.mock" : "auth.demoUsers.devPanel.sources.supabase";
}

function getSubscriptionLabelKey(subscription: AuthSession["subscriptionStatus"]): TranslationKey {
  switch (subscription) {
    case "free":
      return "auth.demoUsers.devPanel.subscriptions.free";
    case "trial":
      return "auth.demoUsers.devPanel.subscriptions.trial";
    case "active":
      return "auth.demoUsers.devPanel.subscriptions.active";
    case "past_due":
      return "auth.demoUsers.devPanel.subscriptions.pastDue";
  }
}

function DevInfoRow({ label, value }: { label: string; value: string }) {
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands.middle;

  return (
    <View style={styles.infoRow}>
      <Text selectable style={[getAccessibleTextStyle(type.caption, settings), styles.infoLabel]}>
        {label}
      </Text>
      <Text numberOfLines={2} selectable style={[getAccessibleTextStyle(type.bodySmall, settings), styles.infoValue]}>
        {value}
      </Text>
    </View>
  );
}

export function DevPanelFloatingLauncher() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const topAlert = useTopAlert();
  const toggleTuningPanel = useGlacierThemeStore((state) => state.toggleTuningPanel);
  const { clearError, isBusy, session, signInWithDemoUser, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const currentRoute = useMemo(() => {
    return segments.length > 0 ? `/${segments.join("/")}` : "/";
  }, [segments]);

  const diagnostics = useMemo<DevInfoRow[]>(() => {
    if (!session) {
      return [];
    }

    return [
      {
        id: "route",
        labelKey: "auth.demoUsers.devPanel.diagnostics.route",
        value: t("auth.demoUsers.devPanel.diagnostics.routeValue", { route: currentRoute }),
      },
      {
        id: "user",
        labelKey: "auth.demoUsers.devPanel.diagnostics.user",
        value: session.user.displayName,
      },
      {
        id: "role",
        labelKey: "auth.demoUsers.devPanel.diagnostics.role",
        value: t(getRoleLabelKey(session.user.role)),
      },
      {
        id: "grade",
        labelKey: "auth.demoUsers.devPanel.diagnostics.grade",
        value: session.user.gradeLevel
          ? t("auth.demoUsers.devPanel.diagnostics.gradeValue", { grade: session.user.gradeLevel })
          : t("auth.demoUsers.devPanel.diagnostics.none"),
      },
      {
        id: "subscription",
        labelKey: "auth.demoUsers.devPanel.diagnostics.subscription",
        value: t(getSubscriptionLabelKey(session.subscriptionStatus)),
      },
      {
        id: "source",
        labelKey: "auth.demoUsers.devPanel.diagnostics.source",
        value: t(getSourceLabelKey(session.source)),
      },
      {
        id: "onboarding",
        labelKey: "auth.demoUsers.devPanel.diagnostics.onboarding",
        value: t(
          session.onboardingComplete
            ? "auth.demoUsers.devPanel.diagnostics.onboardingComplete"
            : "auth.demoUsers.devPanel.diagnostics.onboardingIncomplete",
        ),
      },
    ];
  }, [currentRoute, session, t]);

  const routeShortcuts = useMemo(() => {
    if (!session) {
      return [];
    }

    return [
      {
        ...commonRouteShortcuts[0],
        route: getLaunchRoute(session),
      },
      ...roleRouteShortcuts[session.user.role],
      commonRouteShortcuts[1],
    ] satisfies readonly DevRouteShortcut[];
  }, [session]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleRoutePress = useCallback(
    (route: AppRoute) => {
      setIsOpen(false);
      router.replace(route);
    },
    [router],
  );

  const handleSelectDemoUser = useCallback(
    async (demoUserId: DemoUserId) => {
      clearError();
      const result = await signInWithDemoUser(demoUserId);

      if (result.session) {
        setIsOpen(false);
        router.replace(getPostLoginRoute(result.session));
        topAlert.show({
          type: "success",
          titleKey: "auth.demoUsers.devPanel.alerts.sessionSwitchedTitle",
          descriptionKey: "auth.demoUsers.devPanel.alerts.sessionSwitchedDescription",
          descriptionParams: { user: result.session.user.displayName },
        });
      }
    },
    [clearError, router, signInWithDemoUser, topAlert],
  );

  const handleSelectOnboardingPreview = useCallback(
    async (targetId: string) => {
      clearError();
      const result = await signInWithDemoUser("student_needs_onboarding");
      const userId = result.session?.user.id;

      if (!userId) {
        return;
      }

      const route = await prepareOnboardingPreview(userId, targetId);
      setIsOpen(false);
      router.replace(route);
    },
    [clearError, router, signInWithDemoUser],
  );

  const handleShowTestAlert = useCallback(() => {
    setIsOpen(false);
    topAlert.show({
      type: "info",
      titleKey: "auth.demoUsers.devPanel.alerts.testTitle",
      descriptionKey: "auth.demoUsers.devPanel.alerts.testDescription",
      tapToDismiss: true,
    });
  }, [topAlert]);

  const handleOpenThemeTuning = useCallback(() => {
    setIsOpen(false);
    toggleTuningPanel();
  }, [toggleTuningPanel]);

  const handleSignOut = useCallback(async () => {
    clearError();
    setIsOpen(false);
    await signOut();
    router.replace(routes.authWelcome);
    topAlert.show({
      type: "neutral",
      titleKey: "auth.demoUsers.devPanel.alerts.signedOutTitle",
      descriptionKey: "auth.demoUsers.devPanel.alerts.signedOutDescription",
    });
  }, [clearError, router, signOut, topAlert]);

  if (!__DEV__) {
    return null;
  }

  return (
    <>
      <Pressable
        accessibilityHint={t("auth.demoUsers.floatingHint")}
        accessibilityLabel={t("auth.demoUsers.floatingAccessibility")}
        accessibilityRole="button"
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.floatingButton,
          {
            bottom: Math.max(insets.bottom, spacing.lg) + spacing.lg,
            left: session ? undefined : spacing.lg,
            opacity: pressed ? 0.76 : 1,
            right: session ? spacing.lg : undefined,
          },
        ]}
        testID="dev-panel-floating-button"
      >
        <Ionicons name="construct" size={24} color="#FFFFFF" />
        <Text style={styles.floatingText}>{t("auth.demoUsers.floatingLabel")}</Text>
      </Pressable>

      <Modal
        closeAccessibilityHintKey="auth.demoUsers.closePanelHint"
        closeAccessibilityLabelKey="auth.demoUsers.closePanelAccessibility"
        contentContainerStyle={styles.modalContent}
        mode="bottomSheet"
        onClose={handleClose}
        panelStyle={styles.modalPanel}
        subtitleKey="auth.demoUsers.devPanel.subtitle"
        testID="dev-panel-modal"
        titleKey="auth.demoUsers.floatingTitle"
        visible={isOpen}
      >
        <DemoUserPanel
          disabled={isBusy}
          onboardingPreviewOptions={onboardingPreviewTargets}
          onSelectDemoUser={handleSelectDemoUser}
          onSelectOnboardingPreview={handleSelectOnboardingPreview}
        />

        {session ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text selectable style={styles.sectionTitle}>
                  {t("auth.demoUsers.devPanel.diagnostics.title")}
                </Text>
                <Text selectable style={styles.sectionDescription}>
                  {t("auth.demoUsers.devPanel.diagnostics.description")}
                </Text>
              </View>
              <View style={styles.infoGrid}>
                {diagnostics.map((item) => (
                  <DevInfoRow key={item.id} label={t(item.labelKey)} value={item.value} />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text selectable style={styles.sectionTitle}>
                  {t("auth.demoUsers.devPanel.routes.title")}
                </Text>
                <Text selectable style={styles.sectionDescription}>
                  {t("auth.demoUsers.devPanel.routes.description")}
                </Text>
              </View>
              <View style={styles.shortcutGrid}>
                {routeShortcuts.map((shortcut) => (
                  <Button
                    accessibilityLabel={t(shortcut.accessibilityKey)}
                    key={shortcut.id}
                    label={t(shortcut.labelKey)}
                    leftAccessory={<Ionicons color={colors.text.primary} name={shortcut.iconName} size={17} />}
                    onPress={() => {
                      handleRoutePress(shortcut.route);
                    }}
                    size="sm"
                    style={styles.shortcutButton}
                    variant="secondary"
                  />
                ))}
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>
              {t("auth.demoUsers.devPanel.actions.title")}
            </Text>
            <Text selectable style={styles.sectionDescription}>
              {t("auth.demoUsers.devPanel.actions.description")}
            </Text>
          </View>
          <View style={styles.shortcutGrid}>
            <Button
              accessibilityLabel={t("themeTuner.openAccessibility")}
              disabled={isBusy}
              label={t("themeTuner.title")}
              leftAccessory={<Ionicons color={colors.text.primary} name="color-palette" size={17} />}
              onPress={handleOpenThemeTuning}
              size="sm"
              style={styles.shortcutButton}
              variant="secondary"
            />
            <Button
              accessibilityLabel={t("auth.demoUsers.devPanel.actions.testAlertAccessibility")}
              disabled={isBusy}
              label={t("auth.demoUsers.devPanel.actions.testAlert")}
              leftAccessory={<Ionicons color={colors.text.primary} name="notifications" size={17} />}
              onPress={handleShowTestAlert}
              size="sm"
              style={styles.shortcutButton}
              variant="secondary"
            />
            {session ? (
              <Button
                accessibilityLabel={t("auth.demoUsers.devPanel.actions.signOutAccessibility")}
                disabled={isBusy}
                label={t("auth.demoUsers.devPanel.actions.signOut")}
                leftAccessory={<Ionicons color={colors.feedback.error.text} name="log-out" size={17} />}
                onPress={() => {
                  void handleSignOut();
                }}
                size="sm"
                style={styles.shortcutButton}
                variant="danger"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    alignItems: "center",
    backgroundColor: colors.action.primary.background,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    position: "absolute",
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
  infoGrid: {
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoLabel: {
    color: colors.text.secondary,
    flex: 0.85,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoRow: {
    alignItems: "center",
    backgroundColor: colors.background.surface,
    borderBottomColor: colors.border.default,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoValue: {
    color: colors.text.primary,
    flex: 1.35,
    fontWeight: "700",
    textAlign: "right",
  },
  modalContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  modalPanel: {
    maxHeight: "86%",
  },
  section: {
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  shortcutButton: {
    flexBasis: "47%",
    flexGrow: 1,
  },
  shortcutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
