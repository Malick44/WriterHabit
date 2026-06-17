import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors, radius, shadows, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState } from "@/shared/components/feedback";
import { ComposerSurface } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import {
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { getPracticeTask } from "../data/practiceCatalog";
import { usePracticeSession } from "../hooks/usePracticeSession";

const dashboard = colors.dashboard;
const type = typography.gradeBands.middle;

function getParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function PracticeSessionScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { settings } = useAccessibilityContext();
  const params = useLocalSearchParams<{
    skillId?: string | string[];
    taskId?: string | string[];
  }>();
  const entry = getPracticeTask(
    getParamValue(params.skillId),
    getParamValue(params.taskId),
  );
  const session = usePracticeSession();

  const handleBackToPractice = useCallback(() => {
    router.navigate(routes.studentPractice);
  }, [router]);

  if (!entry) {
    return (
      <ComposerSurface>
        <View style={styles.root}>
          <AppHeader
            leftAction={{
              accessibilityLabelKey: "dailyPractice.backAccessibility",
              type: "back",
            }}
            style={styles.header}
            titleKey="dailyPractice.home.title"
            variant="centered"
          />
          <View style={styles.notFound}>
            <EmptyState
              actionLabel={t("dailyPractice.notFound.action")}
              description={t("dailyPractice.notFound.description")}
              onActionPress={handleBackToPractice}
              title={t("dailyPractice.notFound.title")}
            />
          </View>
        </View>
      </ComposerSurface>
    );
  }

  const { skill, task } = entry;

  return (
    <ComposerSurface>
      <View style={styles.root}>
        <AppHeader
          leftAction={{
            accessibilityLabelKey: "dailyPractice.backAccessibility",
            type: "back",
          }}
          style={styles.header}
          titleKey="dailyPractice.home.title"
          variant="centered"
        />

        {session.isComplete ? (
          <View
            accessibilityLabel={t(
              "dailyPractice.complete.celebrationAccessibility",
            )}
            accessible
            style={styles.celebration}
          >
            <View style={styles.celebrationBadge}>
              <Ionicons
                color={dashboard.onPrimary}
                name="checkmark"
                size={42}
              />
            </View>
            <Text
              accessibilityRole="header"
              style={[
                getAccessibleTextStyle(type.heading, settings),
                styles.centerText,
                styles.celebrationTitle,
              ]}
            >
              {t("dailyPractice.complete.title")}
            </Text>
            <Text
              style={[
                getAccessibleTextStyle(type.body, settings),
                styles.centerText,
                styles.celebrationSubtitle,
              ]}
            >
              {t("dailyPractice.complete.subtitle")}
            </Text>
            <View
              accessibilityLabel={t(
                "dailyPractice.complete.streakBadgeAccessibility",
                {
                  count: session.streakAfterComplete,
                },
              )}
              accessible
              style={styles.streakBadge}
            >
              <View style={styles.streakDot} />
              <Text
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  styles.streakBadgeText,
                ]}
              >
                {t("dailyPractice.complete.streakBadge", {
                  count: session.streakAfterComplete,
                })}
              </Text>
            </View>
            <Button
              accessibilityLabel={t(
                "dailyPractice.complete.backToPracticeAccessibility",
              )}
              label={t("dailyPractice.complete.backToPractice")}
              onPress={handleBackToPractice}
              size="md"
              variant="secondary"
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            testID="practice-session-screen"
          >
            <View style={styles.card}>
              <Text
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  styles.eyebrow,
                ]}
              >
                {skill.title}
              </Text>
              <Text
                style={[
                  getAccessibleTextStyle(type.title, settings),
                  styles.taskTitle,
                ]}
              >
                {task.title}
              </Text>

              <Text
                style={[
                  getAccessibleTextStyle(type.body, settings),
                  styles.instruction,
                ]}
              >
                {task.instruction}
              </Text>
              <Text
                selectable
                style={[
                  getAccessibleTextStyle(type.body, settings),
                  styles.sourceText,
                ]}
              >
                {task.sourceText}
              </Text>

              <TextInput
                accessibilityLabel={t("dailyPractice.inputAccessibility")}
                multiline
                onChangeText={session.setAnswer}
                placeholder={t("dailyPractice.inputPlaceholder")}
                placeholderTextColor={dashboard.onSurfaceVariant}
                style={[
                  getAccessibleTextStyle(type.body, settings),
                  styles.input,
                ]}
                textAlignVertical="top"
                value={session.answer}
              />

              <Button
                accessibilityLabel={t("dailyPractice.completeAccessibility")}
                fullWidth
                label={t("dailyPractice.completeCta")}
                onPress={session.complete}
                size="md"
                variant="primary"
              />
            </View>

            <Text
              style={[
                getAccessibleTextStyle(type.caption, settings),
                styles.coachNote,
              ]}
            >
              {t("dailyPractice.coachNote")}
            </Text>
          </ScrollView>
        )}
      </View>
    </ComposerSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  celebration: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
  },
  celebrationBadge: {
    alignItems: "center",
    backgroundColor: dashboard.primary,
    borderRadius: radius.full,
    height: 88,
    justifyContent: "center",
    marginBottom: spacing.lg,
    width: 88,
    ...shadows.raised,
  },
  celebrationSubtitle: {
    color: dashboard.onSurfaceVariant,
    maxWidth: 260,
  },
  celebrationTitle: {
    color: dashboard.onSurface,
  },
  centerText: {
    textAlign: "center",
  },
  coachNote: {
    color: dashboard.onSurfaceVariant,
    textAlign: "center",
  },
  eyebrow: {
    color: dashboard.tertiaryText,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  header: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },
  input: {
    borderColor: dashboard.outlineVariant,
    borderRadius: radius.lg,
    borderStyle: "dashed",
    borderWidth: 1.5,
    color: dashboard.onSurface,
    minHeight: 96,
    padding: spacing.md,
  },
  instruction: {
    color: dashboard.onSurface,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  root: {
    backgroundColor: "transparent",
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sourceText: {
    backgroundColor: dashboard.surfaceContainerLow,
    borderColor: dashboard.outlineVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: dashboard.onSurface,
    padding: spacing.md,
  },
  streakBadge: {
    alignItems: "center",
    backgroundColor: dashboard.tertiaryContainer,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  streakBadgeText: {
    color: dashboard.tertiaryText,
    fontWeight: "600",
  },
  streakDot: {
    backgroundColor: dashboard.tertiaryText,
    borderRadius: radius.full,
    height: 7,
    width: 7,
  },
  taskTitle: {
    color: dashboard.onSurface,
    fontWeight: "600",
  },
});
