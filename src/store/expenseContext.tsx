// React binding for the Expense domain, mirroring CategoryProvider: holds the
// logged expenses in state, applies the pure `core` operations, and persists
// through the encrypted store. All expense *logic* stays in `core`.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import * as Crypto from 'expo-crypto';
import {
  addExpense,
  groupByDay,
  recentExpenses,
  spentOn,
  toLocalDay,
  type DayGroup,
  type Expense,
  type ExpenseInput,
  type LocalDay,
} from '../core';
import { ExpenseRepository } from './expenseRepository';
import { useStore } from './storeContext';

const makeId = () => Crypto.randomUUID();

/** How many entries Home's "recent" list shows. */
const RECENT_LIMIT = 5;

interface ExpenseContextValue {
  ready: boolean;
  expenses: Expense[];
  /** Log an expense; returns the one that was created. */
  log: (input: ExpenseInput) => Expense;
  /** Total spent on a day, in minor units. */
  spentOn: (day: LocalDay) => number;
  /** The day-grouped history, newest day first, with per-day totals. */
  byDay: DayGroup[];
  /** The most recently logged expenses, newest first. */
  recent: Expense[];
  /** The device-local day as of the last render (see CONTEXT.md § Day). */
  today: LocalDay;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

/**
 * The current device-local day, kept current as the day actually turns over.
 *
 * "Today" is a clock reading, not derived state, and the boundary is local
 * midnight (CONTEXT.md § Day) — so an app left open overnight must not keep
 * showing yesterday's total under "spent today", nor default QuickAdd to
 * yesterday. Two triggers cover it: a timer armed for the next local midnight,
 * and a re-read whenever the app returns to the foreground (background timers
 * don't fire reliably, and the phone's timezone may have changed mid-flight).
 */
function useToday(): LocalDay {
  const [today, setToday] = useState(() => toLocalDay(new Date()));

  useEffect(() => {
    const sync = () => setToday(toLocalDay(new Date()));

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    // +1s of slack so the timer never fires a hair before the boundary.
    const timer = setTimeout(sync, midnight.getTime() - now.getTime() + 1000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sync();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
    // Re-arms for the following midnight each time the day changes.
  }, [today]);

  return today;
}

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { ready: storeReady, store } = useStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [ready, setReady] = useState(false);
  const repoRef = useRef<ExpenseRepository | null>(null);

  useEffect(() => {
    if (!storeReady) {
      return;
    }
    if (store) {
      const repo = new ExpenseRepository(store);
      repoRef.current = repo;
      setExpenses(repo.load());
    }
    // Without a store there is simply nothing logged yet, unpersisted.
    setReady(true);
  }, [storeReady, store]);

  const today = useToday();

  const value = useMemo<ExpenseContextValue>(() => {
    const commit = (next: Expense[]) => {
      setExpenses(next);
      repoRef.current?.save(next);
    };

    return {
      ready,
      expenses,
      log: (input) => {
        const next = addExpense(expenses, input, makeId);
        commit(next);
        // `addExpense` appends, so the new expense is last.
        return next[next.length - 1] as Expense;
      },
      spentOn: (day) => spentOn(expenses, day),
      byDay: groupByDay(expenses),
      recent: recentExpenses(expenses, RECENT_LIMIT),
      today,
    };
  }, [expenses, ready, today]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses(): ExpenseContextValue {
  const ctx = useContext(ExpenseContext);
  if (!ctx) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return ctx;
}
