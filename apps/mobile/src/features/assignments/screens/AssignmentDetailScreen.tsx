import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getAssignmentSubmissionRoute, getWritingWorkspaceRoute } from "@/core/navigation/deepLinks";
import { colors, radius, spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import { useGlacierThemeStore } from "@/shared/theme/glacierThemeStore";
import { Button } from "@/shared/components/buttons";

import { useAssignmentDetailData } from "../hooks/useAssignments";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function AssignmentDetailScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const state = useAssignmentDetailData(assignmentId);
  const { primaryColor, tertiaryColor, fontSizeScale } = useGlacierThemeStore();

  const startWriting = async () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    const startedAssignment = await state.startAssignment();

    if (startedAssignment) {
      router.push(getWritingWorkspaceRoute(startedAssignment.id));
    }
  };

  const startCanvas = async () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    const startedAssignment = await state.startAssignment();

    if (startedAssignment) {
      router.push({
        pathname: "/(student)/canvas/templates",
        params: { assignmentId: startedAssignment.id },
      });
    }
  };

  const openSubmit = () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    router.push(getAssignmentSubmissionRoute(state.viewModel.assignment.id));
  };

  // Custom sub-page header matching Stitch design
  const subPageHeader = (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <Pressable
        accessibilityLabel={t("common.back")}
        accessibilityRole="button"
        onPress={() => router.back()}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="arrow-back" size={20} color={primaryColor} />
      </Pressable>
      <Text
        style={{
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: Math.round(15 * fontSizeScale),
          fontWeight: "700",
        }}
      >
        {t("assignments.detail.headerTitle")}
      </Text>
      <Pressable
        accessibilityLabel={t("assignments.detail.bookmark")}
        accessibilityRole="button"
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="bookmark-outline" size={20} color={primaryColor} />
      </Pressable>
    </View>
  );

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      testID="assignment-detail-screen"
      title=""
    >
      {subPageHeader}

      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("assignments.detail.loadingAccessibility")}
          description={t("assignments.detail.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("assignments.detail.loadingTitle")}
          testID="assignment-detail-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("assignments.detail.errorAccessibility")}
          description={t("assignments.detail.errorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="assignment-detail-error"
          title={t("assignments.detail.errorTitle")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("assignments.detail.missingAction")}
          accessibilityLabel={t("assignments.detail.missingAccessibility")}
          description={t("assignments.detail.missingDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push("/(student)/assignments/history")}
          testID="assignment-detail-missing"
          title={t("assignments.detail.missingTitle")}
        />
      ) : null}

      {state.status === "success" && state.viewModel.assignment ? (() => {
        const assignment = state.viewModel.assignment;
        if (!assignment) return null;

        return (
          <Stack gap="lg">
            {state.viewModel.isOffline ? (
              <StatusState
                actionLabel={t("assignments.detail.offlineAction")}
                accessibilityLabel={t("assignments.detail.offlineAccessibility")}
                description={t("assignments.detail.offlineDescription")}
                gradeBand={state.gradeBand}
                onActionPress={state.refetch}
                title={t("assignments.detail.offlineTitle")}
                tone="warning"
              />
            ) : null}

            {/* Centered Prompt Section */}
            <View style={{ alignItems: "center", paddingVertical: spacing.lg, paddingHorizontal: spacing.md }}>
              <Text
                style={{
                  fontSize: Math.round(22 * fontSizeScale),
                  fontWeight: "700",
                  textAlign: "center",
                  color: primaryColor,
                  lineHeight: Math.round(28 * fontSizeScale),
                }}
              >
                {assignment.prompt}
              </Text>
            </View>

            {/* Bento-style Detail Cards */}
            <Stack gap="md">
              {/* Skill Focus (Spans Full Width) */}
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                  borderCurve: "continuous",
                  borderRadius: radius.md,
                  borderWidth: 1,
                  padding: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="disc-outline" size={20} color={tertiaryColor} />
                </View>
                <View>
                  <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: Math.round(11 * fontSizeScale) }}>
                    {t("assignments.detail.skillsSectionTitle")}
                  </Text>
                  <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: Math.round(14 * fontSizeScale), fontWeight: "600" }}>
                    {assignment.skillFocus.map((s) => t(`assignments.skills.${s}` as any)).join(", ") || t("assignments.detail.generalWriting")}
                  </Text>
                </View>
              </View>

              {/* Time and Difficulty Grid */}
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                {/* Estimated Time Card */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    borderCurve: "continuous",
                    borderRadius: radius.md,
                    borderWidth: 1,
                    padding: spacing.md,
                    gap: spacing.sm,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    <Ionicons name="time-outline" size={16} color={primaryColor} />
                    <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: Math.round(11 * fontSizeScale) }}>
                      {t("assignments.detail.estimatedTimeLabel")}
                    </Text>
                  </View>
                  <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: Math.round(15 * fontSizeScale), fontWeight: "700" }}>
                    {t("common.minutes", { count: assignment.estimatedMinutes })}
                  </Text>
                </View>

                {/* Difficulty Card */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    borderCurve: "continuous",
                    borderRadius: radius.md,
                    borderWidth: 1,
                    padding: spacing.md,
                    gap: spacing.sm,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    <Ionicons name="bar-chart-outline" size={16} color={tertiaryColor} />
                    <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: Math.round(11 * fontSizeScale) }}>
                      {t("assignments.detail.difficultyLabel")}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: Math.round(15 * fontSizeScale), fontWeight: "700" }}>
                      {t(`assignments.difficulty.${assignment.difficulty}`)}
                    </Text>
                    {/* Difficulty level bars */}
                    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 14 }}>
                      <View style={{ width: 3, height: 6, backgroundColor: tertiaryColor, borderRadius: 1 }} />
                      <View
                        style={{
                          width: 3,
                          height: 10,
                          backgroundColor: assignment.difficulty !== "easy" ? tertiaryColor : "rgba(255, 255, 255, 0.15)",
                          borderRadius: 1,
                        }}
                      />
                      <View
                        style={{
                          width: 3,
                          height: 14,
                          backgroundColor: assignment.difficulty === "challenging" ? tertiaryColor : "rgba(255, 255, 255, 0.15)",
                          borderRadius: 1,
                        }}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </Stack>

            {/* Success Criteria List */}
            {assignment.rubric.length > 0 ? (
              <PageSection
                gradeBand={state.gradeBand}
                title={t("assignments.detail.rubricSectionTitle")}
              >
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    borderCurve: "continuous",
                    borderRadius: radius.md,
                    borderWidth: 1,
                    overflow: "hidden",
                  }}
                >
                  {assignment.rubric.map((item, index) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: spacing.md,
                        borderBottomWidth: index < assignment.rubric.length - 1 ? 1 : 0,
                        borderBottomColor: "rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <View style={{ flex: 1, marginRight: spacing.md }}>
                        <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: Math.round(14 * fontSizeScale), fontWeight: "500" }}>
                          {item.label}
                        </Text>
                        {item.description ? (
                          <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: Math.round(12 * fontSizeScale), marginTop: 2 }}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="ellipse-outline" size={20} color="rgba(255, 255, 255, 0.3)" />
                    </View>
                  ))}
                </View>
              </PageSection>
            ) : null}

            {/* Action Panel */}
            <View style={{ paddingVertical: spacing.md, gap: spacing.md }}>
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <Button
                  accessibilityHint={t("studentHome.todayAssignment.startHint")}
                  accessibilityLabel={t("studentHome.todayAssignment.startAccessibility")}
                  gradeBand={state.gradeBand}
                  label={t("studentHome.todayAssignment.startCta")}
                  onPress={startWriting}
                  style={{ flex: 1 }}
                  size={state.gradeBand === "elementary" ? "lg" : "md"}
                />
                {state.viewModel.canStartCanvas ? (
                  <Button
                    accessibilityHint={t("assignments.detail.startCanvasHint" as any)}
                    accessibilityLabel={t("assignments.detail.startCanvasAccessibility" as any)}
                    gradeBand={state.gradeBand}
                    label={t("assignments.detail.startCanvasCta" as any)}
                    onPress={startCanvas}
                    style={{ flex: 1 }}
                    size={state.gradeBand === "elementary" ? "lg" : "md"}
                    variant="secondary"
                  />
                ) : null}
              </View>
              {state.viewModel.canSubmit ? (
                <Button
                  accessibilityHint={t("assignments.submit.hint")}
                  accessibilityLabel={t("assignments.submit.ctaAccessibility")}
                  gradeBand={state.gradeBand}
                  label={t("assignments.submit.reviewCta")}
                  onPress={openSubmit}
                  size={state.gradeBand === "elementary" ? "lg" : "md"}
                  variant="primary"
                />
              ) : null}
            </View>
          </Stack>
        );
      })() : null}
    </Screen>
  );
}
