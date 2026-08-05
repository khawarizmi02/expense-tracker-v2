// Root layout: theme + navigation stack (tab shell + QuickAdd modal).

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '../src/design/theme';
import { StoreProvider } from '../src/store/storeContext';
import { CategoryProvider } from '../src/store/categoryContext';
import { ExpenseProvider } from '../src/store/expenseContext';
import { SettingsProvider, useSettings } from '../src/store/settingsContext';

/**
 * Keep onboarding and the app in sync with whether a payday has been captured:
 * a user who hasn't picked one can't reach the tabs (every Cycle-scoped view
 * would be built on a guess), and one who has can't get stuck on onboarding.
 *
 * Redirecting from an effect rather than rendering a `<Redirect>` because the
 * answer only exists after the encrypted store has been read.
 */
function useOnboardingGate() {
  const { ready, onboarded } = useSettings();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) {
      return;
    }
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboarded && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [ready, onboarded, segments, router]);
}

function RootStack() {
  const { scheme } = useTheme();
  const { ready } = useSettings();
  useOnboardingGate();

  // Hold the first frame until the store has answered: rendering the tabs and
  // then bouncing to onboarding would flash a dashboard with no Cycle behind it.
  if (!ready) {
    return null;
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="quick-add"
          options={{ presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StoreProvider>
            <SettingsProvider>
              <CategoryProvider>
                <ExpenseProvider>
                  <RootStack />
                </ExpenseProvider>
              </CategoryProvider>
            </SettingsProvider>
          </StoreProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
