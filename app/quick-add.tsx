// QuickAdd modal — reachable from the center ＋ button on any tab. Placeholder
// for now (the keypad / category chips / scan flow arrive in later tickets).

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../src/ui/GradientBackground';
import { useTheme } from '../src/design/theme';

export default function QuickAddModal() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  return (
    <GradientBackground>
      <SafeAreaView style={styles.fill}>
        <View style={[styles.header, { padding: spacing.lg }]}>
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
        </View>
        <View style={styles.center}>
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size.title,
              color: colors.textPrimary,
            }}
          >
            Quick Add
          </Text>
          <Text
            style={{
              marginTop: spacing.sm,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.body,
              color: colors.textSecondary,
            }}
          >
            The keypad and category chips will live here.
          </Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { alignItems: 'flex-end' },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
