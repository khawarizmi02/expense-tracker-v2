import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../src/ui/GradientBackground';
import { useTheme } from '../../src/design/theme';

export default function ProfileScreen() {
  const { colors, radius, spacing, typography } = useTheme();
  const router = useRouter();
  return (
    <GradientBackground>
      <SafeAreaView style={styles.fill}>
        <View style={{ padding: spacing.xl, flex: 1 }}>
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size.display,
              lineHeight: typography.lineHeight.display,
              color: colors.textPrimary,
            }}
          >
            Profile
          </Text>
          <Text
            style={{
              marginTop: spacing.sm,
              marginBottom: spacing.xl,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.body,
              color: colors.textSecondary,
            }}
          >
            Your streaks, badges grid, and settings will live here.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/categories')}
            style={[
              styles.item,
              { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg },
            ]}
          >
            <Ionicons name="pricetags-outline" size={22} color={colors.accent} />
            <Text
              style={{
                flex: 1,
                marginLeft: spacing.md,
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.label,
                color: colors.textPrimary,
              }}
            >
              Manage categories
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center' },
});
