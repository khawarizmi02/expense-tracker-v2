// Persistence adapter for the core Category entity.
//
// Thin by design: all category *logic* lives in `core`; this only serializes the
// core's plain data to/from the encrypted store, seeding defaults on first run.

import { seedDefaultCategories, type Category } from '../core';
import type { EncryptedStore } from './encryptedStore';

const CATEGORIES_KEY = 'entities.categories';

export class CategoryRepository {
  constructor(private readonly store: EncryptedStore) {}

  /** Load categories, seeding the default set the first time. */
  load(makeId: () => string): Category[] {
    const existing = this.store.read<Category[]>(CATEGORIES_KEY);
    if (existing) {
      return existing;
    }
    const seeded = seedDefaultCategories(makeId);
    this.store.write(CATEGORIES_KEY, seeded);
    return seeded;
  }

  save(categories: readonly Category[]): void {
    this.store.write(CATEGORIES_KEY, categories);
  }
}
