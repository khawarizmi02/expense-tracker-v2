// Cycle start day setting (T4): change the payday captured at onboarding.
//
// The Cycle is derived from this day, never stored (ADR-0001), so a correction
// here simply re-derives the current Cycle — no historical Expense is touched
// and nothing needs migrating.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../src/ui/GradientBackground';
import { PaydayPicker } from '../src/ui/PaydayPicker';
import { formatCycleRange, formatDaysRemaining } from '../src/ui/format';
import { useTheme } from '../src/design/theme';
import { useSettings } from '../src/store/settingsContext';

export default function CycleStartDayScreen() {
  const { colors, radius, spacing, typography } = useTheme();
  const router = useRouter();
  const { cycleStartDay, cycle, daysRemaining, setCycleStartDay } = useSettings();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text
              style={{
                marginLeft: spacing.sm,
                fontFamily: typography.fontFamily.bold,
                fontSize: typography.size.title,
                lineHeight: typography.lineHeight.title,
                color: colors.textPrimary,
              }}
            >
              Cycle start day
            </Text>
          </View>

          <Text
            style={{
              marginTop: spacing.sm,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.body,
              lineHeight: typography.lineHeight.body,
              color: colors.textSecondary,
            }}
          >
            Budgets reset on this day each month. Right now you're on{' '}
            {formatCycleRange(cycle)} — {formatDaysRemaining(daysRemaining)}.
          </Text>

          <View style={{ marginTop: spacing.lg }}>
            <PaydayPicker value={cycleStartDay} onChange={setCycleStartDay} />
          </View>

          <View
            style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
            }}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.caption,
                lineHeight: typography.lineHeight.caption,
                color: colors.textMuted,
              }}
            >
              Changing this re-draws the current Cycle. Nothing you've logged is
              altered.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
});
