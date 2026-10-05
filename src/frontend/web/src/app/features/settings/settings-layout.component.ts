import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PluginService } from '../../core/services/plugin.service';
import { TopbarComponent, SectionNavComponent, NotificationBannerComponent, PluginNotification } from '@shared';

interface SettingsMenuItem {
  path: string;
  labelKey: string;
  permission: string;
}

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, SectionNavComponent, NotificationBannerComponent],
  templateUrl: './settings-layout.component.html'
})
export class SettingsLayoutComponent implements OnInit {
  auth = inject(AuthService);
  private pluginService = inject(PluginService);
  private router = inject(Router);

  readonly notifications = signal<PluginNotification[]>([]);

  readonly notificationUnreadCount = computed(() =>
    this.notifications().filter(item => !item.read_at).length
  );

  readonly notificationDetailPath = computed(() =>
    this.auth.hasPermission('core:plugin:read') !== false ? '/settings/plugins' : null
  );

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.pluginService.notifications().subscribe({
      next: response => this.notifications.set(response.data?.items ?? []),
      error: () => this.notifications.set([]),
    });
  }

  onMarkNotificationRead(id: string): void {
    this.pluginService.markNotificationRead(id).subscribe({
      next: () => this.loadNotifications(),
      error: () => {},
    });
  }

  onMarkAllNotificationsRead(): void {
    this.pluginService.markAllNotificationsRead().subscribe({
      next: () => this.loadNotifications(),
      error: () => {},
    });
  }

  onOpenNotificationDetail(): void {
    const path = this.notificationDetailPath();
    if (path) {
      this.router.navigateByUrl(path);
    }
  }

  readonly allMenuItems: ReadonlyArray<SettingsMenuItem> = [
    { path: '/settings/roles', labelKey: 'IAM_ROLE_MANAGEMENT', permission: 'core:role:manage' },
    { path: '/settings/organization', labelKey: 'ORGANIZATION_STRUCTURE', permission: 'core:organization:manage' },
    { path: '/settings/members', labelKey: 'ORGANIZATION_MEMBERSHIPS', permission: 'core:organization:manage' },
    { path: '/settings/branch-assignments', labelKey: 'ORGANIZATION_BRANCH_ASSIGNMENT_TITLE', permission: 'core:organization:manage' },
    { path: '/settings/sample-records', labelKey: 'SAMPLE_RECORDS_TITLE', permission: 'core:sample-record:read' },
    { path: '/settings/plugins', labelKey: 'PLUGIN_MARKETPLACE_TITLE', permission: 'core:plugin:read' },
    { path: '/settings/plugin-credentials', labelKey: 'PLUGIN_TENANT_CREDENTIALS_TITLE', permission: 'core:plugin:credential:manage' }
  ];

  // Fallback: when the Sprint 02 `permissions` claim is absent from the JWT,
  // `hasPermission()` returns `null` and every menu item stays visible.
  readonly menuItems = computed(() =>
    this.allMenuItems.filter((item) => this.auth.hasPermission(item.permission) !== false)
  );

  openAccount() {
    this.router.navigate(['/account/detail']);
  }

  logout() {
    this.auth.logout();
  }
}
