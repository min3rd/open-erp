import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  BadgeComponent,
  ColorVariant,
  LanguageSwitcherComponent,
  PlatformAdminRole,
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

  readonly platformRole = this.auth.platformRole;
  readonly isSuperAdmin = this.auth.isPlatformSuperAdmin;
  readonly roleBadgeKey = computed(() =>
    this.platformRole() === PlatformAdminRole.SUPPORT_ENGINEER
      ? 'PLATFORM_ROLE_BADGE_SUPPORT_ENGINEER'
      : 'PLATFORM_ROLE_BADGE_SUPER_ADMIN'
  );

  private readonly allMenuItems: ReadonlyArray<{ path: string; labelKey: string }> = [
    { path: '/platform/tenants', labelKey: 'PLATFORM_TENANT_MANAGEMENT' },
    { path: '/platform/users', labelKey: 'PLATFORM_GLOBAL_USERS' },
    { path: '/platform/health', labelKey: 'PLATFORM_SYSTEM_HEALTH' },
    { path: '/platform/audit-logs', labelKey: 'PLATFORM_AUDIT_TRAIL' },
    { path: '/platform/admins', labelKey: 'PLATFORM_ADMINS_TITLE' }
  ];

  readonly menuItems = computed(() =>
    this.isSuperAdmin()
      ? this.allMenuItems
      : this.allMenuItems.filter((item) => item.path !== '/platform/admins')
  );

  logout() {
    this.auth.logout();
  }
}
