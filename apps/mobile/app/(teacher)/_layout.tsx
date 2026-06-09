import { Tabs } from "expo-router";

import { RouteGate } from "@/core/navigation/RouteGate";
import { useI18n } from "@/i18n";

export default function TeacherLayout() {
  const { t } = useI18n();

  return (
    <RouteGate
      area="teacher"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: t("navigation.tabs.teacher.dashboard"),
            tabBarAccessibilityLabel: t("navigation.tabs.teacher.dashboardAccessibility"),
          }}
        />
        <Tabs.Screen
          name="assignments/index"
          options={{
            title: t("navigation.tabs.teacher.assignments"),
            tabBarAccessibilityLabel: t("navigation.tabs.teacher.assignmentsAccessibility"),
          }}
        />
        <Tabs.Screen
          name="submissions/index"
          options={{
            title: t("navigation.tabs.teacher.submissions"),
            tabBarAccessibilityLabel: t("navigation.tabs.teacher.submissionsAccessibility"),
          }}
        />
        <Tabs.Screen name="assignments/create" options={{ href: null }} />
        <Tabs.Screen name="submissions/[submissionId]" options={{ href: null }} />
      </Tabs>
    </RouteGate>
  );
}
