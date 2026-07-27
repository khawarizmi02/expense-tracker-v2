// The calendar day, Kira's unit of time.
//
// A `LocalDay` is the device-local calendar day as `YYYY-MM-DD` — the boundary
// is local midnight and "today" follows the phone's current timezone (see
// CONTEXT.md § Day). Keeping days as plain strings means the core never touches
// a clock or a timezone: the adapter converts a `Date` at the edge with
// `toLocalDay`, and everything downstream compares strings.

/** A device-local calendar day, formatted `YYYY-MM-DD`. */
export type LocalDay = string;

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Whether `day` is a well-formed `YYYY-MM-DD` string naming a real date. */
export function isValidDay(day: string): boolean {
  const match = DAY_PATTERN.exec(day);
  if (!match) {
    return false;
  }
  const [, year, month, date] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(date));
  // Round-tripping catches overflow dates like 2026-02-30, which the Date
  // constructor silently rolls forward into March.
  return (
    parsed.getFullYear() === Number(year) &&
    parsed.getMonth() === Number(month) - 1 &&
    parsed.getDate() === Number(date)
  );
}

/** The device-local calendar day `date` falls on. */
export function toLocalDay(date: Date): LocalDay {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Midnight at the start of `day`, in device-local time. The inverse of
 * `toLocalDay`, for UI that needs to do calendar arithmetic.
 */
export function fromLocalDay(day: LocalDay): Date {
  const match = DAY_PATTERN.exec(day);
  if (!match) {
    throw new Error(`Not a YYYY-MM-DD day: ${day}`);
  }
  const [, year, month, date] = match;
  return new Date(Number(year), Number(month) - 1, Number(date));
}

/** The day `delta` days from `day`, rolling over month and year boundaries. */
export function addDays(day: LocalDay, delta: number): LocalDay {
  const date = fromLocalDay(day);
  date.setDate(date.getDate() + delta);
  return toLocalDay(date);
}

/**
 * Compare two days chronologically. `YYYY-MM-DD` is fixed-width and
 * zero-padded, so lexicographic order is already calendar order.
 */
export function compareDays(a: LocalDay, b: LocalDay): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
