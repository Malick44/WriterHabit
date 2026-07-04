import type {
  GradeLevel,
  WritingGoal,
  WritingSkill,
} from "@WriterHabit/shared";
import { z } from "zod";

import { apiClient } from "@/core/api/apiClient";
import { supabase } from "@/core/supabase/supabaseClient";
import {
  assignmentDetailResponseSchema,
  assignmentHistoryResponseSchema,
  assignmentScenarioSchema,
  type AssignmentDetailResponse,
  type AssignmentHistoryResponse,
  type AssignmentRecord,
  type AssignmentScenario,
  type AssignmentSubmissionResponse,
} from "../types";
import { getNextStatusOnStart } from "../services/assignmentStatusService";
import {
  selectDailyAssignment,
  type DailyAssignmentHistoryItem,
  type DailyAssignmentTemplate,
} from "../services/dailyAssignmentService";
import type { AssignmentAttachment } from "../services/attachmentTypes";

/** Newest-first cap so history fetches stay bounded for long-running students. */
const ASSIGNMENT_HISTORY_PAGE_SIZE = 50;

interface AssignmentRequestInput {
  gradeLevel?: GradeLevel;
  studentId: string;
}

interface AssignmentDetailRequestInput extends AssignmentRequestInput {
  assignmentId: string;
}

interface AssignmentSubmitRequestInput extends AssignmentDetailRequestInput {
  attachments?: AssignmentAttachment[];
  canvasDocumentIds?: string[];
  clientDraftVersion?: number;
  idempotencyKey?: string;
  typedText?: string;
}

export type SubmissionAttachmentMetadataRow = {
  client_attachment_id: string;
  extracted_text_excerpt: string | null;
  extraction_status: AssignmentAttachment["extraction"]["status"];
  kind: AssignmentAttachment["kind"];
  mime_type: string | null;
  name: string;
  size_bytes: number | null;
  storage_bucket: "submission-attachments";
  storage_object_path: string | null;
  student_profile_id: string;
  submission_id: string;
  upload_status: "failed" | "not_uploaded" | "uploaded";
  uploaded_at: string | null;
};

interface AssignmentDraftSaveRequestInput extends AssignmentDetailRequestInput {
  autosaveVersion: number;
  canvasDocumentIds: string[];
  text: string;
}

const backendDraftResponseSchema = z.object({
  autosaveVersion: z.number().int().min(1),
  canvasDocumentIds: z.array(z.string().min(1)),
  text: z.string(),
  updatedAt: z.string().datetime().optional(),
});

const backendSubmissionResponseSchema = z.object({
  id: z.string().min(1),
  status: z.literal("submitted"),
  submittedAt: z.string().datetime(),
  studentAssignmentId: z.string().min(1),
});

const maxAttachmentNameLength = 240;
const maxAttachmentMimeTypeLength = 120;
const maxAttachmentTextExcerptLength = 1000;
const maxSubmissionAttachmentSizeBytes = 10_000_000;
const submissionAttachmentStorageBucket = "submission-attachments";

type SubmissionAttachmentUploadResult = {
  objectPath: string | null;
  status: SubmissionAttachmentMetadataRow["upload_status"];
  uploadedAt: string | null;
};

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

function createClientIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number): string {
  return value.length <= maxLength
    ? value
    : value.slice(0, maxLength).trimEnd();
}

function sanitizeStorageSegment(value: string): string {
  const sanitized = value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

  return sanitized || "attachment";
}

function inferAttachmentMimeType(attachment: AssignmentAttachment): string {
  if (attachment.mimeType) {
    return attachment.mimeType;
  }

  const lowerName = attachment.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (lowerName.endsWith(".png")) {
    return "image/png";
  }

  if (lowerName.endsWith(".heic")) {
    return "image/heic";
  }

  if (lowerName.endsWith(".heif")) {
    return "image/heif";
  }

  return "image/jpeg";
}

function getAttachmentStorageObjectPath(input: {
  attachment: AssignmentAttachment;
  submissionId: string;
  userId: string;
}): string {
  const nameParts = input.attachment.name.split(".");
  const extension = nameParts.length > 1 ? nameParts.pop() : inferAttachmentMimeType(input.attachment).split("/").pop();
  const baseName = nameParts.join(".") || input.attachment.name;
  const suffix = extension ? `.${sanitizeStorageSegment(extension).slice(0, 16)}` : "";

  return [
    input.userId,
    "submissions",
    input.submissionId,
    `${sanitizeStorageSegment(input.attachment.id)}-${sanitizeStorageSegment(baseName)}${suffix}`,
  ].join("/");
}

async function uploadSubmissionAttachment(input: {
  attachment: AssignmentAttachment;
  submissionId: string;
  userId: string;
}): Promise<SubmissionAttachmentUploadResult> {
  if (
    input.attachment.sizeBytes !== undefined &&
    input.attachment.sizeBytes > maxSubmissionAttachmentSizeBytes
  ) {
    return { objectPath: null, status: "failed", uploadedAt: null };
  }

  const objectPath = getAttachmentStorageObjectPath(input);

  try {
    const response = await fetch(input.attachment.uri);
    if (!response.ok) {
      throw new Error("Attachment file could not be read for upload");
    }

    const blob = await response.blob();
    const { error } = await supabase.storage
      .from(submissionAttachmentStorageBucket)
      .upload(objectPath, blob, {
        contentType: inferAttachmentMimeType(input.attachment),
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return {
      objectPath,
      status: "uploaded",
      uploadedAt: new Date().toISOString(),
    };
  } catch {
    return { objectPath, status: "failed", uploadedAt: null };
  }
}

async function uploadSubmissionAttachments(input: {
  attachments?: AssignmentAttachment[];
  submissionId: string;
  userId: string;
}): Promise<Map<string, SubmissionAttachmentUploadResult>> {
  const results = new Map<string, SubmissionAttachmentUploadResult>();

  if (!input.attachments || input.attachments.length === 0) {
    return results;
  }

  await Promise.all(
    input.attachments.map(async (attachment) => {
      results.set(
        attachment.id,
        await uploadSubmissionAttachment({
          attachment,
          submissionId: input.submissionId,
          userId: input.userId,
        }),
      );
    }),
  );

  return results;
}

export function buildSubmissionAttachmentMetadataRows(input: {
  attachments: AssignmentAttachment[];
  studentProfileId: string;
  submissionId: string;
  uploadResults?: Map<string, SubmissionAttachmentUploadResult>;
}): SubmissionAttachmentMetadataRow[] {
  return input.attachments.map((attachment) => {
    const extractedText = compactWhitespace(attachment.extraction.text);
    const mimeType = attachment.mimeType
      ? truncateText(attachment.mimeType, maxAttachmentMimeTypeLength)
      : null;
    const uploadResult = input.uploadResults?.get(attachment.id);

    return {
      client_attachment_id: attachment.id,
      extracted_text_excerpt: extractedText
        ? truncateText(extractedText, maxAttachmentTextExcerptLength)
        : null,
      extraction_status: attachment.extraction.status,
      kind: attachment.kind,
      mime_type: mimeType,
      name: truncateText(
        compactWhitespace(attachment.name) || attachment.kind,
        maxAttachmentNameLength,
      ),
      size_bytes: Number.isFinite(attachment.sizeBytes)
        ? Math.max(0, Math.floor(attachment.sizeBytes ?? 0))
        : null,
      storage_bucket: submissionAttachmentStorageBucket,
      storage_object_path: uploadResult?.objectPath ?? null,
      student_profile_id: input.studentProfileId,
      submission_id: input.submissionId,
      upload_status: uploadResult?.status ?? "not_uploaded",
      uploaded_at: uploadResult?.uploadedAt ?? null,
    };
  });
}

async function persistSubmissionAttachmentMetadata(input: {
  attachments?: AssignmentAttachment[];
  studentProfileId: string;
  submissionId: string;
  uploadResults?: Map<string, SubmissionAttachmentUploadResult>;
}): Promise<void> {
  if (!input.attachments || input.attachments.length === 0) {
    return;
  }

  const rows = buildSubmissionAttachmentMetadataRows({
    attachments: input.attachments,
    studentProfileId: input.studentProfileId,
    submissionId: input.submissionId,
    uploadResults: input.uploadResults,
  });
  const { error } = await supabase.from("submission_attachments").upsert(rows, {
    onConflict: "submission_id,client_attachment_id",
  });

  if (error) {
    throw error;
  }
}

function readScenario(): AssignmentScenario {
  const parsed = assignmentScenarioSchema.safeParse(
    process.env.EXPO_PUBLIC_WriterHabit_ASSIGNMENTS_SCENARIO,
  );

  return parsed.success ? parsed.data : "success";
}

function getGradeLevel(input: AssignmentRequestInput): GradeLevel {
  return input.gradeLevel ?? 7;
}

function getDailyAssignmentGoals(gradeLevel: GradeLevel): WritingGoal[] {
  if (gradeLevel <= 5) {
    return [
      "write_better_sentences",
      "creative_writing",
      "improve_handwriting",
    ];
  }

  if (gradeLevel <= 8) {
    return ["write_paragraphs", "school_assignments", "improve_grammar"];
  }

  return ["write_essays", "school_assignments", "test_prep"];
}

function getDailyAssignmentWeakSkills(gradeLevel: GradeLevel): WritingSkill[] {
  if (gradeLevel <= 5) {
    return ["sentence_structure", "vocabulary"];
  }

  if (gradeLevel <= 8) {
    return ["organization", "clarity", "revision_quality"];
  }

  return ["argument_strength", "evidence_usage", "organization"];
}

function getDailyPracticeMinutes(gradeLevel: GradeLevel): number {
  if (gradeLevel <= 5) {
    return 10;
  }

  if (gradeLevel <= 8) {
    return 15;
  }

  return 25;
}

function createDailyAssignmentHistory(
  gradeLevel: GradeLevel,
): DailyAssignmentHistoryItem[] {
  if (gradeLevel <= 5) {
    return [
      {
        assignmentId: "reviewed-story-detail",
        assignmentType: "creative_writing",
        completedAt: "2026-06-08",
        difficulty: "easy",
        skillFocus: ["creativity", "vocabulary"],
      },
      {
        assignmentId: "submitted-handwriting-practice",
        assignmentType: "handwriting_practice",
        completedAt: "2026-06-07",
        difficulty: "easy",
        skillFocus: ["handwriting"],
      },
    ];
  }

  if (gradeLevel <= 8) {
    return [
      {
        assignmentId: "reviewed-reading-response",
        assignmentType: "reading_response",
        completedAt: "2026-06-08",
        difficulty: "moderate",
        skillFocus: ["clarity", "organization"],
      },
      {
        assignmentId: "grammar-combine-sentences",
        assignmentType: "grammar_practice",
        completedAt: "2026-06-07",
        difficulty: "easy",
        skillFocus: ["grammar", "sentence_structure"],
      },
    ];
  }

  return [
    {
      assignmentId: "reviewed-argument-response",
      assignmentType: "reading_response",
      completedAt: "2026-06-08",
      difficulty: "moderate",
      skillFocus: ["argument_strength", "evidence_usage"],
    },
    {
      assignmentId: "evidence-analysis-practice",
      assignmentType: "paragraph_writing",
      completedAt: "2026-06-07",
      difficulty: "moderate",
      skillFocus: ["evidence_usage", "clarity"],
    },
  ];
}

function createCurrentDraft(
  assignment: DailyAssignmentTemplate,
  gradeLevel: GradeLevel,
): AssignmentRecord["draft"] {
  if (assignment.assignmentType === "handwriting_practice") {
    return {
      canvasPageCount: 1,
      lastEditedLabel: "Saved 10 minutes ago",
      preview: "Handwriting practice page saved locally.",
      revisionNumber: 0,
      wordCount: 5,
    };
  }

  if (gradeLevel <= 5) {
    return {
      canvasPageCount: 0,
      lastEditedLabel: "Saved 12 minutes ago",
      preview: "The park is bright. I see a tall slide...",
      revisionNumber: 0,
      wordCount: 22,
    };
  }

  if (gradeLevel <= 8) {
    return {
      canvasPageCount: 0,
      lastEditedLabel: "Saved 18 minutes ago",
      preview:
        "Practice matters more because people can improve with feedback...",
      revisionNumber: 1,
      wordCount: 96,
    };
  }

  return {
    canvasPageCount: 0,
    lastEditedLabel: "Saved 25 minutes ago",
    preview:
      "Technology affects learning most when it gives students faster feedback...",
    revisionNumber: 2,
    wordCount: 184,
  };
}

function getCurrentSubmissionId(assignmentId: string): string {
  return `submission-${assignmentId.replace(/^daily-/, "")}`;
}

function createCurrentAssignment(
  gradeLevel: GradeLevel,
  scenario: AssignmentScenario,
): AssignmentRecord {
  const status = scenario === "submitted" ? "submitted" : "in_progress";
  const selection = selectDailyAssignment({
    dailyMinutes: getDailyPracticeMinutes(gradeLevel),
    goals: getDailyAssignmentGoals(gradeLevel),
    gradeLevel,
    history: createDailyAssignmentHistory(gradeLevel),
    referenceDate: "2026-06-09",
    weakSkills: getDailyAssignmentWeakSkills(gradeLevel),
  });
  const assignment = selection.assignment;

  return {
    assignedLabel: "Today",
    assignmentType: assignment.assignmentType,
    currentSubmissionId:
      scenario === "submitted"
        ? getCurrentSubmissionId(assignment.id)
        : undefined,
    difficulty: assignment.difficulty,
    draft: createCurrentDraft(assignment, gradeLevel),
    dueLabel: "Today",
    estimatedMinutes: assignment.estimatedMinutes,
    gradeLevelMax: assignment.gradeLevelMax,
    gradeLevelMin: assignment.gradeLevelMin,
    id: assignment.id,
    instructions: assignment.instructions,
    prompt: assignment.prompt,
    rubric: assignment.rubric,
    rubricId: assignment.rubricId,
    skillFocus: assignment.skillFocus,
    status,
    submittedLabel: scenario === "submitted" ? "Submitted today" : undefined,
    teacherNote: assignment.teacherNote,
    title: assignment.title,
  };
}

function createReviewedAssignment(gradeLevel: GradeLevel): AssignmentRecord {
  if (gradeLevel <= 5) {
    return {
      assignedLabel: "Yesterday",
      assignmentType: "creative_writing",
      currentSubmissionId: "feedback-latest",
      difficulty: "easy",
      draft: {
        canvasPageCount: 1,
        lastEditedLabel: "Submitted yesterday",
        preview: "My story starts in a garden with a hidden gate...",
        revisionNumber: 1,
        wordCount: 48,
      },
      dueLabel: "Reviewed",
      estimatedMinutes: 12,
      gradeLevelMax: 5,
      gradeLevelMin: 1,
      id: "reviewed-story-detail",
      instructions: [
        "Read the feedback.",
        "Choose one sentence to make stronger.",
      ],
      prompt: "Write a short story opening with two details about the setting.",
      rubric: [
        {
          description: "The opening names a setting.",
          id: "setting",
          label: "Setting",
        },
        {
          description: "Details help the reader picture the place.",
          id: "details",
          label: "Details",
        },
      ],
      rubricId: "rubric-story-detail",
      skillFocus: ["creativity", "vocabulary"],
      status: "feedback_ready",
      submittedLabel: "Reviewed yesterday",
      title: "Story detail practice",
    };
  }

  return {
    assignedLabel: "Yesterday",
    assignmentType: gradeLevel <= 8 ? "paragraph_writing" : "essay_writing",
    currentSubmissionId: "feedback-latest",
    difficulty: "moderate",
    draft: {
      canvasPageCount: 0,
      lastEditedLabel: "Submitted yesterday",
      preview:
        gradeLevel <= 8
          ? "Reading every day helps students build vocabulary because..."
          : "Community service requirements can strengthen schools when...",
      revisionNumber: 2,
      wordCount: gradeLevel <= 8 ? 132 : 245,
    },
    dueLabel: "Reviewed",
    estimatedMinutes: gradeLevel <= 8 ? 18 : 30,
    gradeLevelMax: gradeLevel <= 8 ? 8 : 12,
    gradeLevelMin: gradeLevel <= 8 ? 6 : 9,
    id:
      gradeLevel <= 8
        ? "reviewed-reading-response"
        : "reviewed-argument-response",
    instructions: [
      "Review the strength and improvement note.",
      "Complete one revision task in your own words.",
      "Resubmit only after you make the change.",
    ],
    prompt:
      gradeLevel <= 8
        ? "Explain how daily reading affects vocabulary growth."
        : "Argue whether community service should be a graduation requirement.",
    rubric: [
      {
        description: "The response has a focused claim.",
        id: "claim",
        label: "Claim",
      },
      {
        description: "Details support the claim.",
        id: "support",
        label: "Support",
      },
      {
        description: "Revision addresses feedback.",
        id: "revision",
        label: "Revision",
      },
    ],
    rubricId:
      gradeLevel <= 8 ? "rubric-reading-response" : "rubric-argument-response",
    skillFocus:
      gradeLevel <= 8
        ? ["clarity", "organization"]
        : ["argument_strength", "evidence_usage"],
    status: "feedback_ready",
    submittedLabel: "Reviewed yesterday",
    title:
      gradeLevel <= 8
        ? "Reading response feedback"
        : "Argument response feedback",
  };
}

function createSubmittedAssignment(gradeLevel: GradeLevel): AssignmentRecord {
  return {
    assignedLabel: "This week",
    assignmentType:
      gradeLevel <= 5
        ? "handwriting_practice"
        : gradeLevel <= 8
          ? "reading_response"
          : "test_prep",
    currentSubmissionId: "submission-under-review",
    difficulty: gradeLevel <= 5 ? "easy" : "moderate",
    draft: {
      canvasPageCount: gradeLevel <= 5 ? 2 : 0,
      lastEditedLabel: "Submitted 2 days ago",
      preview:
        gradeLevel <= 5
          ? "Handwriting page submitted with two practice lines."
          : "My response explains the main idea and one supporting detail...",
      revisionNumber: 0,
      wordCount: gradeLevel <= 5 ? 18 : 118,
    },
    dueLabel: "Submitted",
    estimatedMinutes: gradeLevel <= 5 ? 8 : 20,
    gradeLevelMax: gradeLevel <= 5 ? 5 : gradeLevel <= 8 ? 8 : 12,
    gradeLevelMin: gradeLevel <= 5 ? 1 : gradeLevel <= 8 ? 6 : 9,
    id: "submitted-under-review",
    instructions: [
      "Wait for feedback.",
      "You can review the assignment details while it is being checked.",
    ],
    prompt:
      gradeLevel <= 5
        ? "Practice writing five clear words on lined paper."
        : "Write a focused response using one detail from the passage.",
    rubric: [
      {
        description: "The work responds to the prompt.",
        id: "prompt",
        label: "Prompt response",
      },
      {
        description: "The response is ready for review.",
        id: "ready",
        label: "Ready for review",
      },
    ],
    rubricId: "rubric-submitted-review",
    skillFocus:
      gradeLevel <= 5 ? ["handwriting"] : ["reading_response", "clarity"],
    status: "reviewing",
    submittedLabel: "Submitted 2 days ago",
    title: gradeLevel <= 5 ? "Handwriting practice" : "Reading response check",
  };
}

function createNotStartedAssignment(gradeLevel: GradeLevel): AssignmentRecord {
  return {
    assignedLabel: "Today",
    assignmentType:
      gradeLevel <= 5
        ? "creative_writing"
        : gradeLevel <= 8
          ? "paragraph_writing"
          : "essay_writing",
    difficulty: gradeLevel <= 5 ? "easy" : "moderate",
    draft: null,
    dueLabel: "Due in 3 days",
    estimatedMinutes: gradeLevel <= 5 ? 10 : 20,
    gradeLevelMax: gradeLevel <= 5 ? 5 : gradeLevel <= 8 ? 8 : 12,
    gradeLevelMin: gradeLevel <= 5 ? 1 : gradeLevel <= 8 ? 6 : 9,
    id: "not-started-narrative",
    instructions: [
      "Read the prompt and picture your idea.",
      "Plan a beginning, middle, and ending before you draft.",
    ],
    prompt:
      gradeLevel <= 5
        ? "Write a short story about a character who finds something surprising on the way to school."
        : "Write a narrative about a moment that changed how a character sees the world.",
    // Mock-only illustration so the prompt image box is exercised in logged-out dev mode.
    promptImageUrl: "https://picsum.photos/seed/writerhabit-narrative/640/360",
    rubric: [
      {
        description: "The writing has a clear beginning, middle, and ending.",
        id: "structure",
        label: "Structure",
      },
      {
        description: "Details help the reader picture the story.",
        id: "details",
        label: "Details",
      },
    ],
    rubricId: "rubric-not-started-narrative",
    skillFocus:
      gradeLevel <= 5
        ? ["creativity", "organization"]
        : ["organization", "clarity"],
    status: "not_started",
    title:
      gradeLevel <= 5 ? "My Surprising Morning" : "A Moment That Changed Me",
  };
}

function createAssignments(
  input: AssignmentRequestInput,
  scenario: AssignmentScenario,
): AssignmentRecord[] {
  const gradeLevel = getGradeLevel(input);

  if (scenario === "empty") {
    return [];
  }

  return [
    createCurrentAssignment(gradeLevel, scenario),
    createNotStartedAssignment(gradeLevel),
    createReviewedAssignment(gradeLevel),
    createSubmittedAssignment(gradeLevel),
  ];
}

function createHistoryResponse(
  input: AssignmentRequestInput,
  scenario: AssignmentScenario,
): AssignmentHistoryResponse {
  const response: AssignmentHistoryResponse = {
    assignments: createAssignments(input, scenario),
    connectionStatus: scenario === "offline" ? "offline_cached" : "online",
    generatedAt: new Date("2026-06-08T09:00:00.000Z").toISOString(),
    gradeLevel: getGradeLevel(input),
    studentId: input.studentId,
  };

  return assignmentHistoryResponseSchema.parse(response);
}

export const assignmentsApi = {
  async getBackendDraft(
    input: AssignmentDetailRequestInput,
  ): Promise<z.infer<typeof backendDraftResponseSchema> | null> {
    const detail = await this.getAssignmentDetail(input);
    const studentAssignmentId = detail.assignment?.studentAssignmentId;

    if (!detail.assignment || !studentAssignmentId) {
      return null;
    }

    try {
      return await apiClient.get(
        `/student-assignments/${encodePathSegment(studentAssignmentId)}/draft`,
        {
          schema: backendDraftResponseSchema,
        },
      );
    } catch {
      return null;
    }
  },

  async saveBackendDraft(
    input: AssignmentDraftSaveRequestInput,
  ): Promise<z.infer<typeof backendDraftResponseSchema> | null> {
    const detail = await this.getAssignmentDetail(input);
    const studentAssignmentId = detail.assignment?.studentAssignmentId;

    if (!detail.assignment || !studentAssignmentId) {
      return null;
    }

    try {
      return await apiClient.put(
        `/student-assignments/${encodePathSegment(studentAssignmentId)}/draft`,
        {
          autosaveVersion: input.autosaveVersion,
          canvasDocumentIds: input.canvasDocumentIds,
          text: input.text,
        },
        { schema: backendDraftResponseSchema },
      );
    } catch {
      return null;
    }
  },

  async getAssignments(
    input: AssignmentRequestInput,
  ): Promise<AssignmentHistoryResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Assignments mock error");
    }

    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      return createHistoryResponse(input, scenario);
    }

    try {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id, grade_level")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) {
        return assignmentHistoryResponseSchema.parse({
          assignments: [],
          connectionStatus: "online",
          generatedAt: new Date().toISOString(),
          gradeLevel: getGradeLevel(input),
          studentId: input.studentId,
        });
      }

      const { data: saList } = await supabase
        .from("student_assignments")
        .select("*, assignments(*, rubrics(*, rubric_criteria(*)))")
        .eq("student_profile_id", profile.id)
        .order("updated_at", { ascending: false })
        .limit(ASSIGNMENT_HISTORY_PAGE_SIZE);

      if (!saList || saList.length === 0) {
        return assignmentHistoryResponseSchema.parse({
          assignments: [],
          connectionStatus: "online",
          generatedAt: new Date().toISOString(),
          gradeLevel: profile.grade_level as GradeLevel,
          studentId: input.studentId,
        });
      }

      const list: AssignmentRecord[] = await Promise.all(
        saList.map(async (sa) => {
          // Fetch draft details if any
          const { data: draft } = await supabase
            .from("writing_drafts")
            .select(
              "canvas_document_ids, text_preview, revision_number, word_count",
            )
            .eq("student_assignment_id", sa.id)
            .maybeSingle();

          const rubricItems = (
            sa.assignments.rubrics?.rubric_criteria ?? []
          ).map((c: any) => ({
            id: c.id,
            label: c.label_fallback,
            description: c.description_fallback,
          }));

          return {
            assignedLabel: "Assigned",
            assignmentType: sa.assignments.assignment_type,
            currentSubmissionId: sa.current_submission_id || undefined,
            difficulty: sa.assignments.difficulty,
            draft: draft
              ? {
                  canvasPageCount: draft.canvas_document_ids?.length || 0,
                  lastEditedLabel: "Saved recently",
                  preview: draft.text_preview || "Start writing...",
                  revisionNumber: draft.revision_number || 1,
                  wordCount: draft.word_count || 0,
                }
              : null,
            dueLabel: sa.due_at
              ? new Date(sa.due_at).toLocaleDateString()
              : "Today",
            estimatedMinutes: sa.assignments.estimated_minutes,
            gradeLevelMax: sa.assignments.grade_level_max,
            gradeLevelMin: sa.assignments.grade_level_min,
            id: sa.assignment_id,
            instructions: sa.assignments.instructions || [],
            prompt: sa.assignments.prompt_fallback,
            promptImageUrl: sa.assignments.prompt_image_url || undefined,
            rubric: rubricItems,
            rubricId: sa.assignments.rubric_id,
            skillFocus: sa.assignments.skill_focus || [],
            status: sa.status,
            studentAssignmentId: sa.id,
            submittedLabel: sa.submitted_at ? "Submitted recently" : undefined,
            teacherNote: sa.teacher_note_fallback || undefined,
            title: sa.assignments.title_fallback,
          };
        }),
      );

      return assignmentHistoryResponseSchema.parse({
        assignments: list,
        connectionStatus: "online",
        generatedAt: new Date().toISOString(),
        gradeLevel: profile.grade_level as GradeLevel,
        studentId: input.studentId,
      });
    } catch (err) {
      if ((globalThis as { __DEV__?: boolean }).__DEV__ === true) {
        console.debug("Failed to query Supabase assignments list.", err);
      }
      throw err;
    }
  },

  async getAssignmentDetail(
    input: AssignmentDetailRequestInput,
  ): Promise<AssignmentDetailResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Assignment detail mock error");
    }

    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      const assignments = createAssignments(input, scenario);
      return {
        assignment:
          assignments.find(
            (assignment) => assignment.id === input.assignmentId,
          ) ?? null,
        connectionStatus: scenario === "offline" ? "offline_cached" : "online",
        generatedAt: new Date().toISOString(),
        gradeLevel: getGradeLevel(input),
        studentId: input.studentId,
      };
    }

    try {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id, grade_level")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) {
        return {
          assignment: null,
          connectionStatus: "online",
          generatedAt: new Date().toISOString(),
          gradeLevel: getGradeLevel(input),
          studentId: input.studentId,
        };
      }

      const { data: sa } = await supabase
        .from("student_assignments")
        .select("*, assignments(*, rubrics(*, rubric_criteria(*)))")
        .eq("student_profile_id", profile.id)
        .eq("assignment_id", input.assignmentId)
        .single();

      if (!sa) {
        return {
          assignment: null,
          connectionStatus: "online",
          generatedAt: new Date().toISOString(),
          gradeLevel: profile.grade_level as GradeLevel,
          studentId: input.studentId,
        };
      }

      const { data: draft } = await supabase
        .from("writing_drafts")
        .select("*")
        .eq("student_assignment_id", sa.id)
        .maybeSingle();

      const rubricItems = (sa.assignments.rubrics?.rubric_criteria ?? []).map(
        (c: any) => ({
          id: c.id,
          label: c.label_fallback,
          description: c.description_fallback,
        }),
      );

      const record: AssignmentRecord = {
        assignedLabel: "Assigned",
        assignmentType: sa.assignments.assignment_type,
        currentSubmissionId: sa.current_submission_id || undefined,
        difficulty: sa.assignments.difficulty,
        draft: draft
          ? {
              canvasPageCount: draft.canvas_document_ids?.length || 0,
              lastEditedLabel: "Saved recently",
              preview: draft.text_preview || "Start writing...",
              revisionNumber: draft.revision_number || 1,
              wordCount: draft.word_count || 0,
            }
          : null,
        dueLabel: sa.due_at
          ? new Date(sa.due_at).toLocaleDateString()
          : "Today",
        estimatedMinutes: sa.assignments.estimated_minutes,
        gradeLevelMax: sa.assignments.grade_level_max,
        gradeLevelMin: sa.assignments.grade_level_min,
        id: sa.assignment_id,
        instructions: sa.assignments.instructions || [],
        prompt: sa.assignments.prompt_fallback,
        promptImageUrl: sa.assignments.prompt_image_url || undefined,
        rubric: rubricItems,
        rubricId: sa.assignments.rubric_id,
        skillFocus: sa.assignments.skill_focus || [],
        status: sa.status,
        studentAssignmentId: sa.id,
        submittedLabel: sa.submitted_at ? "Submitted recently" : undefined,
        teacherNote: sa.teacher_note_fallback || undefined,
        title: sa.assignments.title_fallback,
      };

      return assignmentDetailResponseSchema.parse({
        assignment: record,
        connectionStatus: "online",
        generatedAt: new Date().toISOString(),
        gradeLevel: profile.grade_level as GradeLevel,
        studentId: input.studentId,
      });
    } catch (err) {
      if ((globalThis as { __DEV__?: boolean }).__DEV__ === true) {
        console.debug("Failed to query Supabase assignment detail.", err);
      }
      throw err;
    }
  },

  async startAssignment(
    input: AssignmentDetailRequestInput,
  ): Promise<AssignmentRecord> {
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      const detail = await this.getAssignmentDetail(input);
      if (!detail.assignment) throw new Error("Assignment not found");
      const nextStatus = getNextStatusOnStart(detail.assignment.status);
      if (!nextStatus) throw new Error("Assignment cannot be started");
      return { ...detail.assignment, status: nextStatus };
    }

    await apiClient.post(
      `/students/${encodePathSegment(input.studentId)}/assignments/${encodePathSegment(input.assignmentId)}/start`,
      {},
      { retry: false },
    );

    const updated = await this.getAssignmentDetail(input);
    if (!updated.assignment)
      throw new Error("Failed to load updated assignment");
    return updated.assignment;
  },

  async submitAssignment(
    input: AssignmentSubmitRequestInput,
  ): Promise<AssignmentSubmissionResponse> {
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      const detail = await this.getAssignmentDetail(input);
      if (!detail.assignment) throw new Error("Assignment not found");
      return {
        assignmentId: detail.assignment.id,
        status: "submitted",
        submittedLabel: "Submitted today",
        submissionId: `submission-${detail.assignment.id}`,
      };
    }

    const detail = await this.getAssignmentDetail(input);
    const studentAssignmentId = detail.assignment?.studentAssignmentId;

    if (!detail.assignment || !studentAssignmentId) {
      throw new Error("Student assignment not found");
    }

    const backendDraft =
      input.typedText === undefined
        ? await apiClient.get(
            `/student-assignments/${encodePathSegment(studentAssignmentId)}/draft`,
            {
              schema: backendDraftResponseSchema,
            },
          )
        : null;
    const typedText = input.typedText ?? backendDraft?.text ?? "";
    const canvasDocumentIds =
      input.canvasDocumentIds ?? backendDraft?.canvasDocumentIds ?? [];
    const clientDraftVersion =
      input.clientDraftVersion ?? backendDraft?.autosaveVersion ?? 1;
    const response = await apiClient.post(
      `/student-assignments/${encodePathSegment(studentAssignmentId)}/submissions`,
      {
        canvasDocumentIds,
        clientDraftVersion,
        idempotencyKey:
          input.idempotencyKey ??
          createClientIdempotencyKey(`submit-${studentAssignmentId}`),
        typedText,
      },
      {
        retry: false,
        schema: backendSubmissionResponseSchema,
      },
    );

    try {
      const { data: profile, error: profileError } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (typeof profile?.id === "string") {
        const uploadResults = await uploadSubmissionAttachments({
          attachments: input.attachments,
          submissionId: response.id,
          userId: session.user.id,
        });
        await persistSubmissionAttachmentMetadata({
          attachments: input.attachments,
          studentProfileId: profile.id,
          submissionId: response.id,
          uploadResults,
        });
      }
    } catch (error) {
      if ((globalThis as { __DEV__?: boolean }).__DEV__ === true) {
        console.debug(
          "Failed to persist submission attachment metadata.",
          error,
        );
      }
    }

    return {
      assignmentId: input.assignmentId,
      status: "submitted",
      submittedLabel: "Submitted just now",
      submissionId: response.id,
    };
  },
};
