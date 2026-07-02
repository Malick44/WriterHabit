import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/core/supabase/supabaseClient";
import { useI18n } from "@/i18n";

export type MessageSenderKind = "teacher" | "coach";

export interface StudentMessageThread {
  id: string;
  /** "teacher" renders initials, "coach" renders the writing-coach glyph. */
  senderKind: MessageSenderKind;
  senderName: string;
  /** Initials shown in the avatar for teacher threads. */
  initials: string;
  timeLabel: string;
  preview: string;
}

export interface StudentMessagesState {
  error: Error | null;
  refresh: () => Promise<void>;
  status: "loading" | "success" | "error";
  threads: readonly StudentMessageThread[];
}

type StudentMessageRow = {
  id: string;
  preview: string;
  sender_initials: string | null;
  sender_kind: MessageSenderKind;
  sender_name: string;
  sent_at: string;
};

function getTimeLabel(sentAt: string, now = new Date()): string {
  const sentDate = new Date(sentAt);

  if (Number.isNaN(sentDate.getTime())) {
    return "";
  }

  const sameDay =
    sentDate.getFullYear() === now.getFullYear() &&
    sentDate.getMonth() === now.getMonth() &&
    sentDate.getDate() === now.getDate();

  if (sameDay) {
    return sentDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const wasYesterday =
    sentDate.getFullYear() === yesterday.getFullYear() &&
    sentDate.getMonth() === yesterday.getMonth() &&
    sentDate.getDate() === yesterday.getDate();

  if (wasYesterday) {
    return "Yest";
  }

  return sentDate.toLocaleDateString([], { month: "short", day: "numeric" });
}

function rowToThread(row: StudentMessageRow): StudentMessageThread {
  return {
    id: row.id,
    initials: row.sender_initials ?? "",
    preview: row.preview,
    senderKind: row.sender_kind,
    senderName: row.sender_name,
    timeLabel: getTimeLabel(row.sent_at),
  };
}

export function useStudentMessages(): StudentMessagesState {
  const { t } = useI18n();
  const fallbackThreads = useMemo<readonly StudentMessageThread[]>(
    () => [
      {
        id: "ms-rivera",
        senderKind: "teacher",
        senderName: t("studentMessages.mock.teacherName"),
        initials: t("studentMessages.mock.teacherInitials"),
        timeLabel: t("studentMessages.mock.teacherTime"),
        preview: t("studentMessages.mock.teacherPreview"),
      },
      {
        id: "writing-coach",
        senderKind: "coach",
        senderName: t("studentMessages.mock.coachName"),
        initials: "",
        timeLabel: t("studentMessages.mock.coachTime"),
        preview: t("studentMessages.mock.coachPreview"),
      },
    ],
    [t],
  );
  const [state, setState] = useState<{
    error: Error | null;
    status: StudentMessagesState["status"];
    threads: readonly StudentMessageThread[];
  }>({
    error: null,
    status: "loading",
    threads: [],
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, error: null, status: "loading" }));

    try {
      const { data: authData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const session = authData?.session;

      if (!session) {
        setState({ error: null, status: "success", threads: fallbackThreads });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.id || typeof profile.id !== "string") {
        setState({ error: null, status: "success", threads: [] });
        return;
      }

      const { data, error } = await supabase
        .from("student_messages")
        .select("id,sender_kind,sender_name,sender_initials,preview,sent_at")
        .eq("student_profile_id", profile.id)
        .order("sent_at", { ascending: false });

      if (error) {
        throw error;
      }

      setState({
        error: null,
        status: "success",
        threads: ((data ?? []) as StudentMessageRow[]).map(rowToThread),
      });
    } catch (error) {
      setState({
        error: error instanceof Error ? error : new Error("Unable to load student messages"),
        status: "error",
        threads: [],
      });
    }
  }, [fallbackThreads]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
