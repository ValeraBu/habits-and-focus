import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

const ROW_HEIGHT = 36;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const COMMIT_DEBOUNCE_MS = 160;

function parseHHMM(value: string): [hours: number, minutes: number] {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value);
  if (!match) {
    return [0, 0];
  }
  const hours = Math.min(Math.max(Number(match[1]), 0), 23);
  const minutes = Math.min(Math.max(Number(match[2]), 0), 59);
  return [hours, minutes];
}

function formatHHMM(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.html',
  styleUrl: './time-picker.scss',
})
export class TimePicker implements OnInit, AfterViewInit {
  // Always parsed/formatted as 24-hour "HH:mm" ourselves — never delegated to
  // a native <input type="time">, whose displayed format follows OS/browser
  // locale (12h with AM/PM in the US, for example).
  readonly value = input.required<string>();
  readonly valueChange = output<string>();

  readonly hours = HOURS;
  readonly minutes = MINUTES;

  readonly selectedHour = signal(0);
  readonly selectedMinute = signal(0);

  private readonly hoursColumn = viewChild<ElementRef<HTMLElement>>('hoursColumn');
  private readonly minutesColumn = viewChild<ElementRef<HTMLElement>>('minutesColumn');

  private commitTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.commitTimeoutId !== null) {
        clearTimeout(this.commitTimeoutId);
      }
    });
  }

  ngOnInit(): void {
    const [hours, minutes] = parseHHMM(this.value());
    this.selectedHour.set(hours);
    this.selectedMinute.set(minutes);
  }

  ngAfterViewInit(): void {
    this.scrollToIndex(this.hoursColumn(), this.selectedHour(), false);
    this.scrollToIndex(this.minutesColumn(), this.selectedMinute(), false);
  }

  pad(value: number): string {
    return String(value).padStart(2, '0');
  }

  onHoursScroll(event: Event): void {
    const index = this.indexFromScrollTop((event.target as HTMLElement).scrollTop, this.hours.length);
    this.selectedHour.set(index);
    this.scheduleCommit();
  }

  onMinutesScroll(event: Event): void {
    const index = this.indexFromScrollTop(
      (event.target as HTMLElement).scrollTop,
      this.minutes.length,
    );
    this.selectedMinute.set(index);
    this.scheduleCommit();
  }

  selectHour(hour: number): void {
    this.scrollToIndex(this.hoursColumn(), hour, true);
  }

  selectMinute(minute: number): void {
    this.scrollToIndex(this.minutesColumn(), minute, true);
  }

  private indexFromScrollTop(scrollTop: number, length: number): number {
    const index = Math.round(scrollTop / ROW_HEIGHT);
    return Math.min(Math.max(index, 0), length - 1);
  }

  private scrollToIndex(
    columnRef: ElementRef<HTMLElement> | undefined,
    index: number,
    smooth: boolean,
  ): void {
    const top = index * ROW_HEIGHT;
    if (smooth) {
      columnRef?.nativeElement.scrollTo({ top, behavior: 'smooth' });
    } else {
      columnRef?.nativeElement.scrollTo({ top });
    }
  }

  private scheduleCommit(): void {
    if (this.commitTimeoutId !== null) {
      clearTimeout(this.commitTimeoutId);
    }
    this.commitTimeoutId = setTimeout(() => {
      this.commitTimeoutId = null;
      this.valueChange.emit(formatHHMM(this.selectedHour(), this.selectedMinute()));
    }, COMMIT_DEBOUNCE_MS);
  }
}
