// Categories management (T2): list active categories, add, rename, re-icon /
// recolor, and archive (delete = archive, never destroy). All operations go
// through the pure `core` functions via the CategoryProvider.

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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../src/ui/GradientBackground';
import { ioniconFor, ICON_CHOICES } from '../src/ui/categoryIcon';
import { useTheme } from '../src/design/theme';
import { categoryColors } from '../src/design/tokens';
import { useCategories } from '../src/store/categoryContext';
import type { Category } from '../src/core';

const COLOR_TOKENS = Object.keys(categoryColors);

function nextIn(list: string[], current: string): string {
  const i = list.indexOf(current);
  return list[(i + 1) % list.length] ?? list[0];
}

function CategoryRow({ category }: { category: Category }) {
  const { colors, radius, spacing, typography, categoryColor } = useTheme();
  const { rename, reIcon, archive } = useCategories();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
      ]}
    >
      <Pressable
        accessibilityLabel={`Recolor ${category.name}`}
        onPress={() => reIcon(category.id, { color: nextIn(COLOR_TOKENS, category.color) })}
        onLongPress={() => reIcon(category.id, { icon: nextIn(ICON_CHOICES, category.icon) })}
        style={[styles.swatch, { backgroundColor: categoryColor(category.color) }]}
      >
        <Ionicons name={ioniconFor(category.icon)} size={18} color="#FFFFFF" />
      </Pressable>

      {editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          autoFocus
          onSubmitEditing={() => {
            rename(category.id, draft);
            setEditing(false);
          }}
          onBlur={() => {
            rename(category.id, draft.trim() || category.name);
            setEditing(false);
          }}
          style={[
            styles.name,
            { color: colors.textPrimary, fontFamily: typography.fontFamily.medium },
          ]}
        />
      ) : (
        <Pressable style={styles.nameWrap} onPress={() => setEditing(true)}>
          <Text
            style={[
              styles.name,
              { color: colors.textPrimary, fontFamily: typography.fontFamily.medium },
            ]}
          >
            {category.name}
          </Text>
        </Pressable>
      )}

      <Pressable
        accessibilityLabel={`Archive ${category.name}`}
        onPress={() => archive(category.id)}
        hitSlop={8}
      >
        <Ionicons name="archive-outline" size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

export default function CategoriesScreen() {
  const { colors, radius, spacing, typography, categoryColor } = useTheme();
  const router = useRouter();
  const { activeCategories, add } = useCategories();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_TOKENS[0]);
  const [icon, setIcon] = useState(ICON_CHOICES[0]);

  const addCategory = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    add({ name: trimmed, icon, color });
    setName('');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.fill}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size.title,
              color: colors.textPrimary,
            }}
          >
            Categories
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
          <View style={[styles.addRow, { gap: spacing.sm }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="New category"
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={addCategory}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.regular,
                },
              ]}
            />
            <Pressable
              accessibilityLabel="Add category"
              onPress={addCategory}
              style={[styles.addBtn, { backgroundColor: colors.accent, borderRadius: radius.md }]}
            >
              <Ionicons name="add" size={24} color={colors.onAccent} />
            </Pressable>
          </View>

          <View style={[styles.picker, { gap: spacing.sm }]}>
            {COLOR_TOKENS.map((token) => (
              <Pressable
                key={token}
                accessibilityRole="button"
                accessibilityLabel={`Use color ${token}`}
                accessibilityState={{ selected: token === color }}
                onPress={() => setColor(token)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: categoryColor(token) },
                  token === color && { borderColor: colors.textPrimary, borderWidth: 2 },
                ]}
              />
            ))}
          </View>

          <View style={[styles.picker, { gap: spacing.sm }]}>
            {ICON_CHOICES.map((token) => (
              <Pressable
                key={token}
                accessibilityRole="button"
                accessibilityLabel={`Use icon ${token}`}
                accessibilityState={{ selected: token === icon }}
                onPress={() => setIcon(token)}
                style={[
                  styles.iconChoice,
                  {
                    backgroundColor: token === icon ? colors.accent : colors.surface,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Ionicons
                  name={ioniconFor(token)}
                  size={20}
                  color={token === icon ? colors.onAccent : colors.textSecondary}
                />
              </Pressable>
            ))}
          </View>

          {activeCategories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}

          <Text
            style={{
              marginTop: spacing.md,
              color: colors.textMuted,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.caption,
            }}
          >
            Tap a name to rename. Tap the swatch to recolor, long-press to change icon.
            Archiving hides a category but keeps its past expenses.
          </Text>
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
  addRow: { flexDirection: 'row', alignItems: 'center' },
  picker: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  colorSwatch: { width: 32, height: 32, borderRadius: 16 },
  iconChoice: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  addBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nameWrap: { flex: 1 },
  name: { flex: 1, fontSize: 16 },
});
