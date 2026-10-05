import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  NavController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import { PluginService } from '../../core/plugin.service';
import {
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  NotificationBannerComponent,
  ColorVariant,
  PluginNotification,
} from '@shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    BadgeComponent,
    NotificationBannerComponent
  ],
  templateUrl: './dashboard.page.html'
})
export class DashboardPage implements OnInit {
  auth = inject(AuthService);
  navCtrl = inject(NavController);
  private pluginService = inject(PluginService);

  readonly badgeInfo = ColorVariant.INFO;
  readonly notifications = signal<PluginNotification[]>([]);

  // Only link to the plugin settings page when the user may open it.
  readonly notificationDetailPath = computed(() =>
    this.auth.hasPermission('core:plugin:read') !== false ? '/settings/plugins' : null
  );

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.pluginService.notifications(true).subscribe({
      next: res => this.notifications.set(res.data?.items || []),
      error: () => this.notifications.set([])
    });
  }

  openPlugins() {
    this.navCtrl.navigateForward(['/settings/plugins']);
  }

  openAccount() {
    this.navCtrl.navigateForward(['/account']);
  }
}
