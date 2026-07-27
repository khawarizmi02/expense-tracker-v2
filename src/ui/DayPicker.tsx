// Calendar day picker for back-dating an expense.
//
// Hand-rolled rather than a native date-picker module so it renders identically
// on both platforms and inside Expo Go (see ADR-0005), and so the "no future
// days" rule is enforced in the grid itself rather than fought after the fact.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDays, fromLocalDay, toLocalDay, type LocalDay } from '../core';
import { useTheme } from '../design/theme';
import { MONTHS, WEEKDAYS } from './format';

const WEEKDAY_INITIALS = WEEKDAYS.map((name) => name.charAt(0));

/**
 * The day cells of `month`'s grid: leading blanks for the weekday offset, then
 * every day of the month.
 */
function monthGrid(month: Date): (LocalDay | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leading: null[] = Array(first.getDay()).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    toLocalDay(new Date(month.getFullYear(), month.getMonth(), i + 1)),
  );
  return [...leading, ...days];
}

export interface DayPickerProps {
  /** The currently chosen day. */
  value: LocalDay;
  /** The latest selectable day — days after it are disabled (no future spend). */
  maxDay: LocalDay;
  onChange: (day: LocalDay) => void;
}

export function DayPicker({ value, maxDay, onChange }: DayPickerProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const [month, setMonth] = useState(() => fromLocalDay(value));

  const cells = monthGrid(month);
  // Stepping forward past the max day's month would show nothing selectable.
  const canGoForward = toLocalDay(month).slice(0, 7) < maxDay.slice(0, 7);

  const stepMonth = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md }]}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => stepMonth(-1)}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text
          style={{
            fontFamily: typography.fontFamily.semibold,
            fontSize: typography.size.body,
            color: colors.textPrimary,
          }}
        >
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: !canGoForward }}
          disabled={!canGoForward}
          onPress={() => stepMonth(1)}
          hitSlop={8}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={canGoForward ? colors.textPrimary : colors.textMuted}
          />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {WEEKDAY_INITIALS.map((initial, index) => (
          <View key={`weekday-${index}`} style={styles.cell}>
            <Text
              style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.caption,
                color: colors.textMuted,
              }}
            >
              {initial}
            </Text>
          </View>
        ))}

        {cells.map((day, index) => {
          if (!day) {
            return <View key={`blank-${index}`} style={styles.cell} />;
          }
          const selected = day === value;
          const disabled = day > maxDay;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={day}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(day)}
              style={styles.cell}
            >
              <View
                style={[
                  styles.dayBubble,
                  selected && { backgroundColor: colors.accent },
                ]}
              >
                <Text
                  style={{
                    fontFamily: selected
                      ? typography.fontFamily.semibold
                      : typography.fontFamily.regular,
                    fontSize: typography.size.body,
                    color: selected
                      ? colors.onAccent
                      : disabled
                        ? colors.textMuted
                        : colors.textPrimary,
                  }}
                >
                  {Number(day.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.shortcuts}>
        {[
          { label: 'Today', day: maxDay },
          { label: 'Yesterday', day: addDays(maxDay, -1) },
        ].map((shortcut) => (
          <Pressable
            key={shortcut.label}
            accessibilityRole="button"
            onPress={() => {
              setMonth(fromLocalDay(shortcut.day));
              onChange(shortcut.day);
            }}
            style={[
              styles.shortcut,
              { borderColor: colors.border, borderRadius: radius.pill },
            ]}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.caption,
                color: colors.textSecondary,
              }}
            >
              {shortcut.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcuts: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  shortcut: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
});
