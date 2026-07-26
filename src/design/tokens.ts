// "Subtle Gradient" design-system tokens (T1).
//
// Framework-agnostic token values. `theme.tsx` selects the light/dark palette
// and exposes it via context; components read semantic colors from there.

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  size: {
    caption: 12,
    body: 15,
    label: 17,
    title: 22,
    display: 34,
    hero: 44,
  },
  lineHeight: {
    caption: 16,
    body: 22,
    label: 24,
    title: 28,
    display: 40,
    hero: 52,
  },
} as const;

export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  fab: {
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
} as const;

/** Category color tokens referenced by seeded/user categories (see core). */
export const categoryColors = {
  categoryGreen: '#3BA776',
  categoryOrange: '#E4863B',
  categoryBlue: '#3B82C4',
  categoryRed: '#D2534E',
  categoryPurple: '#7C5CD1',
  categoryPink: '#D15C9A',
  categoryGray: '#8A8F98',
  categoryBrown: '#9A6B4E',
} as const;

export type CategoryColorToken = keyof typeof categoryColors;

interface Palette {
  /** Two-stop background gradient — the "subtle gradient" signature. */
  gradient: readonly [string, string];
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentGradient: readonly [string, string];
  success: string;
  warning: string;
  danger: string;
  onAccent: string;
}

export const lightPalette: Palette = {
  gradient: ['#F7F6FB', '#EFF1F9'],
  background: '#F5F5FA',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border: '#E7E7EE',
  textPrimary: '#1B1B26',
  textSecondary: '#54566A',
  textMuted: '#9A9CAD',
  accent: '#6C5CE7',
  accentGradient: ['#7C6CF0', '#5A48D6'],
  success: '#3BA776',
  warning: '#E4863B',
  danger: '#D2534E',
  onAccent: '#FFFFFF',
};

export const darkPalette: Palette = {
  gradient: ['#16161E', '#1C1D28'],
  background: '#111119',
  surface: '#1B1C26',
  surfaceRaised: '#23242F',
  border: '#2C2D3A',
  textPrimary: '#F3F3F8',
  textSecondary: '#B4B6C6',
  textMuted: '#6E7080',
  accent: '#8B7CFF',
  accentGradient: ['#9A8CFF', '#6C5CE7'],
  success: '#4FBE8A',
  warning: '#EE9A55',
  danger: '#E2665F',
  onAccent: '#FFFFFF',
};

export type { Palette };
