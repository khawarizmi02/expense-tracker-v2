// Home (T3): what was spent today, and what was logged most recently.
//
// The streak and budget rings arrive with T5/T11; this screen is deliberately
// just the two things T3 promises.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../../src/ui/GradientBackground';
import { EmptyExpenses, ExpenseList } from '../../src/ui/ExpenseList';
import { formatMoney } from '../../src/ui/format';
import { useTheme } from '../../src/design/theme';
import { useExpenses } from '../../src/store/expenseContext';

export default function HomeScreen() {
  const { colors, spacing, radius, typography, elevation } = useTheme();
  const { spentOn, recent, today } = useExpenses();
  const spentToday = spentOn(today);

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
            <Text
              style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.caption,
                letterSpacing: 1,
                color: colors.textMuted,
              }}
            >
              SPENT TODAY
            </Text>
            <Text
              accessibilityLabel={`Spent today ${formatMoney(spentToday)}`}
              style={{
                marginTop: spacing.xs,
                fontFamily: typography.fontFamily.bold,
                fontSize: typography.size.display,
                lineHeight: typography.lineHeight.display,
                color: colors.textPrimary,
              }}
            >
              {formatMoney(spentToday)}
            </Text>
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
});
