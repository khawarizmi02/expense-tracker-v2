// React binding for the Alert domain (T6): watches the budget views, fires the
// over-budget warnings that have come due, and remembers which ones went out.
//
// Deliberately a *watcher* rather than something a save screen calls. Spend can
// cross a threshold from more than one direction — logging an expense, but also
// back-dating one into this Cycle or lowering a cap — and any of those deserves
// the same warning. Watching the derived views catches all of them in one place,
// so no future capture flow can forget to ask.
//
// It lives beside the notifier rather than in `src/store` because delivering
// the warning is what it is for; the records it keeps go through a repository
// like every other entity's.
//
// All the deciding is `core`'s (`announcements` / `dueAlerts` / `recordAlerts`);
// this only wires the records to the store and the Alerts to the notifier.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { announcements, dueAlerts, recordAlerts, type AlertRecord } from '../core';
import { AlertRepository } from '../store/alertRepository';
import { useBudgets } from '../store/budgetContext';
import { useExpenses } from '../store/expenseContext';
import { useSettings } from '../store/settingsContext';
import { useStore } from '../store/storeContext';
import { formatAlertNotification } from '../ui/format';
import { ensureNotificationPermission, notify, readNotificationPermission } from './notifier';

interface AlertContextValue {
  ready: boolean;
  /** The thresholds already announced, for the Cycle they were announced in. */
  fired: AlertRecord[];
  /** Whether the OS currently lets Kira post an Alert as a notification. */
  notificationsEnabled: boolean;
  /** Ask for notification permission; resolves to whether Kira now has it. */
  enableNotifications: () => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { ready: storeReady, store } = useStore();
  const { ready: budgetsReady, views } = useBudgets();
  const { ready: expensesReady } = useExpenses();
  const { ready: settingsReady, cycle } = useSettings();
  const [fired, setFired] = useState<AlertRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const repoRef = useRef<AlertRepository | null>(null);
  // The same records as `fired`, readable synchronously. The watcher below can
  // run twice before a `setFired` has committed, and a stale read there would
  // send the same warning twice — the one thing this module exists to prevent.
  const firedRef = useRef<AlertRecord[]>([]);
  // An Alert is about *crossing* a threshold, and the first look at the data
  // after launch sees positions, not crossings. So the first pass records what
  // is already over without announcing it: a user who was at 90% yesterday
  // opens Kira to their dashboard, not to a pile of notifications about
  // spending they already know about. Every pass after that is a real change.
  const baselineTaken = useRef(false);

  useEffect(() => {
    if (!storeReady) {
      return;
    }
    if (store) {
      const repo = new AlertRepository(store);
      repoRef.current = repo;
      const stored = repo.load();
      firedRef.current = stored;
      setFired(stored);
    }
    // Without a store nothing has been announced yet, and nothing will persist:
    // warnings then repeat next launch, which beats swallowing them.
    setReady(true);
  }, [storeReady, store]);

  useEffect(() => {
    let cancelled = false;
    void readNotificationPermission().then((granted) => {
      if (!cancelled) {
        setNotificationsEnabled(granted);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !budgetsReady || !expensesReady || !settingsReady) {
      return;
    }
    const alerts = dueAlerts(views, cycle, firedRef.current);
    const next = recordAlerts(firedRef.current, alerts, cycle);
    // Anything recorded must be written before it can be forgotten. Length
    // alone would miss a rollover that drops as many records as it adds, so the
    // due list is checked too; an untouched list commits nothing, or this loops.
    if (alerts.length > 0 || next.length !== firedRef.current.length) {
      firedRef.current = next;
      setFired(next);
      repoRef.current?.save(next);
    }
    if (!baselineTaken.current) {
      baselineTaken.current = true;
      return;
    }
    // Recorded either way: with notifications refused there is no channel to
    // deliver on, and the in-app surfaces — the toast, the amber bar, the
    // category detail — already say the same thing without buzzing.
    for (const alert of announcements(alerts)) {
      void notify(formatAlertNotification(alert));
    }
  }, [ready, budgetsReady, expensesReady, settingsReady, views, cycle]);

  const enableNotifications = useCallback(async () => {
    const granted = await ensureNotificationPermission();
    setNotificationsEnabled(granted);
    return granted;
  }, []);

  const value = useMemo<AlertContextValue>(
    () => ({ ready, fired, notificationsEnabled, enableNotifications }),
    [ready, fired, notificationsEnabled, enableNotifications],
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlerts(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return ctx;
}
