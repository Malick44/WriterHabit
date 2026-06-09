import { localJsonStorage } from "@/services/storage/localJsonStorage";
import { supabase } from "@/core/supabase/supabaseClient";
import { getWritingMetrics } from "./writingMetricsService";

import {
  MAX_DRAFT_TEXT_LENGTH,
  writingCanvasAttachmentSchema,
  writingDraftSchema,
  type WritingCanvasAttachment,
  type WritingDraft,
} from "../types";

function getDraftKey(studentId: string, assignmentId: string): string {
  return `writing-draft.${studentId}.${assignmentId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function normalizeDraftText(text: string): string {
  return text.length > MAX_DRAFT_TEXT_LENGTH ? text.slice(0, MAX_DRAFT_TEXT_LENGTH) : text;
}

function recoverStoredDraft(storedDraft: unknown, fallbackDraft: WritingDraft): WritingDraft | null {
  if (!isRecord(storedDraft)) {
    return null;
  }

  if (storedDraft.assignmentId !== fallbackDraft.assignmentId || storedDraft.studentId !== fallbackDraft.studentId) {
    return null;
  }

  const parsedAttachment = writingCanvasAttachmentSchema.nullable().safeParse(storedDraft.canvasAttachment);
  const recovered = writingDraftSchema.safeParse({
    ...fallbackDraft,
    canvasAttachment: parsedAttachment.success ? parsedAttachment.data : fallbackDraft.canvasAttachment,
    createdAt: isIsoTimestamp(storedDraft.createdAt) ? storedDraft.createdAt : fallbackDraft.createdAt,
    revisionNumber:
      typeof storedDraft.revisionNumber === "number" && Number.isInteger(storedDraft.revisionNumber)
        ? Math.max(0, storedDraft.revisionNumber)
        : fallbackDraft.revisionNumber,
    text: normalizeDraftText(typeof storedDraft.text === "string" ? storedDraft.text : fallbackDraft.text),
    updatedAt: isIsoTimestamp(storedDraft.updatedAt) ? storedDraft.updatedAt : fallbackDraft.updatedAt,
  });

  return recovered.success ? recovered.data : null;
}

export function createWritingDraft(input: {
  assignmentId: string;
  canvasAttachment: WritingCanvasAttachment | null;
  revisionNumber?: number;
  seedText?: string;
  studentId: string;
  timestamp?: string;
}): WritingDraft {
  const timestamp = input.timestamp ?? new Date().toISOString();

  return writingDraftSchema.parse({
    assignmentId: input.assignmentId,
    canvasAttachment: input.canvasAttachment,
    createdAt: timestamp,
    revisionNumber: input.revisionNumber ?? 0,
    studentId: input.studentId,
    text: normalizeDraftText(input.seedText ?? ""),
    updatedAt: timestamp,
  });
}

export const draftPersistenceService = {
  async getDraft(fallbackDraft: WritingDraft): Promise<WritingDraft> {
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      const storedDraft = await localJsonStorage.getItem<unknown>(
        getDraftKey(fallbackDraft.studentId, fallbackDraft.assignmentId),
        null,
      );
      const parsed = writingDraftSchema.safeParse(storedDraft);

      if (!parsed.success) {
        return recoverStoredDraft(storedDraft, fallbackDraft) ?? fallbackDraft;
      }

      return parsed.data;
    }

    try {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) {
        throw new Error("Student profile not found");
      }

      const { data: sa } = await supabase
        .from("student_assignments")
        .select("id")
        .eq("student_profile_id", profile.id)
        .eq("assignment_id", fallbackDraft.assignmentId)
        .single();

      if (!sa) {
        throw new Error("Student assignment not found");
      }

      const { data: dbDraft } = await supabase
        .from("writing_drafts")
        .select("*")
        .eq("student_assignment_id", sa.id)
        .maybeSingle();

      if (!dbDraft) {
        return fallbackDraft;
      }

      let canvasAttachment: WritingDraft["canvasAttachment"] = null;
      if (dbDraft.canvas_document_ids && dbDraft.canvas_document_ids.length > 0) {
        const firstCanvasId = dbDraft.canvas_document_ids[0];
        const { data: canvasDoc } = await supabase
          .from("canvas_documents")
          .select("title, updated_at")
          .eq("id", firstCanvasId)
          .maybeSingle();

        canvasAttachment = {
          canvasId: firstCanvasId,
          pageCount: 1,
          title: canvasDoc?.title ?? "Attached Canvas",
          updatedLabel: canvasDoc?.updated_at ? "Saved recently" : "Unsaved",
        };
      }

      return writingDraftSchema.parse({
        assignmentId: fallbackDraft.assignmentId,
        canvasAttachment,
        createdAt: dbDraft.created_at,
        revisionNumber: dbDraft.revision_number,
        studentId: fallbackDraft.studentId,
        text: dbDraft.text_content,
        updatedAt: dbDraft.updated_at || dbDraft.client_updated_at || dbDraft.created_at,
      });
    } catch (err) {
      console.error("Failed to fetch draft from Supabase, returning local fallback:", err);
      const storedDraft = await localJsonStorage.getItem<unknown>(
        getDraftKey(fallbackDraft.studentId, fallbackDraft.assignmentId),
        null,
      );
      const parsed = writingDraftSchema.safeParse(storedDraft);

      if (!parsed.success) {
        return recoverStoredDraft(storedDraft, fallbackDraft) ?? fallbackDraft;
      }

      return parsed.data;
    }
  },

  async saveDraft(draft: WritingDraft): Promise<WritingDraft> {
    const nextDraft = writingDraftSchema.parse({
      ...draft,
      text: normalizeDraftText(draft.text),
      updatedAt: new Date().toISOString(),
    });

    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      await localJsonStorage.setItem(getDraftKey(nextDraft.studentId, nextDraft.assignmentId), nextDraft);
      return nextDraft;
    }

    try {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) {
        throw new Error("Student profile not found");
      }

      const { data: sa } = await supabase
        .from("student_assignments")
        .select("id")
        .eq("student_profile_id", profile.id)
        .eq("assignment_id", nextDraft.assignmentId)
        .single();

      if (!sa) {
        throw new Error("Student assignment not found");
      }

      const metrics = getWritingMetrics(nextDraft.text);
      const canvasDocumentIds = nextDraft.canvasAttachment ? [nextDraft.canvasAttachment.canvasId] : [];

      const { data: existingDraft } = await supabase
        .from("writing_drafts")
        .select("id, autosave_version")
        .eq("student_assignment_id", sa.id)
        .maybeSingle();

      if (existingDraft) {
        const { error } = await supabase
          .from("writing_drafts")
          .update({
            text_content: nextDraft.text,
            text_preview: nextDraft.text.slice(0, 100),
            canvas_document_ids: canvasDocumentIds,
            autosave_version: (existingDraft.autosave_version || 0) + 1,
            word_count: metrics.wordCount,
            sentence_count: metrics.sentenceCount,
            paragraph_count: metrics.paragraphCount,
            revision_number: nextDraft.revisionNumber,
            client_updated_at: nextDraft.updatedAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingDraft.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("writing_drafts")
          .insert({
            student_assignment_id: sa.id,
            student_profile_id: profile.id,
            text_content: nextDraft.text,
            text_preview: nextDraft.text.slice(0, 100),
            canvas_document_ids: canvasDocumentIds,
            autosave_version: 1,
            word_count: metrics.wordCount,
            sentence_count: metrics.sentenceCount,
            paragraph_count: metrics.paragraphCount,
            revision_number: nextDraft.revisionNumber,
            client_updated_at: nextDraft.updatedAt,
            created_at: nextDraft.createdAt,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    } catch (err) {
      console.error("Failed to save draft to Supabase, saving to local json storage:", err);
      await localJsonStorage.setItem(getDraftKey(nextDraft.studentId, nextDraft.assignmentId), nextDraft);
    }

    return nextDraft;
  },

  async removeDraft(studentId: string, assignmentId: string): Promise<void> {
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      await localJsonStorage.removeItem(getDraftKey(studentId, assignmentId));
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        const { data: sa } = await supabase
          .from("student_assignments")
          .select("id")
          .eq("student_profile_id", profile.id)
          .eq("assignment_id", assignmentId)
          .single();

        if (sa) {
          await supabase
            .from("writing_drafts")
            .delete()
            .eq("student_assignment_id", sa.id);
        }
      }
    } catch (err) {
      console.error("Failed to remove draft from Supabase:", err);
    }

    await localJsonStorage.removeItem(getDraftKey(studentId, assignmentId));
  },
};
