import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';

const PULSE_DURATION_MS = 420;

function pluralizeDays(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

@Component({
  selector: 'app-stats-cards',
  imports: [DecimalPipe],
  templateUrl: './stats-cards.html',
  styleUrl: './stats-cards.scss',
})
export class StatsCards {
  readonly weeklyFocusHours = input.required<number>();
  readonly daysFilledThisWeek = input.required<number>();
  readonly bestStreak = input.required<number>();

  readonly bestStreakLabel = computed(() => pluralizeDays(this.bestStreak()));

  readonly isStreakPulsing = signal(false);

  private previousStreak: number | null = null;
  private pulseTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const current = this.bestStreak();
      if (this.previousStreak !== null && current > this.previousStreak) {
        this.pulseStreak();
      }
      this.previousStreak = current;
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.pulseTimeoutId !== null) {
        clearTimeout(this.pulseTimeoutId);
      }
    });
  }

  private pulseStreak(): void {
    if (this.pulseTimeoutId !== null) {
      clearTimeout(this.pulseTimeoutId);
    }
    this.isStreakPulsing.set(true);
    this.pulseTimeoutId = setTimeout(() => {
      this.isStreakPulsing.set(false);
      this.pulseTimeoutId = null;
    }, PULSE_DURATION_MS);
  }
}
