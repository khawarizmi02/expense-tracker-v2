// Alert domain logic (T6) — the over-budget warnings, and the post-save
// feedback that says the same thing in-app.
//
// An Alert is about spend that has **already happened**, at two fixed
// thresholds — 80% and 100% of a cap — each firing once per category per Cycle
// (CONTEXT.md § Alert). No repeats, no escalation, not user-configurable; the
// projected version of this question is the Forecast (T7), and it lives apart.
//
// "Once per Cycle" needs a memory, and this module is pure, so the memory is
// data the caller keeps: `AlertRecord`s of what has already gone out. The core
// decides *whether* an Alert is due; the notification adapter delivers it.

import type { LocalDay } from './day';
import type { CappedCategoryBudget, CategoryBudget } from './budget';
import type { Category, Cycle } from './types';

/**
 * The two thresholds, ascending — a fixed pair, deliberately not a setting
 * (spec § Out of Scope: no configurable thresholds, no per-category tuning).
 */
export const ALERT_THRESHOLDS = [80, 100] as const;

/** A percentage of a cap that Kira warns at. */
export type AlertThreshold = (typeof ALERT_THRESHOLDS)[number];

/**
 * A note that one threshold has already been announced for one category in one
 * Cycle — what keeps a warning from becoming a nag.
 *
 * The Cycle is identified by its first day: a Cycle is derived from the payday
 * rather than stored (ADR-0001), and its start is the one stable name it has.
 */
export interface AlertRecord {
  readonly categoryId: string;
  readonly threshold: AlertThreshold;
  /** The `start` of the Cycle the Alert fired in. */
  readonly cycleStart: LocalDay;
}

/**
 * A threshold crossing that has not been announced yet — everything the
 * notification adapter and the toast need to write the message.
 */
export interface Alert {
  readonly category: Category;
  readonly threshold: AlertThreshold;
  /** The cap for this Cycle, in minor units. */
  readonly capMinor: number;
  /** Actual spend against the cap, in minor units. */
  readonly spentMinor: number;
  /** Spend as a percent of the cap; unrounded and unclamped, as `core` keeps it. */
  readonly percent: number;
  /** How far past the cap, in minor units; `0` at the 80% crossing. */
  readonly overMinor: number;
}

/**
 * What to say after a save, chosen from the same thresholds the Alerts use so
 * the toast and the notification can never disagree about where the user is.
 *
 * The streak-extended variant (spec story 52) arrives with T11, when there is a
 * Streak to extend.
 */
export type SaveFeedback =
  /** Nothing to measure against: a tracked-only category. */
  | { readonly kind: 'saved' }
  /** Inside the cap and below the first threshold. */
  | {
      readonly kind: 'on-track';
      readonly category: Category;
      readonly percent: number;
      readonly remainingMinor: number;
    }
  /** At or past 80% of the cap, but not yet over it. */
  | {
      readonly kind: 'at-threshold';
      readonly category: Category;
      readonly percent: number;
      readonly remainingMinor: number;
    }
  /** At or past the cap. */
  | {
      readonly kind: 'over-budget';
      readonly category: Category;
      readonly percent: number;
      readonly overMinor: number;
    };

const [WARNING_THRESHOLD, OVER_THRESHOLD] = ALERT_THRESHOLDS;

/** The thresholds `view` has reached, ascending; empty for a tracked-only one. */
function crossedThresholds(view: CategoryBudget): AlertThreshold[] {
  if (!view.capped) {
    return [];
  }
  // At-or-past, not strictly-past: spending exactly the cap is the moment the
  // 100% warning is about, and landing on 80.0% is the warning at 80%.
  return ALERT_THRESHOLDS.filter((threshold) => view.percent >= threshold);
}

/** Whether this threshold has already been announced for this category, this Cycle. */
export function hasFired(
  fired: readonly AlertRecord[],
  categoryId: string,
  threshold: AlertThreshold,
  cycle: Cycle,
): boolean {
  return fired.some(
    (record) =>
      record.categoryId === categoryId &&
      record.threshold === threshold &&
      record.cycleStart === cycle.start,
  );
}

function alertFor(view: CappedCategoryBudget, threshold: AlertThreshold): Alert {
  return {
    category: view.category,
    threshold,
    capMinor: view.capMinor,
    spentMinor: view.spentMinor,
    percent: view.percent,
    overMinor: view.overMinor,
  };
}

/**
 * The Alerts that should go out now: every threshold a capped category has
 * reached this Cycle and not yet been warned about, in category order and
 * ascending by threshold.
 *
 * A single large expense that clears both thresholds at once yields both — the
 * rule is once *each* per Cycle, and the 80% warning is still news to a user who
 * has never seen it. Archived categories never appear, because `views` is built
 * from the active ones (CONTEXT.md § Category).
 */
export function dueAlerts(
  views: readonly CategoryBudget[],
  cycle: Cycle,
  fired: readonly AlertRecord[],
): Alert[] {
  return views.flatMap((view) =>
    view.capped
      ? crossedThresholds(view)
          .filter((threshold) => !hasFired(fired, view.category.id, threshold, cycle))
          .map((threshold) => alertFor(view, threshold))
      : [],
  );
}

/**
 * The Alerts worth *sending*, at most one per category: the highest threshold
 * each has reached.
 *
 * `dueAlerts` answers a bookkeeping question — which thresholds are now owed —
 * and one expense can owe both at once. Sending both would be two buzzes about
 * one purchase, and the 80% one would be the quieter, staler news of the two.
 * The user hears "you are over budget"; both thresholds are still recorded, so
 * neither can come back later.
 */
export function announcements(alerts: readonly Alert[]): Alert[] {
  const loudest = new Map<string, Alert>();
  for (const alert of alerts) {
    const held = loudest.get(alert.category.id);
    if (!held || alert.threshold > held.threshold) {
      loudest.set(alert.category.id, alert);
    }
  }
  return [...loudest.values()];
}

/**
 * Note `alerts` as announced for `cycle`, returning the records to keep.
 *
 * Records from other Cycles are dropped rather than accumulated: caps reset
 * whole each Cycle (CONTEXT.md § Budget) and nothing ever asks what fired two
 * Cycles ago, so the store holds the current Cycle's warnings and nothing else.
 * Recording the same Alert twice is a no-op, so a save that re-evaluates is safe.
 */
export function recordAlerts(
  fired: readonly AlertRecord[],
  alerts: readonly Alert[],
  cycle: Cycle,
): AlertRecord[] {
  const kept = fired.filter((record) => record.cycleStart === cycle.start);
  const added = alerts
    .filter((alert) => !hasFired(kept, alert.category.id, alert.threshold, cycle))
    .map<AlertRecord>((alert) => ({
      categoryId: alert.category.id,
      threshold: alert.threshold,
      cycleStart: cycle.start,
    }));
  return [...kept, ...added];
}

/**
 * How the save that produced `view` should be acknowledged. `undefined` — a
 * category that isn't an active one — reads as a plain acknowledgement, the
 * same as a tracked-only category: there is no cap to report against either way.
 */
export function saveFeedback(view: CategoryBudget | undefined): SaveFeedback {
  if (!view || !view.capped) {
    return { kind: 'saved' };
  }
  const { category, percent, remainingMinor, overMinor } = view;
  if (percent >= OVER_THRESHOLD) {
    return { kind: 'over-budget', category, percent, overMinor };
  }
  if (percent >= WARNING_THRESHOLD) {
    return { kind: 'at-threshold', category, percent, remainingMinor };
  }
  return { kind: 'on-track', category, percent, remainingMinor };
}
