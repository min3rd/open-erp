import { Injectable, signal, effect, inject } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { STORAGE_KEYS } from '../constants/permission.constant';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private configService = inject(AppConfigService);

  isDarkMode = signal<boolean>(false);

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) {
        this.isDarkMode.set(savedTheme === 'dark');
      } else {
        const defaultTheme = this.configService.themes().defaultTheme;
        const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDarkMode.set(defaultTheme === 'dark' || prefersDark);
      }
    }

    effect(() => {
      const dark = this.isDarkMode();
      if (typeof document !== 'undefined') {
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.THEME, dark ? 'dark' : 'light');
      }
      this.configService.applyThemePalette(dark);
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update((prev: boolean) => !prev);
  }
}
