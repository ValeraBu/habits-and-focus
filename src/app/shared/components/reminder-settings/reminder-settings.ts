import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { TimePicker } from '../time-picker/time-picker';

@Component({
  selector: 'app-reminder-settings',
  imports: [TimePicker],
  templateUrl: './reminder-settings.html',
  styleUrl: './reminder-settings.scss',
})
export class ReminderSettings {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly notifications = inject(NotificationService);

  readonly isOpen = signal(false);
  readonly isTimePickerOpen = signal(false);

  toggle(): void {
    this.isOpen.update((open) => !open);
    if (!this.isOpen()) {
      this.isTimePickerOpen.set(false);
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.isTimePickerOpen.set(false);
  }

  toggleTimePicker(): void {
    this.isTimePickerOpen.update((open) => !open);
  }

  toggleReminderEnabled(): void {
    this.notifications.setReminderEnabled(!this.notifications.reminderEnabled());
  }

  onTimeChange(time: string): void {
    this.notifications.setReminderTime(time);
  }

  requestPermission(): void {
    void this.notifications.requestPermission();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isTimePickerOpen()) {
      this.isTimePickerOpen.set(false);
      return;
    }
    this.close();
  }
}
