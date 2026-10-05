import { Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColorVariant, NotificationSeverity } from '../../enums';
import { PluginNotification } from '../../models';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { BadgeComponent } from '../badge/badge.component';

/**
 * Topbar notification bell with an unread badge and a bottom-right popup list.
 * Presentational only: the host loads notifications and reacts to the
 * markRead / markAllRead / openDetail outputs.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterLink, TranslatePipe, BadgeComponent],
  templateUrl: './notification-bell.component.html'
})
export class NotificationBellComponent {
  private host = inject(ElementRef<HTMLElement>);

  items = input<PluginNotification[]>([]);
  unreadCount = input<number>(0);
  detailPath = input<string | null>(null);

  markRead = output<string>();
  markAllRead = output<void>();
  openDetail = output<string>();

  readonly open = signal(false);

  readonly badgeVariant = computed(() =>
    this.items().some(item => !item.read_at && item.severity === NotificationSeverity.CRITICAL)
      ? ColorVariant.DANGER
      : ColorVariant.WARNING
  );

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }

  toggle(): void {
    this.open.update(value => !value);
  }

  onMarkRead(id: string, event: Event): void {
    event.stopPropagation();
    this.markRead.emit(id);
  }

  onMarkAllRead(): void {
    this.markAllRead.emit();
  }

  onOpenDetail(type: string): void {
    this.open.set(false);
    this.openDetail.emit(type);
  }
}
