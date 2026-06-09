import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { AiCoachApiError, aiCoachApi } from "../api/aiCoachApi";
import type {
  AiCoachContext,
  AiCoachRequestInput,
  AiCoachResponse,
  AiCoachState,
} from "../types";

const initialState: AiCoachState = {
  error: null,
  lastAction: null,
  response: null,
  status: "idle",
};

function getStatusFromResponse(response: AiCoachResponse): AiCoachState["status"] {
  switch (response.state) {
    case "empty":
      return "empty";
    case "safety_blocked":
      return "safety_blocked";
    case "success":
      return "success";
  }
}

function getErrorState(error: unknown): Pick<AiCoachState, "error" | "status"> {
  if (error instanceof AiCoachApiError && error.code === "offline") {
    return {
      error: error.message,
      status: "offline",
    };
  }

  return {
    error: error instanceof Error ? error.message : "AI coach request failed",
    status: "error",
  };
}

export function useAiCoach() {
  const [state, setState] = useState<AiCoachState>(initialState);
  const lastRequestRef = useRef<AiCoachRequestInput | null>(null);
  const mutation = useMutation({
    gcTime: 60_000,
    mutationFn: (input: AiCoachRequestInput) => aiCoachApi.requestCoaching(input),
  });

  const requestCoaching = useCallback(
    async (context: AiCoachContext): Promise<AiCoachResponse | null> => {
      const input = { context };

      lastRequestRef.current = input;
      setState({
        error: null,
        lastAction: context.requestedAction,
        response: null,
        status: "loading",
      });

      try {
        const response = await mutation.mutateAsync(input);
        setState({
          error: null,
          lastAction: context.requestedAction,
          response,
          status: getStatusFromResponse(response),
        });

        return response;
      } catch (error) {
        const errorState = getErrorState(error);

        setState({
          ...errorState,
          lastAction: context.requestedAction,
          response: null,
        });

        return null;
      }
    },
    [mutation],
  );

  const retry = useCallback(async (): Promise<AiCoachResponse | null> => {
    const request = lastRequestRef.current;

    if (!request) {
      return null;
    }

    return requestCoaching(request.context);
  }, [requestCoaching]);

  const reset = useCallback(() => {
    lastRequestRef.current = null;
    mutation.reset();
    setState(initialState);
  }, [mutation]);

  return {
    ...state,
    isLoading: state.status === "loading",
    requestCoaching,
    reset,
    retry,
  };
}
