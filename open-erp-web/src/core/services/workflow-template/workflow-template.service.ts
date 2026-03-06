import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_APPROVAL } from '../../constant';
import { ApiPaginatedResponse, ApiResponse, ApiSingleResponse } from '../../api/interfaces';
import {
  WorkflowTemplate,
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  CloneWorkflowTemplateDto,
  QueryWorkflowTemplateParams,
  WorkflowValidationResult,
  WorkflowNode,
  WorkflowEdge,
} from './workflow-template.types';

export type {
  WorkflowTemplate,
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  CloneWorkflowTemplateDto,
  QueryWorkflowTemplateParams,
  WorkflowValidationResult,
  WorkflowNode,
  WorkflowEdge,
  WorkflowTemplateListResponse,
} from './workflow-template.types';

export {
  ApprovalScope,
  ApprovalMode,
  TemplateStatus,
  WorkflowNodeType,
} from './workflow-template.types';

/**
 * Workflow Template service - handles all workflow template API calls
 * Backend controller: apps/approval-flow/src/controllers/workflow-template.controller.ts
 */
@Injectable({
  providedIn: 'root',
})
export class WorkflowTemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_APPROVAL}/v1/approval-flow/templates`;

  /**
   * List workflow templates with filtering and pagination
   * GET /approval-flow/templates
   */
  getTemplates(
    params: QueryWorkflowTemplateParams,
  ): Observable<{ items: WorkflowTemplate[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.scope) httpParams = httpParams.set('scope', params.scope);
    if (params.entityType) httpParams = httpParams.set('entityType', params.entityType);
    if (params.orgId) httpParams = httpParams.set('orgId', params.orgId);
    if (params.departmentId) httpParams = httpParams.set('departmentId', params.departmentId);
    if (params.sortField) httpParams = httpParams.set('sortField', params.sortField);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);

    return this.http
      .get<ApiPaginatedResponse<WorkflowTemplate>>(this.baseUrl, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
        })),
      );
  }

  /**
   * Get a workflow template by ID
   * GET /approval-flow/templates/:id
   */
  getTemplateById(id: string): Observable<WorkflowTemplate | null> {
    return this.http
      .get<ApiSingleResponse<WorkflowTemplate>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data?.item || null));
  }

  /**
   * Create a new workflow template
   * POST /approval-flow/templates
   */
  createTemplate(dto: CreateWorkflowTemplateDto): Observable<WorkflowTemplate> {
    return this.http.post<ApiSingleResponse<WorkflowTemplate>>(this.baseUrl, dto).pipe(
      map((response) => {
        if (!response.data?.item) {
          throw new Error('No data returned from API');
        }
        return response.data.item;
      }),
    );
  }

  /**
   * Update a workflow template
   * PUT /approval-flow/templates/:id
   */
  updateTemplate(id: string, dto: UpdateWorkflowTemplateDto): Observable<WorkflowTemplate> {
    return this.http.put<ApiSingleResponse<WorkflowTemplate>>(`${this.baseUrl}/${id}`, dto).pipe(
      map((response) => {
        if (!response.data?.item) {
          throw new Error('No data returned from API');
        }
        return response.data.item;
      }),
    );
  }

  /**
   * Change workflow template status
   * PATCH /approval-flow/templates/:id/status
   */
  changeStatus(id: string, status: string): Observable<WorkflowTemplate> {
    return this.http
      .patch<ApiSingleResponse<WorkflowTemplate>>(`${this.baseUrl}/${id}/status`, { status })
      .pipe(
        map((response) => {
          if (!response.data?.item) {
            throw new Error('No data returned from API');
          }
          return response.data.item;
        }),
      );
  }

  /**
   * Clone a workflow template
   * POST /approval-flow/templates/:id/clone
   */
  cloneTemplate(id: string, dto: CloneWorkflowTemplateDto): Observable<WorkflowTemplate> {
    return this.http
      .post<ApiSingleResponse<WorkflowTemplate>>(`${this.baseUrl}/${id}/clone`, dto)
      .pipe(
        map((response) => {
          if (!response.data?.item) {
            throw new Error('No data returned from API');
          }
          return response.data.item;
        }),
      );
  }

  /**
   * Delete a workflow template (soft delete)
   * DELETE /approval-flow/templates/:id
   */
  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`).pipe(map(() => undefined));
  }

  /**
   * Validate workflow graph and rules
   * POST /approval-flow/templates/validate
   */
  validateWorkflow(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
  ): Observable<WorkflowValidationResult> {
    return this.http
      .post<ApiResponse<WorkflowValidationResult>>(`${this.baseUrl}/validate`, { nodes, edges })
      .pipe(
        map((response) => response.data || { valid: false, errors: ['Unknown error'] }),
      );
  }

  /**
   * Publish a workflow template
   * POST /approval-flow/templates/:id/publish
   */
  publishTemplate(id: string): Observable<WorkflowTemplate> {
    return this.http
      .post<ApiSingleResponse<WorkflowTemplate>>(`${this.baseUrl}/${id}/publish`, {})
      .pipe(
        map((response) => {
          if (!response.data?.item) {
            throw new Error('No data returned from API');
          }
          return response.data.item;
        }),
      );
  }

  /**
   * Archive a workflow template
   * POST /approval-flow/templates/:id/archive
   */
  archiveTemplate(id: string): Observable<WorkflowTemplate> {
    return this.http
      .post<ApiSingleResponse<WorkflowTemplate>>(`${this.baseUrl}/${id}/archive`, {})
      .pipe(
        map((response) => {
          if (!response.data?.item) {
            throw new Error('No data returned from API');
          }
          return response.data.item;
        }),
      );
  }
}
