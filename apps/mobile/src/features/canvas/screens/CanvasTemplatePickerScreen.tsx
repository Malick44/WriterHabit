import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { getCanvasDocumentRoute } from "@/core/navigation/deepLinks";
import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

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
  const [createFailed, setCreateFailed] = useState(false);

  const createFromTemplate = async (template: CanvasTemplate) => {
    setCreatingTemplate(template);
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
          onActionPress={() => setCreateFailed(false)}
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
        <Stack gap="md">
          {canvasTemplateDefinitions.slice(0, gradeAdaptation.visibleTemplateCount).map((definition) => (
            <CanvasTemplateCard
              definition={definition}
              disabled={Boolean(creatingTemplate)}
              gradeBand={gradeBand}
              key={definition.template}
              onSelect={() => {
                void createFromTemplate(definition.template);
              }}
              showDescription={gradeAdaptation.showDetailedTemplates}
            />
          ))}
        </Stack>
      </PageSection>
    </Screen>
  );
}
