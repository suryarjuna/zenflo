export type Mode = 'monk' | 'athlete' | 'pilot';

export const Modes = {
  monk: {
    id: 'monk' as Mode,
    label: 'Monk Mode',
    tagline: 'Focus. One task. Silence.',
    primaryColor: '#A78BFA',
    backgroundColor: '#0D0C1A',
    tabIcon: 'moon',
  },
  athlete: {
    id: 'athlete' as Mode,
    label: 'Athlete Mode',
    tagline: 'Build. Streak. Momentum.',
    primaryColor: '#F97316',
    backgroundColor: '#1A0F05',
    tabIcon: 'flame',
  },
  pilot: {
    id: 'pilot' as Mode,
    label: 'Pilot Mode',
    tagline: 'Plan. Review. Command.',
    primaryColor: '#0D9488',
    backgroundColor: '#051A18',
    tabIcon: 'compass',
  },
};
