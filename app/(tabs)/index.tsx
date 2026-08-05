// Home (T3, T4, T5): what was spent this Cycle and today, the budgets closest to
// their cap, and what was logged most recently.
//
// The headline number is Cycle-scoped, never a calendar month (ADR-0001): it
// spans the user's payday-to-payday window and is labelled with that window's
// dates and the days left in it. Only the top few budgets appear here — the full
// list lives on Insights. The streak chip arrives with T11.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GradientBackground } from '../../src/ui/GradientBackground';
import { BudgetRow } from '../../src/ui/BudgetRow';
import { EmptyExpenses, ExpenseList } from '../../src/ui/ExpenseList';
import { formatCycleRange, formatDaysRemaining, formatMoney } from '../../src/ui/format';
import { useTheme } from '../../src/design/theme';
import { useBudgets } from '../../src/store/budgetContext';
import { useExpenses } from '../../src/store/expenseContext';
import { useSettings } from '../../src/store/settingsContext';

export default function HomeScreen() {
  const { colors, spacing, radius, typography, elevation } = useTheme();
  const router = useRouter();
  const { spentOn, spentInCycle, recent, today } = useExpenses();
  const { cycle, daysRemaining } = useSettings();
  const { top } = useBudgets();
  const spentToday = spentOn(today);
  const spentThisCycle = spentInCycle(cycle);

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
            <View style={styles.cycleHeading}>
              <Text
                style={{
                  fontFamily: typography.fontFamily.medium,
                  fontSize: typography.size.caption,
                  letterSpacing: 1,
                  color: colors.textMuted,
                }}
              >
                THIS CYCLE
              </Text>
              <Text
                accessibilityLabel={formatDaysRemaining(daysRemaining)}
                style={{
                  fontFamily: typography.fontFamily.medium,
                  fontSize: typography.size.caption,
                  color: colors.textSecondary,
                }}
              >
                {formatDaysRemaining(daysRemaining)}
              </Text>
            </View>
            <Text
              accessibilityLabel={`Spent this Cycle ${formatMoney(spentThisCycle)}`}
              style={{
                marginTop: spacing.xs,
                fontFamily: typography.fontFamily.bold,
                fontSize: typography.size.display,
                lineHeight: typography.lineHeight.display,
                color: colors.textPrimary,
              }}
            >
              {formatMoney(spentThisCycle)}
            </Text>
            <Text
              style={{
                fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.caption,
                color: colors.textMuted,
              }}
            >
              {formatCycleRange(cycle)}
            </Text>

            <View
              style={[
                styles.todayRow,
                { marginTop: spacing.lg, paddingTop: spacing.md, borderTopColor: colors.border },
              ]}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.size.body,
                  color: colors.textSecondary,
                }}
              >
                Spent today
              </Text>
              <Text
                accessibilityLabel={`Spent today ${formatMoney(spentToday)}`}
                style={{
                  fontFamily: typography.fontFamily.semibold,
                  fontSize: typography.size.body,
                  color: colors.textPrimary,
                }}
              >
                {formatMoney(spentToday)}
              </Text>
            </View>
          </View>

          {top.length > 0 && (
            <>
              <Text
                style={{
                  marginTop: spacing.xl,
                  marginBottom: spacing.xs,
                  fontFamily: typography.fontFamily.semibold,
                  fontSize: typography.size.label,
                  color: colors.textPrimary,
                }}
              >
                Top budgets
              </Text>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                }}
              >
                {top.map((view) => (
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
            </>
          )}

          <Text
            style={{
              marginTop: spacing.xl,
              marginBottom: spacing.xs,
              fontFamily: typography.fontFamily.semibold,
              fontSize: typography.size.label,
              color: colors.textPrimary,
            }}
          >
            Recent
          </Text>

          {recent.length === 0 ? (
            <EmptyExpenses />
          ) : (
            <ExpenseList expenses={recent} />
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  card: { width: '100%' },
  cycleHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
