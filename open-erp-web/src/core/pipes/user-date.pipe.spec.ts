import { UserDatePipe } from './user-date.pipe';
import { UserSettingsService } from '../services/user-settings.service';

/** Minimal stub that returns a fixed config signal */
function makeSettings(overrides: Partial<ReturnType<UserSettingsService['config']>> = {}) {
  const cfg = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    timezone: 'UTC',
    locale: 'en',
    ...overrides,
  };
  return { config: () => cfg } as unknown as UserSettingsService;
}

function makePipe(settings: UserSettingsService): UserDatePipe {
  const pipe = new UserDatePipe();
  (pipe as any).userSettings = settings;
  return pipe;
}

describe('UserDatePipe', () => {
  const ISO = '2024-03-15T10:30:00.000Z'; // 15 March 2024 10:30 UTC

  describe('null / invalid inputs', () => {
    it('returns "-" for null', () => {
      const pipe = makePipe(makeSettings());
      expect(pipe.transform(null)).toBe('-');
    });

    it('returns "-" for undefined', () => {
      const pipe = makePipe(makeSettings());
      expect(pipe.transform(undefined)).toBe('-');
    });

    it('returns "-" for empty string', () => {
      const pipe = makePipe(makeSettings());
      expect(pipe.transform('')).toBe('-');
    });

    it('returns "-" for invalid date string', () => {
      const pipe = makePipe(makeSettings());
      expect(pipe.transform('not-a-date')).toBe('-');
    });
  });

  describe('date mode (default)', () => {
    it('formats DD/MM/YYYY', () => {
      const pipe = makePipe(makeSettings({ dateFormat: 'DD/MM/YYYY' }));
      expect(pipe.transform(ISO, 'date')).toBe('15/03/2024');
    });

    it('formats MM/DD/YYYY', () => {
      const pipe = makePipe(makeSettings({ dateFormat: 'MM/DD/YYYY' }));
      expect(pipe.transform(ISO, 'date')).toBe('03/15/2024');
    });

    it('formats YYYY-MM-DD', () => {
      const pipe = makePipe(makeSettings({ dateFormat: 'YYYY-MM-DD' }));
      expect(pipe.transform(ISO, 'date')).toBe('2024-03-15');
    });

    it('"short" mode behaves like "date"', () => {
      const pipe = makePipe(makeSettings({ dateFormat: 'DD/MM/YYYY' }));
      expect(pipe.transform(ISO, 'short')).toBe('15/03/2024');
    });
  });

  describe('time mode', () => {
    it('formats 24h time', () => {
      const pipe = makePipe(makeSettings({ timeFormat: 'HH:mm', timezone: 'UTC' }));
      const result = pipe.transform(ISO, 'time');
      expect(result).toBe('10:30');
    });
  });

  describe('datetime mode', () => {
    it('combines date and time', () => {
      const pipe = makePipe(
        makeSettings({ dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', timezone: 'UTC' }),
      );
      const result = pipe.transform(ISO, 'datetime');
      expect(result).toBe('15/03/2024 10:30');
    });
  });

  describe('relative mode', () => {
    it('returns "now" for very recent dates', () => {
      const pipe = makePipe(makeSettings());
      expect(pipe.transform(new Date().toISOString(), 'relative')).toBe('now');
    });

    it('returns minutes ago notation', () => {
      const pipe = makePipe(makeSettings());
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
      expect(pipe.transform(fiveMinutesAgo, 'relative')).toBe('5m');
    });

    it('returns hours notation', () => {
      const pipe = makePipe(makeSettings());
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
      expect(pipe.transform(twoHoursAgo, 'relative')).toBe('2h');
    });

    it('returns days notation for dates older than 24h but less than 7d', () => {
      const pipe = makePipe(makeSettings());
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
      expect(pipe.transform(threeDaysAgo, 'relative')).toBe('3d');
    });

    it('falls back to formatted date for old dates', () => {
      const pipe = makePipe(makeSettings({ dateFormat: 'DD/MM/YYYY', timezone: 'UTC' }));
      expect(pipe.transform('2020-01-10T00:00:00.000Z', 'relative')).toBe('10/01/2020');
    });
  });

  describe('timezone support', () => {
    it('adjusts date display for given timezone', () => {
      // 2024-03-15T22:00:00Z in UTC → 2024-03-16 in UTC+7
      const pipe = makePipe(
        makeSettings({ dateFormat: 'DD/MM/YYYY', timezone: 'Asia/Ho_Chi_Minh' }),
      );
      const result = pipe.transform('2024-03-15T22:00:00.000Z', 'date');
      expect(result).toBe('16/03/2024');
    });

    it('falls back to browser timezone for invalid tz string', () => {
      const pipe = makePipe(makeSettings({ timezone: 'Invalid/Timezone' }));
      // Just verify it doesn't throw and returns a non-empty string
      const result = pipe.transform(ISO, 'date');
      expect(result).not.toBe('-');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('accepts Date objects', () => {
    it('handles Date instance', () => {
      const pipe = makePipe(makeSettings({ dateFormat: 'YYYY-MM-DD', timezone: 'UTC' }));
      const d = new Date('2024-06-01T00:00:00.000Z');
      expect(pipe.transform(d, 'date')).toBe('2024-06-01');
    });
  });
});
