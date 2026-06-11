import { z, type ZodType } from "zod";

import { clearApiSession, refreshApiAccessToken } from "./apiAuthRecovery";
import { getApiAccessToken } from "./apiTokenProvider";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ApiAuthMode = "auto" | "manual" | "omit";
export type ApiErrorKind = "auth" | "config" | "http" | "network" | "server" | "timeout" | "validation";

type QueryPrimitive = boolean | number | string;
type QueryValue = QueryPrimitive | null | undefined | (QueryPrimitive | null | undefined)[];

export type ApiQueryParams = Record<string, QueryValue> | URLSearchParams;

export interface ApiRetryOptions {
  backoffMs?: number;
  retries?: number;
}

interface ApiRequestOptions<TResponse = unknown> {
  auth?: ApiAuthMode;
  body?: unknown;
  headers?: Record<string, string>;
  method?: HttpMethod;
  query?: ApiQueryParams;
  requestId?: string;
  retry?: boolean | number | ApiRetryOptions;
  schema?: ZodType<TResponse>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

type ApiRequestOptionsWithoutBody<TResponse = unknown> = Omit<ApiRequestOptions<TResponse>, "body" | "method">;

interface ApiErrorInput {
  cause?: unknown;
  code: string;
  kind: ApiErrorKind;
  requestId?: string;
  retryable: boolean;
  safeMessage: string;
  status?: number;
}

const DEFAULT_DEV_API_BASE_URL = "http://localhost:3000/api/v1";
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_GET_RETRIES = 1;
const DEFAULT_RETRY_BACKOFF_MS = 150;
const LOCAL_HOSTNAMES = new Set(["0.0.0.0", "127.0.0.1", "::1", "[::1]", "localhost"]);

const apiErrorResponseSchema = z.object({
  error: z
    .object({
      code: z.string().min(1).optional(),
      fallbackMessage: z.string().min(1).optional(),
      requestId: z.string().min(1).optional(),
      retryable: z.boolean().optional(),
    })
    .passthrough(),
});

export class ApiError extends Error {
  readonly cause?: unknown;
  readonly code: string;
  readonly kind: ApiErrorKind;
  readonly requestId?: string;
  readonly retryable: boolean;
  readonly safeMessage: string;
  readonly status: number;

  constructor(input: ApiErrorInput) {
    super(input.safeMessage);
    this.name = "ApiError";
    this.cause = input.cause;
    this.code = input.code;
    this.kind = input.kind;
    this.requestId = input.requestId;
    this.retryable = input.retryable;
    this.safeMessage = input.safeMessage;
    this.status = input.status ?? 0;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isDevBuild(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function isLocalHostUrl(url: URL): boolean {
  return LOCAL_HOSTNAMES.has(url.hostname) || url.hostname.endsWith(".localhost");
}

function createConfigError(input: {
  code: string;
  cause?: unknown;
  requestId: string;
  safeMessage?: string;
}): ApiError {
  return new ApiError({
    cause: input.cause,
    code: input.code,
    kind: "config",
    requestId: input.requestId,
    retryable: false,
    safeMessage: input.safeMessage ?? "The app is not configured to reach WriterHabit services.",
  });
}

function resolveApiBaseUrl(requestId: string): string {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    if (isDevBuild()) {
      return DEFAULT_DEV_API_BASE_URL;
    }

    throw createConfigError({
      code: "config.api_base_url_missing",
      requestId,
    });
  }

  try {
    const url = new URL(configuredBaseUrl);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("API base URL must use http or https.");
    }

    if (!isDevBuild() && (url.protocol !== "https:" || isLocalHostUrl(url))) {
      throw new Error("Production API base URL must use https and cannot point to localhost.");
    }

    return configuredBaseUrl.replace(/\/+$/, "");
  } catch (cause) {
    throw createConfigError({
      cause,
      code: "config.api_base_url_invalid",
      requestId,
    });
  }
}

function appendQueryValue(url: URL, key: string, value: QueryValue): void {
  if (Array.isArray(value)) {
    value.forEach((entry) => appendQueryValue(url, key, entry));
    return;
  }

  if (value === null || value === undefined) {
    return;
  }

  url.searchParams.append(key, String(value));
}

function appendQueryParams(url: URL, query?: ApiQueryParams): void {
  if (!query) {
    return;
  }

  if (typeof URLSearchParams !== "undefined" && query instanceof URLSearchParams) {
    query.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    return;
  }

  Object.entries(query).forEach(([key, value]) => appendQueryValue(url, key, value));
}

function buildRequestUrl(path: string, query: ApiQueryParams | undefined, requestId: string): string {
  if (/^https?:\/\//i.test(path)) {
    throw createConfigError({
      code: "config.api_path_must_be_relative",
      requestId,
      safeMessage: "The app is not configured to reach WriterHabit services.",
    });
  }

  const baseUrl = resolveApiBaseUrl(requestId);
  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(`${baseUrl}/${normalizedPath}`);
  appendQueryParams(url, query);

  return url.toString();
}

function serializeJsonBody(body: unknown, requestId: string): string {
  try {
    const serialized = JSON.stringify(body);

    if (serialized === undefined) {
      throw new Error("Request body cannot be serialized as JSON.");
    }

    return serialized;
  } catch (cause) {
    throw new ApiError({
      cause,
      code: "validation.request_body_invalid",
      kind: "validation",
      requestId,
      retryable: false,
      safeMessage: "The request could not be prepared. Please try again.",
    });
  }
}

async function getAuthorizationToken(authMode: ApiAuthMode, requestId: string): Promise<string | null> {
  if (authMode === "manual" || authMode === "omit") {
    return null;
  }

  try {
    return await getApiAccessToken();
  } catch (cause) {
    throw new ApiError({
      cause,
      code: "auth.session_unavailable",
      kind: "auth",
      requestId,
      retryable: false,
      safeMessage: "Sign in to continue.",
    });
  }
}

function buildRequestHeaders(input: {
  authMode: ApiAuthMode;
  hasJsonBody: boolean;
  headers?: Record<string, string>;
  requestId: string;
  token: string | null;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  Object.entries(input.headers ?? {}).forEach(([name, value]) => {
    const normalizedName = name.toLowerCase();

    if (normalizedName === "accept" || normalizedName === "content-type" || normalizedName === "x-request-id") {
      return;
    }

    if (normalizedName === "authorization" && input.authMode !== "manual") {
      return;
    }

    if (value.length > 0) {
      headers[name] = value;
    }
  });

  headers.Accept = "application/json";
  headers["x-request-id"] = input.requestId;

  if (input.hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  if (input.authMode === "auto" && input.token) {
    headers.Authorization = `Bearer ${input.token}`;
  }

  return headers;
}

function createAbortSignal(input: {
  requestId: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}): {
  cleanup: () => void;
  didTimeout: () => boolean;
  signal: AbortSignal;
} {
  const controller = new AbortController();
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let timedOut = false;

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortFromCaller = () => {
    controller.abort();
  };

  if (input.signal?.aborted) {
    controller.abort();
  } else {
    input.signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  return {
    cleanup: () => {
      clearTimeout(timeout);
      input.signal?.removeEventListener("abort", abortFromCaller);
    },
    didTimeout: () => timedOut,
    signal: controller.signal,
  };
}

function getResponseHeader(response: Response, header: string): string | null {
  try {
    return response.headers.get(header);
  } catch {
    return null;
  }
}

function getResponseRequestId(response: Response, requestId: string): string {
  return getResponseHeader(response, "x-request-id") ?? getResponseHeader(response, "X-Request-Id") ?? requestId;
}

async function parseResponsePayload(response: Response, requestId: string): Promise<unknown> {
  const text = await response.text();

  if (text.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (cause) {
    if (!response.ok) {
      return undefined;
    }

    throw new ApiError({
      cause,
      code: "validation.response_json_invalid",
      kind: "validation",
      requestId,
      retryable: false,
      safeMessage: "WriterHabit received an unexpected response. Please try again.",
      status: response.status,
    });
  }
}

function parseBackendError(payload: unknown):
  | {
    code?: string;
    fallbackMessage?: string;
    requestId?: string;
    retryable?: boolean;
  }
  | null {
  const parsed = apiErrorResponseSchema.safeParse(payload);
  return parsed.success ? parsed.data.error : null;
}

function getDefaultCodeForStatus(status: number): string {
  if (status === 401) {
    return "auth.unauthorized";
  }

  if (status === 403) {
    return "authorization.denied";
  }

  if (status === 404) {
    return "resource.not_found";
  }

  if (status === 408) {
    return "network.timeout";
  }

  if (status === 409) {
    return "conflict.request";
  }

  if (status === 429) {
    return "rate_limit.too_many_requests";
  }

  if (status === 400 || status === 422) {
    return "validation.request_invalid";
  }

  if (status >= 500) {
    return "system.unavailable";
  }

  return "http.request_failed";
}

function getKindForStatus(status: number): ApiErrorKind {
  if (status === 401 || status === 403) {
    return "auth";
  }

  if (status === 400 || status === 422) {
    return "validation";
  }

  if (status === 408) {
    return "timeout";
  }

  if (status >= 500) {
    return "server";
  }

  return "http";
}

function getSafeMessageForStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "Sign in to continue.";
  }

  if (status === 400 || status === 422) {
    return "Check the request and try again.";
  }

  if (status === 404) {
    return "We could not find that item.";
  }

  if (status === 408) {
    return "The request timed out. Check your connection and try again.";
  }

  if (status === 429) {
    return "Slow down and try again soon.";
  }

  if (status >= 500) {
    return "WriterHabit services are temporarily unavailable. Please try again.";
  }

  return "The request could not be completed. Please try again.";
}

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function createHttpError(response: Response, payload: unknown, fallbackRequestId: string): ApiError {
  const backendError = parseBackendError(payload);
  const requestId = backendError?.requestId ?? fallbackRequestId;

  return new ApiError({
    code: backendError?.code ?? getDefaultCodeForStatus(response.status),
    kind: getKindForStatus(response.status),
    requestId,
    retryable: backendError?.retryable ?? isTransientStatus(response.status),
    safeMessage: backendError?.fallbackMessage ?? getSafeMessageForStatus(response.status),
    status: response.status,
  });
}

function shouldAttemptAuthRecovery(input: {
  authMode: ApiAuthMode;
  error: ApiError;
  hasAttemptedAuthRecovery: boolean;
}): boolean {
  return (
    input.authMode === "auto" &&
    !input.hasAttemptedAuthRecovery &&
    input.error.status === 401 &&
    input.error.code === "auth.expired_token" &&
    input.error.retryable
  );
}

async function recoverFromExpiredToken(error: ApiError, requestId: string): Promise<void> {
  try {
    const refreshedToken = await refreshApiAccessToken();

    if (!refreshedToken) {
      throw new Error("Session refresh did not return an access token.");
    }
  } catch (cause) {
    await clearApiSession().catch(() => undefined);

    throw new ApiError({
      cause,
      code: "auth.refresh_failed",
      kind: "auth",
      requestId: error.requestId ?? requestId,
      retryable: false,
      safeMessage: "Sign in to continue.",
      status: 401,
    });
  }
}

function validatePayload<T>(payload: unknown, schema: ZodType<T> | undefined, input: {
  requestId: string;
  status: number;
}): T {
  if (!schema) {
    return payload as T;
  }

  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError({
      cause: parsed.error,
      code: "validation.response_schema_invalid",
      kind: "validation",
      requestId: input.requestId,
      retryable: false,
      safeMessage: "WriterHabit received an unexpected response. Please try again.",
      status: input.status,
    });
  }

  return parsed.data;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function createFetchError(cause: unknown, input: {
  didTimeout: boolean;
  requestId: string;
}): ApiError {
  if (input.didTimeout) {
    return new ApiError({
      cause,
      code: "network.timeout",
      kind: "timeout",
      requestId: input.requestId,
      retryable: true,
      safeMessage: "The request timed out. Check your connection and try again.",
    });
  }

  if (isAbortError(cause)) {
    return new ApiError({
      cause,
      code: "network.aborted",
      kind: "network",
      requestId: input.requestId,
      retryable: false,
      safeMessage: "The request was cancelled.",
    });
  }

  return new ApiError({
    cause,
    code: "network.unavailable",
    kind: "network",
    requestId: input.requestId,
    retryable: true,
    safeMessage: "WriterHabit services are unavailable. Check your connection and try again.",
  });
}

function resolveRetryPolicy(method: HttpMethod, retry: ApiRequestOptions["retry"]): Required<ApiRetryOptions> {
  if (retry === false) {
    return { backoffMs: DEFAULT_RETRY_BACKOFF_MS, retries: 0 };
  }

  if (retry === true) {
    return { backoffMs: DEFAULT_RETRY_BACKOFF_MS, retries: 1 };
  }

  if (typeof retry === "number") {
    return { backoffMs: DEFAULT_RETRY_BACKOFF_MS, retries: Math.max(0, Math.floor(retry)) };
  }

  if (retry && typeof retry === "object") {
    return {
      backoffMs: retry.backoffMs ?? DEFAULT_RETRY_BACKOFF_MS,
      retries: Math.max(0, Math.floor(retry.retries ?? 0)),
    };
  }

  return {
    backoffMs: DEFAULT_RETRY_BACKOFF_MS,
    retries: method === "GET" ? DEFAULT_GET_RETRIES : 0,
  };
}

function shouldRetry(error: ApiError): boolean {
  return error.retryable && (error.kind === "network" || error.kind === "timeout" || error.kind === "server" || error.status === 429);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function executeRequest<T>(path: string, options: ApiRequestOptions<T>, requestId: string): Promise<T> {
  const method = options.method ?? "GET";
  const authMode = options.auth ?? "auto";
  const hasJsonBody = options.body !== undefined;
  const body = hasJsonBody ? serializeJsonBody(options.body, requestId) : undefined;
  const url = buildRequestUrl(path, options.query, requestId);
  const token = await getAuthorizationToken(authMode, requestId);
  const headers = buildRequestHeaders({
    authMode,
    hasJsonBody,
    headers: options.headers,
    requestId,
    token,
  });
  const abort = createAbortSignal({
    requestId,
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  });

  try {
    const response = await fetch(url, {
      body,
      headers,
      method,
      signal: abort.signal,
    });
    const responseRequestId = getResponseRequestId(response, requestId);
    const payload = response.status === 204 ? undefined : await parseResponsePayload(response, responseRequestId);

    if (!response.ok) {
      throw createHttpError(response, payload, responseRequestId);
    }

    return validatePayload(payload, options.schema, {
      requestId: responseRequestId,
      status: response.status,
    });
  } catch (cause) {
    if (cause instanceof ApiError) {
      throw cause;
    }

    throw createFetchError(cause, {
      didTimeout: abort.didTimeout(),
      requestId,
    });
  } finally {
    abort.cleanup();
  }
}

async function request<T>(path: string, options: ApiRequestOptions<T> = {}): Promise<T> {
  const method = options.method ?? "GET";
  const authMode = options.auth ?? "auto";
  const requestId = options.requestId ?? createRequestId();
  const retryPolicy = resolveRetryPolicy(method, options.retry);
  let hasAttemptedAuthRecovery = false;
  let attempt = 0;

  while (true) {
    try {
      return await executeRequest(path, { ...options, method }, requestId);
    } catch (error) {
      if (
        error instanceof ApiError &&
        shouldAttemptAuthRecovery({
          authMode,
          error,
          hasAttemptedAuthRecovery,
        })
      ) {
        hasAttemptedAuthRecovery = true;
        await recoverFromExpiredToken(error, requestId);
        continue;
      }

      if (!(error instanceof ApiError) || attempt >= retryPolicy.retries || !shouldRetry(error)) {
        throw error;
      }

      await wait(retryPolicy.backoffMs * 2 ** attempt);
      attempt += 1;
    }
  }
}

export const apiClient = {
  delete: <T>(path: string, options?: ApiRequestOptionsWithoutBody<T>) =>
    request<T>(path, { ...options, method: "DELETE" }),
  get: <T>(path: string, options?: ApiRequestOptionsWithoutBody<T>) =>
    request<T>(path, { ...options, method: "GET" }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptionsWithoutBody<T>) =>
    request<T>(path, { ...options, body, method: "PATCH" }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptionsWithoutBody<T>) =>
    request<T>(path, { ...options, body, method: "POST" }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptionsWithoutBody<T>) =>
    request<T>(path, { ...options, body, method: "PUT" }),
  request,
};
