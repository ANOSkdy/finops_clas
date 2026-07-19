"use client";

export type ErrorDetail = { field: string; reason: string };

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details: ErrorDetail[] = [], public readonly payload?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const hasJsonBody = Boolean(init?.body) && !(init?.body instanceof FormData);
  const response = await fetch(path, { ...init, credentials: "include", headers: { ...(hasJsonBody ? { "content-type": "application/json" } : {}), ...init?.headers } });
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const envelope = parseError(payload);
    if (response.status === 401 && typeof window !== "undefined") {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
    }
    throw new ApiError(response.status, envelope.code, envelope.message, envelope.details, payload);
  }
  return payload as T;
}

function parseError(payload: unknown) {
  const fallback = { code: "INTERNAL", message: "通信に失敗しました", details: [] as ErrorDetail[] };
  if (!payload || typeof payload !== "object" || !("error" in payload)) return fallback;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return fallback;
  const value = error as { code?: unknown; message?: unknown; details?: unknown };
  return {
    code: typeof value.code === "string" ? value.code : fallback.code,
    message: typeof value.message === "string" ? value.message : fallback.message,
    details: Array.isArray(value.details) ? value.details.filter((item): item is ErrorDetail => Boolean(item && typeof item === "object" && "field" in item && "reason" in item)) : []
  };
}
