// React binding for the Budget domain (T5): holds the per-category caps, applies
// the pure `core` operations, and persists through the encrypted store.
//
// Unlike the other entity providers this one also *derives*: the dashboard's
// spend-vs-cap views need caps, categories, expenses and the current Cycle
// together, and composing them in one place keeps every screen reading the same
// numbers. All the arithmetic still lives in `core` — this only wires it up, so
// the provider must sit inside the category, expense and settings providers.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  budgetSummary,
  categoryBudgets,
  clearCap as coreClearCap,
  findBudget,
  setCap as coreSetCap,
  topBudgets,
  type Budget,
  type BudgetSummary,
  type CategoryBudget,
} from '../core';
import { BudgetRepository } from './budgetRepository';
import { useCategories } from './categoryContext';
import { useExpenses } from './expenseContext';
import { useSettings } from './settingsContext';
import { useStore } from './storeContext';

/** How many budget bars Home shows before "see all" on Insights. */
const TOP_BUDGET_LIMIT = 3;

interface BudgetContextValue {
  ready: boolean;
  budgets: Budget[];
  /** Every active category's position this Cycle, capped or tracked-only. */
  views: CategoryBudget[];
  /** The Cycle's overall position: the Insights ring and its pace stats. */
  summary: BudgetSummary;
  /** The capped categories closest to their cap — Home's budget bars. */
  top: CategoryBudget[];
  /** One category's position, or undefined if it isn't an active category. */
  viewFor: (categoryId: string) => CategoryBudget | undefined;
  /** The cap on a category in minor units, or null when tracked-only. */
  capFor: (categoryId: string) => number | null;
  /** Set or change a category's cap. */
  setCap: (categoryId: string, capMinor: number) => void;
  /** Remove a category's cap, returning it to tracked-only. */
  clearCap: (categoryId: string) => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { ready: storeReady, store } = useStore();
  const { categories } = useCategories();
  const { expenses } = useExpenses();
  const { cycle, today } = useSettings();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [ready, setReady] = useState(false);
  const repoRef = useRef<BudgetRepository | null>(null);

  useEffect(() => {
    if (!storeReady) {
      return;
    }
    if (store) {
      const repo = new BudgetRepository(store);
      repoRef.current = repo;
      setBudgets(repo.load());
    }
    // Without a store nothing is capped yet, unpersisted.
    setReady(true);
  }, [storeReady, store]);

  const value = useMemo<BudgetContextValue>(() => {
    const commit = (next: Budget[]) => {
      setBudgets(next);
      repoRef.current?.save(next);
    };

    const views = categoryBudgets(categories, budgets, expenses, cycle);

    return {
      ready,
      budgets,
      views,
      summary: budgetSummary(views, cycle, today),
      top: topBudgets(views, TOP_BUDGET_LIMIT),
      viewFor: (categoryId) => views.find((v) => v.category.id === categoryId),
      capFor: (categoryId) => findBudget(budgets, categoryId)?.capMinor ?? null,
      setCap: (categoryId, capMinor) => commit(coreSetCap(budgets, categoryId, capMinor)),
      clearCap: (categoryId) => commit(coreClearCap(budgets, categoryId)),
    };
  }, [budgets, categories, expenses, cycle, today, ready]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudgets(): BudgetContextValue {
  const ctx = useContext(BudgetContext);
  if (!ctx) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return ctx;
}
