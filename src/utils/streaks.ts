import { parseISO, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';

export function calculateStreak(sortedDatesDesc: string[]): number {
  if (!sortedDatesDesc.length) return 0;
  const dates = sortedDatesDesc.map(d => parseISO(d));
  if (!isToday(dates[0]) && !isYesterday(dates[0])) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(dates[i - 1], dates[i]);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function isStreakAtRisk(lastCompletedDate?: string): boolean {
  if (!lastCompletedDate) return false;
  return isYesterday(parseISO(lastCompletedDate));
}

export const STREAK_MILESTONES = [7, 14, 21, 30, 60, 100, 150, 200, 365];

export function streakBonusXP(streak: number): number {
  const bonuses: Record<number, number> = {
    7: 50, 14: 30, 21: 50, 30: 75, 60: 100, 100: 200, 150: 250, 200: 300, 365: 500,
  };
  return bonuses[streak] ?? 0;
}
