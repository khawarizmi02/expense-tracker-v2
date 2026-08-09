// T7: the Forecast predictive nudge — naive linear run-rate on capped
// categories, suppressed for the first few days of a Cycle.
//
// Exercised through the `core` public API only. Every case pins a fixed "now":
// a run-rate is meaningless without one, and the core has no clock.

import {
  addExpense,
  categoryBudgets,
  currentCycle,
  forecastFor,
  forecasts,
  seedDefaultCategories,
  setCap,
  type Budget,
  type Category,
  type Expense,
  type LocalDay,
} from '..';
import { makeCounterIds } from './helpers';

const CYCLE = currentCycle(25, '2026-08-05'); // 25 Jul – 24 Aug 2026, 31 days.

/** Day 4 of the Cycle: the first day the Forecast is allowed to speak. */
const DAY_4: LocalDay = '2026-07-28';
/** Day 10 of the Cycle, with 22 days still to run. */
const DAY_10: LocalDay = '2026-08-03';

const categories: Category[] = seedDefaultCategories(makeCounterIds('cat'));
const groceries = categories[0]!;
const dining = categories[1]!;
const transport = categories[2]!;

const makeId = makeCounterIds('e');

function log(
  expenses: readonly Expense[],
  category: Category,
  day: LocalDay,
  amountMinor: number,
): Expense[] {
  return addExpense(expenses, { amountMinor, categoryId: category.id, day }, makeId);
}

function viewFor(category: Category, budgets: readonly Budget[], expenses: readonly Expense[]) {
  const view = categoryBudgets(categories, budgets, expenses, CYCLE).find(
    (v) => v.category.id === category.id,
  );
  if (!view) {
    throw new Error(`No budget view for ${category.name}`);
  }
  return view;
}

/** The Forecast for a category, or `undefined` when there is no nudge to give. */
function forecastOf(
  category: Category,
  budgets: readonly Budget[],
  expenses: readonly Expense[],
  today: LocalDay,
) {
  return forecastFor(viewFor(category, budgets, expenses), CYCLE, today);
}

describe('early-Cycle suppression', () => {
  // Story 31: one early purchase must not trigger a false "you'll be over".
  const budgets = setCap([], dining.id, 20_000);
  const expenses = log([], dining, CYCLE.start, 15_000);

  it('stays quiet on the first day of a Cycle, however alarming the run-rate', () => {
    expect(forecastOf(dining, budgets, expenses, CYCLE.start)).toBeUndefined();
  });

  it('stays quiet through the whole suppression window', () => {
    // Day 3 of a 31-day Cycle: RM 150 on day one projects to RM 1,550.
    expect(forecastOf(dining, budgets, expenses, '2026-07-27')).toBeUndefined();
  });

  it('speaks from the day after the window closes', () => {
    expect(forecastOf(dining, budgets, expenses, DAY_4)).toBeDefined();
  });
});

describe('run-rate projection', () => {
  const budgets = setCap([], dining.id, 20_000);
  // RM 100 spent by day 10 of a 31-day Cycle.
  const expenses = log([], dining, DAY_10, 10_000);

  it('projects spend so far out to the end of the Cycle', () => {
    // 10,000 ÷ 10 days × 31 days = 31,000.
    expect(forecastOf(dining, budgets, expenses, DAY_10)).toMatchObject({
      spentMinor: 10_000,
      capMinor: 20_000,
      projectedMinor: 31_000,
      projectedOverMinor: 11_000,
      projectedPercent: 155,
      daysElapsed: 10,
      daysRemaining: 22,
    });
  });

  it('projects in whole minor units, never a fraction of a sen', () => {
    // 3,333 ÷ 10 × 31 does not divide evenly.
    const lumpy = log([], dining, DAY_10, 3_333);
    const forecast = forecastOf(dining, setCap([], dining.id, 5_000), lumpy, DAY_10);
    expect(Number.isInteger(forecast?.projectedMinor)).toBe(true);
  });

  it('quotes the daily amount that still keeps the category under its cap', () => {
    // RM 100 left over the 22 remaining days, rounded down so following it lands under.
    expect(forecastOf(dining, budgets, expenses, DAY_10)?.safePerDayMinor).toBe(454);
  });

  it('projects the actual spend on the Cycle’s final day, with nothing left to run', () => {
    const spent = log([], dining, DAY_10, 25_000);
    expect(forecastOf(dining, budgets, spent, CYCLE.end)).toMatchObject({
      spentMinor: 25_000,
      projectedMinor: 25_000,
      projectedOverMinor: 5_000,
      daysElapsed: 31,
      daysRemaining: 1,
    });
  });
});

describe('which categories get a nudge', () => {
  it('nudges a capped category trending over', () => {
    // RM 80 in 10 days projects to RM 248 — past a RM 200 cap, with 22 days of
    // the Cycle still to spend.
    const expenses = log([], dining, DAY_4, 8_000);
    expect(forecastOf(dining, setCap([], dining.id, 20_000), expenses, DAY_10)).toBeDefined();
  });

  it('says nothing about a capped category on pace to come in under', () => {
    // RM 50 in 10 days projects to RM 155 — inside a RM 200 cap.
    const expenses = log([], dining, DAY_10, 5_000);
    expect(forecastOf(dining, setCap([], dining.id, 20_000), expenses, DAY_10)).toBeUndefined();
  });

  it('says nothing about a tracked-only category, however fast it is spending', () => {
    const expenses = log([], transport, DAY_4, 50_000);
    expect(forecastOf(transport, [], expenses, DAY_10)).toBeUndefined();
  });

  it('says nothing about a category with no spend at all', () => {
    expect(forecastOf(dining, setCap([], dining.id, 20_000), [], DAY_10)).toBeUndefined();
  });

  it('still projects for a category that is already over its cap', () => {
    // The Alert about the crossing has been and gone (once per Cycle); the
    // Forecast keeps saying where the Cycle ends up if nothing changes.
    const expenses = log([], dining, DAY_4, 25_000);
    expect(forecastOf(dining, setCap([], dining.id, 20_000), expenses, DAY_10)).toMatchObject({
      projectedMinor: 77_500,
      // Nothing is left, so there is no safe daily amount to quote — only an
      // amount to stop at.
      safePerDayMinor: 0,
    });
  });
});

describe('a lumpy category', () => {
  // Knowingly rough, not a failure (CONTEXT.md § Forecast): one annual-sized
  // purchase early in the Cycle projects to an absurd figure, and that is fine
  // so long as the numbers stay finite and whole.
  it('is rough but does not crash', () => {
    const expenses = log([], groceries, DAY_4, 9_999_999);
    const forecast = forecastOf(groceries, setCap([], groceries.id, 100), expenses, DAY_4);
    expect(forecast).toBeDefined();
    expect(Number.isSafeInteger(forecast!.projectedMinor)).toBe(true);
    expect(Number.isSafeInteger(forecast!.projectedOverMinor)).toBe(true);
    expect(forecast!.projectedMinor).toBeGreaterThan(forecast!.spentMinor);
  });

  it('quotes a daily amount that still lands inside the cap if it is followed', () => {
    const cap = 20_000_000;
    const expenses = log([], groceries, DAY_4, 9_999_999);
    const forecast = forecastOf(groceries, setCap([], groceries.id, cap), expenses, DAY_4)!;
    expect(forecast.safePerDayMinor).toBeGreaterThan(0);
    expect(
      forecast.spentMinor + forecast.safePerDayMinor * forecast.daysRemaining,
    ).toBeLessThanOrEqual(cap);
  });
});

describe('the Cycle’s forecasts together', () => {
  const budgets = setCap(setCap([], dining.id, 20_000), groceries.id, 40_000);
  let expenses: Expense[] = [];
  expenses = log(expenses, dining, DAY_4, 9_000); // projects to 27,900 of 20,000.
  expenses = log(expenses, groceries, DAY_4, 15_000); // projects to 46,500 of 40,000.
  expenses = log(expenses, transport, DAY_4, 30_000); // tracked-only.

  const views = categoryBudgets(categories, budgets, expenses, CYCLE);

  it('returns only the capped categories trending over', () => {
    expect(forecasts(views, CYCLE, DAY_10).map((f) => f.category.id)).toEqual([
      dining.id,
      groceries.id,
    ]);
  });

  it('orders them worst first, by the percent of the cap they are heading for', () => {
    const [worst] = forecasts(views, CYCLE, DAY_10);
    expect(worst?.category.id).toBe(dining.id); // 139.5% vs 116.25%.
  });

  it('is empty inside the suppression window', () => {
    expect(forecasts(views, CYCLE, CYCLE.start)).toEqual([]);
  });
});
