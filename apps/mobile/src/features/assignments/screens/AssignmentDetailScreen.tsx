import { createContext, useCallback, useContext, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAssignmentSubmissionRoute, getWritingWorkspaceRoute } from "@/core/navigation/deepLinks";
import { colors, layout, radius, shadows, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { AppHeader } from "@/shared/components/navigation";
import {
  buildAccessibilityLabel,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useAssignmentDetailData } from "../hooks/useAssignments";
import type { AssignmentRecord } from "../types";

type IconName = ComponentProps<typeof Ionicons>["name"];

const detailColors = {
  background: colors.dashboard.background,
  onPrimary: colors.dashboard.onPrimary,
  onSurface: colors.dashboard.onSurface,
  onSurfaceVariant: colors.dashboard.onSurfaceVariant,
  outlineVariant: colors.dashboard.outlineVariant,
  primary: colors.dashboard.primary,
  secondary: colors.dashboard.secondary,
  surface: colors.dashboard.surface,
  surfaceContainer: colors.dashboard.surfaceContainer,
  surfaceLowest: colors.dashboard.surfaceLowest,
} as const;

const detailShadow = {
  boxShadow: "0 4px 12px rgba(11, 28, 48, 0.04)",
} as const;

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const DetailGradeBandContext = createContext<GradeBand>("middle");

function DetailText({
  children,
  color = detailColors.onSurface,
  role = "body",
  style,
}: {
  children: string;
  color?: string;
  role?: keyof typeof typography.gradeBands.middle;
  style?: StyleProp<TextStyle>;
}) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useContext(DetailGradeBandContext);

  return (
    <Text selectable style={[getAccessibleTextStyle(typography.gradeBands[gradeBand][role], settings), { color }, style]}>
      {children}
    </Text>
  );
}

function StateFrame({ children }: { children: ReactNode }) {
  return (
    <View style={styles.stateFrame}>
      <AppHeader
        leftAction={{
          accessibilityLabelKey: "common.back",
          type: "back",
        }}
        style={styles.header}
        titleKey="assignments.detail.headerTitle"
        variant="centered"
      />
      <View style={styles.stateContent}>{children}</View>
    </View>
  );
}

function DetailTile({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.tile, style]}>{children}</View>;
}

function MetricTile({
  icon,
  iconColor,
  label,
  value,
  valueAccessory,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
  value: string;
  valueAccessory?: ReactNode;
}) {
  return (
    <DetailTile style={styles.metricTile}>
      <View style={styles.metricLabelRow}>
        <Ionicons color={iconColor} name={icon} size={18} />
        <DetailText color={detailColors.onSurfaceVariant} role="caption">
          {label}
        </DetailText>
      </View>
      <View style={styles.metricValueRow}>
        <DetailText role="bodyStrong">{value}</DetailText>
        {valueAccessory}
      </View>
    </DetailTile>
  );
}

function DifficultyBars({ difficulty }: { difficulty: AssignmentRecord["difficulty"] }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.difficultyBars}>
      <View style={[styles.difficultyBar, styles.difficultyBarOne]} />
      <View
        style={[
          styles.difficultyBar,
          styles.difficultyBarTwo,
          difficulty === "easy" ? styles.difficultyBarMuted : null,
        ]}
      />
      <View
        style={[
          styles.difficultyBar,
          styles.difficultyBarThree,
          difficulty !== "challenging" ? styles.difficultyBarMuted : null,
        ]}
      />
    </View>
  );
}

function RubricList({ assignment }: { assignment: AssignmentRecord }) {
  const { t } = useI18n();

  return (
    <View
      accessibilityLabel={t("assignments.detail.rubricAccessibility")}
      accessible
      style={styles.rubricCard}
      testID="assignment-detail-rubric"
    >
      {assignment.rubric.map((item, index) => (
        <View
          key={item.id}
          style={[styles.rubricRow, index < assignment.rubric.length - 1 ? styles.rubricDivider : null]}
        >
          <View style={styles.rubricCopy}>
            <DetailText role="body">{item.label}</DetailText>
            {item.description ? (
              <DetailText color={detailColors.onSurfaceVariant} role="caption" style={styles.rubricDescription}>
                {item.description}
              </DetailText>
            ) : null}
          </View>
          <Ionicons color={detailColors.outlineVariant} name="ellipse-outline" size={22} />
        </View>
      ))}
    </View>
  );
}

function AssignmentContent({
  assignment,
  hintVisible,
  isOffline,
  onRefresh,
}: {
  assignment: AssignmentRecord;
  hintVisible: boolean;
  isOffline: boolean;
  onRefresh: () => void;
}) {
  const { t } = useI18n();
  const skillFocus = assignment.skillFocus.map((skill) => t(`assignments.skills.${skill}`)).join(", ");
  const hintText = assignment.instructions[0] ?? assignment.teacherNote ?? t("assignments.detail.safetyNote");

  return (
    <>
      <AppHeader
        leftAction={{
          accessibilityLabelKey: "common.back",
          type: "back",
        }}
        style={styles.header}
        titleKey="assignments.detail.headerTitle"
        variant="centered"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        testID="assignment-detail-screen"
      >
        <View style={styles.content}>
          {isOffline ? (
            <StatusState
              actionLabel={t("assignments.detail.offlineAction")}
              accessibilityLabel={t("assignments.detail.offlineAccessibility")}
              description={t("assignments.detail.offlineDescription")}
              onActionPress={onRefresh}
              title={t("assignments.detail.offlineTitle")}
              tone="warning"
            />
          ) : null}

          <View
            accessibilityLabel={buildAccessibilityLabel([t("assignments.detail.promptAccessibility"), assignment.prompt])}
            accessible
            style={styles.promptSection}
            testID="assignment-detail-prompt"
          >
            <DetailText color={detailColors.primary} role="title" style={styles.promptText}>
              {assignment.prompt}
            </DetailText>
          </View>

          {hintVisible ? (
            <DetailTile style={styles.hintCard}>
              <View style={styles.hintTitleRow}>
                <Ionicons color={detailColors.primary} name="bulb-outline" size={20} />
                <DetailText role="label">{t("assignments.detail.hintTitle")}</DetailText>
              </View>
              <DetailText color={detailColors.onSurfaceVariant} role="bodySmall">
                {hintText}
              </DetailText>
            </DetailTile>
          ) : null}

          <View style={styles.bentoGrid}>
            <DetailTile style={styles.skillTile}>
              <View style={styles.skillIcon}>
                <Ionicons color={detailColors.primary} name="radio-button-on" size={20} />
              </View>
              <View style={styles.skillCopy}>
                <DetailText color={detailColors.onSurfaceVariant} role="caption">
                  {t("assignments.detail.skillsSectionTitle")}
                </DetailText>
                <DetailText role="bodyStrong">{skillFocus || t("assignments.detail.generalWriting")}</DetailText>
              </View>
            </DetailTile>

            <View style={styles.metricGrid}>
              <MetricTile
                icon="time-outline"
                iconColor={detailColors.primary}
                label={t("assignments.detail.estimatedTimeLabel")}
                value={t("assignments.detail.estimatedTime", { count: assignment.estimatedMinutes })}
              />
              <MetricTile
                icon="bar-chart-outline"
                iconColor={detailColors.secondary}
                label={t("assignments.detail.difficultyLabel")}
                value={t(`assignments.difficulty.${assignment.difficulty}`)}
                valueAccessory={<DifficultyBars difficulty={assignment.difficulty} />}
              />
            </View>
          </View>

          {assignment.rubric.length > 0 ? (
            <View style={styles.rubricSection}>
              <DetailText role="title" style={styles.sectionTitle}>
                {t("assignments.detail.successCriteriaTitle")}
              </DetailText>
              <RubricList assignment={assignment} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

export function AssignmentDetailScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const state = useAssignmentDetailData(assignmentId);
  const [hintVisible, setHintVisible] = useState(false);
  const contentWidth = Math.min(width, 480);

  const handleHintPress = useCallback(() => {
    setHintVisible((current) => !current);
  }, []);

  const startWriting = useCallback(async () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    const startedAssignment = await state.startAssignment();

    if (startedAssignment) {
      router.push(getWritingWorkspaceRoute(startedAssignment.id));
    }
  }, [router, state]);

  const openSubmit = useCallback(() => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    router.push(getAssignmentSubmissionRoute(state.viewModel.assignment.id));
  }, [router, state]);

  const handlePrimaryPress = useCallback(() => {
    if (state.status !== "success") {
      return;
    }

    if (state.viewModel.canSubmit) {
      openSubmit();
      return;
    }

    void startWriting();
  }, [openSubmit, startWriting, state]);

  if (state.status === "loading") {
    return (
      <StateFrame>
        <LoadingState
          accessibilityLabel={t("assignments.detail.loadingAccessibility")}
          description={t("assignments.detail.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("assignments.detail.loadingTitle")}
          testID="assignment-detail-loading"
        />
      </StateFrame>
    );
  }

  if (state.status === "error") {
    return (
      <StateFrame>
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("assignments.detail.errorAccessibility")}
          description={t("assignments.detail.errorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="assignment-detail-error"
          title={t("assignments.detail.errorTitle")}
        />
      </StateFrame>
    );
  }

  if (state.status === "missing") {
    return (
      <StateFrame>
        <EmptyState
          actionLabel={t("assignments.detail.missingAction")}
          accessibilityLabel={t("assignments.detail.missingAccessibility")}
          description={t("assignments.detail.missingDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push("/(student)/assignments/history")}
          testID="assignment-detail-missing"
          title={t("assignments.detail.missingTitle")}
        />
      </StateFrame>
    );
  }

  const assignment = state.viewModel.assignment;

  return (
    <View style={[styles.root, { paddingBottom: 0 }]}>
      <View style={[styles.phoneFrame, { maxWidth: contentWidth }]}>
        {assignment ? (
          <DetailGradeBandContext.Provider value={state.gradeBand}>
            <AssignmentContent
              assignment={assignment}
              hintVisible={hintVisible}
              isOffline={state.viewModel.isOffline}
              onRefresh={state.refetch}
            />
          </DetailGradeBandContext.Provider>
        ) : null}
      </View>
      <View
        pointerEvents="box-none"
        style={[
          styles.footerFrame,
          {
            maxWidth: contentWidth,
            paddingBottom: Math.max(insets.bottom, spacing.xl),
          },
        ]}
      >
        <View style={styles.bottomBarSurface}>
          {/* Shared Button does not forward accessibilityState, so the hint
              toggle uses Pressable to expose its expanded/collapsed state. */}
          <Pressable
            accessibilityHint={t("assignments.detail.hintButtonHint")}
            accessibilityLabel={t("assignments.detail.hintButtonAccessibility")}
            accessibilityRole="button"
            accessibilityState={{ expanded: hintVisible }}
            onPress={handleHintPress}
            style={({ pressed }) => [styles.hintButton, pressed ? styles.hintButtonPressed : null]}
          >
            <Ionicons color={detailColors.onSurface} name="bulb-outline" size={20} />
            <DetailText role="button" style={styles.hintButtonText}>
              {t("assignments.detail.hintCta")}
            </DetailText>
          </Pressable>
          <Button
            accessibilityHint={
              state.viewModel.canSubmit ? t("assignments.submit.hint") : t("assignments.detail.startWritingHint")
            }
            accessibilityLabel={
              state.viewModel.canSubmit
                ? t("assignments.submit.ctaAccessibility")
                : t("assignments.detail.startWritingAccessibility")
            }
            disabled={!state.viewModel.canStartWriting && !state.viewModel.canSubmit}
            fullWidth
            label={state.viewModel.canSubmit ? t("assignments.submit.reviewCta") : t("assignments.detail.startWritingCta")}
            loading={state.startStatus === "loading"}
            onPress={handlePrimaryPress}
            size="md"
            style={styles.primaryButton}
            variant="primary"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bentoGrid: {
    gap: spacing.md,
  },
  bottomBarSurface: {
    alignItems: "center",
    backgroundColor: detailColors.surfaceLowest,
    borderColor: "rgba(195, 198, 213, 0.3)",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: 20,
    paddingTop: spacing.lg,
    ...shadows.card,
  },
  content: {
    gap: spacing.xxl,
    paddingHorizontal: 20,
    paddingTop: spacing.xl,
    width: "100%",
  },
  difficultyBar: {
    backgroundColor: detailColors.secondary,
    borderRadius: radius.xs,
    width: 6,
  },
  difficultyBarMuted: {
    backgroundColor: detailColors.outlineVariant,
  },
  difficultyBarOne: {
    height: 8,
  },
  difficultyBarThree: {
    height: 16,
  },
  difficultyBarTwo: {
    height: 12,
  },
  difficultyBars: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 2,
    height: 16,
  },
  footerFrame: {
    alignSelf: "center",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    width: "100%",
  },
  header: {
    backgroundColor: "rgba(248, 249, 255, 0.95)",
    borderBottomWidth: 0,
    paddingBottom: spacing.sm,
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
  },
  hintButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: detailColors.outlineVariant,
    borderRadius: radius.full,
    borderWidth: 2,
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing.sm,
    height: 52,
    justifyContent: "center",
    minWidth: 104,
    paddingHorizontal: spacing.lg,
  },
  hintButtonPressed: {
    opacity: 0.7,
  },
  hintButtonText: {
    fontWeight: "800",
  },
  hintCard: {
    gap: spacing.sm,
  },
  hintTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metricLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricTile: {
    flex: 1,
    gap: spacing.sm,
  },
  metricValueRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  phoneFrame: {
    alignSelf: "center",
    backgroundColor: detailColors.surface,
    flex: 1,
    overflow: "hidden",
    width: "100%",
  },
  primaryButton: {
    backgroundColor: detailColors.primary,
    borderColor: detailColors.primary,
    borderRadius: radius.full,
    height: 52,
  },
  promptSection: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    textAlign: "center",
  },
  promptText: {
    textAlign: "center",
  },
  root: {
    backgroundColor: detailColors.surface,
    flex: 1,
  },
  rubricCard: {
    backgroundColor: detailColors.surfaceLowest,
    borderColor: detailColors.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...detailShadow,
  },
  rubricCopy: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  rubricDescription: {
    flexShrink: 1,
  },
  rubricDivider: {
    borderBottomColor: "rgba(195, 198, 213, 0.5)",
    borderBottomWidth: 1,
  },
  rubricRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  rubricSection: {
    gap: spacing.lg,
  },
  scrollContent: {
    paddingBottom: 144,
  },
  sectionTitle: {
    fontWeight: "800",
  },
  skillCopy: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 40,
  },
  skillIcon: {
    alignItems: "center",
    backgroundColor: detailColors.surfaceContainer,
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  skillTile: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
  },
  stateContent: {
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
    maxWidth: layout.maxContentWidth,
    padding: 20,
    width: "100%",
  },
  stateFrame: {
    backgroundColor: detailColors.surface,
    flex: 1,
  },
  tile: {
    backgroundColor: detailColors.surfaceLowest,
    borderColor: detailColors.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...detailShadow,
  },
});
