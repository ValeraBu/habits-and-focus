import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { ReminderSettings } from './shared/components/reminder-settings/reminder-settings';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ReminderSettings],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly themeService = inject(ThemeService);

  readonly isDark = computed(() => this.themeService.resolvedTheme() === 'dark');

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
