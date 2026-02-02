import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_URI_COMMON } from '../../../../../../core/constant';
import { 
  ApiPaginatedResponse, 
  ApiResponse, 
  ApiSingleResponse,
  unwrap, 
  isApiResponse 
} from '../../../../../../core/api';
import {
  Province,
  ProvinceListResponse,
  GetProvincesParams,
  CreateProvinceDto,
  UpdateProvinceDto,
  ImportResult,
} from '../province.types';

@Injectable({
  providedIn: 'root',
})
export class ProvinceService {
  private http = inject(HttpClient);
  
  // BehaviorSubject to manage province list state
  private provincesSubject = new BehaviorSubject<Province[]>([]);
  public provinces$ = this.provincesSubject.asObservable();

  /**
   * Get provinces list with pagination and filtering
   */
  getProvinces(params: GetProvincesParams): Observable<ProvinceListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('size', (params.limit || 10).toString());

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.region) {
      httpParams = httpParams.set('region', params.region);
    }

    return this.http
      .get<ApiPaginatedResponse<Province> | ProvinceListResponse>(
        `${API_URI_COMMON}/v1/provinces`,
        {
          params: httpParams,
        }
      )
      .pipe(
        map((response) => {
          // Check if response is the new API envelope format
          if (isApiResponse(response)) {
            const data = unwrap(response as ApiPaginatedResponse<Province>);
            // Store the items in the subject for list management
            this.provincesSubject.next(data.items);
            return data;
          }
          // Legacy format - convert to ApiPaginatedData
          const legacyResponse = response as any;
          const data: ProvinceListResponse = {
            items: legacyResponse.data || [],
            page: legacyResponse.page || 1,
            limit: legacyResponse.limit || 10,
            total: legacyResponse.total || 0,
            totalPages: legacyResponse.totalPages || 0,
          };
          this.provincesSubject.next(data.items);
          return data;
        })
      );
  }

  /**
   * Get a single province by ID
   */
  getProvince(id: string): Observable<Province> {
    return this.http
      .get<ApiSingleResponse<Province> | Province>(`${API_URI_COMMON}/v1/provinces/${id}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<Province>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as Province;
        })
      );
  }

  /**
   * Create a new province
   */
  createProvince(dto: CreateProvinceDto): Observable<Province> {
    return this.http
      .post<ApiSingleResponse<Province> | Province>(`${API_URI_COMMON}/v1/provinces`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<Province>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as Province;
        }),
        tap((province) => {
          // Add the new province to the list
          const currentList = this.provincesSubject.value;
          this.provincesSubject.next([province, ...currentList]);
        })
      );
  }

  /**
   * Update a province
   */
  updateProvince(id: string, dto: UpdateProvinceDto): Observable<Province> {
    return this.http
      .patch<ApiSingleResponse<Province> | Province>(`${API_URI_COMMON}/v1/provinces/${id}`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<Province>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as Province;
        }),
        tap((province) => {
          // Update the province in the list
          const currentList = this.provincesSubject.value;
          const updatedList = currentList.map(p => p.id === province.id ? province : p);
          this.provincesSubject.next(updatedList);
        })
      );
  }

  /**
   * Delete a province
   */
  deleteProvince(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URI_COMMON}/v1/provinces/${id}`).pipe(
      tap(() => {
        // Remove the province from the list
        const currentList = this.provincesSubject.value;
        const updatedList = currentList.filter(p => p.id !== id);
        this.provincesSubject.next(updatedList);
      })
    );
  }

  /**
   * Export provinces to CSV
   */
  exportToCSV(params: GetProvincesParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.region) {
      httpParams = httpParams.set('region', params.region);
    }

    return this.http.post(
      `${API_URI_COMMON}/v1/provinces/export/csv`,
      {},
      {
        params: httpParams,
        responseType: 'blob',
      }
    );
  }

  /**
   * Export provinces to GeoJSON
   */
  exportToGeoJSON(params: GetProvincesParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.region) {
      httpParams = httpParams.set('region', params.region);
    }

    return this.http.post(
      `${API_URI_COMMON}/v1/provinces/export/geojson`,
      {},
      {
        params: httpParams,
        responseType: 'blob',
      }
    );
  }

  /**
   * Import provinces from file
   */
  importProvinces(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiResponse<ImportResult> | ImportResult>(
        `${API_URI_COMMON}/v1/provinces/import`,
        formData
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response as ApiResponse<ImportResult>);
          }
          return response as ImportResult;
        })
      );
  }
}
