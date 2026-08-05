// Insights (T5): where this Cycle stands against the caps — the spend ring, the
// pace stats beside it, and every category's budget.
//
// Everything here is Cycle-scoped, never a calendar month (ADR-0001), and every
// number comes from `core` through the budget provider so the ring, the bars and
// Home can't drift apart.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GradientBackground } from '../../src/ui/GradientBackground';
import { BudgetRow } from '../../src/ui/BudgetRow';
import { SpendRing } from '../../src/ui/SpendRing';
import { formatCycleRange, formatDaysRemaining, formatMoney } from '../../src/ui/format';
import { useTheme } from '../../src/design/theme';
import { useBudgets } from '../../src/store/budgetContext';
import { useSettings } from '../../src/store/settingsContext';

/** One of the three pace figures under the ring. */
function PaceStat({ label, value }: { label: string; value: string }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={styles.stat}>
      <Text
        accessibilityLabel={`${value} ${label}`}
        style={{
          fontFamily: typography.fontFamily.semibold,
          fontSize: typography.size.body,
          color: colors.textPrimary,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          marginTop: spacing.xs / 2,
          fontFamily: typography.fontFamily.regular,
          fontSize: typography.size.caption,
          color: colors.textMuted,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function InsightsScreen() {
  const { colors, spacing, radius, typography, elevation } = useTheme();
  const router = useRouter();
  const { views, summary } = useBudgets();
  const { cycle } = useSettings();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.fill}>
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            // Clear of the floating ＋ button.
            paddingBottom: spacing.xxxl * 2,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size.title,
              lineHeight: typography.lineHeight.title,
              color: colors.textPrimary,
            }}
          >
            Insights
          </Text>
          <Text
            style={{
              marginBottom: spacing.lg,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.caption,
              color: colors.textMuted,
            }}
          >
            {formatCycleRange(cycle)}
          </Text>

          <View
            style={[
              styles.card,
              elevation.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                padding: spacing.xl,
              },
            ]}
          >
            {/* With nothing capped there is no ring to fill, so it shows the
                Cycle's plain total rather than an empty circle. */}
            <SpendRing
              spentMinor={summary.hasCaps ? summary.cappedSpentMinor : summary.totalSpentMinor}
              percent={summary.percent}
              caption={
                summary.hasCaps
                  ? `of ${formatMoney(summary.totalCapMinor)} capped`
                  : 'spent this Cycle'
              }
            />

            <View
              style={[
                styles.stats,
                {
                  marginTop: spacing.lg,
                  paddingTop: spacing.lg,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <PaceStat
                label={summary.overMinor > 0 ? 'over the caps' : 'left this Cycle'}
                value={formatMoney(
                  summary.overMinor > 0 ? summary.overMinor : summary.remainingMinor,
                )}
              />
              <PaceStat
                label={summary.daysRemaining === 1 ? 'day to go' : 'days to go'}
                value={String(summary.daysRemaining)}
              />
              <PaceStat label="safe per day" value={formatMoney(summary.safePerDayMinor)} />
            </View>

            {!summary.hasCaps && (
              <Text
                style={{
                  marginTop: spacing.md,
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.size.caption,
                  color: colors.textMuted,
                  textAlign: 'center',
                }}
              >
                Nothing is capped yet. Tap a category below to set a cap.
              </Text>
            )}
          </View>

          <Text
            style={{
              marginTop: spacing.xl,
              marginBottom: spacing.xs,
              fontFamily: typography.fontFamily.semibold,
              fontSize: typography.size.label,
              color: colors.textPrimary,
            }}
          >
            Budgets
          </Text>

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
                  router.push({
                    pathname: '/category/[id]',
                    params: { id: view.category.id },
                  })
                }
              />
            ))}
          </View>

          <Text
            style={{
              marginTop: spacing.md,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.caption,
              color: colors.textMuted,
            }}
          >
            Caps reset in full each Cycle — nothing left over rolls forward.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  card: { width: '100%', alignItems: 'center' },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stat: { flex: 1, alignItems: 'center' },
});
