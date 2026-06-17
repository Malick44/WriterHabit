import { useMemo } from "react";

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
  threads: readonly StudentMessageThread[];
}

// UI-first mock mirroring the "Messages" design screen. Replace with a real
// messaging service when one is available.
const MOCK_THREADS: readonly StudentMessageThread[] = [
  {
    id: "ms-rivera",
    senderKind: "teacher",
    senderName: "Ms. Rivera",
    initials: "MR",
    timeLabel: "9:02",
    preview: "Lovely progress on your forest draft — keep that vivid detail going!",
  },
  {
    id: "writing-coach",
    senderKind: "coach",
    senderName: "Writing Coach",
    initials: "",
    timeLabel: "Yest",
    preview: "Ready when you are for Step 2 — I'll ask the questions, you write the words.",
  },
];

export function useStudentMessages(): StudentMessagesState {
  return useMemo(() => ({ threads: MOCK_THREADS }), []);
}
