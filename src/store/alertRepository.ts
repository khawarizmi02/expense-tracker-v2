// Persistence adapter for the Alert records (T6).
//
// Thin like the other repositories: all Alert *logic* lives in `core`; this only
// serializes which thresholds have already been announced, so a warning survives
// an app restart and still fires only once per category per Cycle. `recordAlerts`
// prunes to the current Cycle, so what is stored stays small on its own.

import { ALERT_THRESHOLDS, type AlertRecord, type AlertThreshold } from '../core';
import type { EncryptedStore } from './encryptedStore';

const ALERTS_KEY = 'entities.firedAlerts';

function isThreshold(value: unknown): value is AlertThreshold {
  return ALERT_THRESHOLDS.some((threshold) => threshold === value);
}

/**
 * Keep only the records that still mean something. A threshold an older build
 * wrote — or a hand-edited store — would otherwise silence a real warning, and a
 * dropped record only costs one repeated notification.
 */
function isRecord(value: unknown): value is AlertRecord {
  const record = value as Partial<AlertRecord> | null;
  return (
    typeof record?.categoryId === 'string' &&
    typeof record.cycleStart === 'string' &&
    isThreshold(record.threshold)
  );
}

export class AlertRepository {
  constructor(private readonly store: EncryptedStore) {}

  /** Load the fired records; a fresh install has warned about nothing yet. */
  load(): AlertRecord[] {
    const stored = this.store.read<unknown[]>(ALERTS_KEY);
    return Array.isArray(stored) ? stored.filter(isRecord) : [];
  }

  save(records: readonly AlertRecord[]): void {
    this.store.write(ALERTS_KEY, records);
  }
}
