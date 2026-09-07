import { Component, computed, input } from '@angular/core';
import { WeekdayCount } from '../../models/analytics.model';

const WEEKEND_DAYS = new Set(['Сб', 'Вс']);
const MAX_BAR_HEIGHT_PX = 120;

interface WeekdayBar {
  day: string;
  heightPx: number;
  color: 'coral' | 'sage';
}

@Component({
  selector: 'app-weekly-chart',
  templateUrl: './weekly-chart.html',
  styleUrl: './weekly-chart.scss',
})
export class WeeklyChart {
  readonly weekdayCounts = input.required<WeekdayCount[]>();
  readonly activeHabitCount = input.required<number>();

  readonly maxBarHeightPx = MAX_BAR_HEIGHT_PX;

  readonly bars = computed<WeekdayBar[]>(() => {
    const total = this.activeHabitCount();
    return this.weekdayCounts().map((entry) => {
      const ratio = total > 0 ? entry.count / total : 0;
      return {
        day: entry.day,
        heightPx: Math.min(Math.max(ratio, 0), 1) * MAX_BAR_HEIGHT_PX,
        color: WEEKEND_DAYS.has(entry.day) ? 'sage' : 'coral',
      };
    });
  });
}
