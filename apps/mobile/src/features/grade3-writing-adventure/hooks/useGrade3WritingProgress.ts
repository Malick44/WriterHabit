import { useCallback, useEffect, useMemo, useState } from "react";

import { grade3WritingProgressService } from "../services/grade3WritingProgressService";
import { getGrade3Summary, getProgressMap } from "../services/grade3WritingProgressModel";
import type { Grade3WritingProgress, Grade3WritingProgressInput } from "../types";

type ProgressState =
  | { status: "loading"; progress: Grade3WritingProgress[]; error: null }
  | { status: "success"; progress: Grade3WritingProgress[]; error: null }
  | { status: "error"; progress: Grade3WritingProgress[]; error: Error };

export function useGrade3WritingProgress() {
  const [state, setState] = useState<ProgressState>({
    error: null,
    progress: [],
    status: "loading",
  });

  const refresh = useCallback(async () => {
    try {
      const progress = await grade3WritingProgressService.getAllProgress();
      setState({ error: null, progress, status: "success" });
    } catch (error) {
      setState((current) => ({
        error: error instanceof Error ? error : new Error("Unable to load progress"),
        progress: current.progress,
        status: "error",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(
    () =>
      grade3WritingProgressService.subscribe((next) => {
        setState((current) => {
          const withoutDay = current.progress.filter((item) => item.day !== next.day);
          const progress = [...withoutDay, next].sort((a, b) => a.day - b.day);

          return { error: null, progress, status: "success" };
        });
      }),
    [],
  );

  const saveProgress = useCallback(
    async (input: Grade3WritingProgressInput) => {
      const next = await grade3WritingProgressService.saveProgress(input);
      setState((current) => {
        const withoutDay = current.progress.filter((item) => item.day !== next.day);
        const progress = [...withoutDay, next].sort((a, b) => a.day - b.day);

        return { error: null, progress, status: "success" };
      });

      return next;
    },
    [],
  );

  const progressMap = useMemo(() => getProgressMap(state.progress), [state.progress]);
  const summary = useMemo(() => getGrade3Summary(state.progress), [state.progress]);

  return {
    ...state,
    progressMap,
    refresh,
    saveProgress,
    summary,
  };
}
