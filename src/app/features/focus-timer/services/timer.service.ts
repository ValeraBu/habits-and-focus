import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '../../../core/models/storage-schema';
import { IdGeneratorService } from '../../../core/services/id-generator.service';
import { StorageService } from '../../../core/services/storage.service';
import { isSameDay, todayISO } from '../../../shared/utils/date.utils';
import { FocusSession, FocusSessionType } from '../models/focus-session.model';
import { SoundService } from './sound.service';

export const FOCUS_DURATION_MINUTES = 25;
export const BREAK_DURATION_MINUTES = 5;

export const FOCUS_DURATION_OPTIONS = [15, 25, 45, 60];
export const BREAK_DURATION_OPTIONS = [5, 10, 15, 20];

// Persisted as a point-in-time anchor (startedAt + accumulatedSeconds), never
// as a raw "remainingSeconds" countdown — remainingSeconds is recomputed from
// this anchor on every tick and on restore, so neither a page reload nor
// setInterval throttling in a backgrounded tab can let the display drift
// away from the real elapsed wall-clock time.
interface TimerState {
  isRunning: boolean;
  mode: FocusSessionType;
  durationMinutes: number;
  startedAt: string | null;
  accumulatedSeconds: number;
  habitId?: string;
}

@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly storage = inject(StorageService);
  private readonly idGenerator = inject(IdGeneratorService);
  private readonly sound = inject(SoundService);

  private readonly sessionsSignal = signal<FocusSession[]>(
    this.storage.get<FocusSession[]>(STORAGE_KEYS.sessions, []),
  );

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private startedAt: string | null = null;
  private accumulatedSeconds = 0;

  readonly mode = signal<FocusSessionType>('focus');
  readonly isRunning = signal(false);
  readonly selectedHabitId = signal<string | null>(null);
  readonly lastCompletedSession = signal<FocusSession | null>(null);

  readonly focusDurationMinutes = signal(FOCUS_DURATION_MINUTES);
  readonly breakDurationMinutes = signal(BREAK_DURATION_MINUTES);

  readonly totalSeconds = computed(
    () => (this.mode() === 'focus' ? this.focusDurationMinutes() : this.breakDurationMinutes()) * 60,
  );

  readonly remainingSeconds = signal(FOCUS_DURATION_MINUTES * 60);

  readonly sessions = this.sessionsSignal.asReadonly();

  readonly sessionsToday = computed(
    () =>
      this.sessionsSignal().filter(
        (session) =>
          session.type === 'focus' && session.completedAt && isSameDay(session.completedAt, todayISO()),
      ).length,
  );

  constructor() {
    this.restoreState();
    inject(DestroyRef).onDestroy(() => this.stopTicking());
  }

  start(): void {
    if (this.isRunning()) {
      return;
    }
    this.startedAt = new Date().toISOString();
    this.isRunning.set(true);
    this.beginTicking();
    this.persistState();
  }

  pause(): void {
    if (!this.isRunning()) {
      return;
    }
    this.accumulateElapsed();
    this.isRunning.set(false);
    this.startedAt = null;
    this.stopTicking();
    this.remainingSeconds.set(this.computeRemainingSeconds());
    this.persistState();
  }

  reset(): void {
    this.isRunning.set(false);
    this.stopTicking();
    this.startedAt = null;
    this.accumulatedSeconds = 0;
    this.remainingSeconds.set(this.totalSeconds());
    this.persistState();
  }

  setMode(mode: FocusSessionType): void {
    if (mode === this.mode()) {
      return;
    }
    this.isRunning.set(false);
    this.stopTicking();
    this.startedAt = null;
    this.accumulatedSeconds = 0;
    this.mode.set(mode);
    this.remainingSeconds.set(this.totalSeconds());
    this.persistState();
  }

  setDuration(minutes: number): void {
    if (this.isRunning()) {
      return;
    }
    if (this.mode() === 'focus') {
      this.focusDurationMinutes.set(minutes);
    } else {
      this.breakDurationMinutes.set(minutes);
    }
    this.remainingSeconds.set(this.totalSeconds());
    this.persistState();
  }

  selectHabit(habitId: string | null): void {
    this.selectedHabitId.set(habitId);
    this.persistState();
  }

  private restoreState(): void {
    const state = this.storage.get<TimerState | null>(STORAGE_KEYS.timerState, null);
    if (!state) {
      return;
    }

    this.mode.set(state.mode);
    if (state.mode === 'focus') {
      this.focusDurationMinutes.set(state.durationMinutes);
    } else {
      this.breakDurationMinutes.set(state.durationMinutes);
    }
    this.selectedHabitId.set(state.habitId ?? null);
    this.accumulatedSeconds = state.accumulatedSeconds;
    this.startedAt = state.isRunning ? state.startedAt : null;

    if (!state.isRunning || this.startedAt === null) {
      this.remainingSeconds.set(this.computeRemainingSeconds());
      return;
    }

    const remaining = this.computeRemainingSeconds();
    if (remaining > 0) {
      this.isRunning.set(true);
      this.remainingSeconds.set(remaining);
      this.beginTicking();
      return;
    }

    // The session finished while the app was closed/reloaded — apply the
    // same completion path as a normal in-app finish, just without the
    // sound (a sudden chime on page load would be jarring), so the
    // FocusSession still gets logged and the completion toast still shows.
    this.completeSession({ playSound: false });
  }

  private accumulateElapsed(): void {
    if (this.startedAt === null) {
      return;
    }
    this.accumulatedSeconds += (Date.now() - Date.parse(this.startedAt)) / 1000;
  }

  private computeRemainingSeconds(): number {
    const elapsed =
      this.startedAt === null
        ? this.accumulatedSeconds
        : this.accumulatedSeconds + (Date.now() - Date.parse(this.startedAt)) / 1000;
    return Math.max(Math.round(this.totalSeconds() - elapsed), 0);
  }

  private beginTicking(): void {
    if (this.intervalId !== null) {
      return;
    }
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  private stopTicking(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    const remaining = this.computeRemainingSeconds();
    if (remaining <= 0) {
      this.remainingSeconds.set(0);
      this.completeSession();
      return;
    }
    this.remainingSeconds.set(remaining);
  }

  private completeSession(options: { playSound: boolean } = { playSound: true }): void {
    this.stopTicking();
    this.isRunning.set(false);

    const completedAt = new Date().toISOString();
    const durationMinutes =
      this.mode() === 'focus' ? this.focusDurationMinutes() : this.breakDurationMinutes();
    const session: FocusSession = {
      id: this.idGenerator.generate(),
      habitId: this.selectedHabitId() ?? undefined,
      durationMinutes,
      startedAt: this.startedAt ?? completedAt,
      completedAt,
      type: this.mode(),
    };
    this.sessionsSignal.set([...this.sessionsSignal(), session]);
    this.storage.set(STORAGE_KEYS.sessions, this.sessionsSignal());
    this.startedAt = null;
    this.accumulatedSeconds = 0;
    this.lastCompletedSession.set(session);

    if (options.playSound) {
      this.sound.play('complete');
    }

    this.mode.set(this.mode() === 'focus' ? 'break' : 'focus');
    this.remainingSeconds.set(this.totalSeconds());
    this.persistState();
  }

  private persistState(): void {
    const durationMinutes =
      this.mode() === 'focus' ? this.focusDurationMinutes() : this.breakDurationMinutes();
    const state: TimerState = {
      isRunning: this.isRunning(),
      mode: this.mode(),
      durationMinutes,
      startedAt: this.startedAt,
      accumulatedSeconds: this.accumulatedSeconds,
      habitId: this.selectedHabitId() ?? undefined,
    };
    this.storage.set(STORAGE_KEYS.timerState, state);
  }
}
