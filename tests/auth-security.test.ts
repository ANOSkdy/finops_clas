import assert from "node:assert/strict";
import test from "node:test";
import { hashSessionToken } from "../src/lib/auth/session";
import { safeInternalPath } from "../src/lib/auth/redirect";
import { assertSameOrigin } from "../src/lib/api/origin";
import { AppError } from "../src/lib/api/errors";

test("session token is stored as a deterministic HMAC and never as plaintext", () => {
  const token = "fixture-input";
  const hash = hashSessionToken(token, "a".repeat(32));
  assert.equal(hash.length, 64);
  assert.notEqual(hash, token);
  assert.equal(hash, hashSessionToken(token, "a".repeat(32)));
  assert.notEqual(hash, hashSessionToken(token, "b".repeat(32)));
});

test("login return path only accepts internal relative routes", () => {
  assert.equal(safeInternalPath("/schedule?status=overdue"), "/schedule?status=overdue");
  for (const unsafe of ["https://example.com", "//example.com", "/%2F%2Fevil.example", "javascript:alert(1)", "/\\evil.example"]) {
    assert.equal(safeInternalPath(unsafe), "/selectcompany");
  }
});

test("browser mutations require an exact same-origin header", () => {
  assert.doesNotThrow(() => assertSameOrigin(new Request("https://clas.example/api/test", { headers: { origin: "https://clas.example" } })));
  for (const request of [
    new Request("https://clas.example/api/test"),
    new Request("https://clas.example/api/test", { headers: { origin: "https://attacker.example" } })
  ]) {
    assert.throws(() => assertSameOrigin(request), (error: unknown) => error instanceof AppError && error.code === "FORBIDDEN");
  }
});
