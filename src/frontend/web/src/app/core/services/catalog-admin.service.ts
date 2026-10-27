import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildQuery } from '../utils/query.util';
import { ApiService } from './api.service';
import {
  ApiErrorResponse,
  ApiFieldError,
  ApiResponse,
  CatalogHierarchyMode,
  CatalogItemLink,
  CatalogRelationType,
  CatalogStatus,
  ListData,
  PagedData,
  ResponseKey
} from '@shared';

/**
 * Which catalogue the screen manages (DES-UI-S05-001 §2): the tenant catalogue
 * (system + tenant rows, tenant overrides) or the platform system catalogue
 * (`tenant_id IS NULL`, super admin only). The backend mirrors the paths under
 * `/api/v1/catalog/system/*` (TASK-392).
 */
export enum CatalogScope {
  TENANT = 'tenant',
  SYSTEM = 'system'
}

const CATALOG_API = '/api/v1/plugins/runtime/catalog/api/v1/catalog';
const SYSTEM_SEGMENT = '/system';
const DEFAULT_PAGE_SIZE = 20;

/** One dynamic attribute field of a type's `attributes_schema`. */
export interface CatalogAttributeField {
  key: string;
  label_key: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | string;
  required?: boolean;
}

export interface CatalogAttributesSchema {
  fields: CatalogAttributeField[];
}

/** `GET /catalog/types` item (DES-API-S05-001 §2, DES-DB-S05-001 §2.1). */
export interface CatalogTypeDto {
  id: string;
  tenant_id?: string | null;
  code: string;
  name_key: string;
  description_key?: string | null;
  hierarchy_mode: CatalogHierarchyMode;
  allowed_relations: CatalogRelationType[];
  allowed_parent_types?: string[] | null;
  max_depth?: number | null;
  min_parents?: number;
  allow_free_text: boolean;
  versioned: boolean;
  effective_dated: boolean;
  attributes_schema?: CatalogAttributesSchema | null;
  status: CatalogStatus;
  /** System type (`tenant_id IS NULL`) — read-only for tenants. */
  is_system?: boolean;
  /** Tenant type with the same `code` as a system type (Q1/Q2). */
  overridden?: boolean;
  items_count?: number;
}

/** Body of `POST/PUT /catalog/types`. */
export interface CatalogTypePayload {
  code: string;
  name_key: string;
  description_key?: string | null;
  hierarchy_mode: CatalogHierarchyMode;
  allowed_relations: CatalogRelationType[];
  allowed_parent_types?: string[] | null;
  max_depth?: number | null;
  min_parents?: number;
  allow_free_text: boolean;
  versioned?: boolean;
  effective_dated?: boolean;
  attributes_schema?: CatalogAttributesSchema | null;
  status?: CatalogStatus;
}

/** `GET /catalog/types/{code}/items` row and `GET /catalog/items/{id}` detail. */
export interface CatalogItemDto {
  id: string;
  type_id?: string;
  type_code?: string;
  tenant_id?: string | null;
  version_group_id?: string;
  version: number;
  code: string;
  name: string;
  name_en?: string | null;
  description?: string | null;
  attributes?: Record<string, unknown> | null;
  sort_order: number;
  status: CatalogStatus;
  valid_from?: string | null;
  valid_to?: string | null;
  /** System item (`tenant_id IS NULL`). */
  is_system?: boolean;
  /** Tenant item overriding a system item with the same `code` (badge "Ghi đè"). */
  overridden?: boolean;
  /** First active parent, display helper for list/tree views. */
  parent_id?: string | null;
  parents_count?: number;
  has_children?: boolean;
  /** Present when the detail is fetched with `with_relations=true`. */
  parents?: CatalogItemLink[];
  children?: CatalogItemLink[];
  created_at?: string | null;
  updated_at?: string | null;
}

/** Body of `POST /catalog/types/{code}/items` and `PUT /catalog/items/{id}`. */
export interface CatalogItemPayload {
  code: string;
  name: string;
  name_en?: string | null;
  description?: string | null;
  attributes?: Record<string, unknown> | null;
  sort_order?: number;
  status?: CatalogStatus;
}

/** `GET /catalog/items/{id}/versions` row (read-only history). */
export interface CatalogVersionDto {
  id: string;
  version: number;
  code: string;
  name: string;
  description?: string | null;
  attributes?: Record<string, unknown> | null;
  status: CatalogStatus;
  valid_from?: string | null;
  valid_to?: string | null;
  supersedes_item_id?: string | null;
  updated_at?: string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
}

/** `GET /catalog/items/{id}/descendants` row (recursive CTE). */
export interface CatalogDescendantDto extends CatalogItemDto {
  depth?: number;
}

/** `GET /catalog/types/{code}/grants` row. */
export interface CatalogGrantDto {
  role_id: string;
  role_code?: string;
  role_name?: string;
  can_read: boolean;
  can_write: boolean;
}

/** Body of `PUT /catalog/types/{code}/grants`. */
export interface CatalogGrantPayload {
  role_id: string;
  can_read: boolean;
  can_write: boolean;
}

/** `POST /catalog/edges` body (DES-API-S05-001 §5.4). */
export interface CatalogEdgePayload {
  parent_item_id: string;
  child_item_id: string;
  relation_type: CatalogRelationType;
  sort_order?: number;
}

export interface CatalogItemsQuery {
  q?: string;
  parent_id?: string | null;
  relation_type?: CatalogRelationType | '';
  as_of?: string | null;
  status?: CatalogStatus | '';
  page?: number;
  size?: number;
}

export interface CatalogExportQuery {
  type_code?: string;
  all?: boolean;
  as_of?: string | null;
  q?: string;
  status?: CatalogStatus | '';
  parent_id?: string | null;
  relation_type?: CatalogRelationType | '';
}

/** Per-row error of an import report (row number + i18n code + params). */
export interface CatalogImportError {
  row: number;
  code: string;
  params?: Record<string, unknown>;
}

/** Per-row result of an import dry-run / write (DES-API-S05-001 §4.1). */
export interface CatalogImportRow {
  row: number;
  action?: 'CREATED' | 'UPDATED' | 'SKIPPED' | 'ERROR' | string;
  code?: string;
  name?: string;
  errors?: ApiFieldError[];
}

export interface CatalogImportReport {
  dry_run?: boolean;
  total_rows?: number;
  created: number;
  updated: number;
  skipped: number;
  edges_created: number;
  errors?: CatalogImportError[];
  rows?: CatalogImportRow[];
}

/**
 * Catalogue admin API (DES-API-S05-001 §2-4.1): types + grants, versioned items
 * + edges, import/export. Every failure keeps the standard envelope's `code`
 * (+`params`) so the UI translates it with its own dictionaries.
 */
@Injectable({ providedIn: 'root' })
export class CatalogAdminService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  // ---------------------------------------------------------------------
  // Group A — types & per-type grants
  // ---------------------------------------------------------------------

  getTypes(scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<ListData<CatalogTypeDto>>> {
    return this.api.get<ListData<CatalogTypeDto>>(`${this.base(scope)}/types`);
  }

  createType(payload: CatalogTypePayload, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<CatalogTypeDto>> {
    return this.api.post<CatalogTypeDto>(`${this.base(scope)}/types`, this.typeBody(payload));
  }

  updateType(typeId: string, payload: CatalogTypePayload, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<CatalogTypeDto>> {
    return this.api.put<CatalogTypeDto>(`${this.base(scope)}/types/${encodeURIComponent(typeId)}`, this.typeBody(payload));
  }

  getGrants(typeCode: string, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<ListData<CatalogGrantDto>>> {
    return this.api.get<ListData<CatalogGrantDto>>(`${this.base(scope)}/types/${encodeURIComponent(typeCode)}/grants`);
  }

  replaceGrants(typeCode: string, grants: CatalogGrantPayload[], scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<ListData<CatalogGrantDto>>> {
    return this.api.put<ListData<CatalogGrantDto>>(`${this.base(scope)}/types/${encodeURIComponent(typeCode)}/grants`, {
      [ResponseKey.GRANTS]: grants.map((grant) => ({
        [ResponseKey.ROLE_ID]: grant.role_id,
        [ResponseKey.CAN_READ]: grant.can_read,
        [ResponseKey.CAN_WRITE]: grant.can_write
      }))
    });
  }

  // ---------------------------------------------------------------------
  // Group B — items, versions & edges
  // ---------------------------------------------------------------------

  getItems(typeCode: string, query: CatalogItemsQuery = {}, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<PagedData<CatalogItemDto>>> {
    const params = buildQuery({
      [ResponseKey.Q]: query.q,
      [ResponseKey.PARENT_ID]: query.parent_id,
      [ResponseKey.RELATION_TYPE]: query.relation_type,
      [ResponseKey.AS_OF]: query.as_of,
      [ResponseKey.STATUS]: query.status,
      [ResponseKey.PAGE]: query.page ?? 0,
      [ResponseKey.SIZE]: query.size ?? DEFAULT_PAGE_SIZE
    });
    return this.api.get<PagedData<CatalogItemDto>>(`${this.base(scope)}/types/${encodeURIComponent(typeCode)}/items${params}`);
  }

  getItem(itemId: string, scope: CatalogScope = CatalogScope.TENANT, withRelations = true): Observable<ApiResponse<CatalogItemDto>> {
    const params = buildQuery({ [ResponseKey.WITH_RELATIONS]: withRelations ? true : undefined });
    return this.api.get<CatalogItemDto>(`${this.base(scope)}/items/${encodeURIComponent(itemId)}${params}`);
  }

  createItem(typeCode: string, payload: CatalogItemPayload, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<CatalogItemDto>> {
    return this.api.post<CatalogItemDto>(`${this.base(scope)}/types/${encodeURIComponent(typeCode)}/items`, this.itemBody(payload));
  }

  /** Edit creates a new version and closes the previous one (DES-API §5.5). */
  updateItem(itemId: string, payload: CatalogItemPayload, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<CatalogItemDto>> {
    return this.api.put<CatalogItemDto>(`${this.base(scope)}/items/${encodeURIComponent(itemId)}`, this.itemBody(payload));
  }

  /** "Delete" closes the validity window (`valid_to = now()`), never hard-deletes. */
  closeItem(itemId: string, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.base(scope)}/items/${encodeURIComponent(itemId)}`);
  }

  getVersions(itemId: string, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<ListData<CatalogVersionDto>>> {
    return this.api.get<ListData<CatalogVersionDto>>(`${this.base(scope)}/items/${encodeURIComponent(itemId)}/versions`);
  }

  getParents(itemId: string, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<ListData<CatalogItemLink>>> {
    return this.api.get<ListData<CatalogItemLink>>(`${this.base(scope)}/items/${encodeURIComponent(itemId)}/parents`);
  }

  getDescendants(itemId: string, depth: number | null = null, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<ListData<CatalogDescendantDto>>> {
    const params = buildQuery({ [ResponseKey.DEPTH]: depth ?? undefined });
    return this.api.get<ListData<CatalogDescendantDto>>(`${this.base(scope)}/items/${encodeURIComponent(itemId)}/descendants${params}`);
  }

  createEdge(payload: CatalogEdgePayload, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<CatalogItemLink>> {
    return this.api.post<CatalogItemLink>(`${this.base(scope)}/edges`, {
      [ResponseKey.PARENT_ITEM_ID]: payload.parent_item_id,
      [ResponseKey.CHILD_ITEM_ID]: payload.child_item_id,
      [ResponseKey.RELATION_TYPE]: payload.relation_type,
      [ResponseKey.SORT_ORDER]: payload.sort_order ?? 0
    });
  }

  deleteEdge(edgeId: string, scope: CatalogScope = CatalogScope.TENANT): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.base(scope)}/edges/${encodeURIComponent(edgeId)}`);
  }

  // ---------------------------------------------------------------------
  // Group D — import / export (DES-API-S05-001 §4.1)
  // ---------------------------------------------------------------------

  /** Multipart upload; `dryRun=true` validates the whole file without writing. */
  importItems(
    typeCode: string,
    file: File,
    dryRun: boolean,
    scope: CatalogScope = CatalogScope.TENANT
  ): Observable<ApiResponse<CatalogImportReport>> {
    const form = new FormData();
    form.append('file', file, file.name);
    const params = buildQuery({ [ResponseKey.DRY_RUN]: dryRun ? true : undefined });
    return this.api.postForm<CatalogImportReport>(
      `${this.base(scope)}/types/${encodeURIComponent(typeCode)}/import${params}`,
      form
    );
  }

  /** CSV template (UTF-8 BOM) with the exact columns of the type. */
  downloadTemplate(typeCode: string, scope: CatalogScope = CatalogScope.TENANT): Observable<Blob> {
    return this.download(`${this.base(scope)}/types/${encodeURIComponent(typeCode)}/import/template`);
  }

  /** CSV export of one type (`type_code`) or every type (`all=true`). */
  exportCsv(query: CatalogExportQuery, scope: CatalogScope = CatalogScope.TENANT): Observable<Blob> {
    const params = buildQuery({
      [ResponseKey.TYPE_CODE]: query.type_code,
      [ResponseKey.ALL]: query.all ? true : undefined,
      [ResponseKey.AS_OF]: query.as_of,
      [ResponseKey.Q]: query.q,
      [ResponseKey.STATUS]: query.status,
      [ResponseKey.PARENT_ID]: query.parent_id,
      [ResponseKey.RELATION_TYPE]: query.relation_type
    });
    return this.download(`${this.base(scope)}/export${params}`);
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  private base(scope: CatalogScope): string {
    return scope === CatalogScope.SYSTEM ? `${CATALOG_API}${SYSTEM_SEGMENT}` : CATALOG_API;
  }

  private typeBody(payload: CatalogTypePayload): Record<string, unknown> {
    return {
      [ResponseKey.CODE]: payload.code,
      [ResponseKey.NAME_KEY]: payload.name_key,
      [ResponseKey.DESCRIPTION_KEY]: payload.description_key ?? null,
      [ResponseKey.HIERARCHY_MODE]: payload.hierarchy_mode,
      [ResponseKey.ALLOWED_RELATIONS]: payload.allowed_relations,
      [ResponseKey.ALLOWED_PARENT_TYPES]: payload.allowed_parent_types ?? null,
      [ResponseKey.MAX_DEPTH]: payload.max_depth ?? null,
      [ResponseKey.MIN_PARENTS]: payload.min_parents ?? 0,
      [ResponseKey.ALLOW_FREE_TEXT]: payload.allow_free_text,
      [ResponseKey.VERSIONED]: payload.versioned ?? true,
      [ResponseKey.EFFECTIVE_DATED]: payload.effective_dated ?? true,
      [ResponseKey.ATTRIBUTES_SCHEMA]: payload.attributes_schema ?? null,
      [ResponseKey.STATUS]: payload.status ?? CatalogStatus.ACTIVE
    };
  }

  private itemBody(payload: CatalogItemPayload): Record<string, unknown> {
    return {
      [ResponseKey.CODE]: payload.code,
      [ResponseKey.NAME]: payload.name,
      [ResponseKey.NAME_EN]: payload.name_en ?? null,
      [ResponseKey.DESCRIPTION]: payload.description ?? null,
      [ResponseKey.ATTRIBUTES]: payload.attributes ?? null,
      [ResponseKey.SORT_ORDER]: payload.sort_order ?? 0,
      [ResponseKey.STATUS]: payload.status ?? CatalogStatus.ACTIVE
    };
  }

  private download(path: string): Observable<Blob> {
    return this.http
      .get(`${environment.apiBaseUrl}${path}`, { responseType: 'blob' })
      .pipe(catchError(this.handleBlobError));
  }

  /** Blob failures carry no JSON body; map the HTTP status to the standard code. */
  private handleBlobError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const codeByStatus: Record<number, string> = {
        0: 'NETWORK_ERROR',
        400: 'VALIDATION_FAILED',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        429: 'TOO_MANY_REQUESTS'
      };
      return throwError(() => ({ code: codeByStatus[error.status] ?? 'INTERNAL_SERVER_ERROR' } as ApiErrorResponse));
    }
    return throwError(() => error);
  }
}
