// Category domain logic (T2).
//
// Pure functions over an immutable `Category[]`. Each mutating function returns a
// new array; the input is never modified. Ids are supplied by an injected
// IdFactory so the core holds no randomness (see types.ts).

import type { Category, IdFactory } from './types';

/** The seeded default category set, in display order. See CONTEXT.md § Category. */
export const DEFAULT_CATEGORY_SEEDS: ReadonlyArray<{
  name: string;
  icon: string;
  color: string;
}> = [
  { name: 'Groceries', icon: 'cart', color: 'categoryGreen' },
  { name: 'Dining', icon: 'utensils', color: 'categoryOrange' },
  { name: 'Transport', icon: 'car', color: 'categoryBlue' },
  { name: 'Bills', icon: 'receipt', color: 'categoryRed' },
  { name: 'Entertainment', icon: 'film', color: 'categoryPurple' },
  { name: 'Shopping', icon: 'bag', color: 'categoryPink' },
  { name: 'Other', icon: 'dots', color: 'categoryGray' },
];

export class CategoryError extends Error {}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new CategoryError('Category name must not be empty');
  }
  return trimmed;
}

function requireCategory(categories: readonly Category[], id: string): Category {
  const found = categories.find((c) => c.id === id);
  if (!found) {
    throw new CategoryError(`No category with id ${id}`);
  }
  return found;
}

/** Guard the id exists, then return a new list with `patch` applied to it. */
function patchCategory(
  categories: readonly Category[],
  id: string,
  patch: (category: Category) => Category,
): Category[] {
  requireCategory(categories, id);
  return categories.map((c) => (c.id === id ? patch(c) : c));
}

/**
 * Build the seeded default categories. Onboarding calls this once to give a new
 * user a taxonomy to start from (they can then add/rename/re-icon/remove).
 */
export function seedDefaultCategories(makeId: IdFactory): Category[] {
  return DEFAULT_CATEGORY_SEEDS.map((seed) => ({
    id: makeId(),
    name: seed.name,
    icon: seed.icon,
    color: seed.color,
    archived: false,
    seeded: true,
  }));
}

/** Add a user-created category. Returns a new list with the category appended. */
export function addCategory(
  categories: readonly Category[],
  input: { name: string; icon: string; color: string },
  makeId: IdFactory,
): Category[] {
  const category: Category = {
    id: makeId(),
    name: normalizeName(input.name),
    icon: input.icon,
    color: input.color,
    archived: false,
    seeded: false,
  };
  return [...categories, category];
}

/** Rename a category (seeded or user-created). */
export function renameCategory(
  categories: readonly Category[],
  id: string,
  name: string,
): Category[] {
  const nextName = normalizeName(name);
  return patchCategory(categories, id, (c) => ({ ...c, name: nextName }));
}

/** Change a category's icon and/or color ("re-icon"). */
export function updateCategoryAppearance(
  categories: readonly Category[],
  id: string,
  appearance: { icon?: string; color?: string },
): Category[] {
  return patchCategory(categories, id, (c) => ({
    ...c,
    icon: appearance.icon ?? c.icon,
    color: appearance.color ?? c.color,
  }));
}

/**
 * Archive a category. This is what "delete" means in the UI: the category is
 * hidden from pickers and the current dashboard, but its historical Expenses
 * stay attributed to it. Archiving an already-archived category is a no-op.
 */
export function archiveCategory(
  categories: readonly Category[],
  id: string,
): Category[] {
  return patchCategory(categories, id, (c) => ({ ...c, archived: true }));
}

/** Restore an archived category to active use. */
export function unarchiveCategory(
  categories: readonly Category[],
  id: string,
): Category[] {
  return patchCategory(categories, id, (c) => ({ ...c, archived: false }));
}

/**
 * The categories offered for new-expense entry and shown on the current
 * dashboard: everything not archived.
 */
export function activeCategories(categories: readonly Category[]): Category[] {
  return categories.filter((c) => !c.archived);
}

/**
 * Resolve a category by id including archived ones. Used to attribute and
 * display historical Expenses whose category may since have been archived.
 */
export function findCategory(
  categories: readonly Category[],
  id: string,
): Category | undefined {
  return categories.find((c) => c.id === id);
}
