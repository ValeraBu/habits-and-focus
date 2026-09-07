import { Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';

export interface DropdownOption {
  value: string | null;
  label: string;
}

// Rough cap on how tall the option panel can get before it needs its own
// scroll — used only to decide whether there's enough room to open downward.
const ESTIMATED_PANEL_HEIGHT = 220;

@Component({
  selector: 'app-dropdown-select',
  templateUrl: './dropdown-select.html',
  styleUrl: './dropdown-select.scss',
})
export class DropdownSelect {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly options = input.required<DropdownOption[]>();
  readonly value = input<string | null>(null);
  readonly placeholder = input('Выберите');

  readonly valueChange = output<string | null>();

  readonly isOpen = signal(false);
  readonly opensUpward = signal(false);

  readonly selectedLabel = computed(
    () =>
      this.options().find((option) => option.value === this.value())?.label ?? this.placeholder(),
  );

  toggle(): void {
    if (this.isOpen()) {
      this.close();
      return;
    }
    this.opensUpward.set(this.shouldOpenUpward());
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  select(value: string | null): void {
    this.valueChange.emit(value);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  private shouldOpenUpward(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    return spaceBelow < ESTIMATED_PANEL_HEIGHT && spaceAbove > spaceBelow;
  }
}
