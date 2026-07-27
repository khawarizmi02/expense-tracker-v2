// Presentation-only formatting. The core holds amounts as minor units and days
// as `YYYY-MM-DD`; turning those into the strings a Malaysian user reads —
// "RM 1,250.00", "Today", "Sat, 26 Jul" — is a UI concern and lives here.

import { MINOR_UNITS_PER_MAJOR, addDays, fromLocalDay, type LocalDay } from '../core';

/** Kira's currency symbol. v1 is ringgit-only. */
export const CURRENCY_SYMBOL = 'RM';

/** Group an integer string in threes: `1250` → `1,250`. */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Format minor units for display, e.g. `125000` → `"RM 1,250.00"`. */
export function formatMoney(minor: number): string {
  const absolute = Math.abs(minor);
  const major = groupThousands(String(Math.floor(absolute / MINOR_UNITS_PER_MAJOR)));
  const fraction = String(absolute % MINOR_UNITS_PER_MAJOR).padStart(2, '0');
  return `${minor < 0 ? '-' : ''}${CURRENCY_SYMBOL} ${major}.${fraction}`;
}

/** Weekday names, Sunday first — the order `Date.getDay()` returns. */
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Month names in `Date.getMonth()` order. */
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The three-letter abbreviation used in compact dates. */
function short(name: string): string {
  return name.slice(0, 3);
}

/** A day as a short date, e.g. `"Sat, 26 Jul"`; the year shows only if it differs. */
export function formatDay(day: LocalDay, today: LocalDay): string {
  const date = fromLocalDay(day);
  const suffix = day.slice(0, 4) === today.slice(0, 4) ? '' : ` ${date.getFullYear()}`;
  const weekday = short(WEEKDAYS[date.getDay()] ?? '');
  const month = short(MONTHS[date.getMonth()] ?? '');
  return `${weekday}, ${date.getDate()} ${month}${suffix}`;
}

/**
 * A day as a heading: "Today" and "Yesterday" for the two days a user thinks of
 * by name, the short date for everything else.
 */
export function formatDayHeading(day: LocalDay, today: LocalDay): string {
  if (day === today) {
    return 'Today';
  }
  if (day === addDays(today, -1)) {
    return 'Yesterday';
  }
  return formatDay(day, today);
}
