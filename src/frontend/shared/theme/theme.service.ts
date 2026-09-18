import { Injectable, signal } from '@angular/core';
import { ThemeMode } from '../enums';

const THEME_STORAGE_KEY = 'openerp_theme';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const IONIC_DARK_CLASS = 'ion-palette-dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private modeSignal = signal<ThemeMode>(ThemeMode.SYSTEM);
  public mode = this.modeSignal.asReadonly();

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
    root.classList.toggle('dark', dark);
    root.classList.toggle(IONIC_DARK_CLASS, dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  }
}
