import { AppError } from "@/lib/api/errors";

export type MailAttachment = { filename: string; content: string };
type MailInput = { to: string; subject: string; body: string; attachments: MailAttachment[] };
type FetchLike = typeof fetch;
type Sleep = (milliseconds: number) => Promise<void>;

export class MailProviderError extends AppError {
  constructor(code: "MAIL_RATE_LIMITED" | "MAIL_TRANSIENT" | "MAIL_PERMANENT" | "MAIL_TIMEOUT", status: number, public readonly retryAfterMs?: number) {
    super(code, "メールを送信できませんでした", status);
  }
}

const MIN_REQUEST_INTERVAL_MS = 600;
const MAX_ATTEMPTS = 3;
const MAX_RETRY_ELAPSED_MS = 18_000;
let nextRequestAt = 0;

const sleep: Sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function retryAfterMs(response: Response) {
  const seconds = Number(response.headers.get("retry-after"));
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > Date.now() / 1000) return reset * 1000 - Date.now();
  return undefined;
}

async function pace(now: () => number, wait: Sleep) {
  const delay = Math.max(0, nextRequestAt - now());
  if (delay) await wait(delay);
  nextRequestAt = now() + MIN_REQUEST_INTERVAL_MS;
}

export async function sendMailWithRetry(input: MailInput, options: { fetch?: FetchLike; sleep?: Sleep; now?: () => number; random?: () => number } = {}) {
  if ((process.env.MAIL_PROVIDER ?? "disabled") !== "resend") throw new MailProviderError("MAIL_PERMANENT", 503);
  const apiKey = process.env.MAIL_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) throw new MailProviderError("MAIL_PERMANENT", 503);
  const requestFetch = options.fetch ?? fetch;
  const wait = options.sleep ?? sleep;
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const startedAt = now();
  let lastError: MailProviderError | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && now() - startedAt < MAX_RETRY_ELAPSED_MS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      await pace(now, wait);
      const response = await requestFetch("https://api.resend.com/emails", {
        method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.body, ...(process.env.MAIL_REPLY_TO ? { reply_to: process.env.MAIL_REPLY_TO } : {}), attachments: input.attachments })
      });
      if (response.ok) {
        const data = (await response.json()) as { id?: unknown };
        if (typeof data.id === "string") return data.id;
        throw new MailProviderError("MAIL_TRANSIENT", 503);
      }
      const rateLimited = response.status === 429;
      if (!rateLimited && response.status >= 400 && response.status < 500) throw new MailProviderError("MAIL_PERMANENT", response.status);
      lastError = new MailProviderError(rateLimited ? "MAIL_RATE_LIMITED" : "MAIL_TRANSIENT", response.status, retryAfterMs(response));
    } catch (error) {
      if (error instanceof MailProviderError && error.code === "MAIL_PERMANENT") throw error;
      lastError = error instanceof MailProviderError ? error : new MailProviderError(error instanceof DOMException && error.name === "AbortError" ? "MAIL_TIMEOUT" : "MAIL_TRANSIENT", 503);
    } finally { clearTimeout(timeout); }
    if (attempt < MAX_ATTEMPTS && lastError && now() - startedAt < MAX_RETRY_ELAPSED_MS) {
      const backoff = Math.min(4_000, 400 * 2 ** (attempt - 1)) + Math.floor(random() * 150);
      const delay = Math.max(backoff, lastError.retryAfterMs ?? 0);
      console.info(JSON.stringify({ operation: "reminder_provider_retry", result: "retrying", code: lastError.code, attempt, delayMs: delay }));
      await wait(delay);
    }
  }
  throw lastError ?? new MailProviderError("MAIL_TRANSIENT", 503);
}

export const sendMail = sendMailWithRetry;
