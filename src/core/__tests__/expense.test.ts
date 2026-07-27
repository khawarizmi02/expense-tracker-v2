// T3: logging and viewing a manual Expense.
//
// Exercised through the `core` public API only — never private helpers or the
// storage format.

import {
  ExpenseError,
  addExpense,
  groupByDay,
  minorToDecimalString,
  recentExpenses,
  spentOn,
  toLocalDay,
  type Expense,
  type ExpenseInput,
} from '..';
import { makeCounterIds } from './helpers';

const BASE: ExpenseInput = {
  amountMinor: 1250,
  categoryId: 'cat-dining',
  day: '2026-07-27',
};

function log(
  expenses: readonly Expense[],
  input: Partial<ExpenseInput> = {},
  makeId = makeCounterIds('e'),
): Expense[] {
  return addExpense(expenses, { ...BASE, ...input }, makeId);
}

describe('addExpense', () => {
  it('records a money-out expense captured manually', () => {
    const [expense] = addExpense([], BASE, makeCounterIds('e'));

    expect(expense).toEqual({
      id: 'e1',
      amountMinor: 1250,
      categoryId: 'cat-dining',
      merchant: '',
      note: '',
      day: '2026-07-27',
      source: 'manual',
    });
  });

  it('keeps merchant and note when supplied, trimmed', () => {
    const [expense] = log([], { merchant: '  Starbucks ', note: ' flat white ' });

    expect(expense?.merchant).toBe('Starbucks');
    expect(expense?.note).toBe('flat white');
  });

  it('appends without mutating the input list', () => {
    const first = log([]);
    const second = log(first, { amountMinor: 500 }, makeCounterIds('f'));

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);
  });

  it('accepts a back-dated day', () => {
    const [expense] = log([], { day: '2020-01-01' });

    expect(expense?.day).toBe('2020-01-01');
  });

  it('records the capture source when it is not manual', () => {
    const [expense] = log([], { source: 'ocr' });

    expect(expense?.source).toBe('ocr');
  });

  it('rejects a non-positive amount — an Expense is always money out', () => {
    expect(() => log([], { amountMinor: 0 })).toThrow(ExpenseError);
    expect(() => log([], { amountMinor: -1250 })).toThrow(ExpenseError);
  });

  it('rejects a fractional amount — amounts are whole minor units', () => {
    expect(() => log([], { amountMinor: 12.5 })).toThrow(ExpenseError);
  });

  it('rejects an amount that is not a finite number', () => {
    expect(() => log([], { amountMinor: Number.NaN })).toThrow(ExpenseError);
    expect(() => log([], { amountMinor: Number.POSITIVE_INFINITY })).toThrow(ExpenseError);
  });

  it('rejects a missing category', () => {
    expect(() => log([], { categoryId: '  ' })).toThrow(ExpenseError);
  });

  it('rejects a malformed day', () => {
    expect(() => log([], { day: '27-07-2026' })).toThrow(ExpenseError);
    expect(() => log([], { day: '2026-7-1' })).toThrow(ExpenseError);
  });

  it('rejects a day that is not a real calendar date', () => {
    expect(() => log([], { day: '2026-02-30' })).toThrow(ExpenseError);
    expect(() => log([], { day: '2026-13-01' })).toThrow(ExpenseError);
  });
});

describe('spentOn', () => {
  const ids = makeCounterIds('e');
  let expenses: Expense[] = [];
  expenses = addExpense(expenses, { ...BASE, amountMinor: 1250 }, ids);
  expenses = addExpense(expenses, { ...BASE, amountMinor: 800 }, ids);
  expenses = addExpense(expenses, { ...BASE, amountMinor: 9999, day: '2026-07-26' }, ids);

  it('totals every expense on the given day', () => {
    expect(spentOn(expenses, '2026-07-27')).toBe(2050);
  });

  it('ignores other days', () => {
    expect(spentOn(expenses, '2026-07-26')).toBe(9999);
  });

  it('is zero for a day with nothing logged', () => {
    expect(spentOn(expenses, '2026-07-25')).toBe(0);
    expect(spentOn([], '2026-07-27')).toBe(0);
  });
});

describe('groupByDay', () => {
  const ids = makeCounterIds('e');
  let expenses: Expense[] = [];
  expenses = addExpense(expenses, { ...BASE, amountMinor: 1250, day: '2026-07-26' }, ids);
  expenses = addExpense(expenses, { ...BASE, amountMinor: 800, day: '2026-07-27' }, ids);
  expenses = addExpense(expenses, { ...BASE, amountMinor: 200, day: '2026-07-26' }, ids);

  it('groups by day, newest day first', () => {
    expect(groupByDay(expenses).map((group) => group.day)).toEqual([
      '2026-07-27',
      '2026-07-26',
    ]);
  });

  it('totals each day', () => {
    expect(groupByDay(expenses).map((group) => group.total)).toEqual([800, 1450]);
  });

  it('lists a day’s expenses most-recently-logged first', () => {
    const [, older] = groupByDay(expenses);

    expect(older?.expenses.map((e) => e.id)).toEqual(['e3', 'e1']);
  });

  it('is empty for no expenses', () => {
    expect(groupByDay([])).toEqual([]);
  });

  it('orders days by calendar date, not by insertion', () => {
    const backdated = addExpense(expenses, { ...BASE, day: '2026-12-31' }, ids);

    expect(groupByDay(backdated)[0]?.day).toBe('2026-12-31');
  });
});

describe('recentExpenses', () => {
  const ids = makeCounterIds('e');
  let expenses: Expense[] = [];
  expenses = addExpense(expenses, { ...BASE, day: '2026-07-20' }, ids);
  expenses = addExpense(expenses, { ...BASE, day: '2026-07-27' }, ids);
  expenses = addExpense(expenses, { ...BASE, day: '2026-07-25' }, ids);

  it('returns the most recently logged first, regardless of their day', () => {
    expect(recentExpenses(expenses, 3).map((e) => e.id)).toEqual(['e3', 'e2', 'e1']);
  });

  it('caps the list at the requested limit', () => {
    expect(recentExpenses(expenses, 2).map((e) => e.id)).toEqual(['e3', 'e2']);
  });

  it('returns everything when there are fewer than the limit', () => {
    expect(recentExpenses(expenses, 10)).toHaveLength(3);
  });

  it('returns nothing for a limit of zero or less', () => {
    expect(recentExpenses(expenses, 0)).toEqual([]);
    expect(recentExpenses(expenses, -1)).toEqual([]);
  });
});

describe('toLocalDay', () => {
  it('reads the device-local calendar day, not UTC', () => {
    // Local midnight — a UTC-based reading would slip to the previous day for
    // any timezone east of UTC.
    expect(toLocalDay(new Date(2026, 6, 27, 0, 0, 0))).toBe('2026-07-27');
    expect(toLocalDay(new Date(2026, 6, 27, 23, 59, 59))).toBe('2026-07-27');
  });

  it('zero-pads month and day', () => {
    expect(toLocalDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('minorToDecimalString', () => {
  it('renders minor units as a two-decimal amount', () => {
    expect(minorToDecimalString(1250)).toBe('12.50');
    expect(minorToDecimalString(5)).toBe('0.05');
    expect(minorToDecimalString(0)).toBe('0.00');
    expect(minorToDecimalString(100000)).toBe('1000.00');
  });
});
