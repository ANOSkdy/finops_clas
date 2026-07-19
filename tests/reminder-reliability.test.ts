import assert from "node:assert/strict";
import test from "node:test";
import { MailProviderError, sendMailWithRetry } from "../src/lib/mail/provider";
import { canonicalReminderKey, equivalentReminderKeys } from "../src/lib/tasks/reminder-policy";

function restoreMailEnvironment(previous: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

test("legacy and canonical reminder keys resolve to one logical notification", () => {
  assert.equal(canonicalReminderKey("7d_before"), "d-7");
  assert.equal(canonicalReminderKey("today"), "d-0");
  assert.deepEqual(equivalentReminderKeys("d-3").sort(), ["3d_before", "d-3"]);
  assert.equal(canonicalReminderKey("d-30"), "d-30");
});

test("429 is retried and every provider call is paced", async () => {
  const previous = { MAIL_PROVIDER: process.env.MAIL_PROVIDER, MAIL_API_KEY: process.env.MAIL_API_KEY, MAIL_FROM: process.env.MAIL_FROM };
  process.env.MAIL_PROVIDER = "resend"; process.env.MAIL_API_KEY = "test-key"; process.env.MAIL_FROM = "noreply@example.test";
  let calls = 0;
  const sleeps: number[] = [];
  try {
    const result = await sendMailWithRetry({ to: "recipient@example.test", subject: "test", body: "test", attachments: [] }, {
      fetch: async () => {
        calls += 1;
        return calls === 1 ? new Response("", { status: 429, headers: { "retry-after": "0" } }) : new Response(JSON.stringify({ id: "mail-id" }), { status: 200 });
      },
      sleep: async (milliseconds) => { sleeps.push(milliseconds); },
      now: () => 1_000,
      random: () => 0
    });
    assert.equal(result, "mail-id");
    assert.equal(calls, 2);
    assert.ok(sleeps.some((milliseconds) => milliseconds >= 600));
  } finally {
    restoreMailEnvironment(previous);
  }
});

test("permanent provider 4xx errors are not retried", async () => {
  const previous = { MAIL_PROVIDER: process.env.MAIL_PROVIDER, MAIL_API_KEY: process.env.MAIL_API_KEY, MAIL_FROM: process.env.MAIL_FROM };
  process.env.MAIL_PROVIDER = "resend"; process.env.MAIL_API_KEY = "test-key"; process.env.MAIL_FROM = "noreply@example.test";
  let calls = 0;
  try {
    await assert.rejects(
      () => sendMailWithRetry({ to: "recipient@example.test", subject: "test", body: "test", attachments: [] }, { fetch: async () => { calls += 1; return new Response("", { status: 422 }); }, sleep: async () => {}, now: () => 1_000 }),
      (error: unknown) => error instanceof MailProviderError && error.code === "MAIL_PERMANENT"
    );
    assert.equal(calls, 1);
  } finally {
    restoreMailEnvironment(previous);
  }
});
