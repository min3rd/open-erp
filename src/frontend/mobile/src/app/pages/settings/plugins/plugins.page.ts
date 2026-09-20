import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { PluginService } from '../../../core/plugin.service';
import {
  BadgeComponent,
  ColorVariant,
  I18nService,
  PluginMarketplaceItem,
  PluginNotification,
  TranslatePipe,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-mobile-plugins',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonList,
    IonItem,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    BadgeComponent,
    TranslatePipe
  ],
  templateUrl: './plugins.page.html'
})
export class MobilePluginsPage implements OnInit {
  private pluginService = inject(PluginService);
  private i18n = inject(I18nService);

  readonly colorSuccess = ColorVariant.SUCCESS;
  readonly colorWarning = ColorVariant.WARNING;
  readonly colorDanger = ColorVariant.DANGER;

  items = signal<PluginMarketplaceItem[]>([]);
  notifications = signal<PluginNotification[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.pluginService.marketplace().subscribe({
      next: res => {
        this.items.set(res.data?.items || []);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
    this.pluginService.notifications(true).subscribe({
      next: res => this.notifications.set(res.data?.items || []),
      error: () => this.notifications.set([])
    });
  }

  refresh(event: CustomEvent): void {
    this.pluginService.marketplace().subscribe({
      next: res => {
        this.items.set(res.data?.items || []);
        (event.target as HTMLIonRefresherElement).complete();
      },
      error: err => {
        this.error.set(apiMessage(this.i18n, err));
        (event.target as HTMLIonRefresherElement).complete();
      }
    });
  }

  blockedCount(): number {
    return this.items().filter(item => item.catalog_status === 'BLOCKED').length;
  }

  updateCount(): number {
    return this.items().filter(item => item.update_available).length;
  }

  statusVariant(status?: string | null): ColorVariant {
    switch (status) {
      case 'ACTIVE':
        return ColorVariant.SUCCESS;
      case 'INSTALLING':
      case 'UPGRADING':
      case 'INSTALL_FAILED':
      case 'ROLLBACK_FAILED':
        return ColorVariant.WARNING;
      case 'UNINSTALLED':
      case 'INACTIVE':
        return ColorVariant.DEFAULT;
      default:
        return ColorVariant.DEFAULT;
    }
  }
}
