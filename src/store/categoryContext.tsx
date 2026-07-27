// React binding for the Category domain: holds the category list in state,
// applies the pure `core` operations, and persists through the encrypted store.
// All category *logic* stays in `core`; this is a thin adapter.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Crypto from 'expo-crypto';
import {
  activeCategories as coreActive,
  addCategory,
  archiveCategory,
  renameCategory,
  seedDefaultCategories,
  unarchiveCategory,
  updateCategoryAppearance,
  type Category,
} from '../core';
import { CategoryRepository } from './categoryRepository';
import { useStore } from './storeContext';

const makeId = () => Crypto.randomUUID();

interface CategoryContextValue {
  ready: boolean;
  categories: Category[];
  activeCategories: Category[];
  add: (input: { name: string; icon: string; color: string }) => void;
  rename: (id: string, name: string) => void;
  reIcon: (id: string, appearance: { icon?: string; color?: string }) => void;
  archive: (id: string) => void;
  unarchive: (id: string) => void;
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const { ready: storeReady, store } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ready, setReady] = useState(false);
  const repoRef = useRef<CategoryRepository | null>(null);

  useEffect(() => {
    if (!storeReady) {
      return;
    }
    if (store) {
      const repo = new CategoryRepository(store);
      repoRef.current = repo;
      setCategories(repo.load(makeId));
    } else {
      // Store unavailable — start from seeded defaults, unpersisted.
      setCategories(seedDefaultCategories(makeId));
    }
    setReady(true);
  }, [storeReady, store]);

  // Persist whenever the list changes (after the initial load).
  const commit = (next: Category[]) => {
    setCategories(next);
    repoRef.current?.save(next);
  };

  const value = useMemo<CategoryContextValue>(
    () => ({
      ready,
      categories,
      activeCategories: coreActive(categories),
      add: (input) => commit(addCategory(categories, input, makeId)),
      rename: (id, name) => commit(renameCategory(categories, id, name)),
      reIcon: (id, appearance) =>
        commit(updateCategoryAppearance(categories, id, appearance)),
      archive: (id) => commit(archiveCategory(categories, id)),
      unarchive: (id) => commit(unarchiveCategory(categories, id)),
    }),
    [categories, ready],
  );

  return (
    <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>
  );
}

export function useCategories(): CategoryContextValue {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return ctx;
}
