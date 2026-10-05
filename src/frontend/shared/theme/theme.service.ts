import { Injectable, inject, signal, computed } from '@angular/core';
import { ThemeId, ThemeMode } from '../enums';
import { DEFAULT_THEME_ID, isThemeId, navLayoutFor } from './theme-registry';
import { TENANT_THEME_API } from './tenant-theme-api';

/** Per-user light/dark MODE (back-compat key). */
const THEME_STORAGE_KEY = 'openerp_theme';
/** Per-tenant theme id cache. */
const THEME_ID_STORAGE_KEY = 'openerp_theme_id';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const IONIC_DARK_CLASS = 'ion-palette-dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private api = inject(TENANT_THEME_API, { optional: true });

  private modeSignal = signal<ThemeMode>(ThemeMode.SYSTEM);
  public mode = this.modeSignal.asReadonly();

  private themeIdSignal = signal<ThemeId>(this.readCachedThemeId());
  public themeId = this.themeIdSignal.asReadonly();

  /** Where the section menu lives for the current theme (side | top | right). */
  public navLayout = computed(() => navLayoutFor(this.themeIdSignal()));

  private initialized = false;
  private mediaQuery: MediaQueryList | null = null;

  init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    const mode = saved === ThemeMode.LIGHT || saved === ThemeMode.DARK
      ? (saved as ThemeMode)
      : ThemeMode.SYSTEM;
    this.modeSignal.set(mode);

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
      this.mediaQuery.addEventListener('change', () => {
        if (this.modeSignal() === ThemeMode.SYSTEM) {
          this.applyTheme();
        }
      });
    }

    this.applyTheme();
  }

  setMode(mode: ThemeMode): void {
    if (!this.initialized) {
      this.init();
    }
    this.modeSignal.set(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    this.applyTheme();
  }

  /**
   * Selects the tenant theme. Applies + caches locally, then (when the user may
   * manage tenant settings) persists it through the tenant UI-preferences API.
   */
  setTheme(id: ThemeId): void {
    if (!this.initialized) {
      this.init();
    }
    this.applyTenantTheme(id);
    if (this.api?.canManage()) {
      this.api.updateTheme(id).subscribe({ error: () => {} });
    }
  }

  /**
   * Fetches the tenant theme once after login and applies it. Safe to call on
   * every authenticated transition; it does not overwrite on failure.
   */
  loadTenantTheme(): void {
    if (!this.api) {
      return;
    }
    this.api.fetchTheme().subscribe({
      next: (id) => {
        if (isThemeId(id)) {
          this.applyTenantTheme(id);
        }
      },
      error: () => {}
    });
  }

  private applyTenantTheme(id: ThemeId): void {
    this.themeIdSignal.set(id);
    localStorage.setItem(THEME_ID_STORAGE_KEY, id);
    this.applyTheme();
  }

  private readCachedThemeId(): ThemeId {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_THEME_ID;
    }
    const cached = localStorage.getItem(THEME_ID_STORAGE_KEY);
    return isThemeId(cached) ? cached : DEFAULT_THEME_ID;
  }

  private isDark(): boolean {
    const mode = this.modeSignal();
    if (mode === ThemeMode.DARK) {
      return true;
    }
    if (mode === ThemeMode.LIGHT) {
      return false;
    }
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia(DARK_MEDIA_QUERY).matches;
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const dark = this.isDark();
    const root = document.documentElement;
    root.setAttribute('data-theme', this.themeIdSignal());
    root.setAttribute('data-mode', dark ? 'dark' : 'light');
    root.classList.toggle('dark', dark);
    root.classList.toggle(IONIC_DARK_CLASS, dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  }
}
