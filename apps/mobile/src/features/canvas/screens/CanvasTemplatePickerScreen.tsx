import { useMemo, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { getCanvasDocumentRoute } from "@/core/navigation/deepLinks";
import { colors, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen } from "@/shared/components/layout";

import { canvasApi } from "../api/canvasApi";
import { CanvasTemplateCard } from "../components";
import { canvasTemplateDefinitions, getCanvasGradeAdaptation } from "../services/canvasDocumentService";
import type { CanvasTemplate } from "../types";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function CanvasTemplatePickerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session } = useAuthSession();
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const gradeBand = gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
  const gradeAdaptation = getCanvasGradeAdaptation(gradeLevel);
  const [creatingTemplate, setCreatingTemplate] = useState<CanvasTemplate | null>(null);
  const [lastAttemptedTemplate, setLastAttemptedTemplate] = useState<CanvasTemplate | null>(null);
  const [createFailed, setCreateFailed] = useState(false);

  const createFromTemplate = async (template: CanvasTemplate) => {
    setCreatingTemplate(template);
    setLastAttemptedTemplate(template);
    setCreateFailed(false);

    try {
      const document = await canvasApi.createCanvas({
        assignmentId,
        gradeLevel,
        studentId,
        template,
      });

      router.push(getCanvasDocumentRoute(document.id, assignmentId));
    } catch {
      setCreateFailed(true);
    } finally {
      setCreatingTemplate(null);
    }
  };

  return (
    <Screen
      backgroundColor={colors.gradeBand[gradeBand].background}
      gradeBand={gradeBand}
      subtitle={assignmentId ? t("canvas.templates.assignmentSubtitle") : t("canvas.templates.subtitle")}
      testID="canvas-template-picker-screen"
      title={t("canvas.templates.title")}
    >
      {creatingTemplate ? (
        <LoadingState
          accessibilityLabel={t("canvas.templates.creatingAccessibility")}
          description={t("canvas.templates.creatingDescription")}
          gradeBand={gradeBand}
          label={t("canvas.templates.creatingTitle")}
          testID="canvas-template-creating"
        />
      ) : null}

      {createFailed ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("canvas.templates.errorAccessibility")}
          description={t("canvas.templates.errorDescription")}
          gradeBand={gradeBand}
          onActionPress={() => {
            if (lastAttemptedTemplate) {
              void createFromTemplate(lastAttemptedTemplate);
              return;
            }

            setCreateFailed(false);
          }}
          title={t("canvas.templates.errorTitle")}
        />
      ) : null}

      {assignmentId ? (
        <StatusState
          accessibilityLabel={t("canvas.templates.assignmentAccessibility")}
          description={t("canvas.templates.assignmentDescription")}
          gradeBand={gradeBand}
          title={t("canvas.templates.assignmentTitle")}
          tone="info"
        />
      ) : null}

      <PageSection
        gradeBand={gradeBand}
        subtitle={t("canvas.templates.sectionSubtitle")}
        title={t("canvas.templates.sectionTitle")}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {canvasTemplateDefinitions.slice(0, gradeAdaptation.visibleTemplateCount).map((definition) => (
            <View key={definition.template} style={{ flexBasis: "47%", flexGrow: 1, minWidth: 150 }}>
              <CanvasTemplateCard
                definition={definition}
                disabled={Boolean(creatingTemplate)}
                gradeBand={gradeBand}
                onSelect={() => {
                  void createFromTemplate(definition.template);
                }}
                showDescription={gradeAdaptation.showDetailedTemplates}
              />
            </View>
          ))}
        </View>
      </PageSection>
    </Screen>
  );
}
