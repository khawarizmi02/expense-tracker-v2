// T1 acceptance: the `core` module exists with a public API and passes tests.

import { CORE_VERSION, seedDefaultCategories } from '..';
import { makeCounterIds } from './helpers';

describe('core module', () => {
  it('exposes a version', () => {
    expect(CORE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('is callable through its public API', () => {
    const categories = seedDefaultCategories(makeCounterIds());
    expect(categories.length).toBeGreaterThan(0);
  });
});
