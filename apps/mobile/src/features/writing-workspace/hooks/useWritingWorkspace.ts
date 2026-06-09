import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { typography, type GradeBand } from "@/design/tokens";

import { writingWorkspaceApi } from "../api/writingWorkspaceApi";
import { draftPersistenceService } from "../services/draftPersistenceService";
import {
  getWritingMetrics,
  getWritingValidation,
  getWritingWorkspaceGradeAdaptation,
} from "../services/writingMetricsService";
import type {
  WritingAutosaveStatus,
  WritingDraft,
  WritingSubmitError,
  WritingSubmissionResponse,
  WritingWorkspaceResponse,
  WritingWorkspaceViewModel,
} from "../types";

export type WritingWorkspaceDataState =
  | { status: "loading"; gradeBand: GradeBand; refetch: () => void }
  | { status: "error"; gradeBand: GradeBand; refetch: () => void }
  | { status: "missing"; gradeBand: GradeBand; refetch: () => void; viewModel: WritingWorkspaceViewModel }
  | {
      status: "success";
      gradeBand: GradeBand;
      isRefreshing: boolean;
      refetch: () => void;
      saveNow: () => Promise<boolean>;
      setText: (text: string) => void;
      submitDraft: () => Promise<WritingSubmissionResponse | null>;
      submitStatus: "idle" | "loading" | "error" | "success";
      viewModel: WritingWorkspaceViewModel;
    };

function getFallbackGradeBand(gradeLevel?: number): GradeBand {
  return gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
}

function buildViewModel(input: {
  autosaveStatus: WritingAutosaveStatus;
  response: WritingWorkspaceResponse;
  submitError: WritingSubmitError | null;
  text: string;
}): WritingWorkspaceViewModel {
  const metrics = getWritingMetrics(input.text);
  const validation = getWritingValidation(input.text);
  const gradeAdaptation = getWritingWorkspaceGradeAdaptation(input.response.gradeLevel);

  return {
    assignment: input.response.assignment,
    autosaveStatus: input.autosaveStatus,
    canSubmit: validation.canSubmit && input.autosaveStatus !== "saving",
    draft: input.response.draft
      ? {
          ...input.response.draft,
          text: input.text,
        }
      : null,
    gradeAdaptation,
    isEmptyDraft: metrics.wordCount === 0,
    isMissing: !input.response.assignment || !input.response.draft,
    isOffline: input.response.connectionStatus === "offline_cached",
    metrics,
    submitError: input.submitError ?? validation.error,
    text: input.text,
  };
}

export function useWritingWorkspace(assignmentId?: string): WritingWorkspaceDataState {
  const { session } = useAuthSession();
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const fallbackGradeBand = getFallbackGradeBand(gradeLevel);
  const [text, setTextState] = useState("");
  const [autosaveStatus, setAutosaveStatus] = useState<WritingAutosaveStatus>("restoring");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [submitError, setSubmitError] = useState<WritingSubmitError | null>(null);
  const latestTextRef = useRef("");
  const lastSavedTextRef = useRef("");
  const latestDraftRef = useRef<WritingDraft | null>(null);
  const initializedWorkspaceKeyRef = useRef<string | null>(null);
  const query = useQuery({
    enabled: Boolean(session && assignmentId),
    queryFn: () => writingWorkspaceApi.getWorkspace({ assignmentId: assignmentId ?? "", gradeLevel, studentId }),
    queryKey: ["writing-workspace", studentId, gradeLevel, assignmentId],
  });
  const refetch = () => {
    void query.refetch();
  };

  useEffect(() => {
    if (!query.data?.draft || !assignmentId) {
      return;
    }

    const workspaceKey = `${studentId}:${assignmentId}`;

    if (initializedWorkspaceKeyRef.current === workspaceKey) {
      latestDraftRef.current = {
        ...query.data.draft,
        text: latestTextRef.current,
      };
      return;
    }

    initializedWorkspaceKeyRef.current = workspaceKey;
    latestDraftRef.current = query.data.draft;
    latestTextRef.current = query.data.draft.text;
    lastSavedTextRef.current = query.data.draft.text;
    setTextState(query.data.draft.text);
    setSubmitError(null);
    setSubmitStatus("idle");
    setAutosaveStatus("saved");
  }, [assignmentId, query.data, studentId]);

  const saveDraft = useCallback(
    async (options?: { quiet?: boolean }): Promise<boolean> => {
      const draft = latestDraftRef.current;

      if (!draft) {
        return false;
      }

      const nextDraft: WritingDraft = {
        ...draft,
        text: latestTextRef.current,
      };

      latestDraftRef.current = nextDraft;

      if (!options?.quiet) {
        setAutosaveStatus("saving");
      }

      try {
        const savedDraft = await writingWorkspaceApi.saveDraft({
          assignmentId: nextDraft.assignmentId,
          draft: nextDraft,
          gradeLevel,
          studentId: nextDraft.studentId,
        });
        latestDraftRef.current = savedDraft;
        lastSavedTextRef.current = savedDraft.text;

        if (!options?.quiet) {
          setAutosaveStatus("saved");
        }

        return true;
      } catch {
        if (!options?.quiet) {
          setAutosaveStatus("failed");
        }

        return false;
      }
    },
    [gradeLevel],
  );

  const setText = useCallback((nextText: string) => {
    latestTextRef.current = nextText;
    setTextState(nextText);
    setSubmitError(null);
    setSubmitStatus("idle");
  }, []);

  useEffect(() => {
    if (!query.data?.draft || !initializedWorkspaceKeyRef.current) {
      return;
    }

    latestDraftRef.current = {
      ...query.data.draft,
      text,
    };

    if (text === lastSavedTextRef.current) {
      setAutosaveStatus("saved");
      return;
    }

    setAutosaveStatus("unsaved");
    const timeout = setTimeout(() => {
      void saveDraft();
    }, 800);

    return () => {
      clearTimeout(timeout);
    };
  }, [query.data, saveDraft, text]);

  useEffect(() => {
    return () => {
      const draft = latestDraftRef.current;

      if (!draft || latestTextRef.current === lastSavedTextRef.current) {
        return;
      }

      void draftPersistenceService.saveDraft({
        ...draft,
        text: latestTextRef.current,
      });
    };
  }, []);

  const submitDraft = useCallback(async (): Promise<WritingSubmissionResponse | null> => {
    const draft = latestDraftRef.current;

    if (!draft || !assignmentId) {
      setSubmitError("submit_failed");
      setSubmitStatus("error");
      return null;
    }

    const validation = getWritingValidation(latestTextRef.current);

    if (!validation.canSubmit) {
      setSubmitError("empty_draft");
      setSubmitStatus("error");
      return null;
    }

    setSubmitStatus("loading");
    setSubmitError(null);

    const saved = await saveDraft();

    if (!saved) {
      setSubmitError("save_failed");
      setSubmitStatus("error");
      return null;
    }

    try {
      const response = await writingWorkspaceApi.submitDraft({
        assignmentId,
        draft: {
          ...draft,
          text: latestTextRef.current,
        },
        gradeLevel,
        studentId: draft.studentId,
      });
      setSubmitStatus("success");
      return response;
    } catch {
      setSubmitError("submit_failed");
      setSubmitStatus("error");
      return null;
    }
  }, [assignmentId, gradeLevel, saveDraft]);

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildViewModel({
      autosaveStatus,
      response: query.data,
      submitError,
      text,
    });
  }, [autosaveStatus, query.data, submitError, text]);

  if (query.isLoading || !session || !assignmentId) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "loading",
    };
  }

  if (query.isError || !viewModel) {
    return {
      gradeBand: fallbackGradeBand,
      refetch,
      status: "error",
    };
  }

  if (viewModel.isMissing) {
    return {
      gradeBand: viewModel.gradeAdaptation.band,
      refetch,
      status: "missing",
      viewModel,
    };
  }

  return {
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: query.isFetching,
    refetch,
    saveNow: () => saveDraft(),
    setText,
    status: "success",
    submitDraft,
    submitStatus,
    viewModel,
  };
}
