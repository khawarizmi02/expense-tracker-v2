// T6: over-budget Alerts at 80% and 100% of a cap, and the post-save feedback
// that reflects the same state in-app.
//
// Exercised through the `core` public API only. An Alert is about spend that has
// *already happened* (CONTEXT.md § Alert), so every case builds real Expenses
// inside a fixed Cycle rather than asserting on percentages in the abstract.

import {
  ALERT_THRESHOLDS,
  addExpense,
  archiveCategory,
  categoryBudgets,
  currentCycle,
  dueAlerts,
  hasFired,
  recordAlerts,
  saveFeedback,
  seedDefaultCategories,
  setCap,
  type AlertRecord,
  type Budget,
  type Category,
  type CategoryBudget,
  type Cycle,
  type Expense,
} from '..';
import { makeCounterIds } from './helpers';

const CYCLE = currentCycle(25, '2026-08-05'); // 25 Jul – 24 Aug 2026.
/** The Cycle after CYCLE — caps reset there, so the Alerts do too. */
const NEXT_CYCLE = currentCycle(25, '2026-08-25'); // 25 Aug – 24 Sep 2026.

const categories: Category[] = seedDefaultCategories(makeCounterIds('cat'));
const groceries = categories[0]!;
const dining = categories[1]!;

const makeId = makeCounterIds('e');

function log(
  expenses: readonly Expense[],
  category: Category,
  amountMinor: number,
  day = '2026-08-05',
): Expense[] {
  return addExpense(expenses, { amountMinor, categoryId: category.id, day }, makeId);
}

/** Dining capped at RM 200, plus whatever else the case sets up. */
const CAPPED: Budget[] = setCap([], dining.id, 20_000);

function views(
  expenses: readonly Expense[],
  budgets: readonly Budget[] = CAPPED,
  cycle: Cycle = CYCLE,
  cats: readonly Category[] = categories,
): CategoryBudget[] {
  return categoryBudgets(cats, budgets, expenses, cycle);
}

/** The thresholds due, in order — the shape most cases actually assert on. */
function dueThresholds(
  expenses: readonly Expense[],
  fired: readonly AlertRecord[] = [],
  cycle: Cycle = CYCLE,
): number[] {
  return dueAlerts(views(expenses, CAPPED, cycle), cycle, fired).map((a) => a.threshold);
}

describe('the thresholds themselves', () => {
  it('is exactly 80% and 100%, in that order — not user-configurable', () => {
    expect(ALERT_THRESHOLDS).toEqual([80, 100]);
  });
});

describe('when an Alert comes due', () => {
  it('stays quiet while spend is below 80% of the cap', () => {
    expect(dueThresholds(log([], dining, 15_999))).toEqual([]);
  });

  it('fires at exactly 80% of the cap', () => {
    expect(dueThresholds(log([], dining, 16_000))).toEqual([80]);
  });

  it('fires only the 80% Alert while spend sits between the thresholds', () => {
    expect(dueThresholds(log([], dining, 19_999))).toEqual([80]);
  });

  it('fires both thresholds when one expense jumps clean past the cap', () => {
    expect(dueThresholds(log([], dining, 24_000))).toEqual([80, 100]);
  });

  it('fires at exactly 100% of the cap', () => {
    expect(dueThresholds(log([], dining, 20_000))).toEqual([80, 100]);
  });

  it('never fires for a tracked-only category, however much is spent', () => {
    expect(dueThresholds(log([], groceries, 500_000))).toEqual([]);
  });

  it('ignores spend from other Cycles', () => {
    // Logged the day before this Cycle's payday: last Cycle's money.
    expect(dueThresholds(log([], dining, 24_000, '2026-07-24'))).toEqual([]);
  });

  it('says nothing about an archived category', () => {
    const archived = archiveCategory(categories, dining.id);
    const spent = log([], dining, 24_000);
    expect(dueAlerts(views(spent, CAPPED, CYCLE, archived), CYCLE, [])).toEqual([]);
  });
});

describe('what an Alert carries', () => {
  it('names the category and the position that triggered it', () => {
    const [alert] = dueAlerts(views(log([], dining, 23_000)), CYCLE, []);
    expect(alert).toMatchObject({
      threshold: 80,
      category: dining,
      capMinor: 20_000,
      spentMinor: 23_000,
      percent: 115,
      overMinor: 3_000,
    });
  });
});

describe('firing once per threshold per category per Cycle', () => {
  it('does not re-fire a threshold already recorded this Cycle', () => {
    const spent = log([], dining, 16_000);
    const fired = recordAlerts([], dueAlerts(views(spent), CYCLE, []), CYCLE);
    expect(dueThresholds(spent, fired)).toEqual([]);
  });

  it('still fires 100% after 80% has already gone out', () => {
    const at80 = log([], dining, 16_000);
    const fired = recordAlerts([], dueAlerts(views(at80), CYCLE, []), CYCLE);
    expect(dueThresholds(log(at80, dining, 5_000), fired)).toEqual([100]);
  });

  it('does not escalate: spending further past the cap fires nothing new', () => {
    const over = log([], dining, 24_000);
    const fired = recordAlerts([], dueAlerts(views(over), CYCLE, []), CYCLE);
    expect(dueThresholds(log(over, dining, 100_000), fired)).toEqual([]);
  });

  it('does not re-fire after spend falls back below a threshold and climbs again', () => {
    // Recording is per Cycle, not per crossing: dropping under 80% and coming
    // back is the same Cycle's warning, and the user has already had it.
    const fired = recordAlerts([], dueAlerts(views(log([], dining, 16_000)), CYCLE, []), CYCLE);
    expect(dueThresholds(log([], dining, 12_000), fired)).toEqual([]);
    expect(dueThresholds(log([], dining, 17_000), fired)).toEqual([]);
  });

  it('fires again in the next Cycle, where the cap has reset', () => {
    const lastCycle = log([], dining, 24_000, '2026-08-05');
    const fired = recordAlerts([], dueAlerts(views(lastCycle), CYCLE, []), CYCLE);
    const thisCycle = log(lastCycle, dining, 24_000, '2026-08-25');
    expect(dueThresholds(thisCycle, fired, NEXT_CYCLE)).toEqual([80, 100]);
  });

  it('leaves another category alone when one has already alerted', () => {
    const budgets = setCap(CAPPED, groceries.id, 20_000);
    const spent = log(log([], dining, 16_000), groceries, 16_000);
    const diningAlerts = dueAlerts(views(spent, budgets), CYCLE, []).filter(
      (a) => a.category.id === dining.id,
    );
    const fired = recordAlerts([], diningAlerts, CYCLE);
    expect(dueAlerts(views(spent, budgets), CYCLE, fired).map((a) => a.category.id)).toEqual([
      groceries.id,
    ]);
  });
});

describe('recording what has fired', () => {
  it('reports a recorded threshold as fired, and its neighbour as not', () => {
    const fired = recordAlerts([], dueAlerts(views(log([], dining, 16_000)), CYCLE, []), CYCLE);
    expect(hasFired(fired, dining.id, 80, CYCLE)).toBe(true);
    expect(hasFired(fired, dining.id, 100, CYCLE)).toBe(false);
    expect(hasFired(fired, groceries.id, 80, CYCLE)).toBe(false);
  });

  it('does not duplicate a record when the same Alert is recorded twice', () => {
    const alerts = dueAlerts(views(log([], dining, 16_000)), CYCLE, []);
    const once = recordAlerts([], alerts, CYCLE);
    expect(recordAlerts(once, alerts, CYCLE)).toEqual(once);
  });

  it('drops records from Cycles other than the one being recorded into', () => {
    // Nothing ever asks "did this fire two Cycles ago?", so the history is
    // pruned rather than grown forever.
    const stale = recordAlerts([], dueAlerts(views(log([], dining, 16_000)), CYCLE, []), CYCLE);
    const next = recordAlerts(stale, [], NEXT_CYCLE);
    expect(next).toEqual([]);
  });

  it('does not modify the records it was given', () => {
    const fired: AlertRecord[] = [];
    recordAlerts(fired, dueAlerts(views(log([], dining, 16_000)), CYCLE, []), CYCLE);
    expect(fired).toEqual([]);
  });
});

describe('post-save feedback', () => {
  const feedbackFor = (expenses: readonly Expense[], category = dining) =>
    saveFeedback(views(expenses).find((v) => v.category.id === category.id));

  it('is a plain acknowledgement for a tracked-only category', () => {
    expect(feedbackFor(log([], groceries, 50_000), groceries)).toEqual({ kind: 'saved' });
  });

  it('is a plain acknowledgement when the category is not an active one', () => {
    expect(saveFeedback(undefined)).toEqual({ kind: 'saved' });
  });

  it('reports how far into the cap a save landed while under 80%', () => {
    expect(feedbackFor(log([], dining, 10_000))).toMatchObject({
      kind: 'on-track',
      percent: 50,
      remainingMinor: 10_000,
    });
  });

  it('flags the 80% threshold', () => {
    expect(feedbackFor(log([], dining, 16_000))).toMatchObject({ kind: 'at-threshold', percent: 80 });
  });

  it('flags being over budget, with how far over', () => {
    expect(feedbackFor(log([], dining, 23_000))).toMatchObject({
      kind: 'over-budget',
      percent: 115,
      overMinor: 3_000,
    });
  });

  it('agrees with the Alerts: feedback flags a threshold exactly when one is due', () => {
    const spent = log([], dining, 16_000);
    expect(feedbackFor(spent).kind).toBe('at-threshold');
    expect(dueThresholds(spent)).toEqual([80]);
  });
});
