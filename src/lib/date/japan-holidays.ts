/**
 * Published national holidays and statutory holidays from the Cabinet Office.
 * The source currently publishes through 2027; dates after the coverage end are
 * deliberately not predicted because equinox dates are announced annually.
 * Source: https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html
 */
export const JAPAN_HOLIDAY_CALENDAR = {
  version: "cao-2026-2027-v1",
  effectiveFrom: "2026-01-01",
  effectiveTo: "2027-12-31",
  source: "Cabinet Office, Government of Japan"
} as const;

const publishedDates = [
  "2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23", "2026-03-20",
  "2026-04-29", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06",
  "2026-07-20", "2026-08-11", "2026-09-21", "2026-09-22", "2026-09-23",
  "2026-10-12", "2026-11-03", "2026-11-23",
  "2027-01-01", "2027-01-11", "2027-02-11", "2027-02-23", "2027-03-21",
  "2027-03-22", "2027-04-29", "2027-05-03", "2027-05-04", "2027-05-05",
  "2027-07-19", "2027-08-11", "2027-09-20", "2027-09-23", "2027-10-11",
  "2027-11-03", "2027-11-23"
] as const;

export const JAPAN_PUBLIC_HOLIDAYS: ReadonlySet<string> = new Set(publishedDates);
