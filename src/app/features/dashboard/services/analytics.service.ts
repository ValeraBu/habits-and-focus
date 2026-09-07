import { Injectable, computed, inject } from '@angular/core';
import { HabitService } from '../../habit-tracker/services/habit.service';
import { calculateStreak } from '../../habit-tracker/services/streak.util';
import { TimerService } from '../../focus-timer/services/timer.service';
import { HeatmapCell, HeatmapLevel, WeekdayCount, Weekday } from '../models/analytics.model';

const WEEKDAY_LABELS: Weekday[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date): Date {
  const monday = new Date(date);
  const mondayOffset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function currentWeekDates(): string[] {
  const monday = startOfWeek(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + index);
    return toISODate(date);
  });
}

function levelFromRatio(ratio: number): HeatmapLevel {
  if (ratio <= 0) return 0;
  if (ratio >= 1) return 4;
  if (ratio <= 1 / 3) return 1;
  if (ratio <= 2 / 3) return 2;
  return 3;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly habitService = inject(HabitService);
  private readonly timerService = inject(TimerService);

  readonly weeklyFocusHours = computed(() => {
    const weekDates = new Set(currentWeekDates());
    const totalMinutes = this.timerService
      .sessions()
      .filter(
        (session) =>
          session.type === 'focus' &&
          !!session.completedAt &&
          weekDates.has(toISODate(new Date(session.completedAt))),
      )
      .reduce((sum, session) => sum + session.durationMinutes, 0);

    return Math.round((totalMinutes / 60) * 10) / 10;
  });

  readonly daysFilledThisWeek = computed(() => {
    const weekDates = currentWeekDates();
    const completedDates = new Set(
      this.habitService
        .logs()
        .filter((log) => log.completed)
        .map((log) => log.date),
    );
    return weekDates.filter((date) => completedDates.has(date)).length;
  });

  readonly bestStreak = computed(() => {
    const logs = this.habitService.logs();
    const habits = this.habitService.activeHabits();
    if (habits.length === 0) {
      return 0;
    }
    return Math.max(...habits.map((habit) => calculateStreak(habit.id, logs)));
  });

  readonly habitsByWeekday = computed<WeekdayCount[]>(() => {
    const weekDates = currentWeekDates();
    const logs = this.habitService.logs();
    return weekDates.map((date, index) => ({
      day: WEEKDAY_LABELS[index],
      count: logs.filter((log) => log.date === date && log.completed).length,
    }));
  });

  activityHeatmap(weeksBack = 10): HeatmapCell[] {
    const totalActive = this.habitService.activeHabits().length;
    const completedCountByDate = new Map<string, number>();
    for (const log of this.habitService.logs()) {
      if (log.completed) {
        completedCountByDate.set(log.date, (completedCountByDate.get(log.date) ?? 0) + 1);
      }
    }

    const firstMonday = startOfWeek(new Date());
    firstMonday.setDate(firstMonday.getDate() - (weeksBack - 1) * 7);

    return Array.from({ length: weeksBack * 7 }, (_, index) => {
      const date = new Date(firstMonday);
      date.setDate(date.getDate() + index);
      const dateStr = toISODate(date);
      const completedCount = completedCountByDate.get(dateStr) ?? 0;
      const ratio = totalActive > 0 ? completedCount / totalActive : 0;
      return { date: dateStr, level: levelFromRatio(ratio), completedCount };
    });
  }
}
