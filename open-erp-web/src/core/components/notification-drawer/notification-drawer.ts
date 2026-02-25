import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification-service';
import {
  NotificationDto,
  NotificationType,
} from '../../interfaces/notification.types';
import { UserDatePipe } from '../../pipes/user-date.pipe';

@Component({
  selector: 'notification-drawer',
  imports: [
    CommonModule,
    TranslocoModule,
    DrawerModule,
    ButtonModule,
    AvatarModule,
    SkeletonModule,
    TooltipModule,
    BadgeModule,
    UserDatePipe,
  ],
  templateUrl: './notification-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationDrawer implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  visible = input<boolean>(false);
  isMobile = input<boolean>(false);
  visibleChange = output<boolean>();

  private _unsubscribeAll = new Subject<void>();

  // Expose enum to template
  NotificationType = NotificationType;

  notifications: NotificationDto[] = [];
  loading = false;
  loadingMore = false;

  page = 1;
  pageSize = 20;
  total = 0;
  get hasMore(): boolean {
    return this.notifications.length < this.total;
  }

  activeTab = signal<string>('all');
  newNotificationIds = new Set<string>();

  readonly tabs = [
    { value: 'all', label: 'notification.tabAll' },
    { value: NotificationType.GENERAL, label: 'notification.tabGeneral' },
    { value: NotificationType.INVITATION, label: 'notification.tabInvitation' },
    { value: NotificationType.TASK, label: 'notification.tabTask' },
    { value: NotificationType.SYSTEM, label: 'notification.tabSystem' },
  ];

  get unreadCount(): number {
    return this.notificationService.unreadCount;
  }

  ngOnInit(): void {
    // Subscribe to new real-time notifications
    this.notificationService.newNotification$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((notification) => {
        this.newNotificationIds.add(notification.id);
        this.notifications = [notification, ...this.notifications];
        this.total++;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  /** Called when drawer becomes visible */
  onOpen(): void {
    this.page = 1;
    this.notifications = [];
    this._loadNotifications(false);
  }

  onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
    if (value) {
      this.onOpen();
    }
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    this.page = 1;
    this.notifications = [];
    this._loadNotifications(false);
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const threshold = 100;
    if (
      el.scrollTop + el.clientHeight >= el.scrollHeight - threshold &&
      this.hasMore &&
      !this.loadingMore
    ) {
      this.page++;
      this._loadNotifications(true);
    }
  }

  onNotificationClick(notification: NotificationDto): void {
    // Mark as read if unread
    if (!notification.isRead) {
      this._optimisticMarkRead(notification);
      this.notificationService.markRead([notification.id]).subscribe();
    }

    // Navigate to target route if available
    const targetRoute = notification.metadata?.['targetRoute'];
    if (targetRoute) {
      this.router.navigateByUrl(targetRoute).catch(() => {
        // Route not found — show placeholder (notification stays open)
      });
    }
    this.newNotificationIds.delete(notification.id);
    this.cdr.markForCheck();
  }

  onMarkRead(notification: NotificationDto, event: Event): void {
    event.stopPropagation();
    this._optimisticMarkRead(notification);
    this.notificationService.markRead([notification.id]).subscribe();
  }

  onMarkUnread(notification: NotificationDto, event: Event): void {
    event.stopPropagation();
    notification.isRead = false;
    notification.readAt = null;
    this.notificationService.markUnread([notification.id]).subscribe();
    this.cdr.markForCheck();
  }

  onDelete(notification: NotificationDto, event: Event): void {
    event.stopPropagation();
    this.notifications = this.notifications.filter((n) => n.id !== notification.id);
    this.total = Math.max(0, this.total - 1);
    if (!notification.isRead) {
      const current = this.notificationService.unreadCount;
      // The service will update count
    }
    this.notificationService.deleteNotification(notification.id).subscribe();
    this.cdr.markForCheck();
  }

  onMarkAllRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }));
    this.notificationService.markAllRead().subscribe();
    this.cdr.markForCheck();
  }

  onAccept(notification: NotificationDto, event: Event): void {
    event.stopPropagation();
    // Perform accept action via metadata route or default
    const acceptRoute = notification.metadata?.['acceptRoute'];
    this._optimisticMarkRead(notification);
    this.notificationService.markRead([notification.id]).subscribe();
    if (acceptRoute) {
      this.router.navigateByUrl(acceptRoute);
    }
    this.cdr.markForCheck();
  }

  onDecline(notification: NotificationDto, event: Event): void {
    event.stopPropagation();
    const declineRoute = notification.metadata?.['declineRoute'];
    this._optimisticMarkRead(notification);
    this.notificationService.markRead([notification.id]).subscribe();
    if (declineRoute) {
      this.router.navigateByUrl(declineRoute);
    }
    this.cdr.markForCheck();
  }

  isNew(id: string): boolean {
    return this.newNotificationIds.has(id);
  }

  getTypeIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.INVITATION:
        return 'pi pi-envelope';
      case NotificationType.TASK:
        return 'pi pi-check-square';
      case NotificationType.SYSTEM:
        return 'pi pi-cog';
      default:
        return 'pi pi-bell';
    }
  }

  getAvatarColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.INVITATION:
        return 'var(--p-blue-500)';
      case NotificationType.TASK:
        return 'var(--p-green-500)';
      case NotificationType.SYSTEM:
        return 'var(--p-orange-500)';
      default:
        return 'var(--p-primary-500)';
    }
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  private _optimisticMarkRead(notification: NotificationDto): void {
    notification.isRead = true;
    notification.readAt = new Date().toISOString();
    this.cdr.markForCheck();
  }

  private _loadNotifications(append: boolean): void {
    if (append) {
      this.loadingMore = true;
    } else {
      this.loading = true;
    }
    this.cdr.markForCheck();

    const tab = this.activeTab();
    const params: any = { page: this.page, size: this.pageSize };
    if (tab !== 'all') {
      params.type = tab;
    }

    this.notificationService.listNotifications(params).subscribe({
      next: (result) => {
        if (append) {
          this.notifications = [...this.notifications, ...result.items];
        } else {
          this.notifications = result.items;
        }
        this.total = result.total;
        this.loading = false;
        this.loadingMore = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.loadingMore = false;
        this.cdr.markForCheck();
      },
    });
  }
}
