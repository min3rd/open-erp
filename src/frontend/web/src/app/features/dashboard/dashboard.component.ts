import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PluginService } from '../../core/services/plugin.service';
import { AccountDrawerComponent } from './account-drawer/account-drawer.component';
import {
  I18nService,
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  TopbarComponent,
  NotificationBannerComponent,
  ColorVariant,
  PluginNotification,
} from '@shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AccountDrawerComponent,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    BadgeComponent,
    TopbarComponent,
    NotificationBannerComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private pluginService = inject(PluginService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly badgeVariantSuccess = ColorVariant.SUCCESS;

  readonly notifications = signal<PluginNotification[]>([]);

  readonly notificationUnreadCount = computed(() =>
    this.notifications().filter(item => !item.read_at).length
  );

  // Only link to the plugin settings page when the user may open it.
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

  readonly deniedNotice = computed(() => {
    const denied = this.route.snapshot.queryParamMap.get('denied');
    return denied ? this.i18n.t(denied) : '';
  });

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly isAccountDrawerOpen = computed(() => this.currentUrl().startsWith('/account'));

  openAccount() {
    this.router.navigateByUrl('/account/detail');
  }

  closeAccount() {
    this.router.navigateByUrl('/dashboard');
  }
}
