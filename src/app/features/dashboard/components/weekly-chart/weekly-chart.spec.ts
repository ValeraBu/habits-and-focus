import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeekdayCount } from '../../models/analytics.model';
import { WeeklyChart } from './weekly-chart';

const ALL_DAYS: WeekdayCount['day'][] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

describe('WeeklyChart', () => {
  let fixture: ComponentFixture<WeeklyChart>;
  let component: WeeklyChart;

  function render(weekdayCounts: WeekdayCount[], activeHabitCount: number): void {
    TestBed.configureTestingModule({ imports: [WeeklyChart] });
    fixture = TestBed.createComponent(WeeklyChart);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('weekdayCounts', weekdayCounts);
    fixture.componentRef.setInput('activeHabitCount', activeHabitCount);
    fixture.detectChanges();
  }

  it('renders every bar at zero height when there are no active habits, without dividing by zero', () => {
    const counts = ALL_DAYS.map((day) => ({ day, count: 0 }));
    render(counts, 0);

    for (const bar of component.bars()) {
      expect(bar.heightPx).toBe(0);
      expect(Number.isFinite(bar.heightPx)).toBe(true);
    }
  });

  it('renders every bar at maximum height when the single active habit was completed every day', () => {
    const counts = ALL_DAYS.map((day) => ({ day, count: 1 }));
    render(counts, 1);

    for (const bar of component.bars()) {
      expect(bar.heightPx).toBe(component.maxBarHeightPx);
    }
  });

  it('colors weekday bars coral and weekend bars sage', () => {
    const counts = ALL_DAYS.map((day) => ({ day, count: 1 }));
    render(counts, 1);

    const byDay = Object.fromEntries(component.bars().map((bar) => [bar.day, bar.color]));
    expect(byDay['Пн']).toBe('coral');
    expect(byDay['Пт']).toBe('coral');
    expect(byDay['Сб']).toBe('sage');
    expect(byDay['Вс']).toBe('sage');
  });

  it('never exceeds the maximum bar height even if count somehow exceeds the active habit total', () => {
    render([{ day: 'Пн', count: 5 }], 2);

    expect(component.bars()[0].heightPx).toBe(component.maxBarHeightPx);
  });
});
