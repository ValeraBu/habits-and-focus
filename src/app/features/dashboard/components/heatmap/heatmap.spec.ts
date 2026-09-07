import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeatmapCell } from '../../models/analytics.model';
import { Heatmap } from './heatmap';

function cell(overrides: Partial<HeatmapCell>): HeatmapCell {
  return { date: '2026-09-07', level: 0, completedCount: 0, ...overrides };
}

describe('Heatmap', () => {
  let fixture: ComponentFixture<Heatmap>;

  function render(cells: HeatmapCell[]): void {
    TestBed.configureTestingModule({ imports: [Heatmap] });
    fixture = TestBed.createComponent(Heatmap);
    fixture.componentRef.setInput('cells', cells);
    fixture.detectChanges();
  }

  it('renders exactly as many cells as given, without truncating or padding the grid', () => {
    const cells = Array.from({ length: 21 }, (_, index) =>
      cell({ date: `2026-09-${String(index + 1).padStart(2, '0')}` }),
    );
    render(cells);

    expect(fixture.nativeElement.querySelectorAll('.heatmap__cell').length).toBe(21);
  });

  it('renders every day with the border color when there are no active habits', () => {
    const cells = Array.from({ length: 7 }, (_, index) =>
      cell({ date: `2026-09-0${index + 1}`, level: 0, completedCount: 0 }),
    );
    render(cells);

    const rendered: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.heatmap__cell'));
    for (const el of rendered) {
      expect(el.style.background).toBe('var(--border)');
    }
  });

  it('renders a fully completed day (level 4) with the highest heat color', () => {
    const cells = Array.from({ length: 7 }, (_, index) =>
      cell({ date: `2026-09-0${index + 1}`, level: 4, completedCount: 1 }),
    );
    render(cells);

    const rendered: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.heatmap__cell'));
    for (const el of rendered) {
      expect(el.style.background).toBe('var(--heat4)');
    }
  });

  it('sets a title attribute with the date and the completed habit count', () => {
    render([cell({ date: '2026-09-07', level: 2, completedCount: 2 })]);

    const el: HTMLElement = fixture.nativeElement.querySelector('.heatmap__cell');
    expect(el.title).toContain('2026-09-07');
    expect(el.title).toContain('2');
  });
});
