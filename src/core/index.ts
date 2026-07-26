// Public API of the pure, framework-agnostic `core` domain module.
//
// Everything the app (UI, persistence, notifications) depends on comes from
// here. Tests exercise external behavior through this surface only — never
// private helpers or storage format (see PRD/spec § Testing Decisions).

export type { Category, IdFactory } from './types';

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

/** Semantic version of the core public API. */
export const CORE_VERSION = '0.1.0';
