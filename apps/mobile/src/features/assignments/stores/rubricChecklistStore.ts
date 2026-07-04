import { create } from "zustand";

export const EMPTY_RUBRIC_CHECKED: Record<string, boolean> = {};

interface RubricChecklistState {
  byAssignment: Record<string, Record<string, boolean>>;
  /** Seed an assignment's checks (from disk or server) unless already loaded. */
  hydrate: (assignmentId: string, checks: Record<string, boolean>) => void;
  toggle: (assignmentId: string, criterionId: string) => void;
}

/**
 * Self-review checkmarks for the assignment revise step, keyed by assignment
 * id. The in-memory store is the live source of truth; the
 * useAssignmentRubricChecklist hook hydrates it from device storage / the
 * server draft and writes changes back.
 */
export const useRubricChecklistStore = create<RubricChecklistState>()(
  (set) => ({
    byAssignment: {},
    hydrate: (assignmentId, checks) =>
      set((state) =>
        state.byAssignment[assignmentId]
          ? state
          : {
              byAssignment: {
                ...state.byAssignment,
                [assignmentId]: { ...checks },
              },
            },
      ),
    toggle: (assignmentId, criterionId) =>
      set((state) => {
        const current = state.byAssignment[assignmentId] ?? {};

        return {
          byAssignment: {
            ...state.byAssignment,
            [assignmentId]: {
              ...current,
              [criterionId]: !current[criterionId],
            },
          },
        };
      }),
  }),
);
