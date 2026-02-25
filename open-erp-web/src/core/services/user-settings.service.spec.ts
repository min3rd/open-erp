import { UserSettingsService, DEFAULT_DATE_TIME_CONFIG } from './user-settings.service';

describe('UserSettingsService', () => {
  let service: UserSettingsService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    service = new UserSettingsService();
  });

  describe('initial config', () => {
    it('returns defaults when localStorage is empty', () => {
      const cfg = service.config();
      expect(cfg.dateFormat).toBe('DD/MM/YYYY');
      expect(cfg.timeFormat).toBe('HH:mm');
      expect(cfg.locale).toBe('vi');
    });

    it('loads persisted config from localStorage', () => {
      localStorage.setItem(
        'app.dateTimeConfig',
        JSON.stringify({ dateFormat: 'YYYY-MM-DD', timeFormat: 'hh:mm A', timezone: 'UTC', locale: 'en' }),
      );
      const svc = new UserSettingsService();
      const cfg = svc.config();
      expect(cfg.dateFormat).toBe('YYYY-MM-DD');
      expect(cfg.timeFormat).toBe('hh:mm A');
      expect(cfg.locale).toBe('en');
    });

    it('merges partial localStorage data with defaults', () => {
      localStorage.setItem('app.dateTimeConfig', JSON.stringify({ dateFormat: 'MM/DD/YYYY' }));
      const svc = new UserSettingsService();
      const cfg = svc.config();
      expect(cfg.dateFormat).toBe('MM/DD/YYYY');
      expect(cfg.timeFormat).toBe(DEFAULT_DATE_TIME_CONFIG.timeFormat);
    });

    it('ignores corrupted localStorage data and falls back to defaults', () => {
      localStorage.setItem('app.dateTimeConfig', 'NOT_VALID_JSON');
      const svc = new UserSettingsService();
      const cfg = svc.config();
      expect(cfg.dateFormat).toBe('DD/MM/YYYY');
    });
  });

  describe('applyFromMeSettings', () => {
    it('updates dateFormat', () => {
      service.applyFromMeSettings({ dateFormat: 'MM/DD/YYYY' });
      expect(service.config().dateFormat).toBe('MM/DD/YYYY');
    });

    it('updates timeFormat', () => {
      service.applyFromMeSettings({ timeFormat: 'hh:mm A' });
      expect(service.config().timeFormat).toBe('hh:mm A');
    });

    it('updates timezone', () => {
      service.applyFromMeSettings({ timezone: 'America/New_York' });
      expect(service.config().timezone).toBe('America/New_York');
    });

    it('uses locale field when present', () => {
      service.applyFromMeSettings({ locale: 'en', language: 'vi' });
      expect(service.config().locale).toBe('en');
    });

    it('falls back to language field when locale is absent', () => {
      service.applyFromMeSettings({ language: 'en' });
      expect(service.config().locale).toBe('en');
    });

    it('persists updated config to localStorage', () => {
      service.applyFromMeSettings({ dateFormat: 'YYYY-MM-DD' });
      const stored = JSON.parse(localStorage.getItem('app.dateTimeConfig') ?? '{}');
      expect(stored.dateFormat).toBe('YYYY-MM-DD');
    });

    it('preserves existing fields not provided in the update', () => {
      service.applyFromMeSettings({ timezone: 'UTC' });
      expect(service.config().dateFormat).toBe('DD/MM/YYYY');
    });
  });
});
