import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPracticeTaskRoute } from "@/core/navigation/deepLinks";
import { colors, radius, shadows, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { ComposerSurface } from "@/shared/components/layout";
import {
  AppHeader,
  BOTTOM_MENU_SCROLL_EVENT_THROTTLE,
  useBottomMenuScrollHandler,
} from "@/shared/components/navigation";
import {
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { practiceSkills, type PracticeSkill } from "../data/practiceCatalog";
import { skillToneColors } from "../practiceTheme";

const dashboard = colors.dashboard;
const type = typography.gradeBands.middle;

function SkillCard({
  skill,
  onPress,
}: {
  skill: PracticeSkill;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const tone = skillToneColors[skill.tone];

  return (
    <Pressable
      accessibilityHint={t("dailyPractice.home.openSkillAccessibility", {
        title: skill.title,
      })}
      accessibilityLabel={t("dailyPractice.home.skillAccessibility", {
        title: skill.title,
        description: skill.description,
      })}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={[styles.iconChip, { backgroundColor: tone.bg }]}>
        <Ionicons color={tone.fg} name={skill.icon} size={20} />
      </View>
      <Text
        style={[getAccessibleTextStyle(type.label, settings), styles.cardTitle]}
      >
        {skill.title}
      </Text>
      <Text
        numberOfLines={2}
        style={[
          getAccessibleTextStyle(type.caption, settings),
          styles.cardDescription,
        ]}
      >
        {skill.description}
      </Text>
      <View style={styles.cardFooter}>
        <Text
          style={[
            getAccessibleTextStyle(type.caption, settings),
            styles.taskCount,
          ]}
        >
          {t("dailyPractice.home.taskCount", { count: skill.tasks.length })}
        </Text>
        <Ionicons color={dashboard.primary} name="arrow-forward" size={16} />
      </View>
    </Pressable>
  );
}

export function PracticeHomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { settings } = useAccessibilityContext();
  const handleBottomMenuScroll = useBottomMenuScrollHandler();

  return (
    <ComposerSurface>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <AppHeader
          showSafeArea={false}
          style={styles.header}
          titleKey="dailyPractice.home.title"
          variant="transparent"
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={handleBottomMenuScroll}
          scrollEventThrottle={BOTTOM_MENU_SCROLL_EVENT_THROTTLE}
          showsVerticalScrollIndicator={false}
          testID="practice-home-screen"
        >
          <Text
            style={[
              getAccessibleTextStyle(type.body, settings),
              styles.subtitle,
            ]}
          >
            {t("dailyPractice.home.subtitle")}
          </Text>

          <View style={styles.grid}>
            {practiceSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                onPress={() => router.push(getPracticeTaskRoute(skill.id))}
                skill={skill}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
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
    gap: spacing.sm,
    padding: spacing.lg,
    width: "48%",
    ...shadows.card,
  },
  cardDescription: {
    color: dashboard.onSurfaceVariant,
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTitle: {
    color: dashboard.onSurface,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  header: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },
  iconChip: {
    alignItems: "center",
    borderRadius: radius.lg,
    height: 40,
    justifyContent: "center",
    marginBottom: spacing.xs,
    width: 40,
  },
  safeArea: {
    backgroundColor: "transparent",
    flex: 1,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  subtitle: {
    color: dashboard.onSurfaceVariant,
  },
  taskCount: {
    color: dashboard.tertiaryText,
    fontWeight: "600",
  },
});
