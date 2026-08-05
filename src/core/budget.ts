// Budget domain logic (T5) — the per-category cap and the numbers the
// spend-vs-cap dashboard is drawn from.
//
// Kira budgets with a **simple cap**, not envelopes: a Budget is optional per
// category, and at each new Cycle the cap comes back whole — leftover money does
// not roll forward and overspend does not carry (CONTEXT.md § Budget). Nothing
// here stores that reset: spend is always read out of the Cycle the caller
// passes in, so a new Cycle simply has nothing in it yet.
//
// Pure like the rest of `core`: no clock, no I/O. Each function returns a new
// list or a derived view; the inputs are never modified.

import { activeCategories } from './category';
import { daysRemaining as cycleDaysRemaining } from './cycle';
import { spentInCycleByCategory } from './expense';
import type { LocalDay } from './day';
import type { Budget, Category, Cycle, Expense } from './types';

export class BudgetError extends Error {}

/**
 * One category's position this Cycle, as every budget surface renders it: the
 * Home bars, the Insights list, and the category detail overlay.
 *
 * Both shapes live in one type because the dashboard has to draw *either* from
 * the same list — `capped` says which: a capped category shows a bar against
 * `capMinor`, a tracked-only one shows `spentMinor` alone.
 */
export interface CategoryBudget {
  /** The category itself, so callers render a row without a second lookup. */
  readonly category: Category;
  /** Spent against this category inside the Cycle, in minor units. */
  readonly spentMinor: number;
  /** The cap in minor units, or `null` when the category is tracked-only. */
  readonly capMinor: number | null;
  /** True when a Budget is set — i.e. this category has a bar and a limit. */
  readonly capped: boolean;
  /**
   * Spend as a percent of the cap; `0` when tracked-only. Deliberately
   * unrounded and **unclamped**: 115 means 15% past the limit, and hiding that
   * behind a hard 100 would be the one moment the dashboard lies. Callers clamp
   * for the *width* of a bar, never for the number they print.
   */
  readonly percent: number;
  /** Cap minus spend; negative once over. `null` when tracked-only. */
  readonly remainingMinor: number | null;
  /** How far past the cap, in minor units; `0` when within it or tracked-only. */
  readonly overMinor: number;
}

/** The whole Cycle's position: the Insights ring plus its pace stats. */
export interface BudgetSummary {
  /** False when no category is capped — there is no ring to draw. */
  readonly hasCaps: boolean;
  /** Every cap added together, in minor units. The ring's denominator. */
  readonly totalCapMinor: number;
  /** Spend against capped categories only. The ring's numerator. */
  readonly cappedSpentMinor: number;
  /**
   * Spend across *all* active categories this Cycle, tracked-only included.
   * Kept apart from the ring: tracked-only money is real money out, but it has
   * no cap to sit against, so counting it in the ring would compare a total
   * against a limit that never covered it.
   */
  readonly totalSpentMinor: number;
  /** Capped spend as a percent of the total cap; unrounded and unclamped. */
  readonly percent: number;
  /** Total cap minus capped spend; negative once over. */
  readonly remainingMinor: number;
  /** How far past the total cap; `0` when within it. */
  readonly overMinor: number;
  /** Days of the Cycle left, counting today. */
  readonly daysRemaining: number;
  /** What can be spent per remaining day and still come in under the caps. */
  readonly safePerDayMinor: number;
}

function requireCategoryId(categoryId: string): string {
  const trimmed = categoryId.trim();
  if (trimmed.length === 0) {
    throw new BudgetError('A Budget must belong to a category');
  }
  return trimmed;
}

function validateCap(capMinor: number): number {
  if (!Number.isInteger(capMinor)) {
    throw new BudgetError(`Cap must be a whole number of minor units, got ${capMinor}`);
  }
  // Zero isn't a budget, it's "spend nothing" — a user who means to stop capping
  // a category clears the cap, which is a different action with a different UI.
  if (capMinor <= 0) {
    throw new BudgetError(`Cap must be greater than zero, got ${capMinor}`);
  }
  return capMinor;
}

/**
 * `spent` as a percent of `cap`, `0` when there is no cap to measure against.
 *
 * Scaled before dividing rather than after: `23000 / 20000 * 100` lands on
 * 114.99999999999999, and a percent a user reads should not carry the rounding
 * error of a float that only ever existed as an intermediate step.
 */
function percentOf(spentMinor: number, capMinor: number): number {
  return capMinor === 0 ? 0 : (spentMinor * 100) / capMinor;
}

/** The Budget on a category, or `undefined` when it is tracked-only. */
export function findBudget(
  budgets: readonly Budget[],
  categoryId: string,
): Budget | undefined {
  return budgets.find((b) => b.categoryId === categoryId);
}

/**
 * Set or change a category's cap. One Budget per category, so setting a cap on
 * an already-capped category replaces it rather than adding a second.
 */
export function setCap(
  budgets: readonly Budget[],
  categoryId: string,
  capMinor: number,
): Budget[] {
  const budget: Budget = {
    categoryId: requireCategoryId(categoryId),
    capMinor: validateCap(capMinor),
  };
  if (findBudget(budgets, budget.categoryId)) {
    return budgets.map((b) => (b.categoryId === budget.categoryId ? budget : b));
  }
  return [...budgets, budget];
}

/**
 * Clear a category's cap, returning it to tracked-only. Clearing a cap that was
 * never set is a no-op — "no Budget" is the same state either way.
 */
export function clearCap(budgets: readonly Budget[], categoryId: string): Budget[] {
  return budgets.filter((b) => b.categoryId !== categoryId);
}

/**
 * What can still be spent per remaining day without going over — the pace
 * figure on Insights and in a category's pace sentence.
 *
 * Rounded *down* so following it to the letter always lands under the cap, and
 * floored at zero: once the money is gone there is no safe daily amount left to
 * quote, only an amount to stop at.
 */
export function safePerDay(remainingMinor: number, daysRemaining: number): number {
  if (remainingMinor <= 0 || daysRemaining <= 0) {
    return 0;
  }
  return Math.floor(remainingMinor / daysRemaining);
}

/** One category's Cycle position, capped or tracked-only. */
function viewFor(
  category: Category,
  budgets: readonly Budget[],
  expenses: readonly Expense[],
  cycle: Cycle,
): CategoryBudget {
  const spentMinor = spentInCycleByCategory(expenses, cycle, category.id);
  const budget = findBudget(budgets, category.id);

  if (!budget) {
    return {
      category,
      spentMinor,
      capMinor: null,
      capped: false,
      percent: 0,
      remainingMinor: null,
      overMinor: 0,
    };
  }

  const remainingMinor = budget.capMinor - spentMinor;
  return {
    category,
    spentMinor,
    capMinor: budget.capMinor,
    capped: true,
    percent: percentOf(spentMinor, budget.capMinor),
    remainingMinor,
    overMinor: Math.max(0, -remainingMinor),
  };
}

/**
 * Every active category's position this Cycle, in the category list's own
 * order — the dashboard's source list.
 *
 * Archived categories are left out: they are gone from the current dashboard but
 * keep their history (CONTEXT.md § Category), and this is a current-Cycle view.
 */
export function categoryBudgets(
  categories: readonly Category[],
  budgets: readonly Budget[],
  expenses: readonly Expense[],
  cycle: Cycle,
): CategoryBudget[] {
  return activeCategories(categories).map((category) =>
    viewFor(category, budgets, expenses, cycle),
  );
}

/**
 * Roll the per-category views up into the Cycle's overall position: the
 * Insights ring and the pace stats beside it.
 */
export function budgetSummary(
  views: readonly CategoryBudget[],
  cycle: Cycle,
  today: LocalDay,
): BudgetSummary {
  const capped = views.filter((v) => v.capped);
  const totalCapMinor = capped.reduce((total, v) => total + (v.capMinor ?? 0), 0);
  const cappedSpentMinor = capped.reduce((total, v) => total + v.spentMinor, 0);
  const remainingMinor = totalCapMinor - cappedSpentMinor;
  const daysRemaining = cycleDaysRemaining(cycle, today);

  return {
    hasCaps: capped.length > 0,
    totalCapMinor,
    cappedSpentMinor,
    totalSpentMinor: views.reduce((total, v) => total + v.spentMinor, 0),
    // With nothing capped every figure below is zero on its own: no caps, no
    // spend against them, nothing left over and nothing to pace.
    percent: percentOf(cappedSpentMinor, totalCapMinor),
    remainingMinor,
    overMinor: Math.max(0, -remainingMinor),
    daysRemaining,
    safePerDayMinor: safePerDay(remainingMinor, daysRemaining),
  };
}

/**
 * The capped categories closest to their cap, worst first — Home's "top
 * budgets". Ordering by percent rather than by amount is what makes the list
 * actionable: RM 90 of a RM 100 cap needs attention before RM 200 of RM 1,000.
 */
export function topBudgets(
  views: readonly CategoryBudget[],
  limit: number,
): CategoryBudget[] {
  if (limit <= 0) {
    return [];
  }
  return views
    .filter((v) => v.capped)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, limit);
}
