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
import { MINOR_UNITS_PER_MAJOR } from '../../src/core';
import { GradientBackground } from '../../src/ui/GradientBackground';
import { BudgetBar, budgetTone } from '../../src/ui/BudgetRow';
import { ioniconFor } from '../../src/ui/categoryIcon';
import { EmptyExpenses, ExpenseList } from '../../src/ui/ExpenseList';
import {
  CURRENCY_SYMBOL,
  formatCycleRange,
  formatMoney,
  formatPaceSentence,
  formatPercent,
} from '../../src/ui/format';
import { useTheme } from '../../src/design/theme';
import { useBudgets } from '../../src/store/budgetContext';
import { useExpenses } from '../../src/store/expenseContext';
import { useSettings } from '../../src/store/settingsContext';

/** The same ceiling QuickAdd puts on an amount: RM 99,999.99. */
const MAX_CAP_MINOR = 9_999_999;

/** Parse a typed major-unit cap ("250", "250.50") into minor units. */
function parseCapMinor(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  // Round rather than truncate: floats can't hold 250.55 exactly, and a cap the
  // user typed should be the cap they get.
  const minor = Math.round(Number(trimmed) * MINOR_UNITS_PER_MAJOR);
  if (minor <= 0 || minor > MAX_CAP_MINOR) {
    return null;
  }
  return minor;
}

/** Set, change or clear this category's cap. */
function CapEditor({ categoryId, capMinor }: { categoryId: string; capMinor: number | null }) {
  const { colors, radius, spacing, typography } = useTheme();
  const { setCap, clearCap } = useBudgets();
  const [draft, setDraft] = useState(
    capMinor === null ? '' : String(capMinor / MINOR_UNITS_PER_MAJOR),
  );

  const parsed = parseCapMinor(draft);
  const save = () => {
    if (parsed !== null) {
      setCap(categoryId, parsed);
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
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={save}
            keyboardType="decimal-pad"
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
          accessibilityState={{ disabled: parsed === null }}
          disabled={parsed === null}
          onPress={save}
          style={[
            styles.capButton,
            {
              backgroundColor: parsed === null ? colors.border : colors.accent,
              borderRadius: radius.md,
              paddingHorizontal: spacing.lg,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.semibold,
              fontSize: typography.size.body,
              color: parsed === null ? colors.textMuted : colors.onAccent,
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
            setDraft('');
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

  const { category, capped, spentMinor, capMinor, percent } = view;
  const entries = inCycleByCategory(cycle, category.id);
  const tone = budgetTone(colors, percent);

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
                capped
                  ? `${formatMoney(spentMinor)} of ${formatMoney(capMinor ?? 0)}, ${formatPercent(percent)}`
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

            {capped ? (
              <Text
                style={{
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.size.caption,
                  color: colors.textMuted,
                }}
              >
                of {formatMoney(capMinor ?? 0)} ·{' '}
                <Text style={{ color: tone, fontFamily: typography.fontFamily.medium }}>
                  {formatPercent(percent)}
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

            {capped && (
              <View style={{ marginTop: spacing.md }}>
                <BudgetBar percent={percent} tone={tone} />
              </View>
            )}
          </View>

          <CapEditor categoryId={category.id} capMinor={capMinor} />

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
