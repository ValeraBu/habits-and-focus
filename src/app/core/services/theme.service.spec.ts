import { TestBed } from '@angular/core/testing';
import { STORAGE_KEYS } from '../models/storage-schema';
import { ThemeService } from './theme.service';

type ChangeListener = (event: { matches: boolean }) => void;

class FakeMediaQueryList {
  matches = false;
  private readonly listeners = new Set<ChangeListener>();

  addEventListener(_type: string, listener: ChangeListener): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: ChangeListener): void {
    this.listeners.delete(listener);
  }

  dispatch(matches: boolean): void {
    this.matches = matches;
    this.listeners.forEach((listener) => listener({ matches }));
  }
}

describe('ThemeService', () => {
  let fakeMedia: FakeMediaQueryList;

  beforeEach(() => {
    localStorage.clear();
    fakeMedia = new FakeMediaQueryList();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue(fakeMedia as unknown as MediaQueryList),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function inject_(): ThemeService {
    TestBed.configureTestingModule({});
    return TestBed.inject(ThemeService);
  }

  it('defaults to "system" when nothing was saved before', () => {
    const service = inject_();
    expect(service.theme()).toBe('system');
  });

  it('saves the selected theme and restores it after a reload', () => {
    const service = inject_();
    service.setTheme('dark');

    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe(JSON.stringify('dark'));

    TestBed.resetTestingModule();
    const restored = inject_();

    expect(restored.theme()).toBe('dark');
  });

  it('keeps the theme key separate from habit/log/session data', () => {
    expect(STORAGE_KEYS.theme).not.toBe(STORAGE_KEYS.habits);
    expect(STORAGE_KEYS.theme).not.toBe(STORAGE_KEYS.logs);
    expect(STORAGE_KEYS.theme).not.toBe(STORAGE_KEYS.sessions);
  });

  it('resolves explicit light/dark themes regardless of system preference', () => {
    fakeMedia.matches = true;
    const service = inject_();

    service.setTheme('light');
    expect(service.resolvedTheme()).toBe('light');

    service.setTheme('dark');
    expect(service.resolvedTheme()).toBe('dark');
  });

  it('resolves "system" from the current OS preference at startup', () => {
    fakeMedia.matches = true;
    const service = inject_();
    service.setTheme('system');

    expect(service.resolvedTheme()).toBe('dark');
  });

  it('reacts live to a change in prefers-color-scheme while on "system"', () => {
    const service = inject_();
    service.setTheme('system');
    expect(service.resolvedTheme()).toBe('light');

    fakeMedia.dispatch(true);
    expect(service.resolvedTheme()).toBe('dark');

    fakeMedia.dispatch(false);
    expect(service.resolvedTheme()).toBe('light');
  });

  it('ignores prefers-color-scheme changes once an explicit theme is set', () => {
    const service = inject_();
    service.setTheme('light');

    fakeMedia.dispatch(true);

    expect(service.resolvedTheme()).toBe('light');
  });

  it('toggleTheme flips between light and dark based on the resolved theme', () => {
    const service = inject_();
    service.setTheme('light');

    service.toggleTheme();
    expect(service.theme()).toBe('dark');

    service.toggleTheme();
    expect(service.theme()).toBe('light');
  });
});
