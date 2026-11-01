import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import {
  API_BASE_URL,
  ApiResponse,
  ApiService,
  Branch,
  BranchAssignment,
  DepartmentNode,
  ListData,
  Membership,
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
  is_primary?: boolean;
}

export interface BranchAccessPayload {
  user_id: string;
  branch_id: string;
  is_primary: boolean;
  can_manage: boolean;
}

export interface OrgUser {
  user_id: string;
  email: string;
  full_name?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class OrgService {
  private api = inject(ApiService);
  private staticBase = inject(API_BASE_URL);
  private runtimeOrigin = signal('');

  setRuntimeOrigin(origin: string): void {
    this.runtimeOrigin.set((origin ?? '').replace(/\/$/, ''));
  }

  private url(path: string): string {
    const prefix = this.staticBase || (this.runtimeOrigin() + '/api/v1/plugins/runtime/org-structure');
    return `${prefix}${path}`;
  }

  users(): Observable<ApiResponse<ListData<OrgUser>>> {
    return this.api.get<ListData<OrgUser>>('/api/v1/iam/users?size=200');
  }

  getBranches(): Observable<ApiResponse<ListData<Branch>>> {
    return this.api.get<ListData<Branch>>(this.url('/api/v1/org/branches'));
  }

  createBranch(payload: BranchPayload): Observable<ApiResponse<Branch>> {
    return this.api.post<Branch>(this.url('/api/v1/org/branches'), payload);
  }

  updateBranch(branchId: string, payload: BranchPayload): Observable<ApiResponse<Branch>> {
    return this.api.put<Branch>(this.url(`/api/v1/org/branches/${branchId}`), payload);
  }

  deleteBranch(branchId: string): Observable<ApiResponse<unknown>> {
    return this.api.delete<unknown>(this.url(`/api/v1/org/branches/${branchId}`));
  }

  getDepartmentTree(): Observable<ApiResponse<ListData<DepartmentNode>>> {
    return forkJoin({
      departments: this.api.get<ListData<DepartmentNode>>(this.url('/api/v1/org/departments')),
      branches: this.getBranches(),
      users: this.users().pipe(catchError(() => of({ success: true, code: 'OK', data: { items: [] } }))),
    }).pipe(map(({ departments, branches, users }) => {
      const branchNames = new Map((branches.data?.items ?? []).map((item) => [item.id, item.name]));
      const userNames = new Map((users.data?.items ?? []).map((item) => [item.user_id, item.full_name || item.email]));
      const nodes = new Map<string, DepartmentNode>();
      for (const item of departments.data?.items ?? []) {
        nodes.set(item.id, {
          ...item,
          branch_name: item.branch_id ? branchNames.get(item.branch_id) ?? null : null,
          manager_name: item.manager_user_id ? userNames.get(item.manager_user_id) ?? null : null,
          children: [],
        });
      }
      const roots: DepartmentNode[] = [];
      for (const node of nodes.values()) {
        const parent = node.parent_id ? nodes.get(node.parent_id) : null;
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
      return { success: true, data: { items: roots } } as ApiResponse<ListData<DepartmentNode>>;
    }));
  }

  createDepartment(payload: DepartmentPayload): Observable<ApiResponse<DepartmentNode>> {
    return this.api.post<DepartmentNode>(this.url('/api/v1/org/departments'), payload);
  }

  updateDepartment(departmentId: string, payload: DepartmentPayload): Observable<ApiResponse<DepartmentNode>> {
    return this.api.put<DepartmentNode>(this.url(`/api/v1/org/departments/${departmentId}`), payload);
  }

  deleteDepartment(departmentId: string): Observable<ApiResponse<unknown>> {
    return this.api.delete<unknown>(this.url(`/api/v1/org/departments/${departmentId}`));
  }

  getMemberships(query?: { user_id?: string; branch_id?: string; department_id?: string }): Observable<ApiResponse<ListData<Membership>>> {
    return forkJoin({
      memberships: this.api.get<ListData<Membership>>(this.url('/api/v1/org/memberships?all=true')),
      users: this.users().pipe(catchError(() => of({ success: true, code: 'OK', data: { items: [] } }))),
      branches: this.getBranches(),
      departments: this.api.get<ListData<DepartmentNode>>(this.url('/api/v1/org/departments')),
    }).pipe(map(({ memberships, users, branches, departments }) => {
      const userById = new Map((users.data?.items ?? []).map((item) => [item.user_id, item]));
      const branchById = new Map((branches.data?.items ?? []).map((item) => [item.id, item]));
      const departmentById = new Map((departments.data?.items ?? []).map((item) => [item.id, item]));
      const items = (memberships.data?.items ?? [])
        .filter((item) => !query?.user_id || item.user_id === query.user_id)
        .filter((item) => !query?.branch_id || item.branch_id === query.branch_id)
        .filter((item) => !query?.department_id || item.department_id === query.department_id)
        .map((item) => {
          const user = userById.get(item.user_id);
          return {
            ...item,
            user_email: user?.email ?? null,
            user_full_name: user?.full_name ?? null,
            branch_name: item.branch_id ? branchById.get(item.branch_id)?.name ?? null : null,
            department_name: item.department_id ? departmentById.get(item.department_id)?.name ?? null : null,
          };
        });
      return { success: true, data: { items } } as ApiResponse<ListData<Membership>>;
    }));
  }

  createMembership(payload: MembershipPayload): Observable<ApiResponse<Membership>> {
    return this.api.post<Membership>(this.url('/api/v1/org/memberships'), payload);
  }

  updateMembership(membershipId: string, payload: MembershipPayload): Observable<ApiResponse<Membership>> {
    return this.api.put<Membership>(this.url(`/api/v1/org/memberships/${membershipId}`), payload);
  }

  deleteMembership(membershipId: string): Observable<ApiResponse<unknown>> {
    return this.api.delete<unknown>(this.url(`/api/v1/org/memberships/${membershipId}`));
  }

  getBranchAssignments(): Observable<ApiResponse<ListData<BranchAssignment>>> {
    return forkJoin({
      access: this.api.get<ListData<BranchAssignment>>(this.url('/api/v1/org/branch-access?all=true')),
      users: this.users().pipe(catchError(() => of({ success: true, code: 'OK', data: { items: [] } }))),
      branches: this.getBranches(),
    }).pipe(map(({ access, users, branches }) => {
      const userById = new Map((users.data?.items ?? []).map((item) => [item.user_id, item]));
      const branchById = new Map((branches.data?.items ?? []).map((item) => [item.id, item]));
      const items = (access.data?.items ?? []).map((item) => ({
        ...item,
        user_email: userById.get(item.user_id)?.email ?? null,
        branch_code: item.branch_id ? branchById.get(item.branch_id)?.code ?? null : null,
      }));
      return { success: true, data: { items } } as ApiResponse<ListData<BranchAssignment>>;
    }));
  }

  createBranchAssignment(payload: BranchAccessPayload): Observable<ApiResponse<BranchAssignment>> {
    return this.api.post<BranchAssignment>(this.url('/api/v1/org/branch-access'), payload);
  }

  updateBranchAssignment(assignmentId: string, payload: BranchAccessPayload): Observable<ApiResponse<BranchAssignment>> {
    return this.api.put<BranchAssignment>(this.url(`/api/v1/org/branch-access/${assignmentId}`), payload);
  }

  deleteBranchAssignment(assignmentId: string): Observable<ApiResponse<unknown>> {
    return this.api.delete<unknown>(this.url(`/api/v1/org/branch-access/${assignmentId}`));
  }
}
