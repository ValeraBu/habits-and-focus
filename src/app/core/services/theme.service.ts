import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '../models/storage-schema';
import { StorageService } from './storage.service';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);

  private readonly systemPrefersDarkSignal = signal(systemPrefersDark());

  readonly theme = signal<Theme>(this.storage.get<Theme>(STORAGE_KEYS.theme, 'system'));

  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const theme = this.theme();
    return theme === 'system' ? (this.systemPrefersDarkSignal() ? 'dark' : 'light') : theme;
  });

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (event: MediaQueryListEvent): void => this.systemPrefersDarkSignal.set(event.matches);
      media.addEventListener('change', listener);
      inject(DestroyRef).onDestroy(() => media.removeEventListener('change', listener));
    }

    effect(() => {
      const resolved = this.resolvedTheme();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', resolved);
      }
    });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.storage.set(STORAGE_KEYS.theme, theme);
  }

  toggleTheme(): void {
    this.setTheme(this.resolvedTheme() === 'dark' ? 'light' : 'dark');
  }
}
