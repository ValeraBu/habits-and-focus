import { Routes } from '@angular/router';

export const HABIT_TRACKER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./habit-tracker-page/habit-tracker-page').then((m) => m.HabitTrackerPage),
  },
];
