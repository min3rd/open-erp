import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import {
  BadgeComponent,
  ColorVariant,
  DrawerComponent,
  SharpButtonComponent,
  TranslatePipe,
} from '@shared';
import { NotificationDto } from './notification.model';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notification-screen',
  standalone: true,
  imports: [CommonModule, TranslatePipe, BadgeComponent, SharpButtonComponent, DrawerComponent],
  templateUrl: './notification-screen.component.html',
})
export class NotificationScreenComponent implements OnInit {
  private service = inject(NotificationService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notifications = signal<NotificationDto[]>([]);
  readonly selected = signal<NotificationDto | null>(null);
  readonly unread = computed(() => this.notifications().filter((item) => !item.read_at).length);

  @Input()
  set apiBaseUrl(value: string) {
    this.service.setRuntimeOrigin(value);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list().subscribe({
      next: (response) => {
        this.notifications.set(response.data?.items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('PLUGIN_IN_APP_NOTIFICATION_LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  open(item: NotificationDto): void {
    this.selected.set(item);
  }

  close(): void {
    this.selected.set(null);
  }

  markRead(item: NotificationDto): void {
    if (item.read_at) {
      return;
    }
    this.service.markRead(item.id).subscribe({
      next: () => {
        window.dispatchEvent(new CustomEvent('op:notifications-changed'));
        this.selected.update((current) => current?.id === item.id
          ? { ...current, read_at: new Date().toISOString() }
          : current);
        this.load();
      },
      error: () => this.error.set('PLUGIN_IN_APP_NOTIFICATION_SAVE_ERROR'),
    });
  }

  markAllRead(): void {
    this.service.markAllRead().subscribe({
      next: () => {
        window.dispatchEvent(new CustomEvent('op:notifications-changed'));
        this.load();
      },
      error: () => this.error.set('PLUGIN_IN_APP_NOTIFICATION_SAVE_ERROR'),
    });
  }

  badge(level: string): ColorVariant {
    switch (level) {
      case 'WARN': return ColorVariant.WARNING;
      case 'ERROR': return ColorVariant.DANGER;
      default: return ColorVariant.INFO;
    }
  }
}
