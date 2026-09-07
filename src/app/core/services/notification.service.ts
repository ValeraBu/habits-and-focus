import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HabitService } from '../../features/habit-tracker/services/habit.service';
import { todayISO } from '../../shared/utils/date.utils';
import { STORAGE_KEYS } from '../models/storage-schema';
import { StorageService } from './storage.service';

const CHECK_INTERVAL_MS = 60_000;
const DEFAULT_REMINDER_TIME = '20:00';

function currentPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') {
    return 'denied';
  }
  return Notification.permission;
}

function currentHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly storage = inject(StorageService);
  private readonly habitService = inject(HabitService);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastShownDate: string | null;

  readonly reminderEnabled = signal<boolean>(
    this.storage.get<boolean>(STORAGE_KEYS.reminderEnabled, false),
  );
  readonly reminderTime = signal<string>(
    this.storage.get<string>(STORAGE_KEYS.reminderTime, DEFAULT_REMINDER_TIME),
  );
  readonly permissionStatus = signal<NotificationPermission>(currentPermission());

  constructor() {
    this.lastShownDate = this.storage.get<string | null>(STORAGE_KEYS.reminderLastShownDate, null);

    if (this.reminderEnabled()) {
      this.startChecking();
    }

    inject(DestroyRef).onDestroy(() => this.stopChecking());
  }

  setReminderEnabled(enabled: boolean): void {
    this.reminderEnabled.set(enabled);
    this.storage.set(STORAGE_KEYS.reminderEnabled, enabled);
    if (enabled) {
      this.startChecking();
    } else {
      this.stopChecking();
    }
  }

  setReminderTime(time: string): void {
    this.reminderTime.set(time);
    this.storage.set(STORAGE_KEYS.reminderTime, time);
  }

  async requestPermission(): Promise<void> {
    if (typeof Notification === 'undefined') {
      return;
    }
    const result = await Notification.requestPermission();
    this.permissionStatus.set(result);
  }

  private startChecking(): void {
    if (this.intervalId !== null) {
      return;
    }
    this.intervalId = setInterval(() => this.checkAndNotify(), CHECK_INTERVAL_MS);
  }

  private stopChecking(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkAndNotify(): void {
    if (!this.reminderEnabled() || this.permissionStatus() !== 'granted') {
      return;
    }
    if (currentHHMM(new Date()) !== this.reminderTime()) {
      return;
    }

    const today = todayISO();
    if (this.lastShownDate === today) {
      return;
    }

    const habitsToday = this.habitService.habitsForToday();
    const incompleteCount = habitsToday.filter((habit) => !habit.completedToday).length;
    if (incompleteCount === 0) {
      return;
    }

    // Only mark the day as "shown" once a notification is actually created —
    // otherwise a check that finds nothing to report (e.g. everything already
    // completed at that exact minute) would burn the day's dedup slot and
    // silently block a real notification later that same day.
    this.lastShownDate = today;
    this.storage.set(STORAGE_KEYS.reminderLastShownDate, today);

    new Notification('Habit & Focus Hub', {
      body: `Не выполнено ${incompleteCount} из ${habitsToday.length} привычек сегодня`,
    });
  }
}
