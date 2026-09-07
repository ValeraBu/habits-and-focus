import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Habit, HabitCategory } from '../../models/habit.model';

export interface HabitFormValue {
  name: string;
  category: HabitCategory;
  icon: string;
  color: string;
  targetPerDay: number;
  unit: string;
}

interface CategoryOption {
  value: HabitCategory;
  label: string;
}

interface ColorOption {
  value: string;
  label: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'reading', label: 'Чтение' },
  { value: 'knitting', label: 'Вязание' },
  { value: 'study', label: 'Учёба' },
  { value: 'custom', label: 'Своё' },
];

const COLOR_OPTIONS: ColorOption[] = [
  { value: 'coral', label: 'Коралловый' },
  { value: 'sage', label: 'Шалфейный' },
  { value: 'yellow', label: 'Жёлтый' },
  { value: 'violet', label: 'Фиолетовый' },
  { value: 'sky', label: 'Голубой' },
];

const UNIT_OPTIONS = ['страниц', 'рядов', 'слов', 'минут'];

const DEFAULT_FORM_VALUE = {
  name: '',
  category: 'reading' as HabitCategory,
  color: 'coral',
  targetPerDay: 1,
  unit: UNIT_OPTIONS[0],
};

@Component({
  selector: 'app-habit-form',
  imports: [ReactiveFormsModule],
  templateUrl: './habit-form.html',
  styleUrl: './habit-form.scss',
})
export class HabitForm {
  private readonly fb = inject(FormBuilder);

  readonly habit = input<Habit | null>(null);
  readonly saved = output<HabitFormValue>();
  readonly closed = output<void>();

  readonly categoryOptions = CATEGORY_OPTIONS;
  readonly colorOptions = COLOR_OPTIONS;
  readonly unitOptions = UNIT_OPTIONS;

  readonly title = computed(() => (this.habit() ? 'Редактировать привычку' : 'Новая привычка'));

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control(DEFAULT_FORM_VALUE.name, Validators.required),
    category: this.fb.nonNullable.control<HabitCategory>(
      DEFAULT_FORM_VALUE.category,
      Validators.required,
    ),
    color: this.fb.nonNullable.control(DEFAULT_FORM_VALUE.color, Validators.required),
    targetPerDay: this.fb.nonNullable.control(DEFAULT_FORM_VALUE.targetPerDay, [
      Validators.required,
      Validators.min(1),
    ]),
    unit: this.fb.nonNullable.control(DEFAULT_FORM_VALUE.unit, Validators.required),
  });

  constructor() {
    effect(() => {
      const habit = this.habit();
      this.form.reset(
        habit
          ? {
              name: habit.name,
              category: habit.category,
              color: habit.color,
              targetPerDay: habit.targetPerDay,
              unit: habit.unit,
            }
          : DEFAULT_FORM_VALUE,
      );
    });
  }

  selectCategory(category: HabitCategory): void {
    this.form.controls.category.setValue(category);
  }

  selectColor(color: string): void {
    this.form.controls.color.setValue(color);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({ ...value, icon: value.category });
  }

  onCancel(): void {
    this.closed.emit();
  }
}
