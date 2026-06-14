const DATE_KEY_LENGTH = 10;

/** month is 1-based */
export function toUtcDateOnly(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export function startOfUtcDay(date: Date): Date {
  return toUtcDateOnly(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** month is 1-based */
export function endOfMonthUtc(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0));
}

export function addMonthsUtc(date: Date, months: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      date.getUTCDate(),
    ),
  );
}

export function addMonthsClampedUtc(date: Date, months: number): Date {
  const targetMonthStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
  const targetMonth = new Date(targetMonthStart);
  const targetYear = targetMonth.getUTCFullYear();
  const targetMonthNumber = targetMonth.getUTCMonth() + 1;
  const lastDay = endOfMonthUtc(targetYear, targetMonthNumber).getUTCDate();

  return toUtcDateOnly(targetYear, targetMonthNumber, Math.min(date.getUTCDate(), lastDay));
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, DATE_KEY_LENGTH);
}

export function adjustToNextBusinessDay(date: Date, holidays?: Set<string>): Date {
  let adjusted = startOfUtcDay(date);

  while (isWeekend(adjusted) || holidays?.has(dateKey(adjusted))) {
    adjusted = new Date(adjusted);
    adjusted.setUTCDate(adjusted.getUTCDate() + 1);
  }

  return adjusted;
}
