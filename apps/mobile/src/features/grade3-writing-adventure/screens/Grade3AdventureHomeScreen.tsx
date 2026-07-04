import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
  Button,
  ErrorState,
  LoadingState,
  ProgressBar,
} from "@/shared/components";
import { colors, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { Grade3AdventureCard } from "../components/Grade3AdventureCard";
import { Grade3AdventureShell } from "../components/Grade3AdventureShell";
import { grade3WritingProgram } from "../content/grade3WritingProgram.content";
import { grade3Theme } from "../theme/grade3Theme";
import { useGrade3WritingProgress } from "../hooks/useGrade3WritingProgress";
import { isGrade3DayUnlocked } from "../services/grade3WritingProgressModel";
import type { Grade3WritingDay } from "../types";

type TrailDayStatus = "completed" | "ready" | "locked";

/**
 * Accordion header for a run of days: "⭐ Days 1–N · Done!" above today's
 * card, "🔒 Days N–30 · Not yet" below it. Today's card is the only part of
 * the trail that is always expanded.
 */
function Grade3TrailGroupRow({
  expanded,
  from,
  onToggle,
  status,
  to,
}: {
  expanded: boolean;
  from: number;
  onToggle: () => void;
  status: "completed" | "locked";
  to: number;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const groupColors =
    status === "completed"
      ? {
          backgroundColor: colors.feedback.success.background,
          borderColor: colors.feedback.success.border,
        }
      : {
          backgroundColor: grade3Theme.card.cream.background,
          borderColor: grade3Theme.card.cream.border,
        };
  const label =
    from === to
      ? t("grade3WritingAdventure.home.dayTitle", { day: from })
      : t("grade3WritingAdventure.home.completedGroup", { from, to });

  return (
    <Pressable
      accessibilityLabel={t(
        status === "completed"
          ? "grade3WritingAdventure.home.completedGroupAccessibility"
          : "grade3WritingAdventure.home.upcomingGroupAccessibility",
        { from, to },
      )}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onToggle}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: settings.highContrast
          ? accessibleColors.surface
          : groupColors.backgroundColor,
        borderColor: settings.highContrast
          ? accessibleColors.border
          : groupColors.borderColor,
        borderRadius: radius.lg,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        minHeight: 56,
        opacity: pressed ? 0.8 : 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      })}
      testID={`grade3-trail-group-${status}`}
    >
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{ fontSize: 22, lineHeight: 28 }}
      >
        {status === "completed" ? "⭐" : "🔒"}
      </Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[
            getAccessibleTextStyle(type.bodyStrong, settings),
            { color: accessibleColors.text },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            getAccessibleTextStyle(type.caption, settings),
            { color: accessibleColors.text },
          ]}
        >
          {t(
            status === "completed"
              ? "grade3WritingAdventure.home.complete"
              : "grade3WritingAdventure.home.locked",
          )}
        </Text>
      </View>
      <Ionicons
        color={accessibleColors.text}
        name={expanded ? "chevron-up" : "chevron-down"}
        size={18}
      />
    </Pressable>
  );
}

/**
 * Compact trail step for days that are not "today": finished days collapse to
 * star rows, locked days to small stepping stones, so today's full card is
 * the one big thing on the path.
 */
function Grade3TrailDayRow({
  day,
  onPress,
  status,
}: {
  day: Grade3WritingDay;
  onPress: () => void;
  status: TrailDayStatus;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const interactive = status !== "locked";
  const statusLabel =
    status === "completed"
      ? t("grade3WritingAdventure.home.complete")
      : status === "ready"
        ? t("grade3WritingAdventure.home.unlocked")
        : t("grade3WritingAdventure.home.locked");
  const rowColors =
    status === "completed"
      ? {
          backgroundColor: colors.feedback.success.background,
          borderColor: colors.feedback.success.border,
        }
      : status === "ready"
        ? {
            backgroundColor: grade3Theme.card.mint.background,
            borderColor: grade3Theme.card.mint.border,
          }
        : {
            backgroundColor: grade3Theme.card.cream.background,
            borderColor: grade3Theme.card.cream.border,
          };

  return (
    <Pressable
      accessibilityLabel={t(
        "grade3WritingAdventure.home.trailDayAccessibility",
        {
          day: day.day,
          status: statusLabel,
          title: day.title,
        },
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled: !interactive }}
      disabled={!interactive}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: settings.highContrast
          ? accessibleColors.surface
          : rowColors.backgroundColor,
        borderColor: settings.highContrast
          ? accessibleColors.border
          : rowColors.borderColor,
        borderRadius: radius.lg,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        minHeight: 56,
        opacity: pressed ? 0.8 : status === "locked" ? 0.72 : 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      })}
      testID={`grade3-trail-day-${day.day}`}
    >
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{ fontSize: 22, lineHeight: 28 }}
      >
        {status === "completed"
          ? "⭐"
          : status === "ready"
            ? day.visualPrompt.emoji
            : "🔒"}
      </Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[
            getAccessibleTextStyle(type.bodyStrong, settings),
            { color: accessibleColors.text },
          ]}
        >
          {t("grade3WritingAdventure.home.dayTitle", { day: day.day })} ·{" "}
          {day.title}
        </Text>
        <Text
          style={[
            getAccessibleTextStyle(type.caption, settings),
            { color: accessibleColors.text },
          ]}
        >
          {statusLabel}
        </Text>
      </View>
      {interactive ? (
        <Ionicons
          color={accessibleColors.text}
          name="chevron-forward"
          size={18}
        />
      ) : null}
    </Pressable>
  );
}

export function Grade3AdventureHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const progressState = useGrade3WritingProgress();
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  if (progressState.status === "loading") {
    return (
      <Grade3AdventureShell titleKey="grade3WritingAdventure.home.headerTitle">
        <LoadingState
          label={t("grade3WritingAdventure.states.loadingTitle")}
          description={t("grade3WritingAdventure.states.loadingDescription")}
        />
      </Grade3AdventureShell>
    );
  }

  if (progressState.status === "error") {
    return (
      <Grade3AdventureShell titleKey="grade3WritingAdventure.home.headerTitle">
        <ErrorState
          description={t("grade3WritingAdventure.states.errorDescription")}
          onActionPress={progressState.refresh}
          actionLabel={t("common.retry")}
          title={t("grade3WritingAdventure.states.errorTitle")}
        />
      </Grade3AdventureShell>
    );
  }

  const progressValue =
    progressState.summary.completedDays / progressState.summary.totalDays;
  // Today's step: the first unlocked day that isn't finished yet.
  const nextDay = grade3WritingProgram.find((day) => {
    const progress = progressState.progressMap.get(day.day);

    return (
      isGrade3DayUnlocked(day.day, progressState.progress) &&
      progress?.completed !== true
    );
  });
  // Trail partition: finished days accordion above today, ready-but-not-today
  // days as visible rows (rare), locked days accordion below.
  const completedTrailDays = grade3WritingProgram.filter(
    (day) => progressState.progressMap.get(day.day)?.completed === true,
  );
  const readyTrailDays = grade3WritingProgram.filter((day) => {
    const completed = progressState.progressMap.get(day.day)?.completed === true;

    return (
      !completed &&
      day.day !== nextDay?.day &&
      isGrade3DayUnlocked(day.day, progressState.progress)
    );
  });
  const lockedTrailDays = grade3WritingProgram.filter(
    (day) =>
      progressState.progressMap.get(day.day)?.completed !== true &&
      !isGrade3DayUnlocked(day.day, progressState.progress),
  );

  return (
    <Grade3AdventureShell
      subtitle={t("grade3WritingAdventure.home.subtitle")}
      titleKey="grade3WritingAdventure.home.headerTitle"
    >
      <Grade3AdventureCard
        icon="🗺️"
        subtitle={t("grade3WritingAdventure.home.heroSubtitle", {
          completed: progressState.summary.completedDays,
          total: progressState.summary.totalDays,
        })}
        title={t("grade3WritingAdventure.home.heroTitle")}
        variant="peach"
      >
        <ProgressBar
          gradeBand="elementary"
          label={t("grade3WritingAdventure.home.progressAccessibility")}
          value={progressValue}
        />
        {nextDay ? (
          <Button
            accessibilityLabel={t(
              "grade3WritingAdventure.home.continueDayAccessibility",
              { day: nextDay.day },
            )}
            fullWidth
            gradeBand="elementary"
            label={t(
              progressState.summary.completedDays > 0
                ? "grade3WritingAdventure.home.continueDay"
                : "grade3WritingAdventure.home.startDay",
              { day: nextDay.day },
            )}
            onPress={() =>
              router.push(`/(student)/grade3-writing/${nextDay.day}`)
            }
            size="lg"
            variant="primary"
          />
        ) : null}
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
        >
          <Button
            gradeBand="elementary"
            label={t("grade3WritingAdventure.nav.progress")}
            onPress={() => router.push("/(student)/grade3-writing/progress")}
            variant="secondary"
          />
          <Button
            gradeBand="elementary"
            label={t("grade3WritingAdventure.nav.library")}
            onPress={() => router.push("/(student)/grade3-writing/library")}
            variant="secondary"
          />
        </View>
      </Grade3AdventureCard>

      {/* Vertical trail: one column, today's card full size, other days
          collapsed to compact rows so the path stays scannable. */}
      <View style={{ gap: spacing.sm }}>
        {groupCollapsible ? (
          <Grade3TrailCompletedGroupRow
            expanded={showAllCompleted}
            from={1}
            onToggle={() => setShowAllCompleted((value) => !value)}
            to={groupedUpTo}
          />
        ) : null}
        {grade3WritingProgram.map((day) => {
          // Older finished days live inside the summary row until expanded.
          if (!showAllCompleted && day.day <= groupedUpTo) {
            return null;
          }

          const progress = progressState.progressMap.get(day.day);
          const unlocked = isGrade3DayUnlocked(day.day, progressState.progress);
          const completed = progress?.completed === true;
          const isToday = day.day === nextDay?.day;

          if (isToday) {
            return (
              <Grade3AdventureCard
                icon={day.visualPrompt.emoji}
                key={day.day}
                subtitle={t("grade3WritingAdventure.home.todayBadge")}
                title={t("grade3WritingAdventure.home.dayTitle", {
                  day: day.day,
                })}
                variant="sky"
              >
                <Text
                  style={[
                    getAccessibleTextStyle(type.bodyStrong, settings),
                    { color: accessibleColors.text },
                  ]}
                >
                  {day.title}
                </Text>
                <Text
                  style={[
                    getAccessibleTextStyle(type.bodySmall, settings),
                    { color: accessibleColors.text },
                  ]}
                >
                  {day.miniSkill}
                </Text>
                <Button
                  fullWidth
                  gradeBand="elementary"
                  label={t("grade3WritingAdventure.home.openDay")}
                  onPress={() =>
                    router.push(`/(student)/grade3-writing/${day.day}`)
                  }
                  size="lg"
                  variant="primary"
                />
              </Grade3AdventureCard>
            );
          }

          return (
            <Grade3TrailDayRow
              day={day}
              key={day.day}
              onPress={() =>
                router.push(`/(student)/grade3-writing/${day.day}`)
              }
              status={completed ? "completed" : unlocked ? "ready" : "locked"}
            />
          );
        })}
      </View>

      {/* Grown-up content lives at the very end, out of the child's main flow. */}
      <Button
        gradeBand="elementary"
        label={t("grade3WritingAdventure.home.parentGuideLink")}
        onPress={() => router.push("/(student)/grade3-writing/parent-guide")}
        variant="ghost"
      />
    </Grade3AdventureShell>
  );
}
