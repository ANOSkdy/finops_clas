import assert from "node:assert/strict";
import test from "node:test";
import { addMonths, asDateOnly, fiscalYearInTokyo, nextBusinessDay, todayInTokyo } from "../src/lib/date/business-date";
import { JAPAN_HOLIDAY_CALENDAR, JAPAN_PUBLIC_HOLIDAYS } from "../src/lib/date/japan-holidays";

test("Tokyo business date crosses at JST midnight", () => {
  assert.equal(todayInTokyo(new Date("2026-07-16T14:59:59.000Z")), "2026-07-16");
  assert.equal(todayInTokyo(new Date("2026-07-16T15:00:00.000Z")), "2026-07-17");
});

test("fiscal year changes on April 1 in Tokyo", () => {
  assert.equal(fiscalYearInTokyo(new Date("2026-03-31T14:59:59.000Z")), 2025);
  assert.equal(fiscalYearInTokyo(new Date("2026-03-31T15:00:00.000Z")), 2026);
});

test("date-only parsing rejects normalized and impossible calendar dates", () => {
  assert.equal(asDateOnly("2024-02-29"), "2024-02-29");
  for (const value of ["2023-02-29", "2026-02-31", "2026-13-01", "2026-7-01"]) assert.throws(() => asDateOnly(value));
});

test("month addition clamps to month end and business day skips weekends and supplied holidays", () => {
  assert.equal(addMonths("2024-01-31" as never, 1), "2024-02-29");
  assert.equal(nextBusinessDay("2026-07-18" as never), "2026-07-20");
  assert.equal(nextBusinessDay("2026-07-20" as never, new Set(["2026-07-20"])), "2026-07-21");
});

test("published Cabinet Office holidays shift across consecutive statutory holidays", () => {
  assert.equal(JAPAN_HOLIDAY_CALENDAR.version, "cao-2026-2027-v1");
  assert.equal(nextBusinessDay("2026-05-03" as never, JAPAN_PUBLIC_HOLIDAYS), "2026-05-07");
  assert.equal(nextBusinessDay("2027-03-21" as never, JAPAN_PUBLIC_HOLIDAYS), "2027-03-23");
});
