// Onboarding (T4): the one thing Kira has to ask before it can show a budget —
// when the user gets paid.
//
// Kira's budget window is the payday-aligned Cycle, not the calendar month (see
// ADR-0001), and the Cycle is global: every category's budget resets together on
// this day. Categories are seeded automatically on first run, so this step is
// the whole of onboarding for now; budgets and the first-expense prompt arrive
// with their own tickets.

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GradientBackground } from '../src/ui/GradientBackground';
import { KiraWordmark } from '../src/ui/KiraWordmark';
import { PaydayPicker } from '../src/ui/PaydayPicker';
import { formatCycleRange, formatOrdinalDay } from '../src/ui/format';
import { useTheme } from '../src/design/theme';
import { useSettings } from '../src/store/settingsContext';
import { currentCycle } from '../src/core';

export default function OnboardingScreen() {
  const { colors, radius, spacing, typography, elevation } = useTheme();
  const router = useRouter();
  const { cycleStartDay, today, completeOnboarding } = useSettings();
  const [startDay, setStartDay] = useState(cycleStartDay);

  // Previewing the real boundaries makes an abstract choice concrete — and shows
  // a 29th–31st picker exactly what clamping will do this month.
  const preview = currentCycle(startDay, today);

  const start = () => {
    completeOnboarding(startDay);
    router.replace('/(tabs)');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <KiraWordmark size={32} />

          <Text
            style={{
              marginTop: spacing.xl,
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size.title,
              lineHeight: typography.lineHeight.title,
              color: colors.textPrimary,
            }}
          >
            When do you get paid?
          </Text>
          <Text
            style={{
              marginTop: spacing.sm,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.body,
              lineHeight: typography.lineHeight.body,
              color: colors.textSecondary,
            }}
          >
            Kira budgets from payday to payday, not by calendar month. Your budgets
            reset on this day every month.
          </Text>

          <View style={{ marginTop: spacing.lg }}>
            <PaydayPicker value={startDay} onChange={setStartDay} />
          </View>

          <View
            style={[
              styles.preview,
              elevation.card,
              {
                marginTop: spacing.lg,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
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
              YOUR CYCLE RIGHT NOW
            </Text>
            <Text
              style={{
                marginTop: spacing.xs,
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.size.label,
                color: colors.textPrimary,
              }}
            >
              {formatCycleRange(preview)}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Start tracking, payday the ${formatOrdinalDay(startDay)}`}
            onPress={start}
            style={[
              styles.cta,
              {
                marginTop: spacing.xl,
                backgroundColor: colors.accent,
                borderRadius: radius.pill,
                paddingVertical: spacing.lg,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.size.label,
                color: colors.onAccent,
              }}
            >
              Start tracking
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  preview: { width: '100%' },
  cta: { alignItems: 'center' },
});
