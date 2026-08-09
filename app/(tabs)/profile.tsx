import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ALERT_THRESHOLDS } from '../../src/core';
import { GradientBackground } from '../../src/ui/GradientBackground';
import { useToast } from '../../src/ui/Toast';
import { formatOrdinalDay, formatPercent } from '../../src/ui/format';
import { useTheme } from '../../src/design/theme';
import { useAlerts } from '../../src/store/alertContext';
import { useSettings } from '../../src/store/settingsContext';

/** "80% and 100%" — the fixed thresholds, named from the core's own list. */
const THRESHOLD_LABEL = ALERT_THRESHOLDS.map((t) => formatPercent(t)).join(' and ');

export default function ProfileScreen() {
  const { colors, radius, spacing, typography } = useTheme();
  const router = useRouter();
  const { cycleStartDay } = useSettings();
  const { notificationsEnabled, enableNotifications } = useAlerts();
  const { show } = useToast();

  // Only the OS can undo a grant, so the row asks once and then explains where
  // the switch lives — it never pretends to a toggle it doesn't own.
  const onAlertsPress = async () => {
    if (notificationsEnabled) {
      show('Alerts are on. Turn them off in your device notification settings.');
      return;
    }
    if (!(await enableNotifications())) {
      show('Notifications are off. Enable them for Kira in your device settings.', 'warning');
    }
  };
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

          <Pressable
            accessibilityRole="button"
            accessibilityHint="Choose the day of the month your budgets reset"
            onPress={() => router.push('/cycle-start-day')}
            style={[
              styles.item,
              {
                marginTop: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: spacing.lg,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={22} color={colors.accent} />
            <Text
              style={{
                flex: 1,
                marginLeft: spacing.md,
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.label,
                color: colors.textPrimary,
              }}
            >
              Cycle start day
            </Text>
            <Text
              style={{
                marginRight: spacing.sm,
                fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.body,
                color: colors.textSecondary,
              }}
            >
              {formatOrdinalDay(cycleStartDay)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityHint={`Kira warns you once at ${THRESHOLD_LABEL} of each category's cap`}
            onPress={onAlertsPress}
            style={[
              styles.item,
              {
                marginTop: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: spacing.lg,
              },
            ]}
          >
            <Ionicons
              name={notificationsEnabled ? 'notifications-outline' : 'notifications-off-outline'}
              size={22}
              color={colors.accent}
            />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text
                style={{
                  fontFamily: typography.fontFamily.medium,
                  fontSize: typography.size.label,
                  color: colors.textPrimary,
                }}
              >
                Over-budget alerts
              </Text>
              <Text
                style={{
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.size.caption,
                  color: colors.textSecondary,
                }}
              >
                {`Once at ${THRESHOLD_LABEL} of a cap, each Cycle`}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.body,
                color: notificationsEnabled ? colors.success : colors.textMuted,
              }}
            >
              {notificationsEnabled ? 'On' : 'Off'}
            </Text>
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
