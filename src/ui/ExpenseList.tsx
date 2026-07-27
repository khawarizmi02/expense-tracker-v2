// The surface expenses are listed on, shared by Home's recent list and each of
// History's day groups, plus the one empty state both screens show.

import React from 'react';
import { Text, View } from 'react-native';
import type { Expense } from '../core';
import { useTheme } from '../design/theme';
import { ExpenseRow } from './ExpenseRow';

/** Shown wherever there is nothing logged yet — worded the same on every screen. */
export function EmptyExpenses() {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={{
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.size.body,
        color: colors.textSecondary,
      }}
    >
      Nothing logged yet. Tap ＋ to add your first expense.
    </Text>
  );
}

/** A rounded card holding one run of expense rows. */
export function ExpenseList({ expenses }: { expenses: readonly Expense[] }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      {expenses.map((expense) => (
        <ExpenseRow key={expense.id} expense={expense} />
      ))}
    </View>
  );
}
