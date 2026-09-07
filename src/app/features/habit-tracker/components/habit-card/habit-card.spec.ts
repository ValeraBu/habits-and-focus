import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HabitWithProgress } from '../../services/habit.service';
import { HabitCard, MAX_PROGRESS_VALUE } from './habit-card';

const baseHabit: HabitWithProgress = {
  id: '1',
  name: 'Прочитать 15 страниц',
  category: 'reading',
  icon: 'reading',
  color: 'coral',
  targetPerDay: 15,
  unit: 'страниц',
  createdAt: '2026-09-01T00:00:00.000Z',
  active: true,
  todayValue: 10,
  completedToday: false,
  streak: 0,
};

describe('HabitCard', () => {
  let fixture: ComponentFixture<HabitCard>;
  let component: HabitCard;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HabitCard] });
    fixture = TestBed.createComponent(HabitCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('habit', baseHabit);
    fixture.detectChanges();
  });

  it('emits progressLogged with the entered value when confirmed', () => {
    const spy = vi.fn();
    component.progressLogged.subscribe(spy);

    component.startEditingProgress();
    component.onProgressInput('22');
    component.confirmProgressEdit();

    expect(spy).toHaveBeenCalledWith(22);
    expect(component.isEditingProgress()).toBe(false);
  });

  it('does not emit progressLogged for a negative value', () => {
    const spy = vi.fn();
    component.progressLogged.subscribe(spy);

    component.startEditingProgress();
    component.onProgressInput('-5');
    component.confirmProgressEdit();

    expect(spy).not.toHaveBeenCalled();
  });

  it('does not emit progressLogged for a non-numeric value', () => {
    const spy = vi.fn();
    component.progressLogged.subscribe(spy);

    component.startEditingProgress();
    component.onProgressInput('abc');
    component.confirmProgressEdit();

    expect(spy).not.toHaveBeenCalled();
  });

  it('does not emit progressLogged for a value above the maximum', () => {
    const spy = vi.fn();
    component.progressLogged.subscribe(spy);

    component.startEditingProgress();
    component.onProgressInput(String(MAX_PROGRESS_VALUE + 1));
    component.confirmProgressEdit();

    expect(spy).not.toHaveBeenCalled();
  });

  it('treats an empty value as cancel, not zero', () => {
    const spy = vi.fn();
    component.progressLogged.subscribe(spy);

    component.startEditingProgress();
    component.onProgressInput('   ');
    component.confirmProgressEdit();

    expect(spy).not.toHaveBeenCalled();
  });

  it('cancelProgressEdit closes the input without emitting', () => {
    const spy = vi.fn();
    component.progressLogged.subscribe(spy);

    component.startEditingProgress();
    component.onProgressInput('22');
    component.cancelProgressEdit();

    expect(spy).not.toHaveBeenCalled();
    expect(component.isEditingProgress()).toBe(false);
  });
});
