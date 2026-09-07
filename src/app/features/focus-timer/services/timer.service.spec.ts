import { TestBed } from '@angular/core/testing';
import { STORAGE_KEYS } from '../../../core/models/storage-schema';
import { FocusSession } from '../models/focus-session.model';
import { SoundService } from './sound.service';
import { BREAK_DURATION_MINUTES, FOCUS_DURATION_MINUTES, TimerService } from './timer.service';

describe('TimerService', () => {
  let service: TimerService;
  let sound: SoundService;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    sound = TestBed.inject(SoundService);
    vi.spyOn(sound, 'play').mockImplementation(() => undefined);
    service = TestBed.inject(TimerService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with the default focus duration and is not running', () => {
    expect(service.mode()).toBe('focus');
    expect(service.remainingSeconds()).toBe(FOCUS_DURATION_MINUTES * 60);
    expect(service.isRunning()).toBe(false);
  });

  it('start() counts remainingSeconds down each tick', () => {
    service.start();
    vi.advanceTimersByTime(3000);

    expect(service.remainingSeconds()).toBe(FOCUS_DURATION_MINUTES * 60 - 3);
    expect(service.isRunning()).toBe(true);
  });

  it('pause() stops the countdown where it is', () => {
    service.start();
    vi.advanceTimersByTime(2000);
    service.pause();
    const remainingAtPause = service.remainingSeconds();

    vi.advanceTimersByTime(5000);

    expect(service.remainingSeconds()).toBe(remainingAtPause);
    expect(service.isRunning()).toBe(false);
  });

  it('reset() returns remainingSeconds to the default duration of the current mode', () => {
    service.start();
    vi.advanceTimersByTime(5000);
    service.reset();

    expect(service.remainingSeconds()).toBe(FOCUS_DURATION_MINUTES * 60);
    expect(service.isRunning()).toBe(false);
  });

  it('does not create a session or advance sessionsToday on pause', () => {
    service.start();
    vi.advanceTimersByTime(2000);
    service.pause();

    expect(service.sessions()).toEqual([]);
    expect(service.sessionsToday()).toBe(0);
  });

  it('does not create a session or advance sessionsToday on reset', () => {
    service.start();
    vi.advanceTimersByTime(2000);
    service.reset();

    expect(service.sessions()).toEqual([]);
    expect(service.sessionsToday()).toBe(0);
  });

  it('creates a completed FocusSession, switches mode, plays a sound and persists it when the session finishes', () => {
    service.start();
    vi.advanceTimersByTime(FOCUS_DURATION_MINUTES * 60 * 1000);

    expect(service.isRunning()).toBe(false);
    expect(service.mode()).toBe('break');
    expect(service.sessions().length).toBe(1);

    const session = service.sessions()[0];
    expect(session.type).toBe('focus');
    expect(session.durationMinutes).toBe(FOCUS_DURATION_MINUTES);
    expect(session.startedAt).toBeTruthy();
    expect(session.completedAt).toBeTruthy();
    expect(sound.play).toHaveBeenCalledTimes(1);
    expect(sound.play).toHaveBeenCalledWith('complete');

    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.sessions) ?? '[]',
    ) as FocusSession[];
    expect(stored.length).toBe(1);
    expect(stored[0].id).toBe(session.id);
  });

  it('automatically switches to the break duration after a focus session completes', () => {
    service.start();
    vi.advanceTimersByTime(FOCUS_DURATION_MINUTES * 60 * 1000);

    expect(service.remainingSeconds()).toBe(BREAK_DURATION_MINUTES * 60);
  });

  it('increases sessionsToday only after a full completion, not before', () => {
    service.start();
    vi.advanceTimersByTime(2000);
    expect(service.sessionsToday()).toBe(0);

    vi.advanceTimersByTime(FOCUS_DURATION_MINUTES * 60 * 1000 - 2000);
    expect(service.sessionsToday()).toBe(1);
  });

  describe('setDuration', () => {
    it('updates the duration for the current mode and recomputes remainingSeconds immediately', () => {
      service.setDuration(45);

      expect(service.focusDurationMinutes()).toBe(45);
      expect(service.remainingSeconds()).toBe(45 * 60);
      expect(service.totalSeconds()).toBe(45 * 60);
    });

    it('keeps focus and break durations independent', () => {
      service.setDuration(45);
      service.setMode('break');
      service.setDuration(10);

      expect(service.breakDurationMinutes()).toBe(10);
      expect(service.focusDurationMinutes()).toBe(45);
    });

    it('is ignored while the timer is running, to avoid silently changing an active session', () => {
      service.start();
      vi.advanceTimersByTime(3000);

      service.setDuration(60);

      expect(service.focusDurationMinutes()).toBe(FOCUS_DURATION_MINUTES);
      expect(service.remainingSeconds()).toBe(FOCUS_DURATION_MINUTES * 60 - 3);
    });
  });

  describe('persistence across a reload', () => {
    function reload(): TimerService {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      sound = TestBed.inject(SoundService);
      vi.spyOn(sound, 'play').mockImplementation(() => undefined);
      return TestBed.inject(TimerService);
    }

    it('persists a timestamp-based anchor, not a raw remainingSeconds countdown', () => {
      service.start();
      vi.advanceTimersByTime(5000);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.timerState) ?? 'null');
      expect(stored.isRunning).toBe(true);
      expect(stored.startedAt).toBeTruthy();
      expect(typeof stored.accumulatedSeconds).toBe('number');
      expect(stored.remainingSeconds).toBeUndefined();
    });

    it('restores a running timer with remainingSeconds reduced by the time the app was closed', () => {
      service.start();
      vi.advanceTimersByTime(10_000); // 10s while the tab was open and ticking

      TestBed.resetTestingModule();
      vi.advanceTimersByTime(20_000); // another 20s pass with the app fully closed, nothing ticking

      const restored = reload();

      expect(restored.isRunning()).toBe(true);
      expect(restored.remainingSeconds()).toBe(FOCUS_DURATION_MINUTES * 60 - 30);
    });

    it('restores a paused timer at the same remainingSeconds, without resuming the countdown', () => {
      service.start();
      vi.advanceTimersByTime(15_000);
      service.pause();
      const pausedRemaining = service.remainingSeconds();

      const restored = reload();

      expect(restored.isRunning()).toBe(false);
      expect(restored.remainingSeconds()).toBe(pausedRemaining);

      vi.advanceTimersByTime(10_000);
      expect(restored.remainingSeconds()).toBe(pausedRemaining);
    });

    it('restores mode, duration and the selected habit even when idle', () => {
      service.setMode('break');
      service.setDuration(10);
      service.selectHabit('habit-1');

      const restored = reload();

      expect(restored.mode()).toBe('break');
      expect(restored.breakDurationMinutes()).toBe(10);
      expect(restored.selectedHabitId()).toBe('habit-1');
      expect(restored.isRunning()).toBe(false);
    });

    it('completes the session on restore if the full duration elapsed while the app was closed, without playing a sound', () => {
      service.start();

      TestBed.resetTestingModule();
      vi.advanceTimersByTime(FOCUS_DURATION_MINUTES * 60 * 1000 + 5000); // whole session + a bit, "while closed"

      const restored = reload();

      expect(restored.isRunning()).toBe(false);
      expect(restored.mode()).toBe('break');
      expect(restored.sessions().length).toBe(1);
      expect(restored.sessions()[0].type).toBe('focus');
      expect(restored.lastCompletedSession()?.id).toBe(restored.sessions()[0].id);
      expect(sound.play).not.toHaveBeenCalled();
    });
  });
});
