// Payday picker: the 1–31 grid the user anchors their Cycle to (T4).
//
// A plain grid of every day of the month rather than a native date-picker: what
// is being chosen is a *day of the month*, not a date, and 29–31 must stay
// pickable even in a month that doesn't have them (they clamp back — see
// ADR-0001).

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { clampsInShortMonths } from '../core';
import { useTheme } from '../design/theme';
import { formatOrdinalDay } from './format';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export interface PaydayPickerProps {
  /** The currently chosen day of the month, 1–31. */
  value: number;
  onChange: (day: number) => void;
}

export function PaydayPicker({ value, onChange }: PaydayPickerProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
      ]}
    >
      <View style={styles.grid}>
        {DAYS.map((day) => {
          const selected = day === value;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={`Day ${day} of the month`}
              accessibilityState={{ selected }}
              onPress={() => onChange(day)}
              style={styles.cell}
            >
              <View
                style={[styles.dayBubble, selected && { backgroundColor: colors.accent }]}
              >
                <Text
                  style={{
                    fontFamily: selected
                      ? typography.fontFamily.semibold
                      : typography.fontFamily.regular,
                    fontSize: typography.size.body,
                    color: selected ? colors.onAccent : colors.textPrimary,
                  }}
                >
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Picking a day the calendar doesn't always have needs explaining where
          it's picked, not somewhere further down the screen. */}
      {clampsInShortMonths(value) && (
        <Text
          style={{
            marginTop: spacing.xs,
            paddingHorizontal: spacing.sm,
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.caption,
            lineHeight: typography.lineHeight.caption,
            color: colors.textSecondary,
          }}
        >
          Months without a {formatOrdinalDay(value)} start on their last day instead.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%' },
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
});
