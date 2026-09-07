import { todayISO, isSameDay, daysBetween } from './date.utils';

describe('date.utils', () => {
  describe('todayISO', () => {
    it('returns the current date in YYYY-MM-DD format', () => {
      expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('isSameDay', () => {
    it('returns true for two identical ISO dates', () => {
      expect(isSameDay('2026-09-04', '2026-09-04')).toBe(true);
    });

    it('returns true for the same day with different time components', () => {
      expect(isSameDay('2026-09-04T08:00:00', '2026-09-04T23:59:00')).toBe(true);
    });

    it('returns false for different days', () => {
      expect(isSameDay('2026-09-04', '2026-09-05')).toBe(false);
    });
  });

  describe('daysBetween', () => {
    it('returns 0 for the same date', () => {
      expect(daysBetween('2026-09-04', '2026-09-04')).toBe(0);
    });

    it('returns a positive number when the second date is later', () => {
      expect(daysBetween('2026-09-01', '2026-09-05')).toBe(4);
    });

    it('returns a negative number when the second date is earlier', () => {
      expect(daysBetween('2026-09-05', '2026-09-01')).toBe(-4);
    });

    it('counts across a month boundary', () => {
      expect(daysBetween('2026-08-30', '2026-09-02')).toBe(3);
    });
  });
});
