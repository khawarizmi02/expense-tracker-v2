// Forecast domain logic (T7) — the predictive nudge on a capped category.
//
// A Forecast is a *soft projection* of where this Cycle ends up if the user
// keeps spending as they have been: `spent ÷ days elapsed × days in Cycle`
// (CONTEXT.md § Forecast). It is a nudge, not a prediction engine — deliberately
// naive, knowingly rough for lumpy categories, and silent for the first few days
// of a Cycle so one early purchase can't raise a false alarm (spec story 31).
//
// Distinct from an Alert, which is about spend that has **already happened**:
// an Alert fires once at a threshold and is done, while a Forecast is ambient
// and keeps answering "and where does this end up?" — including for a category
// that is already over, where the question is how much worse it gets.
//
// Pure like the rest of `core`: no clock, no I/O. The caller passes the Cycle
// and the day it read off the device.

import { safePerDay } from './budget';
import { cycleLength, daysElapsed, daysRemaining } from './cycle';
import type { CappedCategoryBudget, CategoryBudget } from './budget';
import type { LocalDay } from './day';
import type { Category, Cycle } from './types';

/**
 * How many days into a Cycle the Forecast stays quiet for. Module-private: the
 * window is only ever visible as silence, never as a number a screen prints.
 *
 * On day one a single RM 150 dinner projects to RM 4,650 — arithmetically
 * correct and completely useless. Three days is long enough for the run-rate to
 * mean something and short enough that a genuinely runaway Cycle is still caught
 * with most of it left to fix.
 */
const FORECAST_SUPPRESSION_DAYS = 3;

/**
 * Where a capped category's Cycle is heading — everything the nudge on Home,
 * Insights and category detail is written from.
 *
 * Only ever built for a category projected to finish *over* its cap: a category
 * on pace to come in under has nothing to course-correct, and a nudge there
 * would be noise.
 */
export interface Forecast {
  readonly category: Category;
  /** The cap for this Cycle, in minor units. */
  readonly capMinor: number;
  /** Actual spend so far this Cycle, in minor units. */
  readonly spentMinor: number;
  /** Where spend lands by the Cycle's end at this run-rate, in minor units. */
  readonly projectedMinor: number;
  /** How far past the cap the projection lands; always above zero. */
  readonly projectedOverMinor: number;
  /** The projection as a percent of the cap; unrounded, as `core` keeps it. */
  readonly projectedPercent: number;
  /** Days of the Cycle used up, counting today — the run-rate's denominator. */
  readonly daysElapsed: number;
  /** Days of the Cycle left, counting today. */
  readonly daysRemaining: number;
  /**
   * What can still be spent per remaining day and land inside the cap — the
   * "RM X a day keeps it under" half of the nudge. `0` once the cap is spent:
   * there is no safe daily amount left to quote, only an amount to stop at.
   */
  readonly safePerDayMinor: number;
}

/**
 * Whether the Cycle is still inside the window where the Forecast says nothing.
 *
 * Also true for a day before the Cycle even started — a caller looking at a
 * stale Cycle gets silence rather than a projection divided by zero.
 */
function isSuppressed(elapsed: number): boolean {
  return elapsed <= FORECAST_SUPPRESSION_DAYS;
}

/**
 * Spend so far, run out to the end of the Cycle at the same daily rate.
 *
 * Multiplied before dividing and rounded to a whole minor unit: money in Kira is
 * integer sen (ADR-0006), and a projection that carried a fraction of a sen
 * would be a float pretending to be money.
 */
function project(spentMinor: number, cycle: Cycle, elapsed: number): number {
  return Math.round((spentMinor * cycleLength(cycle)) / elapsed);
}

function forecastOf(
  view: CappedCategoryBudget,
  cycle: Cycle,
  today: LocalDay,
  elapsed: number,
): Forecast | undefined {
  const projectedMinor = project(view.spentMinor, cycle, elapsed);
  const projectedOverMinor = projectedMinor - view.capMinor;
  // On pace to come in under (or exactly on) the cap: nothing to nudge about.
  if (projectedOverMinor <= 0) {
    return undefined;
  }

  const remaining = daysRemaining(cycle, today);
  return {
    category: view.category,
    capMinor: view.capMinor,
    spentMinor: view.spentMinor,
    projectedMinor,
    projectedOverMinor,
    projectedPercent: (projectedMinor * 100) / view.capMinor,
    daysElapsed: elapsed,
    daysRemaining: remaining,
    safePerDayMinor: safePerDay(view.remainingMinor, remaining),
  };
}

/**
 * The Forecast for one category, or `undefined` when there is no nudge to give
 * — a tracked-only category, a Cycle still inside its suppression window, or a
 * category on pace to finish inside its cap.
 */
export function forecastFor(
  view: CategoryBudget,
  cycle: Cycle,
  today: LocalDay,
): Forecast | undefined {
  const elapsed = daysElapsed(cycle, today);
  if (!view.capped || isSuppressed(elapsed)) {
    return undefined;
  }
  return forecastOf(view, cycle, today, elapsed);
}

/**
 * Every category heading over its cap this Cycle, worst first.
 *
 * Ordered by projected percent rather than projected amount, for the same reason
 * `topBudgets` is: heading 40% past a RM 100 cap is the more urgent story, even
 * though heading RM 50 past a RM 1,000 one is the larger number.
 */
export function forecasts(
  views: readonly CategoryBudget[],
  cycle: Cycle,
  today: LocalDay,
): Forecast[] {
  return views
    .flatMap((view) => forecastFor(view, cycle, today) ?? [])
    .sort((a, b) => b.projectedPercent - a.projectedPercent);
}
