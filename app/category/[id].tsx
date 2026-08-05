// Category detail (T5) — the overlay behind every budget row: this Cycle's
// spend, cap and percent, a pace sentence, the cap editor, and the category's
// entries for the Cycle.
//
// Presented as a modal over whichever screen opened it (Home or Insights), so a
// user checking a category never loses their place. It is the one screen where a
// cap is set, changed or cleared.

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MAX_AMOUNT_MINOR } from '../../src/core';
import { GradientBackground } from '../../src/ui/GradientBackground';
import { BudgetBar, budgetTone } from '../../src/ui/BudgetRow';
import { ioniconFor } from '../../src/ui/categoryIcon';
import { EmptyExpenses, ExpenseList } from '../../src/ui/ExpenseList';
import {
  CURRENCY_SYMBOL,
  formatAmount,
  formatCycleRange,
  formatMoney,
  formatPaceSentence,
  formatPercent,
} from '../../src/ui/format';
import { useTheme } from '../../src/design/theme';
import { useBudgets } from '../../src/store/budgetContext';
import { useExpenses } from '../../src/store/expenseContext';
import { useSettings } from '../../src/store/settingsContext';

/**
 * The cap the user is typing, as whole minor units.
 *
 * Digits are *accumulated*, never parsed out of a decimal string: typing 2‑5‑0
 * walks 2 → 25 → 250 sen, so no fractional ringgit ever exists to be rounded
 * (ADR-0006). It is the same accumulation QuickAdd's keypad does, driven by a
 * plain field instead of a grid of keys.
 */
function accumulate(text: string, current: number): number {
  const digits = text.replace(/\D/g, '');
  const next = Number(digits);
  // Past the ceiling the extra digit simply doesn't register, as in QuickAdd.
  return Number.isSafeInteger(next) && next <= MAX_AMOUNT_MINOR ? next : current;
}

/** Set, change or clear this category's cap. */
function CapEditor({ categoryId, capMinor }: { categoryId: string; capMinor: number | null }) {
  const { colors, radius, spacing, typography } = useTheme();
  const { setCap, clearCap } = useBudgets();
  const [draftMinor, setDraftMinor] = useState(capMinor ?? 0);

  const save = () => {
    if (draftMinor > 0) {
      setCap(categoryId, draftMinor);
    }
  };

  return (
    <View>
      <Text
        style={{
          marginBottom: spacing.sm,
          fontFamily: typography.fontFamily.semibold,
          fontSize: typography.size.label,
          color: colors.textPrimary,
        }}
      >
        {capMinor === null ? 'Set a cap' : 'Cap this Cycle'}
      </Text>

      <View style={[styles.capRow, { gap: spacing.sm }]}>
        <View
          style={[
            styles.capField,
            { backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.xs },
          ]}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.medium,
              fontSize: typography.size.body,
              color: colors.textMuted,
            }}
          >
            {CURRENCY_SYMBOL}
          </Text>
          <TextInput
            value={draftMinor === 0 ? '' : formatAmount(draftMinor)}
            onChangeText={(text) => setDraftMinor((current) => accumulate(text, current))}
            onSubmitEditing={save}
            keyboardType="number-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Cap amount"
            style={{
              flex: 1,
              fontFamily: typography.fontFamily.medium,
              fontSize: typography.size.label,
              color: colors.textPrimary,
            }}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save cap"
          accessibilityState={{ disabled: draftMinor === 0 }}
          disabled={draftMinor === 0}
          onPress={save}
          style={[
            styles.capButton,
            {
              backgroundColor: draftMinor === 0 ? colors.border : colors.accent,
              borderRadius: radius.md,
              paddingHorizontal: spacing.lg,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.semibold,
              fontSize: typography.size.body,
              color: draftMinor === 0 ? colors.textMuted : colors.onAccent,
            }}
          >
            Save
          </Text>
        </Pressable>
      </View>

      {capMinor !== null && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear cap"
          accessibilityHint="Removes the cap and tracks this category without a limit"
          onPress={() => {
            clearCap(categoryId);
            setDraftMinor(0);
          }}
          style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
          hitSlop={8}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.medium,
              fontSize: typography.size.body,
              color: colors.danger,
            }}
          >
            Clear cap
          </Text>
        </Pressable>
      )}

      <Text
        style={{
          marginTop: spacing.sm,
          fontFamily: typography.fontFamily.regular,
          fontSize: typography.size.caption,
          color: colors.textMuted,
        }}
      >
        A cap resets in full each Cycle. Clearing it keeps the spending tracked,
        without a limit.
      </Text>
    </View>
  );
}

export default function CategoryDetailScreen() {
  const { colors, radius, spacing, typography, elevation, categoryColor } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { viewFor } = useBudgets();
  const { inCycleByCategory } = useExpenses();
  const { cycle, daysRemaining } = useSettings();

  const view = id ? viewFor(id) : undefined;

  // The category can vanish underneath this screen — archived from Categories
  // while the overlay is open, or a stale deep link. Say so rather than crash.
  if (!view) {
    return (
      <GradientBackground>
        <SafeAreaView style={[styles.fill, styles.center, { padding: spacing.xl }]}>
          <Text
            style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.body,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            That category is no longer on this Cycle's dashboard.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
            <Text
              style={{
                marginTop: spacing.lg,
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.size.body,
                color: colors.accent,
              }}
            >
              Close
            </Text>
          </Pressable>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const { category, spentMinor } = view;
  const entries = inCycleByCategory(cycle, category.id);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.fill}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Pressable accessibilityLabel="Close" onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-down" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size.title,
              color: colors.textPrimary,
            }}
          >
            {category.name}
          </Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
          <View
            style={[
              elevation.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                padding: spacing.xl,
              },
            ]}
          >
            <View style={styles.headline}>
              <View
                style={[
                  styles.icon,
                  { backgroundColor: categoryColor(category.color), borderRadius: radius.md },
                ]}
              >
                <Ionicons name={ioniconFor(category.icon)} size={16} color="#FFFFFF" />
              </View>
              <Text
                style={{
                  marginLeft: spacing.sm,
                  fontFamily: typography.fontFamily.medium,
                  fontSize: typography.size.caption,
                  letterSpacing: 1,
                  color: colors.textMuted,
                }}
              >
                THIS CYCLE
              </Text>
            </View>

            <Text
              accessibilityLabel={
                view.capped
                  ? `${formatMoney(spentMinor)} of ${formatMoney(view.capMinor)}, ${formatPercent(view.percent)}`
                  : `${formatMoney(spentMinor)} spent, tracked only`
              }
              style={{
                marginTop: spacing.xs,
                fontFamily: typography.fontFamily.bold,
                fontSize: typography.size.display,
                lineHeight: typography.lineHeight.display,
                color: colors.textPrimary,
              }}
            >
              {formatMoney(spentMinor)}
            </Text>

            {view.capped ? (
              <Text
                style={{
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.size.caption,
                  color: colors.textMuted,
                }}
              >
                of {formatMoney(view.capMinor)} ·{' '}
                <Text
                  style={{
                    color: budgetTone(colors, view.percent),
                    fontFamily: typography.fontFamily.medium,
                  }}
                >
                  {formatPercent(view.percent)}
                </Text>
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.size.caption,
                  color: colors.textMuted,
                }}
              >
                {formatCycleRange(cycle)}
              </Text>
            )}

            <Text
              style={{
                marginTop: spacing.md,
                fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.body,
                color: colors.textSecondary,
              }}
            >
              {formatPaceSentence(view, daysRemaining)}
            </Text>

            {view.capped && (
              <View style={{ marginTop: spacing.md }}>
                <BudgetBar percent={view.percent} />
              </View>
            )}
          </View>

          <CapEditor
            categoryId={category.id}
            capMinor={view.capped ? view.capMinor : null}
          />

          <View>
            <Text
              style={{
                marginBottom: spacing.sm,
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.size.label,
                color: colors.textPrimary,
              }}
            >
              Entries this Cycle
            </Text>
            {entries.length === 0 ? <EmptyExpenses /> : <ExpenseList expenses={entries} />}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headline: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  capRow: { flexDirection: 'row', alignItems: 'center' },
  capField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  capButton: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
