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
import * as Crypto from 'expo-crypto';
import {
  addExpense,
  groupByDay,
  recentExpenses,
  spentInCycle,
  spentOn,
  type Cycle,
  type DayGroup,
  type Expense,
  type ExpenseInput,
  type LocalDay,
} from '../core';
import { ExpenseRepository } from './expenseRepository';
import { useStore } from './storeContext';
import { useToday } from './useToday';

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
  /**
   * Total spent inside a Cycle, in minor units. The Cycle is passed in rather
   * than read here so this provider stays independent of the settings that
   * anchor it.
   */
  spentInCycle: (cycle: Cycle) => number;
  /** The day-grouped history, newest day first, with per-day totals. */
  byDay: DayGroup[];
  /** The most recently logged expenses, newest first. */
  recent: Expense[];
  /** The device-local day as of the last render (see CONTEXT.md § Day). */
  today: LocalDay;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

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
      spentInCycle: (cycle) => spentInCycle(expenses, cycle),
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
