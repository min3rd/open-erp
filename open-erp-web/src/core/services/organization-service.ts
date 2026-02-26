import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_URI_ORGANIZATION } from '../constant';
import { ApiResponse, ApiSingleResponse, isApiResponse, unwrap, wrapSuccess } from '../api';

export interface VietQRBusinessResponse {
  code: string;
  desc: string;
  data: {
    id: string;
    name: string;
    internationalName: string;
    shortName: string;
    address: string;
    status: string;
  };
}

export type OrganizationType = 'holding' | 'company' | 'joint-venture' | 'partner' | 'branch';
export type OrganizationStatus = 'active' | 'inactive' | 'pending';

export interface CreateOrganizationDto {
  taxId: string;
  name: string;
  internationalName: string;
  headquartersAddress: string;
  legalRepresentative: string;
  contactPhone: string;
  contactEmail: string;
  foundedDate: string;
  businessActivities?: string[];
  type: OrganizationType;
  status?: OrganizationStatus;
  country: string;
  description?: string;
  website?: string;
}

export interface OrganizationResponse {
  id: string;
  taxId: string;
  name: string;
  internationalName: string;
  headquartersAddress: string;
  legalRepresentative: string;
  contactPhone: string;
  contactEmail: string;
  foundedDate: string;
  businessActivities?: string[];
  type: OrganizationType;
  status: OrganizationStatus;
  country: string;
  description?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationDto {
  taxId?: string;
  name?: string;
  internationalName?: string;
  headquartersAddress?: string;
  legalRepresentative?: string;
  contactPhone?: string;
  contactEmail?: string;
  foundedDate?: string;
  businessActivities?: string[];
  type?: OrganizationType;
  status?: OrganizationStatus;
  country?: string;
  description?: string;
  website?: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  name: string;
  avatar?: string | null;
  role: string;
  roles: string[];
  status: 'active' | 'pending' | 'inactive' | 'invited' | 'suspended' | 'revoked';
  joinedAt: string;
  departments: OrgDepartment[];
  positions: OrgPosition[];
  assignments: OrgMemberAssignment[];
  isPrimaryOwner: boolean;
}

export interface OrgDepartment {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  status: string;
}

export interface OrgPosition {
  id: string;
  name: string;
  code: string;
  description?: string;
  level?: number;
  status: string;
}

export interface OrgMemberAssignment {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  positionIds: {
    id: string;
    name: string;
    code: string;
    level: number;
  }[];
}

export interface AssignMemberDto {
  assignments: {
    departmentId: string;
    positionIds?: string[];
  }[];
}

export interface MembersQueryParams {
  page?: number;
  size?: number;
  q?: string;
  department?: string;
  position?: string;
  role?: string;
  status?: string;
  sort?: string;
}

export interface OrganizationRelation {
  id: string;
  relatedOrganizationId: string;
  relatedOrganization: {
    id: string;
    name: string;
    internationalName: string;
    taxId: string;
  };
  relationType: 'subsidiary' | 'parent' | 'partner' | 'joint_venture';
  sharePercentage?: number;
  establishedDate?: string;
}

export interface OrganizationEvent {
  id: string;
  type: string;
  description: string;
  userId?: string;
  username?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface InviteMemberDto {
  email: string;
  role: string;
}

export interface InvitationRecipient {
  userId?: string;
  email?: string;
}

export interface BulkInviteMembersDto {
  recipients: InvitationRecipient[];
  roles?: string[];
  expiresAt?: string;
  expiryDays?: number;
  message?: string;
}

export interface InvitationResult {
  recipient: string;
  status: 'success' | 'skipped' | 'error';
  reason?: string;
  token?: string;
  invitationId?: string;
}

export interface BulkInviteResponse {
  results: InvitationResult[];
  total: number;
  success: number;
  skipped: number;
  failed: number;
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'revoked';

export interface InvitedByUser {
  id?: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  inviteeEmail?: string;
  inviteeUserId?: string;
  roles: string[];
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  message?: string;
  invitedBy: InvitedByUser | string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private httpClient = inject(HttpClient);
  private readonly VIETQR_API_URL = 'https://api.vietqr.io/v2/business';

  /**
   * Look up business information by tax ID using VietQR API
   */
  lookupBusinessByTaxId(taxId: string): Observable<VietQRBusinessResponse | null> {
    return this.httpClient.get<VietQRBusinessResponse>(`${this.VIETQR_API_URL}/${taxId}`).pipe(
      map((response) => {
        if (response.code === '00') {
          return response;
        }
        return null;
      }),
      catchError((error) => {
        console.error('VietQR API error:', error);
        return of(null);
      }),
    );
  }

  /**
   * Create a new organization
   */
  createOrganization(
    dto: CreateOrganizationDto,
    version: string = 'v1',
  ): Observable<OrganizationResponse> {
    return this.httpClient
      .post<
        ApiSingleResponse<OrganizationResponse> | OrganizationResponse
      >(`${API_URI_ORGANIZATION}/${version}/organizations`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response as ApiSingleResponse<OrganizationResponse>);
            return data.item!;
          }
          // Legacy format
          console.warn(
            'OrganizationService: Received legacy response format for createOrganization',
          );
          return response as OrganizationResponse;
        }),
      );
  }

  /**
   * Get organization by ID
   */
  getOrganization(id: string, version: string = 'v1'): Observable<OrganizationResponse> {
    return this.httpClient
      .get<
        ApiSingleResponse<OrganizationResponse> | OrganizationResponse
      >(`${API_URI_ORGANIZATION}/${version}/organizations/${id}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response as ApiSingleResponse<OrganizationResponse>);
            return data.item!;
          }
          // Legacy format
          console.warn('OrganizationService: Received legacy response format for getOrganization');
          return response as OrganizationResponse;
        }),
      );
  }

  /**
   * Update organization
   */
  updateOrganization(
    id: string,
    dto: UpdateOrganizationDto,
    version: string = 'v1',
  ): Observable<OrganizationResponse> {
    return this.httpClient
      .patch<
        ApiSingleResponse<OrganizationResponse> | OrganizationResponse
      >(`${API_URI_ORGANIZATION}/${version}/organizations/${id}`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response as ApiSingleResponse<OrganizationResponse>);
            return data.item!;
          }
          // Legacy format
          console.warn(
            'OrganizationService: Received legacy response format for updateOrganization',
          );
          return response as OrganizationResponse;
        }),
      );
  }

  /**
   * Get organization members
   */
  getOrganizationMembers(
    id: string,
    page: number = 1,
    limit: number = 10,
    params?: MembersQueryParams,
    version: string = 'v1',
  ): Observable<{ data: OrganizationMember[]; total: number; page: number; limit: number; items?: OrganizationMember[] }> {
    const httpParams: Record<string, string> = {
      page: (params?.page ?? page).toString(),
      size: (params?.size ?? limit).toString(),
    };
    if (params?.q) httpParams['q'] = params.q;
    if (params?.department) httpParams['department'] = params.department;
    if (params?.position) httpParams['position'] = params.position;
    if (params?.role) httpParams['role'] = params.role;
    if (params?.status) httpParams['status'] = params.status;
    if (params?.sort) httpParams['sort'] = params.sort;

    return this.httpClient
      .get<any>(`${API_URI_ORGANIZATION}/${version}/organizations/${id}/members`, {
        params: httpParams,
      })
      .pipe(
        map((response) => {
          // Handle both paginated and legacy formats
          if (response?.data?.items) {
            return {
              data: response.data.items,
              items: response.data.items,
              total: response.data.total ?? 0,
              page: response.data.page ?? page,
              limit: response.data.limit ?? limit,
            };
          }
          if (Array.isArray(response?.data)) {
            return { data: response.data, total: response.total ?? 0, page, limit };
          }
          return { data: [], total: 0, page, limit };
        }),
      );
  }

  /**
   * Get departments for an organization
   */
  getDepartments(orgId: string, version: string = 'v1'): Observable<OrgDepartment[]> {
    return this.httpClient
      .get<any>(`${API_URI_ORGANIZATION}/${version}/organizations/${orgId}/departments`)
      .pipe(map((r) => r?.data ?? r ?? []));
  }

  /**
   * Create a department
   */
  createDepartment(
    orgId: string,
    dto: { name: string; code: string; description?: string; parentId?: string },
    version: string = 'v1',
  ): Observable<OrgDepartment> {
    return this.httpClient
      .post<any>(`${API_URI_ORGANIZATION}/${version}/organizations/${orgId}/departments`, dto)
      .pipe(map((r) => r?.data?.item ?? r?.data ?? r));
  }

  /**
   * Update a department
   */
  updateDepartment(
    orgId: string,
    deptId: string,
    dto: Partial<{ name: string; code: string; description: string; status: string }>,
    version: string = 'v1',
  ): Observable<OrgDepartment> {
    return this.httpClient
      .patch<any>(
        `${API_URI_ORGANIZATION}/${version}/organizations/${orgId}/departments/${deptId}`,
        dto,
      )
      .pipe(map((r) => r?.data?.item ?? r?.data ?? r));
  }

  /**
   * Delete a department
   */
  deleteDepartment(orgId: string, deptId: string, version: string = 'v1'): Observable<void> {
    return this.httpClient.delete<void>(
      `${API_URI_ORGANIZATION}/${version}/organizations/${orgId}/departments/${deptId}`,
    );
  }

  /**
   * Get positions for an organization
   */
  getPositions(orgId: string, version: string = 'v1'): Observable<OrgPosition[]> {
    return this.httpClient
      .get<any>(`${API_URI_ORGANIZATION}/${version}/organizations/${orgId}/positions`)
      .pipe(map((r) => r?.data ?? r ?? []));
  }

  /**
   * Create a position
   */
  createPosition(
    orgId: string,
    dto: { name: string; code: string; description?: string; level?: number },
    version: string = 'v1',
  ): Observable<OrgPosition> {
    return this.httpClient
      .post<any>(`${API_URI_ORGANIZATION}/${version}/organizations/${orgId}/positions`, dto)
      .pipe(map((r) => r?.data?.item ?? r?.data ?? r));
  }

  /**
   * Update a position
   */
  updatePosition(
    orgId: string,
    posId: string,
    dto: Partial<{ name: string; code: string; description: string; level: number; status: string }>,
    version: string = 'v1',
  ): Observable<OrgPosition> {
    return this.httpClient
      .patch<any>(
        `${API_URI_ORGANIZATION}/${version}/organizations/${orgId}/positions/${posId}`,
        dto,
      )
      .pipe(map((r) => r?.data?.item ?? r?.data ?? r));
  }

  /**
   * Delete a position
   */
  deletePosition(orgId: string, posId: string, version: string = 'v1'): Observable<void> {
    return this.httpClient.delete<void>(
      `${API_URI_ORGANIZATION}/${version}/organizations/${orgId}/positions/${posId}`,
    );
  }

  /**
   * Assign departments and positions to a member
   */
  assignMember(
    orgId: string,
    memberId: string,
    dto: AssignMemberDto,
    version: string = 'v1',
  ): Observable<OrganizationMember> {
    return this.httpClient
      .post<any>(
        `${API_URI_ORGANIZATION}/${version}/organizations/${orgId}/members/${memberId}/assign`,
        dto,
      )
      .pipe(map((r) => r?.data?.item ?? r?.data ?? r));
  }

  /**
   * Get organization relations
   */
  getOrganizationRelations(id: string, version: string = 'v1'): Observable<OrganizationRelation[]> {
    return this.httpClient.get<OrganizationRelation[]>(
      `${API_URI_ORGANIZATION}/${version}/organizations/${id}/relations`,
    );
  }

  /**
   * Get organization events/activity log
   */
  getOrganizationEvents(
    id: string,
    page: number = 1,
    limit: number = 20,
    version: string = 'v1',
  ): Observable<{ data: OrganizationEvent[]; total: number; page: number; limit: number }> {
    return this.httpClient.get<{
      data: OrganizationEvent[];
      total: number;
      page: number;
      limit: number;
    }>(`${API_URI_ORGANIZATION}/${version}/organizations/${id}/events`, {
      params: { page: page.toString(), limit: limit.toString() },
    });
  }

  /**
   * Invite member to organization
   */
  inviteMember(
    id: string,
    dto: InviteMemberDto,
    version: string = 'v1',
  ): Observable<OrganizationMember> {
    return this.httpClient.post<OrganizationMember>(
      `${API_URI_ORGANIZATION}/${version}/organizations/${id}/members/invite`,
      dto,
    );
  }

  /**
   * Bulk invite members to organization
   */
  bulkInviteMembers(
    organizationId: string,
    dto: BulkInviteMembersDto,
    version: string = 'v1',
  ): Observable<BulkInviteResponse> {
    return this.httpClient
      .post<
        ApiSingleResponse<BulkInviteResponse> | BulkInviteResponse
      >(`${API_URI_ORGANIZATION}/${version}/invitations/organizations/${organizationId}/bulk`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response as ApiSingleResponse<BulkInviteResponse>);
            return data.item!;
          }
          return response as BulkInviteResponse;
        }),
      );
  }

  /**
   * Remove member from organization
   */
  removeMember(organizationId: string, memberId: string, version: string = 'v1'): Observable<void> {
    return this.httpClient.delete<void>(
      `${API_URI_ORGANIZATION}/${version}/organizations/${organizationId}/members/${memberId}`,
    );
  }

  /**
   * Get organizations that the current user belongs to
   */
  getUserOrganizations(version: string = 'v1'): Observable<OrganizationResponse[]> {
    return this.httpClient
      .get<
        ApiResponse<OrganizationResponse[]> | OrganizationResponse[]
      >(`${API_URI_ORGANIZATION}/${version}/organizations`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response as ApiResponse<OrganizationResponse[]>);
          }
          // Legacy format
          console.warn(
            'OrganizationService: Received legacy response format for getUserOrganizations',
          );
          return response as OrganizationResponse[];
        }),
      );
  }

  /**
   * Get invitations for an organization
   */
  getOrganizationInvitations(
    organizationId: string,
    params?: { status?: InvitationStatus; page?: number; limit?: number; query?: string },
    version: string = 'v1',
  ): Observable<{ data: OrganizationInvitation[]; total: number }> {
    const httpParams: Record<string, string> = {};
    if (params?.status) httpParams['status'] = params.status;
    if (params?.page) httpParams['page'] = params.page.toString();
    if (params?.limit) httpParams['limit'] = params.limit.toString();
    if (params?.query) httpParams['query'] = params.query;

    return this.httpClient
      .get<
        | ApiSingleResponse<{ data: OrganizationInvitation[]; total: number }>
        | { data: OrganizationInvitation[]; total: number }
      >(`${API_URI_ORGANIZATION}/${version}/invitations/organizations/${organizationId}`, { params: httpParams })
      .pipe(
        map((response) => {
          return response.data as any;
        }),
      );
  }

  /**
   * Revoke an invitation
   */
  revokeInvitation(invitationId: string, version: string = 'v1'): Observable<void> {
    return this.httpClient.delete<void>(
      `${API_URI_ORGANIZATION}/${version}/invitations/${invitationId}`,
    );
  }

  /**
   * Accept an invitation using the invitation token
   */
  acceptInvitation(token: string, version: string = 'v1'): Observable<any> {
    return this.httpClient
      .post<any>(`${API_URI_ORGANIZATION}/${version}/invitations/accept`, { token })
      .pipe(map((response) => response?.data ?? response));
  }
}
