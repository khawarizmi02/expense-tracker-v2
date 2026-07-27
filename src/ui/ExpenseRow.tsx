// One logged expense as a list row — shared by Home's recent list and History.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { findCategory, type Expense } from '../core';
import { useTheme } from '../design/theme';
import { useCategories } from '../store/categoryContext';
import { ioniconFor } from './categoryIcon';
import { formatMoney } from './format';

export function ExpenseRow({ expense }: { expense: Expense }) {
  const { colors, spacing, typography, radius, categoryColor } = useTheme();
  const { categories } = useCategories();

  // Resolved from the full list, archived included: a past expense keeps its
  // category even after the user archives it (see CONTEXT.md § Category).
  const category = findCategory(categories, expense.categoryId);
  const tint = category ? categoryColor(category.color) : colors.textMuted;
  // Merchant is the headline when known; otherwise the category carries the row.
  const title = expense.merchant || category?.name || 'Expense';
  // The category only repeats below the title when the merchant is the title.
  const subtitle = [expense.merchant ? category?.name : null, expense.note]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.row, { paddingVertical: spacing.sm }]}>
      <View
        style={[
          styles.icon,
          { backgroundColor: tint, borderRadius: radius.md },
        ]}
      >
        <Ionicons name={ioniconFor(category?.icon ?? '')} size={17} color="#FFFFFF" />
      </View>

      <View style={[styles.body, { marginLeft: spacing.md }]}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.fontFamily.medium,
            fontSize: typography.size.body,
            color: colors.textPrimary,
          }}
        >
          {title}
        </Text>
        {subtitle !== '' && (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.caption,
              color: colors.textSecondary,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <Text
        style={{
          fontFamily: typography.fontFamily.semibold,
          fontSize: typography.size.body,
          color: colors.textPrimary,
        }}
      >
        {formatMoney(expense.amountMinor)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
});
