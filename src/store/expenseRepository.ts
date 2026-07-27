// Persistence adapter for the core Expense entity.
//
// Thin by design, like CategoryRepository: all expense *logic* lives in `core`;
// this only serializes the core's plain data to/from the encrypted store.

import type { Expense } from '../core';
import type { EncryptedStore } from './encryptedStore';

const EXPENSES_KEY = 'entities.expenses';

export class ExpenseRepository {
  constructor(private readonly store: EncryptedStore) {}

  /** Load logged expenses; a fresh install simply has none. */
  load(): Expense[] {
    return this.store.read<Expense[]>(EXPENSES_KEY) ?? [];
  }

  save(expenses: readonly Expense[]): void {
    this.store.write(EXPENSES_KEY, expenses);
  }
}
