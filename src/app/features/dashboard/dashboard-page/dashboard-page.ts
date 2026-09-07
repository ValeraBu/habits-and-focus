import { Component, computed, inject } from '@angular/core';
import { HabitService } from '../../habit-tracker/services/habit.service';
import { StatsCards } from '../components/stats-cards/stats-cards';
import { Heatmap } from '../components/heatmap/heatmap';
import { WeeklyChart } from '../components/weekly-chart/weekly-chart';
import { AnalyticsService } from '../services/analytics.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [StatsCards, Heatmap, WeeklyChart],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  private readonly analytics = inject(AnalyticsService);
  private readonly habitService = inject(HabitService);

  readonly weeklyFocusHours = this.analytics.weeklyFocusHours;
  readonly daysFilledThisWeek = this.analytics.daysFilledThisWeek;
  readonly bestStreak = this.analytics.bestStreak;
  readonly habitsByWeekday = this.analytics.habitsByWeekday;

  readonly heatmapCells = computed(() => this.analytics.activityHeatmap());
  readonly activeHabitCount = computed(() => this.habitService.activeHabits().length);
}
