import { Routes } from '@angular/router';

export const FOCUS_TIMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./focus-timer-page/focus-timer-page').then((m) => m.FocusTimerPage),
  },
];
