import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  ListData,
  PluginMarketplaceItem,
  PluginNotificationList,
  ResponseKey
} from '@shared';

@Injectable({
  providedIn: 'root'
})
export class PluginService {
  private api = inject(ApiService);

  marketplace(): Observable<ApiResponse<ListData<PluginMarketplaceItem>>> {
    return this.api.get<ListData<PluginMarketplaceItem>>('/api/v1/tenant/plugins');
  }

  notifications(unreadOnly: boolean = false): Observable<ApiResponse<PluginNotificationList>> {
    const query = unreadOnly ? `?${ResponseKey.UNREAD_ONLY}=true` : '';
    return this.api.get<PluginNotificationList>(`/api/v1/tenant/notifications${query}`);
  }
}
