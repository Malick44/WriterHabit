import type {
  DraftRecord,
  RubricCriterionRecord,
  StudentAssignmentWithAssignment,
} from "../data/types";
import {
  mapDailySelection,
  mapDraftSummary,
  mapInstructions,
  mapStudentAssignmentSummary,
} from "./writing-loop.mapper";
import {
  localizedCopy,
  type LocalizedCopy,
} from "../routes/writing-shared";

export interface AssignmentRubricCriterionApiResponse {
  description: LocalizedCopy;
  id: string;
  label: LocalizedCopy;
  maxScore: number;
  skill: string;
}

export interface AssignmentDetailApiResponse extends ReturnType<typeof mapStudentAssignmentSummary> {
  draft: ReturnType<typeof mapDraftSummary> | null;
  instructions: LocalizedCopy[];
  rubric: AssignmentRubricCriterionApiResponse[];
  rubricId: string;
  submittedAt: string | null;
  teacherNote: LocalizedCopy | null;
}

export interface AssignmentHistoryApiResponse {
  items: ReturnType<typeof mapStudentAssignmentSummary>[];
  nextCursor: string | null;
}

export interface MobileAssignmentViewModel {
  assignedLabel: string;
  assignmentType: string;
  currentSubmissionId?: string;
  difficulty: string;
  draft: {
    canvasPageCount: number;
    lastEditedLabel: string;
    preview: string;
    revisionNumber: number;
    wordCount: number;
  } | null;
  dueLabel: string;
  estimatedMinutes: number;
  gradeLevelMax: number;
  gradeLevelMin: number;
  id: string;
  instructions: string[];
  prompt: string;
  rubric: {
    description: string;
    id: string;
    label: string;
  }[];
  rubricId: string;
  skillFocus: string[];
  status: string;
  studentAssignmentId?: string;
  submittedLabel?: string;
  teacherNote?: string;
  title: string;
}

export function mapAssignmentHistoryApiResponse(
  records: readonly StudentAssignmentWithAssignment[],
): AssignmentHistoryApiResponse {
  return {
    items: records.map((record) => mapStudentAssignmentSummary(record)),
    nextCursor: null,
  };
}

export function mapDailyAssignmentApiResponse(record: StudentAssignmentWithAssignment) {
  return {
    ...mapStudentAssignmentSummary(record),
    selection: mapDailySelection(record.dailySelectionMetadata, record.assignment.difficulty),
  };
}

export function mapStartedAssignmentApiResponse(input: {
  record: StudentAssignmentWithAssignment;
  startedAt: string;
}) {
  return {
    ...mapStudentAssignmentSummary(input.record),
    startedAt: input.startedAt,
  };
}

export function mapAssignmentDetailApiResponse(input: {
  draft: DraftRecord | null;
  record: StudentAssignmentWithAssignment;
  rubric: readonly RubricCriterionRecord[];
}): AssignmentDetailApiResponse {
  return {
    ...mapStudentAssignmentSummary(input.record),
    draft: input.draft ? mapDraftSummary(input.draft) : null,
    instructions: mapInstructions(input.record.assignment.instructions),
    rubric: input.rubric.map(mapRubricCriterionApiResponse),
    rubricId: input.record.assignment.rubricId,
    submittedAt: input.record.submittedAt,
    teacherNote:
      input.record.teacherNoteKey && input.record.teacherNoteFallback
        ? localizedCopy(input.record.teacherNoteKey, input.record.teacherNoteFallback)
        : null,
  };
}

export function mapAssignmentDetailToMobileViewModel(response: AssignmentDetailApiResponse): MobileAssignmentViewModel {
  return {
    assignedLabel: "Assigned",
    assignmentType: response.assignmentType,
    ...(response.currentSubmissionId ? { currentSubmissionId: response.currentSubmissionId } : {}),
    difficulty: response.difficulty,
    draft: response.draft
      ? {
          canvasPageCount: response.draft.canvasPageCount,
          lastEditedLabel: "Saved recently",
          preview: response.draft.preview || "Start writing...",
          revisionNumber: response.draft.revisionNumber,
          wordCount: response.draft.wordCount,
        }
      : null,
    dueLabel: response.dueAt ? response.dueAt.slice(0, 10) : "Today",
    estimatedMinutes: response.estimatedMinutes,
    gradeLevelMax: response.gradeLevelMax,
    gradeLevelMin: response.gradeLevelMin,
    id: response.assignmentId,
    instructions: response.instructions.map((instruction) => instruction.fallback),
    prompt: response.prompt.fallback,
    rubric: response.rubric.map((criterion) => ({
      description: criterion.description.fallback,
      id: criterion.id,
      label: criterion.label.fallback,
    })),
    rubricId: response.rubricId,
    skillFocus: response.skillFocus,
    status: response.status,
    studentAssignmentId: response.studentAssignmentId,
    ...(response.submittedAt ? { submittedLabel: "Submitted recently" } : {}),
    ...(response.teacherNote ? { teacherNote: response.teacherNote.fallback } : {}),
    title: response.title.fallback,
  };
}

export function mapAssignmentHistoryToMobileViewModels(
  response: AssignmentHistoryApiResponse,
): MobileAssignmentViewModel[] {
  return response.items.map((item) =>
    mapAssignmentDetailToMobileViewModel({
      ...item,
      draft: null,
      instructions: [],
      rubric: [],
      rubricId: "unknown-rubric",
      submittedAt: null,
      teacherNote: null,
    }),
  );
}

function mapRubricCriterionApiResponse(criterion: RubricCriterionRecord): AssignmentRubricCriterionApiResponse {
  return {
    description: localizedCopy(criterion.descriptionKey, criterion.descriptionFallback),
    id: criterion.id,
    label: localizedCopy(criterion.labelKey, criterion.labelFallback),
    maxScore: criterion.maxScore,
    skill: criterion.skill,
  };
}
