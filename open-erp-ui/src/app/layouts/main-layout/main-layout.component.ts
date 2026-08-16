import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslocoModule],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  langService = inject(LanguageService);

  isSidebarCollapsed = signal<boolean>(false);
  isUserMenuOpen = signal<boolean>(false);
  isLangMenuOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
    this.isLangMenuOpen.set(false);
  }

  toggleLangMenu(): void {
    this.isLangMenuOpen.update(v => !v);
    this.isUserMenuOpen.set(false);
  }

  selectLanguage(lang: string): void {
    this.langService.setLanguage(lang);
    this.isLangMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }
}
