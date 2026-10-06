import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, CatalogHierarchyMode, ListData, ResponseKey } from '@shared';

/** `GET /api/v1/catalog/lookup/types` row (DES-API-S05-001 §5.1). */
export interface CatalogLookupType {
  code: string;
  name_key: string;
  hierarchy_mode: CatalogHierarchyMode;
}

/** Parent/child link returned by the item detail (`?with_relations=true`). */
export interface CatalogItemLink {
  item_id: string;
  code?: string | null;
  name?: string | null;
  relation_type?: string | null;
}

/** `GET /api/v1/catalog/items/{id}` detail (fields the mobile browse panel uses). */
export interface CatalogItemDetail {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  version?: number;
  is_system?: boolean;
  overridden?: boolean;
  parents?: CatalogItemLink[];
  children?: CatalogItemLink[];
}

/**
 * Mobile read-only catalogue browse API (TASK-387): the lookup types selector
 * and the item detail with relations. Option paging stays on the shared
 * `CatalogService` so the mobile screen and the shared picker share one contract.
 */
@Injectable({ providedIn: 'root' })
export class CatalogBrowseService {
  private api = inject(ApiService);

  getTypes(): Observable<ApiResponse<ListData<CatalogLookupType>>> {
    return this.api.get<ListData<CatalogLookupType>>('/api/v1/catalog/lookup/types');
  }

  getItem(id: string): Observable<ApiResponse<CatalogItemDetail>> {
    const path = `/api/v1/catalog/items/${encodeURIComponent(id)}?${ResponseKey.WITH_RELATIONS}=true`;
    return this.api.get<CatalogItemDetail>(path);
  }
}
