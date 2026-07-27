// QuickAdd (T3) — reachable from the center ＋ button on any tab. Logs a manual
// Expense: keypad amount, category, optional merchant/note, and a date that may
// be back-dated (defaults to today).
//
// Later tickets add the OCR and recurring capture paths alongside this one.

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../src/ui/GradientBackground';
import { DayPicker } from '../src/ui/DayPicker';
import { ioniconFor } from '../src/ui/categoryIcon';
import { formatDayHeading, formatMoney } from '../src/ui/format';
import { useTheme } from '../src/design/theme';
import { useCategories } from '../src/store/categoryContext';
import { useExpenses } from '../src/store/expenseContext';

/**
 * Keypad digits accumulate as minor units, so RM 99,999.99 is the ceiling.
 * Capping input beats validating it after the fact: the extra key simply
 * doesn't register.
 */
const MAX_AMOUNT_MINOR = 9_999_999;

/** The keypad, row-major. `00` is the shortcut for whole-ringgit amounts. */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'backspace'] as const;

export default function QuickAddModal() {
  const { colors, typography, spacing, radius, elevation, categoryColor } = useTheme();
  const router = useRouter();
  const { activeCategories } = useCategories();
  const { log, today } = useExpenses();

  const [amountMinor, setAmountMinor] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [day, setDay] = useState(today);
  const [showPicker, setShowPicker] = useState(false);

  const canSave = amountMinor > 0 && categoryId !== null;
  const dayLabel = useMemo(() => formatDayHeading(day, today), [day, today]);

  const press = (key: (typeof KEYS)[number]) => {
    if (key === 'backspace') {
      setAmountMinor((current) => Math.floor(current / 10));
      return;
    }
    setAmountMinor((current) => {
      const next = Number(`${current}${key}`);
      return next > MAX_AMOUNT_MINOR ? current : next;
    });
  };

  const save = () => {
    if (!canSave) {
      return;
    }
    log({ amountMinor, categoryId, merchant, note, day, source: 'manual' });
    router.back();
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.fill}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={[
              styles.close,
              { backgroundColor: colors.surface, borderRadius: radius.pill },
            ]}
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Date: ${dayLabel}. Tap to change.`}
            onPress={() => setShowPicker((open) => !open)}
            style={[
              styles.dayChip,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text
              style={{
                marginLeft: spacing.xs,
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.caption,
                color: colors.textSecondary,
              }}
            >
              {dayLabel}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            accessibilityLabel={`Amount ${formatMoney(amountMinor)}`}
            style={{
              textAlign: 'center',
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size.hero,
              lineHeight: typography.lineHeight.hero,
              color: amountMinor > 0 ? colors.textPrimary : colors.textMuted,
            }}
          >
            {formatMoney(amountMinor)}
          </Text>

          {showPicker && (
            <View style={{ marginTop: spacing.md }}>
              <DayPicker
                value={day}
                maxDay={today}
                onChange={(next) => {
                  setDay(next);
                  setShowPicker(false);
                }}
              />
            </View>
          )}

          <Text
            style={[
              styles.sectionLabel,
              {
                marginTop: spacing.lg,
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.caption,
                color: colors.textMuted,
              },
            ]}
          >
            CATEGORY
          </Text>
          <View style={styles.chips}>
            {activeCategories.map((category) => {
              const selected = category.id === categoryId;
              const tint = categoryColor(category.color);
              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={category.name}
                  onPress={() => setCategoryId(category.id)}
                  style={[
                    styles.chip,
                    {
                      borderRadius: radius.pill,
                      borderColor: selected ? tint : colors.border,
                      backgroundColor: selected ? tint : colors.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name={ioniconFor(category.icon)}
                    size={15}
                    color={selected ? colors.onAccent : tint}
                  />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontFamily: typography.fontFamily.medium,
                      fontSize: typography.size.caption,
                      color: selected ? colors.onAccent : colors.textPrimary,
                    }}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Merchant (optional)"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Merchant"
            style={[
              styles.input,
              {
                marginTop: spacing.lg,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: spacing.md,
                fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.body,
                color: colors.textPrimary,
              },
            ]}
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Note (optional)"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Note"
            style={[
              styles.input,
              {
                marginTop: spacing.sm,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: spacing.md,
                fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.body,
                color: colors.textPrimary,
              },
            ]}
          />

          <View style={[styles.keypad, { marginTop: spacing.lg }]}>
            {KEYS.map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === 'backspace' ? 'Delete' : key}
                onPress={() => press(key)}
                style={styles.key}
              >
                {key === 'backspace' ? (
                  <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
                ) : (
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.medium,
                      fontSize: typography.size.title,
                      color: colors.textPrimary,
                    }}
                  >
                    {key}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save expense"
            accessibilityState={{ disabled: !canSave }}
            disabled={!canSave}
            onPress={save}
            style={[
              styles.save,
              elevation.card,
              {
                marginTop: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: canSave ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.size.label,
                color: canSave ? colors.onAccent : colors.textMuted,
              }}
            >
              Save
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dayChip: { flexDirection: 'row', alignItems: 'center', height: 36 },
  sectionLabel: { letterSpacing: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: { width: '100%' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap' },
  key: {
    width: `${100 / 3}%`,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  save: { height: 52, alignItems: 'center', justifyContent: 'center' },
});
