import { Component, ElementRef, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { HabitWithProgress } from '../../services/habit.service';

export const MAX_PROGRESS_VALUE = 1000;

@Component({
  selector: 'app-habit-card',
  templateUrl: './habit-card.html',
  styleUrl: './habit-card.scss',
})
export class HabitCard {
  readonly habit = input.required<HabitWithProgress>();

  readonly toggled = output<void>();
  readonly progressLogged = output<number>();
  readonly editRequested = output<void>();
  readonly archiveRequested = output<void>();

  readonly isEditingProgress = signal(false);
  readonly progressDraft = signal('');

  private readonly progressInputRef = viewChild<ElementRef<HTMLInputElement>>('progressInput');

  constructor() {
    effect(() => {
      this.progressInputRef()?.nativeElement.focus();
    });
  }

  readonly progressPercent = computed(() => {
    const habit = this.habit();
    if (habit.targetPerDay <= 0) {
      return 0;
    }
    return Math.min(Math.round((habit.todayValue / habit.targetPerDay) * 100), 100);
  });

  startEditingProgress(): void {
    this.progressDraft.set(String(this.habit().todayValue));
    this.isEditingProgress.set(true);
  }

  onProgressInput(value: string): void {
    this.progressDraft.set(value);
  }

  confirmProgressEdit(): void {
    if (!this.isEditingProgress()) {
      return;
    }
    this.isEditingProgress.set(false);

    const raw = this.progressDraft().trim();
    if (raw === '') {
      return;
    }

    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > MAX_PROGRESS_VALUE) {
      return;
    }

    this.progressLogged.emit(value);
  }

  cancelProgressEdit(): void {
    this.isEditingProgress.set(false);
  }
}
