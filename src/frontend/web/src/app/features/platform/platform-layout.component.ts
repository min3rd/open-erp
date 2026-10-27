import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconName, SectionNavComponent, SectionNavItem } from '@shared';
import { PlatformTopbarComponent } from './platform-topbar/platform-topbar.component';

@Component({
  selector: 'app-platform-layout',
  standalone: true,
  imports: [RouterOutlet, SectionNavComponent, PlatformTopbarComponent],
  templateUrl: './platform-layout.component.html'
})
export class PlatformLayoutComponent {
  private auth = inject(AuthService);

  private readonly allMenuItems: ReadonlyArray<SectionNavItem> = [
    { path: '/platform/tenants', labelKey: 'PLATFORM_TENANT_MANAGEMENT', icon: IconName.HOME },
    { path: '/platform/plugins', labelKey: 'PLUGIN_PORTAL_TITLE', icon: IconName.PACKAGE },
    { path: '/platform/plugin-credentials', labelKey: 'PLUGIN_CREDENTIALS_TITLE', icon: IconName.KEY },
    { path: '/platform/tenant-private-plugins', labelKey: 'PLUGIN_TENANT_PRIVATE_TITLE', icon: IconName.LOCK },
    { path: '/platform/users', labelKey: 'PLATFORM_GLOBAL_USERS', icon: IconName.USER },
    { path: '/platform/health', labelKey: 'PLATFORM_SYSTEM_HEALTH', icon: IconName.MONITOR },
    { path: '/platform/audit-logs', labelKey: 'PLATFORM_AUDIT_TRAIL', icon: IconName.FILE_TEXT },
    { path: '/platform/admins', labelKey: 'PLATFORM_ADMINS_TITLE', icon: IconName.SHIELD }
  ];

  private readonly superAdminOnlyPaths = new Set([
    '/platform/admins',
    '/platform/plugins',
    '/platform/plugin-credentials'
  ]);

  readonly menuItems = computed(() =>
    this.auth.isPlatformSuperAdmin()
      ? this.allMenuItems
      : this.allMenuItems.filter((item) => !this.superAdminOnlyPaths.has(item.path ?? ''))
  );
}
