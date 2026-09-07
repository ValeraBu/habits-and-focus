import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'habits',
  },
  {
    path: 'habits',
    loadChildren: () =>
      import('./features/habit-tracker/habit-tracker.routes').then((m) => m.HABIT_TRACKER_ROUTES),
  },
  {
    path: 'focus',
    loadChildren: () =>
      import('./features/focus-timer/focus-timer.routes').then((m) => m.FOCUS_TIMER_ROUTES),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
];
