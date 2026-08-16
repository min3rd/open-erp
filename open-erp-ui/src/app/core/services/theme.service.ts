import { Injectable, signal, effect, inject } from '@angular/core';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private configService = inject(AppConfigService);

  isDarkMode = signal<boolean>(false);

  constructor() {
    const savedTheme = localStorage.getItem('erp_theme');
    if (savedTheme) {
      this.isDarkMode.set(savedTheme === 'dark');
    } else {
      const defaultTheme = this.configService.themes().defaultTheme;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(defaultTheme === 'dark' || prefersDark);
    }

    effect(() => {
      const dark = this.isDarkMode();
      if (dark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('erp_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('erp_theme', 'light');
      }
      this.configService.applyThemePalette(dark);
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update(prev => !prev);
  }
}
