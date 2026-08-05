// One category's spend-vs-cap row (T5) — shared by Home's top budgets and the
// full list on Insights.
//
// The row renders the two shapes a category can have (CONTEXT.md § Budget):
// *capped* shows a progress bar and "spent of cap", *tracked-only* shows the
// total alone, with no bar and no percent to imply a limit that isn't there.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CategoryBudget } from '../core';
import { useTheme, type Theme } from '../design/theme';
import { ioniconFor } from './categoryIcon';
import { formatMoney, formatPercent } from './format';

/**
 * The color a bar and its percent read in: calm within the cap, danger once
 * past it.
 *
 * Only the one threshold, because only "over the cap" is a fact T5 knows. The
 * 80% warning belongs to the Alert rules and arrives with them (spec § Alert) —
 * inventing it here would put the same number in two places.
 */
export function budgetTone(colors: Theme['colors'], percent: number): string {
  return percent >= 100 ? colors.danger : colors.success;
}

/**
 * The filled track of a capped category's bar. Also used on its own by the
 * category detail overlay, which prints its own numbers around it.
 */
export function BudgetBar({ percent }: { percent: number }) {
  const { colors, radius } = useTheme();
  // The *width* clamps at full — a bar can't overflow its track — while every
  // number printed around it still says what was really spent.
  const filled = Math.min(percent, 100);
  return (
    <View style={[styles.track, { backgroundColor: colors.border, borderRadius: radius.pill }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${filled}%`,
            backgroundColor: budgetTone(colors, percent),
            borderRadius: radius.pill,
          },
        ]}
      />
    </View>
  );
}

export function BudgetRow({
  view,
  onPress,
}: {
  view: CategoryBudget;
  onPress?: () => void;
}) {
  const { colors, spacing, radius, typography, categoryColor } = useTheme();
  const { category } = view;

  const amounts = view.capped
    ? `${formatMoney(view.spentMinor)} of ${formatMoney(view.capMinor)}`
    : formatMoney(view.spentMinor);
  const accessibilityLabel = view.capped
    ? `${category.name}, ${amounts}, ${formatPercent(view.percent)}` +
      (view.overMinor > 0 ? `, ${formatMoney(view.overMinor)} over` : '')
    : `${category.name}, ${amounts}, tracked only`;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{ paddingVertical: spacing.sm }}
    >
      <View style={styles.heading}>
        <View
          style={[
            styles.icon,
            { backgroundColor: categoryColor(category.color), borderRadius: radius.sm },
          ]}
        >
          <Ionicons name={ioniconFor(category.icon)} size={14} color="#FFFFFF" />
        </View>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            marginLeft: spacing.sm,
            fontFamily: typography.fontFamily.medium,
            fontSize: typography.size.body,
            color: colors.textPrimary,
          }}
        >
          {category.name}
        </Text>
        <Text
          style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.caption,
            color: colors.textSecondary,
          }}
        >
          {amounts}
        </Text>
      </View>

      {view.capped && (
        <View style={{ marginTop: spacing.xs }}>
          <BudgetBar percent={view.percent} />
          <View style={[styles.footer, { marginTop: spacing.xs }]}>
            <Text
              style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.caption,
                color: budgetTone(colors, view.percent),
              }}
            >
              {formatPercent(view.percent)}
            </Text>
            <Text
              style={{
                fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.caption,
                color: view.overMinor > 0 ? colors.danger : colors.textMuted,
              }}
            >
              {view.overMinor > 0
                ? `${formatMoney(view.overMinor)} over`
                : `${formatMoney(view.remainingMinor)} left`}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  track: { height: 8, width: '100%', overflow: 'hidden' },
  fill: { height: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
