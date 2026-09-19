import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { buildQuery } from '../utils/query.util';
import {
  ApiResponse,
  Branch,
  BranchAssignment,
  DepartmentNode,
  ListData,
  Membership,
  ResponseKey
} from '@shared';

export interface BranchPayload {
  code: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface DepartmentPayload {
  code: string;
  name: string;
  branch_id?: string | null;
  parent_id?: string | null;
  manager_user_id?: string | null;
}

export interface MembershipPayload {
  user_id: string;
  branch_id: string;
  department_id: string;
  direct_manager_user_id?: string | null;
  title?: string;
  is_primary?: boolean;
}

export interface BranchAssignmentPayload {
  user_id: string;
  branch_id: string;
  is_primary: boolean;
  can_manage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private api = inject(ApiService);

  getBranches(): Observable<ApiResponse<ListData<Branch>>> {
    return this.api.get<ListData<Branch>>('/api/v1/organization/branches');
  }

  createBranch(payload: BranchPayload): Observable<ApiResponse<Branch>> {
    return this.api.post<Branch>('/api/v1/organization/branches', {
      [ResponseKey.CODE]: payload.code,
      [ResponseKey.NAME]: payload.name,
      [ResponseKey.PHONE]: payload.phone || null,
      [ResponseKey.ADDRESS]: payload.address || null
    });
  }

  updateBranch(branchId: string, payload: BranchPayload): Observable<ApiResponse<Branch>> {
    return this.api.put<Branch>(`/api/v1/organization/branches/${branchId}`, {
      [ResponseKey.CODE]: payload.code,
      [ResponseKey.NAME]: payload.name,
      [ResponseKey.PHONE]: payload.phone || null,
      [ResponseKey.ADDRESS]: payload.address || null
    });
  }

  deleteBranch(branchId: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/organization/branches/${branchId}`);
  }

  getDepartmentTree(): Observable<ApiResponse<ListData<DepartmentNode>>> {
    return this.api.get<ListData<DepartmentNode>>('/api/v1/organization/departments/tree');
  }

  createDepartment(payload: DepartmentPayload): Observable<ApiResponse<DepartmentNode>> {
    return this.api.post<DepartmentNode>('/api/v1/organization/departments', {
      [ResponseKey.CODE]: payload.code,
      [ResponseKey.NAME]: payload.name,
      [ResponseKey.BRANCH_ID]: payload.branch_id || null,
      [ResponseKey.PARENT_ID]: payload.parent_id || null,
      [ResponseKey.MANAGER_USER_ID]: payload.manager_user_id || null
    });
  }

  updateDepartment(departmentId: string, payload: DepartmentPayload): Observable<ApiResponse<DepartmentNode>> {
    return this.api.put<DepartmentNode>(`/api/v1/organization/departments/${departmentId}`, {
      [ResponseKey.CODE]: payload.code,
      [ResponseKey.NAME]: payload.name,
      [ResponseKey.BRANCH_ID]: payload.branch_id || null,
      [ResponseKey.PARENT_ID]: payload.parent_id || null,
      [ResponseKey.MANAGER_USER_ID]: payload.manager_user_id || null
    });
  }

  deleteDepartment(departmentId: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/organization/departments/${departmentId}`);
  }

  moveDepartment(departmentId: string, newParentId: string | null): Observable<ApiResponse<DepartmentNode>> {
    return this.api.put<DepartmentNode>(`/api/v1/organization/departments/${departmentId}/move`, {
      [ResponseKey.NEW_PARENT_ID]: newParentId || null
    });
  }

  getMemberships(query?: { user_id?: string; branch_id?: string; department_id?: string }): Observable<ApiResponse<ListData<Membership>>> {
    return this.api.get<ListData<Membership>>(`/api/v1/organization/memberships${buildQuery(query || {})}`);
  }

  createMembership(payload: MembershipPayload): Observable<ApiResponse<Membership>> {
    return this.api.post<Membership>('/api/v1/organization/memberships', {
      [ResponseKey.USER_ID]: payload.user_id,
      [ResponseKey.BRANCH_ID]: payload.branch_id,
      [ResponseKey.DEPARTMENT_ID]: payload.department_id,
      [ResponseKey.DIRECT_MANAGER_USER_ID]: payload.direct_manager_user_id || null,
      [ResponseKey.TITLE]: payload.title || null,
      [ResponseKey.IS_PRIMARY]: payload.is_primary ?? true
    });
  }

  updateMembership(membershipId: string, payload: MembershipPayload): Observable<ApiResponse<Membership>> {
    return this.api.put<Membership>(`/api/v1/organization/memberships/${membershipId}`, {
      [ResponseKey.USER_ID]: payload.user_id,
      [ResponseKey.BRANCH_ID]: payload.branch_id,
      [ResponseKey.DEPARTMENT_ID]: payload.department_id,
      [ResponseKey.DIRECT_MANAGER_USER_ID]: payload.direct_manager_user_id || null,
      [ResponseKey.TITLE]: payload.title || null,
      [ResponseKey.IS_PRIMARY]: payload.is_primary ?? true
    });
  }

  deleteMembership(membershipId: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/organization/memberships/${membershipId}`);
  }

  getBranchAssignments(query?: { user_id?: string; branch_id?: string }): Observable<ApiResponse<ListData<BranchAssignment>>> {
    return this.api.get<ListData<BranchAssignment>>(`/api/v1/organization/branch-assignments${buildQuery(query || {})}`);
  }

  createBranchAssignment(payload: BranchAssignmentPayload): Observable<ApiResponse<BranchAssignment>> {
    return this.api.post<BranchAssignment>('/api/v1/organization/branch-assignments', {
      [ResponseKey.USER_ID]: payload.user_id,
      [ResponseKey.BRANCH_ID]: payload.branch_id,
      [ResponseKey.IS_PRIMARY]: payload.is_primary,
      [ResponseKey.CAN_MANAGE]: payload.can_manage
    });
  }

  updateBranchAssignment(assignmentId: string, payload: Partial<BranchAssignmentPayload>): Observable<ApiResponse<BranchAssignment>> {
    return this.api.put<BranchAssignment>(`/api/v1/organization/branch-assignments/${assignmentId}`, {
      [ResponseKey.IS_PRIMARY]: payload.is_primary,
      [ResponseKey.CAN_MANAGE]: payload.can_manage
    });
  }

  deleteBranchAssignment(assignmentId: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/organization/branch-assignments/${assignmentId}`);
  }
}
