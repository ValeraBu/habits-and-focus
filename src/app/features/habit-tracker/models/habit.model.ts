export type HabitCategory = 'reading' | 'knitting' | 'study' | 'custom';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  icon: string;
  color: string;
  targetPerDay: number;
  unit: string;
  createdAt: string;
  active: boolean;
}
