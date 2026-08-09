// Presentation-only formatting. The core holds amounts as minor units and days
// as `YYYY-MM-DD`; turning those into the strings a Malaysian user reads —
// "RM 1,250.00", "Today", "Sat, 26 Jul" — is a UI concern and lives here.

import {
  ALERT_THRESHOLDS,
  MINOR_UNITS_PER_MAJOR,
  addDays,
  fromLocalDay,
  safePerDay,
  type Alert,
  type CategoryBudget,
  type Cycle,
  type Forecast,
  type LocalDay,
  type SaveFeedback,
} from '../core';

/** Kira's currency symbol. v1 is ringgit-only. */
export const CURRENCY_SYMBOL = 'RM';

/** Group an integer string in threes: `1250` → `1,250`. */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format minor units without the currency symbol, e.g. `125000` → `"1,250.00"`
 * — for fields that print `RM` themselves, beside the number being typed.
 *
 * Integer arithmetic throughout: the major and minor halves are split with
 * `Math.floor` and `%`, never by dividing into a float (ADR-0006).
 */
export function formatAmount(minor: number): string {
  const absolute = Math.abs(minor);
  const major = groupThousands(String(Math.floor(absolute / MINOR_UNITS_PER_MAJOR)));
  const fraction = String(absolute % MINOR_UNITS_PER_MAJOR).padStart(2, '0');
  return `${minor < 0 ? '-' : ''}${major}.${fraction}`;
}

/** Format minor units for display, e.g. `125000` → `"RM 1,250.00"`. */
export function formatMoney(minor: number): string {
  // The sign leads the symbol — "-RM 12.50", the way a statement reads.
  return `${minor < 0 ? '-' : ''}${CURRENCY_SYMBOL} ${formatAmount(Math.abs(minor))}`;
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

/** A day as `26 Jul`, or `26 Jul 2025` when the year needs saying. */
function formatDayAndMonth(day: LocalDay, withYear: boolean): string {
  const date = fromLocalDay(day);
  const year = withYear ? ` ${date.getFullYear()}` : '';
  return `${date.getDate()} ${short(MONTHS[date.getMonth()] ?? '')}${year}`;
}

/**
 * A Cycle as its date range, e.g. `"25 Jul – 24 Aug"`.
 *
 * Deliberately a range and never a month name: a Cycle is anchored to the
 * user's payday and routinely straddles two calendar months (see ADR-0001), so
 * calling it "August" would be a lie in most of the app's states.
 */
export function formatCycleRange(cycle: Cycle): string {
  // A Cycle straddling New Year — "28 Dec – 27 Jan" — is the one case where the
  // dates alone don't say which year each end is in, so that one gets years.
  const withYear = cycle.start.slice(0, 4) !== cycle.end.slice(0, 4);
  return `${formatDayAndMonth(cycle.start, withYear)} – ${formatDayAndMonth(cycle.end, withYear)}`;
}

/** How much of the Cycle is left, e.g. `"20 days left"` / `"1 day left"`. */
export function formatDaysRemaining(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
}

/**
 * The day of the month as an ordinal — "the 25th" — for naming a payday in
 * settings and onboarding copy.
 */
export function formatOrdinalDay(day: number): string {
  // 11th–13th break the last-digit rule.
  const teen = day % 100 >= 11 && day % 100 <= 13;
  const suffix = teen ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th');
  return `${day}${suffix}`;
}

/**
 * Spend against a cap as a percent, e.g. `"115%"`.
 *
 * Rounded only here, at the very edge: the core keeps the exact figure so a bar
 * and a label never disagree, and nothing is clamped — a category 15% past its
 * cap says so.
 */
export function formatPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

/**
 * The one-line pace read on a category: what can still be spent per day, or how
 * far past the cap it already is.
 *
 * Written here rather than in `core` because it is copy — the numbers behind it
 * (`remainingMinor`, `safePerDay`) are the domain's.
 */
export function formatPaceSentence(view: CategoryBudget, daysRemaining: number): string {
  if (!view.capped) {
    return 'Tracked only — no cap set.';
  }
  if (view.overMinor > 0) {
    return `${formatMoney(view.overMinor)} over the cap.`;
  }
  const perDay = safePerDay(view.remainingMinor, daysRemaining);
  if (perDay === 0) {
    return 'Nothing left to spend this Cycle.';
  }
  return `${formatMoney(perDay)} a day keeps you under, ${formatDaysRemaining(daysRemaining)}.`;
}

/**
 * The Forecast nudge's headline (T7): where this Cycle lands for a category if
 * the user carries on as they have been (spec story 30).
 *
 * "At this pace" is doing real work in that sentence — it is what marks the
 * figure as a projection rather than money already spent, which is the one thing
 * a Forecast must never be confused with (CONTEXT.md § Forecast).
 */
export function formatForecastNudge(forecast: Forecast): string {
  return `At this pace, ${forecast.category.name} ends this Cycle ${formatMoney(
    forecast.projectedOverMinor,
  )} over its cap.`;
}

/** The Forecast nudge's second line: the way back under, in one number. */
export function formatForecastHint(forecast: Forecast): string {
  if (forecast.safePerDayMinor === 0) {
    // Already at or past the cap: there is no daily amount that keeps it under,
    // only the fact that the money is gone.
    return `Nothing left to spend this Cycle — ${formatDaysRemaining(forecast.daysRemaining)}.`;
  }
  return `${formatMoney(forecast.safePerDayMinor)} a day keeps it under, ${formatDaysRemaining(
    forecast.daysRemaining,
  )}.`;
}

/**
 * The post-save toast (T6): one line reflecting where the save left the
 * category (spec story 52). The state itself is the core's — `saveFeedback`
 * picks it off the same thresholds the Alerts use — so this is only the words.
 *
 * The streak-extended line joins these when there is a Streak to extend (T11).
 */
export function formatSaveFeedback(feedback: SaveFeedback): string {
  switch (feedback.kind) {
    case 'saved':
      return 'Expense saved.';
    case 'on-track':
      return `Saved — ${feedback.category.name} at ${formatPercent(feedback.percent)} of its cap.`;
    case 'at-threshold':
      return `Saved — ${feedback.category.name} at ${formatPercent(
        feedback.percent,
      )}, ${formatMoney(feedback.remainingMinor)} left.`;
    case 'over-budget':
      return `Saved — ${feedback.category.name} ${formatOverCap(feedback.overMinor)}.`;
  }
}

/**
 * How a category sits once it is at or past its cap — "is RM 30.00 over its
 * cap" / "has used its whole cap". Landing exactly on the cap is over-budget by
 * nothing, and saying "RM 0.00 over" would read like a rounding error.
 */
function formatOverCap(overMinor: number): string {
  return overMinor > 0 ? `is ${formatMoney(overMinor)} over its cap` : 'has used its whole cap';
}

/** The title and body of the push notification an Alert is delivered as (T6). */
export function formatAlertNotification(alert: Alert): { title: string; body: string } {
  const [, over] = ALERT_THRESHOLDS;
  const spendOfCap = `${formatMoney(alert.spentMinor)} of your ${formatMoney(alert.capMinor)} cap`;
  if (alert.threshold === over) {
    return {
      title: `${alert.category.name} is over budget`,
      body: `${spendOfCap} — it ${formatOverCap(alert.overMinor)}.`,
    };
  }
  // Only ever reached for an Alert that `announcements` let through, so the
  // percent here is below the cap and the figure left is a real one.
  return {
    title: `${alert.category.name} at ${formatPercent(alert.percent)}`,
    body: `${spendOfCap}. ${formatMoney(alert.capMinor - alert.spentMinor)} left this Cycle.`,
  };
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
