import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { getCanvasDocumentRoute } from "@/core/navigation/deepLinks";
import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { ErrorState, LoadingState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout";

import { canvasApi } from "../api/canvasApi";
import type { CanvasDocumentSummary, CanvasTemplate } from "../types";

const DEFAULT_TEMPLATE: CanvasTemplate = "blank_page";
const RESUME_LOOKUP_TIMEOUT_MS = 1500;

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Finds the most recent draft to resume instead of always creating a new page.
 * When opened from an assignment, only that assignment's canvases are eligible;
 * otherwise we resume a standalone, not-yet-attached draft.
 */
function findResumableDraft(
  documents: CanvasDocumentSummary[],
  assignmentId: string | undefined,
): CanvasDocumentSummary | null {
  const candidates = assignmentId
    ? documents.filter((document) => document.assignmentId === assignmentId)
    : documents.filter((document) => !document.assignmentId && !document.isAttached);

  if (candidates.length === 0) {
    return null;
  }

  // updatedAt is ISO-8601, so a lexicographic max is also the most recent.
  return candidates.reduce((latest, document) => (document.updatedAt > latest.updatedAt ? document : latest));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);
}

export function CanvasCreateScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session } = useAuthSession();
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const gradeBand = gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
  const [openFailed, setOpenFailed] = useState(false);
  const isOpeningRef = useRef(false);

  const redirectToCanvas = useCallback(
    (canvasId: string, canvasAssignmentId: string | undefined) => {
      router.replace(getCanvasDocumentRoute(canvasId, canvasAssignmentId));
    },
    [router],
  );

  const resumeOrCreate = useCallback(async () => {
    if (isOpeningRef.current) {
      return;
    }

    isOpeningRef.current = true;

    try {
      // Resume the latest in-progress draft so re-entering the canvas does not
      // pile up empty blank pages; only create a new one when none exists.
      const listResponse = await withTimeout(
        canvasApi.getCanvases({ gradeLevel, studentId }),
        RESUME_LOOKUP_TIMEOUT_MS,
      );
      const draft = listResponse ? findResumableDraft(listResponse.documents, assignmentId) : null;

      if (draft) {
        redirectToCanvas(draft.id, assignmentId ?? draft.assignmentId);
        return;
      }

      const document = await canvasApi.createCanvas({
        assignmentId,
        gradeLevel,
        studentId,
        template: DEFAULT_TEMPLATE,
      });

      redirectToCanvas(document.id, assignmentId);
    } catch {
      setOpenFailed(true);
    } finally {
      isOpeningRef.current = false;
    }
  }, [assignmentId, gradeLevel, redirectToCanvas, studentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resumes or creates the canvas once on mount; only sets state on async failure
    void resumeOrCreate();
  }, [resumeOrCreate]);

  return (
    <Screen
      backgroundColor={colors.gradeBand[gradeBand].background}
      gradeBand={gradeBand}
      subtitle={t("canvas.workspace.subtitle")}
      testID="canvas-create-screen"
      title={t("canvas.workspace.loadingTitle")}
    >
      {openFailed ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("canvas.workspace.errorAccessibility")}
          description={t("canvas.workspace.errorDescription")}
          gradeBand={gradeBand}
          onActionPress={() => {
            setOpenFailed(false);
            void resumeOrCreate();
          }}
          title={t("canvas.workspace.errorTitle")}
        />
      ) : (
        <LoadingState
          accessibilityLabel={t("canvas.workspace.loadingAccessibility")}
          description={t("canvas.workspace.loadingDescription")}
          gradeBand={gradeBand}
          label={t("canvas.workspace.loadingTitle")}
          testID="canvas-create-loading"
        />
      )}
    </Screen>
  );
}
