/**
 * DATE-only helpers (UTC) to avoid timezone drift when writing to Postgres DATE columns.
 */
export function utcDate(y: number, month1to12: number, d: number): Date {
  return new Date(Date.UTC(y, month1to12 - 1, d, 0, 0, 0, 0));
}

export function startOfMonthUTC(date: Date): Date {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

export function endOfMonthUTC(date: Date): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  // 0th day of the next month is the last day of the current month
  return utcDate(y, m + 1, 0);
}

export function addMonthsUTC(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m0 = date.getUTCMonth(); // 0-11
  const d = date.getUTCDate();
  const target = new Date(Date.UTC(y, m0 + months, 1, 0, 0, 0, 0));
  const last = endOfMonthUTC(target).getUTCDate();
  const clamped = Math.min(d, last);
  return utcDate(target.getUTCFullYear(), target.getUTCMonth() + 1, clamped);
}

export function isWeekendUTC(date: Date): boolean {
  const dow = date.getUTCDay(); // 0 Sun - 6 Sat
  return dow === 0 || dow === 6;
}

/**
 * Shift a weekend date to the next weekday. (Holidays are Phase 2+.)
 */
export function shiftWeekendToNextWeekdayUTC(date: Date): Date {
  let d = date;
  while (isWeekendUTC(d)) {
    d = utcDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate() + 1);
  }
  return d;
}

export function monthIterUTC(fromInclusive: Date, toInclusive: Date): Date[] {
  const res: Date[] = [];
  let cur = startOfMonthUTC(fromInclusive);
  const end = startOfMonthUTC(toInclusive);
  while (cur.getTime() <= end.getTime()) {
    res.push(cur);
    cur = addMonthsUTC(cur, 1);
  }
  return res;
}
