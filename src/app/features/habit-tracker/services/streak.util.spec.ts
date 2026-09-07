import { HabitLog } from '../models/habit-log.model';
import { calculateStreak } from './streak.util';

const HABIT_ID = 'habit-1';

function log(date: string, completed: boolean, habitId = HABIT_ID): HabitLog {
  return {
    id: `log-${habitId}-${date}`,
    habitId,
    date,
    value: completed ? 10 : 0,
    completed,
    createdAt: `${date}T00:00:00.000Z`,
  };
}

describe('calculateStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 when there are no logs', () => {
    expect(calculateStreak(HABIT_ID, [])).toBe(0);
  });

  it('returns 0 when no log for the habit is completed', () => {
    const logs = [log('2026-09-04', false), log('2026-09-03', false)];
    expect(calculateStreak(HABIT_ID, logs)).toBe(0);
  });

  it('grows for consecutive completed days ending today', () => {
    const logs = [log('2026-09-04', true), log('2026-09-03', true), log('2026-09-02', true)];
    expect(calculateStreak(HABIT_ID, logs)).toBe(3);
  });

  it('does not reset when today has not been logged yet, counting back from yesterday', () => {
    const logs = [log('2026-09-03', true), log('2026-09-02', true), log('2026-09-01', true)];
    expect(calculateStreak(HABIT_ID, logs)).toBe(3);
  });

  it('does not grow (but does not reset) when today is logged but not completed', () => {
    const logs = [log('2026-09-04', false), log('2026-09-03', true), log('2026-09-02', true)];
    expect(calculateStreak(HABIT_ID, logs)).toBe(2);
  });

  it('resets the count when a day in between was skipped', () => {
    const logs = [
      log('2026-09-04', true),
      log('2026-09-03', true),
      // 2026-09-02 skipped
      log('2026-09-01', true),
      log('2026-08-31', true),
    ];
    expect(calculateStreak(HABIT_ID, logs)).toBe(2);
  });

  it('ignores logs belonging to a different habit', () => {
    const logs = [log('2026-09-04', true, 'other-habit'), log('2026-09-03', true, 'other-habit')];
    expect(calculateStreak(HABIT_ID, logs)).toBe(0);
  });

  it('treats a day explicitly logged as not completed as a break in the streak', () => {
    const logs = [log('2026-09-04', true), log('2026-09-03', false), log('2026-09-02', true)];
    expect(calculateStreak(HABIT_ID, logs)).toBe(1);
  });
});
