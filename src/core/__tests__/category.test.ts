// T2 acceptance: Category model + archive semantics, tested through the public API.

import {
  DEFAULT_CATEGORY_SEEDS,
  addCategory,
  archiveCategory,
  activeCategories,
  findCategory,
  renameCategory,
  seedDefaultCategories,
  unarchiveCategory,
  updateCategoryAppearance,
  CategoryError,
  type Category,
} from '..';
import { makeCounterIds } from './helpers';

describe('seeded defaults', () => {
  it('seeds the canonical default set in order', () => {
    const categories = seedDefaultCategories(makeCounterIds());
    expect(categories.map((c) => c.name)).toEqual([
      'Groceries',
      'Dining',
      'Transport',
      'Bills',
      'Entertainment',
      'Shopping',
      'Other',
    ]);
    expect(categories.every((c) => c.seeded)).toBe(true);
    expect(categories.every((c) => !c.archived)).toBe(true);
  });

  it('matches the exported seed definitions', () => {
    const categories = seedDefaultCategories(makeCounterIds());
    expect(categories.map((c) => c.name)).toEqual(
      DEFAULT_CATEGORY_SEEDS.map((s) => s.name),
    );
  });

  it('gives each category a distinct id', () => {
    const categories = seedDefaultCategories(makeCounterIds());
    const ids = new Set(categories.map((c) => c.id));
    expect(ids.size).toBe(categories.length);
  });
});

describe('add / rename / re-icon', () => {
  it('adds a user-created (non-seeded) category', () => {
    const before: Category[] = [];
    const after = addCategory(
      before,
      { name: 'Coffee', icon: 'cup', color: 'categoryBrown' },
      makeCounterIds(),
    );
    expect(before).toEqual([]); // input untouched (pure)
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({
      name: 'Coffee',
      icon: 'cup',
      color: 'categoryBrown',
      seeded: false,
      archived: false,
    });
  });

  it('trims whitespace and rejects empty names', () => {
    const ids = makeCounterIds();
    const after = addCategory(
      [],
      { name: '  Coffee  ', icon: 'cup', color: 'x' },
      ids,
    );
    expect(after[0].name).toBe('Coffee');
    expect(() =>
      addCategory([], { name: '   ', icon: 'cup', color: 'x' }, ids),
    ).toThrow(CategoryError);
  });

  it('renames a category', () => {
    const ids = makeCounterIds();
    const cats = addCategory([], { name: 'Coffe', icon: 'cup', color: 'x' }, ids);
    const renamed = renameCategory(cats, cats[0].id, 'Coffee');
    expect(renamed[0].name).toBe('Coffee');
  });

  it('changes icon and color independently', () => {
    const ids = makeCounterIds();
    const cats = addCategory([], { name: 'Coffee', icon: 'cup', color: 'x' }, ids);
    const reIcon = updateCategoryAppearance(cats, cats[0].id, { icon: 'mug' });
    expect(reIcon[0]).toMatchObject({ icon: 'mug', color: 'x' });
    const reColor = updateCategoryAppearance(reIcon, cats[0].id, { color: 'y' });
    expect(reColor[0]).toMatchObject({ icon: 'mug', color: 'y' });
  });

  it('throws when editing an unknown id', () => {
    expect(() => renameCategory([], 'nope', 'X')).toThrow(CategoryError);
    expect(() => updateCategoryAppearance([], 'nope', { icon: 'x' })).toThrow(
      CategoryError,
    );
    expect(() => archiveCategory([], 'nope')).toThrow(CategoryError);
  });
});

describe('archive semantics (delete = archive, never destroy)', () => {
  it('hides an archived category from active views but keeps it resolvable', () => {
    const cats = seedDefaultCategories(makeCounterIds());
    const dining = cats.find((c) => c.name === 'Dining')!;

    const archived = archiveCategory(cats, dining.id);

    // Hidden from pickers / current dashboard...
    expect(activeCategories(archived).map((c) => c.name)).not.toContain('Dining');
    expect(activeCategories(archived)).toHaveLength(cats.length - 1);

    // ...but still resolvable so historical Expenses stay attributed.
    const resolved = findCategory(archived, dining.id);
    expect(resolved).toBeDefined();
    expect(resolved).toMatchObject({ name: 'Dining', archived: true });
  });

  it('does not destroy the category (list length is preserved)', () => {
    const cats = seedDefaultCategories(makeCounterIds());
    const archived = archiveCategory(cats, cats[0].id);
    expect(archived).toHaveLength(cats.length);
  });

  it('archiving is idempotent', () => {
    const cats = seedDefaultCategories(makeCounterIds());
    const once = archiveCategory(cats, cats[0].id);
    const twice = archiveCategory(once, cats[0].id);
    expect(twice[0].archived).toBe(true);
    expect(twice).toHaveLength(cats.length);
  });

  it('can restore an archived category', () => {
    const cats = seedDefaultCategories(makeCounterIds());
    const archived = archiveCategory(cats, cats[0].id);
    const restored = unarchiveCategory(archived, cats[0].id);
    expect(findCategory(restored, cats[0].id)!.archived).toBe(false);
    expect(activeCategories(restored)).toHaveLength(cats.length);
  });

  it('does not mutate the input list', () => {
    const cats = seedDefaultCategories(makeCounterIds());
    archiveCategory(cats, cats[0].id);
    expect(cats.every((c) => !c.archived)).toBe(true);
  });
});
