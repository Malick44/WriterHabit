import { z } from "zod";
import { localJsonStorage } from "@/services/storage/localJsonStorage";
import { supabase } from "@/core/supabase/supabaseClient";

import {
  MAX_CANVAS_DOCUMENTS,
  canvasDocumentSchema,
  canvasDocumentSummarySchema,
  canvasPointSchema,
  canvasStrokeSchema,
  type CanvasDocument,
  type CanvasDocumentSummary,
} from "../types";
import { getCanvasDocumentSummary, normalizeCanvasDocument } from "./canvasDocumentService";

/** Newest-first cap so canvas list fetches stay bounded. */
const CANVAS_SUMMARY_PAGE_SIZE = 100;

const recoverableCanvasStrokeSchema = canvasStrokeSchema.extend({
  points: z.array(canvasPointSchema),
});

const recoverableCanvasDocumentSchema = canvasDocumentSchema.extend({
  strokes: z.array(recoverableCanvasStrokeSchema),
});

function getCanvasIndexKey(studentId: string) {
  return `canvas-index.${studentId}`;
}

function getCanvasDocumentKey(studentId: string, canvasId: string) {
  return `canvas-doc.${studentId}.${canvasId}`;
}

async function readIndex(studentId: string): Promise<CanvasDocumentSummary[]> {
  const storedIndex = await localJsonStorage.getItem<unknown>(getCanvasIndexKey(studentId), []);

  if (!Array.isArray(storedIndex)) {
    return [];
  }

  return storedIndex.flatMap((summary) => {
    const parsedSummary = canvasDocumentSummarySchema.safeParse(summary);

    return parsedSummary.success ? [parsedSummary.data] : [];
  });
}

async function writeIndex(studentId: string, summaries: CanvasDocumentSummary[]) {
  const sorted = [...summaries].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const nextIndex = sorted.slice(0, MAX_CANVAS_DOCUMENTS);
  const pruned = sorted.slice(MAX_CANVAS_DOCUMENTS);

  await localJsonStorage.setItem(getCanvasIndexKey(studentId), nextIndex);

  await Promise.all(pruned.map((summary) => localJsonStorage.removeItem(getCanvasDocumentKey(studentId, summary.id))));
}

export const canvasPersistenceService = {
  async getDocument(studentId: string, canvasId: string): Promise<CanvasDocument | null> {
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      const storedDocument = await localJsonStorage.getItem<unknown>(getCanvasDocumentKey(studentId, canvasId), null);
      const parsed = canvasDocumentSchema.safeParse(storedDocument);

      if (parsed.success) {
        return parsed.data;
      }

      const recoverable = recoverableCanvasDocumentSchema.safeParse(storedDocument);

      if (!recoverable.success || recoverable.data.studentId !== studentId || recoverable.data.id !== canvasId) {
        return null;
      }

      return normalizeCanvasDocument(recoverable.data);
    }

    try {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) throw new Error("Student profile not found");

      const { data: dbDoc } = await supabase
        .from("canvas_documents")
        .select("*")
        .eq("id", canvasId)
        .eq("student_profile_id", profile.id)
        .maybeSingle();

      if (!dbDoc) return null;

      const { data: dbContent } = await supabase
        .from("canvas_document_contents")
        .select("*")
        .eq("canvas_document_id", canvasId)
        .eq("student_profile_id", profile.id)
        .maybeSingle();

      const strokes = dbContent?.strokes || [];

      const doc = canvasDocumentSchema.parse({
        assignmentId: dbDoc.assignment_id || undefined,
        attachedAt: dbDoc.attached_at || undefined,
        clientVersion: dbDoc.client_version,
        createdAt: dbDoc.created_at,
        exportStatus: dbDoc.export_status || "not_requested",
        id: dbDoc.id,
        lastSyncedAt: dbDoc.updated_at,
        previewImageUrl: dbDoc.preview_image_path || undefined,
        recognizedText: dbContent?.recognized_text || undefined,
        serverVersion: dbDoc.client_version,
        studentId: studentId,
        storageObjectPath: dbDoc.object_path || undefined,
        strokes: strokes,
        syncStatus: dbDoc.sync_status || "saved",
        template: dbDoc.template,
        title: dbDoc.title,
        updatedAt: dbDoc.updated_at,
      });

      return normalizeCanvasDocument(doc);
    } catch (err) {
      console.error("Failed to fetch canvas document from Supabase, returning local fallback:", err);
      const storedDocument = await localJsonStorage.getItem<unknown>(getCanvasDocumentKey(studentId, canvasId), null);
      const parsed = canvasDocumentSchema.safeParse(storedDocument);

      if (parsed.success) {
        return parsed.data;
      }

      const recoverable = recoverableCanvasDocumentSchema.safeParse(storedDocument);

      if (!recoverable.success || recoverable.data.studentId !== studentId || recoverable.data.id !== canvasId) {
        return null;
      }

      return normalizeCanvasDocument(recoverable.data);
    }
  },

  async getDocuments(studentId: string): Promise<CanvasDocumentSummary[]> {
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      return readIndex(studentId);
    }

    try {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) throw new Error("Student profile not found");

      const { data: dbDocs } = await supabase
        .from("canvas_documents")
        .select("*, canvas_document_contents(stroke_count)")
        .eq("student_profile_id", profile.id)
        .order("updated_at", { ascending: false })
        .limit(CANVAS_SUMMARY_PAGE_SIZE);

      if (!dbDocs) return [];

      return dbDocs.map((dbDoc: any) => {
        return canvasDocumentSummarySchema.parse({
          assignmentId: dbDoc.assignment_id || undefined,
          id: dbDoc.id,
          isAttached: !!dbDoc.assignment_id,
          strokeCount: dbDoc.canvas_document_contents?.stroke_count ?? 0,
          syncStatus: dbDoc.sync_status || "saved",
          template: dbDoc.template,
          title: dbDoc.title,
          updatedAt: dbDoc.updated_at,
          updatedLabel: "Saved recently",
        });
      });
    } catch (err) {
      console.error("Failed to fetch canvas list from Supabase, returning local fallback:", err);
      return readIndex(studentId);
    }
  },

  async getAttachedDocument(studentId: string, assignmentId: string): Promise<CanvasDocument | null> {
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      const summaries = await readIndex(studentId);
      const attachedSummary = summaries.find((summary) => summary.assignmentId === assignmentId);

      if (!attachedSummary) {
        return null;
      }

      return this.getDocument(studentId, attachedSummary.id);
    }

    try {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) throw new Error("Student profile not found");

      const { data: dbDoc } = await supabase
        .from("canvas_documents")
        .select("id")
        .eq("student_profile_id", profile.id)
        .eq("assignment_id", assignmentId)
        .maybeSingle();

      if (!dbDoc) return null;

      return this.getDocument(studentId, dbDoc.id);
    } catch (err) {
      console.error("Failed to fetch attached canvas from Supabase, returning local fallback:", err);
      const summaries = await readIndex(studentId);
      const attachedSummary = summaries.find((summary) => summary.assignmentId === assignmentId);

      if (!attachedSummary) {
        return null;
      }

      return this.getDocument(studentId, attachedSummary.id);
    }
  },

  async removeDocument(studentId: string, canvasId: string): Promise<void> {
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      const summaries = await readIndex(studentId);

      await localJsonStorage.removeItem(getCanvasDocumentKey(studentId, canvasId));
      await writeIndex(
        studentId,
        summaries.filter((summary) => summary.id !== canvasId),
      );
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        await supabase
          .from("canvas_document_contents")
          .delete()
          .eq("canvas_document_id", canvasId)
          .eq("student_profile_id", profile.id);

        await supabase
          .from("canvas_documents")
          .delete()
          .eq("id", canvasId)
          .eq("student_profile_id", profile.id);
      }
    } catch (err) {
      console.error("Failed to remove canvas from Supabase:", err);
    }

    const summaries = await readIndex(studentId);
    await localJsonStorage.removeItem(getCanvasDocumentKey(studentId, canvasId));
    await writeIndex(
      studentId,
      summaries.filter((summary) => summary.id !== canvasId),
    );
  },

  async saveDocument(
    document: CanvasDocument,
    options: { touchUpdatedAt?: boolean } = {},
  ): Promise<CanvasDocument> {
    const nextDocument = normalizeCanvasDocument({
      ...document,
      updatedAt: options.touchUpdatedAt === false ? document.updatedAt : new Date().toISOString(),
    });

    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session) {
      const summaries = await readIndex(nextDocument.studentId);
      const nextSummary = getCanvasDocumentSummary(nextDocument);

      await localJsonStorage.setItem(getCanvasDocumentKey(nextDocument.studentId, nextDocument.id), nextDocument);
      await writeIndex(nextDocument.studentId, [
        nextSummary,
        ...summaries.filter((summary) => summary.id !== nextDocument.id),
      ]);

      return nextDocument;
    }

    try {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) throw new Error("Student profile not found");

      let studentAssignmentId: string | null = null;
      if (nextDocument.assignmentId) {
        const { data: sa } = await supabase
          .from("student_assignments")
          .select("id")
          .eq("student_profile_id", profile.id)
          .eq("assignment_id", nextDocument.assignmentId)
          .maybeSingle();

        studentAssignmentId = sa?.id || null;
      }

      // Upsert document
      const { data: existingDoc } = await supabase
        .from("canvas_documents")
        .select("id")
        .eq("id", nextDocument.id)
        .eq("student_profile_id", profile.id)
        .maybeSingle();

      const docPayload = {
        student_profile_id: profile.id,
        assignment_id: nextDocument.assignmentId || null,
        student_assignment_id: studentAssignmentId,
        template: nextDocument.template,
        title: nextDocument.title,
        sync_status: nextDocument.syncStatus,
        client_version: nextDocument.clientVersion || 1,
        object_path: nextDocument.storageObjectPath || null,
        preview_image_path: nextDocument.previewImageUrl || null,
        recognition_status: "pending",
        attached_at: nextDocument.attachedAt || null,
        updated_at: nextDocument.updatedAt,
      };

      if (existingDoc) {
        const { error } = await supabase
          .from("canvas_documents")
          .update(docPayload)
          .eq("id", nextDocument.id)
          .eq("student_profile_id", profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("canvas_documents")
          .insert({
            id: nextDocument.id,
            created_at: nextDocument.createdAt,
            ...docPayload,
          });

        if (error) throw error;
      }

      // Upsert contents
      const { data: existingContent } = await supabase
        .from("canvas_document_contents")
        .select("canvas_document_id")
        .eq("canvas_document_id", nextDocument.id)
        .eq("student_profile_id", profile.id)
        .maybeSingle();

      const contentPayload = {
        student_profile_id: profile.id,
        strokes: nextDocument.strokes,
        recognized_text: nextDocument.recognizedText || null,
        updated_at: nextDocument.updatedAt,
      };

      if (existingContent) {
        const { error } = await supabase
          .from("canvas_document_contents")
          .update(contentPayload)
          .eq("canvas_document_id", nextDocument.id)
          .eq("student_profile_id", profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("canvas_document_contents")
          .insert({
            canvas_document_id: nextDocument.id,
            created_at: nextDocument.createdAt,
            ...contentPayload,
          });

        if (error) throw error;
      }
    } catch (err) {
      console.error("Failed to save canvas document to Supabase, saving to local json storage:", err);
    }

    // Always keep a local copy for cache/offline support
    const summaries = await readIndex(nextDocument.studentId);
    const nextSummary = getCanvasDocumentSummary(nextDocument);

    await localJsonStorage.setItem(getCanvasDocumentKey(nextDocument.studentId, nextDocument.id), nextDocument);
    await writeIndex(nextDocument.studentId, [
      nextSummary,
      ...summaries.filter((summary) => summary.id !== nextDocument.id),
    ]);

    return nextDocument;
  },
};
