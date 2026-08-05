// The Insights spend ring (T5): capped spend drawn against the total of the
// caps, with the amount spent in the middle.
//
// Drawn as an SVG arc rather than a chart library so it inherits the theme's
// colors and adds no dependency. The sweep clamps at a full circle — a ring
// can't wind past itself — but the number and percent beneath it never do.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../design/theme';
import { budgetTone } from './BudgetRow';
import { formatMoney, formatPercent } from './format';

const SIZE = 180;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SpendRing({
  spentMinor,
  percent,
  caption,
}: {
  spentMinor: number;
  /** Spend as a percent of the total cap; unclamped (may exceed 100). */
  percent: number;
  /** The line under the amount, e.g. "of RM 300.00 capped". */
  caption: string;
}) {
  const { colors, typography } = useTheme();
  const tone = budgetTone(colors, percent);
  const swept = Math.min(Math.max(percent, 0), 100) / 100;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${formatMoney(spentMinor)} spent, ${formatPercent(percent)} ${caption}`}
      style={styles.wrap}
    >
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.border}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={tone}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - swept)}
          // Start the sweep at twelve o'clock instead of three.
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text
          style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: typography.size.display,
            lineHeight: typography.lineHeight.display,
            color: colors.textPrimary,
          }}
        >
          {formatMoney(spentMinor)}
        </Text>
        <Text
          style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.caption,
            color: colors.textMuted,
          }}
        >
          {caption}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
