import { TestBed } from '@angular/core/testing';
import { STORAGE_KEYS } from '../../../core/models/storage-schema';
import { Habit } from '../models/habit.model';
import { HabitService, NewHabitInput } from './habit.service';

const newHabit: NewHabitInput = {
  name: 'Прочитать 15 страниц',
  category: 'reading',
  icon: 'reading',
  color: 'coral',
  targetPerDay: 15,
  unit: 'страниц',
};

function readStoredHabits(): Habit[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.habits) ?? '[]') as Habit[];
}

describe('HabitService', () => {
  let service: HabitService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(HabitService);
  });

  it('starts with an empty list when localStorage is empty', () => {
    expect(service.habits()).toEqual([]);
  });

  it('loads previously persisted habits on creation', () => {
    const stored: Habit[] = [{ ...newHabit, id: '1', createdAt: '2026-09-01T00:00:00.000Z', active: true }];
    localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(stored));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(HabitService);

    expect(service.habits()).toEqual(stored);
  });

  describe('addHabit', () => {
    it('adds a habit with a generated id and active=true, and returns it', () => {
      const habit = service.addHabit(newHabit);

      expect(habit.id).toBeTruthy();
      expect(habit.active).toBe(true);
      expect(habit.createdAt).toBeTruthy();
      expect(service.habits()).toEqual([habit]);
    });

    it('persists the new habit to localStorage', () => {
      const habit = service.addHabit(newHabit);
      expect(readStoredHabits()).toEqual([habit]);
    });
  });

  describe('updateHabit', () => {
    it('merges changes into the matching habit', () => {
      const habit = service.addHabit(newHabit);

      service.updateHabit(habit.id, { name: 'Прочитать 20 страниц', targetPerDay: 20 });

      const updated = service.habits().find((h) => h.id === habit.id);
      expect(updated?.name).toBe('Прочитать 20 страниц');
      expect(updated?.targetPerDay).toBe(20);
      expect(updated?.id).toBe(habit.id);
    });

    it('persists the update to localStorage', () => {
      const habit = service.addHabit(newHabit);
      service.updateHabit(habit.id, { name: 'Новое название' });

      expect(readStoredHabits()[0].name).toBe('Новое название');
    });

    it('does not affect other habits', () => {
      const first = service.addHabit(newHabit);
      const second = service.addHabit({ ...newHabit, name: 'Связать 2 ряда' });

      service.updateHabit(first.id, { name: 'Изменено' });

      expect(service.habits().find((h) => h.id === second.id)?.name).toBe('Связать 2 ряда');
    });
  });

  describe('logProgress', () => {
    it('marks completed true and stores the actual value when it exceeds targetPerDay', () => {
      const habit = service.addHabit(newHabit);

      const log = service.logProgress(habit.id, 22, '2026-09-04');

      expect(log.value).toBe(22);
      expect(log.completed).toBe(true);
    });

    it('marks completed false when the value is below targetPerDay', () => {
      const habit = service.addHabit(newHabit);

      const log = service.logProgress(habit.id, 5, '2026-09-04');

      expect(log.value).toBe(5);
      expect(log.completed).toBe(false);
    });

    it('updates the existing log for the same habit and date instead of duplicating it', () => {
      const habit = service.addHabit(newHabit);

      service.logProgress(habit.id, 5, '2026-09-04');
      service.logProgress(habit.id, 22, '2026-09-04');

      const logsForDate = service.logs().filter((log) => log.habitId === habit.id && log.date === '2026-09-04');
      expect(logsForDate.length).toBe(1);
      expect(logsForDate[0].value).toBe(22);
      expect(logsForDate[0].completed).toBe(true);
    });

    it('persists the log to localStorage with the real, uncapped value', () => {
      const habit = service.addHabit(newHabit);

      service.logProgress(habit.id, 22, '2026-09-04');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.logs) ?? '[]');
      expect(stored[0].value).toBe(22);
      expect(stored[0].completed).toBe(true);
    });
  });

  describe('archiveHabit', () => {
    it('sets active to false without removing the habit', () => {
      const habit = service.addHabit(newHabit);

      service.archiveHabit(habit.id);

      expect(service.habits().find((h) => h.id === habit.id)?.active).toBe(false);
      expect(service.habits().length).toBe(1);
    });

    it('excludes archived habits from activeHabits', () => {
      const habit = service.addHabit(newHabit);
      service.archiveHabit(habit.id);

      expect(service.activeHabits()).toEqual([]);
    });

    it('persists the archived state to localStorage', () => {
      const habit = service.addHabit(newHabit);
      service.archiveHabit(habit.id);

      expect(readStoredHabits()[0].active).toBe(false);
    });
  });
});
