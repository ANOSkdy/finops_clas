import assert from "node:assert/strict";
import test from "node:test";
import { calculateRatingScore } from "../src/lib/rating/scoring";
import { reminderKey } from "../src/lib/tasks/reminder-policy";
import { validateFileSignature, validateUploadMetadata } from "../src/lib/uploads/policy";

test("rating score follows metadata-v1 boundaries", () => {
  assert.deepEqual(calculateRatingScore({ fileName: "決算書.pdf", mimeType: "application/pdf", size: 1_500_000 }), { score: 77, grade: "B" });
  assert.deepEqual(calculateRatingScore({ fileName: "note.txt", mimeType: "text/plain", size: 1 }), { score: 62, grade: "C" });
});

test("upload purpose rejects PDF for trial balance and strips traversal segments", () => {
  assert.throws(() => validateUploadMetadata("trial_balance", "report.pdf", "application/pdf", 100));
  assert.equal(validateUploadMetadata("rating", "../決算書.pdf", "application/pdf", 100), "決算書.pdf");
  assert.throws(() => validateUploadMetadata("rating", "renamed.xlsx", "application/pdf", 100));
  assert.doesNotThrow(() => validateFileSignature("report.pdf", new TextEncoder().encode("%PDF-1.7")));
  assert.throws(() => validateFileSignature("report.pdf", new TextEncoder().encode("not a pdf")));
});

test("reminder policy emits stable keys", () => {
  assert.equal(reminderKey("corporate-final", "2026-08-16" as never, "2026-07-17" as never), "d-30");
  assert.equal(reminderKey("withholding-monthly", "2026-07-20" as never, "2026-07-17" as never), "d-3");
  assert.equal(reminderKey("other", "2026-07-19" as never, "2026-07-17" as never), null);
});
