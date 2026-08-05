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

/** The 80% and 100% marks the app warns at (spec § Alert), as a color cue. */
const WARNING_PERCENT = 80;

/**
 * The color a bar and its percent read in: calm below 80% of the cap, warning as
 * it approaches, danger once past it. The same two thresholds the push Alerts
 * use (T7), so the screen and the notification never disagree.
 */
export function budgetTone(colors: Theme['colors'], percent: number): string {
  if (percent >= 100) {
    return colors.danger;
  }
  if (percent >= WARNING_PERCENT) {
    return colors.warning;
  }
  return colors.success;
}

/**
 * The filled track of a capped category's bar. Also used on its own by the
 * category detail overlay, which prints its own numbers around it.
 */
export function BudgetBar({ percent, tone }: { percent: number; tone?: string }) {
  const { colors, radius } = useTheme();
  const color = tone ?? budgetTone(colors, percent);
  // The *width* clamps at full — a bar can't overflow its track — while the
  // label above it still prints the real percent.
  const filled = Math.min(percent, 100);
  return (
    <View
      style={[styles.track, { backgroundColor: colors.border, borderRadius: radius.pill }]}
    >
      <View
        style={[
          styles.fill,
          { width: `${filled}%`, backgroundColor: color, borderRadius: radius.pill },
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
  const { category, capped, spentMinor, capMinor, percent, overMinor } = view;
  const tone = budgetTone(colors, percent);

  const amounts = capped
    ? `${formatMoney(spentMinor)} of ${formatMoney(capMinor ?? 0)}`
    : formatMoney(spentMinor);
  const accessibilityLabel = capped
    ? `${category.name}, ${amounts}, ${formatPercent(percent)}` +
      (overMinor > 0 ? `, ${formatMoney(overMinor)} over` : '')
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

      {capped && (
        <View style={{ marginTop: spacing.xs }}>
          <BudgetBar percent={percent} tone={tone} />
          <View style={[styles.footer, { marginTop: spacing.xs }]}>
            <Text
              style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.caption,
                color: tone,
              }}
            >
              {formatPercent(percent)}
            </Text>
            <Text
              style={{
                fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.caption,
                color: overMinor > 0 ? colors.danger : colors.textMuted,
              }}
            >
              {overMinor > 0
                ? `${formatMoney(overMinor)} over`
                : `${formatMoney(view.remainingMinor ?? 0)} left`}
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
