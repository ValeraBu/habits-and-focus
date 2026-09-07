export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatmapCell {
  date: string;
  level: HeatmapLevel;
  completedCount: number;
}

export type Weekday = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт' | 'Сб' | 'Вс';

export interface WeekdayCount {
  day: Weekday;
  count: number;
}
