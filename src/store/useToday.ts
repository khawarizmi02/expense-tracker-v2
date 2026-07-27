// The device clock, as a React binding.
//
// Kept out of any one entity provider: "today" is a Day concern (CONTEXT.md
// § Day), not an Expense one, and Streaks and Cycles will want the same reading.

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { toLocalDay, type LocalDay } from '../core';

/**
 * The current device-local day, kept current as the day actually turns over.
 *
 * "Today" is a clock reading, not derived state, and the boundary is local
 * midnight — so an app left open overnight must not keep showing yesterday's
 * total under "spent today", nor default QuickAdd to yesterday. Two triggers
 * cover it: a timer armed for the next local midnight, and a re-read whenever
 * the app returns to the foreground (background timers don't fire reliably, and
 * the phone's timezone may have changed mid-flight).
 */
export function useToday(): LocalDay {
  const [today, setToday] = useState(() => toLocalDay(new Date()));

  useEffect(() => {
    const sync = () => setToday(toLocalDay(new Date()));

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    // +1s of slack so the timer never fires a hair before the boundary.
    const timer = setTimeout(sync, midnight.getTime() - now.getTime() + 1000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sync();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
    // Re-arms for the following midnight each time the day changes.
  }, [today]);

  return today;
}
