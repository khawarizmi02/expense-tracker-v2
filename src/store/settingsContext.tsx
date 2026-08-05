// React binding for app settings and the current Cycle (T4).
//
// The Cycle is *derived*, never stored: this provider keeps the user's payday
// and recomputes the boundaries against today's date, so a Cycle rolls over on
// its own when the day turns (see `useToday`). All boundary logic stays in
// `core`; this is a thin adapter.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  currentCycle,
  daysRemaining,
  isValidCycleStartDay,
  type Cycle,
  type LocalDay,
} from '../core';
import { DEFAULT_SETTINGS, SettingsRepository, type Settings } from './settingsRepository';
import { useStore } from './storeContext';
import { useToday } from './useToday';

interface SettingsContextValue {
  ready: boolean;
  /** The user's payday, 1–31. */
  cycleStartDay: number;
  /** False until onboarding has captured a payday. */
  onboarded: boolean;
  /** The Cycle today falls in, recomputed from the payday. */
  cycle: Cycle;
  /** Days of the Cycle left, counting today (CONTEXT.md § Cycle). */
  daysRemaining: number;
  /** The device-local day as of the last render. */
  today: LocalDay;
  /** Finish onboarding with the chosen payday. */
  completeOnboarding: (cycleStartDay: number) => void;
  /** Change the payday later; the current Cycle re-derives immediately. */
  setCycleStartDay: (cycleStartDay: number) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { ready: storeReady, store } = useStore();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const repoRef = useRef<SettingsRepository | null>(null);

  useEffect(() => {
    if (!storeReady) {
      return;
    }
    if (store) {
      const repo = new SettingsRepository(store);
      repoRef.current = repo;
      setSettings(repo.load());
    }
    // Without a store the defaults stand, unpersisted — onboarding runs again
    // next launch, which is the honest behaviour when nothing can be saved.
    setReady(true);
  }, [storeReady, store]);

  const today = useToday();

  const value = useMemo<SettingsContextValue>(() => {
    const commit = (next: Settings) => {
      setSettings(next);
      repoRef.current?.save(next);
    };

    const cycle = currentCycle(settings.cycleStartDay, today);

    return {
      ready,
      cycleStartDay: settings.cycleStartDay,
      onboarded: settings.onboarded,
      cycle,
      daysRemaining: daysRemaining(cycle, today),
      today,
      completeOnboarding: (cycleStartDay) => {
        if (!isValidCycleStartDay(cycleStartDay)) {
          return;
        }
        commit({ cycleStartDay, onboarded: true });
      },
      setCycleStartDay: (cycleStartDay) => {
        if (!isValidCycleStartDay(cycleStartDay)) {
          return;
        }
        commit({ ...settings, cycleStartDay });
      },
    };
  }, [ready, settings, today]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
