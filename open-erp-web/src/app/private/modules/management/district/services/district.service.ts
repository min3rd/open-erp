import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_URI_COMMON } from '../../../../../../core/constant';
import { ApiPaginatedResponse, ApiSingleResponse, unwrap } from '../../../../../../core/api';
import {
  District,
  GetDistrictsParams,
  CreateDistrictDto,
  UpdateDistrictDto,
  ImportResult,
} from '../district.types';

@Injectable({
  providedIn: 'root',
})
export class DistrictService {
  private http = inject(HttpClient);

  // BehaviorSubject to manage district list state
  private districtsSubject = new BehaviorSubject<District[]>([]);
  public districts$ = this.districtsSubject.asObservable();

  /**
   * Get districts list with pagination and filtering
   */
  getDistricts(
    params: GetDistrictsParams,
  ): Observable<{
    items: District[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('limit', (params.limit || 100).toString());

    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    if (params.provinceCode) {
      httpParams = httpParams.set('provinceCode', params.provinceCode);
    }

    if (params.version) {
      httpParams = httpParams.set('version', params.version);
    }

    if (params.isLegacy !== undefined) {
      httpParams = httpParams.set('isLegacy', params.isLegacy.toString());
    }

    return this.http
      .get<ApiPaginatedResponse<District>>(`${API_URI_COMMON}/v1/districts`, {
        params: httpParams,
      })
      .pipe(
        map((response) => {
          const data = unwrap(response);
          this.districtsSubject.next(data.items);
          return data;
        }),
      );
  }

  /**
   * Get a single district by code
   */
  getDistrict(code: string): Observable<District> {
    return this.http
      .get<ApiSingleResponse<District>>(`${API_URI_COMMON}/v1/districts/${code}`)
      .pipe(
        map((response) => {
          const data = unwrap(response);
          return data.item!;
        }),
      );
  }

  /**
   * Create a new district
   */
  createDistrict(dto: CreateDistrictDto): Observable<District> {
    return this.http.post<ApiSingleResponse<District>>(`${API_URI_COMMON}/v1/districts`, dto).pipe(
      map((response) => {
        const data = unwrap(response);
        return data.item!;
      }),
      tap((district) => {
        // Add the new district to the list
        const currentList = this.districtsSubject.value;
        this.districtsSubject.next([district, ...currentList]);
      }),
    );
  }

  /**
   * Update a district
   */
  updateDistrict(code: string, dto: UpdateDistrictDto): Observable<District> {
    return this.http
      .patch<ApiSingleResponse<District>>(`${API_URI_COMMON}/v1/districts/${code}`, dto)
      .pipe(
        map((response) => {
          const data = unwrap(response);
          return data.item!;
        }),
        tap((district) => {
          // Update the district in the list
          const currentList = this.districtsSubject.value;
          const updatedList = currentList.map((d) => (d.code === district.code ? district : d));
          this.districtsSubject.next(updatedList);
        }),
      );
  }

  /**
   * Delete a district
   */
  deleteDistrict(code: string): Observable<void> {
    return this.http.delete<void>(`${API_URI_COMMON}/v1/districts/${code}`).pipe(
      tap(() => {
        // Remove the district from the list
        const currentList = this.districtsSubject.value;
        const updatedList = currentList.filter((d) => d.code !== code);
        this.districtsSubject.next(updatedList);
      }),
    );
  }

  /**
   * Export districts to CSV
   */
  exportToCSV(params: GetDistrictsParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    if (params.provinceCode) {
      httpParams = httpParams.set('provinceCode', params.provinceCode);
    }

    if (params.version) {
      httpParams = httpParams.set('version', params.version);
    }

    if (params.isLegacy !== undefined) {
      httpParams = httpParams.set('isLegacy', params.isLegacy.toString());
    }

    return this.http.post(
      `${API_URI_COMMON}/v1/districts/export/csv`,
      {},
      {
        params: httpParams,
        responseType: 'blob',
      },
    );
  }

  /**
   * Export districts to GeoJSON
   */
  exportToGeoJSON(params: GetDistrictsParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    if (params.provinceCode) {
      httpParams = httpParams.set('provinceCode', params.provinceCode);
    }

    if (params.version) {
      httpParams = httpParams.set('version', params.version);
    }

    if (params.isLegacy !== undefined) {
      httpParams = httpParams.set('isLegacy', params.isLegacy.toString());
    }

    return this.http.post(
      `${API_URI_COMMON}/v1/districts/export/geojson`,
      {},
      {
        params: httpParams,
        responseType: 'blob',
      },
    );
  }

  /**
   * Import districts from file
   */
  importDistricts(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiSingleResponse<ImportResult>>(`${API_URI_COMMON}/v1/districts/import`, formData)
      .pipe(
        map((response) => {
          const data = unwrap(response);
          return data.item!;
        }),
      );
  }
}
