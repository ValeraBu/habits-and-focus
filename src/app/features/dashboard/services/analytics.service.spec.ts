import { TestBed } from '@angular/core/testing';
import { STORAGE_KEYS } from '../../../core/models/storage-schema';
import { todayISO } from '../../../shared/utils/date.utils';
import { HabitService, NewHabitInput } from '../../habit-tracker/services/habit.service';
import { FocusSession } from '../../focus-timer/models/focus-session.model';
import { TimerService } from '../../focus-timer/services/timer.service';
import { AnalyticsService } from './analytics.service';

const newHabit: NewHabitInput = {
  name: 'Прочитать 15 страниц',
  category: 'reading',
  icon: 'reading',
  color: 'coral',
  targetPerDay: 15,
  unit: 'страниц',
};

function seedSessions(sessions: FocusSession[]): void {
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
}

function session(overrides: Partial<FocusSession>): FocusSession {
  return {
    id: Math.random().toString(36),
    durationMinutes: 25,
    startedAt: '2026-09-08T09:00:00.000Z',
    completedAt: '2026-09-08T09:25:00.000Z',
    type: 'focus',
    ...overrides,
  };
}

describe('AnalyticsService', () => {
  let habitService: HabitService;
  let analytics: AnalyticsService;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    // Monday, 2026-09-07 — current week is 2026-09-07 (Mon) .. 2026-09-13 (Sun).
    vi.setSystemTime(new Date('2026-09-07T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(): void {
    TestBed.configureTestingModule({});
    habitService = TestBed.inject(HabitService);
    TestBed.inject(TimerService);
    analytics = TestBed.inject(AnalyticsService);
  }

  describe('weeklyFocusHours', () => {
    it('sums only completed focus sessions within the current week, rounded to 0.1', () => {
      seedSessions([
        session({ completedAt: '2026-09-08T09:30:00.000Z', durationMinutes: 30 }),
        session({ completedAt: '2026-09-09T09:30:00.000Z', durationMinutes: 30 }),
        session({ completedAt: '2026-09-10T09:10:00.000Z', durationMinutes: 10, type: 'break' }),
        session({ completedAt: '2026-08-30T09:00:00.000Z', durationMinutes: 100 }),
      ]);
      setup();

      expect(analytics.weeklyFocusHours()).toBe(1);
    });

    it('ignores focus sessions that were never completed', () => {
      seedSessions([session({ completedAt: undefined, durationMinutes: 30 })]);
      setup();

      expect(analytics.weeklyFocusHours()).toBe(0);
    });
  });

  describe('daysFilledThisWeek', () => {
    it('counts unique days in the current week with at least one completed log', () => {
      setup();
      const habit = habitService.addHabit(newHabit);

      habitService.logProgress(habit.id, 15, '2026-09-07');
      habitService.logProgress(habit.id, 15, '2026-09-09');
      habitService.logProgress(habit.id, 15, '2026-09-11');
      habitService.logProgress(habit.id, 5, '2026-09-08');
      habitService.logProgress(habit.id, 15, '2026-08-30');

      expect(analytics.daysFilledThisWeek()).toBe(3);
    });

    it('never exceeds 7', () => {
      setup();
      const habit = habitService.addHabit(newHabit);
      for (const date of [
        '2026-09-07',
        '2026-09-08',
        '2026-09-09',
        '2026-09-10',
        '2026-09-11',
        '2026-09-12',
        '2026-09-13',
      ]) {
        habitService.logProgress(habit.id, 15, date);
      }

      expect(analytics.daysFilledThisWeek()).toBe(7);
    });
  });

  describe('bestStreak', () => {
    it('returns the maximum streak across all active habits', () => {
      setup();
      const habitA = habitService.addHabit(newHabit);
      const habitB = habitService.addHabit({ ...newHabit, name: 'Связать 2 ряда' });

      habitService.logProgress(habitA.id, 15, '2026-09-05');
      habitService.logProgress(habitA.id, 15, '2026-09-06');
      habitService.logProgress(habitA.id, 15, '2026-09-07');
      habitService.logProgress(habitB.id, 15, '2026-09-07');

      expect(analytics.bestStreak()).toBe(3);
    });

    it('returns 0 when there are no active habits', () => {
      setup();
      expect(analytics.bestStreak()).toBe(0);
    });

    it('picks the true maximum among three habits regardless of creation order', () => {
      setup();
      const habitA = habitService.addHabit(newHabit);
      const habitB = habitService.addHabit({ ...newHabit, name: 'Связать 2 ряда' });
      const habitC = habitService.addHabit({ ...newHabit, name: 'Выучить слова' });

      habitService.logProgress(habitA.id, 15, '2026-09-07');

      for (const date of ['2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07']) {
        habitService.logProgress(habitB.id, 15, date);
      }

      habitService.logProgress(habitC.id, 15, '2026-09-06');
      habitService.logProgress(habitC.id, 15, '2026-09-07');

      expect(analytics.bestStreak()).toBe(5);
    });
  });

  describe('habitsByWeekday', () => {
    it('counts completed logs for each day of the current week', () => {
      setup();
      const habitA = habitService.addHabit(newHabit);
      const habitB = habitService.addHabit({ ...newHabit, name: 'Связать 2 ряда' });

      habitService.logProgress(habitA.id, 15, '2026-09-07');
      habitService.logProgress(habitB.id, 15, '2026-09-07');
      habitService.logProgress(habitA.id, 15, '2026-09-09');

      const byDay = Object.fromEntries(analytics.habitsByWeekday().map((c) => [c.day, c.count]));
      expect(byDay['Пн']).toBe(2);
      expect(byDay['Ср']).toBe(1);
      expect(byDay['Вт']).toBe(0);
      expect(byDay['Вс']).toBe(0);
    });
  });

  describe('activityHeatmap', () => {
    it('returns weeksBack * 7 cells', () => {
      setup();
      expect(analytics.activityHeatmap(4).length).toBe(28);
      expect(analytics.activityHeatmap().length).toBe(70);
    });

    it('maps completion ratio to level: 0 habits done = 0, all done = 4, partial in between', () => {
      setup();
      const habitA = habitService.addHabit(newHabit);
      const habitB = habitService.addHabit({ ...newHabit, name: 'Связать 2 ряда' });

      habitService.logProgress(habitA.id, 15, '2026-09-07');
      habitService.logProgress(habitB.id, 15, '2026-09-07');
      habitService.logProgress(habitA.id, 15, '2026-09-08');

      const cells = analytics.activityHeatmap(2);
      const byDate = Object.fromEntries(cells.map((c) => [c.date, c.level]));

      expect(byDate['2026-09-07']).toBe(4);
      expect(byDate['2026-09-08']).toBe(2);
      expect(byDate['2026-09-09']).toBe(0);
    });

    it('does not divide by zero when there are no active habits', () => {
      setup();
      const habit = habitService.addHabit(newHabit);
      habitService.logProgress(habit.id, 15, todayISO());
      habitService.archiveHabit(habit.id);

      const cells = analytics.activityHeatmap(1);
      expect(cells.every((cell) => Number.isFinite(cell.level))).toBe(true);
      expect(cells.every((cell) => cell.level === 0)).toBe(true);
    });
  });

  describe('a week with no logged activity at all', () => {
    it('returns zero for every metric instead of NaN or dividing by zero', () => {
      setup();
      habitService.addHabit(newHabit);

      expect(analytics.weeklyFocusHours()).toBe(0);
      expect(analytics.daysFilledThisWeek()).toBe(0);
      expect(analytics.bestStreak()).toBe(0);
      expect(analytics.habitsByWeekday().every((day) => day.count === 0)).toBe(true);
      expect(analytics.activityHeatmap(2).every((cell) => cell.level === 0)).toBe(true);
    });

    it('returns zero metrics when there are no habits or sessions whatsoever', () => {
      setup();

      expect(analytics.weeklyFocusHours()).toBe(0);
      expect(analytics.daysFilledThisWeek()).toBe(0);
      expect(analytics.bestStreak()).toBe(0);
    });
  });

  describe('week boundary (Monday-start, per date.utils.ts todayISO)', () => {
    it('does not leak a Sunday log from last week into the Monday that starts a new week', () => {
      // The outer clock is Monday 2026-09-07 — the first day of a new week.
      // 2026-09-06 is the Sunday that closed the PREVIOUS week (2026-08-31 – 2026-09-06).
      setup();
      const habit = habitService.addHabit(newHabit);

      habitService.logProgress(habit.id, 15, '2026-09-06');
      habitService.logProgress(habit.id, 15, todayISO());

      expect(analytics.daysFilledThisWeek()).toBe(1);
      const byDay = Object.fromEntries(analytics.habitsByWeekday().map((c) => [c.day, c.count]));
      expect(byDay['Пн']).toBe(1);
      expect(byDay['Вс']).toBe(0);
    });

    it('counts a Sunday as the last day of the week it closes, not the first day of the next', () => {
      vi.setSystemTime(new Date('2026-09-13T12:00:00')); // Sunday closing the week that started 2026-09-07
      setup();
      const habit = habitService.addHabit(newHabit);

      habitService.logProgress(habit.id, 15, '2026-09-07'); // Monday of the same week
      habitService.logProgress(habit.id, 15, todayISO()); // today: 2026-09-13, Sunday
      habitService.logProgress(habit.id, 15, '2026-09-14'); // next Monday — following week, must not count

      expect(analytics.daysFilledThisWeek()).toBe(2);
      const byDay = Object.fromEntries(analytics.habitsByWeekday().map((c) => [c.day, c.count]));
      expect(byDay['Пн']).toBe(1);
      expect(byDay['Вс']).toBe(1);
    });
  });
});
