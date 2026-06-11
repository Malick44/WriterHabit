import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import type { WritingDraft, WritingWorkspaceResponse } from "../types";
import { useWritingWorkspace } from "./useWritingWorkspace";

jest.mock("@/core/auth/useAuthSession", () => ({
  useAuthSession: () => ({
    session: { user: { gradeLevel: 7, id: "student-1" } },
  }),
}));

jest.mock("../api/writingWorkspaceApi", () => ({
  writingWorkspaceApi: {
    getWorkspace: jest.fn(),
    saveDraft: jest.fn(),
    submitDraft: jest.fn(),
  },
}));

jest.mock("../services/draftPersistenceService", () => ({
  draftPersistenceService: {
    saveDraft: jest.fn().mockResolvedValue(undefined),
  },
}));

const { writingWorkspaceApi } = jest.requireMock("../api/writingWorkspaceApi") as {
  writingWorkspaceApi: {
    getWorkspace: jest.Mock;
    saveDraft: jest.Mock;
    submitDraft: jest.Mock;
  };
};

function createDraft(text: string): WritingDraft {
  return {
    assignmentId: "assignment-1",
    canvasAttachment: null,
    createdAt: "2026-06-10T00:00:00.000Z",
    revisionNumber: 1,
    studentId: "student-1",
    text,
    updatedAt: "2026-06-10T00:00:00.000Z",
  };
}

function createWorkspaceResponse(): WritingWorkspaceResponse {
  return {
    assignment: {
      assignedLabel: "Assigned",
      assignmentType: "paragraph_writing",
      difficulty: "moderate",
      draft: null,
      dueLabel: "Today",
      estimatedMinutes: 15,
      gradeLevelMax: 8,
      gradeLevelMin: 6,
      id: "assignment-1",
      instructions: ["Write one focused paragraph."],
      prompt: "Describe a place you know well.",
      rubric: [{ description: "Clear main idea", id: "criterion-1", label: "Focus" }],
      rubricId: "rubric-1",
      skillFocus: ["clarity"],
      status: "in_progress",
      title: "Paragraph practice",
    },
    connectionStatus: "online",
    draft: createDraft(""),
    generatedAt: "2026-06-10T00:00:00.000Z",
    gradeLevel: 7,
    studentId: "student-1",
  };
}

let activeQueryClient: QueryClient | null = null;

function createWrapper() {
  // gcTime Infinity avoids scheduling a garbage-collection timer that would
  // keep the Jest process alive; the cache is cleared explicitly in afterEach.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });
  activeQueryClient = queryClient;

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useWritingWorkspace autosave", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    writingWorkspaceApi.getWorkspace.mockResolvedValue(createWorkspaceResponse());
  });

  afterEach(() => {
    activeQueryClient?.clear();
    activeQueryClient = null;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("serializes saves so an older slow save cannot finish after a newer one", async () => {
    const resolvers: ((draft: WritingDraft) => void)[] = [];
    writingWorkspaceApi.saveDraft.mockImplementation(
      () =>
        new Promise<WritingDraft>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const { result } = await renderHook(() => useWritingWorkspace("assignment-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current?.status).toBe("success");
    });

    const getSuccessState = () => {
      if (result.current?.status !== "success") {
        throw new Error("Expected workspace success state");
      }
      return result.current;
    };

    // First edit schedules a save and the debounce fires it.
    await act(async () => {
      getSuccessState().setText("first version");
    });
    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    expect(writingWorkspaceApi.saveDraft).toHaveBeenCalledTimes(1);

    // Second edit fires while the first save is still in flight. The second
    // save must wait for the first instead of racing it.
    await act(async () => {
      getSuccessState().setText("second version");
    });
    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    expect(writingWorkspaceApi.saveDraft).toHaveBeenCalledTimes(1);

    // The slow first save resolves; only then may the second save start, and
    // it must carry the newest text.
    await act(async () => {
      resolvers[0]?.(createDraft("first version"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(writingWorkspaceApi.saveDraft).toHaveBeenCalledTimes(2);
    });
    expect(writingWorkspaceApi.saveDraft.mock.calls[1]?.[0]?.draft.text).toBe("second version");

    // Resolving the first save while newer text exists must not report saved.
    expect(getSuccessState().viewModel.autosaveStatus).not.toBe("saved");

    await act(async () => {
      resolvers[1]?.(createDraft("second version"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(getSuccessState().viewModel.autosaveStatus).toBe("saved");
    });
  });
});
