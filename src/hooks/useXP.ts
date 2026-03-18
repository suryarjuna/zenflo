import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getUserStats } from '../db/xp';
import { xpProgressInCurrentLevel, getLevelTier } from '../constants/levels';

export function useXP() {
  const stats = useAppStore((s) => s.stats);
  const setStats = useAppStore((s) => s.setStats);
  const pendingXPGains = useAppStore((s) => s.pendingXPGains);
  const clearXPGains = useAppStore((s) => s.clearXPGains);

  const totalXP = stats?.totalXP ?? 0;
  const level = stats?.level ?? 1;
  const tier = getLevelTier(level);
  const progress = xpProgressInCurrentLevel(totalXP);

  const refreshStats = useCallback(async () => {
    const s = await getUserStats();
    setStats(s);
  }, [setStats]);

  return {
    totalXP,
    level,
    tier,
    progress,
    pendingXPGains,
    clearXPGains,
    refreshStats,
  };
}
