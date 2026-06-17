import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getPracticeSessionRoute } from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors, radius, shadows, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState } from "@/shared/components/feedback";
import { ComposerSurface } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import {
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { getPracticeSkill, type PracticeTask } from "../data/practiceCatalog";
import { skillToneColors } from "../practiceTheme";

const dashboard = colors.dashboard;
const type = typography.gradeBands.middle;

function getParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function TaskRow({
  task,
  onPress,
}: {
  task: PracticeTask;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const meta = `${t(`assignments.difficulty.${task.difficulty}`)} · ${t(
    "common.minutes",
    {
      count: task.estimatedMinutes,
    },
  )}`;

  return (
    <Pressable
      accessibilityHint={t("dailyPractice.picker.openTaskAccessibility", {
        title: task.title,
      })}
      accessibilityLabel={`${task.title}. ${t(
        "dailyPractice.picker.taskMetaAccessibility",
        {
          difficulty: t(`assignments.difficulty.${task.difficulty}`),
          minutes: task.estimatedMinutes,
        },
      )}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.taskRow, pressed ? styles.pressed : null]}
    >
      <View style={styles.taskBody}>
        <Text
          style={[
            getAccessibleTextStyle(type.label, settings),
            styles.taskTitle,
          ]}
        >
          {task.title}
        </Text>
        <Text
          style={[
            getAccessibleTextStyle(type.caption, settings),
            styles.taskMeta,
          ]}
        >
          {meta}
        </Text>
      </View>
      <Ionicons color={dashboard.primary} name="chevron-forward" size={18} />
    </Pressable>
  );
}

export function PracticeTaskPickerScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { settings } = useAccessibilityContext();
  const params = useLocalSearchParams<{ skillId?: string | string[] }>();
  const skill = getPracticeSkill(getParamValue(params.skillId));

  if (!skill) {
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
              onActionPress={() => router.navigate(routes.studentPractice)}
              title={t("dailyPractice.notFound.title")}
            />
          </View>
        </View>
      </ComposerSurface>
    );
  }

  const tone = skillToneColors[skill.tone];

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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          testID="practice-task-picker-screen"
        >
          <View style={styles.hero}>
            <View style={[styles.iconChip, { backgroundColor: tone.bg }]}>
              <Ionicons color={tone.fg} name={skill.icon} size={24} />
            </View>
            <Text
              accessibilityRole="header"
              style={[
                getAccessibleTextStyle(type.heading, settings),
                styles.heroTitle,
              ]}
            >
              {skill.title}
            </Text>
            <Text
              style={[
                getAccessibleTextStyle(type.body, settings),
                styles.heroDescription,
              ]}
            >
              {skill.description}
            </Text>
          </View>

          <Text
            style={[
              getAccessibleTextStyle(type.caption, settings),
              styles.sectionEyebrow,
            ]}
          >
            {t("dailyPractice.picker.subtitle")}
          </Text>

          <View style={styles.taskList}>
            {skill.tasks.map((task) => (
              <TaskRow
                key={task.id}
                onPress={() =>
                  router.push(getPracticeSessionRoute(skill.id, task.id))
                }
                task={task}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </ComposerSurface>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },
  hero: {
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  heroDescription: {
    color: dashboard.onSurfaceVariant,
  },
  heroTitle: {
    color: dashboard.onSurface,
  },
  iconChip: {
    alignItems: "center",
    borderRadius: radius.lg,
    height: 48,
    justifyContent: "center",
    marginBottom: spacing.xs,
    width: 48,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  root: {
    backgroundColor: "transparent",
    flex: 1,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sectionEyebrow: {
    color: dashboard.outline,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  taskBody: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  taskList: {
    gap: spacing.md,
  },
  taskMeta: {
    color: dashboard.onSurfaceVariant,
  },
  taskRow: {
    alignItems: "center",
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  taskTitle: {
    color: dashboard.onSurface,
    fontWeight: "600",
  },
});
