// Public API of the pure, framework-agnostic `core` domain module.
//
// Everything the app (UI, persistence, notifications) depends on comes from
// here. Tests exercise external behavior through this surface only — never
// private helpers or storage format (see PRD/spec § Testing Decisions).

export type {
  Category,
  CaptureSource,
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
  groupByDay,
  recentExpenses,
} from './expense';

export { toLocalDay, fromLocalDay, addDays } from './day';

export { MINOR_UNITS_PER_MAJOR } from './money';

/** Semantic version of the core public API. */
export const CORE_VERSION = '0.2.0';
