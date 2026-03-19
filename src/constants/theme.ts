// Zenflo Design System
// Supports dark (default) and light (orange) themes

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// ---------- Color Definitions ----------

export const DarkColors = {
  background: {
    primary:   '#0F0E17',
    secondary: '#1A1929',
    tertiary:  '#252438',
    elevated:  '#2D2C45',
  },
  accent:      '#E8853D',
  accentMuted: '#C4693A',
  accentLight: '#E8853D20',
  surface: {
    warm:     '#2A2234',
    warmLight:'#342A3E',
  },
  monk: {
    primary:    '#A78BFA',
    background: '#0D0C1A',
    text:       '#E8E3FF',
  },
  athlete: {
    primary:    '#E8853D',
    background: '#1A1308',
    text:       '#FFF0E5',
  },
  pilot: {
    primary:    '#0D9488',
    background: '#051A18',
    text:       '#E0F7F5',
  },
  success: '#22C55E',
  warning: '#EAB308',
  danger:  '#EF4444',
  xp:      '#FBBF24',
  text: {
    primary:   '#F4F3FF',
    secondary: '#9B99C5',
    tertiary:  '#5C5A80',
    inverse:   '#0F0E17',
  },
  border: {
    subtle:  'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.12)',
    strong:  'rgba(255,255,255,0.24)',
  },
  streakFire:   '#E8853D',
  streakGold:   '#FFD700',
  streakFrozen: '#60A5FA',
};

export const LightColors: ThemeColors = {
  background: {
    primary:   '#FBF8F5',
    secondary: '#F3EFE9',
    tertiary:  '#E8E3DC',
    elevated:  '#FFFFFF',
  },
  accent:      '#E8853D',
  accentMuted: '#C4693A',
  accentLight: '#E8853D15',
  surface: {
    warm:     '#FFF5EC',
    warmLight:'#FFF9F3',
  },
  monk: {
    primary:    '#7C3AED',
    background: '#F5F0FF',
    text:       '#2D1B69',
  },
  athlete: {
    primary:    '#E8853D',
    background: '#FFF5EC',
    text:       '#5C3A1A',
  },
  pilot: {
    primary:    '#0D9488',
    background: '#F0FDFB',
    text:       '#0A4A44',
  },
  success: '#16A34A',
  warning: '#CA8A04',
  danger:  '#DC2626',
  xp:      '#D97706',
  text: {
    primary:   '#1A1929',
    secondary: '#5C5A80',
    tertiary:  '#9B99C5',
    inverse:   '#FFFFFF',
  },
  border: {
    subtle:  'rgba(0,0,0,0.04)',
    default: 'rgba(0,0,0,0.08)',
    strong:  'rgba(0,0,0,0.16)',
  },
  streakFire:   '#E8853D',
  streakGold:   '#D97706',
  streakFrozen: '#3B82F6',
};

export type ThemeColors = typeof DarkColors;
export type ThemeMode = 'dark' | 'light';

// ---------- Theme Store ----------

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'dark',
  colors: DarkColors,
  setMode: (mode) => set({ mode, colors: mode === 'dark' ? DarkColors : LightColors }),
  toggle: () => set((s) => {
    const next = s.mode === 'dark' ? 'light' : 'dark';
    return { mode: next, colors: next === 'dark' ? DarkColors : LightColors };
  }),
}));

// ---------- Hook ----------

export function useColors(): ThemeColors {
  return useThemeStore((s) => s.colors);
}

export function useThemeMode(): ThemeMode {
  return useThemeStore((s) => s.mode);
}

// ---------- Backwards-compatible static export (for non-component code) ----------

export const Colors = DarkColors;

// ---------- Other Design Tokens ----------

export const Typography = {
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, '2xl': 30, '3xl': 38, '4xl': 48,
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
  black:   '900' as const,
};

export const Spacing = {
  '2xs': 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64,
};

export const Radius = {
  sm: 6, md: 10, lg: 16, xl: 24, '2xl': 32, full: 9999,
};
