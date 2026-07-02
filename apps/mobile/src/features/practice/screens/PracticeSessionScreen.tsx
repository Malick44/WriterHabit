import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getCanvasCreateRoute } from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors, radius, shadows, spacing, typography } from "@/design/tokens";
import { AssignmentAttachmentUploader } from "@/features/assignments/components";
import { useAssignmentAttachments } from "@/features/assignments/hooks/useAssignmentAttachments";
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

const PRACTICE_GRADE_BAND = "middle" as const;

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
  const skillId = getParamValue(params.skillId);
  const taskId = getParamValue(params.taskId);
  const entry = getPracticeTask(skillId, taskId);
  const session = usePracticeSession({
    estimatedMinutes: entry?.task.estimatedMinutes,
    skillId,
    taskId,
  });
  const attachments = useAssignmentAttachments();
  const [startedCanvas, setStartedCanvas] = useState(false);
  const hasHandwritingEvidence =
    startedCanvas || attachments.attachments.length > 0;

  const handleBackToPractice = useCallback(() => {
    router.navigate(routes.studentPractice);
  }, [router]);

  const handleUseCanvas = useCallback(() => {
    setStartedCanvas(true);
    router.push(getCanvasCreateRoute());
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

              <View style={styles.workSection}>
                <Text
                  style={[
                    getAccessibleTextStyle(type.bodyStrong, settings),
                    styles.workTitle,
                  ]}
                >
                  {t("dailyPractice.workTitle")}
                </Text>
                <Text
                  style={[
                    getAccessibleTextStyle(type.caption, settings),
                    styles.workSubtitle,
                  ]}
                >
                  {t("dailyPractice.workSubtitle")}
                </Text>

                <Button
                  accessibilityLabel={t("dailyPractice.useCanvasAccessibility")}
                  fullWidth
                  label={
                    startedCanvas
                      ? t("dailyPractice.returnToCanvasCta")
                      : t("dailyPractice.useCanvasCta")
                  }
                  onPress={handleUseCanvas}
                  size="md"
                  variant="secondary"
                />

                <AssignmentAttachmentUploader
                  attachments={attachments.attachments}
                  error={attachments.error}
                  gradeBand={PRACTICE_GRADE_BAND}
                  isPicking={attachments.isPicking}
                  onPickFile={() => {
                    void attachments.pickFile();
                  }}
                  onPickPhoto={() => {
                    void attachments.pickPhoto();
                  }}
                  onRemove={attachments.remove}
                  onRetryExtraction={attachments.retryExtraction}
                  onTakePhoto={() => {
                    void attachments.takePhoto();
                  }}
                />
              </View>

              <Button
                accessibilityLabel={t("dailyPractice.completeAccessibility")}
                disabled={!hasHandwritingEvidence}
                fullWidth
                label={t("dailyPractice.completeCta")}
                onPress={() => {
                  void session.complete({
                    attachmentCount: attachments.attachments.length,
                    extractedText: attachments.extractedText,
                    usedCanvas: startedCanvas,
                  });
                }}
                size="md"
                variant="primary"
              />
              {!hasHandwritingEvidence ? (
                <Text
                  style={[
                    getAccessibleTextStyle(type.caption, settings),
                    styles.completionHint,
                  ]}
                >
                  {t("dailyPractice.completionHint")}
                </Text>
              ) : null}
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
  completionHint: {
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
  instruction: {
    color: dashboard.onSurface,
  },
  workSection: {
    gap: spacing.md,
  },
  workSubtitle: {
    color: dashboard.onSurfaceVariant,
  },
  workTitle: {
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
