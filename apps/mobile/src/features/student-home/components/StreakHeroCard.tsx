import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, palette, withAlpha } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import type { StudentHomeViewModel } from "../types";

type DayStatus = "done" | "today" | "rest";

const dashboard = colors.dashboard;

/**
 * Distributes this week's completed sessions onto Monday-first weekday slots,
 * ending on today when the student already practiced, otherwise ending
 * yesterday so today reads as the open "write now" slot.
 */
function getWeekDayStatuses(
  sessionsCompleted: number,
  practicedToday: boolean,
  todayIndex: number,
): DayStatus[] {
  const lastDoneIndex = practicedToday ? todayIndex : todayIndex - 1;
  const doneCount = Math.min(Math.max(sessionsCompleted, 0), lastDoneIndex + 1);
  const firstDoneIndex = lastDoneIndex - doneCount + 1;

  return Array.from({ length: 7 }, (_, index) => {
    if (index >= firstDoneIndex && index <= lastDoneIndex) {
      return "done";
    }

    if (index === todayIndex) {
      return "today";
    }

    return "rest";
  });
}

interface StreakHeroCardProps {
  streak: StudentHomeViewModel["streak"];
  weeklySessionsCompleted: number;
}

export function StreakHeroCard({ streak, weeklySessionsCompleted }: StreakHeroCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const todayIndex = (new Date().getDay() + 6) % 7;
  const dayStatuses = getWeekDayStatuses(weeklySessionsCompleted, streak.practicedToday, todayIndex);
  const weekdayInitials = t("studentHome.streakHero.weekdayInitials").split(",");
  const doneCount = dayStatuses.filter((status) => status === "done").length;
  const nextCount = streak.currentDays + 1;
  const nudge = streak.practicedToday
    ? t("studentHome.streakHero.todayDone")
    : nextCount > streak.bestDays
      ? t("studentHome.streakHero.nudgeBest", { count: nextCount })
      : t("studentHome.streakHero.nudge", { count: nextCount });

  return (
    <LinearGradient
      colors={[dashboard.inverseSurface, dashboard.inverseSurfaceHigh]}
      end={{ x: 0.6, y: 1 }}
      start={{ x: 0.2, y: 0 }}
      style={styles.card}
      testID="student-home-streak-hero"
    >
      <View style={styles.decorCircle} />
      <Text
        accessibilityLabel={t("studentHome.streakHero.accessibility", { count: streak.currentDays })}
        selectable
        style={getAccessibleTextStyle(styles.eyebrow, settings)}
      >
        {t("studentHome.streakHero.eyebrow")}
      </Text>
      <View style={styles.countRow}>
        <Text selectable style={getAccessibleTextStyle(styles.count, settings)}>
          {streak.currentDays}
        </Text>
        <Text selectable style={getAccessibleTextStyle(styles.countUnit, settings)}>
          {t("studentHome.streakHero.daysUnit")}
        </Text>
      </View>

      <View
        accessibilityLabel={t("studentHome.streakHero.weekAccessibility", { count: doneCount })}
        accessible
        style={styles.weekRow}
      >
        {dayStatuses.map((status, index) => (
          <View key={`day-${index}`} style={styles.dayColumn}>
            <View
              style={[
                styles.dayDot,
                status === "done" ? styles.dayDotDone : null,
                status === "today" ? styles.dayDotToday : null,
              ]}
            >
              {status === "done" ? (
                <Ionicons name="checkmark" size={14} color={dashboard.primary} />
              ) : null}
            </View>
            <Text
              selectable={false}
              style={[
                styles.dayLabel,
                status === "today" ? styles.dayLabelToday : null,
                status === "rest" ? styles.dayLabelRest : null,
              ]}
            >
              {weekdayInitials[index] ?? ""}
            </Text>
          </View>
        ))}
      </View>

      <Text selectable style={getAccessibleTextStyle(styles.nudge, settings)}>
        {nudge}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    elevation: 4,
    overflow: "hidden",
    padding: 22,
    shadowColor: dashboard.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  count: {
    color: dashboard.inverseText,
    fontSize: 52,
    fontWeight: "700",
    lineHeight: 56,
  },
  countRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 9,
    marginBottom: 18,
  },
  countUnit: {
    color: dashboard.primaryFixed,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  dayColumn: {
    alignItems: "center",
    gap: 7,
  },
  dayDot: {
    alignItems: "center",
    backgroundColor: dashboard.glassFaint,
    borderColor: withAlpha(palette.white, 0.16),
    borderRadius: 13,
    borderWidth: 1.5,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  dayDotDone: {
    backgroundColor: dashboard.primaryFixed,
    borderColor: dashboard.primaryFixed,
  },
  dayDotToday: {
    backgroundColor: "transparent",
    borderColor: dashboard.onPrimaryContainer,
    borderWidth: 2,
  },
  dayLabel: {
    color: dashboard.onPrimaryContainer,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
  },
  dayLabelRest: {
    color: withAlpha(palette.white, 0.45),
  },
  dayLabelToday: {
    color: dashboard.primaryFixed,
  },
  decorCircle: {
    backgroundColor: withAlpha(palette.white, 0.06),
    borderRadius: 70,
    height: 140,
    position: "absolute",
    right: -30,
    top: -30,
    width: 140,
  },
  eyebrow: {
    color: dashboard.onPrimaryContainer,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    lineHeight: 14,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  nudge: {
    color: dashboard.primaryFixed,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 14,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
