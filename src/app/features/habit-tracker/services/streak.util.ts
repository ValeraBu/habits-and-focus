import { todayISO } from '../../../shared/utils/date.utils';
import { HabitLog } from '../models/habit-log.model';

export function calculateStreak(habitId: string, logs: HabitLog[]): number {
  const completedDates = new Set(
    logs.filter((log) => log.habitId === habitId && log.completed).map((log) => log.date),
  );

  if (completedDates.size === 0) {
    return 0;
  }

  let cursor = new Date(`${todayISO()}T00:00:00`);
  if (!completedDates.has(formatDate(cursor))) {
    cursor = shiftDay(cursor, -1);
  }

  let streak = 0;
  while (completedDates.has(formatDate(cursor))) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }

  return streak;
}

function shiftDay(date: Date, delta: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + delta);
  return shifted;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
