import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, ListData, PluginMarketplaceItem } from '@shared';

@Injectable({
  providedIn: 'root'
})
export class PluginService {
  private api = inject(ApiService);

  marketplace(): Observable<ApiResponse<ListData<PluginMarketplaceItem>>> {
    return this.api.get<ListData<PluginMarketplaceItem>>('/api/v1/tenant/plugins');
  }
}
