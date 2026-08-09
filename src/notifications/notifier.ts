// Notification adapter (T6) — the thin layer that *delivers* an Alert.
//
// The core decides whether an Alert is due (`dueAlerts`); this only puts it on
// screen. Kira is local-first and on-device, so these are local notifications
// posted immediately, not push messages from a server — the user's spending
// never leaves the phone to trigger one.
//
// Everything here is permission-gated and best-effort: a denied prompt, or a
// host that can't post notifications at all, must never stop an expense from
// being saved or the in-app toast from appearing.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/** Android needs a channel before anything can be posted to it. */
const CHANNEL_ID = 'budget-alerts';

export interface NotificationMessage {
  readonly title: string;
  readonly body: string;
}

// Foreground alerts are the common case here — the user has just saved an
// expense inside the app — so the banner is shown rather than swallowed.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Remembered for the session so a user who has already answered isn't asked
 * again on every crossing. The OS keeps the durable answer; this only avoids
 * re-entering the prompt flow within one run.
 */
let permission: boolean | null = null;

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Budget alerts',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Whether Kira may post notifications *right now*, without ever prompting. */
export async function readNotificationPermission(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * Whether Kira may post notifications, asking once if the user hasn't decided.
 *
 * Asked lazily, at the first crossing rather than at app start: the prompt then
 * arrives attached to a warning the user can see the point of, instead of as an
 * unexplained interruption during onboarding.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (permission !== null) {
    return permission;
  }
  try {
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted
      ? true
      : current.canAskAgain
        ? (await Notifications.requestPermissionsAsync()).granted
        : false;
    permission = granted;
    return granted;
  } catch {
    // No notification support on this host (a bare Expo Go build, say). Nothing
    // is broken — the toast still tells the user where they stand.
    permission = false;
    return false;
  }
}

/** Post one notification now, or do nothing if Kira isn't allowed to. */
export async function notify(message: NotificationMessage): Promise<void> {
  if (!(await ensureNotificationPermission())) {
    return;
  }
  try {
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: { title: message.title, body: message.body },
      // A null trigger delivers immediately; the Alert is about spend that has
      // already happened, so there is nothing to wait for.
      trigger: null,
    });
  } catch {
    // Delivery is best-effort: a failed post must not fail the save behind it.
  }
}

/** Test seam: forget the cached answer so the next call asks again. */
export function resetNotificationPermission(): void {
  permission = null;
}
