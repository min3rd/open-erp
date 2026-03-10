import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_URI_CONFIG } from '../../../../../../core/constant';
import {
  NavigationItemDto,
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
  NavigationListResponse,
  ReorderNavigationItemDto,
  MoveNavigationItemDto,
  GetNavigationParams,
  PermissionSet,
} from '../dto/navigation-item.dto';
import { ApiSingleResponse } from '../../../../../../core/api';

/**
 * Service for managing navigation items
 * Integrates with backend navigation controller
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationManagementService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_CONFIG}/v1/navigations`;

  // Cache for navigation items
  private globalNavigationCache$ = new BehaviorSubject<NavigationItemDto[] | null>(null);
  private moduleNavigationCache$ = new Map<string, BehaviorSubject<NavigationItemDto[] | null>>();

  /**
   * Get global navigation items
   */
  getGlobalNavigation(params?: GetNavigationParams): Observable<NavigationItemDto[]> {
    let httpParams = new HttpParams();
    if (params?.includeHidden) {
      httpParams = httpParams.set('includeHidden', 'true');
    }

    return this.http
      .get<ApiSingleResponse<NavigationListResponse>>(`${this.baseUrl}/global`, {
        params: httpParams,
      })
      .pipe(
        map((response: ApiSingleResponse<NavigationListResponse>) => {
          return response.data?.item?.items || [];
        }),
        tap((items) => this.globalNavigationCache$.next(items)),
        catchError(this.handleError),
      );
  }

  /**
   * Get module-specific navigation items
   */
  getModuleNavigation(
    moduleId: string,
    params?: GetNavigationParams,
  ): Observable<NavigationItemDto[]> {
    let httpParams = new HttpParams();
    if (params?.includeHidden) {
      httpParams = httpParams.set('includeHidden', 'true');
    }

    return this.http
      .get<ApiSingleResponse<NavigationListResponse>>(`${this.baseUrl}/module/${moduleId}`, {
        params: httpParams,
      })
      .pipe(
        map((response) => response.data?.item?.items || []),
        tap((items) => {
          if (!this.moduleNavigationCache$.has(moduleId)) {
            this.moduleNavigationCache$.set(
              moduleId,
              new BehaviorSubject<NavigationItemDto[] | null>(items),
            );
          } else {
            this.moduleNavigationCache$.get(moduleId)!.next(items);
          }
        }),
        catchError(this.handleError),
      );
  }

  /**
   * Get a single navigation item by ID
   */
  getNavigationItem(id: string): Observable<ApiSingleResponse<NavigationItemDto>> {
    return this.http.get<ApiSingleResponse<NavigationItemDto>>(`${this.baseUrl}/${id}`).pipe(
      map((response: ApiSingleResponse<NavigationItemDto>) => {
        return response;
      }),
    );
  }

  /**
   * Create a new navigation item
   */
  createNavigationItem(dto: CreateNavigationItemDto): Observable<NavigationItemDto> {
    return this.http.post<NavigationItemDto>(this.baseUrl, dto).pipe(
      tap((createdItem) => {
        this.invalidateCache(dto.scope, dto.moduleId);
        // Trigger refetch for the affected scope
        this.refetchCache(dto.scope, dto.moduleId);
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Update an existing navigation item
   */
  updateNavigationItem(id: string, dto: UpdateNavigationItemDto): Observable<NavigationItemDto> {
    return this.http.patch<NavigationItemDto>(`${this.baseUrl}/${id}`, dto).pipe(
      tap((item) => {
        this.invalidateCache(item.scope, item.moduleId);
        // Trigger refetch for the affected scope
        this.refetchCache(item.scope, item.moduleId);
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Delete a navigation item
   */
  deleteNavigationItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.invalidateAllCaches();
        // Trigger refetch for all scopes
        this.refetchAllCaches();
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Reorder navigation items (change order within parent)
   */
  reorderNavigationItems(items: ReorderNavigationItemDto[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reorder`, { items }).pipe(
      tap(() => {
        this.invalidateAllCaches();
        // Trigger refetch for all scopes
        this.refetchAllCaches();
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Move a navigation item to a new parent or scope
   */
  moveNavigationItem(dto: MoveNavigationItemDto): Observable<NavigationItemDto> {
    return this.http.post<NavigationItemDto>(`${this.baseUrl}/move`, dto).pipe(
      tap(() => {
        this.invalidateAllCaches();
        // Trigger refetch for all scopes
        this.refetchAllCaches();
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Preview navigation filtered by permissions
   */
  previewNavigationWithPermissions(
    scope: 'global' | 'module',
    permissions: PermissionSet,
    moduleKey?: string,
  ): Observable<NavigationItemDto[]> {
    const url =
      scope === 'global'
        ? `${this.baseUrl}/preview/global`
        : `${this.baseUrl}/preview/module/${moduleKey}`;

    return this.http.post<NavigationListResponse>(url, permissions).pipe(
      map((response) => response.items),
      catchError(this.handleError),
    );
  }

  /**
   * Get cached global navigation
   */
  getCachedGlobalNavigation(): Observable<NavigationItemDto[] | null> {
    return this.globalNavigationCache$.asObservable();
  }

  /**
   * Get cached module navigation
   */
  getCachedModuleNavigation(moduleKey: string): Observable<NavigationItemDto[] | null> {
    if (!this.moduleNavigationCache$.has(moduleKey)) {
      this.moduleNavigationCache$.set(
        moduleKey,
        new BehaviorSubject<NavigationItemDto[] | null>(null),
      );
    }
    return this.moduleNavigationCache$.get(moduleKey)!.asObservable();
  }

  /**
   * Invalidate cache for specific scope/module
   */
  private invalidateCache(scope: 'global' | 'module', moduleKey?: string): void {
    if (scope === 'global') {
      this.globalNavigationCache$.next(null);
    } else if (moduleKey) {
      const cache = this.moduleNavigationCache$.get(moduleKey);
      if (cache) {
        cache.next(null);
      }
    }
  }

  /**
   * Invalidate all caches
   */
  private invalidateAllCaches(): void {
    this.globalNavigationCache$.next(null);
    this.moduleNavigationCache$.forEach((cache) => cache.next(null));
  }

  /**
   * Refetch cache for specific scope/module
   */
  private refetchCache(scope: 'global' | 'module', moduleKey?: string): void {
    if (scope === 'global') {
      this.getGlobalNavigation({ includeHidden: true }).subscribe();
    } else if (moduleKey) {
      this.getModuleNavigation(moduleKey, { includeHidden: true }).subscribe();
    }
  }

  /**
   * Refetch all caches
   */
  private refetchAllCaches(): void {
    // Refetch global navigation
    this.getGlobalNavigation({ includeHidden: true }).subscribe();

    // Refetch all module navigations that have been loaded
    this.moduleNavigationCache$.forEach((cache, moduleKey) => {
      this.getModuleNavigation(moduleKey, { includeHidden: true }).subscribe();
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Forbidden. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Navigation item not found.';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflict. The operation could not be completed.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = `Server error: ${error.status} - ${error.message}`;
      }
    }

    console.error('NavigationManagementService error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
