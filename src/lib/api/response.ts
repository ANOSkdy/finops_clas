import { NextResponse } from "next/server";
import { apiError, ApiErrorCode, ApiErrorDetail } from "./errors";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: JSON_HEADERS });
}

export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorDetail[]
) {
  return NextResponse.json(apiError(code, message, details), {
    status,
    headers: JSON_HEADERS,
  });
}