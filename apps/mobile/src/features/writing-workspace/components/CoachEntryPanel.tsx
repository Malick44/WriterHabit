import { AiCoachDrawer } from "@/features/ai-coach";
import type { GradeLevel } from "@writewise/shared";
import type { AssignmentRecord } from "@/features/assignments";

import type {
  WritingCanvasAttachment,
  WritingMetrics,
  WritingWorkspaceGradeAdaptation,
} from "../types";

interface CoachEntryPanelProps {
  assignment: AssignmentRecord | null;
  canvasAttachment: WritingCanvasAttachment | null;
  draftText: string;
  gradeAdaptation: WritingWorkspaceGradeAdaptation;
  gradeLevel: GradeLevel;
  isOffline: boolean;
  metrics: WritingMetrics;
  onClose: () => void;
  studentId: string;
  visible: boolean;
}

export function CoachEntryPanel({
  assignment,
  canvasAttachment,
  draftText,
  gradeAdaptation,
  gradeLevel,
  isOffline,
  metrics,
  onClose,
  studentId,
  visible,
}: CoachEntryPanelProps) {
  if (!visible) {
    return null;
  }

  return (
    <AiCoachDrawer
      assignment={assignment}
      canvasContext={
        canvasAttachment
          ? {
              canvasId: canvasAttachment.canvasId,
              pageCount: canvasAttachment.pageCount,
              title: canvasAttachment.title,
              updatedLabel: canvasAttachment.updatedLabel,
            }
          : null
      }
      connectionStatus={isOffline ? "offline_cached" : "online"}
      draftText={draftText}
      gradeBand={gradeAdaptation.band}
      gradeLevel={gradeLevel}
      metrics={metrics}
      onClose={onClose}
      studentId={studentId}
      visibleActionCount={gradeAdaptation.visibleCoachActionCount}
    />
  );
}
