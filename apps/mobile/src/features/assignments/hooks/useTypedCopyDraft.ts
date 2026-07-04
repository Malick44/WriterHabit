import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { localJsonStorage } from "@/services/storage/localJsonStorage";
import { storageKeys } from "@/services/storage/storageKeys";

import { assignmentsApi } from "../api/assignmentsApi";

const BACKEND_SYNC_DELAY_MS = 900;

export interface TypedCopyDraftState {
  hydrated: boolean;
  setText: (text: string) => void;
  text: string;
}

/**
 * Typed-copy text for one assignment, device-local first: hydrates from
 * localJsonStorage (falling back to the backend draft), writes every change
 * back to disk immediately, and syncs to the backend draft after a short
 * debounce, best-effort. Pass undefined to keep the hook idle (e.g. while the
 * typed-copy setting is off).
 */
export function useTypedCopyDraft(assignmentId?: string): TypedCopyDraftState {
  const { session } = useAuthSession();
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const [text, setTextState] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const dirtyRef = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    let cancelled = false;
    dirtyRef.current = false;

    void (async () => {
      const stored = await localJsonStorage.getItem<string | null>(
        storageKeys.assignmentTypedCopy(assignmentId),
        null,
      );
      let value = stored;

      if (value === null) {
        const backendDraft = await assignmentsApi
          .getBackendDraft({ assignmentId, gradeLevel, studentId })
          .catch(() => null);
        value = backendDraft?.text ?? "";
      }

      // A keystroke while hydrating wins over whatever storage returned.
      if (!cancelled && !dirtyRef.current) {
        setTextState(value ?? "");
      }

      if (!cancelled) {
        setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assignmentId, gradeLevel, studentId]);

  useEffect(
    () => () => {
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }
    },
    [],
  );

  const setText = useCallback(
    (next: string) => {
      if (!assignmentId) {
        return;
      }

      dirtyRef.current = true;
      setTextState(next);

      void localJsonStorage.setItem(
        storageKeys.assignmentTypedCopy(assignmentId),
        next,
      );

      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }

      syncTimer.current = setTimeout(() => {
        void assignmentsApi.saveTypedCopy({
          assignmentId,
          gradeLevel,
          studentId,
          text: next,
        });
      }, BACKEND_SYNC_DELAY_MS);
    },
    [assignmentId, gradeLevel, studentId],
  );

  return { hydrated, setText, text };
}
