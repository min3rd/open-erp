import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import {
  BadgeComponent,
  ColorVariant,
  PlatformAdminRole,
  TranslatePipe,
  UserMenuComponent
} from '@shared';

@Component({
  selector: 'app-platform-topbar',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    TranslatePipe,
    UserMenuComponent
  ],
  templateUrl: './platform-topbar.component.html'
})
export class PlatformTopbarComponent {
  private auth = inject(AuthService);

  readonly badgeVariantInfo = ColorVariant.INFO;
  readonly userEmail = computed(() => this.auth.user()?.email || '');

  readonly platformRole = this.auth.platformRole;
  readonly isSuperAdmin = this.auth.isPlatformSuperAdmin;
  readonly roleBadgeKey = computed(() =>
    this.platformRole() === PlatformAdminRole.SUPPORT_ENGINEER
      ? 'PLATFORM_ROLE_BADGE_SUPPORT_ENGINEER'
      : 'PLATFORM_ROLE_BADGE_SUPER_ADMIN'
  );

  logout() {
    this.auth.logout();
  }
}
