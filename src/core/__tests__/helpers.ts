import type { IdFactory } from '..';

/** Deterministic id factory for tests: c1, c2, c3, … */
export function makeCounterIds(prefix = 'c'): IdFactory {
  let n = 0;
  return () => `${prefix}${(n += 1)}`;
}
