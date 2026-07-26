// Empty placeholder screen shell (T1: screens are placeholders, no features yet).

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from './GradientBackground';
import { useTheme } from '../design/theme';

export function PlaceholderScreen({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const { colors, typography, spacing } = useTheme();
  return (
    <GradientBackground>
      <SafeAreaView style={styles.fill}>
        <View style={[styles.center, { padding: spacing.xl }]}>
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size.display,
              lineHeight: typography.lineHeight.display,
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              marginTop: spacing.sm,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.body,
              lineHeight: typography.lineHeight.body,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {subtitle}
          </Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
