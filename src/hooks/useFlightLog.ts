import { useCallback, useState } from 'react';
import { canSubmitFlightLog, getFlightLogData, submitFlightLog, getAllFlightLogs } from '../db/flight-logs';
import { getUserStats } from '../db/xp';
import { useAppStore } from '../store/useAppStore';
import type { FlightLog } from '../types';

export function useFlightLog() {
  const setStats = useAppStore((s) => s.setStats);
  const addXPGain = useAppStore((s) => s.addXPGain);
  const setLevelUp = useAppStore((s) => s.setLevelUp);

  const checkCanSubmit = useCallback(async () => {
    return canSubmitFlightLog();
  }, []);

  const getData = useCallback(async () => {
    return getFlightLogData();
  }, []);

  const submit = useCallback(async (data: { bestMoment: string; courseCorrection: string }) => {
    const log = await submitFlightLog(data);
    addXPGain(30);
    const stats = await getUserStats();
    setStats(stats);
    if (stats.level > (useAppStore.getState().stats?.level ?? 1)) {
      setLevelUp(stats.level);
    }
    return log;
  }, [addXPGain, setStats, setLevelUp]);

  const getAll = useCallback(async () => {
    return getAllFlightLogs();
  }, []);

  return { checkCanSubmit, getData, submit, getAll };
}
