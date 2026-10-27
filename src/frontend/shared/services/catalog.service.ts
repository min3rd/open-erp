import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, InjectionToken, inject, isDevMode } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ResponseKey } from '../enums/response-key.enum';
import { ApiErrorResponse, ApiResponse, ListData, PagedData } from '../models/api.model';
import {
  CatalogInlineCreateRequest,
  CatalogItemDetail,
  CatalogLookupOptionsQuery,
  CatalogLookupType,
  CatalogOptionItem
} from '../models/catalog.model';

/**
 * Base URL of the catalogue endpoints. Production builds call same-origin
 * (empty prefix); dev serves use the local Quarkus gateway both apps' dev
 * environments already target, so the picker works without app wiring. An app
 * may provide its own value to override this.
 */
export const CATALOG_API_BASE_URL = new InjectionToken<string>('CATALOG_API_BASE_URL', {
  providedIn: 'root',
  factory: () => (isDevMode() ? 'http://localhost:8088' : '')
});

const LOOKUP_PATH = '/api/v1/plugins/runtime/catalog/api/v1/catalog/lookup';
const ITEMS_PATH = '/api/v1/plugins/runtime/catalog/api/v1/catalog/items';
const DEFAULT_PAGE_SIZE = 20;

/**
 * Catalogue lookup API (DES-API-S05-001 §4). Every failure is normalized to the
 * standard `{ code, params }` envelope so callers translate `code` with their
 * own i18n dictionaries.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private baseUrl = inject(CATALOG_API_BASE_URL);

  /** `GET /api/v1/catalog/lookup/{typeCode}/options` — paginated options. */
  getOptions(
    typeCode: string,
    query: CatalogLookupOptionsQuery = {}
  ): Observable<ApiResponse<PagedData<CatalogOptionItem>>> {
    let params = new HttpParams()
      .set(ResponseKey.PAGE, query.page ?? 0)
      .set(ResponseKey.SIZE, query.size ?? DEFAULT_PAGE_SIZE);
    if (query.q) {
      params = params.set(ResponseKey.Q, query.q);
    }
    if (query.parentId) {
      params = params.set(ResponseKey.PARENT_ID, query.parentId);
    }
    if (query.asOf) {
      params = params.set(ResponseKey.AS_OF, query.asOf);
    }
    return this.http
      .get<ApiResponse<PagedData<CatalogOptionItem>>>(`${this.lookupUrl(typeCode)}/options`, { params })
      .pipe(catchError(this.handleError));
  }

  /** `GET /api/v1/catalog/lookup/types` — types usable by forms (non-paginated). */
  getTypes(): Observable<ApiResponse<ListData<CatalogLookupType>>> {
    return this.http
      .get<ApiResponse<ListData<CatalogLookupType>>>(`${this.baseUrl}${LOOKUP_PATH}/types`)
      .pipe(catchError(this.handleError));
  }

  /** `GET /api/v1/catalog/items/{id}?with_relations=true` — item detail with parents/children. */
  getItem(id: string): Observable<ApiResponse<CatalogItemDetail>> {
    const path = `${ITEMS_PATH}/${encodeURIComponent(id)}?${ResponseKey.WITH_RELATIONS}=true`;
    return this.http
      .get<ApiResponse<CatalogItemDetail>>(this.baseUrl + path)
      .pipe(catchError(this.handleError));
  }

  /**
   * `POST /api/v1/catalog/lookup/{typeCode}/inline` — quick-create an item from
   * a free-text value (permission `catalog:item:inline-create`).
   */
  inlineCreate(
    typeCode: string,
    payload: CatalogInlineCreateRequest
  ): Observable<ApiResponse<CatalogOptionItem>> {
    const body: Record<string, string> = { [ResponseKey.NAME]: payload.name };
    if (payload.code) {
      body[ResponseKey.CODE] = payload.code;
    }
    return this.http
      .post<ApiResponse<CatalogOptionItem>>(`${this.lookupUrl(typeCode)}/inline`, body)
      .pipe(catchError(this.handleError));
  }

  private lookupUrl(typeCode: string): string {
    return `${this.baseUrl}${LOOKUP_PATH}/${encodeURIComponent(typeCode)}`;
  }

  /** Keeps the `code`/`params` of backend errors; maps bare HTTP failures by status. */
  private handleError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const envelope = error.error as ApiErrorResponse | null;
      if (envelope && typeof envelope === 'object' && envelope.code) {
        return throwError(() => envelope);
      }
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
