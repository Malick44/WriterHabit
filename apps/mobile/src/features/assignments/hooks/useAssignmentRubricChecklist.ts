import { useCallback, useEffect, useRef } from "react";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { localJsonStorage } from "@/services/storage/localJsonStorage";
import { storageKeys } from "@/services/storage/storageKeys";

import { assignmentsApi } from "../api/assignmentsApi";
import {
  EMPTY_RUBRIC_CHECKED,
  useRubricChecklistStore,
} from "../stores/rubricChecklistStore";

const BACKEND_SYNC_DELAY_MS = 900;

export interface AssignmentRubricChecklistState {
  checkedIds: Record<string, boolean>;
  toggle: (criterionId: string) => void;
}

/**
 * Revise-step rubric checkmarks for one assignment. The zustand store holds
 * the live state; this hook layers persistence around it:
 *
 * 1. Hydrates once per assignment — device storage first, then any checks
 *    saved on the server draft (`writing_drafts.rubric_checks`).
 * 2. On toggle, writes through to device storage immediately and syncs to the
 *    backend draft after a short debounce, best-effort.
 */
export function useAssignmentRubricChecklist(input: {
  assignmentId?: string;
  /** Checks that arrived with the assignment's server draft, if any. */
  serverChecks?: Record<string, boolean>;
}): AssignmentRubricChecklistState {
  const { assignmentId, serverChecks } = input;
  const { session } = useAuthSession();
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const checkedIds = useRubricChecklistStore(
    (store) =>
      (assignmentId ? store.byAssignment[assignmentId] : undefined) ??
      EMPTY_RUBRIC_CHECKED,
  );
  const hydrate = useRubricChecklistStore((store) => store.hydrate);
  const toggleInStore = useRubricChecklistStore((store) => store.toggle);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverChecksRef = useRef(serverChecks);

  useEffect(() => {
    serverChecksRef.current = serverChecks;
  }, [serverChecks]);

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    let cancelled = false;

    void localJsonStorage
      .getItem<Record<string, boolean> | null>(
        storageKeys.assignmentRubricChecks(assignmentId),
        null,
      )
      .then((stored) => {
        if (cancelled) {
          return;
        }

        // hydrate() is a no-op once the assignment has state, so a slow read
        // never overwrites checks the student toggled in the meantime.
        const seed = stored ?? serverChecksRef.current;

        if (seed && Object.keys(seed).length > 0) {
          hydrate(assignmentId, seed);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [assignmentId, hydrate]);

  useEffect(
    () => () => {
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }
    },
    [],
  );

  const toggle = useCallback(
    (criterionId: string) => {
      if (!assignmentId) {
        return;
      }

      toggleInStore(assignmentId, criterionId);

      const next =
        useRubricChecklistStore.getState().byAssignment[assignmentId] ?? {};

      void localJsonStorage.setItem(
        storageKeys.assignmentRubricChecks(assignmentId),
        next,
      );

      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }

      syncTimer.current = setTimeout(() => {
        void assignmentsApi.saveRubricChecks({
          assignmentId,
          gradeLevel,
          rubricChecks: next,
          studentId,
        });
      }, BACKEND_SYNC_DELAY_MS);
    },
    [assignmentId, gradeLevel, studentId, toggleInStore],
  );

  return { checkedIds, toggle };
}
