import { Tabs } from "expo-router";

import { RouteGate } from "@/core/navigation/RouteGate";
import { useI18n } from "@/i18n";

export default function ParentLayout() {
  const { t } = useI18n();

  return (
    <RouteGate
      area="parent"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="home"
          options={{
            title: t("navigation.tabs.parent.home"),
            tabBarAccessibilityLabel: t("navigation.tabs.parent.homeAccessibility"),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: t("navigation.tabs.parent.reports"),
            tabBarAccessibilityLabel: t("navigation.tabs.parent.reportsAccessibility"),
          }}
        />
        <Tabs.Screen
          name="assignments/index"
          options={{
            title: t("navigation.tabs.parent.assignments"),
            tabBarAccessibilityLabel: t("navigation.tabs.parent.assignmentsAccessibility"),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t("navigation.tabs.parent.settings"),
            tabBarAccessibilityLabel: t("navigation.tabs.parent.settingsAccessibility"),
          }}
        />
        <Tabs.Screen name="assignments/[submissionId]" options={{ href: null }} />
        <Tabs.Screen name="students/[studentId]/report" options={{ href: null }} />
      </Tabs>
    </RouteGate>
  );
}
