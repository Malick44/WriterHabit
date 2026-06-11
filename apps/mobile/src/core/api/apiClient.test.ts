import { z } from "zod";

const mockGetApiAccessToken = jest.fn<Promise<string | null>, []>();
const mockRefreshApiAccessToken = jest.fn<Promise<string | null>, []>();
const mockClearApiSession = jest.fn<Promise<void>, []>();

jest.mock("./apiTokenProvider", () => ({
  getApiAccessToken: () => mockGetApiAccessToken(),
}));

jest.mock("./apiAuthRecovery", () => ({
  clearApiSession: () => mockClearApiSession(),
  refreshApiAccessToken: () => mockRefreshApiAccessToken(),
}));

import { ApiError, apiClient } from "./apiClient";

function createMockResponse(input: {
  body?: unknown;
  headers?: Record<string, string>;
  status: number;
}): Response {
  const headers = new Map(
    Object.entries(input.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
  );
  const responseBody =
    input.body === undefined ? "" : typeof input.body === "string" ? input.body : JSON.stringify(input.body);

  return {
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()) ?? null,
    },
    ok: input.status >= 200 && input.status < 300,
    status: input.status,
    text: jest.fn().mockResolvedValue(responseBody),
  } as unknown as Response;
}

describe("apiClient", () => {
  const devGlobal = globalThis as { __DEV__?: boolean };
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const originalDev = devGlobal.__DEV__;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.WriterHabit.test/api/v1";
    devGlobal.__DEV__ = false;
    mockGetApiAccessToken.mockReset();
    mockGetApiAccessToken.mockResolvedValue(null);
    mockRefreshApiAccessToken.mockReset();
    mockRefreshApiAccessToken.mockResolvedValue("refreshed-token");
    mockClearApiSession.mockReset();
    mockClearApiSession.mockResolvedValue(undefined);
    jest.useRealTimers();
  });

  afterEach(() => {
    if (originalApiBaseUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    }

    devGlobal.__DEV__ = originalDev;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("fails closed when the production API base URL is missing", async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    devGlobal.__DEV__ = false;

    await expect(apiClient.get("/health", { retry: false })).rejects.toMatchObject({
      code: "config.api_base_url_missing",
      kind: "config",
      retryable: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the localhost fallback only in development", async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    devGlobal.__DEV__ = true;
    fetchMock.mockResolvedValue(createMockResponse({ status: 204 }));

    await expect(apiClient.get<void>("/health", { retry: false })).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/health",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("injects the Supabase bearer token when a session exists", async () => {
    mockGetApiAccessToken.mockResolvedValue("access-token-123");
    fetchMock.mockResolvedValue(createMockResponse({ status: 204 }));

    await apiClient.get<void>("/students/me", {
      requestId: "req_test_auth",
      retry: false,
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(requestInit.headers).toMatchObject({
      Accept: "application/json",
      Authorization: "Bearer access-token-123",
      "x-request-id": "req_test_auth",
    });
    expect((requestInit.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("classifies timed-out requests", async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation((_url, init) => {
      const signal = init?.signal as AbortSignal;

      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          const error = new Error("Aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    });

    const request = apiClient.get("/slow", {
      retry: false,
      timeoutMs: 25,
    });

    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(25);

    await expect(request).rejects.toMatchObject({
      code: "network.timeout",
      kind: "timeout",
      retryable: true,
    });
  });

  it("handles 204 and empty responses without parsing JSON", async () => {
    fetchMock.mockResolvedValue(createMockResponse({ status: 204 }));

    await expect(apiClient.delete<void>("/drafts/draft-1", { retry: false })).resolves.toBeUndefined();
  });

  it("parses structured backend API errors", async () => {
    fetchMock.mockResolvedValue(
      createMockResponse({
        body: {
          error: {
            code: "authorization.student_scope_denied",
            fallbackMessage: "You do not have access to this student profile.",
            requestId: "req_backend_123",
            retryable: false,
          },
        },
        status: 403,
      }),
    );

    await expect(apiClient.get("/students/student-1", { retry: false })).rejects.toMatchObject({
      code: "authorization.student_scope_denied",
      kind: "auth",
      message: "You do not have access to this student profile.",
      requestId: "req_backend_123",
      retryable: false,
      status: 403,
    });
  });

  it("throws a structured validation error when a Zod response schema fails", async () => {
    fetchMock.mockResolvedValue(
      createMockResponse({
        body: { status: "not-ok" },
        status: 200,
      }),
    );

    await expect(
      apiClient.get<{ status: "ok" }>("/validated", {
        retry: false,
        schema: z.object({ status: z.literal("ok") }),
      }),
    ).rejects.toMatchObject({
      code: "validation.response_schema_invalid",
      kind: "validation",
      retryable: false,
      status: 200,
    });
  });

  it("does not retry mutations by default", async () => {
    fetchMock.mockResolvedValue(
      createMockResponse({
        body: {
          error: {
            code: "system.unavailable",
            fallbackMessage: "WriterHabit is temporarily unavailable.",
            requestId: "req_backend_500",
            retryable: true,
          },
        },
        status: 503,
      }),
    );

    await expect(apiClient.post("/submissions", { text: "draft" })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refreshes an expired Supabase token once and retries the request", async () => {
    mockGetApiAccessToken.mockResolvedValueOnce("expired-token").mockResolvedValueOnce("fresh-token");
    mockRefreshApiAccessToken.mockResolvedValue("fresh-token");
    fetchMock
      .mockResolvedValueOnce(
        createMockResponse({
          body: {
            error: {
              code: "auth.expired_token",
              fallbackMessage: "Your session expired. Sign in again.",
              requestId: "req_expired",
              retryable: true,
            },
          },
          status: 401,
        }),
      )
      .mockResolvedValueOnce(
        createMockResponse({
          body: { status: "ok" },
          status: 200,
        }),
      );

    await expect(
      apiClient.get<{ status: "ok" }>("/students/me", {
        requestId: "req_auth_retry",
        retry: false,
        schema: z.object({ status: z.literal("ok") }),
      }),
    ).resolves.toEqual({ status: "ok" });

    expect(mockRefreshApiAccessToken).toHaveBeenCalledTimes(1);
    expect(mockClearApiSession).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({
      Authorization: "Bearer expired-token",
      "x-request-id": "req_auth_retry",
    });
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).headers).toMatchObject({
      Authorization: "Bearer fresh-token",
      "x-request-id": "req_auth_retry",
    });
  });

  it("clears the Supabase session and returns a safe auth error when refresh fails", async () => {
    mockGetApiAccessToken.mockResolvedValue("expired-token");
    mockRefreshApiAccessToken.mockRejectedValue(new Error("refresh failed with provider detail"));
    fetchMock.mockResolvedValue(
      createMockResponse({
        body: {
          error: {
            code: "auth.expired_token",
            fallbackMessage: "Your session expired. Sign in again.",
            requestId: "req_refresh_failed",
            retryable: true,
          },
        },
        status: 401,
      }),
    );

    await expect(apiClient.get("/students/me", { retry: false })).rejects.toMatchObject({
      code: "auth.refresh_failed",
      kind: "auth",
      message: "Sign in to continue.",
      requestId: "req_refresh_failed",
      retryable: false,
      status: 401,
    });
    expect(mockRefreshApiAccessToken).toHaveBeenCalledTimes(1);
    expect(mockClearApiSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not refresh or retry forbidden authorization failures", async () => {
    mockGetApiAccessToken.mockResolvedValue("valid-token");
    fetchMock.mockResolvedValue(
      createMockResponse({
        body: {
          error: {
            code: "authorization.student_scope_denied",
            fallbackMessage: "You do not have access to this student profile.",
            requestId: "req_forbidden",
            retryable: false,
          },
        },
        status: 403,
      }),
    );

    await expect(apiClient.get("/students/student-2", { retry: false })).rejects.toMatchObject({
      code: "authorization.student_scope_denied",
      status: 403,
    });
    expect(mockRefreshApiAccessToken).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not enter an infinite refresh loop when the retried request is still unauthorized", async () => {
    mockGetApiAccessToken.mockResolvedValueOnce("expired-token").mockResolvedValueOnce("fresh-token");
    mockRefreshApiAccessToken.mockResolvedValue("fresh-token");
    fetchMock.mockResolvedValue(
      createMockResponse({
        body: {
          error: {
            code: "auth.expired_token",
            fallbackMessage: "Your session expired. Sign in again.",
            requestId: "req_still_expired",
            retryable: true,
          },
        },
        status: 401,
      }),
    );

    await expect(apiClient.get("/students/me", { retry: false })).rejects.toMatchObject({
      code: "auth.expired_token",
      requestId: "req_still_expired",
      status: 401,
    });
    expect(mockRefreshApiAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
