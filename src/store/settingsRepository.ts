// Persistence adapter for app settings (T4).
//
// Thin like the entity repositories: it serializes plain data to/from the
// encrypted store. The only Cycle fact worth persisting is the user's chosen
// start day — boundaries are always recomputed from it (see ADR-0001).

import { DEFAULT_CYCLE_START_DAY, isValidCycleStartDay } from '../core';
import type { EncryptedStore } from './encryptedStore';

const SETTINGS_KEY = 'settings.app';

export interface Settings {
  /** The user's payday, 1–31; the anchor for every Cycle boundary. */
  readonly cycleStartDay: number;
  /** True once the user has been through onboarding and picked their payday. */
  readonly onboarded: boolean;
}

/** What a fresh install starts from, before onboarding says otherwise. */
export const DEFAULT_SETTINGS: Settings = {
  cycleStartDay: DEFAULT_CYCLE_START_DAY,
  onboarded: false,
};

/**
 * Coerce whatever was on disk into usable settings. A start day that isn't a
 * real day of the month (an older build, a hand-edited store) falls back to the
 * default rather than propagating into every Cycle computation downstream.
 */
function normalize(stored: Partial<Settings> | undefined): Settings {
  if (!stored) {
    return DEFAULT_SETTINGS;
  }
  const cycleStartDay =
    typeof stored.cycleStartDay === 'number' && isValidCycleStartDay(stored.cycleStartDay)
      ? stored.cycleStartDay
      : DEFAULT_SETTINGS.cycleStartDay;
  return { cycleStartDay, onboarded: stored.onboarded === true };
}

export class SettingsRepository {
  constructor(private readonly store: EncryptedStore) {}

  load(): Settings {
    return normalize(this.store.read<Partial<Settings>>(SETTINGS_KEY));
  }

  save(settings: Settings): void {
    this.store.write(SETTINGS_KEY, settings);
  }
}
