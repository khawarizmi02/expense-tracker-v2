// T5: per-category Budgets (caps) and the spend-vs-cap dashboard numbers.
//
// Exercised through the `core` public API only. Every case pins a fixed "now" —
// a Budget only means anything inside a Cycle, and the core has no clock.

import {
  BudgetError,
  addExpense,
  categoryBudgets,
  budgetSummary,
  clearCap,
  currentCycle,
  findBudget,
  safePerDay,
  seedDefaultCategories,
  setCap,
  spentInCycleByCategory,
  topBudgets,
  type Budget,
  type Category,
  type Expense,
} from '..';
import { makeCounterIds } from './helpers';

const CYCLE = currentCycle(25, '2026-08-05'); // 25 Jul – 24 Aug 2026, 31 days.
/** The Cycle after CYCLE, to prove caps hard-reset across the rollover. */
const NEXT_CYCLE = currentCycle(25, '2026-08-25'); // 25 Aug – 24 Sep 2026.

const categories: Category[] = seedDefaultCategories(makeCounterIds('cat'));
const groceries = categories[0]!;
const dining = categories[1]!;
const transport = categories[2]!;

const makeId = makeCounterIds('e');

function log(
  expenses: readonly Expense[],
  category: Category,
  day: string,
  amountMinor: number,
): Expense[] {
  return addExpense(expenses, { amountMinor, categoryId: category.id, day }, makeId);
}

/** The view for one category, which every dashboard number is read off. */
function viewFor(
  category: Category,
  budgets: readonly Budget[],
  expenses: readonly Expense[],
  cycle = CYCLE,
) {
  const view = categoryBudgets(categories, budgets, expenses, cycle).find(
    (v) => v.category.id === category.id,
  );
  if (!view) {
    throw new Error(`No budget view for ${category.name}`);
  }
  return view;
}

describe('setting, changing and clearing a cap', () => {
  it('sets a cap on a category that had none', () => {
    const budgets = setCap([], dining.id, 20_000);
    expect(findBudget(budgets, dining.id)).toEqual({ categoryId: dining.id, capMinor: 20_000 });
  });

  it('changes an existing cap in place rather than adding a second one', () => {
    const budgets = setCap(setCap([], dining.id, 20_000), dining.id, 35_000);
    expect(budgets).toEqual([{ categoryId: dining.id, capMinor: 35_000 }]);
  });

  it('clears a cap, returning the category to tracked-only', () => {
    const budgets = clearCap(setCap([], dining.id, 20_000), dining.id);
    expect(budgets).toEqual([]);
    expect(findBudget(budgets, dining.id)).toBeUndefined();
  });

  it('clearing a cap a category never had is a no-op', () => {
    const budgets = setCap([], dining.id, 20_000);
    expect(clearCap(budgets, groceries.id)).toEqual(budgets);
  });

  it('leaves the caller’s list untouched', () => {
    const budgets = setCap([], dining.id, 20_000);
    setCap(budgets, groceries.id, 10_000);
    clearCap(budgets, dining.id);
    expect(budgets).toEqual([{ categoryId: dining.id, capMinor: 20_000 }]);
  });

  it.each([0, -1, 1.5, NaN, Infinity])('rejects %p as a cap', (capMinor) => {
    // Zero is not a budget, it is "no spending allowed" — a cap a user means to
    // remove is cleared, not set to nothing.
    expect(() => setCap([], dining.id, capMinor)).toThrow(BudgetError);
  });

  it('rejects a cap with no category', () => {
    expect(() => setCap([], '  ', 20_000)).toThrow(BudgetError);
  });
});

describe('per-category spend inside a Cycle', () => {
  let expenses: Expense[] = [];
  beforeAll(() => {
    expenses = log(expenses, dining, '2026-07-24', 5_000); // previous Cycle
    expenses = log(expenses, dining, '2026-07-25', 3_000); // first day
    expenses = log(expenses, dining, '2026-08-05', 2_500);
    expenses = log(expenses, groceries, '2026-08-05', 9_000);
    expenses = log(expenses, dining, '2026-08-25', 7_000); // next Cycle
  });

  it('counts only that category’s expenses inside the Cycle', () => {
    expect(spentInCycleByCategory(expenses, CYCLE, dining.id)).toBe(5_500);
    expect(spentInCycleByCategory(expenses, CYCLE, groceries.id)).toBe(9_000);
  });

  it('is zero for a category with nothing logged in the Cycle', () => {
    expect(spentInCycleByCategory(expenses, CYCLE, transport.id)).toBe(0);
  });
});

describe('capped vs tracked-only categories', () => {
  const budgets = setCap([], dining.id, 20_000);
  let expenses: Expense[] = [];
  beforeAll(() => {
    expenses = log(expenses, dining, '2026-08-05', 5_000);
    expenses = log(expenses, groceries, '2026-08-05', 12_000);
  });

  it('reports a capped category with its cap, percent and what is left', () => {
    expect(viewFor(dining, budgets, expenses)).toMatchObject({
      capped: true,
      spentMinor: 5_000,
      capMinor: 20_000,
      percent: 25,
      remainingMinor: 15_000,
      overMinor: 0,
    });
  });

  it('reports a tracked-only category with its total and no cap', () => {
    // No bar, no percent, no "left" — just what was spent (CONTEXT.md § Budget).
    expect(viewFor(groceries, budgets, expenses)).toMatchObject({
      capped: false,
      spentMinor: 12_000,
      capMinor: null,
      percent: 0,
      remainingMinor: null,
      overMinor: 0,
    });
  });

  it('covers every active category, in the category list’s order', () => {
    const views = categoryBudgets(categories, budgets, expenses, CYCLE);
    expect(views.map((v) => v.category.name)).toEqual(categories.map((c) => c.name));
  });

  it('leaves an archived category out of the dashboard', () => {
    const active = categories.filter((c) => c.id !== dining.id);
    const archived = [...active, { ...dining, archived: true }];
    const views = categoryBudgets(archived, budgets, expenses, CYCLE);
    expect(views.some((v) => v.category.id === dining.id)).toBe(false);
  });
});

describe('spending past the cap', () => {
  const budgets = setCap([], dining.id, 20_000);
  let expenses: Expense[] = [];
  beforeAll(() => {
    expenses = log(expenses, dining, '2026-08-01', 20_000);
    expenses = log(expenses, dining, '2026-08-05', 3_000);
  });

  it('reports the real total, never clamped at the cap', () => {
    expect(viewFor(dining, budgets, expenses)).toMatchObject({
      spentMinor: 23_000,
      percent: 115,
      overMinor: 3_000,
      remainingMinor: -3_000,
    });
  });

  it('is exactly at the cap, not over, when spend equals it', () => {
    const atCap = [expenses[0]!];
    expect(viewFor(dining, budgets, atCap)).toMatchObject({
      percent: 100,
      overMinor: 0,
      remainingMinor: 0,
    });
  });
});

describe('hard reset across a Cycle rollover', () => {
  // "This Cycle I have RM 200 for Dining": the cap comes back whole at the next
  // payday, and neither leftover nor overspend carries (CONTEXT.md § Budget).
  const budgets = setCap([], dining.id, 20_000);

  it('starts the new Cycle at zero spend and the full cap after overspending', () => {
    const expenses = log([], dining, '2026-08-05', 23_000);
    expect(viewFor(dining, budgets, expenses, CYCLE)).toMatchObject({
      spentMinor: 23_000,
      overMinor: 3_000,
    });
    expect(viewFor(dining, budgets, expenses, NEXT_CYCLE)).toMatchObject({
      spentMinor: 0,
      percent: 0,
      remainingMinor: 20_000,
      overMinor: 0,
    });
  });

  it('does not roll leftover money forward', () => {
    const expenses = log([], dining, '2026-08-05', 5_000); // RM 150 left over
    expect(viewFor(dining, budgets, expenses, NEXT_CYCLE).remainingMinor).toBe(20_000);
  });

  it('counts only the new Cycle’s spend once it has started', () => {
    let expenses = log([], dining, '2026-08-05', 5_000);
    expenses = log(expenses, dining, '2026-08-30', 4_000);
    expect(viewFor(dining, budgets, expenses, NEXT_CYCLE).spentMinor).toBe(4_000);
  });
});

describe('safePerDay', () => {
  it('splits what is left evenly over the days that remain', () => {
    expect(safePerDay(10_000, 20)).toBe(500);
  });

  it('rounds down, so the per-day figure never overspends what is left', () => {
    expect(safePerDay(10_000, 3)).toBe(3_333);
  });

  it('is zero once nothing is left', () => {
    expect(safePerDay(0, 5)).toBe(0);
    expect(safePerDay(-3_000, 5)).toBe(0);
  });

  it('is zero when no days remain', () => {
    expect(safePerDay(10_000, 0)).toBe(0);
  });
});

describe('budgetSummary — the Insights ring and pace stats', () => {
  const budgets = setCap(setCap([], dining.id, 20_000), transport.id, 10_000);
  let expenses: Expense[] = [];
  beforeAll(() => {
    expenses = log(expenses, dining, '2026-08-05', 5_000);
    expenses = log(expenses, transport, '2026-08-05', 2_500);
    expenses = log(expenses, groceries, '2026-08-05', 9_000); // tracked-only
  });

  function summaryOn(day: string) {
    return budgetSummary(categoryBudgets(categories, budgets, expenses, CYCLE), CYCLE, day);
  }

  it('rings capped spend against the total of the caps', () => {
    expect(summaryOn('2026-08-05')).toMatchObject({
      hasCaps: true,
      totalCapMinor: 30_000,
      cappedSpentMinor: 7_500,
      percent: 25,
      remainingMinor: 22_500,
      overMinor: 0,
    });
  });

  it('reports every category’s spend separately from the ring', () => {
    // Tracked-only spend is real money out, but it has no cap to sit against —
    // so it counts in the Cycle total and stays out of the ring.
    expect(summaryOn('2026-08-05').totalSpentMinor).toBe(16_500);
  });

  it('paces what is left over the days still to go', () => {
    // 20 days left on 5 Aug: RM 225.00 ÷ 20 = RM 11.25 a day.
    expect(summaryOn('2026-08-05')).toMatchObject({
      daysRemaining: 20,
      safePerDayMinor: 1_125,
    });
  });

  it('paces the final day against that one day', () => {
    expect(summaryOn('2026-08-24')).toMatchObject({
      daysRemaining: 1,
      safePerDayMinor: 22_500,
    });
  });

  it('says there is nothing to pace when no category is capped', () => {
    const summary = budgetSummary(categoryBudgets(categories, [], expenses, CYCLE), CYCLE, '2026-08-05');
    expect(summary).toMatchObject({
      hasCaps: false,
      totalCapMinor: 0,
      cappedSpentMinor: 0,
      percent: 0,
      remainingMinor: 0,
      safePerDayMinor: 0,
      totalSpentMinor: 16_500,
    });
  });

  it('reports total overspend without clamping the ring', () => {
    const over = log(expenses, dining, '2026-08-06', 30_000);
    const summary = budgetSummary(
      categoryBudgets(categories, budgets, over, CYCLE),
      CYCLE,
      '2026-08-06',
    );
    expect(summary).toMatchObject({
      cappedSpentMinor: 37_500,
      percent: 125,
      remainingMinor: -7_500,
      overMinor: 7_500,
      safePerDayMinor: 0,
    });
  });
});

describe('topBudgets — what Home shows', () => {
  const budgets = setCap(
    setCap(setCap([], dining.id, 20_000), transport.id, 10_000),
    groceries.id,
    40_000,
  );
  let expenses: Expense[] = [];
  beforeAll(() => {
    expenses = log(expenses, dining, '2026-08-05', 5_000); // 25%
    expenses = log(expenses, transport, '2026-08-05', 9_000); // 90%
    expenses = log(expenses, groceries, '2026-08-05', 20_000); // 50%
  });

  it('shows the closest to the cap first — the ones worth acting on', () => {
    const views = categoryBudgets(categories, budgets, expenses, CYCLE);
    expect(topBudgets(views, 2).map((v) => v.category.name)).toEqual(['Transport', 'Groceries']);
  });

  it('leaves tracked-only categories out — they have no bar to show', () => {
    const views = categoryBudgets(categories, budgets, expenses, CYCLE);
    expect(topBudgets(views, 10).map((v) => v.category.name)).toEqual([
      'Transport',
      'Groceries',
      'Dining',
    ]);
  });

  it('is empty when nothing is capped', () => {
    expect(topBudgets(categoryBudgets(categories, [], expenses, CYCLE), 3)).toEqual([]);
  });
});
