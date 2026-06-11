import { z } from "zod";

const mockGetApiAccessToken = jest.fn<Promise<string | null>, []>();

jest.mock("./apiTokenProvider", () => ({
  getApiAccessToken: () => mockGetApiAccessToken(),
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
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.writewise.test/api/v1";
    devGlobal.__DEV__ = false;
    mockGetApiAccessToken.mockReset();
    mockGetApiAccessToken.mockResolvedValue(null);
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
            fallbackMessage: "WriteWise is temporarily unavailable.",
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
});
