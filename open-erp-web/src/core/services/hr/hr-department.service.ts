import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URI_HR } from '../../constant';

@Injectable({
  providedIn: 'root',
})
export class HrDepartmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_HR}/api/v1/hr/departments`;

  getAll(params?: Record<string, any>): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<any>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
