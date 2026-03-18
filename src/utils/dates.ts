import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, isSunday } from 'date-fns';

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function getWeekStart(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function getWeekEnd(date: Date = new Date()): string {
  return format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function isDateInCurrentWeek(dateStr: string): boolean {
  const date = parseISO(dateStr);
  const now = new Date();
  return isWithinInterval(date, {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  });
}

export function isTodaySunday(): boolean {
  return isSunday(new Date());
}

export function formatDate(dateStr: string, fmt: string = 'MMM d, yyyy'): string {
  return format(parseISO(dateStr), fmt);
}

export function daysUntilSunday(): number {
  const day = new Date().getDay();
  return day === 0 ? 0 : 7 - day;
}
