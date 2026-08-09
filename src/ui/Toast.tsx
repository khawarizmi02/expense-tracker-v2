// The post-save toast (T6) — the in-app half of an over-budget warning.
//
// One toast at a time, above the tab bar, dismissed by tapping or by waiting.
// A new message replaces the one on screen rather than queueing: the newest
// save is the one the user just made, and a backlog of stale confirmations
// would be noise.
//
// The *words* come from `formatSaveFeedback`; the tone comes from the same
// thresholds the Alerts use. This component only shows what it is handed.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SaveFeedback } from '../core';
import { useTheme } from '../design/theme';

/** How a toast reads: an acknowledgement, a warning, or a limit passed. */
export type ToastTone = 'neutral' | 'warning' | 'danger';

/** The tone a post-save state reads in — the core's kinds, coloured. */
export function toneFor(feedback: SaveFeedback): ToastTone {
  switch (feedback.kind) {
    case 'over-budget':
      return 'danger';
    case 'at-threshold':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** How long a toast stays before fading, in milliseconds. */
const VISIBLE_MS = 3200;
const FADE_MS = 180;

interface ToastMessage {
  readonly text: string;
  readonly tone: ToastTone;
  /** Bumped on every show so an identical message still re-triggers the timer. */
  readonly id: number;
}

interface ToastContextValue {
  /** Show a toast, replacing whatever is on screen. */
  show: (text: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, React.ComponentProps<typeof Ionicons>['name']> = {
  neutral: 'checkmark-circle',
  warning: 'alert-circle',
  danger: 'warning',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const nextId = useRef(0);

  const show = useCallback((text: string, tone: ToastTone = 'neutral') => {
    nextId.current += 1;
    setMessage({ text, tone, id: nextId.current });
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message && (
        <Toast
          // Keyed by id so a replacement message remounts and starts its own
          // fade, instead of inheriting the outgoing one's animation.
          key={message.id}
          message={message}
          onDismiss={() => setMessage(null)}
        />
      )}
    </ToastContext.Provider>
  );
}

function Toast({ message, onDismiss }: { message: ToastMessage; onDismiss: () => void }) {
  const { colors, spacing, radius, typography, elevation } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let dismissed = false;
    const finish = () => {
      if (!dismissed) {
        dismissed = true;
        onDismiss();
      }
    };
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }),
      Animated.delay(VISIBLE_MS),
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        finish();
      }
    });
    return () => {
      opacity.stopAnimation();
      dismissed = true;
    };
  }, [opacity, onDismiss]);

  const tint =
    message.tone === 'danger'
      ? colors.danger
      : message.tone === 'warning'
        ? colors.warning
        : colors.success;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.host, { paddingHorizontal: spacing.lg, opacity }]}
    >
      <Pressable
        accessibilityRole="alert"
        accessibilityLabel={message.text}
        accessibilityLiveRegion="polite"
        onPress={onDismiss}
        style={[
          styles.toast,
          elevation.card,
          {
            backgroundColor: colors.surfaceRaised,
            borderRadius: radius.md,
            borderColor: tint,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
      >
        <Ionicons name={ICONS[message.tone]} size={20} color={tint} />
        <Text
          style={{
            flex: 1,
            marginLeft: spacing.sm,
            fontFamily: typography.fontFamily.medium,
            fontSize: typography.size.body,
            lineHeight: typography.lineHeight.body,
            color: colors.textPrimary,
          }}
        >
          {message.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Clear of the tab bar and the floating ＋ button.
    bottom: 96,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
  },
});
