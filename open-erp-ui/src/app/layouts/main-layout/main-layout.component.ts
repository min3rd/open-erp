import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AuthService,
  MaintenanceBannerComponent,
  ThemeToggleComponent,
  LanguageSelectorComponent,
  AvatarComponent
} from '@open-erp/shared';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoModule,
    MaintenanceBannerComponent,
    ThemeToggleComponent,
    LanguageSelectorComponent,
    AvatarComponent
  ],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  authService = inject(AuthService);

  isSidebarCollapsed = signal<boolean>(false);
  isUserMenuOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}
