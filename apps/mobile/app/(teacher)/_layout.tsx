import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { RouteGate } from "@/core/navigation/RouteGate";
import { useI18n } from "@/i18n";
import { BottomMenuProvider, RoleBottomMenu, tabBarColors } from "@/shared/components/navigation";

const teacherVisibleRouteNames = ["dashboard", "assignments/index", "submissions/index", "settings"] as const;

export default function TeacherLayout() {
  const { t } = useI18n();

  return (
    <RouteGate
      area="teacher"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <BottomMenuProvider>
        <Tabs
          tabBar={(props) => (
            <RoleBottomMenu
              {...props}
              activeTintColor={tabBarColors.activeTint}
              homeRouteName="dashboard"
              inactiveTintColor={tabBarColors.inactiveTint}
              visibleRouteNames={teacherVisibleRouteNames}
            />
          )}
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: tabBarColors.activeTint,
            tabBarInactiveTintColor: tabBarColors.inactiveTint,
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
                case "settings":
                  return <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} />;
                default:
                  return <Ionicons name="ellipse-outline" size={size} color={color} />;
              }
            },
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
          <Tabs.Screen
            name="settings"
            options={{
              title: t("navigation.tabs.teacher.settings"),
              tabBarAccessibilityLabel: t("navigation.tabs.teacher.settingsAccessibility"),
            }}
          />
          <Tabs.Screen name="assignments/create" options={{ href: null }} />
          <Tabs.Screen name="classes/[classId]/progress" options={{ href: null }} />
          <Tabs.Screen name="submissions/[submissionId]" options={{ href: null }} />
          <Tabs.Screen name="accessibility-settings" options={{ href: null }} />
        </Tabs>
      </BottomMenuProvider>
    </RouteGate>
  );
}
