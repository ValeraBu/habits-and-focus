import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownOption, DropdownSelect } from './dropdown-select';

const OPTIONS: DropdownOption[] = [
  { value: null, label: 'Без привычки' },
  { value: 'a', label: 'Прочитать 15 страниц' },
  { value: 'b', label: 'Связать 2 ряда' },
];

describe('DropdownSelect', () => {
  let fixture: ComponentFixture<DropdownSelect>;
  let component: DropdownSelect;

  function render(value: string | null = null): void {
    TestBed.configureTestingModule({ imports: [DropdownSelect] });
    fixture = TestBed.createComponent(DropdownSelect);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
  }

  function trigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.dropdown__trigger');
  }

  function optionButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.dropdown__option'));
  }

  it('shows the label of the currently selected option', () => {
    render('a');
    expect(trigger().textContent).toContain('Прочитать 15 страниц');
  });

  it('falls back to the placeholder when nothing matches the value', () => {
    render('unknown-id');
    expect(component.selectedLabel()).toBe('Выберите');
  });

  it('opens the panel on trigger click', () => {
    render(null);
    expect(component.isOpen()).toBe(false);

    trigger().click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(optionButtons().length).toBe(OPTIONS.length);
  });

  it('emits the picked value and closes the panel on option click', () => {
    render(null);
    trigger().click();
    fixture.detectChanges();

    const spy = vi.fn();
    component.valueChange.subscribe(spy);

    optionButtons()[1].click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith('a');
    expect(component.isOpen()).toBe(false);
  });

  it('closes when a click happens outside the component', () => {
    render(null);
    trigger().click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    document.body.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });

  it('closes on Escape', () => {
    render(null);
    trigger().click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });
});
