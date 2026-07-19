export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL"
  | "DATABASE_UNAVAILABLE"
  | "STORAGE_ERROR"
  | "MAIL_ERROR"
  | "MAIL_RATE_LIMITED"
  | "MAIL_TRANSIENT"
  | "MAIL_PERMANENT"
  | "MAIL_TIMEOUT"
  | "AI_ERROR";

export type ApiErrorDetail = { field: string; reason: string };

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: ApiErrorDetail[]
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorForUnknown(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error && error.message === "DATABASE_UNAVAILABLE") {
    return new AppError("DATABASE_UNAVAILABLE", "データベースを利用できません", 503);
  }
  return new AppError("INTERNAL", "処理を完了できませんでした", 500);
}
