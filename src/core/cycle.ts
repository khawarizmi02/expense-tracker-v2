// Cycle domain logic (T4) — the payday-aligned budget window (ADR-0001).
//
// There is one global Cycle for the whole app, anchored to the user's chosen
// start day (their payday). Kira is not pinned to the calendar month: a Cycle
// can run the 25th → 24th. Start days that don't exist in a short month clamp
// back to that month's last day (31 → Feb 28/29, Apr 30, …).
//
// Pure like the rest of `core`: every function takes the reference day the
// caller read off the clock. Nothing here calls `new Date()` on its own.

import { addDays, compareDays, fromLocalDay, isValidDay, toLocalDay, type LocalDay } from './day';
import type { Cycle } from './types';

export class CycleError extends Error {}

/** The Cycle start day a user gets before they pick one: the 1st. */
export const DEFAULT_CYCLE_START_DAY = 1;

/** Whether `startDay` is a day of the month a user may anchor their Cycle to. */
export function isValidCycleStartDay(startDay: number): boolean {
  return Number.isInteger(startDay) && startDay >= 1 && startDay <= 31;
}

/**
 * Whether a start day doesn't exist in every month, and so will clamp back to
 * some months' last day. The UI warns about exactly these days — which ones
 * they are is a Cycle rule, so it's decided here rather than in a screen.
 */
export function clampsInShortMonths(startDay: number): boolean {
  // February is the shortest month at 28 days, so 29–31 are the clamping days.
  return isValidCycleStartDay(startDay) && startDay > 28;
}

function requireStartDay(startDay: number): number {
  if (!isValidCycleStartDay(startDay)) {
    throw new CycleError(`Cycle start day must be a whole day 1–31, got ${startDay}`);
  }
  return startDay;
}

function requireDay(day: string): LocalDay {
  if (!isValidDay(day)) {
    throw new CycleError(`Not a valid YYYY-MM-DD day: ${day}`);
  }
  return day;
}

/** How many days `month` (0-indexed, as `Date` counts them) has in `year`. */
function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(year, month + 1, 0).getDate();
}

/**
 * The day payday actually falls on in a given month — the start day, clamped
 * back to the month's last day when it doesn't reach that far (start day 31 in
 * February, say). This clamping is what keeps a Cycle anchored to a payday the
 * user recognises instead of silently sliding into the next month.
 */
function paydayIn(year: number, month: number, startDay: number): LocalDay {
  const date = Math.min(startDay, daysInMonth(year, month));
  return toLocalDay(new Date(year, month, date));
}

/**
 * The Cycle containing `today`, for a user whose payday is `startDay`.
 *
 * The Cycle starts on the most recent payday at or before `today` and ends the
 * day before the following payday — so consecutive Cycles tile the calendar
 * exactly, with no day belonging to none or to two.
 */
export function currentCycle(startDay: number, today: LocalDay): Cycle {
  requireStartDay(startDay);
  const now = fromLocalDay(requireDay(today));
  const year = now.getFullYear();
  const month = now.getMonth();

  const thisMonthsPayday = paydayIn(year, month, startDay);
  // Before this month's payday, the user is still spending last month's pay.
  const start =
    compareDays(today, thisMonthsPayday) >= 0
      ? thisMonthsPayday
      : paydayIn(year, month - 1, startDay);

  const startDate = fromLocalDay(start);
  const nextPayday = paydayIn(startDate.getFullYear(), startDate.getMonth() + 1, startDay);

  return { startDay, start, end: addDays(nextPayday, -1) };
}

/** Whether `day` falls inside `cycle`, both boundary days included. */
export function containsDay(cycle: Cycle, day: LocalDay): boolean {
  return compareDays(day, cycle.start) >= 0 && compareDays(day, cycle.end) <= 0;
}

/** Whole days between two days; `daysBetween(d, d)` is 0. */
function daysBetween(from: LocalDay, to: LocalDay): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  // Round rather than floor: a DST shift inside the span makes the difference
  // an hour short of a whole number of days.
  return Math.round((fromLocalDay(to).getTime() - fromLocalDay(from).getTime()) / MS_PER_DAY);
}

/** How many days the Cycle spans, both boundary days included (28–31). */
export function cycleLength(cycle: Cycle): number {
  return daysBetween(cycle.start, cycle.end) + 1;
}

/**
 * Days of the Cycle used up as of `today`, counting today — payday itself is
 * day 1. This is the denominator the Forecast's run-rate divides by.
 */
export function daysElapsed(cycle: Cycle, today: LocalDay): number {
  return daysBetween(cycle.start, today) + 1;
}

/**
 * Days of the Cycle left as of `today`, counting today — the final day reads
 * "1 day left", never a confusing "0 days left" while money can still be spent.
 */
export function daysRemaining(cycle: Cycle, today: LocalDay): number {
  return daysBetween(today, cycle.end) + 1;
}
