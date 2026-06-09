import { Tabs } from "expo-router";

import { RouteGate } from "@/core/navigation/RouteGate";
import { useI18n } from "@/i18n";

export default function StudentLayout() {
  const { t } = useI18n();

  return (
    <RouteGate
      area="student"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <Tabs screenOptions={{ headerShown: false }}>
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
          name="progress"
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
        <Tabs.Screen name="assignments/[assignmentId]" options={{ href: null }} />
        <Tabs.Screen name="assignments/submit" options={{ href: null }} />
        <Tabs.Screen name="canvas/[canvasId]" options={{ href: null }} />
        <Tabs.Screen name="canvas/templates" options={{ href: null }} />
        <Tabs.Screen name="review/[submissionId]/complete" options={{ href: null }} />
        <Tabs.Screen name="review/[submissionId]/index" options={{ href: null }} />
        <Tabs.Screen name="review/[submissionId]/revision" options={{ href: null }} />
        <Tabs.Screen name="review/[submissionId]/rubric" options={{ href: null }} />
        <Tabs.Screen name="review/[submissionId]/summary" options={{ href: null }} />
        <Tabs.Screen name="write/[assignmentId]" options={{ href: null }} />
      </Tabs>
    </RouteGate>
  );
}
