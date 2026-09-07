import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('returns the fallback when the key is missing', () => {
    expect(service.get('missing-key', 'fallback')).toBe('fallback');
  });

  it('stores and retrieves a value', () => {
    service.set('habit-hub:test', { a: 1, b: 'two' });
    expect(service.get('habit-hub:test', null)).toEqual({ a: 1, b: 'two' });
  });

  it('returns the fallback when stored JSON is corrupted', () => {
    localStorage.setItem('habit-hub:corrupted', '{not valid json');
    expect(service.get('habit-hub:corrupted', 'fallback')).toBe('fallback');
  });

  it('returns the fallback when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('unavailable');
    });

    expect(service.get('habit-hub:any', 'fallback')).toBe('fallback');
  });

  it('does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => service.set('habit-hub:any', 'value')).not.toThrow();
  });
});
