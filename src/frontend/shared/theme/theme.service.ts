import { Injectable, inject, signal, computed } from '@angular/core';
import { LayoutId, ShapeId, ThemeId, ThemeMode } from '../enums';
import {
  DEFAULT_THEME_ID,
  isLayoutId,
  isShapeId,
  isThemeId,
  resolveLayout,
  resolveShape
} from './theme-registry';
import { TENANT_THEME_API } from './tenant-theme-api';

/** Per-user light/dark MODE (back-compat key). */
const THEME_STORAGE_KEY = 'openerp_theme';
/** Per-tenant theme id cache. */
const THEME_ID_STORAGE_KEY = 'openerp_theme_id';
/** Per-user shape (corner scale) preference; absent = follow the theme. */
const SHAPE_STORAGE_KEY = 'openerp_shape';
/** Per-user menu placement preference; absent = follow the theme. */
const LAYOUT_STORAGE_KEY = 'openerp_layout';
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

  private shapeSignal = signal<ShapeId | null>(this.readCachedShape());
  /** Raw shape preference; `null`/`AUTO` means "follow the colour theme". */
  public shapePreference = this.shapeSignal.asReadonly();

  private layoutSignal = signal<LayoutId | null>(this.readCachedLayout());
  /** Raw menu-placement preference; `null`/`AUTO` means "follow the theme". */
  public layoutPreference = this.layoutSignal.asReadonly();

  /** Corner scale actually applied (user pick, else the theme default). */
  public shape = computed(() => resolveShape(this.themeIdSignal(), this.shapeSignal()));

  /** Menu placement actually applied (user pick, else the theme default). */
  public navLayout = computed(() => resolveLayout(this.themeIdSignal(), this.layoutSignal()));

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
   * Per-user shape (corner scale). `AUTO`/`null` clears the override so the
   * colour theme's own default applies again.
   */
  setShape(shape: ShapeId | null): void {
    if (!this.initialized) {
      this.init();
    }
    const preference = shape === ShapeId.AUTO ? null : shape;
    this.shapeSignal.set(preference);
    this.writePreference(SHAPE_STORAGE_KEY, preference);
    this.applyTheme();
  }

  /**
   * Per-user menu placement. `AUTO`/`null` clears the override so the colour
   * theme's own default applies again.
   */
  setLayout(layout: LayoutId | null): void {
    if (!this.initialized) {
      this.init();
    }
    const preference = layout === LayoutId.AUTO ? null : layout;
    this.layoutSignal.set(preference);
    this.writePreference(LAYOUT_STORAGE_KEY, preference);
    this.applyTheme();
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

  private readCachedShape(): ShapeId | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const cached = localStorage.getItem(SHAPE_STORAGE_KEY);
    return isShapeId(cached) && cached !== ShapeId.AUTO ? cached : null;
  }

  private readCachedLayout(): LayoutId | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const cached = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return isLayoutId(cached) && cached !== LayoutId.AUTO ? cached : null;
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
    root.setAttribute('data-shape', this.shape());
    root.setAttribute('data-layout', this.navLayout());
    root.setAttribute('data-mode', dark ? 'dark' : 'light');
    root.classList.toggle('dark', dark);
    root.classList.toggle(IONIC_DARK_CLASS, dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  }
}
