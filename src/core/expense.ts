// Expense domain logic (T3).
//
// Pure functions over an immutable `Expense[]`, in the same shape as the
// Category module: each mutating function returns a new array and ids come from
// an injected IdFactory.

import { containsDay } from './cycle';
import { compareDays, isValidDay, type LocalDay } from './day';
import type { Cycle, Expense, ExpenseInput, IdFactory } from './types';

export class ExpenseError extends Error {}

/** One day's expenses and their total, as History renders them. */
export interface DayGroup {
  readonly day: LocalDay;
  /** Sum of the day's amounts, in minor units. */
  readonly total: number;
  /** The day's expenses, most recently logged first. */
  readonly expenses: readonly Expense[];
}

function validateAmount(amountMinor: number): number {
  if (!Number.isFinite(amountMinor) || !Number.isInteger(amountMinor)) {
    throw new ExpenseError(`Amount must be a whole number of minor units, got ${amountMinor}`);
  }
  // An Expense is single-signed money out: zero is not a purchase, and money
  // coming back is a Refund — its own dated record (see CONTEXT.md § Refund).
  if (amountMinor <= 0) {
    throw new ExpenseError(`Amount must be greater than zero, got ${amountMinor}`);
  }
  return amountMinor;
}

function validateCategoryId(categoryId: string): string {
  const trimmed = categoryId.trim();
  if (trimmed.length === 0) {
    throw new ExpenseError('Expense must belong to a category');
  }
  return trimmed;
}

function validateDay(day: string): LocalDay {
  if (!isValidDay(day)) {
    throw new ExpenseError(`Not a valid YYYY-MM-DD day: ${day}`);
  }
  return day;
}

/**
 * Log an expense. Returns a new list with it appended — appended, because list
 * order is capture order, which is what "recent" means on Home.
 *
 * Any past `day` is accepted: back-dating is a first-class action (it is how a
 * broken Streak self-heals, see ADR-0002). Refusing *future* days is a UI
 * concern; the core has no clock to compare against.
 */
export function addExpense(
  expenses: readonly Expense[],
  input: ExpenseInput,
  makeId: IdFactory,
): Expense[] {
  const expense: Expense = {
    id: makeId(),
    amountMinor: validateAmount(input.amountMinor),
    categoryId: validateCategoryId(input.categoryId),
    merchant: input.merchant?.trim() ?? '',
    note: input.note?.trim() ?? '',
    day: validateDay(input.day),
    source: input.source ?? 'manual',
  };
  return [...expenses, expense];
}

/** Total spent on one day, in minor units. Home's "spent today". */
export function spentOn(expenses: readonly Expense[], day: LocalDay): number {
  return expenses.reduce((total, e) => (e.day === day ? total + e.amountMinor : total), 0);
}

/**
 * Total spent inside a Cycle, in minor units — the dashboard's "this Cycle"
 * number.
 *
 * Cycle-scoped, never calendar-month-scoped: the window comes from the user's
 * payday (see ADR-0001), so this is the only spend total the dashboard shows.
 */
export function spentInCycle(expenses: readonly Expense[], cycle: Cycle): number {
  return expenses.reduce(
    (total, e) => (containsDay(cycle, e.day) ? total + e.amountMinor : total),
    0,
  );
}

/**
 * Total spent against one category inside a Cycle, in minor units — the number
 * every Budget bar, percent and category total is measured from.
 */
export function spentInCycleByCategory(
  expenses: readonly Expense[],
  cycle: Cycle,
  categoryId: string,
): number {
  return expenses.reduce(
    (total, e) =>
      e.categoryId === categoryId && containsDay(cycle, e.day) ? total + e.amountMinor : total,
    0,
  );
}

/**
 * One category's expenses inside a Cycle, most recently logged first — the
 * entries the category detail overlay lists.
 */
export function expensesInCycleByCategory(
  expenses: readonly Expense[],
  cycle: Cycle,
  categoryId: string,
): Expense[] {
  return expenses
    .filter((e) => e.categoryId === categoryId && containsDay(cycle, e.day))
    .reverse();
}

/**
 * Group expenses into days with per-day totals, newest day first — History's
 * shape. Days are ordered by calendar date rather than capture order so a
 * back-dated expense lands in its own day rather than at the top of the list.
 */
export function groupByDay(expenses: readonly Expense[]): DayGroup[] {
  const byDay = new Map<LocalDay, Expense[]>();
  for (const expense of expenses) {
    const existing = byDay.get(expense.day);
    if (existing) {
      // Unshift so each day reads most-recently-logged first.
      existing.unshift(expense);
    } else {
      byDay.set(expense.day, [expense]);
    }
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => compareDays(b, a))
    .map(([day, dayExpenses]) => ({
      day,
      total: dayExpenses.reduce((sum, e) => sum + e.amountMinor, 0),
      expenses: dayExpenses,
    }));
}

/**
 * The most recently logged expenses, newest first — Home's "recent" list. This
 * is capture order, not date order: an expense back-dated to last week was still
 * the last thing the user logged.
 */
export function recentExpenses(expenses: readonly Expense[], limit: number): Expense[] {
  if (limit <= 0) {
    return [];
  }
  return expenses.slice(-limit).reverse();
}
