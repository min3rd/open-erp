import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, Branch, DepartmentNode, ListData, Membership } from '@shared';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private api = inject(ApiService);

  getBranches(): Observable<ApiResponse<ListData<Branch>>> {
    return this.api.get<ListData<Branch>>('/api/v1/organization/branches');
  }

  getDepartmentTree(): Observable<ApiResponse<ListData<DepartmentNode>>> {
    return this.api.get<ListData<DepartmentNode>>('/api/v1/organization/departments/tree');
  }

  getMemberships(): Observable<ApiResponse<ListData<Membership>>> {
    return this.api.get<ListData<Membership>>('/api/v1/organization/memberships');
  }
}
