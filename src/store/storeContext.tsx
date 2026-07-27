// Opens the encrypted store once for the whole app and hands it to the entity
// providers (categories, expenses, …).
//
// Centralised because opening is asynchronous and can legitimately fail: MMKV
// isn't bundled into Expo Go (see ADR-0005), so the app falls back to in-memory
// data rather than crashing. Doing that in one place keeps every provider from
// repeating the same try/fallback.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { EncryptedStore } from './encryptedStore';

interface StoreContextValue {
  /** True once the open attempt has settled — succeeded *or* failed. */
  ready: boolean;
  /** The opened store, or null when persistence is unavailable. */
  store: EncryptedStore | null;
}

const StoreContext = createContext<StoreContextValue>({ ready: false, store: null });

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<StoreContextValue>({ ready: false, store: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let store: EncryptedStore | null = null;
      try {
        store = await EncryptedStore.open();
      } catch {
        // Store unavailable (e.g. Expo Go) — carry on unpersisted.
        store = null;
      }
      if (!cancelled) {
        setValue({ ready: true, store });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  return useContext(StoreContext);
}
