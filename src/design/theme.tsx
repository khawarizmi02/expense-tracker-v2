// Theme provider: selects the light/dark "Subtle Gradient" palette from the OS
// color scheme and exposes it (plus the static token scales) via context.

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  categoryColors,
  darkPalette,
  elevation,
  lightPalette,
  radius,
  spacing,
  typography,
  type CategoryColorToken,
  type Palette,
} from './tokens';

export interface Theme {
  scheme: 'light' | 'dark';
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  elevation: typeof elevation;
  categoryColor: (token: string) => string;
}

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(scheme: 'light' | 'dark'): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkPalette : lightPalette,
    spacing,
    radius,
    typography,
    elevation,
    categoryColor: (token: string) =>
      categoryColors[token as CategoryColorToken] ?? categoryColors.categoryGray,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = useMemo(() => buildTheme(scheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
