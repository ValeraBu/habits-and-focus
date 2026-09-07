import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DropdownOption, DropdownSelect } from '../../../../shared/components/dropdown-select/dropdown-select';
import { HabitService } from '../../../habit-tracker/services/habit.service';
import { FocusSession } from '../../models/focus-session.model';
import { SoundService } from '../../services/sound.service';
import { BREAK_DURATION_OPTIONS, FOCUS_DURATION_OPTIONS, TimerService } from '../../services/timer.service';

const RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SESSION_DOTS_GOAL = 5;
const TOAST_DURATION_MS = 5500;

@Component({
  selector: 'app-timer',
  imports: [DropdownSelect],
  templateUrl: './timer.html',
  styleUrl: './timer.scss',
})
export class Timer {
  protected readonly timer = inject(TimerService);
  protected readonly sound = inject(SoundService);
  private readonly habitService = inject(HabitService);

  readonly habits = this.habitService.activeHabits;

  readonly selectedHabit = computed(
    () => this.habits().find((habit) => habit.id === this.timer.selectedHabitId()) ?? null,
  );

  readonly habitOptions = computed<DropdownOption[]>(() => [
    { value: null, label: 'Без привычки' },
    ...this.habits().map((habit) => ({ value: habit.id, label: habit.name })),
  ]);

  readonly durationOptions = computed(() =>
    this.timer.mode() === 'focus' ? FOCUS_DURATION_OPTIONS : BREAK_DURATION_OPTIONS,
  );

  readonly circumference = CIRCUMFERENCE;

  readonly dashOffset = computed(
    () => this.circumference * (this.timer.remainingSeconds() / this.timer.totalSeconds()),
  );

  readonly formattedTime = computed(() => {
    const seconds = this.timer.remainingSeconds();
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
  });

  readonly sessionDots = computed(() => {
    const completed = this.timer.sessionsToday();
    const total = Math.max(completed, SESSION_DOTS_GOAL);
    return Array.from({ length: total }, (_, index) => index < completed);
  });

  readonly toastVisible = signal(false);
  readonly toastSession = signal<FocusSession | null>(null);
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const session = this.timer.lastCompletedSession();
      if (session) {
        this.showToast(session);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.toastTimeoutId !== null) {
        clearTimeout(this.toastTimeoutId);
      }
    });
  }

  toggleRunning(): void {
    if (this.timer.isRunning()) {
      this.timer.pause();
    } else {
      this.timer.start();
    }
  }

  onSelectHabit(habitId: string | null): void {
    this.timer.selectHabit(habitId);
  }

  toastSubtitle(session: FocusSession): string {
    return session.type === 'focus'
      ? `${session.durationMinutes} минут в фокусе — отличная работа`
      : 'Перерыв окончен, пора вернуться к делу';
  }

  dismissToast(): void {
    this.toastVisible.set(false);
    if (this.toastTimeoutId !== null) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  private showToast(session: FocusSession): void {
    if (this.toastTimeoutId !== null) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastSession.set(session);
    this.toastVisible.set(true);
    this.toastTimeoutId = setTimeout(() => {
      this.toastVisible.set(false);
      this.toastTimeoutId = null;
    }, TOAST_DURATION_MS);
  }
}
