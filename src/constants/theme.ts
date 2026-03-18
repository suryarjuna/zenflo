// Zenflo Design System
// Inspired by warm, mindful aesthetics with the orange meditation logo accent

export const Colors = {
  // Dark theme (default)
  background: {
    primary:   '#0F0E17',
    secondary: '#1A1929',
    tertiary:  '#252438',
    elevated:  '#2D2C45',
  },
  // Brand accent — matches the Zenflo logo orange
  accent:      '#E8853D',
  accentMuted: '#C4693A',
  accentLight: '#E8853D20',
  // Warm surface colors for cards
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
