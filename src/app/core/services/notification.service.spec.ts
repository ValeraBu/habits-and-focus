import { TestBed } from '@angular/core/testing';
import { HabitService, NewHabitInput } from '../../features/habit-tracker/services/habit.service';
import { STORAGE_KEYS } from '../models/storage-schema';
import { NotificationService } from './notification.service';

const newHabit: NewHabitInput = {
  name: 'Прочитать 15 страниц',
  category: 'reading',
  icon: 'reading',
  color: 'coral',
  targetPerDay: 15,
  unit: 'страниц',
};

class MockNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = vi.fn(async () => MockNotification.permission);
  static instances: { title: string; body?: string }[] = [];

  constructor(title: string, options?: NotificationOptions) {
    MockNotification.instances.push({ title, body: options?.body });
  }
}

describe('NotificationService', () => {
  let habitService: HabitService;
  let service: NotificationService;

  beforeEach(() => {
    localStorage.clear();
    MockNotification.permission = 'default';
    MockNotification.requestPermission = vi.fn(async () => MockNotification.permission);
    MockNotification.instances = [];
    vi.stubGlobal('Notification', MockNotification);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T19:59:30'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function setup(): void {
    TestBed.configureTestingModule({});
    habitService = TestBed.inject(HabitService);
    service = TestBed.inject(NotificationService);
  }

  it('defaults to disabled, 20:00, and reflects the current browser permission', () => {
    MockNotification.permission = 'denied';
    setup();

    expect(service.reminderEnabled()).toBe(false);
    expect(service.reminderTime()).toBe('20:00');
    expect(service.permissionStatus()).toBe('denied');
  });

  it('persists reminderEnabled/reminderTime and restores them after a reload', () => {
    setup();
    service.setReminderEnabled(true);
    service.setReminderTime('09:30');

    expect(localStorage.getItem(STORAGE_KEYS.reminderEnabled)).toBe('true');
    expect(localStorage.getItem(STORAGE_KEYS.reminderTime)).toBe(JSON.stringify('09:30'));

    TestBed.resetTestingModule();
    setup();

    expect(service.reminderEnabled()).toBe(true);
    expect(service.reminderTime()).toBe('09:30');
  });

  it('requestPermission asks the browser and updates permissionStatus reactively', async () => {
    MockNotification.permission = 'granted';
    setup();

    await service.requestPermission();

    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);
    expect(service.permissionStatus()).toBe('granted');
  });

  it('shows a notification when enabled, granted, the time matches and habits are incomplete', () => {
    MockNotification.permission = 'granted';
    setup();
    habitService.addHabit(newHabit);
    service.setReminderEnabled(true);

    vi.advanceTimersByTime(60_000); // 19:59:30 -> 20:00:30, matches "20:00"

    expect(MockNotification.instances.length).toBe(1);
    expect(MockNotification.instances[0].title).toBe('Habit & Focus Hub');
    expect(MockNotification.instances[0].body).toBe('Не выполнено 1 из 1 привычек сегодня');
  });

  it('does not notify again the same day even if the check fires again at a matching moment', () => {
    MockNotification.permission = 'granted';
    setup();
    habitService.addHabit(newHabit);
    service.setReminderEnabled(true);

    vi.advanceTimersByTime(60_000);
    expect(MockNotification.instances.length).toBe(1);

    vi.setSystemTime(new Date('2026-09-04T20:00:45'));
    vi.advanceTimersByTime(60_000);

    expect(MockNotification.instances.length).toBe(1);
  });

  it('does not notify when every habit is already completed', () => {
    MockNotification.permission = 'granted';
    setup();
    const habit = habitService.addHabit(newHabit);
    habitService.logProgress(habit.id, habit.targetPerDay);
    service.setReminderEnabled(true);

    vi.advanceTimersByTime(60_000);

    expect(MockNotification.instances.length).toBe(0);
  });

  it('a same-day check with nothing to report does not block a later real notification that day', () => {
    MockNotification.permission = 'granted';
    setup();
    const habit = habitService.addHabit(newHabit);
    habitService.logProgress(habit.id, habit.targetPerDay); // fully completed already
    service.setReminderEnabled(true);

    vi.advanceTimersByTime(60_000); // 20:00 check: nothing incomplete, no notification shown
    expect(MockNotification.instances.length).toBe(0);

    habitService.logProgress(habit.id, 0); // undo completion
    service.setReminderTime('20:05');
    vi.setSystemTime(new Date('2026-09-04T20:04:30'));
    vi.advanceTimersByTime(60_000); // 20:05 check, same calendar day

    expect(MockNotification.instances.length).toBe(1);
  });

  it('does not notify when permission is not granted', () => {
    MockNotification.permission = 'default';
    setup();
    habitService.addHabit(newHabit);
    service.setReminderEnabled(true);

    vi.advanceTimersByTime(60_000);

    expect(MockNotification.instances.length).toBe(0);
  });

  it('stops checking once the reminder is turned back off', () => {
    MockNotification.permission = 'granted';
    setup();
    habitService.addHabit(newHabit);
    service.setReminderEnabled(true);
    service.setReminderEnabled(false);

    vi.advanceTimersByTime(60_000);

    expect(MockNotification.instances.length).toBe(0);
  });
});
