// History (T3): every logged expense, grouped by day with a per-day total,
// newest day first.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../../src/ui/GradientBackground';
import { EmptyExpenses, ExpenseList } from '../../src/ui/ExpenseList';
import { formatDayHeading, formatMoney } from '../../src/ui/format';
import { useTheme } from '../../src/design/theme';
import { useExpenses } from '../../src/store/expenseContext';

export default function HistoryScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { byDay, today } = useExpenses();

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
            History
          </Text>

          {byDay.length === 0 ? (
            <View style={{ marginTop: spacing.sm }}>
              <EmptyExpenses />
            </View>
          ) : (
            byDay.map((group) => (
              <View key={group.day} style={{ marginTop: spacing.lg }}>
                <View style={styles.dayHeading}>
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.semibold,
                      fontSize: typography.size.body,
                      color: colors.textPrimary,
                    }}
                  >
                    {formatDayHeading(group.day, today)}
                  </Text>
                  <Text
                    accessibilityLabel={`Total ${formatMoney(group.total)}`}
                    style={{
                      fontFamily: typography.fontFamily.semibold,
                      fontSize: typography.size.body,
                      color: colors.textSecondary,
                    }}
                  >
                    {formatMoney(group.total)}
                  </Text>
                </View>

                <View style={{ marginTop: spacing.xs }}>
                  <ExpenseList expenses={group.expenses} />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  dayHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
