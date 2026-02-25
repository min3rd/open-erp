import { inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { API_URI_NOTIFICATION } from '../constant';
import { AuthService } from './auth-service';
import {
  NotificationDto,
  NotificationListResponse,
  NotificationType,
  WsNotificationEvent,
} from '../interfaces/notification.types';

export interface NotificationQueryParams {
  type?: NotificationType;
  page?: number;
  size?: number;
  unreadOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);

  private _destroy$ = new Subject<void>();
  private _socket: any = null;

  private _unreadCount = new BehaviorSubject<number>(0);
  private _newNotification$ = new Subject<NotificationDto>();

  constructor() {
    // Track current user to connect socket
    this.authService.user$.pipe(takeUntil(this._destroy$)).subscribe((user) => {
      if (user) {
        this._fetchUnreadCount();
      }
    });
  }

  get unreadCount$(): Observable<number> {
    return this._unreadCount.asObservable();
  }

  get newNotification$(): Observable<NotificationDto> {
    return this._newNotification$.asObservable();
  }

  get unreadCount(): number {
    return this._unreadCount.getValue();
  }

  // ── HTTP ──────────────────────────────────────────────────────────────────

  listNotifications(params: NotificationQueryParams = {}): Observable<NotificationListResponse> {
    const queryParams: Record<string, any> = {};
    if (params.type) queryParams['type'] = params.type;
    if (params.page) queryParams['page'] = params.page;
    if (params.size) queryParams['size'] = params.size;
    if (params.unreadOnly) queryParams['unreadOnly'] = params.unreadOnly;

    return this.httpClient
      .get<any>(`${API_URI_NOTIFICATION}/v1/user-notifications`, { params: queryParams })
      .pipe(
        map((res) => {
          const data = res?.data ?? res;
          const result: NotificationListResponse = {
            items: data.items ?? [],
            total: data.total ?? 0,
            page: data.page ?? 1,
            size: data.size ?? 20,
            unreadCount: data.unreadCount ?? 0,
          };
          // Update unread count from list response
          this._unreadCount.next(result.unreadCount);
          return result;
        }),
      );
  }

  markRead(ids: string[]): Observable<any> {
    return this.httpClient
      .post<any>(`${API_URI_NOTIFICATION}/v1/user-notifications/mark-read`, { ids })
      .pipe(
        map((res) => {
          // Decrement unread count optimistically
          const current = this._unreadCount.getValue();
          this._unreadCount.next(Math.max(0, current - ids.length));
          return res?.data ?? res;
        }),
      );
  }

  markUnread(ids: string[]): Observable<any> {
    return this.httpClient
      .post<any>(`${API_URI_NOTIFICATION}/v1/user-notifications/mark-unread`, { ids })
      .pipe(
        map((res) => {
          // Increment unread count optimistically
          const current = this._unreadCount.getValue();
          this._unreadCount.next(current + ids.length);
          return res?.data ?? res;
        }),
      );
  }

  markAllRead(): Observable<any> {
    return this.httpClient
      .post<any>(`${API_URI_NOTIFICATION}/v1/user-notifications/mark-all-read`, {})
      .pipe(
        map((res) => {
          this._unreadCount.next(0);
          return res?.data ?? res;
        }),
      );
  }

  deleteNotification(id: string): Observable<any> {
    return this.httpClient
      .delete<any>(`${API_URI_NOTIFICATION}/v1/user-notifications/${id}`)
      .pipe(map((res) => res?.data ?? res));
  }

  private _fetchUnreadCount(): void {
    this.httpClient
      .get<any>(`${API_URI_NOTIFICATION}/v1/user-notifications/unread-count`)
      .subscribe({
        next: (res) => {
          const count = res?.data?.unreadCount ?? 0;
          this._unreadCount.next(count);
        },
        error: () => {
          // Silently ignore errors on initial unread count fetch
        },
      });
  }

  // ── WebSocket ──────────────────────────────────────────────────────────

  connectSocket(token: string): Observable<void> {
    if (this._socket?.connected) return of(undefined);

    import('socket.io-client').then(({ io }) => {
      this._socket = io(`${API_URI_NOTIFICATION}/notifications`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
      });

      this._socket.on('new', (data: WsNotificationEvent) => {
        if (data?.notification) {
          this._newNotification$.next(data.notification);
          const current = this._unreadCount.getValue();
          this._unreadCount.next(current + 1);
        }
      });

      this._socket.on('unreadCount', (data: { unreadCount: number }) => {
        if (data?.unreadCount !== undefined) {
          this._unreadCount.next(data.unreadCount);
        }
      });
    });

    return of(undefined);
  }

  disconnectSocket(): void {
    this._socket?.disconnect();
    this._socket = null;
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this.disconnectSocket();
  }
}
