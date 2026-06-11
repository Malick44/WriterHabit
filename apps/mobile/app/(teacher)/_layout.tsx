import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { RouteGate } from "@/core/navigation/RouteGate";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";

export default function TeacherLayout() {
  const { t } = useI18n();

  return (
    <RouteGate
      area="teacher"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.action.primary.background,
          tabBarInactiveTintColor: colors.text.muted,
          tabBarIcon: ({ color, focused, size }) => {
            switch (route.name) {
              case "dashboard":
                return <Ionicons name={focused ? "grid" : "grid-outline"} size={size} color={color} />;
              case "assignments/index":
                return (
                  <Ionicons name={focused ? "document-text" : "document-text-outline"} size={size} color={color} />
                );
              case "submissions/index":
                return (
                  <Ionicons name={focused ? "file-tray-full" : "file-tray-full-outline"} size={size} color={color} />
                );
              default:
                return <Ionicons name="ellipse-outline" size={size} color={color} />;
            }
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "700", lineHeight: 16, marginTop: 2 },
        })}
      >
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
        <Tabs.Screen name="classes/[classId]/progress" options={{ href: null }} />
        <Tabs.Screen name="submissions/[submissionId]" options={{ href: null }} />
      </Tabs>
    </RouteGate>
  );
}
