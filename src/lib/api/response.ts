import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { AppError, errorForUnknown } from "./errors";

export function jsonError(error: AppError) {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      }
    },
    { status: error.status }
  );
}

export function validationError(error: ZodError) {
  return jsonError(
    new AppError(
      "VALIDATION_ERROR",
      "入力に誤りがあります",
      400,
      error.issues.map((issue) => ({ field: issue.path.join("."), reason: issue.code }))
    )
  );
}

export async function withApiError<T extends Response>(operation: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await operation();
  } catch (error) {
    const safeError = errorForUnknown(error);
    if (safeError.status >= 500 && process.env.NODE_ENV !== "test") {
      console.error(JSON.stringify({ operation: "api_request", result: "failed", code: safeError.code }));
    }
    return jsonError(safeError);
  }
}

export async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "JSON形式の入力が必要です", 400);
  }
}
