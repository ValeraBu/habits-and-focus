import { Component, input } from '@angular/core';
import { HeatmapCell, HeatmapLevel } from '../../models/analytics.model';

const LEVEL_COLOR_VAR: Record<HeatmapLevel, string> = {
  0: 'var(--border)',
  1: 'var(--heat1)',
  2: 'var(--heat2)',
  3: 'var(--heat3)',
  4: 'var(--heat4)',
};

const DAY_LABELS = ['Пн', '', 'Ср', '', 'Пт', '', 'Вс'];

function pluralizeHabits(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'привычка';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'привычки';
  return 'привычек';
}

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.html',
  styleUrl: './heatmap.scss',
})
export class Heatmap {
  readonly cells = input.required<HeatmapCell[]>();

  readonly dayLabels = DAY_LABELS;
  readonly legendLevels: HeatmapLevel[] = [0, 1, 2, 3, 4];

  colorFor(level: HeatmapLevel): string {
    return LEVEL_COLOR_VAR[level];
  }

  titleFor(cell: HeatmapCell): string {
    return `${cell.date}: выполнено ${cell.completedCount} ${pluralizeHabits(cell.completedCount)}`;
  }
}
