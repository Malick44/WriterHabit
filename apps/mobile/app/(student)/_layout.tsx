import { StyleSheet, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { RouteGate } from "@/core/navigation/RouteGate";
import { colors } from "@/design/tokens";
import { overrideStyle } from "@/devtools/theme-tuner";
import { studentHomeTokenDefaults, useStudentHomeTokenOverrides } from "@/features/student-home/themeTuning";
import { useI18n } from "@/i18n";

export default function StudentLayout() {
  const { t } = useI18n();
  const tuned = useStudentHomeTokenOverrides();

  return (
    <RouteGate
      area="student"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: tuned["bottomNav.activeTint"] ?? studentHomeTokenDefaults["bottomNav.activeTint"],
          tabBarInactiveTintColor:
            tuned["bottomNav.inactiveTint"] ?? studentHomeTokenDefaults["bottomNav.inactiveTint"],
          tabBarIcon: ({ color, focused, size }) => {
            switch (route.name) {
              case "home":
                return <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />;
              case "assignments/history":
                return <Ionicons name={focused ? "pencil" : "pencil-outline"} size={size + 1} color={color} />;
              case "canvas/index":
                return (
                  <View style={styles.createTabButton}>
                    <Ionicons name="add" size={34} color={colors.text.inverse} />
                  </View>
                );
              case "progress/index":
                return (
                  <Ionicons
                    name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
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
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarStyle: [
            styles.tabBar,
            overrideStyle<ViewStyle>({ backgroundColor: tuned["bottomNav.background"] }),
          ],
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
            title: t("navigation.tabs.student.write"),
            tabBarAccessibilityLabel: t("navigation.tabs.student.writeAccessibility"),
          }}
        />
        <Tabs.Screen
          name="canvas/index"
          options={{
            title: t("navigation.tabs.student.canvas"),
            tabBarAccessibilityLabel: t("navigation.tabs.student.canvasAccessibility"),
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
        <Tabs.Screen name="review/[submissionId]/complete" options={{ href: null }} />
        <Tabs.Screen name="review/[submissionId]/index" options={{ href: null }} />
        <Tabs.Screen name="review/[submissionId]/revision" options={{ href: null }} />
        <Tabs.Screen name="review/[submissionId]/rubric" options={{ href: null }} />
        <Tabs.Screen name="review/[submissionId]/summary" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="write/[assignmentId]" options={{ href: null }} />
      </Tabs>
    </RouteGate>
  );
}

const styles = StyleSheet.create({
  createTabButton: {
    alignItems: "center",
    backgroundColor: "#6D28D9",
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    marginBottom: 25,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    width: 64,
  },
  tabBar: {
    backgroundColor: colors.background.surface,
    borderTopColor: "#EEF0F4",
    borderTopWidth: 1,
    height: 92,
    paddingBottom: 18,
    paddingTop: 9,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 2,
  },
});
