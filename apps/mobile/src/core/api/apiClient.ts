export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

type ApiRequestOptionsWithoutBody = Omit<ApiRequestOptions, "body" | "method">;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  delete: <T>(path: string, options?: ApiRequestOptionsWithoutBody) =>
    request<T>(path, { ...options, method: "DELETE" }),
  get: <T>(path: string, options?: ApiRequestOptionsWithoutBody) =>
    request<T>(path, { ...options, method: "GET" }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptionsWithoutBody) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptionsWithoutBody) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptionsWithoutBody) =>
    request<T>(path, { ...options, method: "PUT", body }),
};
