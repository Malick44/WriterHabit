import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { RouteGate } from "@/core/navigation/RouteGate";
import { studentHomeTokenDefaults, useStudentHomeTokenOverrides } from "@/features/student-home/themeTuning";
import { useI18n } from "@/i18n";
import { BottomMenuProvider, RoleBottomMenu } from "@/shared/components/navigation";

const studentVisibleRouteNames = ["home", "assignments/history", "canvas/index"] as const;

export default function StudentLayout() {
  const { t } = useI18n();
  const tuned = useStudentHomeTokenOverrides();
  const activeTintColor = tuned["bottomNav.activeTint"] ?? studentHomeTokenDefaults["bottomNav.activeTint"];
  const inactiveTintColor = tuned["bottomNav.inactiveTint"] ?? studentHomeTokenDefaults["bottomNav.inactiveTint"];
  const backgroundColor = tuned["bottomNav.background"] ?? studentHomeTokenDefaults["bottomNav.background"];

  return (
    <RouteGate
      area="student"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <BottomMenuProvider>
        <Tabs
          tabBar={(props) => (
            <RoleBottomMenu
              {...props}
              activeTintColor={activeTintColor}
              backgroundColor={backgroundColor}
              homeRouteName="home"
              inactiveTintColor={inactiveTintColor}
              visibleRouteNames={studentVisibleRouteNames}
            />
          )}
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: activeTintColor,
            tabBarInactiveTintColor: inactiveTintColor,
            tabBarIcon: ({ color, focused, size }) => {
              switch (route.name) {
                case "home":
                  return <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />;
                case "assignments/history":
                  return (
                    <Ionicons
                      name={focused ? "document-text" : "document-text-outline"}
                      size={size + 1}
                      color={color}
                    />
                  );
                case "canvas/index":
                  return <Ionicons name={focused ? "library" : "library-outline"} size={size + 1} color={color} />;
                case "progress/index":
                  return (
                    <Ionicons
                      name={focused ? "bar-chart" : "bar-chart-outline"}
                      size={size + 1}
                      color={color}
                    />
                  );
                case "profile":
                  return <Ionicons name={focused ? "person" : "person-outline"} size={size + 1} color={color} />;
                default:
                  return <Ionicons name="ellipse-outline" size={size} color={color} />;
              }
            },
          })}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: t("navigation.tabs.student.home"),
              tabBarAccessibilityLabel: t("navigation.tabs.student.homeAccessibility"),
            }}
          />
          <Tabs.Screen
            name="assignments/history"
            options={{
              title: t("navigation.tabs.student.assignments"),
              tabBarAccessibilityLabel: t("navigation.tabs.student.assignmentsAccessibility"),
            }}
          />
          <Tabs.Screen
            name="canvas/index"
            options={{
              title: t("navigation.tabs.student.library"),
              tabBarAccessibilityLabel: t("navigation.tabs.student.libraryAccessibility"),
            }}
          />
          <Tabs.Screen
            name="progress/index"
            options={{
              title: t("navigation.tabs.student.progress"),
              tabBarAccessibilityLabel: t("navigation.tabs.student.progressAccessibility"),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t("navigation.tabs.student.profile"),
              tabBarAccessibilityLabel: t("navigation.tabs.student.profileAccessibility"),
            }}
          />
          <Tabs.Screen name="assignments/[assignmentId]" options={{ href: null, tabBarStyle: { display: "none" } }} />
          <Tabs.Screen name="assignments/submit" options={{ href: null }} />
          <Tabs.Screen name="canvas/[canvasId]" options={{ href: null, tabBarStyle: { display: "none" } }} />
          <Tabs.Screen name="canvas/templates" options={{ href: null }} />
          <Tabs.Screen name="progress/badges" options={{ href: null }} />
          <Tabs.Screen name="progress/skills/[skillId]" options={{ href: null }} />
          <Tabs.Screen name="progress/weekly-review" options={{ href: null }} />
          <Tabs.Screen name="edit-profile" options={{ href: null }} />
          <Tabs.Screen name="writing-goals" options={{ href: null }} />
          <Tabs.Screen name="notification-settings" options={{ href: null }} />
          <Tabs.Screen name="language-settings" options={{ href: null }} />
          <Tabs.Screen name="accessibility-settings" options={{ href: null }} />
          <Tabs.Screen name="review/[submissionId]/complete" options={{ href: null }} />
          <Tabs.Screen name="review/[submissionId]/index" options={{ href: null }} />
          <Tabs.Screen name="review/[submissionId]/revision" options={{ href: null }} />
          <Tabs.Screen name="review/[submissionId]/rubric" options={{ href: null }} />
          <Tabs.Screen name="review/[submissionId]/summary" options={{ href: null }} />
          <Tabs.Screen name="settings" options={{ href: null }} />
          <Tabs.Screen name="write/[assignmentId]" options={{ href: null }} />
        </Tabs>
      </BottomMenuProvider>
    </RouteGate>
  );
}
