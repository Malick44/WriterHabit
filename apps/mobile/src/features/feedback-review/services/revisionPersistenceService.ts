import { localJsonStorage } from "@/services/storage/localJsonStorage";
import { supabase } from "@/core/supabase/supabaseClient";

import {
  MAX_FEEDBACK_REVISION_TEXT_LENGTH,
  feedbackRevisionDraftSchema,
  type FeedbackRevisionDraft,
} from "../types";

type RemoteRevisionDraftRow = {
  client_updated_at: string | null;
  revised_text: string | null;
  submission_id: string;
  updated_at: string;
};

function getRevisionDraftKey(studentId: string, submissionId: string): string {
  return `feedback-revision.${studentId}.${submissionId}`;
}

function clampRevisionText(text: string): string {
  return text.length > MAX_FEEDBACK_REVISION_TEXT_LENGTH
    ? text.slice(0, MAX_FEEDBACK_REVISION_TEXT_LENGTH)
    : text;
}

async function getSignedInStudentProfileId(): Promise<string | null> {
  const { data: authData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const session = authData?.session;

  if (!session) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return typeof profile?.id === "string" ? profile.id : null;
}

function rowToDraft(input: {
  row: RemoteRevisionDraftRow;
  studentId: string;
  submissionId: string;
}): FeedbackRevisionDraft {
  return feedbackRevisionDraftSchema.parse({
    revisedText: clampRevisionText(input.row.revised_text ?? ""),
    studentId: input.studentId,
    submissionId: input.submissionId,
    updatedAt: input.row.client_updated_at ?? input.row.updated_at,
  });
}

async function getLocalRevisionDraft(input: {
  studentId: string;
  submissionId: string;
}): Promise<FeedbackRevisionDraft | null> {
  const storedDraft = await localJsonStorage.getItem<unknown>(
    getRevisionDraftKey(input.studentId, input.submissionId),
    null,
  );
  const parsed = feedbackRevisionDraftSchema.safeParse(storedDraft);

  return parsed.success ? parsed.data : null;
}

async function removeLocalRevisionDraft(input: {
  studentId: string;
  submissionId: string;
}): Promise<void> {
  await localJsonStorage.removeItem(getRevisionDraftKey(input.studentId, input.submissionId));
}

async function saveLocalRevisionDraft(draft: FeedbackRevisionDraft): Promise<void> {
  await localJsonStorage.setItem(getRevisionDraftKey(draft.studentId, draft.submissionId), draft);
}

export const revisionPersistenceService = {
  async getRevisionDraft(input: {
    studentId: string;
    submissionId: string;
  }): Promise<FeedbackRevisionDraft | null> {
    try {
      const studentProfileId = await getSignedInStudentProfileId();

      if (!studentProfileId) {
        return getLocalRevisionDraft(input);
      }

      const { data, error } = await supabase
        .from("submission_revision_drafts")
        .select("submission_id,revised_text,client_updated_at,updated_at")
        .eq("student_profile_id", studentProfileId)
        .eq("submission_id", input.submissionId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data
        ? rowToDraft({
            row: data as RemoteRevisionDraftRow,
            studentId: input.studentId,
            submissionId: input.submissionId,
          })
        : null;
    } catch (error) {
      console.error("Failed to fetch revision draft from Supabase, using local fallback:", error);
      return getLocalRevisionDraft(input);
    }
  },

  async removeRevisionDraft(input: {
    studentId: string;
    submissionId: string;
  }): Promise<void> {
    try {
      const studentProfileId = await getSignedInStudentProfileId();

      if (!studentProfileId) {
        await removeLocalRevisionDraft(input);
        return;
      }

      const { error } = await supabase
        .from("submission_revision_drafts")
        .delete()
        .eq("student_profile_id", studentProfileId)
        .eq("submission_id", input.submissionId);

      if (error) {
        throw error;
      }

      await removeLocalRevisionDraft(input);
    } catch (error) {
      console.error("Failed to remove revision draft from Supabase, removing local fallback:", error);
      await removeLocalRevisionDraft(input);
    }
  },

  async saveRevisionDraft(input: {
    revisedText: string;
    studentId: string;
    submissionId: string;
  }): Promise<FeedbackRevisionDraft> {
    const nextDraft = feedbackRevisionDraftSchema.parse({
      revisedText: clampRevisionText(input.revisedText),
      studentId: input.studentId,
      submissionId: input.submissionId,
      updatedAt: new Date().toISOString(),
    });

    try {
      const studentProfileId = await getSignedInStudentProfileId();

      if (!studentProfileId) {
        await saveLocalRevisionDraft(nextDraft);
      } else {
        const { data: submission, error: submissionError } = await supabase
          .from("submissions")
          .select("id")
          .eq("id", input.submissionId)
          .eq("student_profile_id", studentProfileId)
          .maybeSingle();

        if (submissionError) {
          throw submissionError;
        }

        if (!submission) {
          throw new Error("Submission not found for signed-in student");
        }

        const { error } = await supabase.from("submission_revision_drafts").upsert(
          {
            client_updated_at: nextDraft.updatedAt,
            revised_text: nextDraft.revisedText,
            student_profile_id: studentProfileId,
            submission_id: input.submissionId,
          },
          { onConflict: "submission_id" },
        );

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error("Failed to save revision draft to Supabase, saving local fallback:", error);
      await saveLocalRevisionDraft(nextDraft);
    }

    return nextDraft;
  },
};
