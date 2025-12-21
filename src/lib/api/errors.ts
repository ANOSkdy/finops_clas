export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL"
  | "AI_ERROR"
  | "STORAGE_ERROR"
  | "MAIL_ERROR";

export type ApiErrorDetail = { field: string; reason: string };

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetail[];
  };
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorDetail[]
): ApiErrorBody {
  return { error: { code, message, details } };
}