// T4: the payday-aligned Cycle (ADR-0001).
//
// Exercised through the `core` public API only. Every case pins a fixed "now" —
// the core has no clock, so a Cycle is always computed against a day the caller
// passes in.

import {
  CycleError,
  DEFAULT_CYCLE_START_DAY,
  addDays,
  addExpense,
  clampsInShortMonths,
  containsDay,
  currentCycle,
  cycleLength,
  daysElapsed,
  daysRemaining,
  isValidCycleStartDay,
  spentInCycle,
  toLocalDay,
  type Cycle,
  type Expense,
} from '..';
import { makeCounterIds } from './helpers';

describe('currentCycle', () => {
  it('runs a calendar month when payday is the 1st', () => {
    expect(currentCycle(1, '2026-08-05')).toEqual({
      startDay: 1,
      start: '2026-08-01',
      end: '2026-08-31',
    });
  });

  it('anchors to the payday, not the calendar month', () => {
    // Paid on the 25th: August's spending money arrived on 25 July.
    expect(currentCycle(25, '2026-08-05')).toEqual({
      startDay: 25,
      start: '2026-07-25',
      end: '2026-08-24',
    });
  });

  it('rolls to the new Cycle on payday itself', () => {
    expect(currentCycle(25, '2026-08-25')).toEqual({
      startDay: 25,
      start: '2026-08-25',
      end: '2026-09-24',
    });
  });

  it('includes the last day of the Cycle', () => {
    expect(currentCycle(25, '2026-08-24').start).toBe('2026-07-25');
  });

  it('crosses the year boundary', () => {
    expect(currentCycle(28, '2026-01-05')).toEqual({
      startDay: 28,
      start: '2025-12-28',
      end: '2026-01-27',
    });
  });
});

describe('currentCycle short-month clamping', () => {
  it('clamps a 31st payday back to February 28th', () => {
    // 2026 is not a leap year, so February's payday lands on the 28th.
    expect(currentCycle(31, '2026-02-28')).toEqual({
      startDay: 31,
      start: '2026-02-28',
      end: '2026-03-30',
    });
  });

  it('clamps a 31st payday back to February 29th in a leap year', () => {
    expect(currentCycle(31, '2028-02-29')).toEqual({
      startDay: 31,
      start: '2028-02-29',
      end: '2028-03-30',
    });
  });

  it('clamps a 31st payday back to a 30-day month', () => {
    expect(currentCycle(31, '2026-04-30')).toEqual({
      startDay: 31,
      start: '2026-04-30',
      end: '2026-05-30',
    });
  });

  it('clamps a 30th payday back to February', () => {
    expect(currentCycle(30, '2026-03-01')).toEqual({
      startDay: 30,
      start: '2026-02-28',
      end: '2026-03-29',
    });
  });

  it('keeps the clamped Cycle running until the next real payday', () => {
    // Started 28 Feb (clamped from 31); the day before March's payday is still
    // inside it.
    expect(currentCycle(31, '2026-03-30').start).toBe('2026-02-28');
    expect(currentCycle(31, '2026-03-31').start).toBe('2026-03-31');
  });
});

describe('currentCycle tiling', () => {
  // Clamping is where boundary maths usually springs a leak: a Cycle that ends
  // before the next one starts (a day belonging to no Cycle), or one that
  // overruns it (a day counted twice). Walk a whole year for every payday and
  // assert every day lands in exactly one Cycle, contiguous with its neighbours.
  it.each(Array.from({ length: 31 }, (_, i) => i + 1))(
    'tiles every day of a year without gaps or overlaps for payday %i',
    (startDay) => {
      const date = new Date(2026, 0, 1);
      let previous: Cycle | null = null;

      while (date.getFullYear() === 2026) {
        const day = toLocalDay(date);
        const cycle = currentCycle(startDay, day);

        expect(containsDay(cycle, day)).toBe(true);
        if (previous && cycle.start !== previous.start) {
          // A new Cycle must pick up the day after the old one ended.
          expect(cycle.start).toBe(addDays(previous.end, 1));
        }
        previous = cycle;
        date.setDate(date.getDate() + 1);
      }
    },
  );
});

describe('cycle start day validation', () => {
  it('accepts every day a user may pick', () => {
    for (let day = 1; day <= 31; day += 1) {
      expect(isValidCycleStartDay(day)).toBe(true);
    }
  });

  it.each([0, -1, 32, 1.5, NaN, Infinity])('rejects %p', (startDay) => {
    expect(isValidCycleStartDay(startDay)).toBe(false);
    expect(() => currentCycle(startDay, '2026-08-05')).toThrow(CycleError);
  });

  it('rejects a malformed "now"', () => {
    expect(() => currentCycle(1, '2026-02-30')).toThrow(CycleError);
  });

  it('defaults to the 1st', () => {
    expect(isValidCycleStartDay(DEFAULT_CYCLE_START_DAY)).toBe(true);
  });

  it('knows which start days clamp in a short month', () => {
    // February is the shortest month at 28 days.
    expect([28, 29, 30, 31].map(clampsInShortMonths)).toEqual([false, true, true, true]);
    expect(clampsInShortMonths(1)).toBe(false);
    expect(clampsInShortMonths(32)).toBe(false);
  });
});

describe('cycle progress', () => {
  const cycle = currentCycle(25, '2026-08-05'); // 25 Jul – 24 Aug, 31 days.

  it('counts the days the Cycle spans, both ends included', () => {
    expect(cycleLength(cycle)).toBe(31);
    expect(cycleLength(currentCycle(1, '2026-02-10'))).toBe(28);
  });

  it('counts today as one day elapsed on payday', () => {
    expect(daysElapsed(cycle, '2026-07-25')).toBe(1);
    expect(daysElapsed(cycle, '2026-08-05')).toBe(12);
  });

  it('counts today as one day remaining on the final day', () => {
    expect(daysRemaining(cycle, '2026-08-24')).toBe(1);
    expect(daysRemaining(cycle, '2026-07-25')).toBe(31);
    expect(daysRemaining(cycle, '2026-08-05')).toBe(20);
  });

  it('knows which days belong to it', () => {
    expect(containsDay(cycle, '2026-07-24')).toBe(false);
    expect(containsDay(cycle, '2026-07-25')).toBe(true);
    expect(containsDay(cycle, '2026-08-24')).toBe(true);
    expect(containsDay(cycle, '2026-08-25')).toBe(false);
  });
});

describe('spentInCycle', () => {
  const cycle = currentCycle(25, '2026-08-05'); // 25 Jul – 24 Aug.
  const makeId = makeCounterIds('e');

  function log(expenses: readonly Expense[], day: string, amountMinor: number): Expense[] {
    return addExpense(expenses, { amountMinor, categoryId: 'cat-dining', day }, makeId);
  }

  it('totals only the expenses inside the Cycle', () => {
    let expenses: Expense[] = [];
    expenses = log(expenses, '2026-07-24', 5_000); // previous Cycle
    expenses = log(expenses, '2026-07-25', 1_000); // first day
    expenses = log(expenses, '2026-08-05', 2_500);
    expenses = log(expenses, '2026-08-24', 500); // last day
    expenses = log(expenses, '2026-08-25', 9_000); // next Cycle

    expect(spentInCycle(expenses, cycle)).toBe(4_000);
  });

  it('is zero for a Cycle with nothing logged', () => {
    expect(spentInCycle([], cycle)).toBe(0);
  });
});
