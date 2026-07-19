const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export type DateOnly = string & { readonly __dateOnly: unique symbol };

export function asDateOnly(value: string): DateOnly {
  if (!DATE_ONLY.test(value)) throw new Error("INVALID_DATE_ONLY");
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error("INVALID_DATE_ONLY");
  return value as DateOnly;
}

export function fromDateUtc(date: Date): DateOnly {
  return date.toISOString().slice(0, 10) as DateOnly;
}

export function todayInTokyo(now = new Date()): DateOnly {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}` as DateOnly;
}

export function toUtcDate(value: DateOnly) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function addDays(value: DateOnly, days: number): DateOnly {
  const date = toUtcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return fromDateUtc(date);
}

export function addMonths(value: DateOnly, months: number, day?: number): DateOnly {
  const source = toUtcDate(value);
  const targetDay = day ?? source.getUTCDate();
  const first = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(targetDay, last));
  return fromDateUtc(first);
}

export function endOfMonth(year: number, month: number): DateOnly {
  return fromDateUtc(new Date(Date.UTC(year, month, 0)));
}

export function nextBusinessDay(value: DateOnly, holidays: ReadonlySet<string> = new Set()): DateOnly {
  let current = value;
  while (true) {
    const day = toUtcDate(current).getUTCDay();
    if (day !== 0 && day !== 6 && !holidays.has(current)) return current;
    current = addDays(current, 1);
  }
}

export function fiscalYearInTokyo(now = new Date()) {
  const today = todayInTokyo(now);
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  return month >= 4 ? year : year - 1;
}

export function displayDate(value: DateOnly) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(toUtcDate(value));
}
