import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  BadgeComponent,
  ColorVariant,
  LanguageSwitcherComponent,
  ThemeSwitcherComponent,
  TranslatePipe
} from '@shared';

@Component({
  selector: 'app-platform-topbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    BadgeComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
    TranslatePipe
  ],
  templateUrl: './platform-topbar.component.html'
})
export class PlatformTopbarComponent {
  private auth = inject(AuthService);

  readonly badgeVariantInfo = ColorVariant.INFO;
  readonly userEmail = computed(() => this.auth.user()?.email || '');
  readonly userInitial = computed(() => (this.userEmail() || 'S').charAt(0).toUpperCase());

  readonly menuItems: ReadonlyArray<{ path: string; labelKey: string }> = [
    { path: '/platform/tenants', labelKey: 'PLATFORM_TENANT_MANAGEMENT' },
    { path: '/platform/users', labelKey: 'PLATFORM_GLOBAL_USERS' },
    { path: '/platform/health', labelKey: 'PLATFORM_SYSTEM_HEALTH' },
    { path: '/platform/audit-logs', labelKey: 'PLATFORM_AUDIT_TRAIL' },
    { path: '/platform/admins', labelKey: 'PLATFORM_ADMINS_TITLE' }
  ];

  logout() {
    this.auth.logout();
  }
}
