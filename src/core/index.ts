// Public API of the pure, framework-agnostic `core` domain module.
//
// Everything the app (UI, persistence, notifications) depends on comes from
// here. Tests exercise external behavior through this surface only — never
// private helpers or storage format (see PRD/spec § Testing Decisions).

export type {
  Budget,
  Category,
  CaptureSource,
  Cycle,
  Expense,
  ExpenseInput,
  IdFactory,
} from './types';

export type { LocalDay } from './day';

export {
  DEFAULT_CATEGORY_SEEDS,
  CategoryError,
  seedDefaultCategories,
  addCategory,
  renameCategory,
  updateCategoryAppearance,
  archiveCategory,
  unarchiveCategory,
  activeCategories,
  findCategory,
} from './category';

export type { DayGroup } from './expense';

export {
  ExpenseError,
  addExpense,
  spentOn,
  spentInCycle,
  spentInCycleByCategory,
  expensesInCycleByCategory,
  groupByDay,
  recentExpenses,
} from './expense';

export type {
  BudgetSummary,
  CappedCategoryBudget,
  CategoryBudget,
  TrackedOnlyCategoryBudget,
} from './budget';

export {
  BudgetError,
  findBudget,
  setCap,
  clearCap,
  safePerDay,
  categoryBudgets,
  budgetSummary,
  topBudgets,
} from './budget';

export {
  DEFAULT_CYCLE_START_DAY,
  CycleError,
  isValidCycleStartDay,
  clampsInShortMonths,
  currentCycle,
  containsDay,
  cycleLength,
  daysElapsed,
  daysRemaining,
} from './cycle';

export { toLocalDay, fromLocalDay, addDays } from './day';

export { MAX_AMOUNT_MINOR, MINOR_UNITS_PER_MAJOR } from './money';

/** Semantic version of the core public API. */
export const CORE_VERSION = '0.4.0';
