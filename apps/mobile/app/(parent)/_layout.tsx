import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RouteGate } from "@/core/navigation/RouteGate";
import { useI18n } from "@/i18n";
import { getTabBarStyle, tabBarColors, tabBarStyles } from "@/shared/components/navigation";

export default function ParentLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <RouteGate
      area="parent"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: tabBarColors.activeTint,
          tabBarInactiveTintColor: tabBarColors.inactiveTint,
          tabBarIcon: ({ color, focused, size }) => {
            switch (route.name) {
              case "home":
                return <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />;
              case "reports":
                return <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={size} color={color} />;
              case "assignments/index":
                return (
                  <Ionicons name={focused ? "document-text" : "document-text-outline"} size={size} color={color} />
                );
              case "settings":
                return <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} />;
              default:
                return <Ionicons name="ellipse-outline" size={size} color={color} />;
            }
          },
          tabBarItemStyle: tabBarStyles.tabBarItem,
          tabBarLabelStyle: tabBarStyles.tabBarLabel,
          tabBarStyle: getTabBarStyle(insets.bottom),
        })}
      >
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
