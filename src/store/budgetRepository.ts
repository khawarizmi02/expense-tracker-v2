// Persistence adapter for the core Budget entity (T5).
//
// Thin by design, like the other entity repositories: all cap *logic* lives in
// `core`; this only serializes the core's plain data to/from the encrypted
// store. Only the caps are stored — spend-vs-cap is always recomputed against
// the current Cycle, which is what makes the hard reset free.

import type { Budget } from '../core';
import type { EncryptedStore } from './encryptedStore';

const BUDGETS_KEY = 'entities.budgets';

export class BudgetRepository {
  constructor(private readonly store: EncryptedStore) {}

  /** Load the caps; a fresh install has none — every category is tracked-only. */
  load(): Budget[] {
    return this.store.read<Budget[]>(BUDGETS_KEY) ?? [];
  }

  save(budgets: readonly Budget[]): void {
    this.store.write(BUDGETS_KEY, budgets);
  }
}
