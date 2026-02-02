import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_URI_COMMON } from '../../../../../../core/constant';
import { 
  ApiPaginatedResponse, 
  ApiSingleResponse,
  unwrap
} from '../../../../../../core/api';
import {
  Ward,
  GetWardsParams,
  CreateWardDto,
  UpdateWardDto,
  ImportResult,
} from '../ward.types';

@Injectable({
  providedIn: 'root',
})
export class WardService {
  private http = inject(HttpClient);
  
  // BehaviorSubject to manage ward list state
  private wardsSubject = new BehaviorSubject<Ward[]>([]);
  public wards$ = this.wardsSubject.asObservable();

  /**
   * Get wards list with pagination and filtering
   * Note: Backend doesn't support sort parameter yet, so we apply client-side sorting
   */
  getWards(params: GetWardsParams): Observable<{ items: Ward[]; total: number; page: number; limit: number; totalPages: number }> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('limit', (params.limit || 100).toString());

    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    if (params.provinceCode) {
      httpParams = httpParams.set('provinceCode', params.provinceCode);
    }

    if (params.districtCode) {
      httpParams = httpParams.set('districtCode', params.districtCode);
    }

    if (params.version) {
      httpParams = httpParams.set('version', params.version);
    }

    if (params.isLegacy !== undefined) {
      httpParams = httpParams.set('isLegacy', params.isLegacy.toString());
    }

    // NOTE: Backend doesn't support sort parameter yet
    // TODO: Add backend support for sort parameter, see issue #[number]

    return this.http
      .get<ApiPaginatedResponse<Ward>>(
        `${API_URI_COMMON}/v1/wards`,
        {
          params: httpParams,
        }
      )
      .pipe(
        map((response) => {
          const data = unwrap(response);
          
          // Apply client-side sorting (on current page only)
          let sortedItems = [...data.items];
          if (params.sort) {
            const [field, direction] = params.sort.split(':') as ['name', 'asc' | 'desc'];
            sortedItems.sort((a, b) => {
              const aVal = (a[field] || '').toString().toLowerCase();
              const bVal = (b[field] || '').toString().toLowerCase();
              const comparison = aVal.localeCompare(bVal, 'vi-VN');
              return direction === 'asc' ? comparison : -comparison;
            });
          }
          
          this.wardsSubject.next(sortedItems);
          return { ...data, items: sortedItems };
        })
      );
  }

  /**
   * Get a single ward by code
   */
  getWard(code: string): Observable<Ward> {
    return this.http
      .get<ApiSingleResponse<Ward>>(`${API_URI_COMMON}/v1/wards/${code}`)
      .pipe(
        map((response) => {
          const data = unwrap(response);
          return data.item!;
        })
      );
  }

  /**
   * Create a new ward
   */
  createWard(dto: CreateWardDto): Observable<Ward> {
    return this.http
      .post<ApiSingleResponse<Ward>>(`${API_URI_COMMON}/v1/wards`, dto)
      .pipe(
        map((response) => {
          const data = unwrap(response);
          return data.item!;
        }),
        tap((ward) => {
          // Add the new ward to the list
          const currentList = this.wardsSubject.value;
          this.wardsSubject.next([ward, ...currentList]);
        })
      );
  }

  /**
   * Update a ward
   */
  updateWard(code: string, dto: UpdateWardDto): Observable<Ward> {
    return this.http
      .patch<ApiSingleResponse<Ward>>(`${API_URI_COMMON}/v1/wards/${code}`, dto)
      .pipe(
        map((response) => {
          const data = unwrap(response);
          return data.item!;
        }),
        tap((ward) => {
          // Update the ward in the list
          const currentList = this.wardsSubject.value;
          const updatedList = currentList.map(w => w.code === ward.code ? ward : w);
          this.wardsSubject.next(updatedList);
        })
      );
  }

  /**
   * Delete a ward
   */
  deleteWard(code: string): Observable<void> {
    return this.http.delete<void>(`${API_URI_COMMON}/v1/wards/${code}`).pipe(
      tap(() => {
        // Remove the ward from the list
        const currentList = this.wardsSubject.value;
        const updatedList = currentList.filter(w => w.code !== code);
        this.wardsSubject.next(updatedList);
      })
    );
  }

  /**
   * Export wards to CSV
   */
  exportToCSV(params: GetWardsParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    if (params.provinceCode) {
      httpParams = httpParams.set('provinceCode', params.provinceCode);
    }

    if (params.districtCode) {
      httpParams = httpParams.set('districtCode', params.districtCode);
    }

    if (params.version) {
      httpParams = httpParams.set('version', params.version);
    }

    if (params.isLegacy !== undefined) {
      httpParams = httpParams.set('isLegacy', params.isLegacy.toString());
    }

    return this.http.post(
      `${API_URI_COMMON}/v1/wards/export/csv`,
      {},
      {
        params: httpParams,
        responseType: 'blob',
      }
    );
  }

  /**
   * Export wards to GeoJSON
   */
  exportToGeoJSON(params: GetWardsParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    if (params.provinceCode) {
      httpParams = httpParams.set('provinceCode', params.provinceCode);
    }

    if (params.districtCode) {
      httpParams = httpParams.set('districtCode', params.districtCode);
    }

    if (params.version) {
      httpParams = httpParams.set('version', params.version);
    }

    if (params.isLegacy !== undefined) {
      httpParams = httpParams.set('isLegacy', params.isLegacy.toString());
    }

    return this.http.post(
      `${API_URI_COMMON}/v1/wards/export/geojson`,
      {},
      {
        params: httpParams,
        responseType: 'blob',
      }
    );
  }

  /**
   * Import wards from file
   */
  importWards(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiSingleResponse<ImportResult>>(
        `${API_URI_COMMON}/v1/wards/import`,
        formData
      )
      .pipe(
        map((response) => {
          const data = unwrap(response);
          return data.item!;
        })
      );
  }
}
