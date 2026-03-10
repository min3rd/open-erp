import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_URI_COMMON } from '../../../../../../core/constant';
import { unwrap } from '../../../../../../core/api/http-wrapper';
import {
  AdministrativeUnit,
  AdministrativeUnitTreeNode,
  AdminUnitTreeParams,
  AdminUnitTreeResponse,
  AdminUnitType,
  provinceToAdminUnit,
  districtToAdminUnit,
  wardToAdminUnit,
  mapToTreeNode,
} from '../administrative-unit.types';
import { Province } from '../../province/province.types';
import { District } from '../../district/district.types';
import { Ward } from '../../ward/ward.types';

@Injectable({
  providedIn: 'root',
})
export class AdministrativeUnitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URI_COMMON}/v1`;

  /**
   * Get tree data with provinces as root nodes
   * Districts and wards are loaded lazily on expand
   */
  getTreeData(params: AdminUnitTreeParams): Observable<AdminUnitTreeResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.filter && params.filter !== 'all') {
      httpParams = httpParams.set('q', params.filter);
    }

    return this.http.get<any>(`${this.apiUrl}/provinces`, { params: httpParams }).pipe(
      map((response) => {
        const unwrapped = unwrap<any>(response);
        const provinces = unwrapped.items as Province[];
        const treeNodes: AdministrativeUnitTreeNode[] = provinces.map((province) => {
          const adminUnit = provinceToAdminUnit(province);
          // Provinces always have children (districts)
          return mapToTreeNode(adminUnit, true);
        });

        return {
          items: treeNodes,
          total: unwrapped.total,
          page: unwrapped.page,
          limit: unwrapped.limit,
          totalPages: unwrapped.totalPages,
        };
      }),
      catchError((error) => {
        console.error('Error fetching tree data:', error);
        return of({
          items: [],
          total: 0,
          page: 1,
          limit: params.limit || 100,
          totalPages: 0,
        });
      }),
    );
  }

  /**
   * Load children for a node (lazy loading)
   * If node is a province, load its districts (3-level) or wards (2-level)
   * If node is a district, load its wards
   * @param node The tree node to load children for
   * @param viewMode The current view mode (2-level or 3-level)
   */
  loadChildren(
    node: AdministrativeUnitTreeNode,
    viewMode: '2-level' | '3-level' = '3-level',
  ): Observable<AdministrativeUnitTreeNode[]> {
    const unit = node.data;

    // Determine type from data structure
    if (unit.districtCode) {
      // Has districtCode = ward, wards are leaf nodes
      return of([]);
    } else if (unit.provinceCode) {
      // Has only provinceCode = district, load wards
      return this.getWardsByDistrict(unit.code);
    } else {
      // No parent codes = province
      if (viewMode === '2-level') {
        // In 2-level mode, load wards directly under provinces
        return this.getWardsByProvince(unit.code);
      } else {
        // In 3-level mode, load districts under provinces
        return this.getDistrictsByProvince(unit.code);
      }
    }
  }

  /**
   * Get districts for a province
   */
  private getDistrictsByProvince(provinceCode: string): Observable<AdministrativeUnitTreeNode[]> {
    const params = new HttpParams().set('provinceCode', provinceCode).set('limit', '1000'); // Get all districts for this province

    return this.http.get<any>(`${this.apiUrl}/districts`, { params }).pipe(
      map((response) => {
        const unwrapped = unwrap<any>(response);
        const districts = unwrapped.items as District[];
        return districts.map((district) => {
          const adminUnit = districtToAdminUnit(district);
          // Districts may have children (wards)
          return mapToTreeNode(adminUnit, true);
        });
      }),
      catchError((error) => {
        console.error('Error fetching districts:', error);
        return of([]);
      }),
    );
  }

  /**
   * Get wards for a district
   */
  private getWardsByDistrict(districtCode: string): Observable<AdministrativeUnitTreeNode[]> {
    const params = new HttpParams().set('districtCode', districtCode).set('limit', '1000'); // Get all wards for this district

    return this.http.get<any>(`${this.apiUrl}/wards`, { params }).pipe(
      map((response) => {
        const unwrapped = unwrap<any>(response);
        const wards = unwrapped.items as Ward[];
        return wards.map((ward) => {
          const adminUnit = wardToAdminUnit(ward);
          // Wards are leaf nodes
          return mapToTreeNode(adminUnit, false);
        });
      }),
      catchError((error) => {
        console.error('Error fetching wards:', error);
        return of([]);
      }),
    );
  }

  /**
   * Get wards for a province (for 2-level view)
   */
  private getWardsByProvince(provinceCode: string): Observable<AdministrativeUnitTreeNode[]> {
    const params = new HttpParams().set('provinceCode', provinceCode).set('limit', '10000'); // Get all wards for this province

    return this.http.get<any>(`${this.apiUrl}/wards`, { params }).pipe(
      map((response) => {
        const unwrapped = unwrap<any>(response);
        const wards = unwrapped.items as Ward[];
        return wards.map((ward) => {
          const adminUnit = wardToAdminUnit(ward);
          // Wards are leaf nodes
          return mapToTreeNode(adminUnit, false);
        });
      }),
      catchError((error) => {
        console.error('Error fetching wards:', error);
        return of([]);
      }),
    );
  }

  /**
   * Get a single administrative unit by code and type
   */
  getUnit(code: string, type: AdminUnitType): Observable<AdministrativeUnit> {
    let endpoint = '';
    switch (type) {
      case AdminUnitType.PROVINCE:
        endpoint = `${this.apiUrl}/provinces/${code}`;
        break;
      case AdminUnitType.DISTRICT:
        endpoint = `${this.apiUrl}/districts/${code}`;
        break;
      case AdminUnitType.WARD:
        endpoint = `${this.apiUrl}/wards/${code}`;
        break;
      default:
        throw new Error(`Unknown admin unit type: ${type}`);
    }

    return this.http.get<any>(endpoint).pipe(
      map((response) => {
        const unwrapped = unwrap<any>(response);
        const item = unwrapped.item;

        switch (type) {
          case AdminUnitType.PROVINCE:
            return provinceToAdminUnit(item as Province);
          case AdminUnitType.DISTRICT:
            return districtToAdminUnit(item as District);
          case AdminUnitType.WARD:
            return wardToAdminUnit(item as Ward);
          default:
            throw new Error(`Unknown admin unit type: ${type}`);
        }
      }),
    );
  }

  /**
   * Create a new administrative unit
   */
  createUnit(unit: AdministrativeUnit): Observable<AdministrativeUnit> {
    let endpoint = '';
    switch (unit.type) {
      case AdminUnitType.PROVINCE:
        endpoint = `${this.apiUrl}/provinces`;
        break;
      case AdminUnitType.DISTRICT:
        endpoint = `${this.apiUrl}/districts`;
        break;
      case AdminUnitType.WARD:
        endpoint = `${this.apiUrl}/wards`;
        break;
      default:
        throw new Error(`Unknown admin unit type: ${unit.type}`);
    }

    return this.http.post<any>(endpoint, unit).pipe(
      map((response) => {
        const unwrapped = unwrap<any>(response);
        const item = unwrapped.item;

        switch (unit.type) {
          case AdminUnitType.PROVINCE:
            return provinceToAdminUnit(item as Province);
          case AdminUnitType.DISTRICT:
            return districtToAdminUnit(item as District);
          case AdminUnitType.WARD:
            return wardToAdminUnit(item as Ward);
          default:
            throw new Error(`Unknown admin unit type: ${unit.type}`);
        }
      }),
    );
  }

  /**
   * Update an administrative unit
   */
  updateUnit(
    code: string,
    type: AdminUnitType,
    unit: Partial<AdministrativeUnit>,
  ): Observable<AdministrativeUnit> {
    let endpoint = '';
    switch (type) {
      case AdminUnitType.PROVINCE:
        endpoint = `${this.apiUrl}/provinces/${code}`;
        break;
      case AdminUnitType.DISTRICT:
        endpoint = `${this.apiUrl}/districts/${code}`;
        break;
      case AdminUnitType.WARD:
        endpoint = `${this.apiUrl}/wards/${code}`;
        break;
      default:
        throw new Error(`Unknown admin unit type: ${type}`);
    }

    return this.http.patch<any>(endpoint, unit).pipe(
      map((response) => {
        const unwrapped = unwrap<any>(response);
        const item = unwrapped.item;

        switch (type) {
          case AdminUnitType.PROVINCE:
            return provinceToAdminUnit(item as Province);
          case AdminUnitType.DISTRICT:
            return districtToAdminUnit(item as District);
          case AdminUnitType.WARD:
            return wardToAdminUnit(item as Ward);
          default:
            throw new Error(`Unknown admin unit type: ${type}`);
        }
      }),
    );
  }

  /**
   * Delete an administrative unit
   */
  deleteUnit(code: string, type: AdminUnitType): Observable<void> {
    let endpoint = '';
    switch (type) {
      case AdminUnitType.PROVINCE:
        endpoint = `${this.apiUrl}/provinces/${code}`;
        break;
      case AdminUnitType.DISTRICT:
        endpoint = `${this.apiUrl}/districts/${code}`;
        break;
      case AdminUnitType.WARD:
        endpoint = `${this.apiUrl}/wards/${code}`;
        break;
      default:
        throw new Error(`Unknown admin unit type: ${type}`);
    }

    return this.http.delete<any>(endpoint).pipe(map(() => undefined));
  }

  /**
   * Get all provinces for dropdown
   */
  getAllProvinces(): Observable<Province[]> {
    const params = new HttpParams().set('limit', '1000');
    return this.http.get<any>(`${this.apiUrl}/provinces`, { params }).pipe(
      map((response) => {
        const unwrapped = unwrap<any>(response);
        return unwrapped.items as Province[];
      }),
    );
  }

  /**
   * Get all districts for a province (for dropdown)
   */
  getDistrictsByProvinceCode(provinceCode: string): Observable<District[]> {
    const params = new HttpParams().set('provinceCode', provinceCode).set('limit', '1000');

    return this.http.get<any>(`${this.apiUrl}/districts`, { params }).pipe(
      map((response) => {
        const unwrapped = unwrap<any>(response);
        return unwrapped.items as District[];
      }),
    );
  }
}
