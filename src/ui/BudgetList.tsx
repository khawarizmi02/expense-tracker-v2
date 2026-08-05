// A card of budget rows — Home's top budgets and the full list on Insights are
// the same list, so they share the card and, more importantly, the same tap
// target: every row opens that category's detail overlay.

import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CategoryBudget } from '../core';
import { useTheme } from '../design/theme';
import { BudgetRow } from './BudgetRow';

export function BudgetList({ views }: { views: readonly CategoryBudget[] }) {
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      {views.map((view) => (
        <BudgetRow
          key={view.category.id}
          view={view}
          onPress={() =>
            router.push({ pathname: '/category/[id]', params: { id: view.category.id } })
          }
        />
      ))}
    </View>
  );
}
