import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'app.theme';

/**
 * Service that manages the application's visual theme (light / dark / auto).
 *
 * - On construction it immediately applies the theme stored in localStorage,
 *   defaulting to 'auto' (system preference) when no value is found.
 * - When theme is 'auto' it listens for OS-level `prefers-color-scheme`
 *   changes and updates the DOM accordingly.
 * - Exposes a signal so components can react to theme changes.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _theme = signal<AppTheme>(this.loadFromStorage());
  /** Read-only signal exposing the active theme preference. */
  readonly theme = this._theme.asReadonly();

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private mediaQueryListener = (e: MediaQueryListEvent) => {
    if (this._theme() === 'auto') {
      this.applyToDom(e.matches ? 'dark' : 'light');
    }
  };

  constructor() {
    this.applyTheme(this._theme(), false);
    this.mediaQuery.addEventListener('change', this.mediaQueryListener);
  }

  /**
   * Applies a theme, writes it to localStorage and optionally removes the
   * media-query listener when switching away from 'auto'.
   *
   * @param theme  The desired theme value.
   * @param persist  Whether to persist the new value to localStorage (default: true).
   */
  applyTheme(theme: AppTheme, persist = true): void {
    this._theme.set(theme);
    if (persist) {
      this.saveToStorage(theme);
    }

    if (theme === 'auto') {
      const prefersDark = this.mediaQuery.matches;
      this.applyToDom(prefersDark ? 'dark' : 'light');
    } else {
      this.applyToDom(theme);
    }
  }

  private applyToDom(effective: 'light' | 'dark'): void {
    const root = document.documentElement;
    if (effective === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  private loadFromStorage(): AppTheme {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
      if (raw === 'light' || raw === 'dark' || raw === 'auto') {
        return raw;
      }
    } catch {
      // ignore – fall through to default
    }
    return 'auto';
  }

  private saveToStorage(theme: AppTheme): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }
}
