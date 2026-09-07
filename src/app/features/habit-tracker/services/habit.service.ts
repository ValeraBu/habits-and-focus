import { Injectable, computed, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '../../../core/models/storage-schema';
import { IdGeneratorService } from '../../../core/services/id-generator.service';
import { StorageService } from '../../../core/services/storage.service';
import { todayISO } from '../../../shared/utils/date.utils';
import { HabitLog } from '../models/habit-log.model';
import { Habit } from '../models/habit.model';
import { calculateStreak } from './streak.util';

export type NewHabitInput = Omit<Habit, 'id' | 'createdAt' | 'active'>;
export type HabitUpdateInput = Partial<Omit<Habit, 'id' | 'createdAt'>>;

export interface HabitWithProgress extends Habit {
  todayValue: number;
  completedToday: boolean;
  streak: number;
}

@Injectable({ providedIn: 'root' })
export class HabitService {
  private readonly storage = inject(StorageService);
  private readonly idGenerator = inject(IdGeneratorService);

  private readonly habitsSignal = signal<Habit[]>(
    this.storage.get<Habit[]>(STORAGE_KEYS.habits, []),
  );
  private readonly logsSignal = signal<HabitLog[]>(
    this.storage.get<HabitLog[]>(STORAGE_KEYS.logs, []),
  );

  readonly habits = this.habitsSignal.asReadonly();
  readonly logs = this.logsSignal.asReadonly();
  readonly activeHabits = computed(() => this.habitsSignal().filter((habit) => habit.active));

  readonly habitsForToday = computed<HabitWithProgress[]>(() => {
    const logs = this.logsSignal();
    const today = todayISO();
    return this.activeHabits().map((habit) => {
      const todayLog = logs.find((log) => log.habitId === habit.id && log.date === today);
      return {
        ...habit,
        todayValue: todayLog?.value ?? 0,
        completedToday: todayLog?.completed ?? false,
        streak: calculateStreak(habit.id, logs),
      };
    });
  });

  readonly todayProgress = computed(() => {
    const habits = this.habitsForToday();
    return {
      completed: habits.filter((habit) => habit.completedToday).length,
      total: habits.length,
    };
  });

  addHabit(input: NewHabitInput): Habit {
    const habit: Habit = {
      ...input,
      id: this.idGenerator.generate(),
      createdAt: new Date().toISOString(),
      active: true,
    };
    this.persistHabits([...this.habitsSignal(), habit]);
    return habit;
  }

  updateHabit(id: string, changes: HabitUpdateInput): void {
    this.persistHabits(
      this.habitsSignal().map((habit) => (habit.id === id ? { ...habit, ...changes } : habit)),
    );
  }

  archiveHabit(id: string): void {
    this.updateHabit(id, { active: false });
  }

  logProgress(habitId: string, value: number, date = todayISO()): HabitLog {
    const habit = this.habitsSignal().find((h) => h.id === habitId);
    const completed = value >= (habit?.targetPerDay ?? 0);
    const existing = this.logsSignal().find((log) => log.habitId === habitId && log.date === date);

    const log: HabitLog = existing
      ? { ...existing, value, completed }
      : {
          id: this.idGenerator.generate(),
          habitId,
          date,
          value,
          completed,
          createdAt: new Date().toISOString(),
        };

    this.persistLogs(
      existing
        ? this.logsSignal().map((l) => (l.id === log.id ? log : l))
        : [...this.logsSignal(), log],
    );
    return log;
  }

  getTodayLog(habitId: string): HabitLog | undefined {
    const today = todayISO();
    return this.logsSignal().find((log) => log.habitId === habitId && log.date === today);
  }

  private persistHabits(habits: Habit[]): void {
    this.habitsSignal.set(habits);
    this.storage.set(STORAGE_KEYS.habits, habits);
  }

  private persistLogs(logs: HabitLog[]): void {
    this.logsSignal.set(logs);
    this.storage.set(STORAGE_KEYS.logs, logs);
  }
}
