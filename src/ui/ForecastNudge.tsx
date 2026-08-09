// The Forecast nudge (T7) — one card saying where a capped category's Cycle is
// heading, and the daily amount that would keep it under.
//
// The same card on Home, Insights and category detail, so a projection reads the
// same wherever it is met. It is deliberately quieter than an over-budget bar:
// this is money that has *not* been spent yet (CONTEXT.md § Forecast), and a
// nudge that shouted would be indistinguishable from an Alert about real spend.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Forecast } from '../core';
import { useTheme } from '../design/theme';
import { formatForecastHint, formatForecastNudge } from './format';

export function ForecastNudge({
  forecast,
  onPress,
  withHint = true,
}: {
  forecast: Forecast;
  /** Omitted on the category's own detail screen, which is where this leads. */
  onPress?: () => void;
  /**
   * Whether to print the "RM X a day keeps it under" line. Off on category
   * detail, where the pace sentence above already carries that same figure
   * (in both of its shapes) and repeating it reads as two answers to one
   * question.
   */
  withHint?: boolean;
}) {
  const { colors, radius, spacing, typography } = useTheme();
  const headline = formatForecastNudge(forecast);
  const hint = withHint ? formatForecastHint(forecast) : '';
  // A card with nowhere to go is not a button, and shouldn't announce itself as
  // one to a screen reader or flash a press state.
  const Card = onPress ? Pressable : View;

  return (
    <Card
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={hint ? `${headline} ${hint}` : headline}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderLeftColor: colors.warning,
          padding: spacing.md,
          gap: spacing.sm,
        },
      ]}
    >
      <Ionicons name="trending-up" size={18} color={colors.warning} style={styles.icon} />
      <View style={styles.body}>
        <Text
          style={{
            fontFamily: typography.fontFamily.medium,
            fontSize: typography.size.body,
            color: colors.textPrimary,
          }}
        >
          {headline}
        </Text>
        {hint !== '' && (
          <Text
            style={{
              marginTop: spacing.xs / 2,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.caption,
              color: colors.textMuted,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', borderLeftWidth: 3 },
  icon: { marginTop: 2 },
  body: { flex: 1 },
});
