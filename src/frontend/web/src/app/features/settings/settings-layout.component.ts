import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PluginService } from '../../core/services/plugin.service';
import {
  DrawerComponent,
  IconComponent,
  IconName,
  IconNameValue,
  LayoutId,
  NotificationBannerComponent,
  PluginNotification,
  SectionNavComponent,
  SectionNavVariant,
  ThemeService,
  TopbarComponent,
  TranslatePipe
} from '@shared';

/** A settings menu entry: a leaf (path) or a group with children. */
interface SettingsMenuNode {
  path?: string;
  labelKey: string;
  icon?: IconNameValue;
  permission?: string;
  children?: SettingsMenuNode[];
}

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    TopbarComponent,
    SectionNavComponent,
    NotificationBannerComponent,
    DrawerComponent,
    IconComponent,
    TranslatePipe
  ],
  templateUrl: './settings-layout.component.html'
})
export class SettingsLayoutComponent implements OnInit {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  private pluginService = inject(PluginService);
  private router = inject(Router);

  /** Drawer layout: whether the section menu drawer is open. */
  readonly menuOpen = signal(false);

  /** Resolved menu placement (per-user preference, else the theme default). */
  readonly navTop = computed(() => this.theme.navLayout() === LayoutId.TOP);
  readonly navRight = computed(() => this.theme.navLayout() === LayoutId.RIGHT);
  readonly navDrawer = computed(() => this.theme.navLayout() === LayoutId.DRAWER);
  /** Side rail (left/right edge) instead of the bar/drawer. */
  readonly navRail = computed(() => !this.navTop() && !this.navDrawer());

  /** Menu markup for the current layout: icon rail, compact rail or top bar. */
  readonly navVariant = computed<SectionNavVariant>(() => {
    switch (this.theme.navLayout()) {
      case LayoutId.NARROW:
        return 'icons';
      case LayoutId.COMPACT:
        return 'compact';
      case LayoutId.TOP:
        return 'bar';
      default:
        return 'rail';
    }
  });

  /** Rail width for the current layout (narrow = icon strip). */
  readonly railWidth = computed(() => {
    switch (this.theme.navLayout()) {
      case LayoutId.NARROW:
        return 'lg:w-12';
      case LayoutId.COMPACT:
        return 'lg:w-40';
      default:
        return 'lg:w-56';
    }
  });

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

  /**
   * Menu tree: the top layout renders level 1 as dropdowns, every other layout
   * flattens it. Icons come from the shared IconName set (menu items must be
   * recognisable in the icon-only rail).
   */
  private readonly menuTree: ReadonlyArray<SettingsMenuNode> = [
    { path: '/settings/roles', labelKey: 'IAM_ROLE_MANAGEMENT', icon: IconName.SHIELD, permission: 'core:role:manage' },
    {
      labelKey: 'SETTINGS_GROUP_ORGANIZATION',
      icon: IconName.GRID,
      children: [
        { path: '/settings/organization', labelKey: 'ORGANIZATION_STRUCTURE', icon: IconName.GRID, permission: 'core:organization:manage' },
        { path: '/settings/members', labelKey: 'ORGANIZATION_MEMBERSHIPS', icon: IconName.USER, permission: 'core:organization:manage' },
        { path: '/settings/branch-assignments', labelKey: 'ORGANIZATION_BRANCH_ASSIGNMENT_TITLE', icon: IconName.HOME, permission: 'core:organization:manage' }
      ]
    },
    {
      labelKey: 'SETTINGS_GROUP_DATA',
      icon: IconName.FILE_TEXT,
      children: [
        { path: '/settings/sample-records', labelKey: 'SAMPLE_RECORDS_TITLE', icon: IconName.FILE_TEXT, permission: 'core:sample-record:read' }
      ]
    },
    {
      labelKey: 'SETTINGS_GROUP_SYSTEM',
      icon: IconName.PACKAGE,
      children: [
        { path: '/settings/plugins', labelKey: 'PLUGIN_MARKETPLACE_TITLE', icon: IconName.PACKAGE, permission: 'core:plugin:read' },
        { path: '/settings/plugin-credentials', labelKey: 'PLUGIN_TENANT_CREDENTIALS_TITLE', icon: IconName.KEY, permission: 'core:plugin:credential:manage' }
      ]
    }
  ];

  // Fallback: when the Sprint 02 `permissions` claim is absent from the JWT,
  // `hasPermission()` returns `null` and every menu item stays visible.
  readonly menuItems = computed(() => this.filterNodes(this.menuTree));

  private filterNodes(nodes: ReadonlyArray<SettingsMenuNode>): ReadonlyArray<SettingsMenuNode> {
    return nodes
      .map((node) => node.children
        ? { ...node, children: [...this.filterNodes(node.children)] }
        : node)
      .filter((node) => node.children
        ? node.children.length > 0
        : this.canSee(node.permission));
  }

  /** No permission on the node = visible to everyone (claim-absent fallback). */
  private canSee(permission?: string): boolean {
    return !permission || this.auth.hasPermission(permission) !== false;
  }

  openAccount() {
    this.router.navigate(['/account/detail']);
  }

  logout() {
    this.auth.logout();
  }
}
