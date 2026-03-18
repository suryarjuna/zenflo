export const LevelTiers = [
  { min: 1,  max: 4,   name: 'Initiate',     color: '#9CA3AF' },
  { min: 5,  max: 9,   name: 'Practitioner', color: '#60A5FA' },
  { min: 10, max: 14,  name: 'Monk',         color: '#A78BFA' },
  { min: 15, max: 19,  name: 'Athlete',      color: '#F97316' },
  { min: 20, max: 29,  name: 'Pilot',        color: '#0D9488' },
  { min: 30, max: 39,  name: 'Navigator',    color: '#22C55E' },
  { min: 40, max: 49,  name: 'Architect',    color: '#FBBF24' },
  { min: 50, max: 999, name: 'Zenmaster',    color: '#6C63FF' },
];

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * ((1.2 ** (level - 1) - 1) / 0.2));
}

export function levelFromXP(totalXP: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) level++;
  return level;
}

export function getLevelTier(level: number) {
  return LevelTiers.find(t => level >= t.min && level <= t.max) ?? LevelTiers[0];
}

export function xpProgressInCurrentLevel(totalXP: number) {
  const level = levelFromXP(totalXP);
  const current = totalXP - xpForLevel(level);
  const required = xpForLevel(level + 1) - xpForLevel(level);
  return { current, required, percent: current / required };
}
