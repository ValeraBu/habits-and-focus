import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { HabitForm, HabitFormValue } from '../habit-form/habit-form';
import { HabitCard } from '../habit-card/habit-card';
import { HabitService, HabitWithProgress } from '../../services/habit.service';
import { Habit } from '../../models/habit.model';

@Component({
  selector: 'app-habit-list',
  imports: [HabitForm, HabitCard, DecimalPipe],
  templateUrl: './habit-list.html',
  styleUrl: './habit-list.scss',
})
export class HabitList {
  private readonly habitService = inject(HabitService);

  readonly habits = this.habitService.habitsForToday;
  readonly todayProgress = this.habitService.todayProgress;

  readonly isFormOpen = signal(false);
  readonly editingHabit = signal<Habit | null>(null);

  readonly today = new Date();

  readonly greeting = this.buildGreeting();
  readonly formattedDate = this.buildFormattedDate();

  openCreateForm(): void {
    this.editingHabit.set(null);
    this.isFormOpen.set(true);
  }

  openEditForm(habit: Habit): void {
    this.editingHabit.set(habit);
    this.isFormOpen.set(true);
  }

  archiveHabit(habit: Habit): void {
    this.habitService.archiveHabit(habit.id);
  }

  toggleHabit(habit: HabitWithProgress): void {
    this.habitService.logProgress(habit.id, habit.completedToday ? 0 : habit.targetPerDay);
  }

  logProgress(habit: HabitWithProgress, value: number): void {
    this.habitService.logProgress(habit.id, value);
  }

  onFormSave(value: HabitFormValue): void {
    const habit = this.editingHabit();
    if (habit) {
      this.habitService.updateHabit(habit.id, value);
    } else {
      this.habitService.addHabit(value);
    }
    this.isFormOpen.set(false);
  }

  onFormCancel(): void {
    this.isFormOpen.set(false);
  }

  private buildGreeting(): string {
    const hour = this.today.getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  }

  private buildFormattedDate(): string {
    const formatted = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(this.today);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}
