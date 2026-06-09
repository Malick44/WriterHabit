import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { typography, type GradeBand } from "@/design/tokens";

import { canvasApi } from "../api/canvasApi";
import {
  addCanvasStroke,
  createCanvasStroke,
  eraseNearestStroke,
  getCanvasGradeAdaptation,
  pushUndoSnapshot,
  replaceCanvasStrokes,
} from "../services/canvasDocumentService";
import {
  CANVAS_AUTOSAVE_DEBOUNCE_MS,
  createCanvasAutosaveScheduler,
  type CanvasAutosaveScheduler,
} from "../services/canvasSyncService";
import type {
  CanvasDocument,
  CanvasHomeViewModel,
  CanvasPoint,
  CanvasWorkspaceViewModel,
} from "../types";
import { useCanvasToolStore } from "../stores/canvasToolStore";

export type CanvasHomeDataState =
  | { gradeBand: GradeBand; refetch: () => void; status: "loading" }
  | { gradeBand: GradeBand; refetch: () => void; status: "error" }
  | { gradeBand: GradeBand; refetch: () => void; status: "empty"; viewModel: CanvasHomeViewModel }
  | { gradeBand: GradeBand; isRefreshing: boolean; refetch: () => void; status: "success"; viewModel: CanvasHomeViewModel };

export type CanvasWorkspaceDataState =
  | { gradeBand: GradeBand; refetch: () => void; status: "loading" }
  | { gradeBand: GradeBand; refetch: () => void; status: "error" }
  | { gradeBand: GradeBand; refetch: () => void; status: "missing"; viewModel: CanvasWorkspaceViewModel }
  | {
      addPoint: (point: CanvasPoint) => void;
      attach: (assignmentId: string) => Promise<boolean>;
      gradeBand: GradeBand;
      isRefreshing: boolean;
      redo: () => void;
      refetch: () => void;
      saveNow: () => Promise<boolean>;
      status: "success";
      undo: () => void;
      viewModel: CanvasWorkspaceViewModel;
    };

function getFallbackGradeBand(gradeLevel?: number): GradeBand {
  return gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
}

function buildHomeViewModel(input: {
  connectionStatus: "online" | "offline_cached";
  documents: CanvasHomeViewModel["documents"];
  gradeLevel?: number;
}): CanvasHomeViewModel {
  const gradeAdaptation = getCanvasGradeAdaptation(input.gradeLevel);

  return {
    documents: input.documents,
    gradeAdaptation,
    hasAttachedWork: input.documents.some((document) => document.isAttached),
    isEmpty: input.documents.length === 0,
    isOffline: input.connectionStatus === "offline_cached",
  };
}

function buildWorkspaceViewModel(input: {
  assignmentId?: string;
  connectionStatus: "online" | "offline_cached";
  document: CanvasDocument | null;
  gradeLevel?: number;
  redoCount: number;
  undoCount: number;
}): CanvasWorkspaceViewModel {
  const gradeAdaptation = getCanvasGradeAdaptation(input.gradeLevel);

  return {
    canAttach: Boolean(input.assignmentId || input.document?.assignmentId),
    canRedo: input.redoCount > 0,
    canUndo: input.undoCount > 0,
    document: input.document,
    gradeAdaptation,
    isEmpty: (input.document?.strokes.length ?? 0) === 0,
    isMissing: !input.document,
    isOffline: input.connectionStatus === "offline_cached",
    strokeCount: input.document?.strokes.length ?? 0,
    syncStatus: input.document?.syncStatus ?? "local_only",
  };
}

export function useCanvasHomeData(): CanvasHomeDataState {
  const { session } = useAuthSession();
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const fallbackGradeBand = getFallbackGradeBand(gradeLevel);
  const query = useQuery({
    enabled: Boolean(session),
    queryFn: () => canvasApi.getCanvases({ gradeLevel, studentId }),
    queryKey: ["canvas-home", studentId, gradeLevel],
  });
  const refetch = () => {
    void query.refetch();
  };
  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildHomeViewModel({
      connectionStatus: query.data.connectionStatus,
      documents: query.data.documents,
      gradeLevel,
    });
  }, [gradeLevel, query.data]);

  if (query.isLoading || !session) {
    return { gradeBand: fallbackGradeBand, refetch, status: "loading" };
  }

  if (query.isError || !viewModel) {
    return { gradeBand: fallbackGradeBand, refetch, status: "error" };
  }

  if (viewModel.isEmpty) {
    return { gradeBand: viewModel.gradeAdaptation.band, refetch, status: "empty", viewModel };
  }

  return {
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: query.isFetching,
    refetch,
    status: "success",
    viewModel,
  };
}

export function useCanvasWorkspace(canvasId?: string, assignmentId?: string): CanvasWorkspaceDataState {
  const { session } = useAuthSession();
  const studentId = session?.user.id ?? "local-student";
  const gradeLevel = session?.user.gradeLevel;
  const fallbackGradeBand = getFallbackGradeBand(gradeLevel);
  const [document, setDocument] = useState<CanvasDocument | null>(null);
  const [redoCount, setRedoCount] = useState(0);
  const [undoCount, setUndoCount] = useState(0);
  const undoHistoryRef = useRef<CanvasDocument["strokes"][]>([]);
  const redoHistoryRef = useRef<CanvasDocument["strokes"][]>([]);
  const latestDocumentRef = useRef<CanvasDocument | null>(null);
  const autosaveSchedulerRef = useRef<CanvasAutosaveScheduler | null>(null);
  const saveDocumentRef = useRef<(nextDocument?: CanvasDocument) => Promise<boolean>>(async () => false);
  const query = useQuery({
    enabled: Boolean(session && canvasId),
    queryFn: () => canvasApi.getCanvas({ canvasId: canvasId ?? "", gradeLevel, studentId }),
    queryKey: ["canvas-workspace", studentId, gradeLevel, canvasId],
  });
  const refetch = () => {
    void query.refetch();
  };

  useEffect(() => {
    if (!query.data?.document) {
      return;
    }

    latestDocumentRef.current = query.data.document;
    setDocument(query.data.document);
    undoHistoryRef.current = [];
    redoHistoryRef.current = [];
    setUndoCount(0);
    setRedoCount(0);
  }, [query.data]);

  const saveDocument = useCallback(
    async (nextDocument?: CanvasDocument): Promise<boolean> => {
      const documentToSave = nextDocument ?? latestDocumentRef.current;

      if (!documentToSave) {
        return false;
      }

      const savingDocument: CanvasDocument = {
        ...documentToSave,
        syncStatus: "saving",
      };

      latestDocumentRef.current = savingDocument;
      setDocument(savingDocument);

      try {
        const savedDocument = await canvasApi.saveCanvas({
          document: savingDocument,
          gradeLevel,
          studentId,
        });
        latestDocumentRef.current = savedDocument;
        setDocument(savedDocument);
        return savedDocument.syncStatus !== "sync_failed";
      } catch {
        const failedDocument: CanvasDocument = {
          ...savingDocument,
          syncStatus: "sync_failed",
        };
        latestDocumentRef.current = failedDocument;
        setDocument(failedDocument);
        return false;
      }
    },
    [gradeLevel, studentId],
  );
  saveDocumentRef.current = saveDocument;

  if (!autosaveSchedulerRef.current) {
    autosaveSchedulerRef.current = createCanvasAutosaveScheduler({
      delayMs: CANVAS_AUTOSAVE_DEBOUNCE_MS,
      save: (nextDocument) => saveDocumentRef.current(nextDocument),
    });
  }

  const queueAutosave = useCallback(
    (nextDocument: CanvasDocument) => {
      autosaveSchedulerRef.current?.schedule(nextDocument);
    },
    [],
  );

  const setNextDocument = useCallback(
    (nextDocument: CanvasDocument) => {
      latestDocumentRef.current = nextDocument;
      setDocument(nextDocument);
      queueAutosave(nextDocument);
    },
    [queueAutosave],
  );

  const addPoint = useCallback(
    (point: CanvasPoint) => {
      const currentDocument = latestDocumentRef.current;

      if (!currentDocument) {
        return;
      }

      undoHistoryRef.current = pushUndoSnapshot(undoHistoryRef.current, currentDocument.strokes);
      redoHistoryRef.current = [];

      const stroke = createCanvasStroke({
        color: useCanvasToolStore.getState().color,
        point,
        tool: useCanvasToolStore.getState().selectedTool,
        width: useCanvasToolStore.getState().width,
      });
      const nextDocument =
        stroke.tool === "eraser" ? eraseNearestStroke(currentDocument, point) : addCanvasStroke(currentDocument, stroke);

      setUndoCount(undoHistoryRef.current.length);
      setRedoCount(0);
      setNextDocument(nextDocument);
    },
    [setNextDocument],
  );

  const undo = useCallback(() => {
    const currentDocument = latestDocumentRef.current;
    const previousStrokes = undoHistoryRef.current.at(-1);

    if (!currentDocument || !previousStrokes) {
      return;
    }

    undoHistoryRef.current = undoHistoryRef.current.slice(0, -1);
    redoHistoryRef.current = pushUndoSnapshot(redoHistoryRef.current, currentDocument.strokes);
    setUndoCount(undoHistoryRef.current.length);
    setRedoCount(redoHistoryRef.current.length);
    setNextDocument(replaceCanvasStrokes(currentDocument, previousStrokes));
  }, [setNextDocument]);

  const redo = useCallback(() => {
    const currentDocument = latestDocumentRef.current;
    const nextStrokes = redoHistoryRef.current.at(-1);

    if (!currentDocument || !nextStrokes) {
      return;
    }

    redoHistoryRef.current = redoHistoryRef.current.slice(0, -1);
    undoHistoryRef.current = pushUndoSnapshot(undoHistoryRef.current, currentDocument.strokes);
    setUndoCount(undoHistoryRef.current.length);
    setRedoCount(redoHistoryRef.current.length);
    setNextDocument(replaceCanvasStrokes(currentDocument, nextStrokes));
  }, [setNextDocument]);

  const attach = useCallback(
    async (nextAssignmentId: string) => {
      const currentDocument = latestDocumentRef.current;

      if (!canvasId || !currentDocument) {
        return false;
      }

      try {
        const attachedDocument = await canvasApi.attachCanvasToAssignment({
          assignmentId: nextAssignmentId,
          canvasId,
          gradeLevel,
          studentId,
        });
        latestDocumentRef.current = attachedDocument;
        setDocument(attachedDocument);
        return attachedDocument.syncStatus !== "sync_failed";
      } catch {
        const failedDocument: CanvasDocument = {
          ...currentDocument,
          syncStatus: "sync_failed",
        };
        latestDocumentRef.current = failedDocument;
        setDocument(failedDocument);
        return false;
      }
    },
    [canvasId, gradeLevel, studentId],
  );

  useEffect(() => {
    return () => {
      autosaveSchedulerRef.current?.cancel();

      const documentToSave = latestDocumentRef.current;

      if (documentToSave && documentToSave.syncStatus === "local_only") {
        void canvasApi.saveCanvas({ document: documentToSave, gradeLevel, studentId });
      }
    };
  }, [gradeLevel, studentId]);

  const saveNow = useCallback(() => {
    autosaveSchedulerRef.current?.cancel();

    return saveDocument();
  }, [saveDocument]);

  const viewModel = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return buildWorkspaceViewModel({
      assignmentId,
      connectionStatus: query.data.connectionStatus,
      document,
      gradeLevel,
      redoCount,
      undoCount,
    });
  }, [assignmentId, document, gradeLevel, query.data, redoCount, undoCount]);

  if (query.isLoading || !session || !canvasId) {
    return { gradeBand: fallbackGradeBand, refetch, status: "loading" };
  }

  if (query.isError || !viewModel) {
    return { gradeBand: fallbackGradeBand, refetch, status: "error" };
  }

  if (viewModel.isMissing) {
    return { gradeBand: viewModel.gradeAdaptation.band, refetch, status: "missing", viewModel };
  }

  return {
    addPoint,
    attach,
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: query.isFetching,
    redo,
    refetch,
    saveNow,
    status: "success",
    undo,
    viewModel,
  };
}
