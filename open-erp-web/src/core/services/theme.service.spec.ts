import { ThemeService, AppTheme } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  // Track classList operations on document.documentElement
  let classListSpy: { add: jasmine.Spy; remove: jasmine.Spy; classes: Set<string> };

  beforeEach(() => {
    localStorage.clear();

    // Spy on document.documentElement classList
    classListSpy = {
      add: jasmine.createSpy('add'),
      remove: jasmine.createSpy('remove'),
      classes: new Set<string>(),
    };
    classListSpy.add.and.callFake((cls: string) => classListSpy.classes.add(cls));
    classListSpy.remove.and.callFake((cls: string) => classListSpy.classes.delete(cls));

    Object.defineProperty(document.documentElement, 'classList', {
      value: classListSpy,
      configurable: true,
    });
  });

  function createService(mediaDark = false): ThemeService {
    // Stub window.matchMedia
    spyOn(window, 'matchMedia').and.returnValue({
      matches: mediaDark,
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    } as unknown as MediaQueryList);
    return new ThemeService();
  }

  describe('initial theme', () => {
    it('defaults to "auto" when localStorage is empty', () => {
      service = createService();
      expect(service.theme()).toBe('auto');
    });

    it('loads persisted theme from localStorage', () => {
      localStorage.setItem('app.theme', 'dark');
      service = createService();
      expect(service.theme()).toBe('dark');
    });

    it('ignores unknown localStorage value and falls back to "auto"', () => {
      localStorage.setItem('app.theme', 'invalid');
      service = createService();
      expect(service.theme()).toBe('auto');
    });
  });

  describe('applyTheme', () => {
    it('adds "dark" class for dark theme', () => {
      service = createService();
      service.applyTheme('dark');
      expect(classListSpy.add).toHaveBeenCalledWith('dark');
    });

    it('removes "dark" class for light theme', () => {
      service = createService();
      service.applyTheme('light');
      expect(classListSpy.remove).toHaveBeenCalledWith('dark');
    });

    it('adds "dark" class for auto theme when system is dark', () => {
      service = createService(true);
      service.applyTheme('auto');
      expect(classListSpy.add).toHaveBeenCalledWith('dark');
    });

    it('removes "dark" class for auto theme when system is light', () => {
      service = createService(false);
      service.applyTheme('auto');
      expect(classListSpy.remove).toHaveBeenCalledWith('dark');
    });

    it('persists theme to localStorage by default', () => {
      service = createService();
      service.applyTheme('dark');
      expect(localStorage.getItem('app.theme')).toBe('dark');
    });

    it('does not persist when persist=false', () => {
      service = createService();
      service.applyTheme('dark', false);
      expect(localStorage.getItem('app.theme')).toBeNull();
    });

    it('updates the theme signal', () => {
      service = createService();
      service.applyTheme('light');
      expect(service.theme()).toBe('light');
    });
  });

  describe('theme signal', () => {
    it('reflects theme changes', () => {
      service = createService();
      const themes: AppTheme[] = ['light', 'dark', 'auto'];
      themes.forEach((t) => {
        service.applyTheme(t);
        expect(service.theme()).toBe(t);
      });
    });
  });
});
