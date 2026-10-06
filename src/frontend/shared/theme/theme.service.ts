import { Injectable, inject, signal, computed, WritableSignal } from '@angular/core';
import { LayoutId, ShapeId, ThemeId, ThemeMode } from '../enums';
import {
  DEFAULT_THEME_ID,
  isLayoutId,
  isShapeId,
  isThemeId,
  resolveLayout,
  resolveShape
} from './theme-registry';
import { UI_PREFERENCES_API } from './ui-preferences-api';

/** Per-user light/dark MODE (back-compat key). */
const THEME_STORAGE_KEY = 'openerp_theme';
/** Last effective colour theme (FOUC cache + tenant-default fallback). */
const THEME_ID_STORAGE_KEY = 'openerp_theme_id';
/** The user's own colour theme; absent = follow the tenant default. */
const USER_THEME_STORAGE_KEY = 'openerp_theme_user';
/** Per-user shape (corner scale) preference; absent = follow the theme. */
const SHAPE_STORAGE_KEY = 'openerp_shape';
/** Per-user menu placement preference; absent = follow the theme. */
const LAYOUT_STORAGE_KEY = 'openerp_layout';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const IONIC_DARK_CLASS = 'ion-palette-dark';

/**
 * Appearance state (Sprint 04). Four independent axes:
 *
 *   theme   colour palette   user pick, else the TENANT default (owner-set)
 *   shape   corner scale     user pick, else the theme's own default
 *   layout  menu placement   user pick, else the theme's own default
 *   mode    light/dark       user pick, else the OS preference
 *
 * Every user choice is cached in localStorage (instant paint, FOUC script) and
 * persisted to the user's account through `UI_PREFERENCES_API`.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private api = inject(UI_PREFERENCES_API, { optional: true });

  private modeSignal = signal<ThemeMode>(ThemeMode.SYSTEM);
  public mode = this.modeSignal.asReadonly();

  /** Tenant-wide default theme (owner/admin sets it). */
  private tenantThemeSignal = signal<ThemeId>(this.readCached(THEME_ID_STORAGE_KEY, isThemeId) ?? DEFAULT_THEME_ID);
  public tenantTheme = this.tenantThemeSignal.asReadonly();

  /** The user's own colour theme; `null` = follow the tenant default. */
  private userThemeSignal = signal<ThemeId | null>(this.readCached(USER_THEME_STORAGE_KEY, isThemeId));
  public themePreference = this.userThemeSignal.asReadonly();

  private shapeSignal = signal<ShapeId | null>(this.readCached(SHAPE_STORAGE_KEY, isShapeId));
  /** Raw shape preference; `null`/`AUTO` means "follow the colour theme". */
  public shapePreference = this.shapeSignal.asReadonly();

  private layoutSignal = signal<LayoutId | null>(this.readCached(LAYOUT_STORAGE_KEY, isLayoutId));
  /** Raw menu-placement preference; `null`/`AUTO` means "follow the theme". */
  public layoutPreference = this.layoutSignal.asReadonly();

  /** Effective colour theme: the user's pick, else the tenant default. */
  public themeId = computed(() => this.userThemeSignal() ?? this.tenantThemeSignal());

  /** Corner scale actually applied (user pick, else the theme default). */
  public shape = computed(() => resolveShape(this.themeId(), this.shapeSignal()));

  /** Menu placement actually applied (user pick, else the theme default). */
  public navLayout = computed(() => resolveLayout(this.themeId(), this.layoutSignal()));

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
    this.ensureInitialized();
    this.modeSignal.set(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    this.applyTheme();
    this.flashThemeTransition();
    this.persist();
  }

  /**
   * Per-user colour theme. Applies + caches locally, then saves it on the
   * user's account; the tenant default keeps applying to users without a pick.
   */
  setTheme(id: ThemeId): void {
    this.ensureInitialized();
    this.userThemeSignal.set(id);
    localStorage.setItem(USER_THEME_STORAGE_KEY, id);
    this.applyTheme();
    this.flashThemeTransition();
    this.persist();
  }

  /** Clears the user's own theme so the tenant default applies again. */
  clearTheme(): void {
    this.ensureInitialized();
    this.userThemeSignal.set(null);
    localStorage.removeItem(USER_THEME_STORAGE_KEY);
    this.applyTheme();
    this.flashThemeTransition();
    this.persist();
  }

  /**
   * Sets the TENANT-wide default theme (owner/admin only; the server enforces
   * the permission). Users without their own pick follow it immediately.
   */
  setTenantTheme(id: ThemeId): void {
    this.ensureInitialized();
    this.tenantThemeSignal.set(id);
    localStorage.setItem(THEME_ID_STORAGE_KEY, id);
    this.applyTheme();
    this.flashThemeTransition();
    this.api?.updateTenantTheme(id).subscribe({ error: () => {} });
  }

  /**
   * Per-user shape (corner scale). `AUTO`/`null` clears the override so the
   * colour theme's own default applies again.
   */
  setShape(shape: ShapeId | null): void {
    this.setPreference(this.shapeSignal, SHAPE_STORAGE_KEY, shape === ShapeId.AUTO ? null : shape);
  }

  /**
   * Per-user menu placement. `AUTO`/`null` clears the override so the colour
   * theme's own default applies again.
   */
  setLayout(layout: LayoutId | null): void {
    this.setPreference(this.layoutSignal, LAYOUT_STORAGE_KEY, layout === LayoutId.AUTO ? null : layout);
  }

  /** Applies + caches a nullable preference and saves it on the account. */
  private setPreference<T extends string>(
    target: WritableSignal<T | null>,
    key: string,
    value: T | null
  ): void {
    this.ensureInitialized();
    target.set(value);
    this.writePreference(key, value);
    this.applyTheme();
    this.flashThemeTransition();
    this.persist();
  }

  /**
   * Fetches the user's saved preferences (plus the tenant default) once after
   * login and applies them. Safe to call on every authenticated transition; a
   * failure keeps the locally cached values.
   */
  loadPreferences(): void {
    if (!this.api) {
      return;
    }
    this.api.fetch().subscribe({
      next: (preferences) => this.applyPreferences(preferences),
      error: () => {}
    });
  }

  /** Applies a preference payload (also used by tests). */
  applyPreferences(preferences: {
    theme: ThemeId | null;
    shape: ShapeId | null;
    layout: LayoutId | null;
    mode: ThemeMode | null;
    tenantTheme: ThemeId;
  }): void {
    this.ensureInitialized();
    if (isThemeId(preferences.tenantTheme)) {
      this.tenantThemeSignal.set(preferences.tenantTheme);
      localStorage.setItem(THEME_ID_STORAGE_KEY, preferences.tenantTheme);
    }
    this.userThemeSignal.set(isThemeId(preferences.theme) ? preferences.theme : null);
    this.writePreference(USER_THEME_STORAGE_KEY, this.userThemeSignal());

    this.shapeSignal.set(isShapeId(preferences.shape) ? preferences.shape : null);
    this.writePreference(SHAPE_STORAGE_KEY, this.shapeSignal());

    this.layoutSignal.set(isLayoutId(preferences.layout) ? preferences.layout : null);
    this.writePreference(LAYOUT_STORAGE_KEY, this.layoutSignal());

    this.modeSignal.set(preferences.mode === ThemeMode.LIGHT || preferences.mode === ThemeMode.DARK
      ? preferences.mode
      : ThemeMode.SYSTEM);
    localStorage.setItem(THEME_STORAGE_KEY, this.modeSignal());

    this.applyTheme();
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.init();
    }
  }

  /** Saves the user's four choices in one call (full replace, null = default). */
  private persist(): void {
    if (!this.api) {
      return;
    }
    const mode = this.modeSignal();
    this.api.update({
      theme: this.userThemeSignal(),
      shape: this.shapeSignal(),
      layout: this.layoutSignal(),
      mode: mode === ThemeMode.SYSTEM ? null : mode
    }).subscribe({ error: () => {} });
  }

  private writePreference(key: string, value: string | null): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  }

  private readCached<T extends string>(key: string, isValid: (value: unknown) => value is T): T | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const cached = localStorage.getItem(key);
    return isValid(cached) ? cached : null;
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
    const effectiveTheme = this.themeId();
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-shape', this.shape());
    root.setAttribute('data-layout', this.navLayout());
    root.setAttribute('data-mode', dark ? 'dark' : 'light');
    root.classList.toggle('dark', dark);
    root.classList.toggle(IONIC_DARK_CLASS, dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_ID_STORAGE_KEY, effectiveTheme);
    }
  }

  /**
   * Cross-fades colours for one beat when the user switches theme/shape/mode,
   * so the change reads as a transition instead of a hard snap (BUG-130).
   */
  private flashThemeTransition(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.classList.add('op-theme-switching');
    window.setTimeout(() => root.classList.remove('op-theme-switching'), 300);
  }
}
