// Four-tab bottom navigation (Home · Insights · History · Profile) with a
// center ＋ Add button that opens the QuickAdd modal from any tab.

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/design/theme';

function AddButton() {
  const { colors, elevation } = useTheme();
  const router = useRouter();
  return (
    <View style={styles.addWrap} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        onPress={() => router.push('/quick-add')}
        style={styles.addPressable}
      >
        <LinearGradient
          colors={[colors.accentGradient[0], colors.accentGradient[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.addButton, elevation.fab]}
        >
          <Ionicons name="add" size={30} color={colors.onAccent} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, typography } = useTheme();
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: {
            fontFamily: typography.fontFamily.medium,
            fontSize: typography.size.caption,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
      <AddButton />
    </>
  );
}

const styles = StyleSheet.create({
  addWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 34,
    alignItems: 'center',
  },
  addPressable: { alignItems: 'center', justifyContent: 'center' },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
